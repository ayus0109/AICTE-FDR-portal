"""
AWS Lambda Handler for EventBridge Scheduled Daily Maturity Monitoring
Schedule: rate(1 day) or cron(0 0 * * ? *)
"""
import json
from app.db.session import SessionLocal
from app.services.maturity import run_maturity_check

def lambda_handler(event, context):
    print(f"[EventBridge Trigger] Received event: {json.dumps(event)}")
    db = SessionLocal()
    try:
        result = run_maturity_check(db=db, actor=None)
        print(f"[Maturity Check Completed]: {json.dumps(result)}")
        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }
    except Exception as e:
        print(f"[Maturity Check Error]: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
    finally:
        db.close()
