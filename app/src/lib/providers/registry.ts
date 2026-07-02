import "server-only";

import type { ProviderMode, ProviderRegistry } from "./contracts";
import { createApiProviderRegistry } from "./api";
import { createMockProviderRegistry } from "./mock";
import { createSupabaseProviderRegistry } from "./supabase";

interface ProviderRegistryOptions {
  mode?: ProviderMode;
}

export function createProviderRegistry(
  options: ProviderRegistryOptions = {},
): ProviderRegistry {
  const mode = options.mode ?? readProviderMode();

  if (mode === "api") {
    return createApiProviderRegistry();
  }

  if (mode === "supabase") {
    return createSupabaseProviderRegistry();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Provider mode 'mock' is disabled in production. Use CAPSULE_PROVIDER_MODE=api.",
    );
  }
  return createMockProviderRegistry();
}

function readProviderMode(): ProviderMode {
  const rawMode = process.env.CAPSULE_PROVIDER_MODE;

  if (!rawMode) {
    return "mock";
  }

  if (rawMode === "mock" || rawMode === "supabase" || rawMode === "api") {
    return rawMode;
  }

  throw new Error(
    `Unsupported CAPSULE_PROVIDER_MODE '${rawMode}'. Use 'api' for the Go backend, 'supabase' for the legacy backend, or 'mock' for local fixture-only development.`,
  );
}
