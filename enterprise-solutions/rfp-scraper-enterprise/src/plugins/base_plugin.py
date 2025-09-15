#!/usr/bin/env python3
"""
Base plugin interface for RFP sources
"""
import asyncio
import aiohttp
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
from bs4 import BeautifulSoup

from ..core.models import RFPOpportunity


class BaseRFPPlugin(ABC):
    """Base plugin interface for RFP sources"""

    def __init__(self):
        self.name = "base_plugin"
        self.description = "Base RFP plugin"
        self.version = "1.0.0"
        self.timeout = 30
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def scrape(self, config: Dict[str, Any]) -> List[RFPOpportunity]:
        """Main scraping method - must be implemented by plugins"""
        pass

    async def fetch_url(self, session: aiohttp.ClientSession, url: str) -> str:
        """Fetch URL content with error handling"""
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    self.logger.warning(f"HTTP {response.status} for {url}")
                    return ""
        except Exception as e:
            self.logger.error(f"Error fetching {url}: {e}")
            return ""

    def safe_extract(self, element, selector: str) -> str:
        """Safely extract text from element"""
        try:
            found = element.select_one(selector)
            return found.get_text(strip=True) if found else ""
        except:
            return ""

    def determine_urgency(self, deadline: str) -> str:
        """Determine urgency based on deadline"""
        if not deadline:
            return "medium"

        try:
            deadline_date = datetime.strptime(deadline, '%Y-%m-%d')
            days_until = (deadline_date - datetime.now()).days

            if days_until <= 7:
                return "high"
            elif days_until <= 30:
                return "medium"
            else:
                return "low"
        except:
            return "medium"

    def extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        keywords = []
        tech_terms = [
            'software', 'technology', 'digital', 'cloud', 'api',
            'payment', 'fintech', 'database', 'security', 'ai',
            'machine learning', 'analytics', 'mobile', 'web'
        ]

        text_lower = text.lower()
        for term in tech_terms:
            if term in text_lower:
                keywords.append(term)

        return keywords

    def parse_value(self, value_text: str) -> str:
        """Parse and normalize value text"""
        if not value_text:
            return "Not specified"

        # Clean up common formatting
        value_text = value_text.strip().replace('$', '').replace(',', '')

        # Add dollar sign back if it looks like a monetary value
        if any(char.isdigit() for char in value_text):
            if not value_text.startswith('$'):
                value_text = '$' + value_text

        return value_text

    async def create_session(self, config: Dict[str, Any]) -> aiohttp.ClientSession:
        """Create HTTP session with appropriate configuration"""
        scraping_config = config.get('scraping', {})
        timeout = aiohttp.ClientTimeout(total=scraping_config.get('timeout', 30))

        headers = {
            'User-Agent': scraping_config.get('user_agent', 'RFP-Scraper/2.0')
        }

        return aiohttp.ClientSession(timeout=timeout, headers=headers)