import "server-only";

import { createHash } from "node:crypto";

import { getCategoriesByGender } from "@/lib/categories";
import type { Capsule, ColorPoint } from "@/types";
import type {
  BillingPort,
  CapsuleDraft,
  CatalogSearchPort,
  CoinLedgerEntry,
  CoinSpendRequest,
  ImageProcessingPort,
  ItemDraft,
  ItemStatus,
  LavaInvoice,
  MarketplaceImport,
  MarketplaceImportPort,
  MethodologyPort,
  PhotoUploadMetadata,
  Profile,
  ProfileRepository,
  ProfileUpdate,
  ProviderHealth,
  ProviderRegistry,
  StoragePort,
  UploadCompletion,
  UploadJob,
  UploadTarget,
  WardrobeEntry,
  WardrobeListFilters,
  WardrobeRepository,
} from "../contracts";
import {
  MOCK_CAPSULE,
  MOCK_CATALOG_ITEMS,
  MOCK_COIN_PACKS,
  MOCK_JOURNEY_CATEGORIES,
  MOCK_MARKETPLACE_IMPORTS,
  MOCK_PROFILE,
  MOCK_UPLOAD_JOBS,
  MOCK_USER,
  MOCK_WARDROBE_ITEMS,
} from "./fixtures";

const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_PALETTE_COLORS = 15;
const MAX_CHROMATIC_COLORS = 12;
const DEFAULT_NOW = new Date("2026-06-01T15:00:00.000Z");

interface MockProviderOptions {
  now?: () => Date;
}

type MockSession = NonNullable<
  Awaited<ReturnType<ProviderRegistry["auth"]["getCurrentSession"]>>
>;

export function createMockProviderRegistry(
  options: MockProviderOptions = {},
): ProviderRegistry {
  const now = () => (options.now ?? (() => DEFAULT_NOW))().toISOString();
  const profiles = new Map<string, Profile>([
    [MOCK_PROFILE.userId, clone(MOCK_PROFILE)],
  ]);
  const wardrobeItems = new Map(
    MOCK_WARDROBE_ITEMS.map((item) => [item.id, clone(item)]),
  );
  const catalogItems = new Map(
    MOCK_CATALOG_ITEMS.map((item) => [item.id, clone(item)]),
  );
  const uploadJobs = new Map(
    MOCK_UPLOAD_JOBS.map((job) => [job.id, clone(job)]),
  );
  const capsules = new Map<string, Capsule>([
    [MOCK_CAPSULE.id, clone(MOCK_CAPSULE)],
  ]);
  const marketplaceImports = new Map(
    MOCK_MARKETPLACE_IMPORTS.map((marketplaceImport) => [
      marketplaceImport.id,
      clone(marketplaceImport),
    ]),
  );
  const invoices = new Map<string, LavaInvoice>();
  const ledger = new Map<string, CoinLedgerEntry>();
  let currentSession: MockSession | null = buildSession(now());

  const profileRepository: ProfileRepository = {
    async getProfile(userId) {
      return clone(ensureProfile(profiles, userId, now()));
    },

    async updateProfile(userId, input: ProfileUpdate) {
      const profile = ensureProfile(profiles, userId, now());
      const updated = {
        ...profile,
        ...input,
        updatedAt: now(),
      };
      profiles.set(userId, updated);
      return clone(updated);
    },
  };

  const wardrobeRepository: WardrobeRepository = {
    async listItems(userId, filters) {
      const items = [...wardrobeItems.values()].filter((item) =>
        itemBelongsToUser(item, userId),
      );
      return clone(applyWardrobeFilters(items, filters));
    },

    async getItem(userId, itemId) {
      const item = wardrobeItems.get(itemId);
      if (!item || !itemBelongsToUser(item, userId)) {
        return null;
      }
      return clone(item);
    },

    async createItem(userId, draft: ItemDraft) {
      const item = buildWardrobeEntry(userId, draft, now());
      wardrobeItems.set(item.id, item);
      return clone(item);
    },

    async updateItemStatus(userId, itemId, status: ItemStatus) {
      const item = getMutableWardrobeItem(wardrobeItems, userId, itemId);
      const updated = {
        ...item,
        status,
        updatedAt: now(),
        version: item.version + 1,
      };
      wardrobeItems.set(itemId, updated);
      return clone(updated);
    },

    async setFavorite(userId, itemId, favorite) {
      const item = getMutableWardrobeItem(wardrobeItems, userId, itemId);
      const updated = {
        ...item,
        favorite,
        updatedAt: now(),
        version: item.version + 1,
      };
      wardrobeItems.set(itemId, updated);
      return clone(updated);
    },
  };

  const storagePort: StoragePort = {
    async createPhotoUploadTarget(userId, metadata: PhotoUploadMetadata) {
      if (!ACCEPTED_IMAGE_MIME_TYPES.includes(metadata.mimeType)) {
        throw new Error("VALIDATION_ERROR: Unsupported image MIME type.");
      }
      if (metadata.byteSize > MAX_UPLOAD_BYTES) {
        throw new Error(
          "VALIDATION_ERROR: Image exceeds the mock upload limit.",
        );
      }

      const uploadId = deterministicUuid(
        "upload",
        `${userId}:${metadata.fileName}`,
      );
      const jobId = buildUploadJobId(uploadId);

      return {
        uploadId,
        jobId,
        uploadUrl: `mock://storage/item-originals/${userId}/${uploadId}`,
        maxBytes: MAX_UPLOAD_BYTES,
        acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
        expiresAt: "2026-06-01T15:15:00.000Z",
      } satisfies UploadTarget;
    },

    async completePhotoUpload(userId, completion: UploadCompletion) {
      const job: UploadJob = {
        id: buildUploadJobId(completion.uploadId),
        userId,
        type: "photo_upload",
        status: "succeeded",
        originalUrl: completion.originalUrl,
        createdAt: now(),
        updatedAt: now(),
      };
      uploadJobs.set(job.id, job);
      return clone(job);
    },

    async getSignedAssetUrl(userId, storagePath) {
      return `mock://signed/${userId}/${encodeURIComponent(storagePath)}`;
    },
  };

  const imageProcessingPort: ImageProcessingPort = {
    async startBackgroundRemoval(userId, jobId) {
      const existing = uploadJobs.get(jobId);
      if (existing && existing.userId !== userId) {
        throw new Error("NOT_FOUND: Upload job not found.");
      }
      if (existing?.type === "background_removal") {
        return clone(existing);
      }

      const job: UploadJob = {
        id: jobId,
        userId,
        type: "background_removal",
        status: jobId.includes("timeout") ? "timeout" : "succeeded",
        originalUrl:
          existing?.originalUrl ?? `/fixtures/uploads/${jobId}-original.jpg`,
        processedUrl: jobId.includes("timeout")
          ? undefined
          : `/fixtures/uploads/${jobId}-processed.png`,
        errorCode: jobId.includes("timeout")
          ? "BACKGROUND_REMOVAL_TIMEOUT"
          : undefined,
        errorMessage: jobId.includes("timeout")
          ? "Mock timeout state for async polling fallback."
          : undefined,
        durationMs: jobId.includes("timeout") ? 5001 : 1480,
        createdAt: now(),
        updatedAt: now(),
      };
      uploadJobs.set(job.id, job);
      return clone(job);
    },

    async getUploadJob(userId, jobId) {
      const job = uploadJobs.get(jobId);
      if (!job || job.userId !== userId) {
        return null;
      }
      return clone(job);
    },
  };

  const marketplaceImportPort: MarketplaceImportPort = {
    async createImport(userId, url) {
      const fixture = [...marketplaceImports.values()].find(
        (item) =>
          item.url.includes("unparseable") === url.includes("unparseable"),
      );
      const source = fixture ?? MOCK_MARKETPLACE_IMPORTS[0];
      const marketplaceImport: MarketplaceImport = {
        ...source,
        id: deterministicUuid("marketplace-import", `${userId}:${url}`),
        userId,
        url,
        candidates: source.candidates.map((candidate) => ({
          ...candidate,
          sourceUrl: url,
        })),
        createdAt: now(),
        updatedAt: now(),
      };
      marketplaceImports.set(marketplaceImport.id, marketplaceImport);
      return clone(marketplaceImport);
    },

    async getImport(userId, importId) {
      const marketplaceImport = marketplaceImports.get(importId);
      if (!marketplaceImport || marketplaceImport.userId !== userId) {
        return null;
      }
      return clone(marketplaceImport);
    },

    async confirmCandidate(userId, importId, candidateId) {
      const marketplaceImport = marketplaceImports.get(importId);
      if (!marketplaceImport || marketplaceImport.userId !== userId) {
        throw new Error("NOT_FOUND: Marketplace import not found.");
      }
      const candidate = marketplaceImport.candidates.find(
        (item) => item.id === candidateId,
      );
      if (!candidate) {
        throw new Error("NOT_FOUND: Marketplace candidate not found.");
      }

      const item = buildWardrobeEntry(
        userId,
        {
          name: candidate.name,
          categoryId: candidate.categoryId,
          colorPoints: candidate.colorPoints,
          sourceType: "marketplace",
          imageUrl: candidate.imageUrl,
          brand: candidate.brand,
          material: candidate.material,
          price: candidate.price,
          sourceUrl: candidate.sourceUrl,
        },
        now(),
      );
      wardrobeItems.set(item.id, item);
      marketplaceImports.set(importId, {
        ...marketplaceImport,
        status: "confirmed",
        updatedAt: now(),
      });
      return clone(item);
    },
  };

  const catalogSearchPort: CatalogSearchPort = {
    async search(_userId, query, filters) {
      const normalizedQuery = query.trim().toLowerCase();
      const results = [...catalogItems.values()]
        .filter((item) => itemMatchesCatalogQuery(item, normalizedQuery))
        .filter((item) => {
          if (!filters?.categoryIds?.length) {
            return true;
          }
          return filters.categoryIds.includes(item.categoryId);
        })
        .filter((item) => {
          if (!filters?.colorIds?.length) {
            return true;
          }
          return item.colorPoints.some((color) =>
            filters.colorIds?.includes(color.hex),
          );
        })
        .map((item, index) => ({
          item: clone(item),
          matchScore: Number((0.92 - index * 0.08).toFixed(2)),
          explanation: "Deterministic Stage 1 catalog fixture match.",
        }));
      return clone(results);
    },

    async addCatalogItem(userId, itemId) {
      const catalogItem = catalogItems.get(itemId);
      if (!catalogItem) {
        throw new Error("NOT_FOUND: Catalog item not found.");
      }
      const item = {
        ...clone(catalogItem),
        id: deterministicUuid("wardrobe-catalog-item", `${userId}:${itemId}`),
        userId,
        isPublic: false,
        fromCatalog: true,
        status: "active",
        createdAt: now(),
        updatedAt: now(),
      } satisfies WardrobeEntry;
      wardrobeItems.set(item.id, item);
      return clone(item);
    },
  };

  const billingPort: BillingPort = {
    async listCoinPacks() {
      return clone(MOCK_COIN_PACKS);
    },

    async createLavaInvoice(userId, coinPackId) {
      const coinPack = MOCK_COIN_PACKS.find((pack) => pack.id === coinPackId);
      if (!coinPack) {
        throw new Error("NOT_FOUND: Coin pack not found.");
      }

      const invoice: LavaInvoice = {
        id: deterministicUuid("lava-invoice", `${userId}:${coinPackId}`),
        userId,
        coinPackId,
        status: "pending",
        paymentUrl: `mock://lava/invoices/${coinPack.providerProductId}`,
        createdAt: now(),
        updatedAt: now(),
      };
      invoices.set(invoice.id, invoice);
      return clone(invoice);
    },

    async getLavaInvoiceStatus(userId, invoiceId) {
      const invoice = invoices.get(invoiceId);
      if (!invoice || invoice.userId !== userId) {
        return null;
      }
      return clone(invoice);
    },

    async spendCoins(userId, request: CoinSpendRequest) {
      if (!request.targetId) {
        throw new Error(
          "SEMANTIC_VALIDATION_FAILED: Coin spend target is required.",
        );
      }
      const spendAmount = request.reason === "extra_capsule" ? 5 : 1;
      const profile = ensureProfile(profiles, userId, now());
      const existing = ledger.get(request.idempotencyKey);
      if (existing) {
        if (existing.userId !== userId) {
          throw new Error("IDEMPOTENCY_CONFLICT: Coin spend key already used.");
        }
        return { profile: clone(profile), ledgerEntry: clone(existing) };
      }
      if (profile.coinBalance < spendAmount) {
        throw new Error("INSUFFICIENT_BALANCE: Not enough coins.");
      }

      const updatedProfile = {
        ...profile,
        coinBalance: profile.coinBalance - spendAmount,
        updatedAt: now(),
      };
      const ledgerEntry: CoinLedgerEntry = {
        id: deterministicUuid("coin-ledger", request.idempotencyKey),
        userId,
        amount: -spendAmount,
        reason: request.reason,
        targetId: request.targetId,
        idempotencyKey: request.idempotencyKey,
        createdAt: now(),
      };
      profiles.set(userId, updatedProfile);
      ledger.set(request.idempotencyKey, ledgerEntry);
      return {
        profile: clone(updatedProfile),
        ledgerEntry: clone(ledgerEntry),
      };
    },

    async replayLavaWebhook(event) {
      const invoice = invoices.get(event.invoiceId);
      if (!invoice || event.status !== "paid") {
        return null;
      }
      const coinPack = MOCK_COIN_PACKS.find(
        (pack) => pack.id === invoice.coinPackId,
      );
      if (!coinPack) {
        return null;
      }

      const existing = ledger.get(event.eventId);
      if (existing) {
        return clone(existing);
      }

      const profile = ensureProfile(profiles, invoice.userId, now());
      profiles.set(invoice.userId, {
        ...profile,
        coinBalance: profile.coinBalance + coinPack.coins,
        updatedAt: now(),
      });
      invoices.set(invoice.id, {
        ...invoice,
        status: "paid",
        updatedAt: now(),
      });

      const ledgerEntry: CoinLedgerEntry = {
        id: deterministicUuid("coin-ledger", event.eventId),
        userId: invoice.userId,
        amount: coinPack.coins,
        reason: "purchase",
        idempotencyKey: event.eventId,
        createdAt: now(),
      };
      ledger.set(event.eventId, ledgerEntry);
      return clone(ledgerEntry);
    },
  };

  const registry: ProviderRegistry = {
    mode: "mock",
    auth: {
      async getCurrentSession() {
        return clone(currentSession);
      },

      async signUpWithPassword(credentials) {
        const timestamp = now();
        currentSession = buildSession(
          timestamp,
          credentials.email,
          credentials.name,
        );
        upsertProfileFromSession(profiles, currentSession, timestamp);
        return clone(currentSession);
      },

      async signInWithPassword(credentials) {
        const timestamp = now();
        currentSession = buildSession(
          timestamp,
          credentials.email,
          credentials.name,
        );
        upsertProfileFromSession(profiles, currentSession, timestamp);
        return clone(currentSession);
      },

      async requestPasswordRecovery(email) {
        return { delivery: "email", email };
      },

      async signOut() {
        currentSession = null;
      },
    },
    profiles: profileRepository,
    wardrobe: wardrobeRepository,
    storage: storagePort,
    imageProcessing: imageProcessingPort,
    marketplaceImports: marketplaceImportPort,
    catalogSearch: catalogSearchPort,
    billing: billingPort,
    capsules: {
      async getCurrentCapsule(userId) {
        const currentCapsule = [...capsules.values()]
          .reverse()
          .find((capsule) => capsule.userId === userId);
        return currentCapsule ? clone(currentCapsule) : null;
      },

      async createCapsule(userId, draft: CapsuleDraft) {
        const capsule: Capsule = {
          id: deterministicUuid("capsule", `${userId}:${draft.name}`),
          userId,
          name: draft.name,
          garderType: draft.garderType,
          palette: draft.palette,
          categories: draft.categories,
          itemIds: draft.itemIds,
          outfitCount: Math.max(
            draft.itemIds.length * draft.categories.length,
            0,
          ),
          gapAnalysis: [],
          createdAt: now(),
        };
        capsules.set(capsule.id, capsule);
        return clone(capsule);
      },
    },
    methodology: buildMethodologyPort(),
    async health() {
      const health: ProviderHealth = {
        status: "ok",
        mode: "mock",
        fixtures: {
          users: profiles.size,
          wardrobeItems: wardrobeItems.size,
          catalogItems: catalogItems.size,
          coinPacks: MOCK_COIN_PACKS.length,
        },
        integrations: {
          supabase: "mocked",
          storage: "mocked",
          marketplaceImport: "mocked",
          semanticSearch: "mocked",
          backgroundRemoval: "mocked",
          lavaTop: "mocked",
          googleOAuth: "pending-gate",
          appleSignIn: "pending-gate",
        },
      };
      return clone(health);
    },
  };

  return registry;
}

function buildSession(
  timestamp: string,
  email = MOCK_USER.email,
  name = MOCK_USER.name,
): MockSession {
  const userId =
    email === MOCK_USER.email ? MOCK_USER.id : deterministicUuid("user", email);

  return {
    user: {
      ...MOCK_USER,
      id: userId,
      email,
      name,
      createdAt: timestamp,
    },
    accessToken: `mock-access-token-${userId}`,
    expiresAt: addDays(timestamp, 365),
  };
}

function upsertProfileFromSession(
  profiles: Map<string, Profile>,
  session: MockSession,
  timestamp: string,
): void {
  const existing = profiles.get(session.user.id);
  profiles.set(session.user.id, {
    ...(existing ?? MOCK_PROFILE),
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.name ?? session.user.email,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
}

function arePaletteColorsCompatible(base: ColorPoint, target: ColorPoint): boolean {
  if (target.isAchromatic) {
    return true;
  }
  if (base.group === target.group) {
    return true;
  }
  return (
    (base.group === "desaturated" && target.group === "dark") ||
    (base.group === "dark" && target.group === "desaturated")
  );
}

function buildMethodologyPort(): MethodologyPort {
  return {
    async validatePalette(colorPoints) {
      const chromatic = colorPoints.filter((color) => !color.isAchromatic);
      if (colorPoints.length > MAX_PALETTE_COLORS) {
        return {
          valid: false,
          blockedColorIds: colorPoints
            .slice(MAX_PALETTE_COLORS)
            .map((color) => color.hex),
          explanation:
            "A capsule palette can include up to 15 colors total.",
        };
      }
      if (chromatic.length > MAX_CHROMATIC_COLORS) {
        return {
          valid: false,
          blockedColorIds: chromatic
            .slice(MAX_CHROMATIC_COLORS)
            .map((color) => color.hex),
          explanation:
            "A capsule palette can include up to 12 chromatic colors.",
        };
      }

      const base = chromatic[0] ?? null;
      const blocked = base
        ? chromatic.filter((color) => !arePaletteColorsCompatible(base, color))
        : [];
      const valid = blocked.length === 0;

      return {
        valid,
        blockedColorIds: blocked.map((color) => color.hex),
        explanation: valid
          ? "Colors are compatible by group harmony."
          : "Palette colors must share a group or use the Desaturated/Dark cross-pair.",
      };
    },

    async listJourneyCategories(garderType) {
      const defaultCounts = new Map(
        MOCK_JOURNEY_CATEGORIES.map((category) => [
          category.categoryId,
          category.count,
        ]),
      );
      return getCategoriesByGender(garderType).map((category) => ({
        categoryId: category.id,
        count: defaultCounts.get(category.id) ?? 1,
      }));
    },
  };
}

function buildWardrobeEntry(
  userId: string,
  draft: ItemDraft,
  timestamp: string,
): WardrobeEntry {
  const id = deterministicUuid(
    "wardrobe-item",
    `${userId}:${draft.name}:${draft.sourceUrl ?? draft.imageUrl ?? draft.categoryId}`,
  );

  return {
    id,
    userId,
    name: draft.name,
    categoryId: draft.categoryId,
    photoUrl: draft.imageUrl,
    imageUrl: draft.imageUrl,
    colorPoints: draft.colorPoints,
    brand: draft.brand,
    material: draft.material,
    price: draft.price,
    sourceUrl: draft.sourceUrl,
    capsuleIds: [],
    isPublic: draft.isPublic ?? false,
    sourceType: draft.sourceType,
    status: "active",
    favorite: false,
    fromCatalog: draft.sourceType === "catalog",
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function applyWardrobeFilters(
  items: WardrobeEntry[],
  filters?: WardrobeListFilters,
): WardrobeEntry[] {
  return items.filter((item) => {
    if (filters?.status && item.status !== filters.status) {
      return false;
    }
    if (filters?.favorite !== undefined && item.favorite !== filters.favorite) {
      return false;
    }
    if (filters?.capsuleId && !item.capsuleIds.includes(filters.capsuleId)) {
      return false;
    }
    if (filters?.query) {
      const query = filters.query.trim().toLowerCase();
      return [item.name, item.brand, item.material, item.categoryId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    }
    return true;
  });
}

function itemMatchesCatalogQuery(item: WardrobeEntry, query: string): boolean {
  if (!query) {
    return true;
  }

  return [item.name, item.brand, item.material, item.categoryId]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

function getMutableWardrobeItem(
  items: Map<string, WardrobeEntry>,
  userId: string,
  itemId: string,
): WardrobeEntry {
  const item = items.get(itemId);
  if (!item || !itemBelongsToUser(item, userId)) {
    throw new Error("NOT_FOUND: Wardrobe item not found.");
  }
  return item;
}

function itemBelongsToUser(item: WardrobeEntry, userId: string): boolean {
  return item.userId === userId;
}

function ensureProfile(
  profiles: Map<string, Profile>,
  userId: string,
  timestamp: string,
): Profile {
  const profile = profiles.get(userId);
  if (profile) {
    return profile;
  }

  const created: Profile = {
    ...MOCK_PROFILE,
    userId,
    email: userId === MOCK_USER.id ? MOCK_USER.email : `${userId}@mock.local`,
    displayName: "Stage 1 Mock User",
    coinBalance: 15,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  profiles.set(userId, created);
  return created;
}

function buildUploadJobId(uploadId: string): string {
  return deterministicUuid("upload-job", uploadId);
}

function addDays(timestamp: string, days: number): string {
  const date = new Date(timestamp);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function deterministicUuid(namespace: string, seed: string): string {
  const hash = createHash("sha256")
    .update(`${namespace}:${seed}`)
    .digest("hex");
  const variant = ((Number.parseInt(hash[16], 16) & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${variant}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
