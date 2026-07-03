// Command api is the Capsule Zero Go modular monolith. For the Phase 2 auth
// slice it serves the auth/profile bounded context plus a health probe.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/auth"
	"github.com/kiaquila/capsule-zero/api/internal/config"
	"github.com/kiaquila/capsule-zero/api/internal/db"
	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"github.com/kiaquila/capsule-zero/api/internal/profiles"
	"github.com/kiaquila/capsule-zero/api/internal/ratelimit"
	"github.com/kiaquila/capsule-zero/api/migrations"
)

// Public auth writes are throttled per originating client in the Go API itself
// (mirroring the nginx edge `rate=10r/m`, `burst=10`) so the limit also covers
// auth traffic forwarded by the Next.js server actions over the private network,
// which never traverses the edge `limit_req`.
//
// The session-validation surface (whoami/logout/profile) gets its own, far
// roomier bucket: the web app resolves the session server-side on page renders,
// so the auth-write budget would throttle normal navigation, while no budget at
// all lets a bot drive Kratos WhoAmI lookups with arbitrary token probes.
const (
	authRateLimitPerMinute = 10
	authRateLimitBurst     = 10

	sessionRateLimitPerMinute = 120
	sessionRateLimitBurst     = 60
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "-healthcheck" {
		os.Exit(healthcheck())
	}
	if err := run(); err != nil {
		log.Fatalf("api: %v", err)
	}
}

// healthcheck is the container liveness probe (distroless has no shell). It
// confirms the HTTP server is serving — any response is "alive". Readiness of
// Postgres/Kratos is reported in the /api/health response body, not here, so a
// dependency outage does not restart-loop the API container.
func healthcheck() int {
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/api/health")
	if err != nil {
		return 1
	}
	_ = resp.Body.Close()
	return 0
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool, migrations.FS); err != nil {
		return err
	}
	log.Printf("api: migrations applied")

	kratosClient := kratos.New(cfg.KratosPublicURL, cfg.KratosAdminURL)
	handler := &auth.Handler{
		Kratos:   kratosClient,
		Profiles: profiles.New(pool),
	}

	authLimiter := ratelimit.New(authRateLimitPerMinute, authRateLimitBurst)
	sessionLimiter := ratelimit.New(sessionRateLimitPerMinute, sessionRateLimitBurst)
	cleanupCtx, stopCleanup := context.WithCancel(context.Background())
	defer stopCleanup()
	go runLimiterCleanup(cleanupCtx, authLimiter, sessionLimiter)

	mux := newMux(handler, authLimiter, sessionLimiter)
	mux.HandleFunc("GET /api/health", healthHandler(pool, kratosClient))

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-waitForSignal()
		log.Printf("api: shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Printf("api: listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// newMux wires the auth/profile routes behind their rate-limit buckets: public
// auth writes keep the strict edge-mirroring bucket, and the session-validation
// surface shares one independent, roomier bucket (spec 034 acceptance 1).
func newMux(handler *auth.Handler, authLimiter, sessionLimiter *ratelimit.Limiter) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/auth/registration", authLimiter.Middleware(handler.Registration))
	mux.HandleFunc("POST /api/auth/login", authLimiter.Middleware(handler.Login))
	mux.HandleFunc("POST /api/auth/recovery", authLimiter.Middleware(handler.Recovery))
	mux.HandleFunc("POST /api/auth/recovery/complete", authLimiter.Middleware(handler.RecoveryComplete))
	mux.HandleFunc("POST /api/auth/verification", authLimiter.Middleware(handler.VerificationStart))
	mux.HandleFunc("POST /api/auth/verification/complete", authLimiter.Middleware(handler.VerificationComplete))
	// Password change sits in the strict auth bucket: each attempt verifies a
	// password, so a roomier session bucket would hand a stolen token a
	// brute-force budget.
	mux.HandleFunc("POST /api/auth/password", authLimiter.Middleware(handler.ChangePassword))
	mux.HandleFunc("GET /api/auth/whoami", sessionLimiter.Middleware(handler.WhoAmI))
	mux.HandleFunc("POST /api/auth/logout", sessionLimiter.Middleware(handler.Logout))
	mux.HandleFunc("GET /api/profile", sessionLimiter.Middleware(handler.RequireSession(handler.GetProfile)))
	mux.HandleFunc("PATCH /api/profile", sessionLimiter.Middleware(handler.RequireSession(handler.PatchProfile)))
	return mux
}

// runLimiterCleanup periodically evicts idle rate-limit buckets so the in-memory
// maps stay bounded for the lifetime of the process.
func runLimiterCleanup(ctx context.Context, limiters ...*ratelimit.Limiter) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			for _, limiter := range limiters {
				limiter.Cleanup(15 * time.Minute)
			}
		}
	}
}

func waitForSignal() <-chan os.Signal {
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
	return ch
}

// healthHandler probes Postgres and Kratos. Any failure is a 503 with the
// failing dependency marked "error" (negative scenario 3 — never a stale 200).
func healthHandler(pool interface {
	Ping(context.Context) error
}, kratosClient interface {
	Ready(context.Context) error
}) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		result := map[string]string{"postgres": "ok", "kratos": "ok"}
		status := http.StatusOK

		if err := pool.Ping(ctx); err != nil {
			result["postgres"] = "error"
			status = http.StatusServiceUnavailable
		}
		if err := kratosClient.Ready(ctx); err != nil {
			result["kratos"] = "error"
			status = http.StatusServiceUnavailable
		}

		body := map[string]any{"ok": status == http.StatusOK}
		for k, v := range result {
			body[k] = v
		}
		httpx.WriteJSON(w, status, body)
	}
}
