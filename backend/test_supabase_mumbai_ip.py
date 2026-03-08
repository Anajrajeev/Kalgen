from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    ref = "sngpktpkrgprjvudcupy"
    password = "Iamnotarobot123*"
    # IP from aws-0-ap-south-1.pooler.supabase.com (Mumbai)
    ip = "3.108.251.216"
    port = "5432" 
    dbname = "postgres"
    
    url = f"postgresql://postgres.{ref}:{password}@{ip}:{port}/{dbname}"
    print(f"Testing direct IP (MUMBAI) connection to: {ip}")
    
    engine = create_engine(url, connect_args={'connect_timeout': 5})
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Successfully connected to Supabase (Mumbai)!")
            return True
            
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
