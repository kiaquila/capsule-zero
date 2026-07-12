package httpx

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeJSONRejectsTrailingValues(t *testing.T) {
	request := httptest.NewRequest("POST", "/", strings.NewReader(`{"name":"first"} {"name":"second"}`))
	var body struct {
		Name string `json:"name"`
	}

	if err := DecodeJSON(request, &body); err == nil {
		t.Fatal("DecodeJSON() error = nil, want trailing-value rejection")
	}
}
