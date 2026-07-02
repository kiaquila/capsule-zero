package kratos

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRecoveryStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		submitCode int
		wantErr    bool
	}{
		{name: "email sent", submitCode: http.StatusOK},
		{name: "validation stays privacy safe", submitCode: http.StatusBadRequest},
		{name: "courier outage returns error", submitCode: http.StatusInternalServerError, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch {
				case r.Method == http.MethodGet && r.URL.Path == "/self-service/recovery/api":
					w.Header().Set("Content-Type", "application/json")
					_, _ = w.Write([]byte(`{"id":"recovery-flow"}`))
				case r.Method == http.MethodPost && r.URL.Path == "/self-service/recovery":
					var body map[string]string
					if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
						t.Fatalf("decode recovery request: %v", err)
					}
					if body["method"] != "link" {
						t.Fatalf("recovery method = %q, want link", body["method"])
					}
					if body["email"] != "person@example.com" {
						t.Fatalf("recovery email = %q, want person@example.com", body["email"])
					}
					w.WriteHeader(tt.submitCode)
				default:
					t.Fatalf("unexpected request %s %s", r.Method, r.URL.String())
				}
			}))
			defer server.Close()

			client := New(server.URL, server.URL)
			err := client.Recovery(context.Background(), "person@example.com")

			if tt.wantErr {
				if err == nil {
					t.Fatal("Recovery() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("Recovery() unexpected error: %v", err)
			}
		})
	}
}

func TestRegisterClassifiesRejections(t *testing.T) {
	const existsBody = `{"ui":{"messages":[{"id":4000007,"type":"error","text":"An account with the same identifier(s) exists already."}]}}`
	const weakPwBody = `{"ui":{"nodes":[{"messages":[{"id":4000032,"type":"error","text":"password is too short"}]}]}}`

	tests := []struct {
		name          string
		body          string
		wantExists    bool
		wantRejected  bool
		wantTextInErr string
	}{
		{
			name:         "duplicate identifier is classified without leaking text",
			body:         existsBody,
			wantExists:   true,
			wantRejected: true, // ErrIdentifierExists wraps ErrFlowRejected
		},
		{
			name:          "genuine validation error keeps its field feedback",
			body:          weakPwBody,
			wantExists:    false,
			wantRejected:  true,
			wantTextInErr: "password is too short",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch {
				case r.Method == http.MethodGet && r.URL.Path == "/self-service/registration/api":
					w.Header().Set("Content-Type", "application/json")
					_, _ = w.Write([]byte(`{"id":"registration-flow"}`))
				case r.Method == http.MethodPost && r.URL.Path == "/self-service/registration":
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusBadRequest)
					_, _ = w.Write([]byte(tt.body))
				default:
					t.Fatalf("unexpected request %s %s", r.Method, r.URL.String())
				}
			}))
			defer server.Close()

			client := New(server.URL, server.URL)
			_, err := client.Register(context.Background(), "person@example.com", "secret123", "Person", "en")

			if got := errors.Is(err, ErrIdentifierExists); got != tt.wantExists {
				t.Fatalf("errors.Is(err, ErrIdentifierExists) = %v, want %v (err=%v)", got, tt.wantExists, err)
			}
			if got := errors.Is(err, ErrFlowRejected); got != tt.wantRejected {
				t.Fatalf("errors.Is(err, ErrFlowRejected) = %v, want %v (err=%v)", got, tt.wantRejected, err)
			}
			if tt.wantTextInErr != "" && !strings.Contains(err.Error(), tt.wantTextInErr) {
				t.Fatalf("err = %v, want it to contain %q", err, tt.wantTextInErr)
			}
			// The duplicate-identifier error must never carry the leaking text.
			if tt.wantExists && strings.Contains(err.Error(), "exists already") {
				t.Fatalf("ErrIdentifierExists leaked Kratos text: %v", err)
			}
		})
	}
}

func TestLogoutStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		wantErr    bool
	}{
		{name: "ok", statusCode: http.StatusOK},
		{name: "no content", statusCode: http.StatusNoContent},
		{name: "bad token maps to invalid credentials", statusCode: http.StatusBadRequest, wantErr: true},
		{name: "unauthorized maps to invalid credentials", statusCode: http.StatusUnauthorized, wantErr: true},
		{name: "forbidden maps to invalid credentials", statusCode: http.StatusForbidden, wantErr: true},
		{name: "not found maps to invalid credentials", statusCode: http.StatusNotFound, wantErr: true},
		{name: "upstream outage returns error", statusCode: http.StatusInternalServerError, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method != http.MethodDelete || r.URL.Path != "/self-service/logout/api" {
					t.Fatalf("unexpected request %s %s", r.Method, r.URL.String())
				}
				w.WriteHeader(tt.statusCode)
			}))
			defer server.Close()

			client := New(server.URL, server.URL)
			err := client.Logout(context.Background(), "session-token")

			if tt.wantErr {
				if err == nil {
					t.Fatal("Logout() error = nil, want error")
				}
				if tt.statusCode >= http.StatusBadRequest && tt.statusCode < http.StatusInternalServerError && !errors.Is(err, ErrInvalidCredentials) {
					t.Fatalf("Logout() error = %v, want ErrInvalidCredentials", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("Logout() unexpected error: %v", err)
			}
		})
	}
}
