import os
import sys
import time
import subprocess

def main():
    # 1. Wait for PostgreSQL database if configured
    db_url = os.environ.get("DATABASE_URL", "sqlite:///./inventory.db")
    if db_url.startswith("postgresql"):
        print("Waiting for PostgreSQL database to be ready...")
        import psycopg2
        while True:
            try:
                conn = psycopg2.connect(db_url)
                conn.close()
                break
            except Exception as e:
                print("Database is unavailable - sleeping 1s")
                time.sleep(1)
        print("PostgreSQL database is ready.")

    # 2. Initialize and seed database
    print("Database tables creation...")
    # Add app directory to path if needed (default is OK in working dir)
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    from app.db.session import Base, engine, SessionLocal
    from app.db.seed import seed_database
    
    Base.metadata.create_all(bind=engine)
    
    print("Seeding database (if empty)...")
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    # 3. Print access links
    print("\n" + "="*55)
    print("ETHARA AI SYSTEM SETTLED & ONLINE")
    print("Frontend Console: http://localhost:5173")
    print("Backend API:      http://localhost:8000")
    print("="*55 + "\n")
    sys.stdout.flush()

    # 4. Start uvicorn server
    cmd = ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    subprocess.run(cmd)

if __name__ == "__main__":
    main()
