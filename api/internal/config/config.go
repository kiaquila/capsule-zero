// Package config loads runtime configuration from the environment.
package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

// ObjectStorageConfig contains the production S3-compatible object-storage
// connection. Credentials deliberately have no defaults: a partially wired
// deployment must fail before it starts accepting traffic.
type ObjectStorageConfig struct {
	Endpoint        string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	PrivateBucket   string
	UploadsEnabled  bool
}

// Config is the resolved API runtime configuration.
type Config struct {
	Port            string
	DatabaseURL     string
	KratosPublicURL string
	KratosAdminURL  string
	// Auth-write rate limit (per client, mirroring the edge). Production keeps
	// the strict default; the local dev stack raises it because every browser
	// behind the dev edge shares one client address, so manual testing plus
	// the e2e suites would otherwise burn the shared budget (spec 035).
	AuthRatePerMinute int
	AuthRateBurst     int
	// GoogleSignInEnabled mirrors the Kratos-side OIDC switch (spec 037):
	// off by default so a deploy without operator prep hides Google cleanly.
	GoogleSignInEnabled bool
	ObjectStorage       ObjectStorageConfig
}

// Load reads configuration from the environment, applying defaults that match
// the docker-compose service names. It returns an error when the database or
// private Object Storage contract is incomplete so the API fails fast at boot.
func Load() (Config, error) {
	authRate, err := getenvInt("API_AUTH_RATE_PER_MINUTE", 10)
	if err != nil {
		return Config{}, err
	}
	authBurst, err := getenvInt("API_AUTH_RATE_BURST", 10)
	if err != nil {
		return Config{}, err
	}

	googleEnabled, err := getenvBool("AUTH_GOOGLE_ENABLED", false)
	if err != nil {
		return Config{}, err
	}

	objectStorage, err := loadObjectStorageConfig()
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		Port:                getenv("API_PORT", "8080"),
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		KratosPublicURL:     getenv("KRATOS_PUBLIC_URL", "http://kratos:4433"),
		KratosAdminURL:      getenv("KRATOS_ADMIN_URL", "http://kratos:4434"),
		AuthRatePerMinute:   authRate,
		AuthRateBurst:       authBurst,
		GoogleSignInEnabled: googleEnabled,
		ObjectStorage:       objectStorage,
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func loadObjectStorageConfig() (ObjectStorageConfig, error) {
	endpoint, err := requireEnv("OBJECT_STORAGE_ENDPOINT")
	if err != nil {
		return ObjectStorageConfig{}, err
	}
	region, err := requireEnv("OBJECT_STORAGE_REGION")
	if err != nil {
		return ObjectStorageConfig{}, err
	}
	accessKeyID, err := requireEnv("OBJECT_STORAGE_ACCESS_KEY_ID")
	if err != nil {
		return ObjectStorageConfig{}, err
	}
	secretAccessKey, err := requireEnv("OBJECT_STORAGE_SECRET_ACCESS_KEY")
	if err != nil {
		return ObjectStorageConfig{}, err
	}
	privateBucket, err := requireEnv("OBJECT_STORAGE_PRIVATE_BUCKET")
	if err != nil {
		return ObjectStorageConfig{}, err
	}
	uploadsEnabled, err := getenvBool("OBJECT_STORAGE_UPLOADS_ENABLED", false)
	if err != nil {
		return ObjectStorageConfig{}, err
	}

	if err := validateObjectStorageEndpoint(endpoint, region); err != nil {
		return ObjectStorageConfig{}, err
	}

	return ObjectStorageConfig{
		Endpoint:        endpoint,
		Region:          region,
		AccessKeyID:     accessKeyID,
		SecretAccessKey: secretAccessKey,
		PrivateBucket:   privateBucket,
		UploadsEnabled:  uploadsEnabled,
	}, nil
}

func requireEnv(key string) (string, error) {
	value := os.Getenv(key)
	if strings.TrimSpace(value) == "" {
		return "", fmt.Errorf("%s is required", key)
	}
	return value, nil
}

func validateObjectStorageEndpoint(endpoint, region string) error {
	parsed, err := url.Parse(endpoint)
	expectedHost := region + ".your-objectstorage.com"
	if err != nil || parsed.Scheme != "https" || parsed.Host != expectedHost ||
		parsed.User != nil || parsed.Path != "" || parsed.RawQuery != "" ||
		parsed.ForceQuery || parsed.Fragment != "" || parsed.Opaque != "" {
		return fmt.Errorf(
			"OBJECT_STORAGE_ENDPOINT must be https://%s with no credentials, port, path, query, or fragment",
			expectedHost,
		)
	}
	return nil
}

func getenvInt(key string, fallback int) (int, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 {
		return 0, fmt.Errorf("%s must be a positive integer, got %q", key, value)
	}
	return parsed, nil
}

func getenvBool(key string, fallback bool) (bool, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, fmt.Errorf("%s must be a boolean, got %q", key, value)
	}
	return parsed, nil
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
