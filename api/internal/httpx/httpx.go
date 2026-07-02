// Package httpx holds small JSON request/response helpers shared by handlers.
package httpx

import (
	"bytes"
	"encoding/json"
	"io"
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

// DecodeJSONObject strictly decodes a JSON object body into v and also returns
// the raw field values, so handlers can distinguish an explicitly provided
// JSON null from an omitted field — encoding/json decodes both into a nil
// pointer, which set-or-leave contracts must not conflate.
func DecodeJSONObject(r *http.Request, v any) (map[string]json.RawMessage, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(v); err != nil {
		return nil, err
	}
	return raw, nil
}

// IsJSONNull reports whether a raw field value is an explicit JSON null.
func IsJSONNull(raw json.RawMessage) bool {
	return string(bytes.TrimSpace(raw)) == "null"
}
