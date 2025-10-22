package handlers

import (
	"net/http"
	"strconv"

	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/ai-support-assistant/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type FeedbackHandler struct {
	feedbackService *services.FeedbackService
}

func NewFeedbackHandler(feedbackService *services.FeedbackService) *FeedbackHandler {
	return &FeedbackHandler{feedbackService: feedbackService}
}

// HandleSubmitFeedback handles POST /api/feedback
func (h *FeedbackHandler) HandleSubmitFeedback(c *gin.Context) {
	var req models.FeedbackRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_request",
			Message: err.Error(),
		})
		return
	}

	if err := h.feedbackService.SubmitFeedback(c.Request.Context(), req); err != nil {
		logrus.WithError(err).Error("Failed to submit feedback")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "submission_error",
			Message: "Failed to submit feedback. Please try again.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Feedback submitted successfully",
		"query_id": req.QueryID,
	})
}

// HandleGetFeedback handles GET /api/feedback
func (h *FeedbackHandler) HandleGetFeedback(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}

	feedbacks, err := h.feedbackService.GetRecentFeedback(c.Request.Context(), limit)
	if err != nil {
		logrus.WithError(err).Error("Failed to get feedback")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "fetch_error",
			Message: "Failed to fetch feedback",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"feedbacks": feedbacks,
		"count":     len(feedbacks),
	})
}

// HandleGetFeedbackStats handles GET /api/feedback/stats
func (h *FeedbackHandler) HandleGetFeedbackStats(c *gin.Context) {
	stats, err := h.feedbackService.GetFeedbackStats(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to get feedback stats")
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "fetch_error",
			Message: "Failed to fetch feedback stats",
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}
