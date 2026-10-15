// Native receipt parsing is shared by the gate and its comment-event router.
const receiptMarker = "<!-- codex-review-receipt:v1 -->";
export const codexCommentTime = (comment) =>
  Date.parse(comment.updated_at || comment.created_at || 0);

const receiptText = (body) => {
  const text = (body || "").trim();
  if ((text.match(/<!--\s*codex-review-receipt:/g) || []).length > 1)
    return null;
  return text.startsWith(receiptMarker)
    ? text.slice(receiptMarker.length).trim()
    : text;
};

export const matchesCodexSummaryComment = (comment, codexReviewerLogins) =>
  codexReviewerLogins.has(comment.user?.login || "") &&
  /^Codex Review:/i.test(receiptText(comment.body) || "");

export const extractCodexReviewedCommit = (body) => {
  const anchors = [
    ...(body || "").matchAll(
      /\*\*Reviewed commit:\*\*\s*`?([0-9a-fA-F]{7,40})(?![0-9a-fA-F])`?/g,
    ),
  ];
  return anchors.length === 1 ? anchors[0][1].toLowerCase() : null;
};

export const classifyCodexSummaryComment = (comment) => {
  const text = receiptText(comment.body) || "";
  const content = text.split(/<details>/i)[0].trim();
  const clean =
    /^Codex Review: did(?: not|n't|n’t) find any major issues\.(?:\s*(?::rocket:|🚀|Chef's kiss\.))?\s+\*\*Reviewed commit:\*\*\s*`?[a-f0-9]{7,40}`?\s*$/i.test(
      content,
    );
  const suffix = text.slice(content.length).trim();
  const validFooter =
    !suffix ||
    /^<details>\s*<summary>[^\n]*About Codex in GitHub[^\n]*<\/summary>[\s\S]*<\/details>$/i.test(
      suffix,
    );
  return {
    outcome:
      clean &&
      validFooter &&
      extractCodexReviewedCommit(text) &&
      !/\bP[0-3]\b/i.test(text)
        ? "pass"
        : "fail",
    reason:
      clean && validFooter
        ? "Codex completed review with no major issues."
        : "Codex receipt lacks an unambiguous positive verdict.",
    details: [comment.html_url],
  };
};

// A structured summary is a wake-up signal only, never positive review evidence.
export const matchesCodexStateComment = (
  comment,
  codexReviewerLogins,
  headSha,
) => {
  if (!codexReviewerLogins.has(comment.user?.login || "")) return false;
  const text = (comment.body || "").trim();
  const match = text.match(
    /^<!-- codex-pull-request-review-summary -->\s*<!-- codex-review-state:v1 (\{[^\n]*\}) -->\s*## Codex Review Summary\b/,
  );
  if (
    !match ||
    (text.match(/<!-- codex-review-state:/g) || []).length !== 1 ||
    (text.match(/<!-- codex-pull-request-review-summary -->/g) || []).length !==
      1
  )
    return false;
  try {
    const state = JSON.parse(match[1]);
    const code = state.code_review;
    return (
      code &&
      /^[a-f0-9]{40}$/.test(code.commit_sha) &&
      (!headSha || code.commit_sha === headSha) &&
      ["completed", "in_progress", "queued", "pending"].includes(code.status) &&
      [true, false, null].includes(code.has_any_findings) &&
      [true, false, null].includes(code.has_unresolved_findings)
    );
  } catch {
    return false;
  }
};

export const pickLatestCodexSummaryComment = async ({
  comments,
  codexReviewerLogins,
  headSha,
  validateReviewedCommitAnchor = async () => false,
}) => {
  const normalizedHeadSha = (headSha || "").toLowerCase();
  const matchingComments = [];
  for (const comment of comments) {
    if (!matchesCodexSummaryComment(comment, codexReviewerLogins)) continue;
    const anchor = extractCodexReviewedCommit(comment.body);
    if (!anchor || !normalizedHeadSha.startsWith(anchor)) continue;
    if (
      anchor.length === 40 ||
      (await validateReviewedCommitAnchor(anchor, normalizedHeadSha))
    ) {
      matchingComments.push(comment);
    }
  }
  return (
    matchingComments.sort(
      (a, b) => codexCommentTime(b) - codexCommentTime(a),
    )[0] || null
  );
};

export const routeCodexCommentEvent = async ({
  event,
  headSha,
  validateReviewedCommitAnchor,
}) => {
  if (
    !event.issue?.pull_request ||
    !["created", "edited"].includes(event.action)
  )
    return false;
  const comment = event.comment || {};
  if (
    comment.user?.type !== "Bot" &&
    ["OWNER", "MEMBER", "COLLABORATOR"].includes(comment.author_association) &&
    /^@codex\s+review(?:\s+[a-f0-9]{40})?\s*$/i.test(
      (comment.body || "").trim(),
    )
  ) {
    const requested = (comment.body || "").match(/[a-f0-9]{40}/i)?.[0];
    return !requested || requested.toLowerCase() === headSha;
  }
  const logins = new Set(["chatgpt-codex-connector[bot]"]);
  return (
    matchesCodexStateComment(comment, logins, headSha) ||
    Boolean(
      await pickLatestCodexSummaryComment({
        comments: [comment],
        codexReviewerLogins: logins,
        headSha,
        validateReviewedCommitAnchor,
      }),
    )
  );
};
