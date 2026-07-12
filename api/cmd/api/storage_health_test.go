package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandlerReportsObjectStorageFailure(t *testing.T) {
	recorder := httptest.NewRecorder()

	healthHandler(
		stubPinger{},
		stubReady{},
		stubReady{err: errors.New("private bucket unavailable")},
	)(recorder, httptest.NewRequest(http.MethodGet, "/api/health", nil))

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("health status = %d, want 503", recorder.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["storage"] != "error" || body["ok"] != false {
		t.Fatalf("health body = %v, want storage:error and ok:false", body)
	}
}
