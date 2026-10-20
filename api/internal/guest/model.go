// Package guest persists explicit guest transfers independently of formal capsules.
package guest

import (
	_ "embed"
	"encoding/json"
	"errors"
	"regexp"
	"time"
)

var (
	ErrValidation = errors.New("invalid guest selection")
	ErrConflict   = errors.New("transfer already belongs to another selection or account")
	ErrNotFound   = errors.New("guest progress not found")
	uuidPattern   = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
)

//go:embed catalog-data.json
var catalogJSON []byte

// Preset is a server-trusted snapshot; clients submit IDs only.
type Preset struct {
	ID         string            `json:"id"`
	Wardrobe   string            `json:"wardrobe"`
	Role       string            `json:"role"`
	ColorID    string            `json:"colorId"`
	CategoryID string            `json:"categoryId"`
	Name       map[string]string `json:"name"`
}

type Input struct {
	TransferID string   `json:"transferId"`
	Wardrobe   string   `json:"wardrobe"`
	Picked     []string `json:"picked"`
}

type Saved struct {
	ID               string    `json:"id"`
	TransferID       string    `json:"transferId"`
	Wardrobe         string    `json:"wardrobe"`
	AlgorithmVersion string    `json:"algorithmVersion"`
	Items            []Preset  `json:"items"`
	CreatedAt        time.Time `json:"createdAt"`
}

type Item struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Preset    Preset    `json:"preset"`
	Status    string    `json:"status"`
	Favorite  bool      `json:"favorite"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Patch struct {
	Status   *string `json:"status,omitempty"`
	Favorite *bool   `json:"favorite,omitempty"`
}

func (in Input) snapshots() ([]Preset, error) {
	if !uuidPattern.MatchString(in.TransferID) || (in.Wardrobe != "female" && in.Wardrobe != "male" && in.Wardrobe != "mixed") || len(in.Picked) == 0 || len(in.Picked) > 32 {
		return nil, ErrValidation
	}
	var catalog []Preset
	if err := json.Unmarshal(catalogJSON, &catalog); err != nil {
		return nil, err
	}
	byID := make(map[string]Preset, len(catalog))
	for _, p := range catalog {
		byID[p.ID] = p
	}
	seen := make(map[string]bool)
	picked := make([]Preset, 0, len(in.Picked))
	for _, id := range in.Picked {
		p, ok := byID[id]
		if !ok || seen[id] || (in.Wardrobe != "mixed" && p.Wardrobe != in.Wardrobe) {
			return nil, ErrValidation
		}
		seen[id] = true
		picked = append(picked, p)
	}
	// No client-supplied counts or URLs are accepted. Existing guest-v1 evaluation
	// is reconstructed from these immutable attributes by the shared web evaluator.
	return picked, nil
}

func validPatch(p Patch) bool {
	if p.Status == nil && p.Favorite == nil {
		return false
	}
	if p.Status == nil {
		return true
	}
	switch *p.Status {
	case "active", "uncapsulated", "for_sale", "for_repair":
		return true
	}
	return false
}
