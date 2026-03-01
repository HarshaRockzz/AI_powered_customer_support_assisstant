import os
import sys
import psycopg2
from urllib.parse import urlparse

def ping_database():
    """Ping the Supabase database to keep it active."""
    database_url = os.environ.get("DATABASE_URL")
    
    if not database_url:
        print("Error: DATABASE_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)
        
    print("Attempting to connect to database...")
    try:
        # We only need a very lightweight connection to reset the activity timer
        conn = psycopg2.connect(database_url, connect_timeout=10)
        
        # Execute a simple query
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        result = cur.fetchone()
        
        if result and result[0] == 1:
            print("✅ Successfully pinged the Supabase database! The project will stay active.")
            
        cur.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Failed to connect to the database: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    ping_database()
