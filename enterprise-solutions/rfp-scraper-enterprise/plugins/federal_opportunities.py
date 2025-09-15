#!/usr/bin/env python3
"""
Federal opportunities scraper plugin for SAM.gov and other federal sources
"""
import asyncio
import aiohttp
import logging
from typing import List, Dict, Any
from datetime import datetime
from bs4 import BeautifulSoup

# Import the base plugin and models
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from plugins.base_plugin import BaseRFPPlugin
from core.models import RFPOpportunity


class RFPPlugin(BaseRFPPlugin):
    """Federal opportunities scraper for government contracts"""

    def __init__(self):
        super().__init__()
        self.name = "federal_opportunities"
        self.description = "Federal government contract opportunities scraper"
        self.version = "1.0.0"

    async def scrape(self, config: Dict[str, Any]) -> List[RFPOpportunity]:
        """Main scraping method for federal opportunities"""
        opportunities = []

        try:
            # Federal procurement sources
            sources = [
                {
                    'url': 'https://sam.gov/api/prod/sgs/v1/search/',
                    'type': 'api',
                    'name': 'SAM.gov'
                },
                {
                    'url': 'https://www.fbo.gov',  # Legacy - now redirects to SAM.gov
                    'type': 'html',
                    'name': 'FBO.gov'
                }
            ]

            async with await self.create_session(config) as session:
                tasks = []
                for source in sources:
                    if source['type'] == 'api':
                        task = self._scrape_api_source(session, source)
                    else:
                        task = self._scrape_html_source(session, source)
                    tasks.append(task)

                results = await asyncio.gather(*tasks, return_exceptions=True)

                for result in results:
                    if isinstance(result, list):
                        opportunities.extend(result)
                    elif isinstance(result, Exception):
                        self.logger.error(f"Federal source error: {result}")

        except Exception as e:
            self.logger.error(f"Federal opportunities plugin error: {e}")

        return opportunities

    async def _scrape_api_source(self, session: aiohttp.ClientSession, source: Dict) -> List[RFPOpportunity]:
        """Scrape API-based federal sources"""
        opportunities = []

        try:
            # SAM.gov API parameters for technology-related opportunities
            params = {
                'limit': 100,
                'api_key': 'your_api_key_here',  # Would need to be configured
                'keywords': 'technology,software,IT,digital',
                'status': 'active'
            }

            async with session.get(source['url'], params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    opportunities = self._parse_api_response(data, source['name'])
                else:
                    self.logger.warning(f"API error {response.status} for {source['name']}")

        except Exception as e:
            self.logger.error(f"API scraping error for {source['name']}: {e}")

        return opportunities

    async def _scrape_html_source(self, session: aiohttp.ClientSession, source: Dict) -> List[RFPOpportunity]:
        """Scrape HTML-based federal sources"""
        html = await self.fetch_url(session, source['url'])
        if html:
            return self._parse_federal_html(html, source)
        return []

    def _parse_api_response(self, data: Dict, source_name: str) -> List[RFPOpportunity]:
        """Parse API response from federal sources"""
        opportunities = []

        try:
            # SAM.gov API response structure (example)
            if 'opportunitiesData' in data:
                for opp_data in data['opportunitiesData']:
                    opportunity = RFPOpportunity(
                        title=opp_data.get('title', ''),
                        agency=opp_data.get('fullParentPathName', ''),
                        deadline=self._parse_federal_date(opp_data.get('responseDeadLine', '')),
                        value=self._format_federal_value(opp_data.get('awardNumber', '')),
                        urgency=self._calculate_federal_urgency(opp_data.get('responseDeadLine', '')),
                        contact=opp_data.get('pointOfContact', {}).get('email', 'See posting'),
                        url=f"https://sam.gov/opp/{opp_data.get('noticeId', '')}",
                        description=opp_data.get('description', '')[:500],
                        keywords=self._extract_federal_keywords(opp_data)
                    )
                    opportunities.append(opportunity)

        except Exception as e:
            self.logger.error(f"API parsing error for {source_name}: {e}")

        return opportunities

    def _parse_federal_html(self, html: str, source: Dict) -> List[RFPOpportunity]:
        """Parse HTML from federal procurement sites"""
        opportunities = []

        try:
            soup = BeautifulSoup(html, 'html.parser')

            # Federal sites often use specific CSS classes
            opportunity_containers = soup.select('.opportunity, .notice-listing, .procurement-item')

            for container in opportunity_containers:
                title = self.safe_extract(container, '.opportunity-title, .notice-title, h3')
                agency = self.safe_extract(container, '.agency, .department, .office')
                deadline = self.safe_extract(container, '.response-date, .due-date, .deadline')

                if title and agency:
                    opportunity = RFPOpportunity(
                        title=title,
                        agency=agency,
                        deadline=self._parse_federal_date(deadline),
                        value=self._extract_federal_value(container),
                        urgency=self._calculate_federal_urgency(deadline),
                        contact=self.safe_extract(container, '.contact, .poc') or "See posting",
                        url=self._extract_federal_url(container, source['url']),
                        description=self.safe_extract(container, '.description, .summary')[:500],
                        keywords=self.extract_keywords(title)
                    )
                    opportunities.append(opportunity)

        except Exception as e:
            self.logger.error(f"HTML parsing error for {source['name']}: {e}")

        return opportunities

    def _parse_federal_date(self, date_str: str) -> str:
        """Parse federal date formats"""
        if not date_str:
            return "TBD"

        try:
            # Common federal date formats
            federal_formats = [
                '%Y-%m-%d',
                '%m/%d/%Y',
                '%Y-%m-%dT%H:%M:%S',
                '%b %d, %Y',
                '%B %d, %Y'
            ]

            for fmt in federal_formats:
                try:
                    parsed_date = datetime.strptime(date_str.strip(), fmt)
                    return parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    continue

            return date_str
        except:
            return "TBD"

    def _format_federal_value(self, value_str: str) -> str:
        """Format federal contract values"""
        if not value_str:
            return "Not specified"

        # Federal contracts often have specific value formats
        value_str = value_str.replace('$', '').replace(',', '').strip()

        if value_str.isdigit():
            value = int(value_str)
            if value >= 1000000:
                return f"${value/1000000:.1f}M"
            elif value >= 1000:
                return f"${value/1000:.0f}K"
            else:
                return f"${value}"

        return f"${value_str}" if value_str else "Not specified"

    def _calculate_federal_urgency(self, deadline_str: str) -> str:
        """Calculate urgency for federal opportunities"""
        if not deadline_str:
            return "medium"

        try:
            deadline_date = datetime.strptime(deadline_str, '%Y-%m-%d')
            days_until = (deadline_date - datetime.now()).days

            # Federal procurement often has longer timelines
            if days_until <= 10:
                return "high"
            elif days_until <= 30:
                return "medium"
            else:
                return "low"
        except:
            return "medium"

    def _extract_federal_keywords(self, opp_data: Dict) -> List[str]:
        """Extract keywords from federal opportunity data"""
        keywords = []

        # Combine relevant text fields
        text_fields = [
            opp_data.get('title', ''),
            opp_data.get('description', ''),
            opp_data.get('naicsCode', ''),
            opp_data.get('classificationCode', '')
        ]

        combined_text = ' '.join(str(field) for field in text_fields)
        return self.extract_keywords(combined_text)

    def _extract_federal_value(self, container) -> str:
        """Extract value from federal opportunity container"""
        value_selectors = [
            '.contract-value',
            '.award-amount',
            '.estimated-value',
            '.dollar-amount'
        ]

        for selector in value_selectors:
            value = self.safe_extract(container, selector)
            if value:
                return self._format_federal_value(value)

        return "Not specified"

    def _extract_federal_url(self, container, base_url: str) -> str:
        """Extract URL for federal opportunity"""
        link = container.select_one('a[href]')
        if link and link.get('href'):
            href = link.get('href')
            if href.startswith('http'):
                return href
            elif href.startswith('/'):
                from urllib.parse import urljoin
                return urljoin(base_url, href)
        return base_url