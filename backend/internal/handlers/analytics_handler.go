package handlers

import (
	"net/http"
	"strconv"

	"github.com/ai-support-assistant/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type AnalyticsHandler struct {
	analyticsService *services.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

// HandleGetAnalytics handles GET /api/analytics
func (h *AnalyticsHandler) HandleGetAnalytics(c *gin.Context) {
	analytics, err := h.analyticsService.GetAnalytics(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to get analytics")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch analytics",
		})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// HandleGetTopQueries handles GET /api/analytics/top-queries
func (h *AnalyticsHandler) HandleGetTopQueries(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	topQueries, err := h.analyticsService.GetTopQueries(c.Request.Context(), limit)
	if err != nil {
		logrus.WithError(err).Error("Failed to get top queries")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch top queries",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"queries": topQueries,
	})
}

// HandleGetQueryTrends handles GET /api/analytics/trends
func (h *AnalyticsHandler) HandleGetQueryTrends(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "7")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 {
		days = 7
	}

	trends, err := h.analyticsService.GetQueryTrends(c.Request.Context(), days)
	if err != nil {
		logrus.WithError(err).Error("Failed to get query trends")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch query trends",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trends": trends,
	})
}
