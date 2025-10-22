#!/usr/bin/env python3
"""
Automated retraining flow for AI Support Assistant
This script should be run periodically (e.g., nightly via cron or Prefect)
"""

import os
import sys
import requests
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8000")
FEEDBACK_THRESHOLD = int(os.getenv("FEEDBACK_THRESHOLD", "10"))

def check_rag_health():
    """Check if RAG service is healthy"""
    try:
        response = requests.get(f"{RAG_SERVICE_URL}/health", timeout=5)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"RAG service health check failed: {e}")
        return False

def trigger_retraining():
    """Trigger model retraining"""
    try:
        logger.info("Triggering model retraining...")
        
        response = requests.post(
            f"{RAG_SERVICE_URL}/rag/retrain",
            json={
                "feedback_threshold": FEEDBACK_THRESHOLD
            },
            timeout=300  # 5 minutes timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Retraining response: {result}")
            return True
        else:
            logger.error(f"Retraining failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error triggering retraining: {e}")
        return False

def main():
    """Main retraining flow"""
    logger.info("=" * 60)
    logger.info("Starting automated retraining flow")
    logger.info(f"Timestamp: {datetime.now()}")
    logger.info("=" * 60)
    
    # Check RAG service health
    if not check_rag_health():
        logger.error("RAG service is not healthy. Aborting retraining.")
        sys.exit(1)
    
    logger.info("✅ RAG service is healthy")
    
    # Trigger retraining
    success = trigger_retraining()
    
    if success:
        logger.info("=" * 60)
        logger.info("✅ Retraining flow completed successfully")
        logger.info("=" * 60)
        sys.exit(0)
    else:
        logger.error("=" * 60)
        logger.error("❌ Retraining flow failed")
        logger.error("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()

