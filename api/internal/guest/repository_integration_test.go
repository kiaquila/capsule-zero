//go:build integration

package guest

import (
	"context"
	"errors"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/db"
	"github.com/kiaquila/capsule-zero/api/migrations"
)

func TestPostgresGuestTransfer(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL required")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := db.NewPool(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err = db.Migrate(ctx, pool, migrations.FS); err != nil {
		t.Fatal(err)
	}
	owner, other := newUUID(), newUUID()
	for _, id := range []string{owner, other} {
		if _, err = pool.Exec(ctx, `INSERT INTO profiles(id,kratos_identity_id,email) VALUES ($1,$2,$3)`, id, newUUID(), id+"@example.test"); err != nil {
			t.Fatal(err)
		}
		defer func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id=$1`, id) }()
	}
	repo := NewRepo(pool)
	in := Input{TransferID: newUUID(), Wardrobe: "mixed", Picked: []string{"w-tee-white", "m-trousers-black", "m-sneakers-white"}}
	// Simultaneous first attempts and retry after an ACK was lost return one row.
	var wg sync.WaitGroup
	results := make(chan Saved, 8)
	errs := make(chan error, 8)
	start := make(chan struct{})
	for range 8 {
		wg.Add(1)
		go func() { defer wg.Done(); <-start; s, e := repo.Save(ctx, owner, in); results <- s; errs <- e }()
	}
	close(start)
	wg.Wait()
	close(results)
	close(errs)
	for err := range errs {
		if err != nil {
			t.Fatal(err)
		}
	}
	var id string
	for s := range results {
		if id == "" {
			id = s.ID
		}
		if s.ID != id || len(s.Items) != 3 || s.Items[0].ID != in.Picked[0] || s.AlgorithmVersion != "guest-v1" {
			t.Fatalf("snapshot %+v", s)
		}
	}
	if _, err = repo.Save(ctx, other, in); !errors.Is(err, ErrConflict) {
		t.Fatalf("cross-owner replay: %v", err)
	}
	changed := in
	changed.Picked = []string{"m-tee-white"}
	if _, err = repo.Save(ctx, owner, changed); !errors.Is(err, ErrConflict) {
		t.Fatalf("changed input: %v", err)
	}
	if _, err = repo.Get(ctx, other, id); !errors.Is(err, ErrNotFound) {
		t.Fatalf("cross-owner read: %v", err)
	}
	if list, e := repo.List(ctx, other); e != nil || len(list) != 0 {
		t.Fatalf("other list %+v %v", list, e)
	}
	items, err := repo.Items(ctx, owner)
	if err != nil || len(items) != 3 {
		t.Fatalf("items=%+v err=%v", items, err)
	}
	status, fav := "for_sale", true
	updated, err := repo.Update(ctx, owner, items[0].ID, Patch{Status: &status, Favorite: &fav})
	if err != nil || !updated.Favorite || updated.Status != status {
		t.Fatalf("update %+v %v", updated, err)
	}
	if _, err = repo.Update(ctx, other, items[0].ID, Patch{Favorite: &fav}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("cross-owner patch %v", err)
	}
	// Another transfer overlaps two items, appends one, and preserves existing metadata.
	next := Input{TransferID: newUUID(), Wardrobe: "mixed", Picked: []string{"m-trousers-black", "m-sneakers-white", "w-bag-black"}}
	if _, err = repo.Save(ctx, owner, next); err != nil {
		t.Fatal(err)
	}
	again := NewRepo(pool) // new repository instance: no request/process memory involved.
	items, err = again.Items(ctx, owner)
	if err != nil || len(items) != 4 {
		t.Fatalf("dedup=%+v %v", items, err)
	}
	found := false
	for _, i := range items {
		if i.ID == updated.ID {
			found = i.Favorite && i.Status == status
		}
	}
	if !found {
		t.Fatal("existing favorite/status overwritten")
	}
	list, err := again.List(ctx, owner)
	if err != nil || len(list) != 2 {
		t.Fatalf("list %+v %v", list, err)
	}
	got, err := again.Get(ctx, owner, id)
	if err != nil || len(got.Items) != 3 || got.Items[0].ID != "w-tee-white" {
		t.Fatalf("restored %+v %v", got, err)
	}
}
