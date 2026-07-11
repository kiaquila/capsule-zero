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

type countingPinger struct{ calls int }

func (s *countingPinger) Ping(context.Context) error {
	s.calls++
	return nil
}

type countingReady struct{ calls int }

func (s *countingReady) Ready(context.Context) error {
	s.calls++
	return nil
}

type contextReady struct {
	calls int
}

func (s *contextReady) Ready(ctx context.Context) error {
	s.calls++
	return ctx.Err()
}

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
	healthHandler(stubPinger{}, stubReady{}, stubReady{})(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))

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
	if body["storage"] != "ok" {
		t.Fatalf("storage = %v, want ok", body["storage"])
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
	healthHandler(stubPinger{err: errors.New("db down")}, stubReady{}, stubReady{})(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))

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

func TestHealthHandlerCachesOnlyObjectStorageProbes(t *testing.T) {
	postgres := &countingPinger{}
	kratos := &countingReady{}
	objects := &countingReady{}
	handler := healthHandler(postgres, kratos, objects)

	for range 2 {
		recorder := httptest.NewRecorder()
		handler(recorder, httptest.NewRequest(http.MethodGet, "/api/health", nil))
		if recorder.Code != http.StatusOK {
			t.Fatalf("health status = %d, want 200", recorder.Code)
		}
	}
	if postgres.calls != 2 || kratos.calls != 2 || objects.calls != 1 {
		t.Fatalf("dependency probes: postgres=%d kratos=%d storage=%d, want 2/2/1",
			postgres.calls, kratos.calls, objects.calls)
	}
}

func TestHealthHandlerDoesNotCachePostgresSuccess(t *testing.T) {
	postgres := &stubPinger{}
	objects := &countingReady{}
	handler := healthHandler(postgres, stubReady{}, objects)

	first := httptest.NewRecorder()
	handler(first, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if first.Code != http.StatusOK {
		t.Fatalf("initial health status = %d, want 200", first.Code)
	}

	postgres.err = errors.New("database unavailable")
	second := httptest.NewRecorder()
	handler(second, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if second.Code != http.StatusServiceUnavailable {
		t.Fatalf("degraded health status = %d, want 503", second.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(second.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode degraded health body: %v", err)
	}
	if body["postgres"] != "error" || objects.calls != 1 {
		t.Fatalf("degraded health body=%v storage probes=%d, want fresh postgres error and one storage probe", body, objects.calls)
	}
}

func TestHealthStorageRefreshIgnoresCanceledPublicRequestContext(t *testing.T) {
	objects := &contextReady{}
	handler := healthHandler(stubPinger{}, stubReady{}, objects)

	canceledCtx, cancel := context.WithCancel(context.Background())
	cancel()
	first := httptest.NewRecorder()
	handler(first, httptest.NewRequest(http.MethodGet, "/api/health", nil).WithContext(canceledCtx))
	if first.Code != http.StatusOK {
		t.Fatalf("canceled-caller health status = %d, want independently refreshed 200", first.Code)
	}

	second := httptest.NewRecorder()
	handler(second, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if second.Code != http.StatusOK || objects.calls != 1 {
		t.Fatalf("cached health status=%d storage probes=%d, want 200/1", second.Code, objects.calls)
	}
}
