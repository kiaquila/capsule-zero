// Package profiles owns the application profile keyed by an internal UUID with
// a unique reference to the Kratos identity.
package profiles

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrNotFound is returned when no profile matches.
var ErrNotFound = errors.New("profile not found")

// ErrUnsupportedLocale is returned when a profile write requests a locale
// outside the active v0.1 locale scope.
var ErrUnsupportedLocale = errors.New("unsupported profile locale")

// Profile mirrors the web ProfileRepository contract.
type Profile struct {
	UserID      string    `json:"userId"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName"`
	Locale      string    `json:"locale"`
	Country     string    `json:"country,omitempty"`
	City        string    `json:"city,omitempty"`
	AvatarURL   string    `json:"avatarUrl,omitempty"`
	CoinBalance int       `json:"coinBalance"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Update is the set of mutable profile fields.
type Update struct {
	DisplayName *string
	Locale      *string
	Country     *string
	City        *string
	AvatarURL   *string
}

// Repo is the profile data access layer.
type Repo struct {
	pool rowQuerier
}

type rowQuerier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// New builds a profile repository.
func New(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

const columns = `id, email, COALESCE(display_name, '') AS display_name, locale,
	COALESCE(country, '') AS country, COALESCE(city, '') AS city, COALESCE(avatar_url, '') AS avatar_url,
	coin_balance, created_at, updated_at`

// EnsureForIdentity returns the profile for a Kratos identity, creating it on
// first sign-in. Email is refreshed from the identity; display name is seeded
// only while empty so user profile edits are not overwritten by stale traits.
// Concurrency-safe via ON CONFLICT plus one retry: when two first sign-ins
// race, the loser's ON CONFLICT waits for the winner's insert to commit and
// then no-ops under the update guard, so the upsert CTE returns no row — and
// the fallback SELECT runs on a statement snapshot taken before that commit,
// which cannot see the new row yet. The retry re-executes on a fresh snapshot.
func (r *Repo) EnsureForIdentity(ctx context.Context, identityID, email, displayName, locale string) (Profile, error) {
	locale = NormalizeLocaleOrDefault(locale)
	profile, err := r.ensureForIdentity(ctx, identityID, email, displayName, locale)
	if errors.Is(err, ErrNotFound) {
		profile, err = r.ensureForIdentity(ctx, identityID, email, displayName, locale)
	}
	return profile, err
}

func (r *Repo) ensureForIdentity(ctx context.Context, identityID, email, displayName, locale string) (Profile, error) {
	row := r.pool.QueryRow(ctx, `
		WITH upsert AS (
			INSERT INTO profiles (kratos_identity_id, email, display_name, locale)
			VALUES ($1, $2, NULLIF($3, ''), $4)
			ON CONFLICT (kratos_identity_id) DO UPDATE
				SET email = EXCLUDED.email,
				    display_name = COALESCE(profiles.display_name, NULLIF(EXCLUDED.display_name, '')),
				    updated_at = now()
				WHERE profiles.email IS DISTINCT FROM EXCLUDED.email
				   OR profiles.display_name IS DISTINCT FROM COALESCE(profiles.display_name, NULLIF(EXCLUDED.display_name, ''))
			RETURNING `+columns+`
		)
		SELECT `+columns+` FROM upsert
		UNION ALL
		SELECT `+columns+` FROM profiles
		WHERE kratos_identity_id = $1
		  AND NOT EXISTS (SELECT 1 FROM upsert)
		LIMIT 1`,
		identityID, email, displayName, locale)
	return scan(row)
}

// GetByUserID returns a profile by its internal UUID.
func (r *Repo) GetByUserID(ctx context.Context, userID string) (Profile, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+columns+` FROM profiles WHERE id = $1`, userID)
	return scan(row)
}

// Apply updates the mutable fields and returns the refreshed profile.
func (r *Repo) Apply(ctx context.Context, userID string, update Update) (Profile, error) {
	locale := update.Locale
	if update.Locale != nil {
		normalized, err := NormalizeLocale(*update.Locale)
		if err != nil {
			return Profile{}, err
		}
		locale = &normalized
	}
	row := r.pool.QueryRow(ctx, `
		UPDATE profiles SET
			display_name = COALESCE($2, display_name),
			locale       = COALESCE($3, locale),
			country      = COALESCE($4, country),
			city         = COALESCE($5, city),
			avatar_url   = COALESCE($6, avatar_url),
			updated_at   = now()
		WHERE id = $1
		RETURNING `+columns,
		userID, update.DisplayName, locale, update.Country, update.City, update.AvatarURL)
	return scan(row)
}

// NormalizeLocale constrains profile locale persistence to active v0.1 locales.
func NormalizeLocale(locale string) (string, error) {
	switch locale {
	case "", "en":
		return "en", nil
	case "ru":
		return "ru", nil
	default:
		return "", ErrUnsupportedLocale
	}
}

// NormalizeLocaleOrDefault keeps identity sync resilient if an upstream trait is
// absent or stale.
func NormalizeLocaleOrDefault(locale string) string {
	normalized, err := NormalizeLocale(locale)
	if err != nil {
		return "en"
	}
	return normalized
}

func scan(row pgx.Row) (Profile, error) {
	var p Profile
	if err := row.Scan(
		&p.UserID, &p.Email, &p.DisplayName, &p.Locale,
		&p.Country, &p.City, &p.AvatarURL,
		&p.CoinBalance, &p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Profile{}, ErrNotFound
		}
		return Profile{}, err
	}
	return p, nil
}
