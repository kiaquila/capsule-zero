const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const discardResponseBody = async (response) => {
  try {
    await response.body?.cancel?.();
  } catch {
    // A retry must not fail because a synthetic or already-consumed body cannot be cancelled.
  }
};

export const fetchWithRetry = async (
  url,
  init = {},
  {
    attempts = 4,
    baseDelayMs = 1000,
    fetchImpl = globalThis.fetch,
    sleepImpl = defaultSleep,
  } = {},
) => {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error("attempts must be a positive integer");
  }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      const shouldRetry = retryableStatuses.has(response.status) && attempt < attempts;

      if (!shouldRetry) {
        return response;
      }

      await discardResponseBody(response);
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }
    }

    await sleepImpl(baseDelayMs * 2 ** (attempt - 1));
  }

  throw new Error("GitHub request retry loop exhausted unexpectedly");
};
