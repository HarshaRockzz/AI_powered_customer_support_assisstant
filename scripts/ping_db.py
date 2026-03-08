#!/usr/bin/env python3
import os
import sys
import requests

def ping_database():
    """
    Pings the Supabase REST API to ensure the project registers activity.
    Supabase free-tier projects are paused if they don't receive API requests.
    """
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.")
        sys.exit(1)

    # Ensure URL is properly formatted
    if not supabase_url.startswith('http'):
        supabase_url = f"https://{supabase_url}"
    
    # We query a non-existent or real table. A 404 on a REST API table query
    # will still count towards API requests, whereas querying the root schema
    # (/rest/v1/) might be completely excluded from the dashboard metrics.
    api_url = f"{supabase_url}/rest/v1/dummy_keep_alive_table?select=id&limit=1"
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }

    try:
        print(f"Pinging Supabase REST API at {supabase_url}...")
        response = requests.get(api_url, headers=headers, timeout=10)
        
        print(f"Response Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Successfully registered activity with Supabase!")
        else:
            print(f"Warning: Unexpected response: {response.text}")
            if response.status_code >= 500:
                 sys.exit(1)
                 
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    ping_database()
