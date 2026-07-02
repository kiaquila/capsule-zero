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

func TestRegistrationDoesNotLeakAccountExistence(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{registerErr: kratos.ErrIdentifierExists},
	}
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/registration",
		strings.NewReader(`{"email":"taken@example.com","password":"secret123","name":"Person","locale":"en"}`),
	)
	recorder := httptest.NewRecorder()

	handler.Registration(recorder, request)

	// Same generic shape as any rejected field: no distinguishing status/code.
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
	}
	if strings.Contains(strings.ToLower(body.Error.Message), "exist") ||
		strings.Contains(strings.ToLower(body.Error.Message), "identifier") {
		t.Fatalf("message leaks account existence: %q", body.Error.Message)
	}
}

func TestRegistrationPreservesValidationFeedback(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{
			registerErr: fmt.Errorf("%w: password is too short", kratos.ErrFlowRejected),
		},
	}
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/registration",
		strings.NewReader(`{"email":"person@example.com","password":"x","name":"Person","locale":"en"}`),
	)
	recorder := httptest.NewRecorder()

	handler.Registration(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Message != "password is too short" {
		t.Fatalf("message = %q, want genuine validation feedback preserved", body.Error.Message)
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

func TestRegistrationRejectsOverLongName(t *testing.T) {
	// Kratos would return a session if reached; a 400 proves validation
	// short-circuits before the identity is created.
	handler := Handler{Kratos: fakeIdentityClient{}}
	longName := strings.Repeat("a", 81)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/registration",
		strings.NewReader(`{"email":"person@example.com","password":"secret123","name":"`+longName+`","locale":"en"}`),
	)
	recorder := httptest.NewRecorder()

	handler.Registration(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
	}
}

func TestBuildUserPrefersEditedDisplayName(t *testing.T) {
	// A user who edited displayName must see the edited value, not the original
	// Kratos registration trait.
	edited := buildUser(profiles.Profile{UserID: "u1", Email: "e@x.com", DisplayName: "Edited Name"}, "OriginalTrait")
	if edited.Name != "Edited Name" {
		t.Fatalf("name = %q, want edited display name", edited.Name)
	}
	// With no display name set yet, fall back to the Kratos trait.
	fresh := buildUser(profiles.Profile{UserID: "u2", Email: "e2@x.com"}, "TraitFallback")
	if fresh.Name != "TraitFallback" {
		t.Fatalf("name = %q, want trait fallback", fresh.Name)
	}
}

func TestRegistrationRejectsWhitespaceName(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{}}
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/registration",
		strings.NewReader(`{"email":"person@example.com","password":"secret123","name":"   ","locale":"en"}`),
	)
	recorder := httptest.NewRecorder()

	handler.Registration(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
	}
}

func TestPatchProfileRejectsInvalidFields(t *testing.T) {
	// Profiles is nil on purpose: validation must reject before Apply is reached,
	// so an invalid patch never touches the repository.
	handler := Handler{}

	cases := []struct{ name, body string }{
		{"empty display name", `{"displayName":""}`},
		{"whitespace display name", `{"displayName":"   "}`},
		{"over-long display name", `{"displayName":"` + strings.Repeat("a", 81) + `"}`},
		{"over-long country", `{"country":"` + strings.Repeat("a", 81) + `"}`},
		{"over-long city", `{"city":"` + strings.Repeat("a", 81) + `"}`},
		{"whitespace country", `{"country":"   "}`},
		{"whitespace city", `{"city":"  "}`},
		{"non-https avatar", `{"avatarUrl":"javascript:alert(1)"}`},
		{"http avatar", `{"avatarUrl":"http://cdn.example.com/a.png"}`},
		{"schemaless avatar", `{"avatarUrl":"cdn.example.com/a.png"}`},
		{"over-long avatar", `{"avatarUrl":"https://cdn.example.com/` + strings.Repeat("a", 2048) + `"}`},
		{"blank locale", `{"locale":""}`},
		{"whitespace locale", `{"locale":"   "}`},
		{"null display name", `{"displayName":null}`},
		{"null locale", `{"locale":null}`},
		{"null country", `{"country":null}`},
		{"null city", `{"city":null}`},
		{"null avatar", `{"avatarUrl":null}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPatch, "/api/profile", strings.NewReader(tc.body))
			request = request.WithContext(context.WithValue(request.Context(), sessionTokenKey, "user-1"))
			recorder := httptest.NewRecorder()

			handler.PatchProfile(recorder, request)

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
			}
			var body httpx.ErrorBody
			if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
				t.Fatalf("decode error body: %v", err)
			}
			if body.Error.Code != "VALIDATION_ERROR" {
				t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
			}
		})
	}
}

func TestValidateProfileUpdateAcceptsValidAndOmitted(t *testing.T) {
	valid := "Buenos Aires"
	avatar := "https://cdn.capsulezero.app/avatars/a.png"
	locale := "ru"
	if msg, ok := validateProfileUpdate(&valid, &valid, &valid, &avatar, &locale); !ok {
		t.Fatalf("valid update rejected: %q", msg)
	}
	// All-nil (every field omitted) is a valid no-op patch.
	if msg, ok := validateProfileUpdate(nil, nil, nil, nil, nil); !ok {
		t.Fatalf("omitted-only update rejected: %q", msg)
	}
	// A provided-but-blank country/city/locale is rejected (set-or-leave has no
	// clear semantics; a blank locale must not default a RU profile back to EN).
	// The handler-level cases live in TestPatchProfileRejectsInvalidFields.
	empty := ""
	if _, ok := validateProfileUpdate(nil, &empty, nil, nil, nil); ok {
		t.Fatal("blank country accepted, want rejection")
	}
	if _, ok := validateProfileUpdate(nil, nil, nil, nil, &empty); ok {
		t.Fatal("blank locale accepted, want rejection")
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
