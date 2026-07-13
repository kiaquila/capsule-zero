import assert from "node:assert/strict";
import { test } from "node:test";

import {
  extractCodexReviewedCommit,
  matchesCodexSummaryComment,
  pickLatestCodexSummaryComment,
} from "./codex-summary.mjs";

const codexReviewerLogins = new Set(["chatgpt-codex-connector[bot]"]);
const headSha = "72386ce1d1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

// Body shape observed live on PR #62 (issuecomment-4860362613).
const summaryBody = (reviewedCommit) =>
  [
    "Codex Review: Didn't find any major issues. Chef's kiss.",
    "",
    ...(reviewedCommit ? [`**Reviewed commit:** \`${reviewedCommit}\``, ""] : []),
    "<details> <summary>ℹ️ About Codex in GitHub</summary>",
    "</details>",
  ].join("\n");

const makeComment = (overrides = {}) => ({
  user: { login: "chatgpt-codex-connector[bot]" },
  created_at: "2026-07-01T21:58:41Z",
  html_url: "https://github.com/kiaquila/capsule-zero/pull/62#issuecomment-1",
  body: summaryBody("72386ce1d1"),
  ...overrides,
});

test("extractCodexReviewedCommit reads the backticked abbreviated SHA", () => {
  assert.equal(extractCodexReviewedCommit(summaryBody("72386ce1d1")), "72386ce1d1");
});

test("extractCodexReviewedCommit accepts a full unbackticked SHA and lowercases it", () => {
  assert.equal(
    extractCodexReviewedCommit(`**Reviewed commit:** ${headSha.toUpperCase()}`),
    headSha,
  );
});

test("extractCodexReviewedCommit returns null without a reviewed-commit line", () => {
  assert.equal(extractCodexReviewedCommit(summaryBody(null)), null);
});

test("extractCodexReviewedCommit rejects anchors shorter than seven hex chars", () => {
  assert.equal(extractCodexReviewedCommit("**Reviewed commit:** `abc12`"), null);
});

test("matchesCodexSummaryComment requires trusted login and Codex Review prefix", () => {
  assert.equal(matchesCodexSummaryComment(makeComment(), codexReviewerLogins), true);
  assert.equal(
    matchesCodexSummaryComment(
      makeComment({ user: { login: "mallory" } }),
      codexReviewerLogins,
    ),
    false,
  );
  assert.equal(
    matchesCodexSummaryComment(
      makeComment({ body: "Random comment mentioning Codex Review: inline" }),
      codexReviewerLogins,
    ),
    false,
  );
});

test("rerun regression (PR #62): an earlier short anchor is accepted after validation", async () => {
  const verdict = makeComment();
  const picked = await pickLatestCodexSummaryComment({
    comments: [verdict],
    codexReviewerLogins,
    headSha,
    validateReviewedCommitAnchor: async (reviewedCommit, currentHeadSha) =>
      reviewedCommit === "72386ce1d1" && currentHeadSha === headSha,
  });

  assert.equal(picked, verdict);
});

test("pre-trigger short anchor is rejected when uniqueness validation fails", async () => {
  const picked = await pickLatestCodexSummaryComment({
    comments: [makeComment()],
    codexReviewerLogins,
    headSha,
    validateReviewedCommitAnchor: async () => false,
  });

  assert.equal(picked, null);
});

test("pre-trigger full-SHA verdict anchored to head SHA is accepted", async () => {
  const verdict = makeComment({ body: summaryBody(headSha) });
  const picked = await pickLatestCodexSummaryComment({
    comments: [verdict],
    codexReviewerLogins,
    headSha,
  });

  assert.equal(picked, verdict);
});

test("fresh short anchor still requires uniqueness validation", async () => {
  const verdict = makeComment({ created_at: "2026-07-01T22:10:00Z" });
  assert.equal(
    await pickLatestCodexSummaryComment({
      comments: [verdict],
      codexReviewerLogins,
      headSha,
    }),
    null,
  );
  assert.equal(
    await pickLatestCodexSummaryComment({
      comments: [verdict],
      codexReviewerLogins,
      headSha,
      validateReviewedCommitAnchor: async () => true,
    }),
    verdict,
  );
});

test("verdict anchored to a different commit is rejected even when fresh", async () => {
  const picked = await pickLatestCodexSummaryComment({
    comments: [
      makeComment({
        body: summaryBody("badc0ffee1"),
        created_at: "2026-07-01T22:10:00Z",
      }),
    ],
    codexReviewerLogins,
    headSha,
  });

  assert.equal(picked, null);
});

test("anchorless verdict is rejected regardless of recency", async () => {
  const stale = makeComment({ body: summaryBody(null), created_at: "2026-07-01T21:58:41Z" });
  const fresh = makeComment({ body: summaryBody(null), created_at: "2026-07-01T22:10:00Z" });

  assert.equal(
    await pickLatestCodexSummaryComment({
      comments: [stale],
      codexReviewerLogins,
      headSha,
    }),
    null,
  );
  assert.equal(
    await pickLatestCodexSummaryComment({
      comments: [fresh],
      codexReviewerLogins,
      headSha,
    }),
    null,
  );
});

test("untrusted author is rejected even with a matching anchor", async () => {
  const picked = await pickLatestCodexSummaryComment({
    comments: [makeComment({ user: { login: "mallory" } })],
    codexReviewerLogins,
    headSha,
  });

  assert.equal(picked, null);
});

test("latest matching anchored summary comment wins", async () => {
  const earlier = makeComment({ body: summaryBody(headSha), created_at: "2026-07-01T21:58:41Z" });
  const later = makeComment({ body: summaryBody(headSha), created_at: "2026-07-01T22:15:37Z" });
  const picked = await pickLatestCodexSummaryComment({
    comments: [earlier, later],
    codexReviewerLogins,
    headSha,
  });

  assert.equal(picked, later);
});
