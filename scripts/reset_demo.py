import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal, Base, engine
from app.db.init_db import init_db

def main():
    print("=" * 60)
    print("AICTE FDR PORTAL - RESET & RESTORE HACKATHON DATASET")
    print("=" * 60)
    # Drop and recreate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_db(db)
        print("Demo dataset restored successfully to initial pristine state!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
