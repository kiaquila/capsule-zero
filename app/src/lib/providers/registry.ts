import "server-only";

import type { ProviderMode, ProviderRegistry } from "./contracts";
import { createMockProviderRegistry } from "./mock";
import { createSupabaseProviderRegistry } from "./supabase";

interface ProviderRegistryOptions {
  mode?: ProviderMode;
}

export function createProviderRegistry(
  options: ProviderRegistryOptions = {},
): ProviderRegistry {
  const mode = options.mode ?? readProviderMode();

  if (mode === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Provider mode 'mock' is disabled in production. Use CAPSULE_PROVIDER_MODE=supabase.",
      );
    }
    return createMockProviderRegistry();
  }

  return createSupabaseProviderRegistry();
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
    `Unsupported CAPSULE_PROVIDER_MODE '${rawMode}'. Use 'supabase' for production or 'mock' for local fixture-only development.`,
  );
}
