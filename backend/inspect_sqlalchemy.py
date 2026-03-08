from app.agriniti.core.models import Listing
from app.agriniti.core.database import engine
from sqlalchemy import inspect

def inspect_models():
    inst = inspect(Listing)
    print(f"Listing table name: {inst.mapped_table.name}")
    
    # Check what's in the DB tables
    inspector = inspect(engine)
    print(f"Tables in DB: {inspector.get_table_names()}")

if __name__ == "__main__":
    inspect_models()
