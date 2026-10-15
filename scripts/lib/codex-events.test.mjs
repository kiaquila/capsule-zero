import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import {
  classifyCodexSummaryComment,
  routeCodexCommentEvent,
} from "./codex-summary.mjs";

const sha = "a".repeat(40);
const bot = { login: "chatgpt-codex-connector[bot]", type: "Bot" };
const receipt = `<!-- codex-review-receipt:v1 -->\n\nCodex Review: Didn't find any major issues. :rocket:\n\n**Reviewed commit:** \`${sha}\``;
const state = (overrides = {}) =>
  `<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 ${JSON.stringify({ code_review: { commit_sha: sha, has_any_findings: false, has_unresolved_findings: false, status: "completed", ...overrides }, security_review: { commit_sha: null, has_any_findings: null, has_unresolved_findings: null, status: null } })} -->\n\n## Codex Review Summary`;
const event = (body, overrides = {}) => ({
  action: "created",
  issue: { pull_request: {} },
  comment: {
    body,
    user: bot,
    created_at: "2026-10-14T00:00:00Z",
    updated_at: "2026-10-15T00:00:00Z",
  },
  ...overrides,
});
const route = (value) =>
  routeCodexCommentEvent({
    event: value,
    headSha: sha,
    validateReviewedCommitAnchor: async (anchor) => anchor === sha.slice(0, 10),
  });
const workflow = parse(
  readFileSync(
    new URL("../../.github/workflows/ai-review-wakeup.yml", import.meta.url),
    "utf8",
  ),
);
const filter = new Function(
  "github",
  "contains",
  "fromJSON",
  `return ${workflow.jobs["wake-up"].if}`,
);
const matchesFilter = (value) =>
  filter({ event: value }, (a, b) => a.includes(b), JSON.parse);

test("actual workflow and runtime route created and edited receipts and existing summary updates", async () => {
  assert.deepEqual(workflow.on.issue_comment.types, ["created", "edited"]);
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
  for (const action of ["created", "edited"])
    for (const body of [receipt, state(), state({ status: "in_progress" })]) {
      const value = event(body, { action });
      assert.equal(Boolean(matchesFilter(value)), true);
      assert.equal(await route(value), true);
    }
  assert.match(
    workflow.jobs["wake-up"].steps.at(-1).run,
    /scripts\/restart-ai-review.mjs/,
  );
});

test("runtime rejects stale, forged, malformed and unrelated comment signals", async () => {
  for (const value of [
    event(receipt.replace(sha, "b".repeat(40))),
    event(state({ commit_sha: "b".repeat(40) })),
    event(state({ commit_sha: sha.slice(0, 10) })),
    event(state({ status: true })),
    event(receipt, { action: "deleted" }),
    event(receipt, { issue: {} }),
    event(receipt, { comment: { user: { login: "attacker" }, body: receipt } }),
    event(state() + "\n<!-- codex-review-state:v1 {} -->"),
    event(receipt.replace("receipt:v1", "receipt:v2")),
    event(receipt.replace(sha, `${sha}f`)),
    event(receipt + `\n**Reviewed commit:** \`${sha}\``),
  ])
    assert.equal(await route(value), false, JSON.stringify(value));
});

test("new request routes only the exact current head and trusted human association", async () => {
  const comment = {
    user: { type: "User" },
    author_association: "OWNER",
    body: `@codex review ${sha}`,
  };
  assert.equal(await route(event("", { comment })), true);
  for (const override of [
    { author_association: "NONE" },
    { body: `@codex review ${"b".repeat(40)}` },
    { user: bot },
  ]) {
    assert.equal(
      await route(event("", { comment: { ...comment, ...override } })),
      false,
    );
  }
});

test("receipt classification requires an explicit, isolated positive verdict", () => {
  for (const body of [
    receipt,
    receipt.replace("<!-- codex-review-receipt:v1 -->\n\n", ""),
  ]) {
    assert.equal(classifyCodexSummaryComment({ body }).outcome, "pass");
  }
  for (const body of [
    state(),
    receipt.replace("Didn't find any major issues.", "Review in progress."),
    receipt.replace("Didn't find any major issues.", "Found a P1 issue."),
    receipt + "\nP1: blocking issue",
    `<!-- codex-review-receipt:v1 -->\n${receipt}`,
    receipt + `\n**Reviewed commit:** \`${sha}\``,
    receipt + "\nCodex Review: Found issues.",
    receipt.replace(sha, "b".repeat(41)),
    receipt + "\n<!-- unknown -->",
  ])
    assert.equal(classifyCodexSummaryComment({ body }).outcome, "fail", body);
});

test("priority findings inside a footer cannot turn into clean evidence", () => {
  assert.equal(
    classifyCodexSummaryComment({
      body:
        receipt +
        "\n<details><summary>About Codex in GitHub</summary>\nP1: blocker\n</details>",
    }).outcome,
    "fail",
  );
});
