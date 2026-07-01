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

export const pickLatestCodexSummaryComment = ({
  comments,
  codexReviewerLogins,
  triggerTime,
  headSha,
}) =>
  comments
    .filter((comment) => {
      if (!matchesCodexSummaryComment(comment, codexReviewerLogins)) {
        return false;
      }

      // A summary that names the commit it reviewed is judged on that anchor
      // alone: the anchor may be abbreviated, and when it is a prefix of the
      // current head SHA the reviewed diff is byte-identical, so the verdict
      // cannot be stale even when it predates the current gate run (e.g. a
      // rerun after a timeout). A mismatched anchor is never accepted, no
      // matter how fresh. Only anchorless summaries fall back to the
      // created-after-trigger recency rule.
      const reviewedCommit = extractCodexReviewedCommit(comment.body || "");
      if (reviewedCommit !== null) {
        return (headSha || "").toLowerCase().startsWith(reviewedCommit);
      }

      return new Date(comment.created_at || 0).getTime() >= triggerTime;
    })
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )[0] || null;
