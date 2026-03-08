import os
import sys
from sqlalchemy import create_engine, text
from app.config import settings

def test_db():
    print(f"Current DATABASE_URL in settings: {settings.database_url}")
    
    # In production, SQLAlchemy requires 'postgresql://' instead of 'postgres://'
    db_url = settings.database_url
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            # Check for users
            result = conn.execute(text("SELECT count(*) FROM users"))
            print(f"Users in current DB: {result.scalar()}")
            
            # Check for listings
            result = conn.execute(text("SELECT count(*) FROM produce_listings"))
            print(f"Listings in current DB: {result.scalar()}")
            
    except Exception as e:
        print(f"Error connecting to DB: {e}")

if __name__ == "__main__":
    test_db()
