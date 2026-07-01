package kratos

import (
	"context"
	"net/http"
	"net/http/httptest"
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

func TestLogoutStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		wantErr    bool
	}{
		{name: "ok", statusCode: http.StatusOK},
		{name: "no content", statusCode: http.StatusNoContent},
		{name: "forbidden returns error", statusCode: http.StatusForbidden, wantErr: true},
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
				return
			}
			if err != nil {
				t.Fatalf("Logout() unexpected error: %v", err)
			}
		})
	}
}
