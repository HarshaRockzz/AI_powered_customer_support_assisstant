package services

import (
	"context"
	"fmt"

	"github.com/ai-support-assistant/backend/internal/db"
	"github.com/ai-support-assistant/backend/internal/models"
	"github.com/sirupsen/logrus"
)

type FeedbackService struct{}

func NewFeedbackService() *FeedbackService {
	return &FeedbackService{}
}

// SubmitFeedback saves user feedback
func (s *FeedbackService) SubmitFeedback(ctx context.Context, req models.FeedbackRequest) error {
	// Verify query exists
	var query models.ChatQuery
	if err := db.DB.First(&query, req.QueryID).Error; err != nil {
		return fmt.Errorf("query not found: %w", err)
	}

	// Create feedback
	feedback := models.Feedback{
		QueryID:   req.QueryID,
		SessionID: req.SessionID,
		Score:     req.Score,
		Comment:   req.Comment,
		Tags:      req.Tags,
	}

	if err := db.DB.Create(&feedback).Error; err != nil {
		return fmt.Errorf("failed to save feedback: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"query_id":   req.QueryID,
		"score":      req.Score,
		"session_id": req.SessionID,
	}).Info("Feedback submitted")

	return nil
}

// GetFeedbackStats returns feedback statistics
func (s *FeedbackService) GetFeedbackStats(ctx context.Context) (map[string]interface{}, error) {
	var totalFeedback int64
	var positiveFeedback int64
	var negativeFeedback int64

	db.DB.Model(&models.Feedback{}).Count(&totalFeedback)
	db.DB.Model(&models.Feedback{}).Where("score = ?", 1).Count(&positiveFeedback)
	db.DB.Model(&models.Feedback{}).Where("score = ?", -1).Count(&negativeFeedback)

	positiveRate := 0.0
	if totalFeedback > 0 {
		positiveRate = float64(positiveFeedback) / float64(totalFeedback) * 100
	}

	return map[string]interface{}{
		"total_feedback":    totalFeedback,
		"positive_feedback": positiveFeedback,
		"negative_feedback": negativeFeedback,
		"positive_rate":     positiveRate,
	}, nil
}

// GetRecentFeedback returns recent feedback with queries
func (s *FeedbackService) GetRecentFeedback(ctx context.Context, limit int) ([]models.Feedback, error) {
	var feedbacks []models.Feedback

	if err := db.DB.Preload("Query").Order("created_at DESC").Limit(limit).Find(&feedbacks).Error; err != nil {
		return nil, fmt.Errorf("failed to get recent feedback: %w", err)
	}

	return feedbacks, nil
}
