#!/usr/bin/env python3
"""
Advanced monitoring and alerting system
"""
import asyncio
import aiohttp
import logging
import smtplib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..core.models import Alert
from .metrics_collector import MetricsCollector


class AlertingSystem:
    """Advanced alerting system with multiple notification channels"""

    def __init__(self, config: Dict[str, Any], metrics_collector: MetricsCollector):
        self.config = config
        self.metrics_collector = metrics_collector
        self.alert_history = {}
        self.logger = logging.getLogger(__name__)

    async def check_alert_conditions(self):
        """Check for alerting conditions and send alerts"""
        try:
            health_score = self.metrics_collector.get_health_score()
            app_metrics = self.metrics_collector.collect_application_metrics()

            alerts = []

            # Health score alerts
            alerts.extend(self._check_health_alerts(health_score))

            # Success rate alerts
            if 'success_rate_24h' in app_metrics:
                alerts.extend(self._check_success_rate_alerts(app_metrics['success_rate_24h']))

            # Resource alerts
            alerts.extend(self._check_resource_alerts())

            # Activity alerts
            alerts.extend(self._check_activity_alerts(app_metrics))

            # Send alerts with throttling
            for alert in alerts:
                await self._send_alert_with_throttling(alert)

        except Exception as e:
            self.logger.error(f"Alert checking error: {e}")

    def _check_health_alerts(self, health_score: float) -> List[Alert]:
        """Check health score alerts"""
        alerts = []

        if health_score < 50:
            alerts.append(Alert(
                severity='critical',
                message=f'System health critically low: {health_score:.1f}%',
                metric='health_score',
                value=health_score
            ))
        elif health_score < 80:
            alerts.append(Alert(
                severity='warning',
                message=f'System health below normal: {health_score:.1f}%',
                metric='health_score',
                value=health_score
            ))

        return alerts

    def _check_success_rate_alerts(self, success_rate: float) -> List[Alert]:
        """Check success rate alerts"""
        alerts = []

        if success_rate < 70:
            alerts.append(Alert(
                severity='critical',
                message=f'Scraping success rate low: {success_rate:.1f}%',
                metric='success_rate',
                value=success_rate
            ))
        elif success_rate < 90:
            alerts.append(Alert(
                severity='warning',
                message=f'Scraping success rate below target: {success_rate:.1f}%',
                metric='success_rate',
                value=success_rate
            ))

        return alerts

    def _check_resource_alerts(self) -> List[Alert]:
        """Check system resource alerts"""
        alerts = []

        try:
            import psutil

            # CPU alerts
            cpu_percent = psutil.cpu_percent(interval=1)
            if cpu_percent > 90:
                alerts.append(Alert(
                    severity='critical',
                    message=f'High CPU usage: {cpu_percent:.1f}%',
                    metric='cpu_usage',
                    value=cpu_percent
                ))

            # Memory alerts
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                alerts.append(Alert(
                    severity='critical',
                    message=f'High memory usage: {memory.percent:.1f}%',
                    metric='memory_usage',
                    value=memory.percent
                ))

            # Disk alerts
            disk = psutil.disk_usage('/')
            if disk.percent > 95:
                alerts.append(Alert(
                    severity='critical',
                    message=f'Critically low disk space: {disk.percent:.1f}% used',
                    metric='disk_usage',
                    value=disk.percent
                ))

        except Exception as e:
            self.logger.error(f"Resource alert check error: {e}")

        return alerts

    def _check_activity_alerts(self, app_metrics: Dict[str, float]) -> List[Alert]:
        """Check activity-based alerts"""
        alerts = []

        # No recent activity
        if app_metrics.get('scrape_sessions_24h', 0) == 0:
            alerts.append(Alert(
                severity='warning',
                message='No scraping sessions in the last 24 hours',
                metric='activity',
                value=0
            ))

        # No opportunities found recently
        if app_metrics.get('opportunities_last_24h', 0) == 0:
            alerts.append(Alert(
                severity='info',
                message='No new opportunities found in the last 24 hours',
                metric='opportunities',
                value=0
            ))

        return alerts

    async def _send_alert_with_throttling(self, alert: Alert):
        """Send alert with throttling to prevent spam"""
        alert_key = f"{alert.metric}_{alert.severity}"
        now = datetime.now()

        # Check if we've sent this alert recently (throttle based on severity)
        throttle_hours = {'critical': 1, 'warning': 4, 'info': 12}
        throttle_time = throttle_hours.get(alert.severity, 4)

        if alert_key in self.alert_history:
            last_sent = self.alert_history[alert_key]
            if now - last_sent < timedelta(hours=throttle_time):
                return

        # Send alert
        await self._send_alert_notification(alert)
        self.alert_history[alert_key] = now

    async def _send_alert_notification(self, alert: Alert):
        """Send alert via multiple channels"""
        try:
            # Email alert
            if self.config.get('email', {}).get('sender_email'):
                await self._send_email_alert(alert)

            # Slack alert (if configured)
            slack_webhook = self.config.get('notifications', {}).get('slack_webhook')
            if slack_webhook:
                await self._send_slack_alert(alert, slack_webhook)

            self.logger.info(f"Alert sent: {alert.severity} - {alert.message}")

        except Exception as e:
            self.logger.error(f"Alert sending failed: {e}")

    async def _send_email_alert(self, alert: Alert):
        """Send email alert"""
        try:
            email_config = self.config['email']

            subject = f"🚨 RFP System Alert - {alert.severity.upper()}"
            body = self._create_alert_email_body(alert)

            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'html'))

            # Send email
            with smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port']) as server:
                server.starttls()
                server.login(email_config['sender_email'], email_config['sender_password'])
                server.send_message(msg)

            self.logger.info("Email alert sent successfully")

        except Exception as e:
            self.logger.error(f"Email alert failed: {e}")

    async def _send_slack_alert(self, alert: Alert, webhook_url: str):
        """Send Slack alert"""
        try:
            color_map = {
                'critical': '#FF0000',
                'warning': '#FFA500',
                'info': '#0099CC'
            }

            payload = {
                "attachments": [
                    {
                        "color": color_map.get(alert.severity, '#0099CC'),
                        "title": f"RFP System Alert - {alert.severity.title()}",
                        "text": alert.message,
                        "fields": [
                            {"title": "Metric", "value": alert.metric, "short": True},
                            {"title": "Value", "value": str(alert.value), "short": True},
                            {"title": "Time", "value": alert.timestamp.strftime('%Y-%m-%d %H:%M:%S'), "short": True}
                        ],
                        "footer": "RFP Scraper Monitoring",
                        "ts": int(alert.timestamp.timestamp())
                    }
                ]
            }

            timeout = self.config.get('notifications', {}).get('webhook_timeout', 10)
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status == 200:
                        self.logger.info("Slack alert sent successfully")
                    else:
                        self.logger.error(f"Slack alert failed: {response.status}")

        except Exception as e:
            self.logger.error(f"Slack alert error: {e}")

    def _create_alert_email_body(self, alert: Alert) -> str:
        """Create comprehensive HTML email body for alerts"""
        severity_colors = {
            'critical': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        }

        color = severity_colors.get(alert.severity, '#3498db')

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: {color}; color: white; padding: 20px; }}
                .content {{ padding: 20px; }}
                .details {{ background-color: #f8f9fa; padding: 15px; margin: 10px 0; }}
                .footer {{ background-color: #ecf0f1; padding: 10px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚨 System Alert: {alert.severity.title()}</h1>
                <p>RFP Scraper Monitoring System</p>
            </div>

            <div class="content">
                <h2>Alert Details</h2>
                <div class="details">
                    <p><strong>Message:</strong> {alert.message}</p>
                    <p><strong>Metric:</strong> {alert.metric}</p>
                    <p><strong>Value:</strong> {alert.value}</p>
                    <p><strong>Severity:</strong> {alert.severity.upper()}</p>
                    <p><strong>Time:</strong> {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                </div>

                <h3>Recommended Actions:</h3>
                <ul>
                    <li>Check system logs for errors</li>
                    <li>Verify system resources and connectivity</li>
                    <li>Run manual health check</li>
                    <li>Contact system administrator if issue persists</li>
                </ul>
            </div>

            <div class="footer">
                <p><small>
                    This is an automated alert from the RFP Scraper monitoring system.<br>
                    For support, check the system logs or contact the administrator.
                </small></p>
            </div>
        </body>
        </html>
        """

        return html

    def get_alert_history(self, hours: int = 24) -> Dict[str, Any]:
        """Get recent alert history"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        recent_alerts = {
            key: timestamp
            for key, timestamp in self.alert_history.items()
            if timestamp > cutoff_time
        }

        return {
            'recent_alerts': recent_alerts,
            'total_alerts': len(recent_alerts),
            'alert_types': list(set(key.split('_')[0] for key in recent_alerts.keys()))
        }