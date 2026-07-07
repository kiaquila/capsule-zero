// Package config loads runtime configuration from the environment.
package config

import (
	"fmt"
	"os"
	"strconv"
)

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
}

// Load reads configuration from the environment, applying defaults that match
// the docker-compose service names. It returns an error when a required value
// (the database URL) is missing so the API fails fast at boot.
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

	cfg := Config{
		Port:                getenv("API_PORT", "8080"),
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		KratosPublicURL:     getenv("KRATOS_PUBLIC_URL", "http://kratos:4433"),
		KratosAdminURL:      getenv("KRATOS_ADMIN_URL", "http://kratos:4434"),
		AuthRatePerMinute:   authRate,
		AuthRateBurst:       authBurst,
		GoogleSignInEnabled: googleEnabled,
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
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
