#!/bin/bash
# enhanced_deploy.sh - Complete enterprise deployment script

set -e  # Exit on any error

echo "=== Enhanced RFP Scraper Deployment ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}💡 $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    # Check Python version
    if command -v python3 &> /dev/null; then
        python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
        if python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
            print_status "Python 3.8+ found: $(python3 --version)"
        else
            print_error "Python 3.8+ required. Current: $python_version"
            exit 1
        fi
    else
        print_error "Python 3 not found. Please install Python 3.8+"
        exit 1
    fi

    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_status "Docker found: $(docker --version)"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker not found - container deployment unavailable"
        DOCKER_AVAILABLE=false
    fi

    # Check available disk space
    available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 5000000 ]; then  # 5GB in KB
        print_warning "Low disk space. Recommended: 5GB+"
    fi
}

# Setup environment
setup_environment() {
    echo "Setting up environment..."

    # Create directory structure
    mkdir -p {logs,output,data/backups,ml/models}

    # Set up Python virtual environment
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi

    source venv/bin/activate

    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt

    print_status "Environment setup complete"
}

# Configure system
configure_system() {
    echo "Configuring system..."

    # Make scripts executable
    chmod +x scripts/*.sh 2>/dev/null || true

    # Generate encryption key for sensitive data
    if [ ! -f ".encryption_key" ]; then
        print_info "Generating encryption key..."
        python3 -c "
from cryptography.fernet import Fernet
import os
key = Fernet.generate_key()
with open('.encryption_key', 'wb') as f:
    f.write(key)
os.chmod('.encryption_key', 0o600)
print('✅ Encryption key generated')
"
    fi

    # Setup configuration
    if [ ! -f "config/config.yaml" ]; then
        print_info "Creating default configuration..."
        # Config file already exists from our setup
        print_warning "Please edit config/config.yaml with your email and notification settings"
    fi

    print_status "System configuration complete"
}

# Setup monitoring
setup_monitoring() {
    echo "Setting up monitoring..."

    # Create Prometheus configuration
    mkdir -p monitoring/prometheus

    if [ ! -f "monitoring/prometheus/alert_rules.yml" ]; then
        cat > monitoring/prometheus/alert_rules.yml << 'EOF'
groups:
  - name: rfp_scraper_alerts
    rules:
      - alert: RFPScraperDown
        expr: up{job="rfp-scraper"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "RFP Scraper is down"
          description: "RFP Scraper has been down for more than 2 minutes."

      - alert: HighErrorRate
        expr: rate(rfp_scrapes_total{status="error"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in RFP scraping"
          description: "Error rate is {{ $value }} errors per second."

      - alert: LowSuccessRate
        expr: rfp_system_health < 70
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low system health score"
          description: "System health score is {{ $value }}%."
EOF
    fi

    # Setup Grafana dashboard
    mkdir -p monitoring/grafana/dashboards

    if [ ! -f "monitoring/grafana/dashboards/dashboard.yml" ]; then
        cat > monitoring/grafana/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
    fi

    print_status "Monitoring setup complete"
}

# Setup automation
setup_automation() {
    echo "Setting up automation..."

    # Create wrapper script for cron
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PARENT_DIR="$(dirname "$SCRIPT_DIR")"

    cat > "$PARENT_DIR/run_scraper.sh" << EOF
#!/bin/bash
cd "$PARENT_DIR"
source venv/bin/activate
python3 -m src.core.main_application >> logs/cron.log 2>&1

# Check exit code and alert if needed
if [ \$? -ne 0 ]; then
    echo "Scraper failed at \$(date)" >> logs/errors.log
    # Could add additional alerting here
fi
EOF

    chmod +x "$PARENT_DIR/run_scraper.sh"

    # Setup cron job (ask user first)
    read -p "Setup automated cron job to run every 4 hours? (y/n): " setup_cron
    if [[ $setup_cron == "y" || $setup_cron == "Y" ]]; then
        CRON_JOB="# Enhanced RFP Scraper - Every 4 hours
0 */4 * * * $PARENT_DIR/run_scraper.sh"

        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        print_status "Cron job setup complete"
    else
        print_info "Skipped cron setup. Run manually with: ./run_scraper.sh"
    fi
}

# Docker deployment option
deploy_docker() {
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "Setting up Docker deployment..."

        cd deployment/docker

        # Build and start containers
        print_info "Building and starting Docker containers..."
        docker-compose up -d

        # Wait for services to be ready
        echo "Waiting for services to start..."
        sleep 30

        # Check health
        if curl -f http://localhost:8000/metrics >/dev/null 2>&1; then
            print_status "Docker deployment successful"
            echo ""
            print_info "🌐 Metrics available at: http://localhost:8000/metrics"
            print_info "📊 Grafana dashboard: http://localhost:3000 (admin/admin)"
            print_info "🔍 Prometheus: http://localhost:9090"
        else
            print_error "Docker deployment failed - services not responding"
            docker-compose logs rfp-scraper
        fi

        cd ../..
    fi
}

# Run health check
run_health_check() {
    echo "Running initial health check..."

    source venv/bin/activate

    # Simple Python health check
    python3 -c "
import sys
import os
sys.path.append('.')

try:
    from src.core.config_manager import ConfigManager
    from src.database.database_manager import DatabaseManager

    # Test configuration loading
    config_manager = ConfigManager('config/config.yaml')
    config = config_manager.load_config()

    # Test database initialization
    db_manager = DatabaseManager(config['database']['path'])

    print('✅ Health check passed')
    exit(0)
except Exception as e:
    print(f'❌ Health check failed: {e}')
    exit(1)
"
}

# Setup development environment
setup_development() {
    echo "Setting up development environment..."

    # Install development dependencies
    source venv/bin/activate
    pip install pytest pytest-asyncio black flake8

    # Setup pre-commit hooks
    cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/psf/black
    rev: 22.0.0
    hooks:
      - id: black
        language_version: python3
  - repo: https://github.com/pycqa/flake8
    rev: 5.0.4
    hooks:
      - id: flake8
        args: [--max-line-length=88, --extend-ignore=E203,W503]
EOF

    # Create test structure
    mkdir -p tests/{unit,integration}
    touch tests/__init__.py
    touch tests/unit/__init__.py
    touch tests/integration/__init__.py

    print_status "Development environment setup complete"
}

# Main deployment flow
main() {
    clear
    echo "🚀 RFP Scraper Enterprise Setup"
    echo "================================"
    echo ""

    check_prerequisites
    setup_environment
    configure_system
    setup_monitoring
    setup_automation

    # Ask for deployment type
    echo ""
    echo "Choose deployment type:"
    echo "1) Standard deployment (recommended for development)"
    echo "2) Docker deployment (recommended for production)"
    echo "3) Development setup (includes testing tools)"
    read -p "Enter choice (1-3): " choice

    case $choice in
        1)
            print_status "Standard deployment selected"
            ;;
        2)
            deploy_docker
            ;;
        3)
            setup_development
            print_status "Development setup complete"
            ;;
        *)
            print_warning "Invalid choice. Using standard deployment."
            ;;
    esac

    run_health_check

    echo ""
    echo "🎉 Enhanced RFP Scraper Deployment Complete!"
    echo ""
    print_info "📋 Quick Start Commands:"
    echo "  Manual run: source venv/bin/activate && python3 -m src.core.main_application"
    echo "  Continuous mode: python3 -m src.core.main_application --continuous"
    echo "  Docker logs: docker-compose -f deployment/docker/docker-compose.yml logs -f"
    echo ""
    print_info "🔧 Configuration:"
    echo "  Edit config/config.yaml for email and notification settings"
    echo "  Add custom plugins to plugins/ directory"
    echo "  Monitor metrics at http://localhost:8000/metrics"
    echo ""
    print_info "📅 Next Steps:"
    echo "  1. Configure email settings in config/config.yaml"
    echo "  2. Test with: python3 -m src.core.main_application"
    echo "  3. Review logs in logs/ directory"
    echo "  4. Set up monitoring dashboards"
    echo ""
    print_warning "⚠️  Remember to:"
    echo "  - Keep your encryption key (.encryption_key) secure"
    echo "  - Configure firewall rules for port 8000 (metrics)"
    echo "  - Set up log rotation for production use"
}

# Handle script arguments
case "${1:-}" in
    "--docker-only")
        deploy_docker
        ;;
    "--health-check")
        run_health_check
        ;;
    "--dev")
        setup_development
        ;;
    *)
        main "$@"
        ;;
esac