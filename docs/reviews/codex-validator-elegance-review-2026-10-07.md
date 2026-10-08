# Elegance review of the Codex validator work (P04/P05), 2026-10-07

Status: review complete, findings open for owner disposition. Reviewer: Claude Code,
Opus 5.5, frontier session reading the diff directly. Subject: the uncommitted work Codex
left in the skin-campaign worktree between 2026-09-19 and 2026-09-22, on top of `e50bda5b`.
Lens: `~/.claude/rules/codex-delegation.md` (complexity the approved contract did not pay
for is a finding; unexplained choices are findings).

## Scope read

| File | Before | After | Read |
|---|---|---|---|
| `scripts/expect-red.cjs` | 154 lines | 632 lines | whole file |
| `tests/acceptance/installer-recovery.cjs` | 365 lines | 460 lines | every changed line |
| `eslint.config.js` | | 2 lines changed | whole diff |
| `tests/fixtures/expect-red/` | 2 files | 6 files | README and provenance only |
| `tests/expect-red.test.js` | 144 lines | 1,342 lines | structure and scratch handling only, NOT line by line |

The contract these implement is execution-plan sections 12 and 16 to 20 (P03 and its
amendments), which the owner approved on 2026-09-19 and 2026-09-20.

## Gate results on this tree (win32, Node 24.20.0, pinned Bun 1.3.5, 2026-10-07)

| Gate | Result | Threshold or baseline |
|---|---|---|
| `bun run test:mutants:install-transaction` | 0 survivors of 18 | 0 survivors |
| `node scripts/expect-red.cjs install-transaction-coverage` | exit 0; both `bin/lib` modules 100 on all four metrics; 41 pass, 10 render cases fail as "not implemented" | Tier S: 100 per metric per file; exactly the ten reviewed render reds |
| `node scripts/expect-red.cjs installer-recovery` | exit 0; 27 checks, 14 pass, 13 known fail; fixture removed | the reviewed 14/13 split |
| `bun run test` | 1847 pass, 0 fail, 70 files, 391 s | recorded 1847 pass (2026-09-20) |
| `bun run lint` | 0 errors, 835 warnings | 0 errors; 835 warnings is the recorded old count |
| `bun run lint:docs` | 0 issues, 137 files | 0 issues |
| `bun run compose` | 849 files, upstream 1.9.1 | exit 0 |
| `node scripts/check-overrides.js` | 9 overrides fresh | all fresh |
| `node scripts/verify-toolchain-authority.js` | ok, no diagnostics | ok |
| gitleaks over 673 untracked files and the tracked diff | 0 findings; planted-token control detected | 0 findings |

An expected-red pass is not product acceptance. Linux and macOS were not run here.

## Verdict

Acceptable to commit as the current validator. It does what the approved contract asks:
it rejects missing, duplicate, unknown and malformed checks, binds evidence to source
hashes, and no safety check can be listed as a permitted failure. It honoured its
allowlist: no product seam (`bin/install.js`, `bin/lib/`) was touched. It is also about
four times the size of what it replaced, and several parts are heavier than the contract
needs. None of the findings below makes a gate pass falsely.

## Findings

| ID | Severity | Finding | Suggested disposition |
|---|---|---|---|
| V1 | Medium, latent defect | `main()` creates its coverage scratch with `mkdtempSync(<root>/.claude/expect-red-)` and never creates `.claude/`. That directory is gitignored and untracked, so a clean checkout has none. CI only works because the recovery step runs first and its harness creates `.claude/` (`installer-recovery.cjs:17`). Running the coverage gate alone on a clean clone fails with ENOENT and reports "could not capture gate evidence". | Fix: create the parent with `mkdirSync(..., { recursive: true })` before `mkdtempSync`, with a test that runs from a root that has no `.claude/`. Small, validator-only |
| V2 | Medium, unverified platform | The home-preservation rule allows exactly one set of runtime writes, the Windows PowerShell startup-profile paths. What the installer child writes into a private home on Linux and macOS was never observed. The first hosted run will show whether those legs are red. | Read the Linux and macOS legs of the first CI run after a push; record the observed writes before allowing any |
| V3 | Low, duplication | The platform name-identity rule (`identity`) is written three times in the judge, and the relative-name rule twice with different strictness (Windows reserved names are refused in the home check only). The home-owner fixture bytes and the PowerShell path list are written in both the harness and the judge. | One `nameIdentity(platform)` and one `validRelativeName` in the judge. Keep the harness/judge duplication of fixture bytes: the judge recomputing independently is the point |
| V4 | Low, redundancy | Checks are enforced twice: `INSTALLER_RECOVERY_HARNESS` is a subset of `RECOVERY_REQUIRED_PASS` and both are looped; `tapFramingProblems` already pins every case line, then `judgeInstallTransactionCoverage` re-derives and re-checks the same lines. Double enforcement reads as two rules where there is one. | Keep one enforcement site each; dedupe is already hiding the double reports |
| V5 | Low, stale comment and dead branch | `commandFor` says the command "comes from package.json so this wrapper and the package script cannot drift", but it now also compares against a hard-coded copy of the full command, so it can only ever return that copy. The `includes(gate.script)` test cannot be false for the two entries in `KNOWN_REDS`. | State the real rule (the package script must equal the reviewed command) and drop the dead test |
| V6 | Low, magic numbers | The split "first 41 pass, last 10 fail" appears as the literal 41 four times and again in the hard-coded TAP trailer (`# pass 41`, `# fail 10`, `1..51`). | Derive all of them from one constant next to `COVERAGE_CASES` |
| V7 | Low, sloppy pattern | The coverage-ignore detector uses the character class `[cv|]8`, which also matches a pipe followed by 8. It was meant to be c8 or v8. Harmless today. | Write the alternation explicitly |
| V8 | Low, shape | `main()` is about 135 lines doing five jobs: evidence capture, scratch ownership, spawn, judging and cleanup. The `dependencies.packageJson` cross-check exists only for the tests. | Split capture and scratch handling into two named functions when V1 is fixed; no new abstraction |
| V9 | Note, by design | `recoveryObservation` pins the exact current wrong behaviour (for example the top-level name list and `gsd-install-state.json` as the one changed file). Any upstream bump that changes the residue will turn this gate red until the pins are re-reviewed. That is the approved contract, and it means the 1.12.0 endpoint bump must budget for it. | No change; carry into the bump plan |
| V10 | Not reviewed | `tests/expect-red.test.js` grew from 144 to 1,342 lines. Its structure and scratch handling were checked; its cases were not read one by one, and the nine-inline-fixture pattern seen in earlier Codex test work was not ruled out. | Read before the validator is next changed, or when V1 is fixed |

Also observed, not part of the diff: two ignored scratch directories from Codex experiments
remain under the worktree's `.claude/` (`p07-containment-spike-2026-09-20`,
`value-comparison-2026-09-19`). They are untracked and unreferenced by any gate. Owner
decides whether to delete them; nothing was removed.

## Not claimed

No finding here re-opens the sixth-review dispositions or the section 24 recommendation.
The lock seam remains not accepted. No Linux, macOS or hosted CI evidence exists for this
tree yet.
