#!/usr/bin/env node

import { restartAiReviewIfNeeded } from "./lib/github-actions.mjs";

const result = await restartAiReviewIfNeeded({
  token: process.env.GITHUB_TOKEN,
  repository: process.env.GITHUB_REPOSITORY,
  headSha: process.env.AI_REVIEW_HEAD_SHA,
});

console.log(
  JSON.stringify({
    action: result.action,
    runId: result.run.id,
    runUrl: result.run.html_url,
    headSha: result.run.head_sha,
  }),
);
