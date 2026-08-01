#!/usr/bin/env python3
import os
import sys
import requests


def ping(name, url):
    """Pings a Render service health endpoint to keep it warm and avoid cold starts."""
    try:
        print(f"Pinging {name} at {url}...")
        response = requests.get(url, timeout=60)
        print(f"{name} response status: {response.status_code}")
        if response.status_code >= 500:
            print(f"Warning: {name} returned {response.status_code}")
            return False
        return True
    except requests.exceptions.RequestException as e:
        print(f"{name} request failed: {e}")
        return False


def main():
    backend_url = os.environ.get('BACKEND_URL', '').strip().rstrip('/')
    rag_url = os.environ.get('RAG_URL', '').strip().rstrip('/')

    if not backend_url or not rag_url:
        print("Error: BACKEND_URL and RAG_URL environment variables must be set.")
        sys.exit(1)

    # Root route always returns 200 regardless of Redis/RAG health, so it's
    # a reliable wake-up ping. /api/health can report 503 ("degraded") even
    # when the service is up, e.g. if Redis isn't configured.
    backend_ok = ping('Backend', backend_url)
    rag_ok = ping('RAG service', f"{rag_url}/health")

    if not backend_ok or not rag_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
