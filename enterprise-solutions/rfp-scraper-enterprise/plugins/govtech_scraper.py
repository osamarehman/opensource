#!/usr/bin/env python3
"""
Sample RFP Plugin for government tech opportunities
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
    """Government technology opportunities scraper"""

    def __init__(self):
        super().__init__()
        self.name = "govtech_scraper"
        self.description = "Government technology opportunities scraper"
        self.version = "1.0.0"

    async def scrape(self, config: Dict[str, Any]) -> List[RFPOpportunity]:
        """Main scraping method"""
        opportunities = []

        try:
            urls = [
                "https://www.govtech.com/biz/procurement",
                "https://example-gov-site.com/rfps"  # Replace with actual sources
            ]

            async with await self.create_session(config) as session:
                tasks = [self._scrape_url(session, url) for url in urls]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for result in results:
                    if isinstance(result, list):
                        opportunities.extend(result)
                    elif isinstance(result, Exception):
                        self.logger.error(f"Plugin {self.name} URL error: {result}")

        except Exception as e:
            self.logger.error(f"Plugin {self.name} error: {e}")

        return opportunities

    async def _scrape_url(self, session: aiohttp.ClientSession, url: str) -> List[RFPOpportunity]:
        """Scrape individual URL"""
        html = await self.fetch_url(session, url)
        if html:
            return self._parse_opportunities(html, url)
        return []

    def _parse_opportunities(self, html: str, source_url: str) -> List[RFPOpportunity]:
        """Parse opportunities from HTML - customize per source"""
        opportunities = []

        try:
            soup = BeautifulSoup(html, 'html.parser')

            # Example parsing logic - customize for actual sites
            # This is a generic example that would need to be adapted
            # for specific government procurement sites

            # Look for common opportunity containers
            opportunity_selectors = [
                '.opportunity-item',
                '.procurement-listing',
                '.rfp-item',
                '.bid-opportunity'
            ]

            opportunity_divs = []
            for selector in opportunity_selectors:
                opportunity_divs.extend(soup.select(selector))

            # If no specific containers found, try table rows
            if not opportunity_divs:
                opportunity_divs = soup.select('tr')

            for div in opportunity_divs:
                title = self._extract_title(div)
                agency = self._extract_agency(div)
                deadline = self._extract_deadline(div)
                value = self._extract_value(div)

                if title and agency:
                    opportunity = RFPOpportunity(
                        title=title,
                        agency=agency,
                        deadline=deadline or "TBD",
                        value=self.parse_value(value) if value else "Not specified",
                        urgency=self.determine_urgency(deadline),
                        contact=self._extract_contact(div) or "See posting",
                        url=self._extract_url(div, source_url),
                        description=self._extract_description(div),
                        keywords=self.extract_keywords(title + " " + (value or ""))
                    )
                    opportunities.append(opportunity)

        except Exception as e:
            self.logger.error(f"Parsing error for {source_url}: {e}")

        return opportunities

    def _extract_title(self, element) -> str:
        """Extract opportunity title"""
        title_selectors = ['.title', '.opportunity-title', 'h3', 'h4', '.name']
        for selector in title_selectors:
            title = self.safe_extract(element, selector)
            if title:
                return title
        return ""

    def _extract_agency(self, element) -> str:
        """Extract agency name"""
        agency_selectors = ['.agency', '.department', '.organization', '.issuer']
        for selector in agency_selectors:
            agency = self.safe_extract(element, selector)
            if agency:
                return agency
        return ""

    def _extract_deadline(self, element) -> str:
        """Extract deadline"""
        deadline_selectors = ['.deadline', '.due-date', '.closing-date', '.expires']
        for selector in deadline_selectors:
            deadline = self.safe_extract(element, selector)
            if deadline:
                return self._normalize_date(deadline)
        return ""

    def _extract_value(self, element) -> str:
        """Extract opportunity value"""
        value_selectors = ['.value', '.amount', '.budget', '.contract-value']
        for selector in value_selectors:
            value = self.safe_extract(element, selector)
            if value:
                return value
        return ""

    def _extract_contact(self, element) -> str:
        """Extract contact information"""
        contact_selectors = ['.contact', '.point-of-contact', '.email', '.phone']
        for selector in contact_selectors:
            contact = self.safe_extract(element, selector)
            if contact:
                return contact
        return ""

    def _extract_description(self, element) -> str:
        """Extract opportunity description"""
        desc_selectors = ['.description', '.summary', '.details', 'p']
        for selector in desc_selectors:
            desc = self.safe_extract(element, selector)
            if desc and len(desc) > 20:  # Only return substantial descriptions
                return desc[:500]  # Limit length
        return ""

    def _extract_url(self, element, base_url: str) -> str:
        """Extract opportunity URL"""
        link_selectors = ['a[href]', '.link']
        for selector in link_selectors:
            link_elem = element.select_one(selector)
            if link_elem and link_elem.get('href'):
                href = link_elem.get('href')
                if href.startswith('http'):
                    return href
                elif href.startswith('/'):
                    from urllib.parse import urljoin
                    return urljoin(base_url, href)
        return base_url

    def _normalize_date(self, date_str: str) -> str:
        """Normalize date string to YYYY-MM-DD format"""
        try:
            # Try common date formats
            date_formats = [
                '%Y-%m-%d',
                '%m/%d/%Y',
                '%d/%m/%Y',
                '%B %d, %Y',
                '%b %d, %Y',
                '%Y-%m-%d %H:%M:%S'
            ]

            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_str.strip(), fmt)
                    return parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    continue

            # If no format matches, return original
            return date_str
        except:
            return date_str