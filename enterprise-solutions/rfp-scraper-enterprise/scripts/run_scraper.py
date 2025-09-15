#!/usr/bin/env python3
"""
Simple CLI runner for RFP Scraper Enterprise
"""
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from core.main_application import main

if __name__ == "__main__":
    main()