#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { routeCodexCommentEvent } from "./lib/codex-summary.mjs";
import { restartAiReviewIfNeeded } from "./lib/github-actions.mjs";

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const allowed = await routeCodexCommentEvent({
  event,
  headSha: process.env.AI_REVIEW_HEAD_SHA,
  validateReviewedCommitAnchor: async (anchor, head) => {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${anchor}`,
      {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      },
    );
    return response.ok && (await response.json()).sha === head;
  },
});
if (!allowed) {
  console.log("Ignored unrelated or stale comment event");
  process.exit(0);
}
const result = await restartAiReviewIfNeeded({
  token: process.env.GITHUB_TOKEN,
  repository: process.env.GITHUB_REPOSITORY,
  headSha: process.env.AI_REVIEW_HEAD_SHA,
  prNumber: process.env.AI_REVIEW_PR_NUMBER,
  evidenceTime: Date.parse(
    event.comment.updated_at || event.comment.created_at,
  ),
});

console.log(
  JSON.stringify({
    action: result.action,
    runId: result.run.id,
    runUrl: result.run.html_url,
    headSha: result.run.head_sha,
  }),
);
