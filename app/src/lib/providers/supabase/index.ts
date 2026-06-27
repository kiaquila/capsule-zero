import "server-only";

import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  canWriteAppSessionCookie,
  persistAppSession,
  readSignedAppSession,
  type PersistedAppSession,
} from "@/features/auth/session";
import { getCategoriesByGender } from "@/lib/categories";
import type {
  Capsule,
  CapsuleCategory,
  CapsulePalette,
  ColorGroup,
  ColorHue,
  ColorPoint,
  ColorTemperature,
  GarderType,
  Locale,
  User,
} from "@/types";
import type {
  BillingPort,
  CapsuleDraft,
  CatalogSearchFilters,
  CatalogSearchPort,
  CoinLedgerEntry,
  CoinPack,
  CoinSpendRequest,
  ImageProcessingPort,
  InvoiceStatus,
  ItemDraft,
  ItemSourceType,
  ItemStatus,
  LavaInvoice,
  LavaWebhookReplay,
  MarketplaceCandidate,
  MarketplaceImport,
  MarketplaceImportPort,
  MarketplaceImportStatus,
  MethodologyPort,
  PaletteValidationResult,
  PhotoUploadMetadata,
  Profile,
  ProfileRepository,
  ProfileUpdate,
  ProviderHealth,
  ProviderRegistry,
  Session,
  StoragePort,
  UploadCompletion,
  UploadJob,
  UploadJobStatus,
  UploadTarget,
  WardrobeEntry,
  WardrobeListFilters,
  WardrobeRepository,
} from "../contracts";

type DbClient = SupabaseClient;

interface DbProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  language: Locale | null;
  country: string | null;
  city: string | null;
  coin_balance: number;
  created_at: string;
  updated_at: string;
}

interface DbColor {
  id: string;
  name: string;
  hex: string;
  color_group: ColorGroup;
  sort_order: number;
}

interface DbCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string | null;
  wardrobe_types: GarderType[];
  layer: string;
  sort_order: number;
}

interface DbItem {
  id: string;
  owner_user_id: string | null;
  name: string;
  category_id: string;
  color_ids: string[];
  brand: string | null;
  material: string | null;
  price: number | string | null;
  source_url: string | null;
  source_type: ItemSourceType;
  visibility: "private" | "moderation_pending" | "public";
  version: number;
  created_at: string;
  updated_at: string;
}

interface DbWardrobeEntry {
  id: string;
  user_id: string;
  item_id: string;
  status: ItemStatus;
  favorite: boolean;
  from_catalog: boolean;
  user_name_override: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

interface DbAsset {
  id: string;
  user_id: string | null;
  item_id: string | null;
  bucket: string;
  object_path: string;
  variant: string;
  mime_type: string | null;
  created_at: string;
}

interface DbCapsule {
  id: string;
  user_id: string;
  name: string;
  wardrobe_type: GarderType;
  item_count: number;
  outfit_count: number;
  created_at: string;
  updated_at: string;
}

interface DbCapsulePaletteColor {
  capsule_id: string;
  color_id: string;
}

interface DbCapsuleCategoryTarget {
  capsule_id: string;
  category_id: string;
  quantity: number;
}

interface DbCapsuleItem {
  capsule_id: string;
  wardrobe_entry_id: string;
}

interface DbGapRecommendation {
  id: string;
  capsule_id: string;
  category_id: string;
  color_ids: string[];
  priority: "high" | "medium" | "low";
  impact: number | string;
}

interface DbUploadJob {
  id: string;
  user_id: string;
  item_asset_id: string | null;
  job_type: UploadJob["type"];
  status: string;
  provider: string | null;
  duration_ms: number | null;
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbMarketplaceImport {
  id: string;
  user_id: string;
  urls: string[];
  status: string;
  candidates: unknown;
  confirmed_item_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbCoinPack {
  id: string;
  coins: number;
  provider_product_id: string | null;
  price_usd?: number | string | null;
}

interface DbLavaInvoice {
  id: string;
  user_id: string;
  coin_pack_id: string;
  lava_invoice_id: string;
  status: InvoiceStatus;
  payment_url: string;
  created_at: string;
  updated_at: string;
}

interface DbCoinSpendResult {
  id: string;
  user_id: string;
  lava_event_id: string | null;
  amount: number;
  reason: CoinLedgerEntry["reason"];
  target_id: string | null;
  idempotency_key: string;
  created_at: string;
  profile_email: string | null;
  profile_display_name: string | null;
  profile_language: Locale | null;
  profile_country: string | null;
  profile_city: string | null;
  profile_coin_balance: number;
  profile_created_at: string;
  profile_updated_at: string;
}

const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const BACKGROUND_REMOVAL_TIMEOUT_MS = 5_000;
const MAX_PALETTE_COLORS = 15;
const MAX_CHROMATIC_COLORS = 12;
const EXTERNAL_ASSET_BUCKET = "external-url";
const KNOWN_STORAGE_BUCKETS = new Set([
  "avatars",
  "item-originals",
  "item-processed",
  "marketplace-imports",
  "catalog-public",
  EXTERNAL_ASSET_BUCKET,
]);

const CATEGORY_TO_DB_SLUG: Record<string, string> = {
  "tank-top": "tank-top-cami",
  shirt: "button-down-shirt",
  sweater: "crew-neck-sweater",
  bomber: "jacket",
  tshirt: "t-shirt",
  polo: "t-shirt",
  hoodie: "hoodie-sweatshirt",
  longsleeve: "turtleneck",
  leggings: "trousers",
  trench: "trench-coat",
  "short-coat": "coat",
  heels: "pumps-dress-shoes",
  flats: "pumps-dress-shoes",
  tote: "tote-bag",
  crossbody: "crossbody-bag",
};

const DB_SLUG_TO_CATEGORY: Record<string, string> = {
  "tank-top-cami": "tank-top",
  "button-down-shirt": "shirt",
  "crew-neck-sweater": "sweater",
  jacket: "bomber",
  "t-shirt": "tshirt",
  "hoodie-sweatshirt": "hoodie",
  "trench-coat": "trench",
  coat: "coat",
  "pumps-dress-shoes": "heels",
  "tote-bag": "tote",
  "crossbody-bag": "crossbody",
};

const NO_MATCH_UUID = "00000000-0000-0000-0000-000000000000";

const HUES: ColorHue[] = [
  "red",
  "red-orange",
  "orange",
  "yellow-orange",
  "yellow",
  "yellow-green",
  "green",
  "blue-green",
  "blue",
  "blue-violet",
  "violet",
  "red-violet",
];

export function createSupabaseProviderRegistry(): ProviderRegistry {
  const clients = createSupabaseClients();
  const colorCatalog = memoize(() => loadColorCatalog(clients.service));
  const categoryCatalog = memoize(() => loadCategoryCatalog(clients.service));

  const profiles = buildProfileRepository(clients.service);
  const wardrobe = buildWardrobeRepository(
    clients,
    colorCatalog,
    categoryCatalog,
  );
  const capsules = buildCapsuleRepository(
    clients.service,
    colorCatalog,
    categoryCatalog,
  );

  return {
    mode: "supabase",
    auth: buildAuthPort(clients, profiles),
    profiles,
    wardrobe,
    storage: buildStoragePort(clients),
    imageProcessing: buildImageProcessingPort(clients),
    marketplaceImports: buildMarketplaceImportPort(
      clients.service,
      wardrobe,
    ),
    catalogSearch: buildCatalogSearchPort(
      clients,
      colorCatalog,
      categoryCatalog,
    ),
    billing: buildBillingPort(clients.service),
    capsules,
    methodology: buildMethodologyPort(
      clients.service,
      colorCatalog,
      categoryCatalog,
    ),
    health: () => readHealth(clients.service),
  };
}

function createSupabaseClients(): {
  anon: DbClient;
  service: DbClient;
  internalUrl: string;
  publicUrl: string;
} {
  const internalUrl = requiredEnv(
    "SUPABASE_INTERNAL_URL",
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publicUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || internalUrl;
  const anonKey = requiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const serviceRoleKey = requiredEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };

  return {
    anon: createClient(internalUrl, anonKey, options),
    service: createClient(internalUrl, serviceRoleKey, options),
    internalUrl,
    publicUrl,
  };
}

function buildAuthPort(
  clients: ReturnType<typeof createSupabaseClients>,
  profiles: ProfileRepository,
): ProviderRegistry["auth"] {
  return {
    async getCurrentSession() {
      const persisted = await readSignedAppSession();
      if (!persisted) {
        return null;
      }

      return verifyPersistedSession(clients, persisted);
    },

    async signUpWithPassword(credentials) {
      const { data, error } = await clients.anon.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { name: credentials.name },
        },
      });
      throwIfError(error, "Supabase sign-up failed");

      if (!data.user || !data.session) {
        throw new Error(
          "AUTH_CONFIRMATION_REQUIRED: Supabase sign-up requires email confirmation before a web session can be created.",
        );
      }

      await upsertProfileFromAuthUser(
        clients.service,
        data.user.id,
        data.user.email ?? credentials.email,
        credentials.name,
      );

      return mapSession(data.user, data.session);
    },

    async signInWithPassword(credentials) {
      const { data, error } = await clients.anon.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      throwIfError(error, "Supabase sign-in failed");

      if (!data.user || !data.session) {
        throw new Error("AUTH_FAILED: Supabase did not return a session.");
      }

      await upsertProfileFromAuthUser(
        clients.service,
        data.user.id,
        data.user.email ?? credentials.email,
        readMetadataName(data.user.user_metadata),
      );

      return mapSession(data.user, data.session);
    },

    async requestPasswordRecovery(email) {
      const redirectTo = new URL(
        "/en/auth",
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      ).toString();
      const { error } = await clients.anon.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      throwIfError(error, "Supabase password recovery failed");
      return { delivery: "email", email };
    },

    async signOut() {
      const persisted = await readSignedAppSession();
      if (!persisted?.accessToken) {
        return;
      }
      const { error } = await clients.service.auth.admin.signOut(
        persisted.accessToken,
      );
      if (error) {
        console.warn("Supabase sign-out failed", error.message);
      }
      void profiles;
    },
  };
}

async function verifyPersistedSession(
  clients: ReturnType<typeof createSupabaseClients>,
  persisted: PersistedAppSession,
): Promise<Session | null> {
  if (!persisted.accessToken) {
    return null;
  }

  let accessToken = persisted.accessToken;
  let refreshToken = persisted.refreshToken;
  let expiresAt = persisted.expiresAt;
  let refreshedSession = false;
  const expiresAtMs = Date.parse(expiresAt);
  const shouldRefreshSession =
    Boolean(refreshToken) &&
    (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now() + 60_000);

  if (refreshToken && shouldRefreshSession && (await canWriteAppSessionCookie())) {
    const refreshed = await clients.anon.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (refreshed.error || !refreshed.data.session) {
      return null;
    }

    accessToken = refreshed.data.session.access_token;
    refreshToken = refreshed.data.session.refresh_token;
    refreshedSession = true;
    expiresAt = refreshed.data.session.expires_at
      ? new Date(refreshed.data.session.expires_at * 1000).toISOString()
      : expiresAt;
  }

  const { data, error } = await clients.anon.auth.getUser(accessToken);
  if (error || !data.user || data.user.id !== persisted.userId) {
    return null;
  }

  const session = {
    user: {
      id: data.user.id,
      email: data.user.email ?? persisted.email,
      name: readMetadataName(data.user.user_metadata) ?? persisted.name,
      createdAt: data.user.created_at ?? persisted.createdAt ?? persisted.expiresAt,
    },
    accessToken,
    refreshToken,
    expiresAt,
  };

  if (refreshedSession) {
    await persistAppSession(session);
  }

  return session;
}

function buildProfileRepository(service: DbClient): ProfileRepository {
  return {
    async getProfile(userId) {
      const { data, error } = await service
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      throwIfError(error, "Failed to load profile");

      if (data) {
        return mapProfile(data as DbProfile);
      }

      const { data: userData, error: userError } =
        await service.auth.admin.getUserById(userId);
      throwIfError(userError, "Failed to bootstrap profile");

      if (!userData.user?.email) {
        throw new Error("NOT_FOUND: Profile not found.");
      }

      return upsertProfileFromAuthUser(
        service,
        userId,
        userData.user.email,
        readMetadataName(userData.user.user_metadata),
      );
    },

    async updateProfile(userId, input: ProfileUpdate) {
      const payload = {
        display_name: input.displayName,
        language: input.locale,
        country: input.country,
        city: input.city,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await service
        .from("profiles")
        .update(stripUndefined(payload))
        .eq("user_id", userId)
        .select("*")
        .single();
      throwIfError(error, "Failed to update profile");
      return mapProfile(data as DbProfile);
    },
  };
}

function buildWardrobeRepository(
  clients: ReturnType<typeof createSupabaseClients>,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
): WardrobeRepository {
  const service = clients.service;

  return {
    async listItems(userId, filters) {
      let query = service
        .from("wardrobe_entries")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.favorite !== undefined) {
        query = query.eq("favorite", filters.favorite);
      }

      const { data, error } = await query;
      throwIfError(error, "Failed to load wardrobe entries");

      let entries = (data ?? []) as DbWardrobeEntry[];
      if (filters?.capsuleId) {
        const { data: rows, error: capsuleError } = await service
          .from("capsule_items")
          .select("wardrobe_entry_id")
          .eq("capsule_id", filters.capsuleId);
        throwIfError(capsuleError, "Failed to load capsule membership");
        const allowed = new Set(
          ((rows ?? []) as Pick<DbCapsuleItem, "wardrobe_entry_id">[]).map(
            (row) => row.wardrobe_entry_id,
          ),
        );
        entries = entries.filter((entry) => allowed.has(entry.id));
      }

      const mapped = await mapWardrobeEntries(
        clients,
        colorCatalog,
        categoryCatalog,
        entries,
      );
      return applyWardrobeFilters(mapped, filters);
    },

    async getItem(userId, itemId) {
      const { data, error } = await service
        .from("wardrobe_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("id", itemId)
        .maybeSingle();
      throwIfError(error, "Failed to load wardrobe item");

      if (!data) {
        return null;
      }

      const [item] = await mapWardrobeEntries(
        clients,
        colorCatalog,
        categoryCatalog,
        [data as DbWardrobeEntry],
      );
      return item ?? null;
    },

    async createItem(userId, draft) {
      const category = await findDbCategory(categoryCatalog, draft.categoryId);
      const colorIds = await resolveColorIds(colorCatalog, draft.colorPoints);
      const { data: item, error: itemError } = await service
        .from("items")
        .insert({
          owner_user_id: userId,
          name: draft.name,
          category_id: category.id,
          color_ids: colorIds,
          brand: draft.brand,
          material: draft.material,
          price: draft.price,
          source_url: draft.sourceUrl,
          source_type: draft.sourceType,
          visibility: draft.isPublic ? "moderation_pending" : "private",
          moderation_status: draft.isPublic ? "pending" : "none",
        })
        .select("*")
        .single();
      throwIfError(itemError, "Failed to create item");

      const { data: entry, error: entryError } = await service
        .from("wardrobe_entries")
        .insert({
          user_id: userId,
          item_id: (item as DbItem).id,
          status: "active",
          favorite: false,
          from_catalog: draft.sourceType === "catalog",
        })
        .select("*")
        .single();
      throwIfError(entryError, "Failed to create wardrobe entry");

      await maybeAttachDraftAsset(service, userId, item as DbItem, draft);

      const [mapped] = await mapWardrobeEntries(
        clients,
        colorCatalog,
        categoryCatalog,
        [entry as DbWardrobeEntry],
      );
      return requireValue(mapped, "Failed to map created wardrobe item");
    },

    async updateItemStatus(userId, itemId, status) {
      const { data, error } = await service
        .from("wardrobe_entries")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("id", itemId)
        .select("*")
        .single();
      throwIfError(error, "Failed to update wardrobe status");

      const [mapped] = await mapWardrobeEntries(
        clients,
        colorCatalog,
        categoryCatalog,
        [data as DbWardrobeEntry],
      );
      return requireValue(mapped, "Failed to map updated wardrobe item");
    },

    async setFavorite(userId, itemId, favorite) {
      const { data, error } = await service
        .from("wardrobe_entries")
        .update({ favorite, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", itemId)
        .select("*")
        .single();
      throwIfError(error, "Failed to update favorite state");

      const [mapped] = await mapWardrobeEntries(
        clients,
        colorCatalog,
        categoryCatalog,
        [data as DbWardrobeEntry],
      );
      return requireValue(mapped, "Failed to map favorite wardrobe item");
    },
  };
}

function buildStoragePort(
  clients: ReturnType<typeof createSupabaseClients>,
): StoragePort {
  const service = clients.service;

  return {
    async createPhotoUploadTarget(userId, metadata: PhotoUploadMetadata) {
      validateUploadMetadata(metadata);

      const uploadId = randomUUID();
      const objectPath = `${userId}/${uploadId}/${sanitizeFileName(
        metadata.fileName,
      )}`;
      const { data: signed, error: signedError } = await service.storage
        .from("item-originals")
        .createSignedUploadUrl(objectPath);
      throwIfError(signedError, "Failed to create Supabase upload URL");
      const signedUrl = requireValue(
        signed?.signedUrl,
        "Failed to create Supabase upload URL.",
      );

      const { data: job, error: jobError } = await service
        .from("upload_jobs")
        .insert({
          user_id: userId,
          job_type: "photo_upload",
          status: "queued",
          provider: "supabase_storage",
          payload: {
            uploadId,
            bucket: "item-originals",
            storagePath: objectPath,
            metadata,
          },
        })
        .select("*")
        .single();
      throwIfError(jobError, "Failed to create upload job");

      return {
        uploadId,
        jobId: (job as DbUploadJob).id,
        uploadUrl: normalizeSupabaseUrl(clients, signedUrl),
        storagePath: `item-originals/${objectPath}`,
        maxBytes: MAX_UPLOAD_BYTES,
        acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      } satisfies UploadTarget;
    },

    async completePhotoUpload(userId, completion: UploadCompletion) {
      const { bucket, objectPath } = parseStoragePath(completion.storagePath);
      assertUserOwnedStoragePath(userId, { bucket, objectPath });
      const { data: asset, error: assetError } = await service
        .from("item_assets")
        .upsert(
          {
            user_id: userId,
            bucket,
            object_path: objectPath,
            variant: "original",
          },
          { onConflict: "bucket,object_path" },
        )
        .select("*")
        .single();
      throwIfError(assetError, "Failed to register uploaded asset");

      const { data: job, error: jobError } = await service
        .from("upload_jobs")
        .update({
          item_asset_id: (asset as DbAsset).id,
          status: "succeeded",
          payload: {
            uploadId: completion.uploadId,
            bucket,
            storagePath: objectPath,
            originalUrl: completion.originalUrl,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .contains("payload", { uploadId: completion.uploadId })
        .select("*")
        .single();
      throwIfError(jobError, "Failed to complete upload job");
      return mapUploadJob(job as DbUploadJob, completion.originalUrl);
    },

    async getSignedAssetUrl(userId, storagePath) {
      const { bucket, objectPath } = parseStoragePath(storagePath);
      assertUserOwnedStoragePath(userId, { bucket, objectPath });
      if (bucket === EXTERNAL_ASSET_BUCKET) {
        return requireValue(
          readExternalAssetUrl(objectPath),
          "VALIDATION_ERROR: Invalid external asset path.",
        );
      }
      const url = await createSignedAssetUrl(clients, bucket, objectPath);
      return url;
    },
  };
}

function buildImageProcessingPort(
  clients: ReturnType<typeof createSupabaseClients>,
): ImageProcessingPort {
  const service = clients.service;

  return {
    async startBackgroundRemoval(userId, jobId) {
      const existing = await loadUploadJob(service, userId, jobId);
      if (!existing) {
        throw new Error("NOT_FOUND: Upload job not found.");
      }

      const apiKey = configuredEnv("PHOTOROOM_API_KEY");
      const apiUrl =
        process.env.PHOTOROOM_API_URL?.trim() ||
        "https://sdk.photoroom.com/v1/segment";
      if (!apiKey) {
        return markUploadJobFailed(
          service,
          existing,
          "PHOTOROOM_NOT_CONFIGURED",
        );
      }

      const startedAt = Date.now();
      const source = resolveUploadJobSource(existing);
      if (!source) {
        return markUploadJobFailed(
          service,
          existing,
          "UPLOAD_SOURCE_MISSING",
        );
      }

      const sourceUrl =
        source.type === "storage"
          ? await createSignedAssetUrl(
              clients,
              source.bucket,
              source.objectPath,
              false,
            )
          : source.url;

      const timeout = createTimeoutController(BACKGROUND_REMOVAL_TIMEOUT_MS);
      let processedImage: ArrayBuffer | undefined;
      try {
        const image = await fetch(sourceUrl, { signal: timeout.signal });
        if (!image.ok) {
          return markUploadJobFailed(
            service,
            existing,
            `UPLOAD_FETCH_FAILED_${image.status}`,
          );
        }

        const form = new FormData();
        form.append(
          "image_file",
          new Blob([await image.arrayBuffer()], {
            type: image.headers.get("content-type") ?? "image/jpeg",
          }),
          "original.jpg",
        );

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "x-api-key": apiKey },
          body: form,
          signal: timeout.signal,
        });
        if (!response.ok) {
          return markUploadJobFailed(
            service,
            existing,
            `PHOTOROOM_FAILED_${response.status}`,
          );
        }
        processedImage = await response.arrayBuffer();
      } catch (error) {
        const code = isAbortError(error)
          ? "BACKGROUND_REMOVAL_TIMEOUT"
          : "BACKGROUND_REMOVAL_FETCH_FAILED";
        return markUploadJobFailed(
          service,
          existing,
          code,
          isAbortError(error) ? "timeout" : "failed",
        );
      } finally {
        timeout.clear();
      }
      if (!processedImage) {
        return markUploadJobFailed(
          service,
          existing,
          "PHOTOROOM_RESPONSE_MISSING",
        );
      }

      const processedPath = `${userId}/${jobId}/processed.png`;
      const upload = await service.storage
        .from("item-processed")
        .upload(processedPath, processedImage, {
          contentType: "image/png",
          upsert: true,
        });
      throwIfError(upload.error, "Failed to store processed image");
      const processedUrl = await createSignedAssetUrl(
        clients,
        "item-processed",
        processedPath,
      );

      const { data, error } = await service
        .from("upload_jobs")
        .update({
          status: "succeeded",
          provider: "photoroom",
          duration_ms: Date.now() - startedAt,
          payload: {
            ...existing.payload,
            processedBucket: "item-processed",
            processedPath,
            processedUrl,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("user_id", userId)
        .select("*")
        .single();
      throwIfError(error, "Failed to update background removal job");

      return mapUploadJob(data as DbUploadJob, undefined, processedUrl);
    },

    async getUploadJob(userId, jobId) {
      const job = await loadUploadJob(service, userId, jobId);
      return job ? mapUploadJobWithAssets(clients, job) : null;
    },
  };
}

function buildMarketplaceImportPort(
  service: DbClient,
  wardrobe: WardrobeRepository,
): MarketplaceImportPort {
  return {
    async createImport(userId, url) {
      const apiUrl = configuredEnv("MARKETPLACE_IMPORT_API_URL");
      if (!apiUrl) {
        throw new Error(
          "INTEGRATION_NOT_CONFIGURED: MARKETPLACE_IMPORT_API_URL is required for marketplace imports.",
        );
      }

      const { data: created, error: createError } = await service
        .from("marketplace_imports")
        .insert({ user_id: userId, urls: [url], status: "processing" })
        .select("*")
        .single();
      throwIfError(createError, "Failed to create marketplace import");

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: buildExternalJsonHeaders("MARKETPLACE_IMPORT_API_KEY"),
          body: JSON.stringify({ url, userId, importId: created.id }),
        });
      } catch {
        const failed = await updateMarketplaceImportStatus(
          service,
          created.id,
          "failed",
          [],
        );
        return mapMarketplaceImport(failed);
      }

      if (!response.ok) {
        const failed = await updateMarketplaceImportStatus(
          service,
          created.id,
          "failed",
          [],
        );
        return mapMarketplaceImport(failed);
      }

      const payload = (await response.json()) as {
        candidates?: MarketplaceCandidate[];
      };
      const candidates = payload.candidates ?? [];
      const { data, error } = await service
        .from("marketplace_imports")
        .update({ status: "completed", candidates })
        .eq("id", created.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      throwIfError(error, "Failed to update marketplace import");
      return mapMarketplaceImport(data as DbMarketplaceImport);
    },

    async getImport(userId, importId) {
      const { data, error } = await service
        .from("marketplace_imports")
        .select("*")
        .eq("id", importId)
        .eq("user_id", userId)
        .maybeSingle();
      throwIfError(error, "Failed to load marketplace import");
      return data ? mapMarketplaceImport(data as DbMarketplaceImport) : null;
    },

    async confirmCandidate(userId, importId, candidateId) {
      const marketplaceImport = await this.getImport(userId, importId);
      if (!marketplaceImport) {
        throw new Error("NOT_FOUND: Marketplace import not found.");
      }
      const candidate = marketplaceImport.candidates.find(
        (item) => item.id === candidateId,
      );
      if (!candidate) {
        throw new Error("NOT_FOUND: Marketplace candidate not found.");
      }

      const item = await wardrobe.createItem(userId, {
        name: candidate.name,
        categoryId: candidate.categoryId,
        colorPoints: candidate.colorPoints,
        sourceType: "marketplace",
        imageUrl: candidate.imageUrl,
        brand: candidate.brand,
        material: candidate.material,
        price: candidate.price,
        sourceUrl: candidate.sourceUrl,
      });
      const confirmedItemId = await loadWardrobeEntryItemId(
        service,
        userId,
        item.id,
      );

      const { error } = await service
        .from("marketplace_imports")
        .update({
          status: "confirmed",
          confirmed_item_id: confirmedItemId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", importId)
        .eq("user_id", userId);
      throwIfError(error, "Failed to confirm marketplace candidate");
      return item;
    },
  };
}

function buildCatalogSearchPort(
  clients: ReturnType<typeof createSupabaseClients>,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
): CatalogSearchPort {
  const service = clients.service;

  return {
    async search(_userId, query, filters) {
      const normalizedQuery = query.trim();
      const [dbFilters, categories, colors] = await Promise.all([
        buildCatalogSearchDbFilters(
          colorCatalog,
          categoryCatalog,
          filters,
        ),
        categoryCatalog(),
        colorCatalog(),
      ]);
      const rpc = await service.rpc("search_catalog_hybrid", {
        query: normalizedQuery || null,
        filters: { ...dbFilters, limit: 20 },
      });
      throwIfError(rpc.error, "Failed to search public catalog");

      const rankedIds = ((rpc.data ?? []) as Array<{
        item_id: string;
        rank: number;
      }>).map((row) => row.item_id);
      if (!rankedIds.length && normalizedQuery) {
        return [];
      }

      const items = rankedIds.length
        ? await loadItemsByIds(service, rankedIds)
        : await loadPublicCatalogItems(service);
      const mapped = (await mapCatalogItems(
        clients,
        colorCatalog,
        categoryCatalog,
        items,
      )).filter((item) =>
        itemMatchesCatalogFilters(item, filters, categories, colors),
      );
      const rank = new Map(
        ((rpc.data ?? []) as Array<{ item_id: string; rank: number }>).map(
          (row) => [row.item_id, Number(row.rank)],
        ),
      );

      return mapped.map((item, index) => ({
        item,
        matchScore: rank.get(item.id) ?? Math.max(0.2, 0.9 - index * 0.05),
        explanation: "Matched against the public Supabase catalog.",
      }));
    },

    async addCatalogItem(userId, itemId) {
      const { data: item, error: itemError } = await service
        .from("items")
        .select("*")
        .eq("id", itemId)
        .eq("visibility", "public")
        .single();
      throwIfError(itemError, "Public catalog item not found");

      const { data: existing, error: existingError } = await service
        .from("wardrobe_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .maybeSingle();
      throwIfError(existingError, "Failed to check catalog membership");

      const entry = existing
        ? (existing as DbWardrobeEntry)
        : await insertCatalogWardrobeEntry(service, userId, itemId);
      const mapped = await mapWardrobeEntries(
        clients,
        colorCatalog,
        categoryCatalog,
        [entry],
      );
      void item;
      return requireValue(mapped[0], "Failed to map catalog item");
    },
  };
}

function buildBillingPort(service: DbClient): BillingPort {
  return {
    async listCoinPacks() {
      const { data, error } = await service
        .from("coin_packs")
        .select("*")
        .eq("active", true)
        .order("coins", { ascending: true });
      throwIfError(error, "Failed to load coin packs");
      return ((data ?? []) as DbCoinPack[]).map(mapCoinPack);
    },

    async createLavaInvoice(userId, coinPackId) {
      const lavaApiUrl = configuredEnv("LAVA_API_URL");
      const lavaApiKey = configuredEnv("LAVA_API_KEY");
      if (!lavaApiUrl || !lavaApiKey) {
        throw new Error(
          "INTEGRATION_NOT_CONFIGURED: LAVA_API_URL and LAVA_API_KEY are required for Lava invoices.",
        );
      }

      const coinPack = requireValue(
        (await this.listCoinPacks()).find((pack) => pack.id === coinPackId),
        "NOT_FOUND: Coin pack not found.",
      );
      const invoiceId = randomUUID();
      const response = await fetch(lavaApiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${lavaApiKey}`,
        },
        body: JSON.stringify({
          id: invoiceId,
          product_id: coinPack.providerProductId,
          metadata: { userId, coinPackId },
        }),
      });
      if (!response.ok) {
        throw new Error(`LAVA_INVOICE_FAILED: Lava returned ${response.status}.`);
      }
      const payload = (await response.json()) as Record<string, unknown>;
      const lavaInvoiceId =
        asString(payload.id) ?? asString(payload.invoice_id) ?? invoiceId;
      const paymentUrl =
        asString(payload.payment_url) ??
        asString(payload.paymentUrl) ??
        asString(payload.url);
      if (!paymentUrl) {
        throw new Error("LAVA_INVOICE_FAILED: Lava did not return a payment URL.");
      }

      const { data, error } = await service
        .from("lava_invoices")
        .insert({
          id: invoiceId,
          user_id: userId,
          coin_pack_id: coinPackId,
          lava_invoice_id: lavaInvoiceId,
          status: "pending",
          payment_url: paymentUrl,
        })
        .select("*")
        .single();
      throwIfError(error, "Failed to persist Lava invoice");
      return mapLavaInvoice(data as DbLavaInvoice);
    },

    async getLavaInvoiceStatus(userId, invoiceId) {
      const { data, error } = await service
        .from("lava_invoices")
        .select("*")
        .eq("id", invoiceId)
        .eq("user_id", userId)
        .maybeSingle();
      throwIfError(error, "Failed to load Lava invoice");
      return data ? mapLavaInvoice(data as DbLavaInvoice) : null;
    },

    async spendCoins(userId, request: CoinSpendRequest) {
      const spendAmount = request.reason === "extra_capsule" ? 5 : 1;
      const { data, error } = await service.rpc("spend_coins_atomic", {
        p_user_id: userId,
        p_amount: spendAmount,
        p_reason: request.reason,
        p_target_id: request.targetId,
        p_idempotency_key: request.idempotencyKey,
      });
      if (error?.message.includes("INSUFFICIENT_BALANCE")) {
        throw new Error("INSUFFICIENT_BALANCE: Not enough coins.");
      }
      throwIfError(error, "Failed to spend coins");

      return mapCoinSpendResult(
        requireValue(
          ((data ?? []) as DbCoinSpendResult[])[0],
          "Failed to spend coins: no ledger row returned.",
        ),
      );
    },

    async replayLavaWebhook(event: LavaWebhookReplay) {
      if (event.status !== "paid") {
        await updateLavaInvoiceStatus(service, event.invoiceId, event.status);
        return null;
      }

      const invoice = await loadInvoiceByAnyId(service, event.invoiceId);
      if (!invoice) {
        return null;
      }
      const coinPack = requireValue(
        (await this.listCoinPacks()).find(
          (pack) => pack.id === invoice.coin_pack_id,
        ),
        "NOT_FOUND: Coin pack not found.",
      );
      const idempotencyKey = `lava:${invoice.id}:paid`;
      const { data, error } = await service.rpc("credit_coins_atomic", {
        p_user_id: invoice.user_id,
        p_amount: coinPack.coins,
        p_reason: "purchase",
        p_target_id: invoice.id,
        p_idempotency_key: idempotencyKey,
        p_lava_event_id: null,
      });
      throwIfError(error, "Failed to apply Lava webhook");

      await updateLavaInvoiceStatus(service, invoice.id, "paid");
      return mapCoinSpendResult(
        requireValue(
          ((data ?? []) as DbCoinSpendResult[])[0],
          "Failed to apply Lava webhook: no ledger row returned.",
        ),
      ).ledgerEntry;
    },
  };
}

function buildCapsuleRepository(
  service: DbClient,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
): ProviderRegistry["capsules"] {
  return {
    async getCurrentCapsule(userId) {
      const { data, error } = await service
        .from("capsules")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      throwIfError(error, "Failed to load current capsule");
      return data
        ? mapCapsule(service, colorCatalog, categoryCatalog, data as DbCapsule)
        : null;
    },

    async createCapsule(userId, draft: CapsuleDraft) {
      const itemIds = unique(draft.itemIds);
      const colorIds = unique(
        await resolvePaletteColorIds(colorCatalog, draft.palette),
      );
      const categories = await Promise.all(
        draft.categories.map(async (category) => ({
          category,
          dbCategory: await findDbCategory(categoryCatalog, category.categoryId),
        })),
      );
      const { data, error } = await service.rpc("create_capsule_atomic", {
        p_user_id: userId,
        p_name: draft.name,
        p_wardrobe_type: draft.garderType,
        p_color_ids: colorIds,
        p_category_targets: categories.map(({ category, dbCategory }) => ({
          categoryId: dbCategory.id,
          quantity: category.count,
        })),
        p_wardrobe_entry_ids: itemIds,
      });
      throwIfError(error, "Failed to create capsule");

      const capsule = requireValue(
        ((data ?? []) as DbCapsule[])[0],
        "Failed to create capsule: no capsule row returned.",
      );

      return mapCapsule(service, colorCatalog, categoryCatalog, capsule);
    },
  };
}

function buildMethodologyPort(
  service: DbClient,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
): MethodologyPort {
  return {
    async validatePalette(colorPoints) {
      const localValidation = validatePaletteLimits(colorPoints);
      if (!localValidation.valid) {
        return localValidation;
      }

      const colorIds = await resolveColorIds(colorCatalog, colorPoints);
      const { data, error } = await service.rpc("validate_palette", {
        color_ids: colorIds,
      });
      throwIfError(error, "Failed to validate palette");
      const result = (data ?? {}) as Record<string, unknown>;

      return {
        valid: Boolean(result.compatible ?? result.valid),
        blockedColorIds: asStringArray(result.blockedColorIds),
        explanation: asString(result.explanation),
      };
    },

    async listJourneyCategories(garderType) {
      const dbCategories = [...(await categoryCatalog()).values()]
        .filter((category) =>
          garderType === "mixed"
            ? category.wardrobe_types.includes("women") ||
              category.wardrobe_types.includes("men")
            : category.wardrobe_types.includes(garderType),
        )
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((category) => ({
          categoryId: toUiCategoryId(category.slug),
          count: defaultCategoryCount(category),
        }));

      return dbCategories.length
        ? dedupeCapsuleCategories(dbCategories)
        : getCategoriesByGender(garderType).map((category) => ({
            categoryId: category.id,
            count: 1,
          }));
    },
  };
}

type CatalogSearchDbFilters = {
  categoryIds?: string[];
  colorIds?: string[];
  wardrobeType?: GarderType;
};

async function buildCatalogSearchDbFilters(
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
  filters: CatalogSearchFilters | undefined,
): Promise<CatalogSearchDbFilters> {
  if (!filters) {
    return {};
  }

  const [colors, categories] = await Promise.all([
    colorCatalog(),
    categoryCatalog(),
  ]);

  return stripUndefined({
    categoryIds: filters.categoryIds?.length
      ? resolveSearchCategoryIds(categories, filters.categoryIds)
      : undefined,
    colorIds: filters.colorIds?.length
      ? resolveSearchColorIds(colors, filters.colorIds)
      : undefined,
    wardrobeType: filters.wardrobeType,
  });
}

function itemMatchesCatalogFilters(
  item: WardrobeEntry,
  filters: CatalogSearchFilters | undefined,
  categories: Map<string, DbCategory>,
  colors: Map<string, ColorPoint>,
): boolean {
  if (filters?.categoryIds?.length) {
    const requestedCategories = buildRequestedCategorySet(
      categories,
      filters.categoryIds,
    );
    if (!requestedCategories.has(normalizeUiCategoryId(item.categoryId))) {
      return false;
    }
  }

  if (filters?.colorIds?.length) {
    const requestedColors = buildRequestedColorHexSet(colors, filters.colorIds);
    if (
      !item.colorPoints.some((color) =>
        requestedColors.has(color.hex.toLowerCase()),
      )
    ) {
      return false;
    }
  }

  if (
    filters?.wardrobeType &&
    !categorySupportsWardrobeType(categories, item.categoryId, filters.wardrobeType)
  ) {
    return false;
  }

  return true;
}

function buildRequestedColorHexSet(
  colors: Map<string, ColorPoint>,
  colorIds: string[],
): Set<string> {
  const resolvedColorIds = resolveSearchColorIds(colors, colorIds);
  const hexValues = resolvedColorIds
    .map((colorId) => colors.get(colorId)?.hex ?? colorId)
    .map((colorIdOrHex) => colorIdOrHex.toLowerCase());

  return new Set(hexValues);
}

function buildRequestedCategorySet(
  categories: Map<string, DbCategory>,
  categoryIds: string[],
): Set<string> {
  const resolvedCategoryIds = resolveSearchCategoryIds(categories, categoryIds);
  const rowsById = categories;
  const categoryValues = [
    ...categoryIds,
    ...resolvedCategoryIds.map((categoryId) => {
      const row = rowsById.get(categoryId);
      return row?.slug ?? categoryId;
    }),
  ].map(normalizeUiCategoryId);

  return new Set(categoryValues);
}

function normalizeUiCategoryId(categoryId: string): string {
  return toUiCategoryId(CATEGORY_TO_DB_SLUG[categoryId] ?? categoryId);
}

function resolveSearchCategoryIds(
  categories: Map<string, DbCategory>,
  categoryIds: string[],
): string[] {
  const rows = [...categories.values()];
  return unique(
    categoryIds.map((categoryId) => {
      const dbSlug = CATEGORY_TO_DB_SLUG[categoryId] ?? categoryId;
      const category =
        categories.get(categoryId) ??
        rows.find(
          (row) =>
            row.slug === dbSlug ||
            toUiCategoryId(row.slug) === categoryId,
        );
      return category?.id ?? NO_MATCH_UUID;
    }),
  );
}

function resolveSearchColorIds(
  colors: Map<string, ColorPoint>,
  colorIds: string[],
): string[] {
  const rows = [...colors.entries()];
  return unique(
    colorIds.map((colorId) => {
      const color = colors.get(colorId);
      if (color) {
        return colorId;
      }

      const byHex = rows.find(
        ([, value]) => value.hex.toLowerCase() === colorId.toLowerCase(),
      );
      return byHex?.[0] ?? colorId;
    }),
  );
}

function categorySupportsWardrobeType(
  categories: Map<string, DbCategory>,
  uiCategoryId: string,
  wardrobeType: GarderType,
): boolean {
  const dbSlug = CATEGORY_TO_DB_SLUG[uiCategoryId] ?? uiCategoryId;
  const category = [...categories.values()].find(
    (row) => row.slug === dbSlug || toUiCategoryId(row.slug) === uiCategoryId,
  );
  if (!category) {
    return false;
  }

  return wardrobeType === "mixed"
    ? category.wardrobe_types.includes("women") ||
        category.wardrobe_types.includes("men")
    : category.wardrobe_types.includes(wardrobeType);
}

async function mapWardrobeEntries(
  clients: ReturnType<typeof createSupabaseClients>,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
  entries: DbWardrobeEntry[],
): Promise<WardrobeEntry[]> {
  if (!entries.length) {
    return [];
  }

  const itemIds = unique(entries.map((entry) => entry.item_id));
  const [items, assets, memberships, colors, categories] = await Promise.all([
    loadItemsByIds(clients.service, itemIds),
    loadAssetsByItemIds(clients.service, itemIds),
    loadCapsuleMembership(clients.service, entries.map((entry) => entry.id)),
    colorCatalog(),
    categoryCatalog(),
  ]);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const assetsByItem = groupBy(assets, (asset) => asset.item_id ?? "");
  const membershipByEntry = groupBy(
    memberships,
    (membership) => membership.wardrobe_entry_id,
  );

  return Promise.all(
    entries.map(async (entry) => {
      const item = requireValue(
        itemsById.get(entry.item_id),
        `NOT_FOUND: Item ${entry.item_id} not found for wardrobe entry.`,
      );
      const asset = pickDisplayAsset(assetsByItem.get(item.id) ?? []);
      const imageUrl = asset ? await createAssetUrl(clients, asset) : undefined;
      const category = categories.get(item.category_id);
      const capsuleIds = (membershipByEntry.get(entry.id) ?? []).map(
        (membership) => membership.capsule_id,
      );

      return {
        id: entry.id,
        userId: entry.user_id,
        name: entry.user_name_override || item.name,
        categoryId: toUiCategoryId(category?.slug ?? item.category_id),
        photoUrl: imageUrl,
        imageUrl,
        colorPoints: hydrateColorPoints(colors, item.color_ids),
        brand: item.brand ?? undefined,
        material: item.material ?? undefined,
        price: toNumber(item.price),
        sourceUrl: item.source_url ?? undefined,
        capsuleIds,
        isPublic: item.visibility === "public",
        sourceType: item.source_type,
        status: entry.status,
        favorite: entry.favorite,
        fromCatalog: entry.from_catalog,
        version: entry.version,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };
    }),
  );
}

async function mapCatalogItems(
  clients: ReturnType<typeof createSupabaseClients>,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
  items: DbItem[],
): Promise<WardrobeEntry[]> {
  if (!items.length) {
    return [];
  }

  const [assets, colors, categories] = await Promise.all([
    loadAssetsByItemIds(clients.service, items.map((item) => item.id)),
    colorCatalog(),
    categoryCatalog(),
  ]);
  const assetsByItem = groupBy(assets, (asset) => asset.item_id ?? "");

  return Promise.all(
    items.map(async (item) => {
      const asset = pickDisplayAsset(assetsByItem.get(item.id) ?? []);
      const imageUrl = asset ? await createAssetUrl(clients, asset) : undefined;
      const category = categories.get(item.category_id);

      return {
        id: item.id,
        userId: "catalog",
        name: item.name,
        categoryId: toUiCategoryId(category?.slug ?? item.category_id),
        photoUrl: imageUrl,
        imageUrl,
        colorPoints: hydrateColorPoints(colors, item.color_ids),
        brand: item.brand ?? undefined,
        material: item.material ?? undefined,
        price: toNumber(item.price),
        sourceUrl: item.source_url ?? undefined,
        capsuleIds: [],
        isPublic: true,
        sourceType: item.source_type,
        status: "active",
        favorite: false,
        fromCatalog: true,
        version: item.version,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    }),
  );
}

async function mapCapsule(
  service: DbClient,
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
  capsule: DbCapsule,
): Promise<Capsule> {
  const [
    paletteRows,
    targetRows,
    itemRows,
    gapRows,
    colors,
    categories,
  ] = await Promise.all([
    selectRows<DbCapsulePaletteColor>(
      service,
      "capsule_palette_colors",
      "capsule_id",
      [capsule.id],
    ),
    selectRows<DbCapsuleCategoryTarget>(
      service,
      "capsule_category_targets",
      "capsule_id",
      [capsule.id],
    ),
    selectRows<DbCapsuleItem>(service, "capsule_items", "capsule_id", [
      capsule.id,
    ]),
    selectRows<DbGapRecommendation>(
      service,
      "gap_recommendations",
      "capsule_id",
      [capsule.id],
    ),
    colorCatalog(),
    categoryCatalog(),
  ]);
  const paletteColors = hydrateColorPoints(
    colors,
    paletteRows.map((row) => row.color_id),
  );

  return {
    id: capsule.id,
    userId: capsule.user_id,
    name: capsule.name,
    garderType: capsule.wardrobe_type,
    palette: {
      achromaticColors: paletteColors.filter((color) => color.isAchromatic),
      selectedColors: paletteColors.filter((color) => !color.isAchromatic),
    },
    categories: targetRows.map((row) => ({
      categoryId: toUiCategoryId(categories.get(row.category_id)?.slug ?? row.category_id),
      count: row.quantity,
    })),
    itemIds: itemRows.map((row) => row.wardrobe_entry_id),
    outfitCount: capsule.outfit_count,
    gapAnalysis: gapRows.map((row) => ({
      categoryId: toUiCategoryId(categories.get(row.category_id)?.slug ?? row.category_id),
      colorHint: row.color_ids[0],
      reason: `${row.priority} priority gap with estimated ${toNumber(row.impact) ?? 0} outfit impact.`,
    })),
    createdAt: capsule.created_at,
  };
}

async function loadColorCatalog(service: DbClient): Promise<Map<string, ColorPoint>> {
  const { data, error } = await service
    .from("color_catalog")
    .select("*")
    .order("sort_order", { ascending: true });
  throwIfError(error, "Failed to load color catalog");
  return new Map(
    ((data ?? []) as DbColor[]).map((row) => [row.id, mapColorPoint(row)]),
  );
}

async function loadCategoryCatalog(
  service: DbClient,
): Promise<Map<string, DbCategory>> {
  const { data, error } = await service
    .from("category_catalog")
    .select("*")
    .order("sort_order", { ascending: true });
  throwIfError(error, "Failed to load category catalog");
  return new Map(((data ?? []) as DbCategory[]).map((row) => [row.id, row]));
}

async function loadItemsByIds(
  service: DbClient,
  ids: string[],
): Promise<DbItem[]> {
  return selectRows<DbItem>(service, "items", "id", ids);
}

async function loadPublicCatalogItems(service: DbClient): Promise<DbItem[]> {
  const { data, error } = await service
    .from("items")
    .select("*")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(20);
  throwIfError(error, "Failed to load public catalog items");
  return (data ?? []) as DbItem[];
}

async function loadAssetsByItemIds(
  service: DbClient,
  itemIds: string[],
): Promise<DbAsset[]> {
  return selectRows<DbAsset>(service, "item_assets", "item_id", itemIds);
}

async function loadCapsuleMembership(
  service: DbClient,
  entryIds: string[],
): Promise<DbCapsuleItem[]> {
  return selectRows<DbCapsuleItem>(
    service,
    "capsule_items",
    "wardrobe_entry_id",
    entryIds,
  );
}

async function selectRows<T>(
  service: DbClient,
  table: string,
  column: string,
  ids: string[],
): Promise<T[]> {
  const values = unique(ids).filter(Boolean);
  if (!values.length) {
    return [];
  }

  const { data, error } = await service.from(table).select("*").in(column, values);
  throwIfError(error, `Failed to load ${table}`);
  return (data ?? []) as T[];
}

async function insertCatalogWardrobeEntry(
  service: DbClient,
  userId: string,
  itemId: string,
): Promise<DbWardrobeEntry> {
  const { data, error } = await service
    .from("wardrobe_entries")
    .insert({
      user_id: userId,
      item_id: itemId,
      status: "active",
      favorite: false,
      from_catalog: true,
    })
    .select("*")
    .single();
  throwIfError(error, "Failed to add catalog item");
  return data as DbWardrobeEntry;
}

async function findDbCategory(
  categoryCatalog: () => Promise<Map<string, DbCategory>>,
  uiCategoryId: string,
): Promise<DbCategory> {
  const dbSlug = CATEGORY_TO_DB_SLUG[uiCategoryId] ?? uiCategoryId;
  const category = [...(await categoryCatalog()).values()].find(
    (item) => item.slug === dbSlug || item.id === uiCategoryId,
  );
  return requireValue(category, `NOT_FOUND: Category ${uiCategoryId} not found.`);
}

async function resolvePaletteColorIds(
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  palette: CapsulePalette,
): Promise<string[]> {
  return resolveColorIds(colorCatalog, [
    ...palette.achromaticColors,
    ...palette.selectedColors,
  ]);
}

async function resolveColorIds(
  colorCatalog: () => Promise<Map<string, ColorPoint>>,
  colors: ColorPoint[],
): Promise<string[]> {
  const catalog = await colorCatalog();
  const rows = [...catalog.entries()];
  return unique(
    colors.map((color) => {
      const byId = catalog.get(color.hex);
      if (byId) {
        return color.hex;
      }
      const byHex = rows.find(
        ([, value]) => value.hex.toLowerCase() === color.hex.toLowerCase(),
      );
      return requireValue(
        byHex?.[0],
        `NOT_FOUND: Color ${color.hex} not found in Supabase catalog.`,
      );
    }),
  );
}

function hydrateColorPoints(
  catalog: Map<string, ColorPoint>,
  colorIds: string[] | null | undefined,
): ColorPoint[] {
  return (colorIds ?? [])
    .map((id) => catalog.get(id))
    .filter((color): color is ColorPoint => Boolean(color));
}

function mapColorPoint(row: DbColor): ColorPoint {
  const hue = colorHueFromId(row.id);
  const group = row.color_group;
  return {
    hex: row.hex,
    name: row.name,
    temperature: colorTemperature(hue),
    group,
    shade: group,
    hue,
    isAchromatic: group === "achromatic",
  };
}

function colorHueFromId(id: string): ColorHue {
  if (id.startsWith("A")) {
    return "achromatic";
  }
  const index = Number.parseInt(id.replace(/^\D+/, ""), 10) - 1;
  return HUES[index] ?? "achromatic";
}

function colorTemperature(hue: ColorHue): ColorTemperature {
  if (hue === "achromatic") {
    return "neutral";
  }
  return ["blue-green", "blue", "blue-violet", "violet"].includes(hue)
    ? "cool"
    : "warm";
}

function mapProfile(row: DbProfile): Profile {
  return {
    userId: row.user_id,
    email: row.email ?? "",
    displayName: row.display_name ?? row.email ?? "Capsule Zero User",
    locale: row.language ?? "en",
    country: row.country ?? undefined,
    city: row.city ?? undefined,
    coinBalance: row.coin_balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function upsertProfileFromAuthUser(
  service: DbClient,
  userId: string,
  email: string,
  name: string | undefined,
): Promise<Profile> {
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await service
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(existingError, "Failed to load Supabase profile");

  if (existing) {
    const existingProfile = existing as DbProfile;
    const { data, error } = await service
      .from("profiles")
      .update(
        stripUndefined({
          email,
          display_name: existingProfile.display_name ? undefined : name ?? email,
          updated_at: now,
        }),
      )
      .eq("user_id", userId)
      .select("*")
      .single();
    throwIfError(error, "Failed to sync Supabase profile");
    return mapProfile(data as DbProfile);
  }

  const { data, error } = await service
    .from("profiles")
    .insert({
      user_id: userId,
      email,
      display_name: name ?? email,
      language: "en",
      updated_at: now,
    })
    .select("*")
    .single();
  throwIfError(error, "Failed to create Supabase profile");
  return mapProfile(data as DbProfile);
}

function mapSession(
  user: {
    id: string;
    email?: string | null;
    created_at?: string;
    user_metadata?: Record<string, unknown>;
  },
  session: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  },
): Session {
  return {
    user: mapUser(user),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function mapUser(user: {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  return {
    id: user.id,
    email: user.email ?? "",
    name: readMetadataName(user.user_metadata),
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

function readMetadataName(metadata: Record<string, unknown> | undefined): string | undefined {
  return asString(metadata?.name) ?? asString(metadata?.full_name);
}

async function maybeAttachDraftAsset(
  service: DbClient,
  userId: string,
  item: DbItem,
  draft: ItemDraft,
): Promise<void> {
  if (!draft.imageUrl) {
    return;
  }
  const parsed = tryParseStoragePath(draft.imageUrl);
  if (!parsed) {
    if (draft.sourceType === "marketplace" && isHttpUrl(draft.imageUrl)) {
      const { error } = await service.from("item_assets").upsert(
        {
          user_id: userId,
          item_id: item.id,
          bucket: EXTERNAL_ASSET_BUCKET,
          object_path: toExternalAssetObjectPath(userId, draft.imageUrl),
          variant: "marketplace",
        },
        { onConflict: "bucket,object_path" },
      );
      throwIfError(error, "Failed to attach external marketplace asset");
    }
    return;
  }
  if (parsed.bucket === "catalog-public") {
    return;
  }
  assertUserOwnedStoragePath(userId, parsed);

  const { error } = await service.from("item_assets").upsert(
    {
      user_id: userId,
      item_id: item.id,
      bucket: parsed.bucket,
      object_path: parsed.objectPath,
      variant: draft.sourceType === "marketplace" ? "marketplace" : "original",
    },
    { onConflict: "bucket,object_path" },
  );
  throwIfError(error, "Failed to attach item asset");
}

async function mapUploadJobWithAssets(
  clients: ReturnType<typeof createSupabaseClients>,
  job: DbUploadJob,
): Promise<UploadJob> {
  return mapUploadJob(
    job,
    undefined,
    await resolveProcessedUploadUrl(clients, job),
  );
}

async function resolveProcessedUploadUrl(
  clients: ReturnType<typeof createSupabaseClients>,
  job: DbUploadJob,
): Promise<string | undefined> {
  const bucket = asString(job.payload?.processedBucket);
  const objectPath = asString(job.payload?.processedPath);
  if (bucket && objectPath) {
    return createSignedAssetUrl(clients, bucket, objectPath);
  }

  return asString(job.payload?.processedUrl);
}

function pickDisplayAsset(assets: DbAsset[]): DbAsset | undefined {
  const priority = ["thumbnail", "processed", "original", "catalog", "marketplace"];
  return [...assets].sort(
    (left, right) =>
      priority.indexOf(left.variant) - priority.indexOf(right.variant),
  )[0];
}

async function createAssetUrl(
  clients: ReturnType<typeof createSupabaseClients>,
  asset: DbAsset,
): Promise<string | undefined> {
  if (asset.bucket === EXTERNAL_ASSET_BUCKET) {
    return readExternalAssetUrl(asset.object_path);
  }

  if (asset.bucket === "catalog-public") {
    const { data } = clients.service.storage
      .from(asset.bucket)
      .getPublicUrl(asset.object_path);
    return normalizeSupabaseUrl(clients, data.publicUrl);
  }
  return createSignedAssetUrl(clients, asset.bucket, asset.object_path);
}

async function createSignedAssetUrl(
  clients: ReturnType<typeof createSupabaseClients>,
  bucket: string,
  objectPath: string,
  exposePublicUrl = true,
): Promise<string> {
  const { data, error } = await clients.service.storage
    .from(bucket)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
  throwIfError(error, "Failed to sign asset URL");
  const signedUrl = requireValue(data?.signedUrl, "Failed to sign asset URL.");
  return exposePublicUrl ? normalizeSupabaseUrl(clients, signedUrl) : signedUrl;
}

function normalizeSupabaseUrl(
  clients: ReturnType<typeof createSupabaseClients>,
  url: string,
): string {
  return clients.publicUrl && clients.publicUrl !== clients.internalUrl
    ? url.replace(clients.internalUrl, clients.publicUrl)
    : url;
}

function parseStoragePath(storagePath: string): { bucket: string; objectPath: string } {
  const parsed = tryParseStoragePath(storagePath);
  return requireValue(parsed, `VALIDATION_ERROR: Invalid storage path ${storagePath}.`);
}

function assertUserOwnedStoragePath(
  userId: string,
  parsed: { bucket: string; objectPath: string },
): void {
  if (parsed.bucket === "catalog-public") {
    return;
  }

  if (!parsed.objectPath.startsWith(`${userId}/`)) {
    throw new Error(
      "VALIDATION_ERROR: Storage path does not belong to the current user.",
    );
  }
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function toExternalAssetObjectPath(userId: string, imageUrl: string): string {
  return `${userId}/${Buffer.from(imageUrl, "utf8").toString("base64url")}`;
}

function readExternalAssetUrl(objectPath: string): string | undefined {
  const encodedUrl = objectPath.split("/").slice(1).join("/");
  if (!encodedUrl) {
    return undefined;
  }

  try {
    const imageUrl = Buffer.from(encodedUrl, "base64url").toString("utf8");
    return isHttpUrl(imageUrl) ? imageUrl : undefined;
  } catch {
    return undefined;
  }
}

function tryParseStoragePath(
  storagePath: string,
): { bucket: string; objectPath: string } | null {
  const value = storagePath.trim();
  if (!value) {
    return null;
  }
  const storageObjectUrlPattern = /^https?:\/\/[^/]+\/storage\/v1\/object\/[^/]+\//;
  if (isHttpUrl(value) && !storageObjectUrlPattern.test(value)) {
    return null;
  }
  const withoutOrigin = value
    .replace(storageObjectUrlPattern, "")
    .split("?")[0] ?? "";
  const [first, ...rest] = withoutOrigin.split("/");
  if (KNOWN_STORAGE_BUCKETS.has(first) && rest.length) {
    return { bucket: first, objectPath: rest.join("/") };
  }
  return { bucket: "item-originals", objectPath: withoutOrigin };
}

function validateUploadMetadata(metadata: PhotoUploadMetadata): void {
  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(metadata.mimeType)) {
    throw new Error("VALIDATION_ERROR: Unsupported image MIME type.");
  }
  if (metadata.byteSize > MAX_UPLOAD_BYTES) {
    throw new Error("VALIDATION_ERROR: Image exceeds the upload limit.");
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "upload";
}

async function loadUploadJob(
  service: DbClient,
  userId: string,
  jobId: string,
): Promise<DbUploadJob | null> {
  const { data, error } = await service
    .from("upload_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error, "Failed to load upload job");
  return data ? (data as DbUploadJob) : null;
}

function mapUploadJob(
  row: DbUploadJob,
  originalUrl?: string,
  processedUrl?: string,
): UploadJob {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.job_type,
    status: mapUploadStatus(row.status),
    originalUrl: originalUrl ?? asString(row.payload?.originalUrl),
    processedUrl: processedUrl ?? asString(row.payload?.processedUrl),
    errorCode: asString(row.payload?.errorCode),
    errorMessage: row.error_message ?? undefined,
    durationMs: row.duration_ms ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUploadStatus(status: string): UploadJobStatus {
  if (status === "completed") {
    return "succeeded";
  }
  if (status === "retryable") {
    return "failed";
  }
  if (
    status === "queued" ||
    status === "processing" ||
    status === "succeeded" ||
    status === "failed" ||
    status === "timeout"
  ) {
    return status;
  }
  return "failed";
}

function resolveUploadJobSource(
  job: DbUploadJob,
):
  | { type: "storage"; bucket: string; objectPath: string }
  | { type: "url"; url: string }
  | null {
  const bucket = asString(job.payload?.bucket);
  const storagePath = asString(job.payload?.storagePath);
  if (bucket && storagePath) {
    return { type: "storage", bucket, objectPath: storagePath };
  }
  const originalUrl = asString(job.payload?.originalUrl);
  return originalUrl ? { type: "url", url: originalUrl } : null;
}

async function markUploadJobFailed(
  service: DbClient,
  job: DbUploadJob,
  code: string,
  status: "failed" | "timeout" = "failed",
): Promise<UploadJob> {
  const { data, error } = await service
    .from("upload_jobs")
    .update({
      status,
      error_message: code,
      payload: { ...job.payload, errorCode: code },
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("user_id", job.user_id)
    .select("*")
    .single();
  throwIfError(error, "Failed to mark upload job failed");
  return mapUploadJob(data as DbUploadJob);
}

function createTimeoutController(timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function updateMarketplaceImportStatus(
  service: DbClient,
  id: string,
  status: string,
  candidates: MarketplaceCandidate[],
): Promise<DbMarketplaceImport> {
  const { data, error } = await service
    .from("marketplace_imports")
    .update({ status, candidates })
    .eq("id", id)
    .select("*")
    .single();
  throwIfError(error, "Failed to update marketplace import status");
  return data as DbMarketplaceImport;
}

async function loadWardrobeEntryItemId(
  service: DbClient,
  userId: string,
  wardrobeEntryId: string,
): Promise<string> {
  const { data, error } = await service
    .from("wardrobe_entries")
    .select("item_id")
    .eq("id", wardrobeEntryId)
    .eq("user_id", userId)
    .single();
  throwIfError(error, "Failed to load confirmed marketplace item");
  return requireValue(
    asString((data as { item_id?: unknown } | null)?.item_id),
    "Failed to load confirmed marketplace item.",
  );
}

function mapMarketplaceImport(row: DbMarketplaceImport): MarketplaceImport {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.urls[0] ?? "",
    status: mapMarketplaceStatus(row.status),
    candidates: Array.isArray(row.candidates)
      ? (row.candidates as MarketplaceCandidate[])
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMarketplaceStatus(status: string): MarketplaceImportStatus {
  if (status === "completed") {
    return "parsed";
  }
  if (status === "queued" || status === "processing") {
    return "pending";
  }
  if (status === "confirmed") {
    return "confirmed";
  }
  return "failed";
}

function mapCoinPack(row: DbCoinPack): CoinPack {
  const envKey = `LAVA_${row.id.toUpperCase()}_PRODUCT_ID`;
  return {
    id: row.id,
    coins: row.coins,
    priceUsd: toNumber(row.price_usd) ?? defaultCoinPackPrice(row.coins),
    providerProductId:
      configuredEnv(envKey) ?? row.provider_product_id ?? `${row.id}`,
  };
}

function defaultCoinPackPrice(coins: number): number {
  if (coins <= 5) {
    return 5;
  }
  if (coins <= 15) {
    return 12;
  }
  return 20;
}

function mapLavaInvoice(row: DbLavaInvoice): LavaInvoice {
  return {
    id: row.id,
    userId: row.user_id,
    coinPackId: row.coin_pack_id,
    status: row.status,
    paymentUrl: row.payment_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadInvoiceByAnyId(
  service: DbClient,
  invoiceId: string,
): Promise<DbLavaInvoice | null> {
  let query = service
    .from("lava_invoices")
    .select("*");

  query = isUuid(invoiceId)
    ? query.or(`id.eq.${invoiceId},lava_invoice_id.eq.${invoiceId}`)
    : query.eq("lava_invoice_id", invoiceId);

  const { data, error } = await query.maybeSingle();
  throwIfError(error, "Failed to load Lava invoice");
  return data ? (data as DbLavaInvoice) : null;
}

async function updateLavaInvoiceStatus(
  service: DbClient,
  invoiceId: string,
  status: InvoiceStatus,
): Promise<void> {
  let query = service
    .from("lava_invoices")
    .update({ status, updated_at: new Date().toISOString() });

  query = isUuid(invoiceId)
    ? query.or(`id.eq.${invoiceId},lava_invoice_id.eq.${invoiceId}`)
    : query.eq("lava_invoice_id", invoiceId);

  const { error } = await query;
  throwIfError(error, "Failed to update Lava invoice status");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function mapCoinSpendResult(row: DbCoinSpendResult): {
  profile: Profile;
  ledgerEntry: CoinLedgerEntry;
} {
  return {
    profile: mapProfile({
      user_id: row.user_id,
      email: row.profile_email,
      display_name: row.profile_display_name,
      language: row.profile_language,
      country: row.profile_country,
      city: row.profile_city,
      coin_balance: row.profile_coin_balance,
      created_at: row.profile_created_at,
      updated_at: row.profile_updated_at,
    }),
    ledgerEntry: mapCoinLedger(row as unknown as Record<string, unknown>),
  };
}

function mapCoinLedger(row: Record<string, unknown>): CoinLedgerEntry {
  return {
    id: requireValue(asString(row.id), "Coin ledger id is missing."),
    userId: requireValue(asString(row.user_id), "Coin ledger user is missing."),
    amount: Number(row.amount),
    reason: (asString(row.reason) ?? "purchase") as CoinLedgerEntry["reason"],
    targetId: asString(row.target_id),
    idempotencyKey: requireValue(
      asString(row.idempotency_key),
      "Coin ledger idempotency key is missing.",
    ),
    createdAt: requireValue(
      asString(row.created_at),
      "Coin ledger created_at is missing.",
    ),
  };
}

function validatePaletteLimits(colorPoints: ColorPoint[]): PaletteValidationResult {
  const chromatic = colorPoints.filter((color) => !color.isAchromatic);
  if (colorPoints.length > MAX_PALETTE_COLORS) {
    return {
      valid: false,
      blockedColorIds: colorPoints
        .slice(MAX_PALETTE_COLORS)
        .map((color) => color.hex),
      explanation: "A capsule palette can include up to 15 colors total.",
    };
  }
  if (chromatic.length > MAX_CHROMATIC_COLORS) {
    return {
      valid: false,
      blockedColorIds: chromatic
        .slice(MAX_CHROMATIC_COLORS)
        .map((color) => color.hex),
      explanation: "A capsule palette can include up to 12 chromatic colors.",
    };
  }
  return { valid: true, blockedColorIds: [] };
}

function defaultCategoryCount(category: DbCategory): number {
  if (category.layer === "accessories" || category.layer === "bags") {
    return 1;
  }
  return 2;
}

function dedupeCapsuleCategories(
  categories: CapsuleCategory[],
): CapsuleCategory[] {
  const byId = new Map<string, CapsuleCategory>();
  categories.forEach((category) => {
    if (!byId.has(category.categoryId)) {
      byId.set(category.categoryId, category);
    }
  });
  return [...byId.values()];
}

function applyWardrobeFilters(
  items: WardrobeEntry[],
  filters?: WardrobeListFilters,
): WardrobeEntry[] {
  return items.filter((item) => {
    if (filters?.query) {
      const query = filters.query.trim().toLowerCase();
      return [item.name, item.brand, item.material, item.categoryId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    }
    return true;
  });
}

function toUiCategoryId(dbSlug: string): string {
  return DB_SLUG_TO_CATEGORY[dbSlug] ?? dbSlug;
}

function groupBy<T>(
  values: T[],
  key: (value: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  values.forEach((value) => {
    const group = key(value);
    grouped.set(group, [...(grouped.get(group) ?? []), value]);
  });
  return grouped;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toNumber(value: number | string | null | undefined): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function requiredEnv(name: string, value: string | undefined): string {
  const configured = configuredValue(value);
  if (!configured) {
    throw new Error(`CONFIGURATION_ERROR: ${name} is required for Supabase provider mode.`);
  }
  return configured;
}

function configuredEnv(name: string): string | undefined {
  return configuredValue(process.env[name]);
}

function configuredValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (
    !trimmed ||
    /^(mock|replace|change-me|disabled|example)/i.test(trimmed) ||
    trimmed.includes("/api/mock/")
  ) {
    return undefined;
  }
  return trimmed;
}

function buildExternalJsonHeaders(apiKeyName: string): HeadersInit {
  const apiKey = configuredEnv(apiKeyName);
  return {
    "content-type": "application/json",
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
  };
}

function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

function throwIfError(
  error: { message: string } | null | undefined,
  context: string,
): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function memoize<T>(factory: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | null = null;
  return () => {
    cached ??= factory();
    return cached;
  };
}

async function readHealth(service: DbClient): Promise<ProviderHealth> {
  const storageBuckets = await service.storage.listBuckets();
  const storageConfigured =
    !storageBuckets.error &&
    storageBuckets.data.some((bucket) => bucket.id === "item-originals");
  const externalConfigured = [
    configuredEnv("PHOTOROOM_API_KEY"),
    configuredEnv("LAVA_API_URL"),
    configuredEnv("LAVA_API_KEY"),
    configuredEnv("MARKETPLACE_IMPORT_API_URL"),
  ].every(Boolean);

  return {
    status: storageConfigured && externalConfigured ? "ok" : "degraded",
    mode: "supabase",
    fixtures: {
      users: 0,
      wardrobeItems: 0,
      catalogItems: 0,
      coinPacks: 0,
    },
    integrations: {
      supabase: "configured",
      storage: storageConfigured ? "configured" : "pending-gate",
      marketplaceImport: configuredEnv("MARKETPLACE_IMPORT_API_URL")
        ? "configured"
        : "pending-gate",
      semanticSearch: "configured",
      backgroundRemoval: configuredEnv("PHOTOROOM_API_KEY")
        ? "configured"
        : "pending-gate",
      lavaTop:
        configuredEnv("LAVA_API_URL") && configuredEnv("LAVA_API_KEY")
          ? "configured"
          : "pending-gate",
      googleOAuth: configuredEnv("SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID")
        ? "configured"
        : "pending-gate",
      appleSignIn: configuredEnv("SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID")
        ? "configured"
        : "pending-gate",
    },
  };
}
