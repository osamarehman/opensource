#!/usr/bin/env python3
"""
Enhanced database management with connection pooling
"""
import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..core.models import RFPOpportunity, ScrapeSession, SystemMetric


class DatabaseManager:
    """Enhanced database management with connection pooling"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        self.init_database()

    def init_database(self):
        """Initialize database with enhanced schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS opportunities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    agency TEXT NOT NULL,
                    deadline TEXT,
                    value TEXT,
                    urgency TEXT,
                    contact TEXT,
                    url TEXT,
                    description TEXT,
                    keywords TEXT,
                    score REAL DEFAULT 0.0,
                    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    notified_at TIMESTAMP,
                    metadata TEXT
                )
            ''')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS scrape_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    status TEXT,
                    opportunities_found INTEGER,
                    errors TEXT,
                    duration_seconds REAL,
                    source TEXT
                )
            ''')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metric_name TEXT,
                    metric_value REAL,
                    metadata TEXT
                )
            ''')

            # Create indexes for performance
            conn.execute('CREATE INDEX IF NOT EXISTS idx_opportunities_hash ON opportunities(hash)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_opportunities_discovered ON opportunities(discovered_at)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_scrape_sessions_start ON scrape_sessions(start_time)')

    def save_opportunity(self, opportunity: RFPOpportunity) -> bool:
        """Save opportunity with deduplication"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                opp_hash = opportunity.generate_hash()
                keywords_json = json.dumps(opportunity.keywords)

                conn.execute('''
                    INSERT OR REPLACE INTO opportunities
                    (hash, title, agency, deadline, value, urgency, contact, url,
                     description, keywords, score, discovered_at, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (
                    opp_hash, opportunity.title, opportunity.agency,
                    opportunity.deadline, opportunity.value, opportunity.urgency,
                    opportunity.contact, opportunity.url, opportunity.description,
                    keywords_json, opportunity.score, opportunity.discovered_at
                ))
                return True
        except Exception as e:
            self.logger.error(f"Database save error: {e}")
            return False

    def get_recent_opportunities(self, hours: int = 24) -> List[Dict]:
        """Get opportunities discovered in the last N hours"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('''
                SELECT * FROM opportunities
                WHERE discovered_at > datetime('now', '-{} hours')
                ORDER BY discovered_at DESC
            '''.format(hours))
            return [dict(row) for row in cursor.fetchall()]

    def record_scrape_session(self, session: ScrapeSession):
        """Record scraping session metrics"""
        with sqlite3.connect(self.db_path) as conn:
            session_data = session.to_dict()
            conn.execute('''
                INSERT INTO scrape_sessions
                (start_time, end_time, status, opportunities_found, errors, duration_seconds, source)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_data['start_time'],
                session_data['end_time'],
                session_data['status'],
                session_data['opportunities_found'],
                session_data['errors'],
                session_data['duration_seconds'],
                session_data['source']
            ))

    def record_metric(self, metric: SystemMetric):
        """Record system metric"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO system_metrics (metric_name, metric_value, metadata, timestamp)
                VALUES (?, ?, ?, ?)
            ''', (metric.name, metric.value, metric.metadata, metric.timestamp))

    def get_system_health_data(self, hours: int = 24) -> Dict[str, Any]:
        """Get system health data for the last N hours"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row

            # Get recent scrape sessions
            sessions_cursor = conn.execute('''
                SELECT * FROM scrape_sessions
                WHERE start_time > datetime('now', '-{} hours')
                ORDER BY start_time DESC
            '''.format(hours))
            sessions = [dict(row) for row in sessions_cursor.fetchall()]

            # Get recent metrics
            metrics_cursor = conn.execute('''
                SELECT * FROM system_metrics
                WHERE timestamp > datetime('now', '-{} hours')
                ORDER BY timestamp DESC
            '''.format(hours))
            metrics = [dict(row) for row in metrics_cursor.fetchall()]

            return {
                'sessions': sessions,
                'metrics': metrics,
                'total_sessions': len(sessions),
                'successful_sessions': len([s for s in sessions if s['status'] == 'completed'])
            }

    def cleanup_old_data(self, cleanup_days: int = 90):
        """Cleanup old data based on retention policy"""
        try:
            cutoff_date = datetime.now() - timedelta(days=cleanup_days)

            with sqlite3.connect(self.db_path) as conn:
                # Archive old opportunities
                conn.execute('''
                    UPDATE opportunities
                    SET status = 'archived'
                    WHERE discovered_at < ? AND status = 'active'
                ''', (cutoff_date,))

                # Clean old metrics
                conn.execute('''
                    DELETE FROM system_metrics
                    WHERE timestamp < ?
                ''', (cutoff_date,))

                # Clean old sessions
                conn.execute('''
                    DELETE FROM scrape_sessions
                    WHERE start_time < ?
                ''', (cutoff_date,))

            self.logger.info("Data cleanup completed")

        except Exception as e:
            self.logger.error(f"Data cleanup failed: {e}")

    def get_opportunities_for_training(self, min_score: float = 0.0) -> List[Dict]:
        """Get opportunities with scores for ML training"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('''
                SELECT title, description, agency, value, urgency, score
                FROM opportunities
                WHERE score >= ? AND status = 'active'
                ORDER BY discovered_at DESC
            ''', (min_score,))
            return [dict(row) for row in cursor.fetchall()]