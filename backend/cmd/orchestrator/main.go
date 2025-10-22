package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ai-support-assistant/backend/internal/cache"
	"github.com/ai-support-assistant/backend/internal/config"
	"github.com/ai-support-assistant/backend/internal/db"
	"github.com/ai-support-assistant/backend/internal/handlers"
	"github.com/ai-support-assistant/backend/internal/middleware"
	"github.com/ai-support-assistant/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

func main() {
	// Setup logger
	setupLogger()

	logrus.Info("Starting AI Support Assistant Backend...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load configuration")
	}

	// Initialize database
	if _, err := db.Initialize(cfg.DatabaseURL, cfg.IsDevelopment()); err != nil {
		logrus.WithError(err).Fatal("Failed to initialize database")
	}
	defer db.Close()

	// Initialize Redis (optional - skip if not configured)
	if cfg.RedisHost != "" && cfg.RedisHost != "localhost" {
		if _, err := cache.Initialize(cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword); err != nil {
			logrus.WithError(err).Warn("Failed to initialize Redis, continuing without cache")
		} else {
			defer cache.Close()
		}
	} else {
		logrus.Info("Redis not configured, running without cache")
	}

	// Initialize services
	queryService := services.NewQueryService(cfg)
	feedbackService := services.NewFeedbackService()
	analyticsService := services.NewAnalyticsService()
	documentService := services.NewDocumentService(cfg)

	// Initialize handlers
	queryHandler := handlers.NewQueryHandler(queryService)
	feedbackHandler := handlers.NewFeedbackHandler(feedbackService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	documentHandler := handlers.NewDocumentHandler(documentService)
	healthHandler := handlers.NewHealthHandler(cfg)

	// Setup Gin router
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Apply middleware
	router.Use(middleware.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())
	router.Use(middleware.Metrics())
	router.Use(middleware.RateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindow))

	// Setup routes
	setupRoutes(router, queryHandler, feedbackHandler, analyticsHandler, documentHandler, healthHandler)

	// Start server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		logrus.WithField("port", cfg.Port).Info("Server started")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logrus.WithError(err).Error("Server forced to shutdown")
	}

	logrus.Info("Server exited")
}

// setupRoutes configures all API routes
func setupRoutes(
	router *gin.Engine,
	queryHandler *handlers.QueryHandler,
	feedbackHandler *handlers.FeedbackHandler,
	analyticsHandler *handlers.AnalyticsHandler,
	documentHandler *handlers.DocumentHandler,
	healthHandler *handlers.HealthHandler,
) {
	// Health check
	router.GET("/api/health", healthHandler.HandleHealth)

	// Prometheus metrics
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API routes
	api := router.Group("/api")
	{
		// Query endpoints
		api.POST("/query", queryHandler.HandleQuery)

		// Feedback endpoints
		api.POST("/feedback", feedbackHandler.HandleSubmitFeedback)
		api.GET("/feedback", feedbackHandler.HandleGetFeedback)
		api.GET("/feedback/stats", feedbackHandler.HandleGetFeedbackStats)

		// Analytics endpoints
		api.GET("/analytics", analyticsHandler.HandleGetAnalytics)
		api.GET("/analytics/top-queries", analyticsHandler.HandleGetTopQueries)
		api.GET("/analytics/trends", analyticsHandler.HandleGetQueryTrends)

		// Document endpoints
		api.POST("/docs/upload", documentHandler.HandleUploadDocument)
		api.GET("/docs", documentHandler.HandleGetDocuments)
		api.GET("/docs/:id", documentHandler.HandleGetDocument)
	}

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "AI Support Assistant Backend",
			"version": "1.0.0",
			"status":  "running",
		})
	})
}

// setupLogger configures the logger
func setupLogger() {
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.InfoLevel)

	if os.Getenv("GO_ENV") == "development" {
		logrus.SetLevel(logrus.DebugLevel)
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}
}
