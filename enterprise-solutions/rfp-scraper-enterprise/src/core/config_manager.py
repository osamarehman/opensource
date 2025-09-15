#!/usr/bin/env python3
"""
Enhanced configuration management with encryption
"""
import os
import yaml
import logging
from pathlib import Path
from typing import Dict, Any
from cryptography.fernet import Fernet


class ConfigManager:
    """Enhanced configuration management with encryption"""

    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        self.key_path = Path(config_path).parent / '.encryption_key'
        self._cipher = self._get_or_create_cipher()
        self.logger = logging.getLogger(__name__)

    def _get_or_create_cipher(self):
        """Get or create encryption cipher"""
        if self.key_path.exists():
            with open(self.key_path, 'rb') as f:
                key = f.read()
        else:
            key = Fernet.generate_key()
            with open(self.key_path, 'wb') as f:
                f.write(key)
            os.chmod(self.key_path, 0o600)  # Restrict permissions
        return Fernet(key)

    def load_config(self) -> Dict[str, Any]:
        """Load and decrypt configuration"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r') as f:
                    config = yaml.safe_load(f)

                # Decrypt sensitive fields
                if 'email' in config and 'sender_password' in config['email']:
                    encrypted_password = config['email']['sender_password'].encode()
                    config['email']['sender_password'] = self._cipher.decrypt(encrypted_password).decode()

                return config
            else:
                return self._create_default_config()
        except Exception as e:
            self.logger.error(f"Config loading error: {e}")
            return self._create_default_config()

    def save_config(self, config: Dict[str, Any]):
        """Encrypt and save configuration"""
        # Encrypt sensitive fields
        config_copy = config.copy()
        if 'email' in config_copy and 'sender_password' in config_copy['email']:
            password = config_copy['email']['sender_password']
            encrypted_password = self._cipher.encrypt(password.encode()).decode()
            config_copy['email']['sender_password'] = encrypted_password

        with open(self.config_path, 'w') as f:
            yaml.dump(config_copy, f, default_flow_style=False)

    def _create_default_config(self) -> Dict[str, Any]:
        """Create comprehensive default configuration"""
        return {
            'email': {
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'sender_email': '',
                'sender_password': '',
                'recipient_email': '',
                'max_retries': 3,
                'timeout': 30
            },
            'scraping': {
                'timeout': 30,
                'retry_attempts': 3,
                'delay_between_requests': 2,
                'max_concurrent_requests': 5,
                'user_agent': 'RFP-Scraper/2.0',
                'rate_limit_per_minute': 60
            },
            'database': {
                'path': 'rfp_database.sqlite',
                'backup_frequency_hours': 24,
                'cleanup_days': 90
            },
            'monitoring': {
                'metrics_port': 8000,
                'health_check_interval': 300,
                'alert_thresholds': {
                    'error_rate': 0.1,
                    'response_time': 30.0
                }
            },
            'plugins': {
                'enabled': ['govtech_scraper', 'federal_opportunities'],
                'plugin_timeout': 60
            },
            'notifications': {
                'slack_webhook': '',
                'webhook_timeout': 10,
                'urgent_threshold_hours': 48
            },
            'scoring': {
                'urgency_weight': 3.0,
                'value_weight': 2.0,
                'keyword_weight': 1.5,
                'deadline_weight': 2.0
            },
            'ai_features': {
                'enabled': False,
                'model_path': 'models/rfp_classifier.pkl',
                'confidence_threshold': 0.8
            }
        }