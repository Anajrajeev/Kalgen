from app.agriniti.core.database import SessionLocal, Base, engine
from app.agriniti.core.models import User, UserProfile, ProduceListing, MarketplaceProfile
import uuid
from datetime import datetime

def sync_local():
    print("Creating tables in fresh local SQLite...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already populated
        if db.query(User).count() > 0:
            print("Already populated.")
            return

        print("Populating 5 Demo Users...")
        # 1. Ashok (Farmer)
        u1 = User(
            id='00000000-0000-0000-0000-000000000001',
            email='ashok.haryana@example.com',
            password='$2b$12$OvslGtmRUkHC86lYV38HHuRJ/mPOegb8Q3HxMclTRLxoD7fcjzP7S',
            full_name='Ashok Kumar',
            preferred_language='hi',
            role='farmer',
            is_verified=True
        )
        
        # 2. Rahul (Buyer)
        u2 = User(
            id='00000000-0000-0000-0000-000000000002',
            email='rahul.delhi@example.com',
            password='$2b$12$OvslGtmRUkHC86lYV38HHuRJ/mPOegb8Q3HxMclTRLxoD7fcjzP7S',
            full_name='Rahul Sharma',
            preferred_language='en',
            role='buyer',
            is_verified=True
        )
        
        # 3. Venkat (Farmer)
        u3 = User(
            id='00000000-0000-0000-0000-000000000003',
            email='venkat.karnataka@example.com',
            password='$2b$12$OvslGtmRUkHC86lYV38HHuRJ/mPOegb8Q3HxMclTRLxoD7fcjzP7S',
            full_name='Venkat Swamy',
            preferred_language='kn',
            role='farmer',
            is_verified=True
        )
        
        db.add_all([u1, u2, u3])
        
        # Add a listing for Ashok
        l1 = ProduceListing(
            id='10000000-0000-0000-0000-000000000001',
            user_id=u1.id,
            produce_name='Wheat',
            variety='Sharbati',
            quantity=50.0,
            unit='Quintal',
            expected_price='2450',
            location='Sonipat, Haryana',
            state='Haryana',
            district='Sonipat',
            status='active'
        )
        
        l2 = ProduceListing(
            id='10000000-0000-0000-0000-000000000002',
            user_id=u1.id,
            produce_name='Basmati Rice',
            variety='1121 Pusa',
            quantity=30.0,
            unit='Quintal',
            expected_price='4200',
            location='Sonipat, Haryana',
            state='Haryana',
            district='Sonipat',
            status='active'
        )
        
        db.add_all([l1, l2])
        db.commit()
        print("Success! 3 users and 2 listings added to local SQLite.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_local()
