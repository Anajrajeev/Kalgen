from sqlalchemy import create_engine, text
import os

def test_connection():
    # Attempting IPv6 direct
    # Address from nslookup: 2406:da1c:f42:ae16:98a6:2529:af6c:56c0
    url = "postgresql://postgres:Iamnotarobot123*@[2406:da1c:f42:ae16:98a6:2529:af6c:56c0]:5432/postgres"
    print("Testing Direct IPv6 connection...")
    
    engine = create_engine(url)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Successfully connected to Supabase via IPv6!")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
