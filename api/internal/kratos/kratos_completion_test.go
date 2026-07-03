package kratos

// Spec 035 (auth completion slice) — failing-first tests for the code-method
// recovery/verification flows and the settings-based password change. The fake
// servers emulate the exact Kratos v1.1 endpoints the client drives; shapes
// were pinned against the live dev stack during the slice (see plan.md row 6).

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func decodeBody(t *testing.T, r *http.Request) map[string]any {
	t.Helper()
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		t.Fatalf("decode submit body: %v", err)
	}
	return body
}

func TestRecoveryStartUsesCodeMethodAndReturnsFlowID(t *testing.T) {
	var submitted map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/recovery/api":
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "rec-flow-1"})
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/recovery":
			if r.URL.Query().Get("flow") != "rec-flow-1" {
				t.Errorf("submit flow = %q, want rec-flow-1", r.URL.Query().Get("flow"))
			}
			submitted = decodeBody(t, r)
			_ = json.NewEncoder(w).Encode(map[string]any{"state": "sent_email"})
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	flowID, err := client.RecoveryStart(context.Background(), "person@example.com")
	if err != nil {
		t.Fatalf("RecoveryStart: %v", err)
	}
	if flowID != "rec-flow-1" {
		t.Fatalf("flowID = %q, want rec-flow-1", flowID)
	}
	if submitted["method"] != "code" {
		t.Fatalf("method = %v, want code", submitted["method"])
	}
	if submitted["email"] != "person@example.com" {
		t.Fatalf("email = %v", submitted["email"])
	}
}

func TestRecoveryCompleteExchangesCodeAndSetsPassword(t *testing.T) {
	var settingsBody map[string]any
	var settingsToken string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/recovery":
			body := decodeBody(t, r)
			if body["method"] != "code" || body["code"] != "123456" {
				t.Errorf("recovery submit body = %v", body)
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"state": "passed_challenge",
				"continue_with": []map[string]any{
					{"action": "set_ory_session_token", "ory_session_token": "recovered-token"},
					{"action": "show_settings_ui", "flow": map[string]any{"id": "settings-1"}},
				},
			})
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/settings/api":
			if got := r.Header.Get("X-Session-Token"); got != "recovered-token" {
				t.Errorf("settings init token = %q", got)
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "settings-2"})
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/settings":
			settingsToken = r.Header.Get("X-Session-Token")
			settingsBody = decodeBody(t, r)
			_ = json.NewEncoder(w).Encode(map[string]any{"state": "success"})
		case r.Method == http.MethodGet && r.URL.Path == "/sessions/whoami":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"identity": map[string]any{
					"id":     "id-1",
					"traits": map[string]any{"email": "person@example.com"},
				},
				"expires_at": "2030-01-01T00:00:00Z",
			})
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	session, err := client.RecoveryComplete(context.Background(), "rec-flow-1", "123456", "NewSecret456")
	if err != nil {
		t.Fatalf("RecoveryComplete: %v", err)
	}
	if session == nil || session.Token != "recovered-token" {
		t.Fatalf("session = %+v, want token recovered-token", session)
	}
	if session.Identity.Traits.Email != "person@example.com" {
		t.Fatalf("identity email = %q", session.Identity.Traits.Email)
	}
	if settingsBody["method"] != "password" || settingsBody["password"] != "NewSecret456" {
		t.Fatalf("settings body = %v", settingsBody)
	}
	if settingsToken != "recovered-token" {
		t.Fatalf("settings submit token = %q", settingsToken)
	}
}

func TestRecoveryCompleteRejectsInvalidCode(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ui": map[string]any{
				"messages": []map[string]any{
					{"id": 4060006, "type": "error", "text": "The recovery code is invalid or has already been used."},
				},
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	_, err := client.RecoveryComplete(context.Background(), "rec-flow-1", "000000", "NewSecret456")
	if !errors.Is(err, ErrFlowRejected) {
		t.Fatalf("err = %v, want ErrFlowRejected", err)
	}
}

func TestVerificationStartUsesCodeMethodAndReturnsFlowID(t *testing.T) {
	var submitted map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/verification/api":
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "ver-flow-1"})
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/verification":
			submitted = decodeBody(t, r)
			_ = json.NewEncoder(w).Encode(map[string]any{"state": "sent_email"})
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	flowID, err := client.VerificationStart(context.Background(), "person@example.com")
	if err != nil {
		t.Fatalf("VerificationStart: %v", err)
	}
	if flowID != "ver-flow-1" {
		t.Fatalf("flowID = %q, want ver-flow-1", flowID)
	}
	if submitted["method"] != "code" || submitted["email"] != "person@example.com" {
		t.Fatalf("submitted = %v", submitted)
	}
}

func TestVerificationCompleteStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		body       map[string]any
		wantErr    error
		wantNilErr bool
	}{
		{
			name:       "passed challenge succeeds",
			status:     http.StatusOK,
			body:       map[string]any{"state": "passed_challenge"},
			wantNilErr: true,
		},
		{
			name:   "invalid code is a flow rejection",
			status: http.StatusBadRequest,
			body: map[string]any{
				"ui": map[string]any{
					"messages": []map[string]any{
						{"id": 4070006, "type": "error", "text": "The verification code is invalid or has already been used."},
					},
				},
			},
			wantErr: ErrFlowRejected,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.status)
				_ = json.NewEncoder(w).Encode(tt.body)
			}))
			defer server.Close()

			client := New(server.URL, server.URL)
			err := client.VerificationComplete(context.Background(), "ver-flow-1", "123456")
			if tt.wantNilErr && err != nil {
				t.Fatalf("VerificationComplete: %v", err)
			}
			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestSettingsPasswordSubmitsWithSessionToken(t *testing.T) {
	var submitted map[string]any
	var token string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/settings/api":
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "settings-9"})
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/settings":
			token = r.Header.Get("X-Session-Token")
			submitted = decodeBody(t, r)
			_ = json.NewEncoder(w).Encode(map[string]any{"state": "success"})
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	if err := client.SettingsPassword(context.Background(), "fresh-token", "NewSecret456"); err != nil {
		t.Fatalf("SettingsPassword: %v", err)
	}
	if token != "fresh-token" {
		t.Fatalf("token = %q, want fresh-token", token)
	}
	if submitted["method"] != "password" || submitted["password"] != "NewSecret456" {
		t.Fatalf("submitted = %v", submitted)
	}
}

func TestRegisterCapturesVerificationFlowID(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/registration/api":
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "reg-flow-1"})
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/registration":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"session_token": "tok-1",
				"session": map[string]any{
					"expires_at": "2030-01-01T00:00:00Z",
					"identity": map[string]any{
						"id":     "id-1",
						"traits": map[string]any{"email": "person@example.com"},
					},
				},
				"continue_with": []map[string]any{
					{"action": "show_verification_ui", "flow": map[string]any{"id": "ver-flow-7"}},
				},
			})
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	session, err := client.Register(context.Background(), "person@example.com", "SuperSecret123", "", "en")
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if session.VerificationFlowID != "ver-flow-7" {
		t.Fatalf("VerificationFlowID = %q, want ver-flow-7", session.VerificationFlowID)
	}
}

func TestWhoAmIParsesEmailVerified(t *testing.T) {
	tests := []struct {
		name      string
		addresses []map[string]any
		want      bool
	}{
		{
			name:      "unverified address",
			addresses: []map[string]any{{"value": "person@example.com", "via": "email", "verified": false}},
			want:      false,
		},
		{
			name:      "verified address",
			addresses: []map[string]any{{"value": "person@example.com", "via": "email", "verified": true}},
			want:      true,
		},
		{
			name:      "no verifiable addresses means nothing to verify",
			addresses: nil,
			want:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_ = json.NewEncoder(w).Encode(map[string]any{
					"identity": map[string]any{
						"id":                   "id-1",
						"traits":               map[string]any{"email": "person@example.com"},
						"verifiable_addresses": tt.addresses,
					},
					"expires_at": "2030-01-01T00:00:00Z",
				})
			}))
			defer server.Close()

			client := New(server.URL, server.URL)
			session, err := client.WhoAmI(context.Background(), "tok-1")
			if err != nil {
				t.Fatalf("WhoAmI: %v", err)
			}
			if got := session.Identity.EmailVerified(); got != tt.want {
				t.Fatalf("EmailVerified() = %v, want %v", got, tt.want)
			}
		})
	}
}
