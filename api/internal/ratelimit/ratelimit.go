// Package ratelimit provides a small in-memory, per-client token-bucket limiter
// for the public auth write endpoints.
//
// The limiter lives in the Go API on purpose: the API is the single chokepoint
// every auth attempt funnels through, whether the request arrives directly at
// the nginx edge (`/api/auth/*`, where `limit_req` also throttles by the true
// TCP peer) or is forwarded by the Next.js server actions over the private
// compose network. The edge `limit_req` cannot see the latter path, so without
// this layer a bot could drive Kratos login/registration/recovery by posting to
// the web auth action route and bypass the edge throttle entirely.
package ratelimit

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
)

type bucket struct {
	tokens   float64
	lastFill time.Time
	lastSeen time.Time
}

// Limiter is a per-key token-bucket rate limiter safe for concurrent use.
type Limiter struct {
	mu         sync.Mutex
	buckets    map[string]*bucket
	ratePerSec float64
	burst      float64
	now        func() time.Time
}

// New builds a limiter that admits `burst` requests immediately per client key
// and then refills at `perMinute` tokens per minute.
func New(perMinute float64, burst int) *Limiter {
	return &Limiter{
		buckets:    make(map[string]*bucket),
		ratePerSec: perMinute / 60.0,
		burst:      float64(burst),
		now:        time.Now,
	}
}

// Allow reports whether a request for key may proceed, consuming one token.
func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	b, ok := l.buckets[key]
	if !ok {
		b = &bucket{tokens: l.burst, lastFill: now}
		l.buckets[key] = b
	}

	// Refill proportionally to elapsed time, capped at the burst size.
	if elapsed := now.Sub(b.lastFill).Seconds(); elapsed > 0 {
		b.tokens = min(l.burst, b.tokens+elapsed*l.ratePerSec)
		b.lastFill = now
	}
	b.lastSeen = now

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// Cleanup evicts buckets idle for longer than idleTTL so the map stays bounded.
func (l *Limiter) Cleanup(idleTTL time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	cutoff := l.now().Add(-idleTTL)
	for key, b := range l.buckets {
		if b.lastSeen.Before(cutoff) {
			delete(l.buckets, key)
		}
	}
}

// Middleware throttles next by client IP, returning 429 when the bucket is empty.
func (l *Limiter) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !l.Allow(clientIP(r)) {
			w.Header().Set("Retry-After", "60")
			httpx.WriteError(w, http.StatusTooManyRequests, "RATE_LIMITED",
				"Too many attempts. Please wait a minute and try again.")
			return
		}
		next(w, r)
	}
}

// clientIP resolves the caller's address. The Go API is only reachable through
// the trusted nginx edge or the internal web container, both of which set
// X-Forwarded-For, so the left-most entry is the originating client. RemoteAddr
// is the fallback when the header is absent (e.g. direct in-cluster calls). A
// spoof-resistant, Cloudflare-aware key (CF-Connecting-IP / trusted-proxy CIDR
// parsing) and a shared cross-replica store are tracked as follow-ups.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if first := strings.TrimSpace(strings.Split(xff, ",")[0]); first != "" {
			return first
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
