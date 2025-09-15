#!/usr/bin/env python3
"""
Maintenance and utility scripts for RFP Scraper Enterprise
"""
import os
import sys
import argparse
import sqlite3
import shutil
import logging
from datetime import datetime, timedelta
from pathlib import Path

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from core.config_manager import ConfigManager
from database.database_manager import DatabaseManager
from ml.opportunity_scorer import MLOpportunityScorer


class MaintenanceManager:
    """Maintenance operations for RFP Scraper"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.yaml"

        self.config_manager = ConfigManager(config_path)
        self.config = self.config_manager.load_config()
        self.db_manager = DatabaseManager(self.config['database']['path'])

        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def backup_database(self, backup_dir: str = None):
        """Create database backup"""
        if backup_dir is None:
            backup_dir = Path(__file__).parent.parent / "data" / "backups"

        backup_dir = Path(backup_dir)
        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"rfp_database_backup_{timestamp}.sqlite"

        try:
            shutil.copy2(self.db_manager.db_path, backup_file)
            self.logger.info(f"Database backup created: {backup_file}")
            return str(backup_file)
        except Exception as e:
            self.logger.error(f"Database backup failed: {e}")
            return None

    def cleanup_old_data(self, days: int = None):
        """Clean up old data based on retention policy"""
        if days is None:
            days = self.config['database']['cleanup_days']

        self.logger.info(f"Cleaning up data older than {days} days...")
        self.db_manager.cleanup_old_data(days)

    def vacuum_database(self):
        """Vacuum database to reclaim space"""
        try:
            with sqlite3.connect(self.db_manager.db_path) as conn:
                conn.execute('VACUUM')
            self.logger.info("Database vacuum completed")
        except Exception as e:
            self.logger.error(f"Database vacuum failed: {e}")

    def export_opportunities(self, output_file: str = None, days: int = 30):
        """Export opportunities to CSV"""
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"opportunities_export_{timestamp}.csv"

        opportunities = self.db_manager.get_recent_opportunities(days * 24)

        if not opportunities:
            self.logger.warning("No opportunities found to export")
            return

        import csv

        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            if opportunities:
                fieldnames = opportunities[0].keys()
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(opportunities)

        self.logger.info(f"Exported {len(opportunities)} opportunities to {output_file}")

    def get_system_stats(self):
        """Get comprehensive system statistics"""
        with sqlite3.connect(self.db_manager.db_path) as conn:
            conn.row_factory = sqlite3.Row

            stats = {}

            # Total opportunities
            cursor = conn.execute('SELECT COUNT(*) FROM opportunities')
            stats['total_opportunities'] = cursor.fetchone()[0]

            # Active opportunities
            cursor = conn.execute('SELECT COUNT(*) FROM opportunities WHERE status = "active"')
            stats['active_opportunities'] = cursor.fetchone()[0]

            # Recent opportunities (last 7 days)
            cursor = conn.execute('''
                SELECT COUNT(*) FROM opportunities
                WHERE discovered_at > datetime('now', '-7 days')
            ''')
            stats['opportunities_last_7_days'] = cursor.fetchone()[0]

            # Scrape sessions stats
            cursor = conn.execute('SELECT COUNT(*) FROM scrape_sessions')
            stats['total_scrape_sessions'] = cursor.fetchone()[0]

            cursor = conn.execute('''
                SELECT COUNT(*) FROM scrape_sessions
                WHERE status = 'completed' AND start_time > datetime('now', '-24 hours')
            ''')
            successful_sessions_24h = cursor.fetchone()[0]

            cursor = conn.execute('''
                SELECT COUNT(*) FROM scrape_sessions
                WHERE start_time > datetime('now', '-24 hours')
            ''')
            total_sessions_24h = cursor.fetchone()[0]

            if total_sessions_24h > 0:
                stats['success_rate_24h'] = (successful_sessions_24h / total_sessions_24h) * 100
            else:
                stats['success_rate_24h'] = 0

            # Top agencies by opportunity count
            cursor = conn.execute('''
                SELECT agency, COUNT(*) as count
                FROM opportunities
                WHERE status = 'active'
                GROUP BY agency
                ORDER BY count DESC
                LIMIT 10
            ''')
            stats['top_agencies'] = [dict(row) for row in cursor.fetchall()]

            # Average opportunity score
            cursor = conn.execute('SELECT AVG(score) FROM opportunities WHERE score > 0')
            avg_score = cursor.fetchone()[0]
            stats['average_score'] = round(avg_score, 2) if avg_score else 0

        return stats

    def train_ml_model(self):
        """Train or retrain ML model"""
        try:
            scorer = MLOpportunityScorer(self.db_manager)
            success = scorer.train_model()
            if success:
                self.logger.info("ML model training completed successfully")
            else:
                self.logger.warning("ML model training failed or insufficient data")
            return success
        except Exception as e:
            self.logger.error(f"ML model training error: {e}")
            return False

    def check_health(self):
        """Comprehensive health check"""
        health_status = {
            'overall': 'healthy',
            'issues': [],
            'timestamp': datetime.now().isoformat()
        }

        try:
            # Database connectivity
            with sqlite3.connect(self.db_manager.db_path) as conn:
                conn.execute('SELECT 1').fetchone()
        except Exception as e:
            health_status['issues'].append(f"Database connectivity: {e}")
            health_status['overall'] = 'unhealthy'

        # Check disk space
        try:
            import psutil
            disk = psutil.disk_usage(Path(__file__).parent.parent)
            if disk.percent > 95:
                health_status['issues'].append(f"Low disk space: {disk.percent}% used")
                health_status['overall'] = 'warning'
        except Exception as e:
            health_status['issues'].append(f"Disk check failed: {e}")

        # Check recent activity
        try:
            with sqlite3.connect(self.db_manager.db_path) as conn:
                cursor = conn.execute('''
                    SELECT COUNT(*) FROM scrape_sessions
                    WHERE start_time > datetime('now', '-6 hours')
                ''')
                recent_sessions = cursor.fetchone()[0]
                if recent_sessions == 0:
                    health_status['issues'].append("No recent scraping activity (6+ hours)")
                    if health_status['overall'] == 'healthy':
                        health_status['overall'] = 'warning'
        except Exception as e:
            health_status['issues'].append(f"Activity check failed: {e}")

        # Check configuration
        try:
            email_config = self.config.get('email', {})
            if not email_config.get('sender_email'):
                health_status['issues'].append("Email configuration incomplete")
        except Exception as e:
            health_status['issues'].append(f"Configuration check failed: {e}")

        return health_status

    def reset_system(self, confirm: bool = False):
        """Reset system (delete all data) - USE WITH CAUTION"""
        if not confirm:
            self.logger.error("Reset requires explicit confirmation. Use --confirm flag.")
            return False

        try:
            # Backup before reset
            backup_file = self.backup_database()
            if backup_file:
                self.logger.info(f"Backup created before reset: {backup_file}")

            # Clear database
            with sqlite3.connect(self.db_manager.db_path) as conn:
                conn.execute('DELETE FROM opportunities')
                conn.execute('DELETE FROM scrape_sessions')
                conn.execute('DELETE FROM system_metrics')

            # Clear logs
            log_dir = Path(__file__).parent.parent / "logs"
            for log_file in log_dir.glob("*.log"):
                log_file.unlink()

            # Clear output
            output_dir = Path(__file__).parent.parent / "output"
            for output_file in output_dir.glob("*"):
                if output_file.is_file():
                    output_file.unlink()

            self.logger.info("System reset completed")
            return True

        except Exception as e:
            self.logger.error(f"System reset failed: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description='RFP Scraper Maintenance Tools')
    parser.add_argument('--config', help='Configuration file path')

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Backup command
    backup_parser = subparsers.add_parser('backup', help='Create database backup')
    backup_parser.add_argument('--dir', help='Backup directory')

    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean up old data')
    cleanup_parser.add_argument('--days', type=int, help='Days to retain')

    # Export command
    export_parser = subparsers.add_parser('export', help='Export opportunities to CSV')
    export_parser.add_argument('--output', help='Output file path')
    export_parser.add_argument('--days', type=int, default=30, help='Days to export')

    # Stats command
    subparsers.add_parser('stats', help='Show system statistics')

    # Health command
    subparsers.add_parser('health', help='Run health check')

    # Train command
    subparsers.add_parser('train', help='Train ML model')

    # Vacuum command
    subparsers.add_parser('vacuum', help='Vacuum database')

    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset system (DANGEROUS)')
    reset_parser.add_argument('--confirm', action='store_true', help='Confirm reset')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    maintenance = MaintenanceManager(args.config)

    if args.command == 'backup':
        maintenance.backup_database(args.dir)

    elif args.command == 'cleanup':
        maintenance.cleanup_old_data(args.days)

    elif args.command == 'export':
        maintenance.export_opportunities(args.output, args.days)

    elif args.command == 'stats':
        stats = maintenance.get_system_stats()
        print("\n=== RFP Scraper System Statistics ===")
        print(f"Total Opportunities: {stats['total_opportunities']}")
        print(f"Active Opportunities: {stats['active_opportunities']}")
        print(f"Opportunities (Last 7 Days): {stats['opportunities_last_7_days']}")
        print(f"Total Scrape Sessions: {stats['total_scrape_sessions']}")
        print(f"Success Rate (24h): {stats['success_rate_24h']:.1f}%")
        print(f"Average Score: {stats['average_score']}")
        print("\nTop Agencies:")
        for agency in stats['top_agencies'][:5]:
            print(f"  {agency['agency']}: {agency['count']} opportunities")

    elif args.command == 'health':
        health = maintenance.check_health()
        print(f"\n=== System Health Check ===")
        print(f"Overall Status: {health['overall'].upper()}")
        print(f"Timestamp: {health['timestamp']}")
        if health['issues']:
            print("Issues Found:")
            for issue in health['issues']:
                print(f"  - {issue}")
        else:
            print("No issues found.")

    elif args.command == 'train':
        maintenance.train_ml_model()

    elif args.command == 'vacuum':
        maintenance.vacuum_database()

    elif args.command == 'reset':
        maintenance.reset_system(args.confirm)


if __name__ == '__main__':
    main()