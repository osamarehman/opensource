#!/usr/bin/env python3
"""
Enhanced main scraper application with enterprise features
"""
import os
import sys
import logging
import asyncio
import signal
import schedule
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

# Third-party imports
import psutil
import aiohttp
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Local imports
from .models import RFPOpportunity, ScrapeSession, SystemMetric
from .config_manager import ConfigManager
from .circuit_breaker import CircuitBreaker
from ..database.database_manager import DatabaseManager
from ..notifications.notification_manager import NotificationManager
from ..monitoring.metrics_collector import MetricsCollector
from ..plugins.plugin_manager import PluginManager

# Metrics
SCRAPE_COUNTER = Counter('rfp_scrapes_total', 'Total RFP scrapes', ['status'])
SCRAPE_DURATION = Histogram('rfp_scrape_duration_seconds', 'Time spent scraping')
OPPORTUNITIES_FOUND = Gauge('rfp_opportunities_current', 'Current opportunities found')
SYSTEM_HEALTH = Gauge('rfp_system_health', 'System health status (1=healthy, 0=unhealthy)')


class RFPScraperEnhanced:
    """Enhanced main scraper class with enterprise features"""

    def __init__(self, config_path: Optional[str] = None):
        self.base_dir = Path(__file__).parent.parent.parent
        if config_path is None:
            config_path = self.base_dir / "config" / "config.yaml"

        self.config_manager = ConfigManager(config_path)
        self.config = self.config_manager.load_config()

        self.setup_logging()
        self.db_manager = DatabaseManager(self.config['database']['path'])
        self.plugin_manager = PluginManager(self.base_dir / "plugins")
        self.notification_manager = NotificationManager(self.config)
        self.metrics_collector = MetricsCollector(self.db_manager)

        self.circuit_breaker = CircuitBreaker()
        self.running = True

        # Start metrics server
        if self.config.get('monitoring', {}).get('metrics_port'):
            start_http_server(self.config['monitoring']['metrics_port'])

        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)

    def setup_logging(self):
        """Enhanced logging configuration"""
        log_dir = self.base_dir / "logs"
        log_dir.mkdir(exist_ok=True)

        log_file = log_dir / f"rfp_scraper_{datetime.now().strftime('%Y%m%d')}.log"

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )

        # Separate logger for audit trail
        audit_logger = logging.getLogger('audit')
        audit_handler = logging.FileHandler(log_dir / 'audit.log')
        audit_handler.setFormatter(logging.Formatter(
            '%(asctime)s - AUDIT - %(message)s'
        ))
        audit_logger.addHandler(audit_handler)
        audit_logger.setLevel(logging.INFO)

        self.logger = logging.getLogger(__name__)
        self.audit_logger = audit_logger

    def _signal_handler(self, signum, frame):
        """Graceful shutdown handler"""
        self.logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.running = False

    @SCRAPE_DURATION.time()
    async def run_scraping_session(self) -> bool:
        """Main scraping session with comprehensive error handling"""
        session_start = datetime.now()
        session = ScrapeSession(
            start_time=session_start,
            source='automated'
        )

        try:
            self.logger.info("=== Starting Enhanced RFP Scraping Session ===")
            self.audit_logger.info(f"Scraping session started by system")

            # Collect system metrics
            self.metrics_collector.collect_system_metrics()

            # Health check
            if not await self._health_check():
                SCRAPE_COUNTER.labels(status='failed').inc()
                session.status = 'health_check_failed'
                return False

            # Scrape from all sources
            opportunities = await self.plugin_manager.scrape_all_sources(self.config)

            if opportunities:
                # Score opportunities
                self._score_opportunities(opportunities)

                # Save to database
                saved_count = 0
                for opp in opportunities:
                    if self.db_manager.save_opportunity(opp):
                        saved_count += 1

                session.opportunities_found = saved_count
                OPPORTUNITIES_FOUND.set(saved_count)

                # Generate CSV report
                csv_file = await self._generate_enhanced_csv_report(opportunities)

                # Send notifications
                await self.notification_manager.send_email_notification(opportunities, csv_file)
                await self.notification_manager.send_slack_notification(opportunities)

                self.logger.info(f"Successfully processed {saved_count} opportunities")
                session.status = 'completed'
                SCRAPE_COUNTER.labels(status='success').inc()

            else:
                self.logger.warning("No opportunities found in this session")
                session.status = 'no_data'
                SCRAPE_COUNTER.labels(status='no_data').inc()

            return True

        except Exception as e:
            self.logger.error(f"Scraping session failed: {str(e)}")
            session.status = 'failed'
            session.errors = str(e)
            SCRAPE_COUNTER.labels(status='error').inc()
            return False

        finally:
            session.end_time = datetime.now()
            session.duration_seconds = (session.end_time - session_start).total_seconds()
            self.db_manager.record_scrape_session(session)

            # Update system health metric
            SYSTEM_HEALTH.set(1 if session.status in ['completed', 'no_data'] else 0)

    async def _health_check(self) -> bool:
        """Comprehensive health check"""
        try:
            # Check database connectivity
            with sqlite3.connect(self.db_manager.db_path) as conn:
                conn.execute('SELECT 1').fetchone()

            # Check disk space
            disk = psutil.disk_usage(self.base_dir)
            if disk.percent > 95:
                self.logger.error("Insufficient disk space")
                return False

            # Check memory
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                self.logger.warning("High memory usage")

            # Test external connectivity
            async with aiohttp.ClientSession() as session:
                async with session.get('https://httpbin.org/get', timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status != 200:
                        self.logger.error("External connectivity check failed")
                        return False

            return True

        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    def _score_opportunities(self, opportunities: List[RFPOpportunity]):
        """Score opportunities based on multiple factors"""
        scoring_config = self.config.get('scoring', {})

        for opp in opportunities:
            score = 0.0

            # Urgency scoring
            urgency_weight = scoring_config.get('urgency_weight', 3.0)
            if opp.urgency.lower() == 'high':
                score += urgency_weight
            elif opp.urgency.lower() == 'medium':
                score += urgency_weight * 0.67
            else:
                score += urgency_weight * 0.33

            # Value scoring
            value_weight = scoring_config.get('value_weight', 2.0)
            value_str = opp.value.lower()
            if 'million' in value_str:
                score += value_weight
            elif any(term in value_str for term in ['thousand', 'k']):
                score += value_weight * 0.5

            # Keyword relevance scoring
            keyword_weight = scoring_config.get('keyword_weight', 1.5)
            relevant_keywords = ['payment', 'fintech', 'technology', 'digital', 'software']
            title_lower = opp.title.lower()
            description_lower = opp.description.lower()

            for keyword in relevant_keywords:
                if keyword in title_lower:
                    score += keyword_weight
                if keyword in description_lower:
                    score += keyword_weight * 0.5

            # Deadline urgency
            deadline_weight = scoring_config.get('deadline_weight', 2.0)
            try:
                deadline_date = datetime.strptime(opp.deadline, '%Y-%m-%d')
                days_until_deadline = (deadline_date - datetime.now()).days
                if days_until_deadline <= 7:
                    score += deadline_weight
                elif days_until_deadline <= 30:
                    score += deadline_weight * 0.5
            except:
                pass

            opp.score = min(score, 10.0)  # Cap at 10.0

    async def _generate_enhanced_csv_report(self, opportunities: List[RFPOpportunity]) -> Path:
        """Generate enhanced CSV report with scoring and metadata"""
        import csv
        from dataclasses import asdict

        output_dir = self.base_dir / "output"
        output_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_file = output_dir / f"rfp_opportunities_{timestamp}.csv"

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'title', 'agency', 'deadline', 'value', 'urgency', 'contact',
                'url', 'description', 'score', 'keywords', 'discovered_at'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for opp in opportunities:
                row = asdict(opp)
                row['keywords'] = ', '.join(opp.keywords)
                row['discovered_at'] = opp.discovered_at.isoformat()
                writer.writerow(row)

        self.logger.info(f"Enhanced CSV report generated: {csv_file}")
        return csv_file

    async def run_continuous(self):
        """Run continuous monitoring mode"""
        self.logger.info("Starting continuous monitoring mode")

        # Schedule periodic tasks
        schedule.every(4).hours.do(lambda: asyncio.create_task(self.run_scraping_session()))
        schedule.every(1).hours.do(self.metrics_collector.collect_system_metrics)
        schedule.every(24).hours.do(self._cleanup_old_data)

        while self.running:
            schedule.run_pending()
            await asyncio.sleep(60)  # Check every minute

    def _cleanup_old_data(self):
        """Cleanup old data based on retention policy"""
        cleanup_days = self.config['database']['cleanup_days']
        self.db_manager.cleanup_old_data(cleanup_days)


def main():
    """Main entry point"""
    import sqlite3

    scraper = RFPScraperEnhanced()

    if len(sys.argv) > 1 and sys.argv[1] == '--continuous':
        asyncio.run(scraper.run_continuous())
    else:
        # Single run mode
        success = asyncio.run(scraper.run_scraping_session())
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()