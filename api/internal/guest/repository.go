package guest

import (
	"context"
	"encoding/json"
	"errors"
	"slices"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct{ pool *pgxpool.Pool }

func NewRepo(pool *pgxpool.Pool) *Repo { return &Repo{pool: pool} }

const savedColumns = `id::text, transfer_id::text, wardrobe, algorithm_version, items, created_at`

func scanSaved(row pgx.Row) (Saved, error) {
	var s Saved
	var raw []byte
	err := row.Scan(&s.ID, &s.TransferID, &s.Wardrobe, &s.AlgorithmVersion, &raw, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return s, ErrNotFound
	}
	if err != nil {
		return s, err
	}
	err = json.Unmarshal(raw, &s.Items)
	return s, err
}

// Save commits the immutable transfer and deduplicated wardrobe entries together.
// The unique transfer key serializes concurrent retries, including lost ACKs.
func (r *Repo) Save(ctx context.Context, user string, in Input) (Saved, error) {
	presets, err := in.snapshots()
	if err != nil {
		return Saved{}, err
	}
	raw, err := json.Marshal(presets)
	if err != nil {
		return Saved{}, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Saved{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	tag, err := tx.Exec(ctx, `INSERT INTO guest_progress (transfer_id,user_id,wardrobe,algorithm_version,picked,items) VALUES ($1,$2,$3,'guest-v1',$4,$5) ON CONFLICT (transfer_id) DO NOTHING`, in.TransferID, user, in.Wardrobe, in.Picked, raw)
	if err != nil {
		return Saved{}, err
	}
	if tag.RowsAffected() == 0 {
		var owner, wardrobe string
		var picked []string
		err = tx.QueryRow(ctx, `SELECT user_id::text,wardrobe,picked FROM guest_progress WHERE transfer_id=$1`, in.TransferID).Scan(&owner, &wardrobe, &picked)
		if err != nil {
			return Saved{}, err
		}
		if owner != user || wardrobe != in.Wardrobe || !slices.Equal(picked, in.Picked) {
			return Saved{}, ErrConflict
		}
	} else {
		// Fixed lock order prevents deadlocks when independent saves overlap presets.
		sorted := slices.Clone(presets)
		slices.SortFunc(sorted, func(a, b Preset) int {
			if a.ID < b.ID {
				return -1
			}
			if a.ID > b.ID {
				return 1
			}
			return 0
		})
		for _, p := range sorted {
			data, marshalErr := json.Marshal(p)
			if marshalErr != nil {
				return Saved{}, marshalErr
			}
			if _, err = tx.Exec(ctx, `INSERT INTO guest_wardrobe_items (user_id,preset_id,preset) VALUES ($1,$2,$3) ON CONFLICT (user_id,preset_id) DO NOTHING`, user, p.ID, data); err != nil {
				return Saved{}, err
			}
		}
	}
	saved, err := scanSaved(tx.QueryRow(ctx, `SELECT `+savedColumns+` FROM guest_progress WHERE transfer_id=$1 AND user_id=$2`, in.TransferID, user))
	if err != nil {
		return Saved{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return Saved{}, err
	}
	return saved, nil
}

func (r *Repo) Get(ctx context.Context, user, id string) (Saved, error) {
	if !uuidPattern.MatchString(id) {
		return Saved{}, ErrNotFound
	}
	return scanSaved(r.pool.QueryRow(ctx, `SELECT `+savedColumns+` FROM guest_progress WHERE id=$1 AND user_id=$2`, id, user))
}
func (r *Repo) List(ctx context.Context, user string) ([]Saved, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+savedColumns+` FROM guest_progress WHERE user_id=$1 ORDER BY created_at DESC,id`, user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Saved{}
	for rows.Next() {
		s, e := scanSaved(rows)
		if e != nil {
			return nil, e
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

const itemColumns = `id::text,user_id::text,preset,status,favorite,created_at,updated_at`

func scanItem(row pgx.Row) (Item, error) {
	var i Item
	var raw []byte
	err := row.Scan(&i.ID, &i.UserID, &raw, &i.Status, &i.Favorite, &i.CreatedAt, &i.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return i, ErrNotFound
	}
	if err != nil {
		return i, err
	}
	err = json.Unmarshal(raw, &i.Preset)
	return i, err
}
func (r *Repo) Items(ctx context.Context, user string) ([]Item, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+itemColumns+` FROM guest_wardrobe_items WHERE user_id=$1 ORDER BY created_at,id`, user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Item{}
	for rows.Next() {
		i, e := scanItem(rows)
		if e != nil {
			return nil, e
		}
		out = append(out, i)
	}
	return out, rows.Err()
}
func (r *Repo) Update(ctx context.Context, user, id string, p Patch) (Item, error) {
	if !uuidPattern.MatchString(id) {
		return Item{}, ErrNotFound
	}
	if !validPatch(p) {
		return Item{}, ErrValidation
	}
	return scanItem(r.pool.QueryRow(ctx, `UPDATE guest_wardrobe_items SET status=COALESCE($3,status),favorite=COALESCE($4,favorite),updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING `+itemColumns, id, user, p.Status, p.Favorite))
}
