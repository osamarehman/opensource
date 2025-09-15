# 🚀 Quick Start Guide - RFP Scraper Enterprise

## ⚡ 5-Minute Setup

### 1. Prerequisites Check
```bash
# Ensure you have Python 3.8+
python3 --version

# Optional: Docker for containerized deployment
docker --version
```

### 2. Quick Installation
```bash
# Navigate to the project directory
cd enterprise-solutions/rfp-scraper-enterprise

# Run the automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Basic Configuration
```bash
# Edit the main configuration file
nano config/config.yaml

# Minimum required settings:
email:
  sender_email: "your-email@gmail.com"
  sender_password: "your-app-password"
  recipient_email: "alerts@yourcompany.com"
```

### 4. First Run
```bash
# Activate environment
source venv/bin/activate

# Run a single scan
python3 -m src.core.main_application

# Or run in continuous mode
python3 -m src.core.main_application --continuous
```

## 🐳 Docker Quick Start

```bash
# Single command deployment
cd deployment/docker
docker-compose up -d

# Access services:
# - Metrics: http://localhost:8000/metrics
# - Grafana: http://localhost:3000 (admin/admin)
# - Prometheus: http://localhost:9090
```

## 🔧 Essential Commands

```bash
# Health check
python3 scripts/maintenance.py health

# View system stats
python3 scripts/maintenance.py stats

# Backup database
python3 scripts/maintenance.py backup

# Train ML model
python3 scripts/maintenance.py train
```

## 📊 Monitoring Access

- **Metrics Endpoint**: `http://localhost:8000/metrics`
- **Grafana Dashboard**: `http://localhost:3000` (admin/admin)
- **Prometheus**: `http://localhost:9090`

## 🔌 Add Custom Plugins

1. Create new plugin file in `plugins/` directory:
```python
from src.plugins.base_plugin import BaseRFPPlugin

class RFPPlugin(BaseRFPPlugin):
    def __init__(self):
        super().__init__()
        self.name = "my_custom_source"

    async def scrape(self, config):
        # Your scraping logic here
        return opportunities
```

2. Enable in `config/config.yaml`:
```yaml
plugins:
  enabled:
    - "my_custom_source"
```

## 🚨 Troubleshooting

**No opportunities found?**
- Check plugin configurations
- Verify network connectivity
- Review logs in `logs/` directory

**Email not working?**
- Verify SMTP settings
- Use app-specific passwords for Gmail
- Check firewall settings

**Need help?**
- Check the full README.md
- Run health check: `python3 scripts/maintenance.py health`
- View logs: `tail -f logs/rfp_scraper_*.log`

---

*Ready to monitor RFP opportunities at enterprise scale! 🎯*