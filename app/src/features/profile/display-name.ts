export function resolveDisplayName(
  email: string,
  ...candidates: Array<string | undefined>
): string {
  for (const candidate of candidates) {
    const normalized = candidate?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return (email.split("@")[0] ?? "").trim();
}

export function splitDisplayName(
  email: string,
  ...candidates: Array<string | undefined>
) {
  const parts = resolveDisplayName(email, ...candidates)
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}
