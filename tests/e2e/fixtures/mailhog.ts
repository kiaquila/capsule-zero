/**
 * MailHog helpers for the full-stack auth specs. The docker dev stack routes
 * every Kratos email into MailHog (http://127.0.0.1:8025); these helpers pull
 * one-time codes and emailed links back out by recipient + subject.
 */
export const mailhogUrl = process.env.E2E_MAILHOG_URL;

interface MailhogMessage {
  Content: { Body: string; Headers: Record<string, string[]> };
}

async function searchMessages(email: string): Promise<MailhogMessage[]> {
  const response = await fetch(
    `${mailhogUrl}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
  );
  const payload = (await response.json()) as { items: MailhogMessage[] };
  return payload.items ?? [];
}

function subjectOf(message: MailhogMessage): string {
  return (message.Content.Headers.Subject ?? []).join(" ");
}

/** Undo the quoted-printable soft-wrapping MailHog stores bodies with. */
function decodedBody(message: MailhogMessage): string {
  return message.Content.Body.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
}

/**
 * Poll for the newest email to `email` whose subject matches, and extract the
 * 6-digit one-time code from it.
 */
export async function fetchOneTimeCode(
  email: string,
  subjectPattern: RegExp,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    for (const message of await searchMessages(email)) {
      if (!subjectPattern.test(subjectOf(message))) {
        continue;
      }
      const code = decodedBody(message).match(/\b(\d{6})\b/)?.[1];
      if (code) {
        return code;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`no ${subjectPattern} code delivered to ${email}`);
}

/**
 * Poll for the emailed verification LINK — the custom courier template links
 * straight to the app's silent /verify-email route with code+flow (spec 035).
 */
export async function fetchVerificationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    for (const message of await searchMessages(email)) {
      if (!/verif/i.test(subjectOf(message))) {
        continue;
      }
      const link = decodedBody(message).match(
        /https?:\/\/[^\s"<>]+\/verify-email\?[^\s"<>]+/,
      )?.[0];
      if (link) {
        return link.replace(/&amp;/g, "&");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`no verification link delivered to ${email}`);
}
