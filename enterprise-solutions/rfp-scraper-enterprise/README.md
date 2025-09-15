# RFP Scraper Enterprise

## 🚀 Enterprise-Grade RFP Monitoring System

A comprehensive, production-ready system for automated RFP (Request for Proposal) discovery, analysis, and notification with advanced monitoring, ML-powered scoring, and enterprise deployment capabilities.

## 🌟 Key Features

### 🔧 **Robustness & Reliability**
- Circuit breaker pattern for fault tolerance
- Exponential backoff retry mechanisms
- Comprehensive error handling and recovery
- Database-backed persistence with deduplication
- Health checks and system monitoring

### 🚀 **Performance & Scalability**
- Async/concurrent processing with aiohttp
- Connection pooling and rate limiting
- Plugin architecture for different RFP sources
- Metrics collection with Prometheus
- Docker containerization for easy deployment

### 🔒 **Security & Configuration**
- Encrypted configuration storage
- Environment-specific settings
- Input validation and sanitization
- Secure credential management

### 📊 **Monitoring & Alerting**
- Real-time metrics dashboard
- Advanced alerting with throttling
- Performance monitoring
- System health scoring
- Grafana visualization

### 🤖 **Advanced Features**
- Machine learning-powered opportunity scoring
- Natural language processing for content analysis
- Automated model retraining
- Intelligent classification and prioritization

### 🛠 **Operations & Maintenance**
- Automated deployment scripts
- Database backup and cleanup
- Log rotation and management
- Health check endpoints
- CI/CD ready structure

## 📁 Project Structure

```
enterprise-solutions/rfp-scraper-enterprise/
├── src/                          # Core application code
│   ├── core/                     # Core business logic
│   │   ├── models.py            # Data models and structures
│   │   ├── config_manager.py    # Configuration management
│   │   ├── circuit_breaker.py   # Fault tolerance patterns
│   │   └── main_application.py  # Main application entry point
│   ├── database/                # Database management
│   │   └── database_manager.py  # SQLite database operations
│   ├── plugins/                 # Plugin system
│   │   ├── plugin_manager.py    # Plugin loading and management
│   │   └── base_plugin.py       # Base plugin interface
│   ├── monitoring/              # Monitoring and metrics
│   │   ├── metrics_collector.py # System metrics collection
│   │   └── alerting_system.py   # Alert management
│   ├── notifications/           # Notification system
│   │   └── notification_manager.py # Email/Slack notifications
│   └── ml/                      # Machine learning components
│       └── opportunity_scorer.py # ML-based scoring system
├── plugins/                     # Plugin implementations
│   ├── govtech_scraper.py      # Government tech opportunities
│   └── federal_opportunities.py # Federal contract sources
├── config/                      # Configuration files
│   └── config.yaml             # Main configuration
├── deployment/                  # Deployment configurations
│   ├── docker/                 # Docker setup
│   │   ├── Dockerfile          # Application container
│   │   └── docker-compose.yml  # Full stack deployment
│   └── kubernetes/             # Kubernetes manifests
│       └── deployment.yaml     # K8s deployment
├── monitoring/                  # Monitoring setup
│   ├── prometheus/             # Prometheus configuration
│   └── grafana/               # Grafana dashboards
├── scripts/                    # Utility scripts
│   └── setup.sh              # Setup and deployment script
├── docs/                      # Documentation
├── tests/                     # Test suites
├── logs/                      # Application logs
├── output/                    # Generated reports
└── data/                      # Database and data files
```

## 🛠 Quick Start

### Prerequisites

- Python 3.8+
- Docker (optional, for containerized deployment)
- 2GB+ available memory
- 5GB+ available disk space

### 1. Basic Installation

```bash
# Clone or download the project
cd enterprise-solutions/rfp-scraper-enterprise

# Install dependencies
pip install -r requirements.txt

# Copy and configure settings
cp config/config.yaml config/config.local.yaml
# Edit config/config.local.yaml with your settings
```

### 2. Configuration

Edit `config/config.yaml` with your settings:

```yaml
email:
  smtp_server: "smtp.gmail.com"
  smtp_port: 587
  sender_email: "your-email@gmail.com"
  sender_password: "your-app-password"
  recipient_email: "alerts@yourcompany.com"

notifications:
  slack_webhook: "https://hooks.slack.com/services/..."
```

### 3. Run Single Scan

```bash
python -m src.core.main_application
```

### 4. Run Continuous Mode

```bash
python -m src.core.main_application --continuous
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
cd deployment/docker
docker-compose up -d
```

This starts:
- RFP Scraper application
- Prometheus metrics collection
- Grafana dashboards
- Redis (optional caching)

Access points:
- **Metrics**: http://localhost:8000/metrics
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

### Custom Docker Build

```bash
# Build image
docker build -f deployment/docker/Dockerfile -t rfp-scraper:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/config \
  rfp-scraper:latest
```

## ☸️ Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f deployment/kubernetes/deployment.yaml

# Check deployment status
kubectl get pods -l app=rfp-scraper

# Access logs
kubectl logs -l app=rfp-scraper -f
```

## 🔌 Plugin Development

Create custom RFP source plugins by extending the base plugin:

```python
from src.plugins.base_plugin import BaseRFPPlugin
from src.core.models import RFPOpportunity

class MyCustomPlugin(BaseRFPPlugin):
    def __init__(self):
        super().__init__()
        self.name = "my_custom_source"
        self.description = "Custom RFP source scraper"

    async def scrape(self, config):
        # Implement your scraping logic
        opportunities = []
        # ... scraping code ...
        return opportunities
```

Save as `plugins/my_custom_source.py` and add to enabled plugins in config.

## 📊 Monitoring & Metrics

### Available Metrics

- **System Health**: Overall system health score (0-100)
- **Scrape Success Rate**: Percentage of successful scraping sessions
- **Opportunities Found**: Number of opportunities discovered
- **Response Time**: Average response time for scraping operations
- **Resource Usage**: CPU, memory, and disk utilization

### Alerting

The system includes intelligent alerting with:
- **Email notifications** for system alerts
- **Slack integration** for urgent opportunities
- **Throttling** to prevent alert spam
- **Multiple severity levels** (critical, warning, info)

## 🧠 Machine Learning Features

### Automatic Scoring

Opportunities are automatically scored (0-10) based on:
- **Urgency level** and deadline proximity
- **Contract value** and size indicators
- **Keyword relevance** to your business
- **Agency type** and historical success rates

### Model Training

The system automatically retrains ML models when sufficient new data is available:

```python
# Manual model training
from src.ml.opportunity_scorer import MLOpportunityScorer
from src.database.database_manager import DatabaseManager

db_manager = DatabaseManager("data/rfp_database.sqlite")
scorer = MLOpportunityScorer(db_manager)
scorer.train_model()
```

## 🔧 Configuration Options

### Core Settings

```yaml
scraping:
  timeout: 30                    # Request timeout (seconds)
  retry_attempts: 3              # Number of retry attempts
  delay_between_requests: 2      # Delay between requests (seconds)
  max_concurrent_requests: 5     # Maximum concurrent requests

database:
  path: "data/rfp_database.sqlite"
  backup_frequency_hours: 24
  cleanup_days: 90              # Data retention period

monitoring:
  metrics_port: 8000            # Prometheus metrics port
  health_check_interval: 300    # Health check frequency (seconds)

ai_features:
  enabled: true                 # Enable ML scoring
  confidence_threshold: 0.8     # ML confidence threshold
  retrain_threshold: 20         # Opportunities before retrain
```

## 🧪 Testing

```bash
# Run unit tests
python -m pytest tests/unit/

# Run integration tests
python -m pytest tests/integration/

# Run with coverage
python -m pytest --cov=src tests/
```

## 📈 Performance Tuning

### For High-Volume Deployment

1. **Increase concurrent requests**:
   ```yaml
   scraping:
     max_concurrent_requests: 10
   ```

2. **Adjust rate limiting**:
   ```yaml
   scraping:
     rate_limit_per_minute: 120
   ```

3. **Scale with multiple containers**:
   ```bash
   docker-compose up --scale rfp-scraper=3
   ```

## 🔍 Troubleshooting

### Common Issues

**No opportunities found**:
- Check plugin configurations
- Verify target website accessibility
- Review scraping logs in `logs/` directory

**Email notifications not working**:
- Verify SMTP settings and credentials
- Check firewall/network connectivity
- Enable "Less secure app access" for Gmail

**High memory usage**:
- Reduce `max_concurrent_requests`
- Increase `delay_between_requests`
- Check for memory leaks in custom plugins

### Log Files

- **Application logs**: `logs/rfp_scraper_YYYYMMDD.log`
- **Audit trail**: `logs/audit.log`
- **Error logs**: `logs/errors.log`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review logs in the `logs/` directory
- Create an issue with detailed error information
- Include system information and configuration (redacted)

## 🗺 Roadmap

### Upcoming Features

- [ ] **Web Dashboard**: Real-time web interface for monitoring
- [ ] **API Endpoints**: RESTful API for external integrations
- [ ] **Advanced ML**: Deep learning models for better scoring
- [ ] **Multi-tenant**: Support for multiple organizations
- [ ] **Cloud Integration**: AWS/Azure/GCP deployment templates
- [ ] **Advanced Analytics**: Trend analysis and predictions

---

*Enterprise RFP Scraper v2.0 - Automated opportunity discovery for the modern enterprise*