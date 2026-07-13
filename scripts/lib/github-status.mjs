import { fetchWithRetry } from "./github-fetch.mjs";

const allowedStates = new Set(["error", "failure", "pending", "success"]);

export const publishCommitStatus = async ({
  token,
  repository,
  sha,
  state,
  description,
  targetUrl,
  fetchImpl = globalThis.fetch,
  sleepImpl,
}) => {
  if (!token || !repository || !sha) {
    throw new Error("token, repository, and sha are required to publish a commit status");
  }

  if (!allowedStates.has(state)) {
    throw new Error(`Unsupported commit status state: ${state}`);
  }

  const response = await fetchWithRetry(
    `https://api.github.com/repos/${repository}/statuses/${sha}`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        state,
        context: "AI Review",
        description,
        target_url: targetUrl,
      }),
    },
    { fetchImpl, ...(sleepImpl ? { sleepImpl } : {}) },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to publish AI Review status: ${response.status} ${await response.text()}`,
    );
  }

  return response.json();
};
