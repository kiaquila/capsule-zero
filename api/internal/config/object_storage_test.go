package config

import (
	"strings"
	"testing"
)

func setValidObjectStorageEnv(t *testing.T) {
	t.Helper()
	t.Setenv("DATABASE_URL", "postgres://capsule:secret@postgres/capsule")
	t.Setenv("OBJECT_STORAGE_ENDPOINT", "https://hel1.your-objectstorage.com")
	t.Setenv("OBJECT_STORAGE_REGION", "hel1")
	t.Setenv("OBJECT_STORAGE_ACCESS_KEY_ID", "access-key")
	t.Setenv("OBJECT_STORAGE_SECRET_ACCESS_KEY", "secret-key")
	t.Setenv("OBJECT_STORAGE_PRIVATE_BUCKET", "capsulezero-prod-private-assets")
}

func TestLoadRequiresObjectStorageConfiguration(t *testing.T) {
	required := []string{
		"OBJECT_STORAGE_ENDPOINT",
		"OBJECT_STORAGE_REGION",
		"OBJECT_STORAGE_ACCESS_KEY_ID",
		"OBJECT_STORAGE_SECRET_ACCESS_KEY",
		"OBJECT_STORAGE_PRIVATE_BUCKET",
	}

	for _, key := range required {
		t.Run(key, func(t *testing.T) {
			setValidObjectStorageEnv(t)
			t.Setenv(key, "")

			_, err := Load()
			if err == nil || !strings.Contains(err.Error(), key) {
				t.Fatalf("Load() error = %v, want an error naming %s", err, key)
			}
		})
	}
}

func TestLoadAcceptsStrictHetznerObjectStorageEndpoint(t *testing.T) {
	setValidObjectStorageEnv(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	want := ObjectStorageConfig{
		Endpoint:        "https://hel1.your-objectstorage.com",
		Region:          "hel1",
		AccessKeyID:     "access-key",
		SecretAccessKey: "secret-key",
		PrivateBucket:   "capsulezero-prod-private-assets",
	}
	if cfg.ObjectStorage != want {
		t.Fatalf("ObjectStorage = %+v, want %+v", cfg.ObjectStorage, want)
	}
}

func TestLoadKeepsUploadEndpointsDisabledUnlessExplicitlyEnabled(t *testing.T) {
	setValidObjectStorageEnv(t)
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.ObjectStorage.UploadsEnabled {
		t.Fatal("UploadsEnabled = true without explicit opt-in")
	}

	t.Setenv("OBJECT_STORAGE_UPLOADS_ENABLED", "true")
	cfg, err = Load()
	if err != nil {
		t.Fatalf("Load() with opt-in error = %v", err)
	}
	if !cfg.ObjectStorage.UploadsEnabled {
		t.Fatal("UploadsEnabled = false after explicit opt-in")
	}
}

func TestLoadRejectsUnsafeOrMismatchedObjectStorageEndpoint(t *testing.T) {
	tests := []struct {
		name     string
		endpoint string
		region   string
	}{
		{name: "plain HTTP", endpoint: "http://hel1.your-objectstorage.com", region: "hel1"},
		{name: "non Hetzner host", endpoint: "https://s3.example.com", region: "hel1"},
		{name: "region mismatch", endpoint: "https://fsn1.your-objectstorage.com", region: "hel1"},
		{name: "credentials in URL", endpoint: "https://user:pass@hel1.your-objectstorage.com", region: "hel1"},
		{name: "path in URL", endpoint: "https://hel1.your-objectstorage.com/private", region: "hel1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setValidObjectStorageEnv(t)
			t.Setenv("OBJECT_STORAGE_ENDPOINT", tt.endpoint)
			t.Setenv("OBJECT_STORAGE_REGION", tt.region)

			if _, err := Load(); err == nil || !strings.Contains(err.Error(), "OBJECT_STORAGE_ENDPOINT") {
				t.Fatalf("Load() error = %v, want strict endpoint validation failure", err)
			}
		})
	}
}
