from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    ref = "sngpktpkrgprjvudcupy"
    password = "Iamnotarobot123*"
    host = "aws-0-ap-south-1.pooler.supabase.com"
    port = "6543" 
    dbname = "postgres"
    
    url = f"postgresql://postgres.{ref}:{password}@{host}:{port}/{dbname}"
    print(f"Testing pooling connection (MUMBAI) to: {host}")
    
    engine = create_engine(url)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Successfully connected to Supabase Pooler (Mumbai)!")
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print(f"Tables in public schema: {tables}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
