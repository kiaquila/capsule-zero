package profiles

import (
	"errors"
	"testing"
)

func TestNormalizeLocale(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{name: "default empty to english", input: "", want: "en"},
		{name: "accept english", input: "en", want: "en"},
		{name: "accept russian", input: "ru", want: "ru"},
		{name: "reject deferred spanish", input: "es-AR", wantErr: true},
		{name: "reject typo", input: "eng", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NormalizeLocale(tt.input)
			if tt.wantErr {
				if !errors.Is(err, ErrUnsupportedLocale) {
					t.Fatalf("NormalizeLocale(%q) error = %v, want ErrUnsupportedLocale", tt.input, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("NormalizeLocale(%q) unexpected error: %v", tt.input, err)
			}
			if got != tt.want {
				t.Fatalf("NormalizeLocale(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}
