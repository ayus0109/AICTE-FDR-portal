import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal
from app.db.init_db import init_db

def main():
    print("=" * 60)
    print("AICTE FDR PORTAL - DATABASE SEED INITIALIZATION")
    print("=" * 60)
    db = SessionLocal()
    try:
        init_db(db)
        print("Database seed complete!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
