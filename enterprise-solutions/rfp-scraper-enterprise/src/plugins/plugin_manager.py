#!/usr/bin/env python3
"""
Plugin architecture for different RFP sources
"""
import asyncio
import importlib.util
import logging
from pathlib import Path
from typing import List, Dict, Any
from ..core.models import RFPOpportunity


class PluginManager:
    """Plugin architecture for different RFP sources"""

    def __init__(self, plugin_dir: Path):
        self.plugin_dir = Path(plugin_dir)
        self.plugins = {}
        self.logger = logging.getLogger(__name__)
        self.load_plugins()

    def load_plugins(self):
        """Dynamically load scraping plugins"""
        if not self.plugin_dir.exists():
            self.plugin_dir.mkdir(parents=True)
            return

        for plugin_file in self.plugin_dir.glob("*.py"):
            if plugin_file.name.startswith("__"):
                continue

            try:
                spec = importlib.util.spec_from_file_location(
                    plugin_file.stem, plugin_file
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                if hasattr(module, 'RFPPlugin'):
                    plugin = module.RFPPlugin()
                    self.plugins[plugin.name] = plugin
                    self.logger.info(f"Loaded plugin: {plugin.name}")

            except Exception as e:
                self.logger.error(f"Failed to load plugin {plugin_file}: {e}")

    async def scrape_all_sources(self, config: Dict[str, Any]) -> List[RFPOpportunity]:
        """Scrape all enabled plugin sources concurrently"""
        enabled_plugins = config.get('plugins', {}).get('enabled', [])
        tasks = []

        for plugin_name in enabled_plugins:
            if plugin_name in self.plugins:
                plugin = self.plugins[plugin_name]
                task = asyncio.create_task(
                    self._scrape_with_timeout(plugin, config)
                )
                tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        opportunities = []
        for result in results:
            if isinstance(result, list):
                opportunities.extend(result)
            elif isinstance(result, Exception):
                self.logger.error(f"Plugin error: {result}")

        return opportunities

    async def _scrape_with_timeout(self, plugin, config):
        """Scrape with timeout protection"""
        timeout = config.get('plugins', {}).get('plugin_timeout', 60)
        try:
            return await asyncio.wait_for(
                plugin.scrape(config), timeout=timeout
            )
        except asyncio.TimeoutError:
            self.logger.error(f"Plugin {plugin.name} timed out")
            return []

    def get_plugin_info(self) -> Dict[str, Dict[str, str]]:
        """Get information about all loaded plugins"""
        return {
            name: {
                'name': plugin.name,
                'description': getattr(plugin, 'description', 'No description'),
                'version': getattr(plugin, 'version', '1.0.0')
            }
            for name, plugin in self.plugins.items()
        }

    def reload_plugins(self):
        """Reload all plugins (useful for development)"""
        self.plugins.clear()
        self.load_plugins()
        self.logger.info("All plugins reloaded")