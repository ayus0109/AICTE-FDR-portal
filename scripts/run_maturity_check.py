import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal
from app.services.maturity import run_maturity_check

def main():
    print("=" * 60)
    print("AICTE FDR PORTAL - AUTOMATED MATURITY MONITORING")
    print("=" * 60)
    db = SessionLocal()
    try:
        result = run_maturity_check(db)
        print(f"Status: {result['status']}")
        print(f"Total FDR Records Checked: {result['total_checked']}")
        print(f"Maturity Reminders Sent: {result['reminders_sent']}")
        print(f"Matured Records Updated: {result['matured_updated']}")
        print(f"Alerts Breakdown: {len(result.get('alerts_generated', []))} generated")
        for alert in result.get('alerts_generated', []):
            print(f"  • {alert['fdr_number']} -> {alert['recipient']} (Interval: {alert['interval']})")
    finally:
        db.close()

if __name__ == "__main__":
    main()
