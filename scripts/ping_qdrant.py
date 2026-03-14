#!/usr/bin/env python3
import os
import sys
import requests

def ping_qdrant():
    """
    Pings the Qdrant Cloud REST API to ensure the cluster registers activity.
    Qdrant free-tier clusters are suspended if they don't receive API requests within 3 weeks.
    """
    qdrant_url = os.environ.get('QDRANT_URL')
    qdrant_key = os.environ.get('QDRANT_API_KEY')
    
    if not qdrant_url:
        print("Error: QDRANT_URL environment variable must be set.")
        sys.exit(1)

    # Ensure URL is properly formatted
    if not qdrant_url.startswith('http'):
        qdrant_url = f"https://{qdrant_url}"
    
    # Strip any trailing slashes and port numbers if present, though
    # usually cloud URLs are standard HTTPS like https://xxx.cloud.qdrant.io
    qdrant_url = qdrant_url.rstrip('/')
    
    # We query the collections endpoint. A successful read here counts as
    # activity to prevent suspension.
    api_url = f"{qdrant_url}/collections"
    
    headers = {
        'Content-Type': 'application/json'
    }
    if qdrant_key:
        headers['api-key'] = qdrant_key

    try:
        print(f"Pinging Qdrant REST API at {api_url}...")
        response = requests.get(api_url, headers=headers, timeout=10)
        
        print(f"Response Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Successfully registered activity with Qdrant!")
        else:
            print(f"Warning: Unexpected response: {response.text}")
            if response.status_code >= 500:
                 sys.exit(1)
                 
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    ping_qdrant()
