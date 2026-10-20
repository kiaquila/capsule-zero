package guest

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSelectionValidation(t *testing.T) {
	base := Input{TransferID: newUUID(), Wardrobe: "mixed", Picked: []string{"w-tee-white", "m-trousers-black", "m-sneakers-white"}}
	good, err := base.snapshots()
	if err != nil || len(good) != 3 || good[0].Name["en"] != "White T-shirt" {
		t.Fatalf("trusted snapshot: %+v %v", good, err)
	}
	for name, modify := range map[string]func(*Input){
		"bad UUID":       func(i *Input) { i.TransferID = "not-uuid" },
		"bad wardrobe":   func(i *Input) { i.Wardrobe = "other" },
		"unknown preset": func(i *Input) { i.Picked = []string{"https://evil.test/a.jpg"} },
		"empty":          func(i *Input) { i.Picked = nil },
		"duplicate":      func(i *Input) { i.Picked = []string{"w-tee-white", "w-tee-white"} },
		"wrong gender":   func(i *Input) { i.Wardrobe = "female" },
		"too many":       func(i *Input) { i.Picked = make([]string, 33) },
	} {
		t.Run(name, func(t *testing.T) {
			in := base
			modify(&in)
			if _, err := in.snapshots(); !errors.Is(err, ErrValidation) {
				t.Fatalf("error = %v", err)
			}
		})
	}
}

type fakeStore struct {
	calls int
	owner string
	err   error
}

func (f *fakeStore) Save(_ context.Context, user string, in Input) (Saved, error) {
	f.calls++
	f.owner = user
	return Saved{TransferID: in.TransferID}, f.err
}
func (f *fakeStore) List(_ context.Context, user string) ([]Saved, error) {
	f.calls++
	f.owner = user
	return []Saved{}, f.err
}
func (f *fakeStore) Get(_ context.Context, user, id string) (Saved, error) {
	f.calls++
	f.owner = user
	return Saved{ID: id}, f.err
}
func (f *fakeStore) Items(_ context.Context, user string) ([]Item, error) {
	f.calls++
	f.owner = user
	return []Item{}, f.err
}
func (f *fakeStore) Update(_ context.Context, user, id string, _ Patch) (Item, error) {
	f.calls++
	f.owner = user
	return Item{ID: id}, f.err
}

func TestHandlerStrictBodiesAndOwner(t *testing.T) {
	in := Input{TransferID: newUUID(), Wardrobe: "male", Picked: []string{"m-tee-white"}}
	raw, _ := json.Marshal(in)
	for _, tc := range []struct {
		name, body string
		want       int
	}{
		{"valid", string(raw), 200}, {"extra field", strings.TrimSuffix(string(raw), "}") + `,"count":900}`, 400},
		{"trailing value", string(raw) + ` {}`, 400}, {"oversized", strings.Repeat(" ", 8193) + string(raw), 400},
		{"client owner", strings.TrimSuffix(string(raw), "}") + `,"userId":"attacker"}`, 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			f := &fakeStore{}
			h := Handler{Repo: f, UserID: func(context.Context) (string, bool) { return "session-owner", true }}
			w := httptest.NewRecorder()
			h.Save(w, httptest.NewRequest("POST", "/api/guest-progress", strings.NewReader(tc.body)))
			if w.Code != tc.want {
				t.Fatalf("status=%d body=%s", w.Code, w.Body)
			}
			if tc.want == 200 && (f.calls != 1 || f.owner != "session-owner") {
				t.Fatal("session owner not used")
			}
			if tc.want == 400 && f.calls != 0 {
				t.Fatal("invalid input reached store")
			}
		})
	}
}

func TestHandlerErrorMapping(t *testing.T) {
	for err, want := range map[error]int{ErrValidation: 400, ErrConflict: 409, ErrNotFound: 404, errors.New("secret database details"): 500} {
		w := httptest.NewRecorder()
		respond(w, nil, err)
		if w.Code != want || strings.Contains(w.Body.String(), "secret") {
			t.Fatalf("%v -> %d %s", err, w.Code, w.Body)
		}
	}
	h := &Handler{}
	for _, method := range []http.HandlerFunc{h.Save, h.List, h.Get, h.Items, h.Update} {
		w := httptest.NewRecorder()
		method(w, httptest.NewRequest("POST", "/", nil))
		if w.Code != 401 {
			t.Fatalf("unauthenticated=%d", w.Code)
		}
	}
}

func TestPatchRejectsMalformedAndUsesOwner(t *testing.T) {
	for _, body := range []string{`{}`, `{"favorite":null}`, `{"status":null}`, `{"status":"other"}`, `{"favorite":"yes"}`, `{"preset":{}}`, `{"favorite":true} {}`} {
		f := &fakeStore{}
		h := Handler{Repo: f, UserID: func(context.Context) (string, bool) { return "owner", true }}
		r := httptest.NewRequest("PATCH", "/", strings.NewReader(body))
		r.SetPathValue("id", newUUID())
		w := httptest.NewRecorder()
		h.Update(w, r)
		if w.Code != 400 || f.calls != 0 {
			t.Errorf("%s -> %d, calls %d", body, w.Code, f.calls)
		}
	}
}

func newUUID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
