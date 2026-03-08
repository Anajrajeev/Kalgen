import sqlite3
import os

def populate_local():
    db_path = "agriniti.db"
    reset_sql = r"C:\Users\Anaj\.gemini\antigravity\brain\de61824f-d281-4271-bc7a-f624c84d2ec7\FULL_DATABASE_RESET.sql"
    demo_sql = r"C:\Users\Anaj\.gemini\antigravity\brain\de61824f-d281-4271-bc7a-f624c84d2ec7\INSERT_DEMO_DATA_5_USERS.sql"
    
    print(f"Reading SQL from {reset_sql}...")
    with open(reset_sql, 'r', encoding='utf-8') as f:
        reset_content = f.read()
        
    print(f"Reading SQL from {demo_sql}...")
    with open(demo_sql, 'r', encoding='utf-8') as f:
        demo_content = f.read()

    # SQLite doesn't support public. prefix or CASCADE or specific postgres types
    # We need to strip these for local testing if we want it to work in SQLite
    def clean_sql(sql):
        sql = sql.replace("public.", "")
        sql = sql.replace("CASCADE", "")
        sql = sql.replace("uuid_generate_v4()", "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || lower(hex(randomblob(1))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))))")
        sql = sql.replace("gen_random_uuid()", "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || lower(hex(randomblob(1))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))))")
        sql = sql.replace("timestamp with time zone", "DATETIME")
        sql = sql.replace("ARRAY", "TEXT")
        sql = sql.replace("::text", "")
        # Remove triggers and functions which are postgres specific
        import re
        sql = re.sub(r"CREATE OR REPLACE FUNCTION[\s\S]*?LANGUAGE plpgsql;", "", sql)
        sql = re.sub(r"CREATE TRIGGER[\s\S]*?;", "", sql)
        return sql

    print("Cleaning SQL for SQLite compatibility...")
    reset_content = clean_sql(reset_content)
    demo_content = clean_sql(demo_content)

    print(f"Applying to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Split by semicolon and execute
        for statement in reset_content.split(';'):
            if statement.strip():
                try:
                    cursor.execute(statement)
                except Exception as e:
                    print(f"Error in reset statement: {e}")
                    
        for statement in demo_content.split(';'):
            if statement.strip():
                try:
                    cursor.execute(statement)
                except Exception as e:
                    print(f"Error in demo statement: {e}")
                    
        conn.commit()
        print("Success! Local SQLite populated.")
    except Exception as e:
        print(f"Fatal error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    populate_local()
