# Plan — documentation alignment

Reuse check: searched `basicity`, `cut eligibility`, `colour-only`, `70%`, `80–150`, current/dated
cuts and custom-category rejection across PRODUCT-PLAN, PRODUCT-RESEARCH, AGENTS/CLAUDE,
`.specify/**` and `docs_capsule_zero/**`. Extend existing item-tagging (§6) and generation (§2.5)
authorities; add only this required feature-memory folder, not a new domain abstraction.

## Verification

| AC    | Command or reviewable artifact                                                                                                                                                                      | Result                                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1   | `git diff -- PRODUCT-PLAN.md .specify/memory/constitution.md AGENTS.md CLAUDE.md README.md`                                                                                                         | D4/Q5 and Stage 2 are a mandatory guest/account pre-MVP gate; documentation and shipped interim runtime are distinguished.                                                 |
| AC2   | `git diff -- docs_capsule_zero/project/methodology/ docs_capsule_zero/glossary.md .specify/memory/design-system.md`                                                                                 | Separate signals, 100/50/0 simplicity/unknown rule, dated six-month currentness review, whole-look verdicts, owned-item preservation and updated accessory style identity. |
| AC3   | `git diff -- docs_capsule_zero/features/ docs_capsule_zero/screens/ docs_capsule_zero/i18n/ docs_capsule_zero/adr/api-spec.md docs_capsule_zero/project/{frontend,backend,mobile}/ .specify/specs/` | Active consumer obligations and historical scope supersession; actual OpenAPI/client/storage remain unchanged.                                                             |
| AC4   | `git diff -- PRODUCT-RESEARCH.md docs_capsule_zero/launch/launch-plan.md docs_capsule_zero/project/methodology/outfit-generation.md`                                                                | Paper §3/table 4 attribution, full-MVP validation requirements, no inferred modernity/quality/optimality guarantee.                                                        |
| AC1–4 | Documentation audit below; `git diff --check`                                                                                                                                                       | PASS: 61 Markdown files, 121 added local links; documentation audit and diff whitespace checks passed.                                                                     |
| AC5   | `node scripts/check-repo-baseline.mjs`; `node scripts/check-feature-memory.mjs --worktree`; `npm run check:api-contract`; `node --test scripts/lib/*.test.mjs`                                      | PASS: baseline and feature-memory; API/client parity (50 operations, 24 Go route registrations); all 42 gate-script tests passed.                                          |
| AC5   | Current-head PR required checks and native Codex review linked from this PR                                                                                                                         | Final evidence is the linked PR current-head checks and trusted Codex verdict; required before merge. This does not imply cut-engine implementation or MVP completion.     |

Review-fix evidence: `outfit-generation.md` §2.5 now defines a verdict table, failure precedence,
100/current candidate eligibility, exact display/recommendation ordering and expected 100-dated,
50/0-current and unknown parity outcomes. This addresses native Codex thread `PRRT_kwDORvfoks6u0pX9`;
PRODUCT-PLAN, item attributes, MVP/API target and copy use the same semantics.
Additional review fixes: methodology §6.1 provides the owner-reference → curator-reference workflow,
durable states and invalidation/recalculation; My Items/API targets consume it. Historical 013 FR-006
is restored verbatim from main, with only its dated supersession header carrying the new target.

CI recovery evidence: test run `39619285862` failed twice during service initialization with ECR
`Data limit exceeded`. Google cache manifest lookup for PostgreSQL 16 returned HTTP 200 and OCI
index digest `sha256:a902560563d3a5661228585f53474c5065e7f273b21ffd77e555a8b5682c5690`.
The existing workflow tests retain real PostgreSQL integration, health checks and both execution-path
failure assertions. All 42 gate-script tests passed after changing the service image reference.
No application or actual OpenAPI/storage contract changes.

### Reproducible documentation audit

Run from the repository root (worktree before commit or the PR head after commit):

```bash
python3 - <<'PY'
from pathlib import Path
import re, subprocess
root = Path.cwd()
base = subprocess.check_output(['git', 'merge-base', 'origin/main', 'HEAD'], text=True).strip()
changed = set(subprocess.check_output(['git', 'diff', '--name-only', base], text=True).splitlines())
changed.update(subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], text=True).splitlines())
ci_support = {'.github/workflows/test.yml', 'scripts/lib/go-test-workflow.test.mjs'}
assert changed and all(p.endswith('.md') or p in ci_support for p in changed), 'Approved scope violated'
markdown = {p for p in changed if p.endswith('.md')}
new_links = 0
for name in sorted(markdown):
    text = (root / name).read_text()
    assert not re.search(r'^(<<<<<<<|=======|>>>>>>>)', text, re.M), name
    assert ('058-' + 'mvp-cut-algorithm-contract') not in text, ('Stale cut-contract path', name)
    # Check local Markdown links added by this contract, not older unresolved prototype references.
    diff = subprocess.check_output(['git', 'diff', '--unified=0', base, '--', name], text=True)
    added = '\n'.join(line[1:] for line in diff.splitlines() if line.startswith('+') and not line.startswith('+++'))
    if not diff: added = text
    for target in re.findall(r'\]\(([^)]+)\)', added):
        if re.match(r'^(https?://|#|mailto:)', target): continue
        assert (root / name).parent.joinpath(target.split('#')[0]).exists(), (name, target)
        new_links += 1
method = (root / 'docs_capsule_zero/project/methodology/capsule-methodology.md').read_text()
outfit = (root / 'docs_capsule_zero/project/methodology/outfit-generation.md').read_text()
plan = (root / 'PRODUCT-PLAN.md').read_text()
assert all(term in method for term in ['simple', 'current', 'unreviewed', 'excessive', 'six months', 'owner-reference', 'curator-reference', 'review-requested'])
outfit = ' '.join(outfit.split())
assert all(term in outfit for term in ['entire look', 'all pairs alone is insufficient', 'FITB', 'guest-v1', 'implementation spec', 'DATED_CUT', 'number of items with basicity <100', 'canonical preset ID', 'cut/fit/volume/length/construction/decor', 'same-colour/slot/cut/volume/length/decor'])
assert 'ОБЯЗАТЕЛЬНО ДЛЯ MVP' in plan and 'принятия MVP' in plan
assert 'guarantees universal combinability' not in method
assert 'colour only (does' not in outfit
assert 'future implementation work, not shipped UI' in (root / 'docs_capsule_zero/screens/screen-my-items.md').read_text()
assert 'low simplicity alone' in (root / 'docs_capsule_zero/project/methodology/categories.md').read_text().lower()
journey = (root / 'docs_capsule_zero/features/f-006-guided-journey.md').read_text()
assert all(phrase not in journey for phrase in ["doesn't look like a basic item", 'similar basic category', 'Custom category rejection']), 'Retired active journey rejection'
assert 'Step 2 category clarification' in journey and 'Unmappable category/role' in journey
historical = ' .specify/specs/013-stage-1-guided-journey/spec.md'.strip()
original = subprocess.check_output(['git', 'show', 'origin/main:' + historical], text=True)
assert (root / historical).read_text().split('**Feature Branch**', 1)[1] == original.split('**Feature Branch**', 1)[1], 'Historical 013 body changed'
print(f'PASS: {len(markdown)} Markdown files; {new_links} added local links; scope, conflict markers and canonical contract assertions')
PY
```

The baseline repository already has npm tooling; no framework/library behaviour is changed, so
Context7 is not needed for this documentation scope. Remote CI runs the full unchanged application,
container, browser, security and native-review gates. Local command evidence is docs integrity, unchanged CI failure semantics, and
contract parity, not a claim that the target cut engine is implemented.
