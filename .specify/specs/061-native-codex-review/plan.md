# Plan

## Reuse Check

Inspect scripts/lib/codex-summary.mjs and scripts/ai-review-gate.mjs: anchor matching and COMMENTED review presence do not provide full-response or native lifecycle authority. Reuse the already tested split native comment/state engine from the owner’s maintained gate, with a small read-only adapter.

## Verification

| Check                    | Evidence                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Offline gate regressions | node --test scripts/lib/\*.test.mjs                                                                                                    |
| Syntax and baseline      | Node syntax and npm run check:repo                                                                                                     |
| Native delivery          | Current-head owner request, native Codex, all required CI checks, resolved threads and 120-second stable window before protected merge |
