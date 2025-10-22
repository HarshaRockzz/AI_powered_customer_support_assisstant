package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

// Config holds all configuration for the application
type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	DatabaseURL string

	// Redis
	RedisURL      string
	RedisHost     string
	RedisPort     string
	RedisPassword string

	// RAG Service
	RAGServiceURL string

	// JWT
	JWTSecret string

	// Rate Limiting
	RateLimitRequests int
	RateLimitWindow   int

	// Cache
	CacheTTL int

	// OpenAI
	OpenAIKey   string
	OpenAIModel string
}

var AppConfig *Config

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found, using environment variables")
	}

	config := &Config{
		Port:              getEnv("BACKEND_PORT", "8080"),
		Environment:       getEnv("GO_ENV", "development"),
		DatabaseURL:       getEnv("POSTGRES_URL", ""),
		RedisURL:          getEnv("REDIS_URL", "redis://localhost:6379"),
		RedisHost:         getEnv("REDIS_HOST", "localhost"),
		RedisPort:         getEnv("REDIS_PORT", "6379"),
		RedisPassword:     getEnv("REDIS_PASSWORD", ""),
		RAGServiceURL:     getEnv("RAG_SERVICE_URL", "http://localhost:8000"),
		JWTSecret:         getEnv("JWT_SECRET", "your-secret-key-change-this"),
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getEnvAsInt("RATE_LIMIT_WINDOW", 60),
		CacheTTL:          getEnvAsInt("CACHE_TTL", 3600),
		OpenAIKey:         getEnv("OPENAI_API_KEY", ""),
		OpenAIModel:       getEnv("OPENAI_MODEL", "gpt-4"),
	}

	// Validate required fields
	if config.DatabaseURL == "" {
		return nil, fmt.Errorf("POSTGRES_URL is required")
	}

	AppConfig = config
	return config, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as int or returns a default value
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}
