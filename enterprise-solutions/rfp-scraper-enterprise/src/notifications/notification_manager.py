#!/usr/bin/env python3
"""
Enhanced notification system with multiple channels
"""
import asyncio
import aiohttp
import smtplib
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import backoff

from ..core.models import RFPOpportunity


class NotificationManager:
    """Enhanced notification system with multiple channels"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)

    @backoff.on_exception(backoff.expo, Exception, max_tries=3)
    async def send_email_notification(self, opportunities: List[RFPOpportunity],
                                    csv_file: Optional[Path] = None):
        """Send email with exponential backoff retry"""
        try:
            email_config = self.config['email']

            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = self._generate_email_subject(opportunities)

            body = self._create_enhanced_email_body(opportunities)
            msg.attach(MIMEText(body, 'html'))

            # Attach CSV if provided
            if csv_file and csv_file.exists():
                self._attach_csv_file(msg, csv_file)

            # Send with timeout
            await self._send_email_async(msg, email_config)
            self.logger.info("Email notification sent successfully")

        except Exception as e:
            self.logger.error(f"Email notification failed: {e}")
            raise

    async def send_slack_notification(self, opportunities: List[RFPOpportunity]):
        """Send Slack notification for urgent opportunities"""
        webhook_url = self.config.get('notifications', {}).get('slack_webhook')
        if not webhook_url:
            return

        urgent_opps = [opp for opp in opportunities if opp.urgency.lower() == 'high']
        if not urgent_opps:
            return

        try:
            payload = {
                'text': f'🚨 {len(urgent_opps)} urgent RFP opportunities found!',
                'attachments': [
                    {
                        'color': 'danger',
                        'fields': [
                            {
                                'title': opp.title[:50] + ('...' if len(opp.title) > 50 else ''),
                                'value': f"Agency: {opp.agency}\nDeadline: {opp.deadline}",
                                'short': True
                            }
                            for opp in urgent_opps[:5]  # Limit to 5 for readability
                        ]
                    }
                ]
            }

            timeout = self.config.get('notifications', {}).get('webhook_timeout', 10)
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status == 200:
                        self.logger.info("Slack notification sent successfully")
                    else:
                        self.logger.error(f"Slack notification failed: {response.status}")

        except Exception as e:
            self.logger.error(f"Slack notification error: {e}")

    def _generate_email_subject(self, opportunities: List[RFPOpportunity]) -> str:
        """Generate dynamic email subject"""
        urgent_count = sum(1 for opp in opportunities if opp.urgency.lower() == 'high')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')

        if urgent_count > 0:
            return f"🚨 URGENT: {urgent_count} High-Priority RFPs + {len(opportunities)} Total - {timestamp}"
        else:
            return f"📋 RFP Alert: {len(opportunities)} New Opportunities - {timestamp}"

    def _create_enhanced_email_body(self, opportunities: List[RFPOpportunity]) -> str:
        """Create comprehensive HTML email body"""
        urgent_opps = [opp for opp in opportunities if opp.urgency.lower() == 'high']
        high_value_opps = [opp for opp in opportunities if 'million' in opp.value.lower()]

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: #2c3e50; color: white; padding: 20px; }}
                .urgent {{ background-color: #e74c3c; color: white; padding: 15px; margin: 10px 0; }}
                .high-value {{ background-color: #f39c12; color: white; padding: 15px; margin: 10px 0; }}
                .summary {{ background-color: #ecf0f1; padding: 15px; margin: 10px 0; }}
                table {{ border-collapse: collapse; width: 100%; margin: 10px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #3498db; color: white; }}
                .score {{ font-weight: bold; color: #27ae60; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎯 RFP Opportunities Alert</h1>
                <p>Automated Scan Results - {datetime.now().strftime('%Y-%m-%d %H:%M:%S EST')}</p>
            </div>

            <div class="summary">
                <h2>📊 Executive Summary</h2>
                <ul>
                    <li><strong>Total Opportunities:</strong> {len(opportunities)}</li>
                    <li><strong>Urgent (Action Required):</strong> {len(urgent_opps)}</li>
                    <li><strong>High-Value Projects:</strong> {len(high_value_opps)}</li>
                    <li><strong>Average Opportunity Score:</strong> {sum(opp.score for opp in opportunities) / len(opportunities):.1f}/10</li>
                </ul>
            </div>
        """

        if urgent_opps:
            html += f"""
            <div class="urgent">
                <h2>🚨 URGENT OPPORTUNITIES (Immediate Action Required)</h2>
                <table>
                    <tr>
                        <th>Title</th>
                        <th>Agency</th>
                        <th>Deadline</th>
                        <th>Value</th>
                        <th>Score</th>
                    </tr>
            """
            for opp in urgent_opps:
                html += f"""
                <tr>
                    <td><strong>{opp.title[:60]}{'...' if len(opp.title) > 60 else ''}</strong></td>
                    <td>{opp.agency}</td>
                    <td><strong>{opp.deadline}</strong></td>
                    <td>{opp.value}</td>
                    <td class="score">{opp.score:.1f}/10</td>
                </tr>
                """
            html += "</table></div>"

        if high_value_opps:
            html += f"""
            <div class="high-value">
                <h2>💰 HIGH-VALUE OPPORTUNITIES</h2>
                <table>
                    <tr>
                        <th>Title</th>
                        <th>Agency</th>
                        <th>Value</th>
                        <th>Deadline</th>
                    </tr>
            """
            for opp in high_value_opps:
                html += f"""
                <tr>
                    <td>{opp.title[:60]}{'...' if len(opp.title) > 60 else ''}</td>
                    <td>{opp.agency}</td>
                    <td><strong>{opp.value}</strong></td>
                    <td>{opp.deadline}</td>
                </tr>
                """
            html += "</table></div>"

        html += """
            <h2>📋 All Opportunities</h2>
            <p>Complete details including scoring metrics are available in the attached CSV file.</p>

            <div class="summary">
                <h3>🔄 Next Steps</h3>
                <ul>
                    <li>Review urgent opportunities immediately</li>
                    <li>Assess high-value projects for strategic fit</li>
                    <li>Check detailed CSV for complete opportunity data</li>
                    <li>Next automated scan: In 4 hours</li>
                </ul>
            </div>

            <hr>
            <p><small>Automated RFP Scraping System v2.0 | For support, contact: admin@yourcompany.com</small></p>
        </body>
        </html>
        """

        return html

    def _attach_csv_file(self, msg: MIMEMultipart, csv_file: Path):
        """Attach CSV file to email"""
        try:
            with open(csv_file, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())

            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {csv_file.name}'
            )
            msg.attach(part)

        except Exception as e:
            self.logger.error(f"CSV attachment failed: {e}")

    async def _send_email_async(self, msg: MIMEMultipart, email_config: Dict[str, Any]):
        """Send email asynchronously"""
        loop = asyncio.get_event_loop()

        def send_email():
            with smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port']) as server:
                server.starttls()
                server.login(email_config['sender_email'], email_config['sender_password'])
                server.send_message(msg)

        await loop.run_in_executor(None, send_email)

    async def send_system_notification(self, message: str, severity: str = 'info'):
        """Send system-level notifications"""
        try:
            # Email notification
            if self.config.get('email', {}).get('sender_email'):
                await self._send_system_email(message, severity)

            # Slack notification
            slack_webhook = self.config.get('notifications', {}).get('slack_webhook')
            if slack_webhook:
                await self._send_system_slack(message, severity, slack_webhook)

        except Exception as e:
            self.logger.error(f"System notification failed: {e}")

    async def _send_system_email(self, message: str, severity: str):
        """Send system notification via email"""
        try:
            email_config = self.config['email']

            severity_emojis = {
                'info': '💡',
                'warning': '⚠️',
                'error': '❌',
                'success': '✅'
            }

            emoji = severity_emojis.get(severity, '💡')
            subject = f"{emoji} RFP System Notification - {severity.title()}"

            body = f"""
            <html>
            <body>
                <h2>{emoji} System Notification</h2>
                <p><strong>Message:</strong> {message}</p>
                <p><strong>Severity:</strong> {severity.title()}</p>
                <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <hr>
                <p><small>RFP Scraper System</small></p>
            </body>
            </html>
            """

            msg = MIMEText(body, 'html')
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = subject

            await self._send_email_async(msg, email_config)

        except Exception as e:
            self.logger.error(f"System email notification failed: {e}")

    async def _send_system_slack(self, message: str, severity: str, webhook_url: str):
        """Send system notification via Slack"""
        try:
            color_map = {
                'info': '#0099CC',
                'warning': '#FFA500',
                'error': '#FF0000',
                'success': '#00CC00'
            }

            payload = {
                'text': f'System Notification: {severity.title()}',
                'attachments': [
                    {
                        'color': color_map.get(severity, '#0099CC'),
                        'text': message,
                        'footer': 'RFP Scraper System',
                        'ts': int(datetime.now().timestamp())
                    }
                ]
            }

            timeout = self.config.get('notifications', {}).get('webhook_timeout', 10)
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status != 200:
                        self.logger.error(f"System Slack notification failed: {response.status}")

        except Exception as e:
            self.logger.error(f"System Slack notification error: {e}")