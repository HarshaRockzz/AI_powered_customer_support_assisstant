package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ai-support-assistant/backend/internal/cache"
	"github.com/ai-support-assistant/backend/internal/config"
	"github.com/ai-support-assistant/backend/internal/db"
	"github.com/ai-support-assistant/backend/internal/middleware"
	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/go-redis/redis/v8"
	"github.com/sirupsen/logrus"
)

type QueryService struct {
	cfg *config.Config
}

func NewQueryService(cfg *config.Config) *QueryService {
	return &QueryService{cfg: cfg}
}

// RAGQueryRequest represents the request to RAG service
type RAGQueryRequest struct {
	Query     string `json:"query"`
	SessionID string `json:"session_id"`
	TopK      int    `json:"top_k"`
	Model     string `json:"model,omitempty"`
}

// RAGQueryResponse represents the response from RAG service
type RAGQueryResponse struct {
	Response   string   `json:"response"`
	Context    []string `json:"context"`
	Model      string   `json:"model"`
	TokensUsed int      `json:"tokens_used"`
}

// ProcessQuery processes a user query
func (s *QueryService) ProcessQuery(ctx context.Context, req models.QueryRequest) (*models.QueryResponse, error) {
	startTime := time.Now()

	// Generate cache key
	cacheKey := cache.GenerateCacheKey("query", req.Query, req.SessionID)

	// Check cache
	var cachedResponse models.QueryResponse
	err := cache.Get(ctx, cacheKey, &cachedResponse)
	if err == nil {
		// Cache hit
		middleware.RecordCacheHit("query")
		logrus.WithField("cache_key", cacheKey).Info("Cache hit for query")
		cachedResponse.CacheHit = true
		cachedResponse.Latency = int(time.Since(startTime).Milliseconds())
		return &cachedResponse, nil
	} else if err != redis.Nil {
		logrus.WithError(err).Warn("Failed to get from cache")
	}

	// Call RAG service
	ragReq := RAGQueryRequest{
		Query:     req.Query,
		SessionID: req.SessionID,
		TopK:      5,
		Model:     req.Model,
	}

	ragResp, err := s.callRAGService(ctx, ragReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call RAG service: %w", err)
	}

	// Calculate latency
	latencyMs := int(time.Since(startTime).Milliseconds())

	// Save to database
	chatQuery := models.ChatQuery{
		SessionID:  req.SessionID,
		UserID:     req.UserID,
		Query:      req.Query,
		Response:   ragResp.Response,
		Context:    formatContext(ragResp.Context),
		Model:      ragResp.Model,
		TokensUsed: ragResp.TokensUsed,
		LatencyMs:  latencyMs,
		CacheHit:   false,
	}

	if err := db.DB.Create(&chatQuery).Error; err != nil {
		logrus.WithError(err).Error("Failed to save query to database")
		// Don't return error, continue with response
	}

	// Prepare response
	response := &models.QueryResponse{
		QueryID:   chatQuery.ID,
		SessionID: req.SessionID,
		Query:     req.Query,
		Response:  ragResp.Response,
		Context:   ragResp.Context,
		Model:     ragResp.Model,
		Latency:   latencyMs,
		CacheHit:  false,
		Timestamp: time.Now().UTC(),
	}

	// Cache the response
	cacheTTL := time.Duration(s.cfg.CacheTTL) * time.Second
	if err := cache.Set(ctx, cacheKey, response, cacheTTL); err != nil {
		logrus.WithError(err).Warn("Failed to cache response")
	}

	return response, nil
}

// callRAGService makes HTTP request to RAG service
func (s *QueryService) callRAGService(ctx context.Context, req RAGQueryRequest) (*RAGQueryResponse, error) {
	startTime := time.Now()
	defer func() {
		middleware.RecordRAGDuration(time.Since(startTime))
	}()

	url := fmt.Sprintf("%s/rag/query", s.cfg.RAGServiceURL)

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call RAG service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("RAG service returned status %d: %s", resp.StatusCode, string(body))
	}

	var ragResp RAGQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&ragResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &ragResp, nil
}

// StreamQuery proxies a streaming query to the RAG service and pipes the SSE
// response straight through to the client. Bypasses the Redis query cache
// since streamed responses aren't cached.
func (s *QueryService) StreamQuery(ctx context.Context, req models.QueryRequest, w http.ResponseWriter) error {
	ragReq := RAGQueryRequest{
		Query:     req.Query,
		SessionID: req.SessionID,
		TopK:      5,
		Model:     req.Model,
	}

	jsonData, err := json.Marshal(ragReq)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/rag/query/stream", s.cfg.RAGServiceURL)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to call RAG service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("RAG service returned status %d: %s", resp.StatusCode, string(body))
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)

	flusher, canFlush := w.(http.Flusher)

	buf := make([]byte, 4096)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				return writeErr
			}
			if canFlush {
				flusher.Flush()
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				return nil
			}
			return readErr
		}
	}
}

// GetModels fetches the list of available free chat models from the RAG service
func (s *QueryService) GetModels(ctx context.Context) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/rag/models", s.cfg.RAGServiceURL)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call RAG service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("RAG service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result, nil
}

// formatContext converts context array to JSON string
func formatContext(context []string) string {
	if len(context) == 0 {
		return "[]"
	}
	data, err := json.Marshal(context)
	if err != nil {
		return "[]"
	}
	return string(data)
}
