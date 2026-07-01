// Package httpx holds small JSON request/response helpers shared by handlers.
package httpx

import (
	"encoding/json"
	"net/http"
)

// WriteJSON serialises v as JSON with the given status code.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// ErrorBody is the stable error envelope returned to clients. The web provider
// surfaces Error.Message inline; Error.Code lets the UI branch without string
// matching.
type ErrorBody struct {
	Error ErrorPayload `json:"error"`
}

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// WriteError writes a JSON error envelope.
func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteJSON(w, status, ErrorBody{
		Error: ErrorPayload{
			Code:    code,
			Message: message,
		},
	})
}

// DecodeJSON reads and strictly decodes a JSON request body into v.
func DecodeJSON(r *http.Request, v any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}
