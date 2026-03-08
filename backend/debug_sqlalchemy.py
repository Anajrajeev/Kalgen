from app.agriniti.core.database import SessionLocal
from app.agriniti.core.models import Listing
import json

def debug_listings():
    db = SessionLocal()
    try:
        # Check raw count
        count = db.query(Listing).count()
        print(f"Total listings in SQLAlchemy: {count}")
        
        # Check active
        active = db.query(Listing).filter(Listing.status == 'active').all()
        print(f"Active listings: {len(active)}")
        
        for l in active:
            print(f" - {l.produce_name} (ID: {l.id}) Status: {l.status}")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_listings()
