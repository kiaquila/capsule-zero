package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

// Exercise the real adapter -> handler boundary; arbitrary upstream text must
// never become the user-visible validation message or determine classification.
func TestRegistrationPasswordFeedback(t *testing.T) {
	for _, tc := range []struct {
		id   int
		code string
	}{
		{4000031, "PASSWORD_TOO_SIMILAR"}, {4000032, "PASSWORD_TOO_SHORT"},
		{4000033, "PASSWORD_TOO_LONG"}, {4000034, "PASSWORD_COMPROMISED"},
		{4000039, "PASSWORD_UNCHANGED"}, {4000005, "PASSWORD_POLICY_REJECTED"},
		{4000007, "VALIDATION_ERROR"}, {4999999, "VALIDATION_ERROR"},
	} {
		t.Run(tc.code, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				if r.Method == http.MethodGet {
					fmt.Fprint(w, `{"id":"registration-flow"}`)
					return
				}
				w.WriteHeader(http.StatusBadRequest)
				fmt.Fprintf(w, `{"ui":{"nodes":[{"messages":[{"id":%d,"type":"error","text":"sensitive upstream echo"}]}]}}`, tc.id)
			}))
			defer upstream.Close()
			handler := Handler{Kratos: kratos.New(upstream.URL, upstream.URL)}
			recorder := httptest.NewRecorder()
			handler.Registration(recorder, httptest.NewRequest(http.MethodPost, "/api/auth/registration", strings.NewReader(`{"email":"person@example.net","password":"Violet_73!Cedar","locale":"ru"}`)))
			var body httpx.ErrorBody
			if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if recorder.Code != 400 || body.Error.Code != tc.code {
				t.Fatalf("status/code = %d/%s, want 400/%s", recorder.Code, body.Error.Code, tc.code)
			}
			if strings.Contains(recorder.Body.String(), "sensitive upstream echo") {
				t.Fatal("upstream text leaked")
			}
		})
	}
}

func TestRegistrationOptionalName(t *testing.T) {
	for _, tc := range []struct {
		nameJSON string
		status   int
	}{
		{``, 200}, {`,"name":"Ян"`, 200}, {`,"name":"Л"`, 200},
		{`,"name":" Ян "`, 200}, {`,"name":""`, 400}, {`,"name":"   "`, 400}, {`,"name":null`, 400},
	} {
		t.Run(tc.nameJSON, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			handler := Handler{Kratos: fakeIdentityClient{}}
			handler.Registration(recorder, httptest.NewRequest(http.MethodPost, "/api/auth/registration", strings.NewReader(`{"email":"person@example.net","password":"Violet_73!Cedar"`+tc.nameJSON+`}`)))
			if recorder.Code != tc.status {
				t.Fatalf("status = %d, want %d", recorder.Code, tc.status)
			}
		})
	}
}

func TestProfileShortNamesRemainValid(t *testing.T) {
	for _, name := range []string{"Ян", "Л", "Li", "Ян Л"} {
		if msg, ok := validateProfileUpdate(&name, nil, nil, nil, nil); !ok {
			t.Fatalf("%q rejected: %s", name, msg)
		}
	}
}
