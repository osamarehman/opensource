#!/usr/bin/env python3
"""
Data models for RFP opportunities and system components
"""
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
import hashlib
import json


@dataclass
class RFPOpportunity:
    """Structured RFP opportunity data"""
    title: str
    agency: str
    deadline: str
    value: str
    urgency: str
    contact: str
    url: str = ""
    description: str = ""
    keywords: List[str] = None
    discovered_at: datetime = None
    score: float = 0.0

    def __post_init__(self):
        if self.discovered_at is None:
            self.discovered_at = datetime.now(timezone.utc)
        if self.keywords is None:
            self.keywords = []

    def generate_hash(self) -> str:
        """Generate unique hash for deduplication"""
        content = f"{self.title}{self.agency}{self.deadline}{self.url}"
        return hashlib.md5(content.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        data = asdict(self)
        data['discovered_at'] = self.discovered_at.isoformat()
        return data


@dataclass
class ScrapeSession:
    """Scraping session metadata"""
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "started"
    opportunities_found: int = 0
    errors: str = ""
    duration_seconds: float = 0.0
    source: str = "automated"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'opportunities_found': self.opportunities_found,
            'errors': self.errors,
            'duration_seconds': self.duration_seconds,
            'source': self.source
        }


@dataclass
class SystemMetric:
    """System performance metric"""
    name: str
    value: float
    timestamp: datetime = None
    metadata: Optional[str] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)


@dataclass
class Alert:
    """System alert definition"""
    severity: str  # critical, warning, info
    message: str
    metric: str
    value: float
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)