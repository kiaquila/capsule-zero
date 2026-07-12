package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/auth"
	"github.com/kiaquila/capsule-zero/api/internal/ratelimit"
	"github.com/kiaquila/capsule-zero/api/internal/uploads"
)

func TestContainerHealthcheckUsesIndependentLivenessRoute(t *testing.T) {
	paths := make(chan string, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		paths <- r.URL.Path
		w.WriteHeader(http.StatusNoContent)
	}))
	t.Cleanup(server.Close)

	endpoint, err := url.Parse(server.URL)
	if err != nil {
		t.Fatalf("parse test server URL: %v", err)
	}
	t.Setenv("API_PORT", endpoint.Port())

	if code := healthcheck(); code != 0 {
		t.Fatalf("healthcheck() = %d, want 0", code)
	}
	if path := <-paths; path != "/livez" {
		t.Fatalf("healthcheck path = %q, want /livez", path)
	}
}

func TestMuxExposesInternalLivenessWithoutDependencies(t *testing.T) {
	mux := newMux(&auth.Handler{}, ratelimit.New(10, 10), ratelimit.New(120, 10))

	if code := doRequest(t, mux, http.MethodGet, "/livez", ""); code != http.StatusNoContent {
		t.Fatalf("GET /livez = %d, want 204", code)
	}
}

// Session-validation endpoints (whoami/logout/profile) must be throttled by their
// own, higher-rate bucket: without it a bot with any bearer string can drive
// Kratos WhoAmI lookups unthrottled (spec 034 acceptance 1). The throttle fires
// in middleware, before any handler dependency is touched, so a zero-value
// auth.Handler is safe for the throttled paths; the only un-throttled requests
// this test sends are token-less whoami calls, which short-circuit before Kratos.
func TestSessionEndpointsThrottled(t *testing.T) {
	mux := newMux(&auth.Handler{}, ratelimit.New(10, 10), ratelimit.New(120, 3))

	for i := 0; i < 3; i++ {
		if code := doRequest(t, mux, http.MethodGet, "/api/auth/whoami", ""); code != http.StatusOK {
			t.Fatalf("whoami burst request %d = %d, want 200", i+1, code)
		}
	}

	rec := httptest.NewRecorder()
	req := newClientRequest(http.MethodGet, "/api/auth/whoami", "")
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("whoami past burst = %d, want 429", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Fatal("429 response is missing Retry-After")
	}

	// Logout and both profile methods share the session bucket, so they are
	// throttled too once it is empty (middleware answers before the handler).
	for _, probe := range []struct{ method, path string }{
		{http.MethodPost, "/api/auth/logout"},
		{http.MethodGet, "/api/profile"},
		{http.MethodPatch, "/api/profile"},
	} {
		if code := doRequest(t, mux, probe.method, probe.path, ""); code != http.StatusTooManyRequests {
			t.Fatalf("%s %s with exhausted session bucket = %d, want 429", probe.method, probe.path, code)
		}
	}
}

// The strict auth-write bucket and the session bucket must be independent: an
// exhausted session bucket cannot eat auth-write tokens and vice versa (spec 034
// acceptance 1). Login with a malformed body resolves to 400 before any Kratos
// call, which is enough to prove the request passed its own limiter.
func TestAuthAndSessionBucketsIndependent(t *testing.T) {
	mux := newMux(&auth.Handler{}, ratelimit.New(10, 2), ratelimit.New(120, 2))

	// Exhaust the session bucket.
	for i := 0; i < 2; i++ {
		doRequest(t, mux, http.MethodGet, "/api/auth/whoami", "")
	}
	if code := doRequest(t, mux, http.MethodGet, "/api/auth/whoami", ""); code != http.StatusTooManyRequests {
		t.Fatalf("whoami past burst = %d, want 429", code)
	}

	// Auth writes still have their own tokens: malformed login is a 400, not 429.
	if code := doRequest(t, mux, http.MethodPost, "/api/auth/login", "not-json"); code != http.StatusBadRequest {
		t.Fatalf("login with exhausted session bucket = %d, want 400", code)
	}
	if code := doRequest(t, mux, http.MethodPost, "/api/auth/login", "not-json"); code != http.StatusBadRequest {
		t.Fatalf("second login = %d, want 400", code)
	}

	// Now the auth bucket is empty — and the session bucket must be unaffected
	// by that: login throttles, whoami stays throttled only by its own bucket.
	if code := doRequest(t, mux, http.MethodPost, "/api/auth/login", "not-json"); code != http.StatusTooManyRequests {
		t.Fatalf("login past burst = %d, want 429", code)
	}
}

func TestUploadRoutesRequireSessionAndUseSessionLimiter(t *testing.T) {
	authHandler := &auth.Handler{}
	mux := newMux(authHandler, ratelimit.New(10, 10), ratelimit.New(120, 2))
	registerUploadRoutes(mux, authHandler, &uploads.Handler{Enabled: true}, ratelimit.New(120, 2))

	for _, path := range []string{
		"/api/uploads/photo/init",
		"/api/uploads/photo/complete",
	} {
		if code := doRequest(t, mux, http.MethodPost, path, "{}"); code != http.StatusUnauthorized {
			t.Fatalf("POST %s without session = %d, want 401", path, code)
		}
	}

	if code := doRequest(t, mux, http.MethodPost, "/api/uploads/photo/init", "{}"); code != http.StatusTooManyRequests {
		t.Fatalf("upload request past burst = %d, want 429", code)
	}
}

func TestDisabledUploadRoutesShortCircuitBeforeSessionResolution(t *testing.T) {
	authHandler := &auth.Handler{}
	mux := newMux(authHandler, ratelimit.New(10, 10), ratelimit.New(120, 10))
	registerUploadRoutes(mux, authHandler, &uploads.Handler{}, ratelimit.New(120, 10))

	for _, path := range []string{
		"/api/uploads/photo/init",
		"/api/uploads/photo/complete",
	} {
		recorder := httptest.NewRecorder()
		request := newClientRequest(http.MethodPost, path, "{}")
		request.Header.Set("Authorization", "Bearer would-panic-if-auth-ran")
		mux.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusServiceUnavailable {
			t.Fatalf("POST %s while disabled = %d, want 503", path, recorder.Code)
		}
	}
}

func doRequest(t *testing.T, mux *http.ServeMux, method, path, body string) int {
	t.Helper()
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, newClientRequest(method, path, body))
	return rec.Code
}

func newClientRequest(method, path, body string) *http.Request {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set(ratelimit.TrustedClientIPHeader, "203.0.113.7")
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	return req
}
