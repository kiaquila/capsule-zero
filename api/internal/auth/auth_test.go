package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"github.com/kiaquila/capsule-zero/api/internal/profiles"
)

func TestWriteProfileError(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{
			name:       "not found remains 404",
			err:        profiles.ErrNotFound,
			wantStatus: http.StatusNotFound,
			wantCode:   "NOT_FOUND",
		},
		{
			name:       "unsupported locale is client error",
			err:        profiles.ErrUnsupportedLocale,
			wantStatus: http.StatusBadRequest,
			wantCode:   "VALIDATION_ERROR",
		},
		{
			name:       "storage errors are server errors",
			err:        errors.New("database unavailable"),
			wantStatus: http.StatusInternalServerError,
			wantCode:   "INTERNAL_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			writeProfileError(recorder, tt.err)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}

			var body httpx.ErrorBody
			if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
				t.Fatalf("decode error body: %v", err)
			}
			if body.Error.Code != tt.wantCode {
				t.Fatalf("code = %q, want %q", body.Error.Code, tt.wantCode)
			}
		})
	}
}

func TestRegistrationClassifiesKratosErrors(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{
			name:       "flow rejection stays validation error",
			err:        fmt.Errorf("%w: password is too short", kratos.ErrFlowRejected),
			wantStatus: http.StatusBadRequest,
			wantCode:   "VALIDATION_ERROR",
		},
		{
			name:       "upstream failure is temporary server error",
			err:        errors.New("kratos unavailable"),
			wantStatus: http.StatusBadGateway,
			wantCode:   "INTERNAL_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := Handler{
				Kratos: fakeIdentityClient{
					registerErr: tt.err,
				},
			}
			request := httptest.NewRequest(
				http.MethodPost,
				"/api/auth/registration",
				strings.NewReader(`{"email":"person@example.com","password":"secret123","name":"Person","locale":"en"}`),
			)
			recorder := httptest.NewRecorder()

			handler.Registration(recorder, request)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}

			var body httpx.ErrorBody
			if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
				t.Fatalf("decode error body: %v", err)
			}
			if body.Error.Code != tt.wantCode {
				t.Fatalf("code = %q, want %q", body.Error.Code, tt.wantCode)
			}
		})
	}
}

func TestRecoveryReportsUnexpectedKratosFailure(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{
			recoveryErr: errors.New("courier unavailable"),
		},
	}
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/recovery",
		strings.NewReader(`{"email":"person@example.com"}`),
	)
	recorder := httptest.NewRecorder()

	handler.Recovery(recorder, request)

	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadGateway)
	}

	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("code = %q, want INTERNAL_ERROR", body.Error.Code)
	}
}

func TestWhoAmIClassifiesKratosErrors(t *testing.T) {
	tests := []struct {
		name        string
		err         error
		wantStatus  int
		wantCode    string
		wantNoError bool
	}{
		{
			name:        "invalid session resolves empty",
			err:         kratos.ErrInvalidCredentials,
			wantStatus:  http.StatusOK,
			wantNoError: true,
		},
		{
			name:       "upstream failure is temporary server error",
			err:        errors.New("kratos unavailable"),
			wantStatus: http.StatusBadGateway,
			wantCode:   "INTERNAL_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := Handler{
				Kratos: fakeIdentityClient{
					whoamiErr: tt.err,
				},
			}
			request := httptest.NewRequest(http.MethodGet, "/api/auth/whoami", nil)
			request.Header.Set("Authorization", "Bearer session-token")
			recorder := httptest.NewRecorder()

			handler.WhoAmI(recorder, request)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
			if tt.wantNoError {
				var body authResponse
				if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
					t.Fatalf("decode auth body: %v", err)
				}
				if body.Session != nil || body.User != nil {
					t.Fatalf("body = %+v, want empty auth response", body)
				}
				return
			}

			var body httpx.ErrorBody
			if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
				t.Fatalf("decode error body: %v", err)
			}
			if body.Error.Code != tt.wantCode {
				t.Fatalf("code = %q, want %q", body.Error.Code, tt.wantCode)
			}
		})
	}
}

func TestRequireSessionClassifiesKratosErrors(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{
			name:       "invalid session remains unauthenticated",
			err:        kratos.ErrInvalidCredentials,
			wantStatus: http.StatusUnauthorized,
			wantCode:   "UNAUTHENTICATED",
		},
		{
			name:       "upstream failure is temporary server error",
			err:        errors.New("kratos unavailable"),
			wantStatus: http.StatusBadGateway,
			wantCode:   "INTERNAL_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := Handler{
				Kratos: fakeIdentityClient{
					whoamiErr: tt.err,
				},
			}
			request := httptest.NewRequest(http.MethodGet, "/protected", nil)
			request.Header.Set("Authorization", "Bearer session-token")
			recorder := httptest.NewRecorder()

			handler.RequireSession(func(http.ResponseWriter, *http.Request) {
				t.Fatal("next handler should not run")
			})(recorder, request)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}

			var body httpx.ErrorBody
			if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
				t.Fatalf("decode error body: %v", err)
			}
			if body.Error.Code != tt.wantCode {
				t.Fatalf("code = %q, want %q", body.Error.Code, tt.wantCode)
			}
		})
	}
}

func TestLogoutReportsUnexpectedKratosFailure(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{
			logoutErr: errors.New("logout rejected"),
		},
	}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	request.Header.Set("Authorization", "Bearer stale-token")
	recorder := httptest.NewRecorder()

	handler.Logout(recorder, request)

	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadGateway)
	}

	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("code = %q, want INTERNAL_ERROR", body.Error.Code)
	}
}

func TestLogoutTreatsInvalidKratosTokenAsSignedOut(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{
			logoutErr: kratos.ErrInvalidCredentials,
		},
	}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	request.Header.Set("Authorization", "Bearer stale-token")
	recorder := httptest.NewRecorder()

	handler.Logout(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var body map[string]bool
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
	if !body["ok"] {
		t.Fatalf("body = %+v, want ok true", body)
	}
}

type fakeIdentityClient struct {
	registerErr error
	whoamiErr   error
	recoveryErr error
	logoutErr   error
}

func (f fakeIdentityClient) Register(context.Context, string, string, string, string) (*kratos.Session, error) {
	return nil, f.registerErr
}

func (f fakeIdentityClient) Login(context.Context, string, string) (*kratos.Session, error) {
	panic("not used")
}

func (f fakeIdentityClient) WhoAmI(context.Context, string) (*kratos.Session, error) {
	return nil, f.whoamiErr
}

func (f fakeIdentityClient) Recovery(context.Context, string) error {
	return f.recoveryErr
}

func (f fakeIdentityClient) Logout(context.Context, string) error {
	return f.logoutErr
}
