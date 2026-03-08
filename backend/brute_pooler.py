from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

regions = [
    "us-east-1",
    "ap-south-1",
    "ap-southeast-1",
    "eu-central-1",
    "us-west-1",
    "ap-southeast-2"
]

def brute_force_pooler():
    ref = "sngpktpkrgprjvudcupy"
    password = "Iamnotarobot123*"
    dbname = "postgres"
    
    for region in regions:
        host = f"aws-0-{region}.pooler.supabase.com"
        # Try both 6543 (transaction) and 5432 (session)
        for port in ["6543", "5432"]:
            url = f"postgresql://postgres.{ref}:{password}@{host}:{port}/{dbname}"
            print(f"Trying {region} on port {port}...")
            engine = create_engine(url, connect_args={'connect_timeout': 3})
            try:
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    print(f"!!! SUCCESS !!! Project is in {region} on port {port}")
                    return url
            except Exception as e:
                # print(f"  Failed: {str(e)[:50]}")
                pass
    return None

if __name__ == "__main__":
    found_url = brute_force_pooler()
    if found_url:
        print(f"\nFINAL DATABASE_URL:\n{found_url}")
    else:
        print("\nCould not find valid pooler region.")
