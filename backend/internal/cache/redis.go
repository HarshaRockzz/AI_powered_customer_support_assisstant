package cache

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/sirupsen/logrus"
)

var Client *redis.Client

// Initialize initializes the Redis connection
func Initialize(host, port, password string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", host, port),
		Password:     password,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	Client = client
	logrus.Info("Redis connection established successfully")
	return client, nil
}

// Set stores a value in Redis with TTL
func Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if Client == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	return Client.Set(ctx, key, data, ttl).Err()
}

// Get retrieves a value from Redis
func Get(ctx context.Context, key string, dest interface{}) error {
	if Client == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	data, err := Client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

// Delete deletes a key from Redis
func Delete(ctx context.Context, key string) error {
	if Client == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	return Client.Del(ctx, key).Err()
}

// Exists checks if a key exists in Redis
func Exists(ctx context.Context, key string) (bool, error) {
	if Client == nil {
		return false, fmt.Errorf("redis client is not initialized")
	}

	count, err := Client.Exists(ctx, key).Result()
	return count > 0, err
}

// Increment increments a counter
func Increment(ctx context.Context, key string) (int64, error) {
	if Client == nil {
		return 0, fmt.Errorf("redis client is not initialized")
	}

	return Client.Incr(ctx, key).Result()
}

// Expire sets TTL on a key
func Expire(ctx context.Context, key string, ttl time.Duration) error {
	if Client == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	return Client.Expire(ctx, key, ttl).Err()
}

// GenerateCacheKey generates a cache key from query parameters
func GenerateCacheKey(prefix string, params ...string) string {
	hasher := sha256.New()
	for _, param := range params {
		hasher.Write([]byte(param))
	}
	hash := hex.EncodeToString(hasher.Sum(nil))
	return fmt.Sprintf("%s:%s", prefix, hash[:16])
}

// HealthCheck checks if Redis is healthy
func HealthCheck(ctx context.Context) error {
	if Client == nil {
		return fmt.Errorf("redis client is not initialized")
	}

	return Client.Ping(ctx).Err()
}

// Close closes the Redis connection
func Close() error {
	if Client == nil {
		return nil
	}

	return Client.Close()
}
