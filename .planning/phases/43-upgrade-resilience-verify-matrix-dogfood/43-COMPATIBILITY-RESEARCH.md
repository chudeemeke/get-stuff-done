# Phase 43 Corrective Compatibility Research

**Researched:** 2026-07-13
**Status:** Ready for corrective planning
**Trigger:** Plan 43-11 failed closed on the blocking Open GSD `1.6.1` row

## Scope

Restore a truthful, blocking N=3 compatibility contract after the Open GSD
authority bump without reintroducing retired legacy internals or weakening
fork-critical behavior.

This corrective slice must finish before `43-11-SUMMARY.md` is created. The
summary remains the GSD completion marker for the original post-bump plan.

## Current Evidence

The repaired harness completed the active-pin row with 159 passing and 87
failing assertions. Per-suite diagnosis shows that the aggregate number mixes
three different classes of evidence:

| Surface | Observed result | Classification | Required action |
|---------|-----------------|----------------|-----------------|
| `commands.test.cjs` | 22/22 pass | Supported contract | Keep in candidate matrix |
| `config.test.cjs` | 15/40 pass | Stale legacy assumptions | Adopt no-success-exit behavior and strict canonical config keys |
| `core.test.cjs` | Cannot import retired `core.cjs` | Retired internal boundary | Replace or classify explicitly; do not recreate the legacy spine |
| `frontmatter.test.cjs` | 74/103 pass | Mostly stale success-exit assumptions; CRLF parsing improved upstream | Modernize observable expectations |
| `init.test.cjs` | 14/14 pass | Supported contract | Keep in candidate matrix |
| `milestone.test.cjs` | 2/2 pass | Supported contract | Keep in candidate matrix |
| `phase.test.cjs` | Cannot import retired `core.cjs` | Stale module boundary masking deeper results | Import canonical `phase-id.cjs`, then run the full suite |
| `roadmap.test.cjs` | 12/13 pass | Real fork regression | Preserve exact phase targeting, line endings, and surrounding formatting |
| `state.test.cjs` | 13/13 pass | Supported contract | Keep in candidate matrix |
| `template.test.cjs` | 4/34 pass | Stale success-exit assumptions | Modernize observable expectations |
| `verify.test.cjs` | 3/3 pass | Supported contract | Keep in candidate matrix |
| `runtime-overrides.test.cjs` | Excluded because it hardcodes repo `dist/` | Missing fork contract coverage | Parameterize candidate runtime path and include it |
| `sync.test.cjs` | Excluded; source helper still imports legacy layout | Repository-only legacy surface | Classify explicitly with owner and removal/port trigger |

Open GSD `1.6.1` intentionally writes successful command output without
`process.exit(0)` so stdout can drain. Error paths still exit non-zero. Its
config layer intentionally rejects arbitrary keys that are outside the current
schema. Its `core.cjs` re-export spine was intentionally retired; supported
capabilities now live in focused modules such as `io.cjs`, `core-utils.cjs`,
and `phase-id.cjs`.

The roadmap failure is different. `roadmap update-plan-progress` changes the
correct phase and checklist row, but the shared Open GSD markdown writer
normalizes CRLF to LF and inserts markdown spacing. That violates the fork's
established user-document preservation contract and the closed authkey inbox
regression test.

## First-Principles Constraints

1. **Authority:** Open GSD is the active runtime authority. A compatibility
   test may not require retired legacy module layout unless a shipped consumer
   still depends on it.
2. **Product boundary:** The blocking matrix verifies the composed package that
   users install, not an arbitrary collection of old internal unit tests.
3. **Fork identity:** Proven fork guarantees remain blocking. Roadmap progress
   updates must target the requested phase and preserve the user's document
   line endings and unrelated formatting.
4. **Auditability:** Every discovered compatibility suite is classified. The
   runner fails when an unclassified suite appears; exclusions cannot be
   maintained as an unstructured hardcoded set.
5. **Diagnosability:** Matrix reports carry per-suite status, counts, duration,
   classification, and bounded failure evidence. A single aggregate failure
   count is insufficient for a market-ready gate.
6. **Isolation:** Candidate runs use temp roots and injected package paths. They
   do not read repo-root `dist/` accidentally or mutate global installations.
7. **Version policy:** The reviewed stable set remains `1.5.0`, `1.6.0`, and
   `1.6.1`. As of 2026-07-13, `1.6.1` is still latest stable and
   `1.7.0-rc.6` is prerelease-only.
8. **Common product contract:** All three vetted candidates must satisfy one
   shared minimum composed-package behavior contract. Version-specific
   capability metadata may explain an observable equivalent, but it may not
   skip a suite or weaken a fork guarantee. Only the active pin controls the
   command's blocking exit policy; a historical row cannot retain vetted
   status while red.
9. **Coverage truth:** The primary Bun suite remains mandatory, but Bun 1.3.5
   reports functions and lines only and its LCOV output contains line records
   without function, branch, or statement records. SHIP-08A therefore needs a
   separate canonical fork-authored runner enforcing statements, branches,
   functions, and lines at 95% independently rather than treating Bun's two
   metrics as four. SHIP-08B remains a separate blocking shipped-snapshot
   contract; neither result may be represented as whole-production coverage.

## Corrective Architecture

### 1. Compatibility contract registry

Add a machine-readable registry under `tests/` that classifies each root
`*.test.cjs` suite as one of:

- `candidate`: executes against the composed candidate package.
- `repository`: validates source/build-time behavior outside the candidate
  package matrix and carries a rationale, owner, and review trigger.
- `retired`: documents an obsolete internal contract and carries replacement
  evidence plus a removal trigger.

Discovery and registry validation are separate concerns. The runner discovers
the filesystem, the registry owns policy, and validation fails closed on
missing files, duplicate entries, unknown classifications, or unclassified
suites.

Each candidate entry also classifies its authority boundary as `black-box`,
`upstream-internal-observed`, or `fork-runtime`. A direct `bin/lib/*` import is
never described as a public API: it carries the exact upstream evidence,
rationale, and bump-review trigger that make the dependency deliberate.
`sync.test.cjs` remains a separately executed repository gate owned by the
get-stuff-done maintainers until its source-only legacy helper is ported or
retired.

### 2. Per-suite runner and report

Run candidate suites independently through `node --test`. Keep process launch,
timeout, temp-root staging, and result parsing behind focused helpers so each
can be injected in tests. Aggregate the suite records into the existing result
shape for matrix policy while adding a `suites[]` diagnostic surface.

Pass the candidate package root through an explicit environment variable for
fork runtime suites. `runtime-overrides.test.cjs` must consume that injected
path instead of repo-root `dist/`.

### 3. Open GSD contract modernization

Update compatibility tests to assert observable command behavior:

- successful commands may return without calling `process.exit(0)`;
- error paths remain non-zero;
- config tests use canonical keys and separately prove invalid-key rejection;
- CRLF frontmatter is parsed successfully;
- phase helpers import `phase-id.cjs`, not retired `core.cjs`.

Prefer black-box CLI assertions where practical. Direct module tests may remain
only as explicit `upstream-internal-observed` contracts under the exact pin;
their purpose is to fail visibly during bump review, not to claim upstream API
stability or justify a compatibility facade.

### 4. Narrow roadmap document adapter

Add a fork-private `fork-roadmap-persistence.cjs` adapter at the composed
package boundary and use it only from the roadmap override. The adapter
receives original and updated content, preserves the original EOL convention
and exact unrelated spacing, and publishes through an atomic sibling-temp
write with bounded Windows rename retries. A boundary test rejects any second
production importer so this cannot grow into a synthetic Open GSD facade.

Do not override Open GSD's global markdown normalization seam. Other Open GSD
documents may depend on canonical formatting, and changing that shared writer
would create an unnecessarily broad override.

## TDD Sequence

1. Add registry validation tests that fail for an unclassified suite, stale
   registry path, or invalid classification; implement the registry loader.
2. Add one per-suite execution/report test; implement isolated suite runs and
   aggregate compatibility output.
3. Add a candidate-path runtime override test; parameterize and include the
   suite in the candidate contract.
4. Modernize one stale suite family at a time and rerun it against composed
   `1.6.1` before moving to the next family.
5. Preserve the existing failing roadmap fixture as the red test; implement
   the narrow document adapter; prove CRLF and unrelated formatting stay byte
   stable outside intended edits.
6. Run the active pin, then the full N=3 matrix. A passing matrix records
   provisional compatibility resolution; only later strict validation of the
   durable bytes and both SHIP-08 children may unblock the original Plan 43-11.
7. Run the primary Bun suite, then unchanged CommonJS parity under Jest and
   required Node suites with native multi-process `NODE_V8_COVERAGE`; merge via
   c8 and enforce independent 95% thresholds for statements, branches,
   functions, and lines. Fix every red test or metric before closeout evidence
   can pass.
8. Validate Phase 43 evidence mechanically before creating a passed
   verification report; keyword presence is not evidence of green gates.

## Additional Planning Evidence

The 2026-07-13 full Bun coverage research run passed 1,837 tests and failed the
`bun run dist creates dist/bom.json` test at its 90-second subprocess timeout.
Focused diagnosis found the deterministic cause: Bunx supplies uppercase npm
identity environment keys while the SBOM adapter deletes lowercase keys from a
case-sensitive copied object. Bounded Plan 43-11K tests and fixes that
production seam after Plan 43-11D establishes the source/coverage contract; it
does not raise the timeout.

The consumed Open GSD `v1.6.1` research clone at
`%LOCALAPPDATA%\Temp\gsd-open-v1.6.1-research` was removed during planning only
after its resolved path was proven under the OS temp root, its directory was
proven not to be a reparse point, its remote matched `open-gsd/gsd-core`, its
HEAD matched tag `v1.6.1`, and its worktree was clean. Future runner-created
temp trees use an ownership marker and a tested containment-aware cleanup
helper.

## Rejected Approaches

- Recreate `core.cjs` or restore permissive legacy config behavior. This would
  reverse the authority migration and create permanent override burden.
- Delete or silently exclude red suites. This would make UPGRADE-05 evidence
  weaker while appearing green.
- Make the current matrix informational. The active pin is deliberately
  blocking after the dogfood bump.
- Override the global Open GSD markdown writer. The proven requirement is
  roadmap preservation, not a product-wide formatting policy change.

## Planning Recommendation

Add eleven gap-closure plans before rerunning the blocked Plan 43-11:

1. Contract registry and per-suite diagnostics.
2. Open GSD test-contract modernization plus candidate runtime coverage.
3. Narrow roadmap persistence adapter and N=3 proof.
4. Source ownership and Jest/Node/c8 foundation.
5. Bounded SBOM portability and toolchain preflight.
6. Launcher and runtime-support coverage closure.
7. Distribution/build coverage closure.
8. Quality/audit/performance/reliability coverage closure.
9. Upgrade/compatibility tooling coverage closure.
10. Hook and sync coverage closure.
11. Validator-first aggregate evidence, transactional blocker transition, and blocking CI.

Use letter-suffixed plan IDs (`43-11A` through `43-11K`) to preserve the
already-committed Plan 43-11 evidence and blocker history. Wave order is
authoritative because bounded Plan 11K follows Plan 11D before Plan 11E. Move
the original Plan 43-11 and closeout Plan 43-12 to later waves without renaming
them.
