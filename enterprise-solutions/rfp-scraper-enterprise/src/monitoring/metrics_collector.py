#!/usr/bin/env python3
"""
Comprehensive metrics collection system
"""
import psutil
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Dict, Any, List
from ..core.models import SystemMetric
from ..database.database_manager import DatabaseManager


class MetricsCollector:
    """Comprehensive metrics collection"""

    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.logger = logging.getLogger(__name__)

    def collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            metrics = [
                SystemMetric('cpu_usage_percent', cpu_percent),
                SystemMetric('memory_usage_percent', memory.percent),
                SystemMetric('memory_available_gb', memory.available / (1024**3)),
                SystemMetric('disk_usage_percent', disk.percent),
                SystemMetric('disk_free_gb', disk.free / (1024**3))
            ]

            for metric in metrics:
                self.db_manager.record_metric(metric)

            self.logger.debug(f"Collected {len(metrics)} system metrics")

        except Exception as e:
            self.logger.error(f"Metrics collection error: {e}")

    def collect_application_metrics(self) -> Dict[str, float]:
        """Collect application-specific metrics"""
        metrics = {}

        try:
            # Database metrics
            with sqlite3.connect(self.db_manager.db_path) as conn:
                cursor = conn.execute('SELECT COUNT(*) FROM opportunities WHERE status = "active"')
                metrics['active_opportunities'] = cursor.fetchone()[0]

                cursor = conn.execute('SELECT COUNT(*) FROM opportunities WHERE discovered_at > datetime("now", "-24 hours")')
                metrics['opportunities_last_24h'] = cursor.fetchone()[0]

                cursor = conn.execute('SELECT COUNT(*) FROM scrape_sessions WHERE start_time > datetime("now", "-24 hours")')
                metrics['scrape_sessions_24h'] = cursor.fetchone()[0]

                cursor = conn.execute('''
                    SELECT COUNT(*) FROM scrape_sessions
                    WHERE start_time > datetime("now", "-24 hours") AND status = "completed"
                ''')
                successful_sessions = cursor.fetchone()[0]
                total_sessions = metrics['scrape_sessions_24h']

                if total_sessions > 0:
                    metrics['success_rate_24h'] = (successful_sessions / total_sessions) * 100
                else:
                    metrics['success_rate_24h'] = 0

            # Record application metrics
            for name, value in metrics.items():
                metric = SystemMetric(name, value)
                self.db_manager.record_metric(metric)

        except Exception as e:
            self.logger.error(f"Application metrics collection error: {e}")

        return metrics

    def get_health_score(self) -> float:
        """Calculate overall system health score (0-100)"""
        score = 100.0

        try:
            # System resource checks
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            # Deduct points for high resource usage
            if cpu_percent > 90:
                score -= 20
            elif cpu_percent > 70:
                score -= 10

            if memory.percent > 90:
                score -= 20
            elif memory.percent > 70:
                score -= 10

            if disk.percent > 95:
                score -= 30
            elif disk.percent > 85:
                score -= 15

            # Database connectivity check
            try:
                with sqlite3.connect(self.db_manager.db_path) as conn:
                    conn.execute('SELECT 1').fetchone()
            except:
                score -= 25

            # Recent activity check
            try:
                with sqlite3.connect(self.db_manager.db_path) as conn:
                    cursor = conn.execute('''
                        SELECT COUNT(*) FROM scrape_sessions
                        WHERE start_time > datetime('now', '-6 hours')
                    ''')
                    recent_runs = cursor.fetchone()[0]
                    if recent_runs == 0:
                        score -= 20
            except:
                score -= 10

        except Exception as e:
            self.logger.error(f"Health score calculation error: {e}")
            score = 0

        return max(score, 0.0)

    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        try:
            with sqlite3.connect(self.db_manager.db_path) as conn:
                conn.row_factory = sqlite3.Row

                # Get recent metrics
                cursor = conn.execute('''
                    SELECT metric_name, AVG(metric_value) as avg_value,
                           MIN(metric_value) as min_value, MAX(metric_value) as max_value,
                           COUNT(*) as count
                    FROM system_metrics
                    WHERE timestamp > datetime('now', '-{} hours')
                    GROUP BY metric_name
                '''.format(hours))

                metrics_data = {row['metric_name']: dict(row) for row in cursor.fetchall()}

                # Get session statistics
                cursor = conn.execute('''
                    SELECT
                        COUNT(*) as total_sessions,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_sessions,
                        SUM(opportunities_found) as total_opportunities,
                        AVG(duration_seconds) as avg_duration
                    FROM scrape_sessions
                    WHERE start_time > datetime('now', '-{} hours')
                '''.format(hours))

                session_stats = dict(cursor.fetchone())

                return {
                    'health_score': self.get_health_score(),
                    'metrics': metrics_data,
                    'session_stats': session_stats,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }

        except Exception as e:
            self.logger.error(f"Metrics summary error: {e}")
            return {
                'health_score': 0,
                'metrics': {},
                'session_stats': {},
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'error': str(e)
            }