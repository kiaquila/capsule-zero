import { expect } from "./base";
import type { GuestPage } from "../pages/GuestPage";

export const presetId = "w-tee-white";
export async function saveWardrobe(guest: GuestPage) {
  await guest.goto();
  await guest.wardrobe("mixed").click();
  await guest.select([presetId, "m-trousers-black", "m-sneakers-white"]);
  await guest.next.click();
  await guest.save.click();
  await guest.auth.emailInput.fill(
    `guest-wardrobe-${crypto.randomUUID()}@example.test`,
  );
  await guest.auth.passwordInput.fill("CapsuleStrong123!");
  await guest.auth.confirmPasswordInput.fill("CapsuleStrong123!");
  await guest.auth.submit.click();
  await expect(guest.savedConfirmation).toBeVisible({ timeout: 20_000 });
}
