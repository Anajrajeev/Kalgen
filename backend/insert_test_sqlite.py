import sqlite3
import uuid

def insert_test():
    conn = sqlite3.connect('agriniti.db')
    c = conn.cursor()
    # Ensure user exists for FK
    c.execute("INSERT OR IGNORE INTO users (id, email, password, full_name) VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'hash', 'Test User')")
    # Insert listing
    c.execute("INSERT INTO produce_listings (id, user_id, produce_name, quantity, unit, expected_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))", 
              (str(uuid.uuid4()), '00000000-0000-0000-0000-000000000001', 'Test Wheat', 10.0, 'Quintal', '2000', 'active'))
    conn.commit()
    conn.close()
    print("Inserted test listing into SQLite")

if __name__ == "__main__":
    insert_test()
