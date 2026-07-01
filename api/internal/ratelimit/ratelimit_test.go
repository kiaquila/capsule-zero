package ratelimit

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
)

func newTestLimiter(perMinute float64, burst int, clock *time.Time) *Limiter {
	l := New(perMinute, burst)
	l.now = func() time.Time { return *clock }
	return l
}

func TestAllowAdmitsBurstThenBlocks(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 3, &now)

	for i := 0; i < 3; i++ {
		if !l.Allow("1.1.1.1") {
			t.Fatalf("request %d within burst should be allowed", i+1)
		}
	}
	if l.Allow("1.1.1.1") {
		t.Fatal("request past the burst should be blocked")
	}
}

func TestAllowRefillsOverTime(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 1, &now) // 10/min => one token every 6s

	if !l.Allow("2.2.2.2") {
		t.Fatal("first request should be allowed")
	}
	if l.Allow("2.2.2.2") {
		t.Fatal("second immediate request should be blocked")
	}

	now = now.Add(6 * time.Second) // one token refilled
	if !l.Allow("2.2.2.2") {
		t.Fatal("request after refill window should be allowed")
	}
}

func TestAllowIsPerKey(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 1, &now)

	if !l.Allow("a") {
		t.Fatal("first key should be allowed")
	}
	if !l.Allow("b") {
		t.Fatal("independent key should have its own bucket")
	}
	if l.Allow("a") {
		t.Fatal("first key should now be exhausted")
	}
}

func TestCleanupEvictsIdleBuckets(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 1, &now)
	l.Allow("stale")

	now = now.Add(20 * time.Minute)
	l.Allow("fresh")
	l.Cleanup(15 * time.Minute)

	l.mu.Lock()
	_, staleExists := l.buckets["stale"]
	_, freshExists := l.buckets["fresh"]
	l.mu.Unlock()

	if staleExists {
		t.Fatal("idle bucket should have been evicted")
	}
	if !freshExists {
		t.Fatal("recently-seen bucket should be retained")
	}
}

func TestMiddlewareReturns429WhenExhausted(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 2, &now)

	var served int
	handler := l.Middleware(func(w http.ResponseWriter, r *http.Request) {
		served++
		w.WriteHeader(http.StatusOK)
	})

	do := func() *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req.Header.Set(TrustedClientIPHeader, "9.9.9.9")
		rec := httptest.NewRecorder()
		handler(rec, req)
		return rec
	}

	if rec := do(); rec.Code != http.StatusOK {
		t.Fatalf("first request: want 200, got %d", rec.Code)
	}
	if rec := do(); rec.Code != http.StatusOK {
		t.Fatalf("second request: want 200, got %d", rec.Code)
	}

	rec := do()
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("third request: want 429, got %d", rec.Code)
	}
	if got := rec.Header().Get("Retry-After"); got != "60" {
		t.Fatalf("want Retry-After 60, got %q", got)
	}
	var body httpx.ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Code != "RATE_LIMITED" {
		t.Fatalf("want RATE_LIMITED code, got %q", body.Error.Code)
	}
	if served != 2 {
		t.Fatalf("handler should have run twice, ran %d times", served)
	}
}

func TestMiddlewareKeysDistinctTrustedClients(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 1, &now)
	handler := l.Middleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	do := func(ip string) int {
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req.Header.Set(TrustedClientIPHeader, ip)
		rec := httptest.NewRecorder()
		handler(rec, req)
		return rec.Code
	}

	// Two distinct trusted client IPs get independent buckets.
	if code := do("203.0.113.1"); code != http.StatusOK {
		t.Fatalf("client A first request: want 200, got %d", code)
	}
	if code := do("203.0.113.9"); code != http.StatusOK {
		t.Fatalf("client B first request: want 200, got %d", code)
	}
	if code := do("203.0.113.1"); code != http.StatusTooManyRequests {
		t.Fatalf("client A second request: want 429, got %d", code)
	}
}

// A caller-supplied X-Forwarded-For must NOT influence the key: otherwise an
// attacker could rotate it to mint a fresh bucket per attempt. With no trusted
// header present, every spoofed value collapses onto the same RemoteAddr bucket.
func TestMiddlewareIgnoresRawForwardedFor(t *testing.T) {
	now := time.Unix(0, 0)
	l := newTestLimiter(10, 1, &now)
	handler := l.Middleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	do := func(spoofed string) int {
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
		req.RemoteAddr = "10.0.0.2:5000"
		req.Header.Set("X-Forwarded-For", spoofed)
		rec := httptest.NewRecorder()
		handler(rec, req)
		return rec.Code
	}

	if code := do("1.1.1.1"); code != http.StatusOK {
		t.Fatalf("first request: want 200, got %d", code)
	}
	// Rotating the spoofed XFF does not escape the RemoteAddr-keyed bucket.
	if code := do("2.2.2.2"); code != http.StatusTooManyRequests {
		t.Fatalf("rotated-XFF request: want 429, got %d", code)
	}
}

func TestClientIPPrefersTrustedHeader(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	req.RemoteAddr = "10.0.0.2:5000"
	req.Header.Set("X-Forwarded-For", "1.1.1.1") // untrusted, must be ignored
	req.Header.Set(TrustedClientIPHeader, "203.0.113.5")
	if got := clientIP(req); got != "203.0.113.5" {
		t.Fatalf("want trusted 203.0.113.5, got %q", got)
	}
}

func TestClientIPFallsBackToRemoteAddr(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	req.RemoteAddr = "198.51.100.7:54321"
	req.Header.Set("X-Forwarded-For", "1.1.1.1") // untrusted, must be ignored
	if got := clientIP(req); got != "198.51.100.7" {
		t.Fatalf("want 198.51.100.7, got %q", got)
	}
}
