package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type stubPinger struct{ err error }

func (s stubPinger) Ping(context.Context) error { return s.err }

type stubReady struct{ err error }

func (s stubReady) Ready(context.Context) error { return s.err }

// The deploy verifier reads the running commit back from /api/health to confirm
// the server actually rolled to the SHA CD just shipped (spec 036 acceptance 1).
// The handler must therefore surface the link-time build metadata alongside the
// dependency probe, and a healthy stack stays a 200.
func TestHealthHandlerReportsBuildInfo(t *testing.T) {
	const sha = "0123456789abcdef0123456789abcdef01234567"
	origCommit, origBuilt := commit, buildTime
	commit, buildTime = sha, "2026-07-06T12:00:00Z"
	t.Cleanup(func() { commit, buildTime = origCommit, origBuilt })

	rec := httptest.NewRecorder()
	healthHandler(stubPinger{}, stubReady{})(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("health status = %d, want 200", rec.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["commit"] != sha {
		t.Fatalf("commit = %v, want the injected sha", body["commit"])
	}
	if body["builtAt"] != "2026-07-06T12:00:00Z" {
		t.Fatalf("builtAt = %v, want the injected build time", body["builtAt"])
	}
	if body["ok"] != true {
		t.Fatalf("ok = %v, want true", body["ok"])
	}
}

// Negative scenario (spec 036): build metadata must still be reported when a
// dependency is down (503), and an un-injected build must fall back to "unknown"
// rather than an empty/missing field — otherwise the verifier can't distinguish
// "wrong version" from "no version reported".
func TestHealthHandlerBuildInfoWhenUninjectedAndDegraded(t *testing.T) {
	origCommit, origBuilt := commit, buildTime
	commit, buildTime = "", ""
	t.Cleanup(func() { commit, buildTime = origCommit, origBuilt })

	rec := httptest.NewRecorder()
	healthHandler(stubPinger{err: errors.New("db down")}, stubReady{})(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("health status = %d, want 503", rec.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["commit"] != "unknown" {
		t.Fatalf("commit = %v, want fallback \"unknown\"", body["commit"])
	}
	if body["builtAt"] != "unknown" {
		t.Fatalf("builtAt = %v, want fallback \"unknown\"", body["builtAt"])
	}
	if body["postgres"] != "error" {
		t.Fatalf("postgres = %v, want \"error\"", body["postgres"])
	}
}
