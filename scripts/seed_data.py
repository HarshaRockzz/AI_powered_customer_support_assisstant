#!/usr/bin/env python3
"""
Seed sample data for AI Support Assistant
"""

import os
import sys
import psycopg2
from datetime import datetime, timedelta
import random

# Database connection parameters
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "ai_support")
DB_USER = os.getenv("POSTGRES_USER", "ai_support_user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "secure_password_here")

# Sample data
SAMPLE_QUERIES = [
    ("How do I reset my password?", "To reset your password, click on 'Forgot Password' on the login page and follow the instructions sent to your email."),
    ("What are your business hours?", "Our business hours are Monday to Friday, 9 AM to 5 PM EST. We're closed on weekends and major holidays."),
    ("How can I upgrade my subscription?", "To upgrade your subscription, go to Settings > Billing > Change Plan and select your desired tier."),
    ("Where can I find the API documentation?", "Our API documentation is available at docs.example.com/api. You'll need an API key to get started."),
    ("How do I contact customer support?", "You can contact us via email at support@example.com or through the chat widget in your dashboard."),
    ("What payment methods do you accept?", "We accept all major credit cards (Visa, MasterCard, Amex) and PayPal."),
    ("Can I export my data?", "Yes! Go to Settings > Data Export to download your data in CSV or JSON format."),
    ("How do I add team members?", "Navigate to Team Settings and click 'Invite Member'. They'll receive an email invitation."),
    ("Is there a mobile app?", "Yes, our mobile apps are available on iOS App Store and Google Play Store."),
    ("How do I cancel my subscription?", "To cancel, go to Settings > Billing > Cancel Subscription. You'll retain access until the end of your billing period."),
]

SESSION_IDS = [
    "session-001",
    "session-002",
    "session-003",
    "session-004",
    "session-005",
]

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def seed_queries(conn):
    """Seed sample chat queries"""
    cursor = conn.cursor()
    
    print("Seeding chat queries...")
    
    for i, (query, response) in enumerate(SAMPLE_QUERIES):
        session_id = random.choice(SESSION_IDS)
        created_at = datetime.now() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
        tokens_used = random.randint(100, 500)
        latency_ms = random.randint(300, 1500)
        cache_hit = random.choice([True, False])
        
        cursor.execute("""
            INSERT INTO chat_queries 
            (session_id, query, response, model, tokens_used, latency_ms, cache_hit, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            session_id,
            query,
            response,
            "gpt-4",
            tokens_used,
            latency_ms,
            cache_hit,
            created_at,
            created_at
        ))
        
        query_id = cursor.fetchone()[0]
        
        # Add feedback for some queries
        if random.random() > 0.3:  # 70% get feedback
            score = 1 if random.random() > 0.2 else -1  # 80% positive
            cursor.execute("""
                INSERT INTO feedbacks 
                (query_id, session_id, score, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                query_id,
                session_id,
                score,
                created_at + timedelta(minutes=random.randint(1, 10)),
                created_at + timedelta(minutes=random.randint(1, 10))
            ))
    
    conn.commit()
    print(f"✅ Seeded {len(SAMPLE_QUERIES)} chat queries")

def seed_documents(conn):
    """Seed sample documents"""
    cursor = conn.cursor()
    
    print("Seeding documents...")
    
    sample_docs = [
        ("product_guide.pdf", "application/pdf", 524288, "completed", 45),
        ("faq.md", "text/markdown", 81920, "completed", 23),
        ("api_reference.pdf", "application/pdf", 1048576, "completed", 67),
        ("user_manual.pdf", "application/pdf", 2097152, "completed", 89),
        ("getting_started.txt", "text/plain", 16384, "completed", 12),
    ]
    
    for filename, file_type, file_size, status, chunk_count in sample_docs:
        created_at = datetime.now() - timedelta(days=random.randint(1, 30))
        
        cursor.execute("""
            INSERT INTO documents 
            (file_name, file_type, file_size, status, chunk_count, uploaded_by, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            filename,
            file_type,
            file_size,
            status,
            chunk_count,
            "admin@example.com",
            created_at,
            created_at
        ))
    
    conn.commit()
    print(f"✅ Seeded {len(sample_docs)} documents")

def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    conn = connect_db()
    
    try:
        seed_queries(conn)
        seed_documents(conn)
        print("\n✅ Database seeding completed successfully!")
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()

