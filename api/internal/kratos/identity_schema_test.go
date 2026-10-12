package kratos

import (
	"encoding/json"
	"os"
	"testing"
)

func TestIdentityPersonalNameContract(t *testing.T) {
	raw, err := os.ReadFile("../../../infra/kratos/identity.schema.json")
	if err != nil {
		t.Fatal(err)
	}
	var schema map[string]any
	if err := json.Unmarshal(raw, &schema); err != nil {
		t.Fatal(err)
	}
	props := schema["properties"].(map[string]any)
	traits := props["traits"].(map[string]any)["properties"].(map[string]any)
	first := traits["name"].(map[string]any)["properties"].(map[string]any)["first"].(map[string]any)
	if first["minLength"] != float64(1) || first["maxLength"] != float64(80) || first["pattern"] != `\S` {
		t.Fatalf("name contract = %#v, want 1–80 nonblank characters", first)
	}
}
