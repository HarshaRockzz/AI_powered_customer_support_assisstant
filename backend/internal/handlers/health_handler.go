package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/ai-support-assistant/backend/internal/cache"
	"github.com/ai-support-assistant/backend/internal/config"
	"github.com/ai-support-assistant/backend/internal/db"
	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	cfg *config.Config
}

func NewHealthHandler(cfg *config.Config) *HealthHandler {
	return &HealthHandler{cfg: cfg}
}

// HandleHealth handles GET /api/health
func (h *HealthHandler) HandleHealth(c *gin.Context) {
	response := models.HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC(),
		Version:   "1.0.0",
	}

	// Check database
	if err := db.HealthCheck(); err != nil {
		response.Database = fmt.Sprintf("unhealthy: %v", err)
		response.Status = "degraded"
	} else {
		response.Database = "healthy"
	}

	// Check Redis
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	if err := cache.HealthCheck(ctx); err != nil {
		response.Redis = fmt.Sprintf("unhealthy: %v", err)
		response.Status = "degraded"
	} else {
		response.Redis = "healthy"
	}

	// Check RAG service
	ragStatus := h.checkRAGService()
	response.RAGService = ragStatus
	if ragStatus != "healthy" {
		response.Status = "degraded"
	}

	statusCode := http.StatusOK
	if response.Status != "healthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// checkRAGService checks if RAG service is healthy
func (h *HealthHandler) checkRAGService() string {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}

	url := fmt.Sprintf("%s/health", h.cfg.RAGServiceURL)
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Sprintf("unhealthy: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("unhealthy: status %d", resp.StatusCode)
	}

	return "healthy"
}
