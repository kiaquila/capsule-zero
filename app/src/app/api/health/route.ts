import { API_VERSION } from "@/lib/api/generated/openapi";
import { createProviderRegistry } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = createProviderRegistry();
  const providerHealth = await providers.health();

  return Response.json({
    ok: providerHealth.status === "ok",
    apiVersion: API_VERSION,
    providerMode: providers.mode,
    providerHealth,
  });
}
