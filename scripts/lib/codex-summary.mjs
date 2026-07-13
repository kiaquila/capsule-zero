// Codex publishes its no-findings verdict as a top-level PR comment rather
// than a formal GitHub review. These helpers decide which of those comments
// count as a verdict for the commit currently under gate.

export const matchesCodexSummaryComment = (comment, codexReviewerLogins) =>
  codexReviewerLogins.has(comment.user?.login || "") &&
  /^Codex Review:/i.test((comment.body || "").trim());

export const extractCodexReviewedCommit = (body) => {
  const match = (body || "").match(/\*\*Reviewed commit:\*\*\s*`?([0-9a-fA-F]{7,40})`?/);
  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
};

const defaultValidateReviewedCommitAnchor = async () => false;

export const pickLatestCodexSummaryComment = async ({
  comments,
  codexReviewerLogins,
  headSha,
  validateReviewedCommitAnchor = defaultValidateReviewedCommitAnchor,
}) => {
  const normalizedHeadSha = (headSha || "").toLowerCase();
  const matchingComments = [];

  for (const comment of comments) {
    if (!matchesCodexSummaryComment(comment, codexReviewerLogins)) {
      continue;
    }

    const reviewedCommit = extractCodexReviewedCommit(comment.body || "");
    if (reviewedCommit !== null) {
      if (reviewedCommit.length === 40) {
        if (reviewedCommit === normalizedHeadSha) {
          matchingComments.push(comment);
        }
        continue;
      }

      if (!normalizedHeadSha.startsWith(reviewedCommit)) {
        continue;
      }

      if (await validateReviewedCommitAnchor(reviewedCommit, normalizedHeadSha)) {
        matchingComments.push(comment);
      }
      continue;
    }
  }

  return (
    matchingComments.sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )[0] || null
  );
};
