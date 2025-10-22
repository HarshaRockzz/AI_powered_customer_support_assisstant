package models

import (
	"time"
)

// ChatQuery represents a user query to the system
type ChatQuery struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SessionID  string    `gorm:"index;not null" json:"session_id"`
	UserID     string    `gorm:"index" json:"user_id,omitempty"`
	Query      string    `gorm:"type:text;not null" json:"query"`
	Response   string    `gorm:"type:text" json:"response"`
	Context    string    `gorm:"type:text" json:"context,omitempty"`
	Model      string    `gorm:"type:varchar(100)" json:"model"`
	TokensUsed int       `json:"tokens_used"`
	LatencyMs  int       `json:"latency_ms"`
	CacheHit   bool      `json:"cache_hit"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Feedback represents user feedback on a response
type Feedback struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	QueryID   uint      `gorm:"index;not null" json:"query_id"`
	SessionID string    `gorm:"index" json:"session_id"`
	Score     int       `gorm:"not null" json:"score"` // 1 for thumbs up, -1 for thumbs down
	Comment   string    `gorm:"type:text" json:"comment,omitempty"`
	Tags      string    `gorm:"type:varchar(500)" json:"tags,omitempty"` // JSON array of tags
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Query     ChatQuery `gorm:"foreignKey:QueryID" json:"query,omitempty"`
}

// Document represents an uploaded document
type Document struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	FileName      string    `gorm:"type:varchar(500);not null" json:"file_name"`
	FileType      string    `gorm:"type:varchar(50)" json:"file_type"`
	FileSize      int64     `json:"file_size"`
	FilePath      string    `gorm:"type:varchar(1000)" json:"file_path"`
	VectorStoreID string    `gorm:"type:varchar(200)" json:"vector_store_id,omitempty"`
	Status        string    `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, processing, completed, failed
	ChunkCount    int       `json:"chunk_count"`
	UploadedBy    string    `gorm:"type:varchar(200)" json:"uploaded_by,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Analytics represents aggregated analytics data
type Analytics struct {
	TotalQueries     int64   `json:"total_queries"`
	TotalFeedback    int64   `json:"total_feedback"`
	PositiveFeedback int64   `json:"positive_feedback"`
	NegativeFeedback int64   `json:"negative_feedback"`
	AverageLatencyMs float64 `json:"average_latency_ms"`
	CacheHitRate     float64 `json:"cache_hit_rate"`
	TotalTokensUsed  int64   `json:"total_tokens_used"`
	TotalDocuments   int64   `json:"total_documents"`
	ActiveSessions   int64   `json:"active_sessions"`
}

// QueryRequest represents the request body for /api/query
type QueryRequest struct {
	Query     string `json:"query" binding:"required"`
	SessionID string `json:"session_id" binding:"required"`
	UserID    string `json:"user_id,omitempty"`
	Stream    bool   `json:"stream,omitempty"`
}

// QueryResponse represents the response for /api/query
type QueryResponse struct {
	QueryID   uint      `json:"query_id"`
	SessionID string    `json:"session_id"`
	Query     string    `json:"query"`
	Response  string    `json:"response"`
	Context   []string  `json:"context,omitempty"`
	Model     string    `json:"model"`
	Latency   int       `json:"latency_ms"`
	CacheHit  bool      `json:"cache_hit"`
	Timestamp time.Time `json:"timestamp"`
}

// FeedbackRequest represents the request body for /api/feedback
type FeedbackRequest struct {
	QueryID   uint   `json:"query_id" binding:"required"`
	SessionID string `json:"session_id" binding:"required"`
	Score     int    `json:"score" binding:"required,oneof=1 -1"`
	Comment   string `json:"comment,omitempty"`
	Tags      string `json:"tags,omitempty"`
}

// DocumentUploadResponse represents the response for document upload
type DocumentUploadResponse struct {
	DocumentID uint   `json:"document_id"`
	FileName   string `json:"file_name"`
	Status     string `json:"status"`
	Message    string `json:"message"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status     string    `json:"status"`
	Timestamp  time.Time `json:"timestamp"`
	Version    string    `json:"version"`
	Database   string    `json:"database"`
	Redis      string    `json:"redis"`
	RAGService string    `json:"rag_service"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error     string    `json:"error"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}
