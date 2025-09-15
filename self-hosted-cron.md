# Complete Solution for Automated RFP Scraping System

## **Phase 1: Automation Setup (Priority 1)**

### Step 1: Enhanced Main Script with Logging and Error Handling

```python
#!/usr/bin/env python3
"""
Enhanced RFP Scraper with comprehensive logging and error handling
"""
import os
import sys
import logging
import traceback
import csv
import json
from datetime import datetime, timezone
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import time
import requests
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent
LOG_DIR = BASE_DIR / "logs"
OUTPUT_DIR = BASE_DIR / "output"
CONFIG_FILE = BASE_DIR / "config.json"

# Create directories
LOG_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

class RFPScraperAutomated:
    def __init__(self):
        self.setup_logging()
        self.load_config()
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def setup_logging(self):
        """Configure comprehensive logging"""
        log_file = LOG_DIR / f"rfp_scraper_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def load_config(self):
        """Load configuration from JSON file"""
        try:
            with open(CONFIG_FILE, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            self.logger.error(f"Config file not found: {CONFIG_FILE}")
            self.create_default_config()
            
    def create_default_config(self):
        """Create default configuration file"""
        default_config = {
            "email": {
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "sender_email": "your-email@gmail.com",
                "sender_password": "your-app-password",
                "recipient_email": "client-email@domain.com"
            },
            "scraping": {
                "timeout": 30,
                "retry_attempts": 3,
                "delay_between_requests": 2
            },
            "file_management": {
                "keep_files_days": 30,
                "max_log_files": 10
            }
        }
        
        with open(CONFIG_FILE, 'w') as f:
            json.dump(default_config, f, indent=4)
        
        self.config = default_config
        self.logger.info(f"Created default config file: {CONFIG_FILE}")
        
    def cleanup_old_files(self):
        """Clean up old output files and logs"""
        try:
            keep_days = self.config['file_management']['keep_files_days']
            cutoff_time = time.time() - (keep_days * 24 * 60 * 60)
            
            # Clean output files
            for file_path in OUTPUT_DIR.glob("*.csv"):
                if file_path.stat().st_mtime < cutoff_time:
                    file_path.unlink()
                    self.logger.info(f"Deleted old output file: {file_path}")
                    
            # Clean old log files
            log_files = sorted(LOG_DIR.glob("*.log"), key=lambda x: x.stat().st_mtime)
            max_logs = self.config['file_management']['max_log_files']
            
            if len(log_files) > max_logs:
                for old_log in log_files[:-max_logs]:
                    old_log.unlink()
                    self.logger.info(f"Deleted old log file: {old_log}")
                    
        except Exception as e:
            self.logger.error(f"Error during cleanup: {str(e)}")
            
    def scrape_opportunities(self):
        """Main scraping logic with error handling and retries"""
        opportunities = []
        
        try:
            # Your existing scraping logic here
            # This is a placeholder - you'll integrate your actual instant_rfp_finder.py logic
            
            self.logger.info("Starting RFP scraping process...")
            
            # Simulate scraping with retry logic
            for attempt in range(self.config['scraping']['retry_attempts']):
                try:
                    # Replace this with your actual scraping code
                    opportunities = self.perform_scraping()
                    break
                except Exception as e:
                    self.logger.warning(f"Scraping attempt {attempt + 1} failed: {str(e)}")
                    if attempt < self.config['scraping']['retry_attempts'] - 1:
                        time.sleep(self.config['scraping']['delay_between_requests'])
                    else:
                        raise
                        
            self.logger.info(f"Successfully scraped {len(opportunities)} opportunities")
            return opportunities
            
        except Exception as e:
            self.logger.error(f"Scraping failed after all retries: {str(e)}")
            self.logger.error(traceback.format_exc())
            return []
            
    def perform_scraping(self):
        """Placeholder for actual scraping logic"""
        # Replace this with your actual instant_rfp_finder.py logic
        # This is just a simulation
        return [
            {
                'title': 'Payment Processing RFP',
                'agency': 'Department of Commerce',
                'deadline': '2025-09-20',
                'value': '$500,000',
                'urgency': 'High',
                'contact': 'procurement@commerce.gov'
            }
        ]
        
    def save_to_csv(self, opportunities):
        """Save opportunities to CSV with timestamp"""
        if not opportunities:
            self.logger.warning("No opportunities to save")
            return None
            
        csv_file = OUTPUT_DIR / f"rfp_opportunities_{self.timestamp}.csv"
        
        try:
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=opportunities[0].keys())
                writer.writeheader()
                writer.writerows(opportunities)
                
            self.logger.info(f"Saved {len(opportunities)} opportunities to {csv_file}")
            return csv_file
            
        except Exception as e:
            self.logger.error(f"Error saving CSV: {str(e)}")
            return None
            
    def send_email_alert(self, opportunities, csv_file):
        """Send email alert with CSV attachment"""
        try:
            email_config = self.config['email']
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = f"RFP Alert: {len(opportunities)} New Opportunities Found - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            # Create email body
            body = self.create_email_body(opportunities)
            msg.attach(MIMEText(body, 'html'))
            
            # Attach CSV file
            if csv_file and csv_file.exists():
                with open(csv_file, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {csv_file.name}'
                )
                msg.attach(part)
                
            # Send email
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender_email'], email_config['sender_password'])
            server.send_message(msg)
            server.quit()
            
            self.logger.info(f"Email sent successfully to {email_config['recipient_email']}")
            
        except Exception as e:
            self.logger.error(f"Email sending failed: {str(e)}")
            self.logger.error(traceback.format_exc())
            
    def create_email_body(self, opportunities):
        """Create professional HTML email body"""
        urgent_count = sum(1 for opp in opportunities if opp.get('urgency', '').lower() == 'high')
        
        html = f"""
        <html>
        <body>
            <h2>🚨 RFP Opportunities Alert</h2>
            <p><strong>Scan Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S EST')}</p>
            <p><strong>Total Opportunities:</strong> {len(opportunities)}</p>
            <p><strong>Urgent Opportunities:</strong> {urgent_count}</p>
            
            <h3>⚡ Urgent Opportunities (Action Required)</h3>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th>Title</th>
                    <th>Agency</th>
                    <th>Deadline</th>
                    <th>Value</th>
                </tr>
        """
        
        for opp in opportunities:
            if opp.get('urgency', '').lower() == 'high':
                html += f"""
                <tr style="background-color: #ffe6e6;">
                    <td>{opp.get('title', 'N/A')}</td>
                    <td>{opp.get('agency', 'N/A')}</td>
                    <td>{opp.get('deadline', 'N/A')}</td>
                    <td>{opp.get('value', 'N/A')}</td>
                </tr>
                """
        
        html += """
            </table>
            
            <h3>📊 All Opportunities</h3>
            <p>Complete details are available in the attached CSV file.</p>
            
            <p><strong>Next automated scan:</strong> In 4 hours</p>
            
            <hr>
            <p><small>This is an automated message from the RFP Scraping System</small></p>
        </body>
        </html>
        """
        
        return html
        
    def run_health_check(self):
        """Perform system health check"""
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'status': 'healthy',
            'issues': []
        }
        
        # Check disk space
        disk_usage = os.statvfs(BASE_DIR)
        free_space_gb = (disk_usage.f_bavail * disk_usage.f_frsize) / (1024**3)
        
        if free_space_gb < 1:  # Less than 1GB free
            health_status['issues'].append(f"Low disk space: {free_space_gb:.2f}GB remaining")
            health_status['status'] = 'warning'
            
        # Check config file
        if not CONFIG_FILE.exists():
            health_status['issues'].append("Configuration file missing")
            health_status['status'] = 'error'
            
        # Log health status
        if health_status['status'] == 'healthy':
            self.logger.info("Health check passed")
        else:
            self.logger.warning(f"Health check issues: {health_status['issues']}")
            
        return health_status
        
    def run(self):
        """Main execution method"""
        try:
            start_time = time.time()
            self.logger.info("=== RFP Scraper Automated Run Started ===")
            
            # Health check
            health = self.run_health_check()
            if health['status'] == 'error':
                self.logger.error("Health check failed, aborting run")
                return False
                
            # Clean up old files
            self.cleanup_old_files()
            
            # Scrape opportunities
            opportunities = self.scrape_opportunities()
            
            if opportunities:
                # Save to CSV
                csv_file = self.save_to_csv(opportunities)
                
                # Send email alert
                self.send_email_alert(opportunities, csv_file)
                
                execution_time = time.time() - start_time
                self.logger.info(f"=== Run completed successfully in {execution_time:.2f} seconds ===")
                return True
            else:
                self.logger.warning("No opportunities found in this run")
                return False
                
        except Exception as e:
            self.logger.error(f"Critical error in main execution: {str(e)}")
            self.logger.error(traceback.format_exc())
            return False

if __name__ == "__main__":
    scraper = RFPScraperAutomated()
    success = scraper.run()
    sys.exit(0 if success else 1)
```

### Step 2: Cron Job Configuration

Create the cron setup script:

```bash
#!/bin/bash
# setup_cron.sh - Configure automated scheduling

# Set up the cron job for 5x daily execution
# Times: 6 AM, 10 AM, 2 PM, 6 PM, 10 PM EST

echo "Setting up RFP Scraper automation..."

# Get the current script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/rfp_scraper_automated.py"

# Make sure the script is executable
chmod +x "$PYTHON_SCRIPT"

# Create the cron job entry
CRON_JOB="# RFP Scraper - 5x Daily Automation (EST)
0 11,15,19,23,3 * * * cd $SCRIPT_DIR && /usr/bin/python3 $PYTHON_SCRIPT >> $SCRIPT_DIR/logs/cron.log 2>&1"

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job configured successfully!"
echo "Schedule: 6 AM, 10 AM, 2 PM, 6 PM, 10 PM EST"
echo "Logs: $SCRIPT_DIR/logs/"

# Test the script once
echo "Running test execution..."
cd "$SCRIPT_DIR" && python3 "$PYTHON_SCRIPT"
```

## **Phase 2: Email Configuration (Priority 2)**

### Step 3: Email Configuration Setup

Create email configuration script:

```python
#!/usr/bin/env python3
"""
Email configuration and testing script
"""
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import getpass

def setup_email_config():
    """Interactive email configuration setup"""
    print("=== RFP Scraper Email Configuration ===")
    
    config = {
        "email": {
            "smtp_server": input("SMTP Server (default: smtp.gmail.com): ").strip() or "smtp.gmail.com",
            "smtp_port": int(input("SMTP Port (default: 587): ").strip() or "587"),
            "sender_email": input("Sender Email: ").strip(),
            "sender_password": getpass.getpass("Sender Password/App Password: "),
            "recipient_email": input("Recipient Email: ").strip()
        },
        "scraping": {
            "timeout": 30,
            "retry_attempts": 3,
            "delay_between_requests": 2
        },
        "file_management": {
            "keep_files_days": 30,
            "max_log_files": 10
        }
    }
    
    # Save configuration
    with open('config.json', 'w') as f:
        json.dump(config, f, indent=4)
    
    print("Configuration saved to config.json")
    
    # Test email
    if input("Test email configuration? (y/n): ").lower() == 'y':
        test_email(config)

def test_email(config):
    """Test email configuration"""
    try:
        email_config = config['email']
        
        # Create test message
        msg = MIMEMultipart()
        msg['From'] = email_config['sender_email']
        msg['To'] = email_config['recipient_email']
        msg['Subject'] = "RFP Scraper - Email Configuration Test"
        
        body = """
        <html>
        <body>
            <h2>✅ Email Configuration Test Successful</h2>
            <p>Your RFP Scraper email system is configured correctly!</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
                <li>SMTP Server: {}</li>
                <li>SMTP Port: {}</li>
                <li>Sender: {}</li>
                <li>Recipient: {}</li>
            </ul>
            <p>You will now receive automated RFP alerts at this email address.</p>
        </body>
        </html>
        """.format(
            email_config['smtp_server'],
            email_config['smtp_port'],
            email_config['sender_email'],
            email_config['recipient_email']
        )
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send test email
        server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
        server.starttls()
        server.login(email_config['sender_email'], email_config['sender_password'])
        server.send_message(msg)
        server.quit()
        
        print("✅ Test email sent successfully!")
        
    except Exception as e:
        print(f"❌ Email test failed: {str(e)}")
        print("Please check your configuration and try again.")

if __name__ == "__main__":
    setup_email_config()
```

## **Phase 3: System Optimization (Priority 3)**

### Step 4: Monitoring and Health Check Script

```python
#!/usr/bin/env python3
"""
System monitoring and health check script
"""
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import subprocess

class SystemMonitor:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.log_dir = self.base_dir / "logs"
        self.output_dir = self.base_dir / "output"
        
    def check_cron_job(self):
        """Check if cron job is properly configured"""
        try:
            result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
            cron_content = result.stdout
            
            if 'rfp_scraper_automated.py' in cron_content:
                return {"status": "active", "message": "Cron job is configured"}
            else:
                return {"status": "error", "message": "Cron job not found"}
                
        except Exception as e:
            return {"status": "error", "message": f"Error checking cron: {str(e)}"}
            
    def check_recent_runs(self):
        """Check recent execution logs"""
        try:
            log_files = list(self.log_dir.glob("rfp_scraper_*.log"))
            if not log_files:
                return {"status": "warning", "message": "No log files found"}
                
            # Check most recent log
            latest_log = max(log_files, key=lambda x: x.stat().st_mtime)
            
            # Check if there's been a run in the last 5 hours
            five_hours_ago = datetime.now() - timedelta(hours=5)
            last_modified = datetime.fromtimestamp(latest_log.stat().st_mtime)
            
            if last_modified > five_hours_ago:
                return {"status": "healthy", "message": f"Recent run at {last_modified}"}
            else:
                return {"status": "warning", "message": f"Last run was at {last_modified}"}
                
        except Exception as e:
            return {"status": "error", "message": f"Error checking logs: {str(e)}"}
            
    def check_output_files(self):
        """Check recent output files"""
        try:
            csv_files = list(self.output_dir.glob("rfp_opportunities_*.csv"))
            
            if not csv_files:
                return {"status": "warning", "message": "No output files found"}
                
            # Check most recent output
            latest_output = max(csv_files, key=lambda x: x.stat().st_mtime)
            last_modified = datetime.fromtimestamp(latest_output.stat().st_mtime)
            
            # Count lines (opportunities)
            with open(latest_output, 'r') as f:
                line_count = sum(1 for line in f) - 1  # Subtract header
                
            return {
                "status": "healthy", 
                "message": f"Latest: {latest_output.name} with {line_count} opportunities at {last_modified}"
            }
            
        except Exception as e:
            return {"status": "error", "message": f"Error checking outputs: {str(e)}"}
            
    def check_disk_space(self):
        """Check available disk space"""
        try:
            disk_usage = os.statvfs(self.base_dir)
            free_space_gb = (disk_usage.f_bavail * disk_usage.f_frsize) / (1024**3)
            
            if free_space_gb > 5:
                return {"status": "healthy", "message": f"{free_space_gb:.2f}GB free"}
            elif free_space_gb > 1:
                return {"status": "warning", "message": f"Low space: {free_space_gb:.2f}GB free"}
            else:
                return {"status": "error", "message": f"Critical: {free_space_gb:.2f}GB free"}
                
        except Exception as e:
            return {"status": "error", "message": f"Error checking disk: {str(e)}"}
            
    def generate_report(self):
        """Generate comprehensive system report"""
        print("=== RFP Scraper System Health Report ===")
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        checks = [
            ("Cron Job Status", self.check_cron_job()),
            ("Recent Executions", self.check_recent_runs()),
            ("Output Files", self.check_output_files()),
            ("Disk Space", self.check_disk_space())
        ]
        
        overall_status = "healthy"
        
        for check_name, result in checks:
            status_icon = {
                "healthy": "✅",
                "warning": "⚠️",
                "error": "❌"
            }.get(result["status"], "❓")
            
            print(f"{status_icon} {check_name}: {result['message']}")
            
            if result["status"] == "error":
                overall_status = "error"
            elif result["status"] == "warning" and overall_status == "healthy":
                overall_status = "warning"
                
        print()
        print(f"Overall System Status: {overall_status.upper()}")
        
        if overall_status != "healthy":
            print("\n📋 Recommended Actions:")
            if overall_status == "error":
                print("- Check error logs in the logs/ directory")
                print("- Verify cron job configuration")
                print("- Check email configuration")
            else:
                print("- Monitor system for the next few runs")
                print("- Consider increasing disk space if needed")

if __name__ == "__main__":
    monitor = SystemMonitor()
    monitor.generate_report()
```

### Step 5: Deployment Script

```bash
#!/bin/bash
# deploy_rfp_system.sh - Complete deployment script

echo "=== RFP Scraper System Deployment ==="

# Set up directory structure
echo "Creating directory structure..."
mkdir -p logs output

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install requests beautifulsoup4 lxml

# Make scripts executable
chmod +x rfp_scraper_automated.py
chmod +x email_config.py
chmod +x system_monitor.py

# Set up email configuration
echo "Setting up email configuration..."
python3 email_config.py

# Set up cron job
echo "Configuring automation..."
bash setup_cron.sh

# Run initial health check
echo "Running initial health check..."
python3 system_monitor.py

echo "=== Deployment Complete ==="
echo ""
echo "📋 Next Steps:"
echo "1. Monitor logs in the logs/ directory"
echo "2. Check system health: python3 system_monitor.py"
echo "3. View cron jobs: crontab -l"
echo "4. Manual test run: python3 rfp_scraper_automated.py"
echo ""
echo "🕐 Automated runs scheduled for:"
echo "- 6:00 AM EST"
echo "- 10:00 AM EST" 
echo "- 2:00 PM EST"
echo "- 6:00 PM EST"
echo "- 10:00 PM EST"
```

## **Phase 4: Documentation & Troubleshooting**

### Step 6: Create Documentation

```markdown
# RFP Scraper System Documentation

## System Overview
Automated RFP (Request for Proposal) scraping system that runs 5 times daily and sends email alerts with CSV attachments.

## Directory Structure
```
rfp-scraper/
├── rfp_scraper_automated.py    # Main scraper script
├── email_config.py             # Email configuration setup
├── system_monitor.py           # Health monitoring
├── setup_cron.sh               # Cron job setup
├── deploy_rfp_system.sh        # Complete deployment
├── config.json                 # System configuration
├── logs/                       # Log files
│   ├── rfp_scraper_YYYYMMDD.log
│   └── cron.log
└── output/                     # CSV output files
    └── rfp_opportunities_YYYYMMDD_HHMMSS.csv
```

## Configuration

### Email Settings (config.json)
```
{
  "email": {
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "sender_email": "your-email@gmail.com",
    "sender_password": "your-app-password",
    "recipient_email": "client-email@domain.com"
  }
}
```

## Daily Operations

### Check System Status
```
python3 system_monitor.py
```

### Manual Run
```
python3 rfp_scraper_automated.py
```

### View Logs
```
tail -f logs/rfp_scraper_$(date +%Y%m%d).log
```

### Check Cron Jobs
```
crontab -l
```

## Troubleshooting

### Issue: No emails received
1. Check email configuration: `python3 email_config.py`
2. Verify SMTP settings in config.json
3. Check sender email app password
4. Review logs for email errors

### Issue: Automation not running
1. Verify cron job: `crontab -l`
2. Check cron logs: `tail logs/cron.log`
3. Test manual execution
4. Verify script permissions: `chmod +x rfp_scraper_automated.py`

### Issue: No opportunities found
1. Check scraping logic in perform_scraping()
2. Verify internet connectivity
3. Review target websites for changes
4. Check timeout settings

### Issue: System performance
1. Monitor disk space: `df -h`
2. Check CPU/memory usage: `htop`
3. Review log file sizes
4. Clean old files: automated in script

## Monitoring

### Key Metrics
- Successful runs per day: 5
- Average opportunities found: 10-25
- Email delivery success rate: >95%
- System uptime: >99%

### Log Rotation
- Daily log files created automatically
- Old logs cleaned after 10 files
- Output files kept for 30 days

## Maintenance

### Weekly Tasks
- Review system health report
- Check email delivery success
- Monitor disk space usage
- Verify cron job execution

### Monthly Tasks
- Update dependencies if needed
- Review scraping success rates
- Optimize performance if needed
- Backup configuration files
```

