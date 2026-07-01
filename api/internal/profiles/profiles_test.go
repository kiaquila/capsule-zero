package profiles

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
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

func TestEnsureForIdentitySkipsNoopTimestampRefresh(t *testing.T) {
	now := time.Unix(1_720_000_000, 0).UTC()
	queryer := &capturingQueryer{
		row: fakeProfileRow{profile: Profile{
			UserID:      "profile-id",
			Email:       "person@example.com",
			DisplayName: "Person",
			Locale:      "en",
			CreatedAt:   now,
			UpdatedAt:   now,
		}},
	}
	repo := &Repo{pool: queryer}

	profile, err := repo.EnsureForIdentity(context.Background(), "kratos-id", "person@example.com", "Person", "en")
	if err != nil {
		t.Fatalf("EnsureForIdentity() error = %v", err)
	}
	if profile.UpdatedAt != now {
		t.Fatalf("UpdatedAt = %s, want %s", profile.UpdatedAt, now)
	}

	requiredFragments := []string{
		"WITH upsert AS",
		"WHERE profiles.email IS DISTINCT FROM EXCLUDED.email",
		"profiles.display_name IS DISTINCT FROM COALESCE(profiles.display_name, NULLIF(EXCLUDED.display_name, ''))",
		"NOT EXISTS (SELECT 1 FROM upsert)",
	}
	for _, fragment := range requiredFragments {
		if !strings.Contains(queryer.sql, fragment) {
			t.Fatalf("EnsureForIdentity SQL missing %q:\n%s", fragment, queryer.sql)
		}
	}
}

type capturingQueryer struct {
	sql  string
	args []any
	row  fakeProfileRow
}

func (q *capturingQueryer) QueryRow(_ context.Context, sql string, args ...any) pgx.Row {
	q.sql = sql
	q.args = args
	return q.row
}

type fakeProfileRow struct {
	profile Profile
	err     error
}

func (r fakeProfileRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	values := []any{
		r.profile.UserID,
		r.profile.Email,
		r.profile.DisplayName,
		r.profile.Locale,
		r.profile.Country,
		r.profile.City,
		r.profile.AvatarURL,
		r.profile.CoinBalance,
		r.profile.CreatedAt,
		r.profile.UpdatedAt,
	}
	for i, value := range values {
		switch target := dest[i].(type) {
		case *string:
			*target = value.(string)
		case *int:
			*target = value.(int)
		case *time.Time:
			*target = value.(time.Time)
		default:
			return errors.New("unsupported scan target")
		}
	}
	return nil
}
