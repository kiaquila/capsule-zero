import type {
  GuestProgressPort,
  SavedGuest,
  SavedGuestItem,
} from "../contracts";
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
export function createApiGuestProgress(request: Request): GuestProgressPort {
  return {
    save: (_userId, input) =>
      request<SavedGuest>("/api/guest-progress", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    list: () => request<SavedGuest[]>("/api/guest-progress"),
    get: async (_userId, id) =>
      request<SavedGuest>(`/api/guest-progress/${encodeURIComponent(id)}`),
    listItems: () => request<SavedGuestItem[]>("/api/guest-progress/items"),
    updateItem: (_userId, id, input) =>
      request<SavedGuestItem>(
        `/api/guest-progress/items/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
  };
}
