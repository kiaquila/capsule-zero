import "server-only";

import type { ProviderMode, ProviderRegistry } from "./contracts";
import { createMockProviderRegistry } from "./mock";

interface ProviderRegistryOptions {
  mode?: ProviderMode;
}

export function createProviderRegistry(
  options: ProviderRegistryOptions = {},
): ProviderRegistry {
  const mode = options.mode ?? readProviderMode();

  if (mode === "mock") {
    return createMockProviderRegistry();
  }

  throw new Error(
    "Provider mode 'supabase' is an integration gate. Keep Stage 1 on mock " +
      "until Supabase credentials, RLS validation, and provider evidence are ready.",
  );
}

function readProviderMode(): ProviderMode {
  const rawMode = process.env.CAPSULE_PROVIDER_MODE;

  if (!rawMode) {
    return "mock";
  }

  if (rawMode === "mock" || rawMode === "supabase") {
    return rawMode;
  }

  throw new Error(
    `Unsupported CAPSULE_PROVIDER_MODE '${rawMode}'. Use 'mock' for Stage 1.`,
  );
}
