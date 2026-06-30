// Package config loads runtime configuration from the environment.
package config

import (
	"fmt"
	"os"
)

// Config is the resolved API runtime configuration.
type Config struct {
	Port           string
	DatabaseURL    string
	KratosPublicURL string
	KratosAdminURL  string
}

// Load reads configuration from the environment, applying defaults that match
// the docker-compose service names. It returns an error when a required value
// (the database URL) is missing so the API fails fast at boot.
func Load() (Config, error) {
	cfg := Config{
		Port:            getenv("API_PORT", "8080"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		KratosPublicURL: getenv("KRATOS_PUBLIC_URL", "http://kratos:4433"),
		KratosAdminURL:  getenv("KRATOS_ADMIN_URL", "http://kratos:4434"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
