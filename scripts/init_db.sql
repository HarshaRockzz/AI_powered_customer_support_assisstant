-- Initialize AI Support Assistant Database

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat Queries Table
CREATE TABLE IF NOT EXISTS chat_queries (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(200) NOT NULL,
    user_id VARCHAR(200),
    query TEXT NOT NULL,
    response TEXT,
    context TEXT,
    model VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_chat_queries_session_id ON chat_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_queries_user_id ON chat_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_queries_created_at ON chat_queries(created_at);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    query_id INTEGER NOT NULL REFERENCES chat_queries(id) ON DELETE CASCADE,
    session_id VARCHAR(200) NOT NULL,
    score INTEGER NOT NULL CHECK (score IN (1, -1)),
    comment TEXT,
    tags VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedbacks_query_id ON feedbacks(query_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_session_id ON feedbacks(session_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_score ON feedbacks(score);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    file_path VARCHAR(1000),
    vector_store_id VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    uploaded_by VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chat_queries_updated_at BEFORE UPDATE ON chat_queries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedbacks_updated_at BEFORE UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
-- Uncomment the following lines to seed with sample data

-- INSERT INTO chat_queries (session_id, query, response, model, tokens_used, latency_ms)
-- VALUES 
--     ('sample-session-1', 'How do I reset my password?', 'To reset your password, click on "Forgot Password" on the login page...', 'gpt-4', 150, 500),
--     ('sample-session-1', 'What are your business hours?', 'Our business hours are Monday to Friday, 9 AM to 5 PM EST.', 'gpt-4', 120, 450);

COMMIT;

