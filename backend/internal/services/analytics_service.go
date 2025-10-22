package services

import (
	"context"
	"time"

	"github.com/ai-support-assistant/backend/internal/db"
	"github.com/ai-support-assistant/backend/internal/models"
)

type AnalyticsService struct{}

func NewAnalyticsService() *AnalyticsService {
	return &AnalyticsService{}
}

// GetAnalytics returns aggregated analytics data
func (s *AnalyticsService) GetAnalytics(ctx context.Context) (*models.Analytics, error) {
	analytics := &models.Analytics{}

	// Total queries
	db.DB.Model(&models.ChatQuery{}).Count(&analytics.TotalQueries)

	// Total feedback
	db.DB.Model(&models.Feedback{}).Count(&analytics.TotalFeedback)

	// Positive/Negative feedback
	db.DB.Model(&models.Feedback{}).Where("score = ?", 1).Count(&analytics.PositiveFeedback)
	db.DB.Model(&models.Feedback{}).Where("score = ?", -1).Count(&analytics.NegativeFeedback)

	// Average latency
	var avgLatency float64
	db.DB.Model(&models.ChatQuery{}).Select("AVG(latency_ms)").Scan(&avgLatency)
	analytics.AverageLatencyMs = avgLatency

	// Cache hit rate
	var totalQueries int64
	var cacheHits int64
	db.DB.Model(&models.ChatQuery{}).Count(&totalQueries)
	db.DB.Model(&models.ChatQuery{}).Where("cache_hit = ?", true).Count(&cacheHits)
	if totalQueries > 0 {
		analytics.CacheHitRate = float64(cacheHits) / float64(totalQueries) * 100
	}

	// Total tokens used
	var totalTokens int64
	db.DB.Model(&models.ChatQuery{}).Select("SUM(tokens_used)").Scan(&totalTokens)
	analytics.TotalTokensUsed = totalTokens

	// Total documents
	db.DB.Model(&models.Document{}).Count(&analytics.TotalDocuments)

	// Active sessions (last 24 hours)
	yesterday := time.Now().Add(-24 * time.Hour)
	db.DB.Model(&models.ChatQuery{}).Where("created_at > ?", yesterday).Distinct("session_id").Count(&analytics.ActiveSessions)

	return analytics, nil
}

// GetTopQueries returns the most frequent queries
func (s *AnalyticsService) GetTopQueries(ctx context.Context, limit int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	rows, err := db.DB.Model(&models.ChatQuery{}).
		Select("query, COUNT(*) as count").
		Group("query").
		Order("count DESC").
		Limit(limit).
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var query string
		var count int64
		if err := rows.Scan(&query, &count); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"query": query,
			"count": count,
		})
	}

	return results, nil
}

// GetQueryTrends returns query trends over time
func (s *AnalyticsService) GetQueryTrends(ctx context.Context, days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	startDate := time.Now().AddDate(0, 0, -days)

	rows, err := db.DB.Model(&models.ChatQuery{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("created_at > ?", startDate).
		Group("DATE(created_at)").
		Order("date ASC").
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var date time.Time
		var count int64
		if err := rows.Scan(&date, &count); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"date":  date.Format("2006-01-02"),
			"count": count,
		})
	}

	return results, nil
}
