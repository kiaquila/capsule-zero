import type {
  Capsule,
  CapsuleCategory,
  CapsulePalette,
  ClothingItem,
  ColorPoint,
  GarderType,
  Locale,
  User,
} from "@/types";

export type ProviderMode = "mock" | "supabase" | "api";

export type ItemSourceType = "photo_upload" | "marketplace" | "catalog";
export type ItemStatus = "active" | "uncapsulated" | "for_sale" | "for_repair";
export type UploadJobType =
  | "photo_upload"
  | "background_removal"
  | "marketplace_parse"
  | "item_embedding";
export type UploadJobStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "timeout";
export type MarketplaceImportStatus =
  | "pending"
  | "parsed"
  | "failed"
  | "confirmed";
/** @deprecated Superseded by PRODUCT-PLAN.md D2; retained only for legacy provider cleanup in Stage 4. */
export type InvoiceStatus = "pending" | "paid" | "expired" | "failed";
/** @deprecated Superseded by PRODUCT-PLAN.md D2; retained only for legacy provider cleanup in Stage 4. */
export type CoinSpendReason = "extra_capsule" | "photo_enhancement";

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  /**
   * After-sign-up email verification flow (spec 035). The emailed code is
   * bound to this Kratos flow; the verify-email banner submits against it.
   */
  verificationFlowId?: string;
}

export interface PasswordCredentials {
  email: string;
  password: string;
  name?: string;
  locale?: Locale;
}

export interface PasswordRecoveryRequest {
  delivery: "email";
  email: string;
  /** Flow the emailed one-time code is bound to (spec 035). */
  flowId: string;
}

export interface PasswordRecoveryCompletion {
  flowId?: string;
  code?: string;
  newPassword: string;
  recoveryContinuationId?: string;
}

export interface EmailVerificationRequest {
  delivery: "email";
  email: string;
  flowId: string;
}

export interface EmailVerificationCompletion {
  flowId: string;
  code: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export interface GoogleSignInStart {
  /** Google consent-screen URL the browser must visit. */
  redirectUrl: string;
  /** Session-token exchange (init) code the completion call presents again. */
  exchangeCode: string;
}

export interface GoogleSignInCompletion {
  exchangeCode: string;
  /** Code Kratos appended to the callback redirect. */
  returnToCode: string;
}

export interface AuthPort {
  getCurrentSession(): Promise<Session | null>;
  signUpWithPassword(credentials: PasswordCredentials): Promise<Session | null>;
  signInWithPassword(credentials: PasswordCredentials): Promise<Session>;
  requestPasswordRecovery(email: string): Promise<PasswordRecoveryRequest>;
  completePasswordRecovery(
    completion: PasswordRecoveryCompletion,
  ): Promise<Session>;
  startEmailVerification(email: string): Promise<EmailVerificationRequest>;
  completeEmailVerification(
    completion: EmailVerificationCompletion,
  ): Promise<void>;
  changePassword(change: PasswordChange): Promise<void>;
  signOut(): Promise<void>;
  /**
   * Google sign-in (spec 037). Optional so the frozen Supabase provider
   * (AGENTS §8) needs no edits; the UI hides the button when the port lacks
   * these or reports the provider disabled.
   */
  googleSignInEnabled?(): Promise<boolean>;
  startGoogleSignIn?(returnTo: string): Promise<GoogleSignInStart>;
  completeGoogleSignIn?(completion: GoogleSignInCompletion): Promise<Session>;
}

export interface Profile {
  userId: string;
  displayName: string;
  email: string;
  locale: Locale;
  country?: string;
  city?: string;
  avatarUrl?: string;
  /** @deprecated Not part of the authoritative OpenAPI after PRODUCT-PLAN.md D2. */
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
}

export type ProfileUpdate = Partial<
  Pick<Profile, "displayName" | "locale" | "country" | "city" | "avatarUrl">
>;

export interface ProfileRepository {
  getProfile(userId: string): Promise<Profile>;
  updateProfile(userId: string, input: ProfileUpdate): Promise<Profile>;
}

export interface WardrobeEntry extends ClothingItem {
  imageUrl?: string;
  sourceType: ItemSourceType;
  status: ItemStatus;
  favorite: boolean;
  fromCatalog: boolean;
  version: number;
  updatedAt: string;
}

export interface WardrobeListFilters {
  status?: ItemStatus;
  favorite?: boolean;
  capsuleId?: string;
  query?: string;
}

export interface ItemDraft {
  name: string;
  categoryId: string;
  colorPoints: ColorPoint[];
  sourceType: ItemSourceType;
  imageUrl?: string;
  brand?: string;
  material?: string;
  price?: number;
  sourceUrl?: string;
  isPublic?: boolean;
}

export interface WardrobeRepository {
  listItems(
    userId: string,
    filters?: WardrobeListFilters,
  ): Promise<WardrobeEntry[]>;
  getItem(userId: string, itemId: string): Promise<WardrobeEntry | null>;
  createItem(userId: string, draft: ItemDraft): Promise<WardrobeEntry>;
  updateItemStatus(
    userId: string,
    itemId: string,
    status: ItemStatus,
  ): Promise<WardrobeEntry>;
  setFavorite(
    userId: string,
    itemId: string,
    favorite: boolean,
  ): Promise<WardrobeEntry>;
}

export interface PhotoUploadMetadata {
  fileName: string;
  mimeType: string;
  byteSize: number;
  requestedBackgroundRemoval: boolean;
}

export interface UploadTarget {
  uploadId: string;
  jobId: string;
  uploadUrl: string;
  storagePath: string;
  maxBytes: number;
  acceptedMimeTypes: string[];
  expiresAt: string;
}

export interface UploadCompletion {
  uploadId: string;
  storagePath: string;
  originalUrl: string;
}

export interface StoragePort {
  createPhotoUploadTarget(
    userId: string,
    metadata: PhotoUploadMetadata,
  ): Promise<UploadTarget>;
  completePhotoUpload(
    userId: string,
    completion: UploadCompletion,
  ): Promise<UploadJob>;
  getSignedAssetUrl(userId: string, storagePath: string): Promise<string>;
}

export interface UploadJob {
  id: string;
  userId: string;
  type: UploadJobType;
  status: UploadJobStatus;
  originalUrl?: string;
  processedUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageProcessingPort {
  startBackgroundRemoval(userId: string, jobId: string): Promise<UploadJob>;
  getUploadJob(userId: string, jobId: string): Promise<UploadJob | null>;
}

export interface MarketplaceCandidate {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  colorPoints: ColorPoint[];
  brand?: string;
  material?: string;
  price?: number;
  sourceUrl: string;
}

export interface MarketplaceImport {
  id: string;
  userId: string;
  url: string;
  status: MarketplaceImportStatus;
  candidates: MarketplaceCandidate[];
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceImportPort {
  createImport(userId: string, url: string): Promise<MarketplaceImport>;
  getImport(
    userId: string,
    importId: string,
  ): Promise<MarketplaceImport | null>;
  confirmCandidate(
    userId: string,
    importId: string,
    candidateId: string,
  ): Promise<WardrobeEntry>;
}

export interface CatalogSearchFilters {
  categoryIds?: string[];
  colorIds?: string[];
  wardrobeType?: GarderType;
}

export interface CatalogSearchResult {
  item: WardrobeEntry;
  matchScore: number;
  explanation: string;
}

export interface CatalogSearchPort {
  search(
    userId: string,
    query: string,
    filters?: CatalogSearchFilters,
  ): Promise<CatalogSearchResult[]>;
  addCatalogItem(userId: string, itemId: string): Promise<WardrobeEntry>;
}

/**
 * @deprecated The complete billing contract is frozen under PRODUCT-PLAN.md D2.
 * Do not call or extend these legacy provider shapes; Stage 4 removes or replaces them.
 */
export interface CoinPack {
  id: string;
  coins: number;
  priceUsd: number;
  providerProductId: string;
}

export interface LavaInvoice {
  id: string;
  userId: string;
  coinPackId: string;
  status: InvoiceStatus;
  paymentUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoinSpendRequest {
  reason: CoinSpendReason;
  targetId: string;
  idempotencyKey: string;
}

export interface CoinLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  reason: "purchase" | CoinSpendReason;
  targetId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface LavaWebhookReplay {
  eventId: string;
  invoiceId: string;
  status: InvoiceStatus;
}

/** @deprecated Superseded by PRODUCT-PLAN.md D2; not an active product or API contract. */
export interface BillingPort {
  listCoinPacks(): Promise<CoinPack[]>;
  createLavaInvoice(userId: string, coinPackId: string): Promise<LavaInvoice>;
  getLavaInvoiceStatus(
    userId: string,
    invoiceId: string,
  ): Promise<LavaInvoice | null>;
  spendCoins(
    userId: string,
    request: CoinSpendRequest,
  ): Promise<{ profile: Profile; ledgerEntry: CoinLedgerEntry }>;
  replayLavaWebhook(event: LavaWebhookReplay): Promise<CoinLedgerEntry | null>;
}

export interface CapsuleDraft {
  name: string;
  garderType: GarderType;
  palette: CapsulePalette;
  categories: CapsuleCategory[];
  itemIds: string[];
}

export interface CapsuleRepository {
  getCurrentCapsule(userId: string): Promise<Capsule | null>;
  createCapsule(userId: string, draft: CapsuleDraft): Promise<Capsule>;
}

export interface PaletteValidationResult {
  valid: boolean;
  blockedColorIds: string[];
  explanation?: string;
}

export interface MethodologyPort {
  validatePalette(colorPoints: ColorPoint[]): Promise<PaletteValidationResult>;
  listJourneyCategories(garderType: GarderType): Promise<CapsuleCategory[]>;
}

export interface ProviderHealth {
  status: "ok" | "degraded";
  mode: ProviderMode;
  fixtures: {
    users: number;
    wardrobeItems: number;
    catalogItems: number;
    coinPacks: number;
  };
  integrations: Record<string, "mocked" | "pending-gate" | "configured">;
}

export interface ProviderRegistry {
  mode: ProviderMode;
  auth: AuthPort;
  profiles: ProfileRepository;
  wardrobe: WardrobeRepository;
  storage: StoragePort;
  imageProcessing: ImageProcessingPort;
  marketplaceImports: MarketplaceImportPort;
  catalogSearch: CatalogSearchPort;
  billing: BillingPort;
  capsules: CapsuleRepository;
  methodology: MethodologyPort;
  health(): Promise<ProviderHealth>;
}
