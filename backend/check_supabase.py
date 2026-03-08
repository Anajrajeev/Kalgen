from app.database import supabase
import json

def test_supabase():
    print("Testing Supabase connection (REST API)...")
    try:
        # Check users
        users = supabase.table("users").select("count", count="exact").execute()
        print(f"Supabase Users: {users.count}")
        
        # Check produce_listings
        listings = supabase.table("produce_listings").select("count", count="exact").execute()
        print(f"Supabase Listings: {listings.count}")
        
        # Sample data
        if listings.count > 0:
            sample = supabase.table("produce_listings").select("*").limit(1).execute()
            print("Sample Listing from Supabase:")
            print(json.dumps(sample.data, indent=2))
            
    except Exception as e:
        print(f"Error testing Supabase: {e}")

if __name__ == "__main__":
    test_supabase()
