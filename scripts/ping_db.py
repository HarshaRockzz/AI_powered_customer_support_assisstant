#!/usr/bin/env python3
"""
Ping the database with real read/write queries to keep the connection active.
Used by the GitHub Action to prevent Supabase from pausing due to inactivity.
Reads DATABASE_URL from environment (set by the workflow from repo secrets).
"""
import os
import sys

def main():
    url = os.environ.get('DATABASE_URL')
    if not url:
        print('DATABASE_URL not set', file=sys.stderr)
        sys.exit(1)

    try:
        import psycopg2
        
        print("Connecting to database...")
        conn = psycopg2.connect(url)
        # Ensure changes are committed automatically
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Create the table if it doesn't exist
        print("Ensuring 'supabase_keep_alive' table exists...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS supabase_keep_alive (
                id SERIAL PRIMARY KEY,
                pinged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 2. Insert a new record to register as a 'write' activity
        print("Inserting new keep-alive record...")
        cur.execute("INSERT INTO supabase_keep_alive (pinged_at) VALUES (CURRENT_TIMESTAMP);")
        
        # 3. Clean up older records (keep only the last 7 days to prevent bloat)
        print("Cleaning up old records...")
        cur.execute("""
            DELETE FROM supabase_keep_alive 
            WHERE pinged_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
        """)
        
        # 4. Read back the latest count to register as a 'read' activity
        cur.execute("SELECT COUNT(*) FROM supabase_keep_alive;")
        count = cur.fetchone()[0]
        
        print(f"Database ping OK. Current keep-alive records: {count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f'Database ping failed: {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
