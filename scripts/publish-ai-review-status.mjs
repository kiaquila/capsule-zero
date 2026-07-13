#!/usr/bin/env node

import { publishCommitStatus } from "./lib/github-status.mjs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.AI_REVIEW_HEAD_SHA;
const state = process.env.AI_REVIEW_STATUS_STATE;
const description = process.env.AI_REVIEW_STATUS_DESCRIPTION;
const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
const runId = process.env.GITHUB_RUN_ID;
const targetUrl = runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : undefined;

const status = await publishCommitStatus({
  token,
  repository,
  sha,
  state,
  description,
  targetUrl,
});

console.log(
  JSON.stringify({
    context: status.context,
    state: status.state,
    sha,
    targetUrl,
  }),
);
