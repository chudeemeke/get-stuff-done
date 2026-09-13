# Phase 43 — Independent Interim Architecture & Delivery Review

## Context

This is an independent reviewer deliverable, not an implementation request. I was
asked to validate the `43-INTERIM-DUAL-REVIEW-PACKET-2026-07-14.md` packet against
repository evidence and return a decision-quality recommendation in the packet's
seven required sections. I did **not** read other reviewers' outputs (no
`*FABLE*`, `*OPUS*`, `*GPT*`, `*REVIEW*` files were opened). All claims below are
either **Fact** (verified against a repo file, path cited) or **Inference**
(reasoned judgment, labelled). No files were edited and no state-changing actions
were taken; this document is the only artifact produced.

Validation was performed read-only against the worktree at local head
`f2d50b29`, PR head `2c9ba08`. Every failure family and the collector/graph
contract in the packet was reproduced from source. Three packet overstatements
were found and are corrected in section 7.

---

## 1. VERDICT

**PROCEED-WITH-CORRECTIONS.**

Not `stop-and-redesign`: the phase architecture is sound and behaved correctly.
The exact-head contract (`config/phase43-hosted-ci-contract.json`), the
fail-closed collector (`scripts/verify-hosted-ci.js`), and downstream ownership
(11N→11R→11D→11W…) all worked as designed. The failed run produced **no** passed
envelope; `11R` is honestly `status: blocked` with a recorded
`<execution_blocker>`. GSD state is currently truthful — nothing was forged.

Not `proceed`: preconditions genuinely failed, and six independent concerns need
bounded corrective work with real ownership before the passed-envelope gate and
Plan 11D can run.

The correct move is a **small corrective wave inserted between 11R and 11D**,
using the graph machinery that already exists, then **one** human-authorized
hosted cycle, then the standing Fable review off a *real* passed envelope.

---

## 2. CRITICAL FINDINGS (ordered by severity)

**F-1 (blocker, correct-by-design): Next hosted run will repeat the unauthorized
public mutation unless CI is fixed first.** `.github/workflows/ci.yml` job
`osv-scanner` holds `issues: write` (lines 87–89) and auto-comments
`Observed again in <run-url>` (lines 123–189, `createComment` at line 178). This
already posted to issues #5–#11. **Correction to packet:** these come from the
**medium/low** OSV upsert path, not the HIGH blocker (which is the separate
`--fail-on high,critical` step). Consequence: re-running CI without gating this
step is a *second* unauthorized public mutation. This makes the governance fix a
**precondition of the re-run**, not cleanup.

**F-2 (blocker, real): HIGH advisory on a direct dev dependency.**
`package.json:60` pins `@cyclonedx/cyclonedx-npm@4.2.1` (a direct
**devDependency**, fed to `audit-ci` and OSV). Fix is major `6.0.0`. Because it
drives SBOM generation (`dist/bom.json`, owned by Plan 43-09), the bump needs
SBOM-output regression proof, not audit suppression.

**F-3 (blocker, upgrade realism): Verifier cannot publish.**
`scripts/verify-upgrade.js:205` writes a temp `.npmrc` containing only
`registry=<url>\n` — no auth token. Verdaccio 6 (`upgrade-verifier.yml:28–32`)
requires auth, so `npm publish` fails `ENEEDAUTH` (`publish-current`, lines
430–435). Real pack/publish/install/upgrade coverage must be preserved with an
ephemeral least-privilege registry identity.

**F-4 (blocker, stale authority): Performance baseline is invalid, waivers
expired, and the comparator is mean-only.** `perf-baseline.json:6` was captured
against upstream `1.5.0`; the repo now ships `1.6.1`
(`package.json:61 @opengsd/gsd-core`, `.planning/upstream-authority.json`). All
three `acceptedRegressions` carry `expiresOn: 2026-07-10`
(`perf-baseline.json:69,79,89`) and are now expired
(`scripts/check-perf.js:127`). `scripts/check-perf.js:180` compares `mean_ms`
only against fixed `failRatio=1.25`; the schema-required `stddev_ms`/`samples`
(`config/perf-baseline.schema.json:46–55`) are never read. Prior Fable direction
(F8, quoted in packet) forbids another calendar waiver. This is a **design
decision** (empirical rebaseline vs variance-aware policy), not an autonomous
edit.

**F-5 (test-oracle defects — must NOT be "fixed" by weakening product):** The
product canonicalizes paths correctly for a symlink-escape defense
(`scripts/verify-hosted-ci.js:72–111`, `realpathSync.native`). The failures are
in test oracles that fail to canonicalize their *expected* values:
- `tests/verify-hosted-ci.test.js:651–686` expects an `os.tmpdir()`-based path;
  actual is realpath'd → macOS `/var` vs `/private/var`, Windows 8.3-vs-long.
- `tests/fork-roadmap-persistence.test.js:327–354` asserts an all-backslash
  PowerShell path; `path.join` on a POSIX runner yields mixed separators. A
  fork-owned helper already exists and is unused: `src/platform/paths.js`
  (`toForwardSlash`, `gsdPaths.normalize`).
Weakening `resolveReceiptPath` to satisfy the oracle would delete a security
control (invariant 7). Fix the oracles.

**F-6 (runner-setup defect): `Get-Acl` not autoloaded.**
`tests/fork-roadmap-persistence.test.js` DACL harness (lines 91–111) calls
`Get-Acl` with no `Import-Module Microsoft.PowerShell.Security`. Hosted image did
not autoload it. Test-harness fix, not product.

**F-7 (ungoverned toolchain input): `bun-version: latest` everywhere.** No
`.tool-versions`, no `packageManager`, no bun engine (`package.json:44–46` only
`node>=20`). Every workflow uses `latest` (ci.yml + 6 others), so hosted Bun
(1.3.14) drifts from local (1.3.5, only referenced in a `bunfig.toml:4` comment).
This defeats "local authority rejects known defects before a hosted run"
(invariant 8) — local and hosted are not the same interpreter.

**F-8 (docs availability): Fail-hard on transient third-party 5xx.**
`ci.yml:77–81` runs lychee with `fail: true`; `lychee.toml:18–23` does not accept
500 and has no exclude for `api.star-history.com` (three badges,
`README.md:751–753`). A third-party outage hard-fails CI. Needs a deterministic
policy, not silent exclusion.

**F-9 (sequencing honesty): the graph is fine; only 11R's success-path tasks are
mis-timed.** `43-11R-PLAN.md` bundles a human external-state gate (cleared), a
first hosted collection (executed, failed-closed, tracked), a *passed-envelope*
step, and a Fable review dispositioned *from that envelope*. The last two were
never satisfiable in cycle 1 and must migrate past the corrective wave.

---

## 3. CORRECTED GSD GRAPH

Derived from the invariants, **reusing existing machinery** (11N collector, 11P
reusable checkpoint authority, 11D-00 recertification, 11Q fresh-hosted+Fable
gate). This is a refinement of Shape A; Shapes B and C are rejected in section 6.

**Where Plan 11R truthfully ends.** 11R closes as a *first-cycle failure-
observation + human-gate* record only: human billing/push gate satisfied, one
hosted cycle executed and correctly failed closed, evidence tracked at
`.planning/evidence/hosted/first-real-run-failure.json`. Its *passed-envelope*
task (11R-02 success path) and its *Fable-disposition* task (11R-03) **migrate
forward** to a post-correction gate plan so 11R's record stays immutable and
honest. 11R does **not** get re-opened and re-run in place.

**Insert a corrective wave `18.x` between 11R (W18) and 11D (W19)** — six
separately-owned decimal plans, each RED-GREEN, bounded write scope, locally
verifiable. Ordering encodes real dependencies:

| New plan | Owns | Local gate | Must precede |
|---|---|---|---|
| **43-11R.1 Toolchain governance** (extends 11K preflight) | Pin bun (`packageManager` + workflow `bun-version` + `.tool-versions`); local==hosted interpreter | `bun --version` deterministic; workflow lint | everything (makes local authority meaningful) |
| **43-11R.2 CI issue-mutation governance** | Drop `issues: write` from diagnostic `osv-scanner`; move upsert to a separately-authorized/human-gated workflow; read-only default | workflow lint + dry-run | the re-run (F-1) |
| **43-11R.3 Security dependency** (spirit of 43-09) | Bump cyclonedx 4.2.1→6.0.0; prove `dist/bom.json` still generates; re-run audit/OSV locally | `bun run audit:ci` clean + SBOM regression test | the re-run |
| **43-11R.4 Cross-platform oracles** | Fix the two test oracles via `src/platform/paths.js`; **no product weakening** | `bun test` on affected suites (local logic) | recert; runner proof deferred to hosted |
| **43-11R.5 Verifier auth realism** (spirit of 43-01) | Ephemeral least-privilege Verdaccio identity; keep pack→publish→install→upgrade; no secret leak | `bun run verify-upgrade` local against Verdaccio | the re-run |
| **43-11R.6 Docs link policy** | Deterministic retry/backoff + tolerate known-transient third-party 5xx (or move badges to scheduled non-blocking check); no silent exclude | lychee config test | the re-run |
| **43-11R.7 Performance policy** (GATED DECISION) | Implement the *chosen* policy: empirical 1.6.1 rebaseline w/ reproducible provenance+samples, OR variance-aware `check-perf.js` using existing `stddev_ms`/`samples` | `bun run` perf check green under chosen policy | the re-run; **decision itself is user/Fable-owned** |

**Then, in order:**
1. **Local authority restore** — full deterministic local suite green with pinned
   toolchain across 11R.1–11R.6; 11R.7 policy chosen + implemented.
2. **External gate (one hosted cycle)** — new exact head; reuse the 11N collector
   and exact-head contract; **human-authorized** (11R-01-style). This is the
   migrated 11R-02 success responsibility. Issue-governance (11R.2) must already
   be merged so no comments are re-posted.
3. **Passed envelope** — collector writes the envelope only on a genuine pass
   (fail-closed unchanged). No pass ⇒ back to corrective wave; never a forged
   envelope.
4. **Fable gate** — standing whole-project review (migrated 11R-03)
   dispositioned *from the passed envelope*, via the 11P reusable checkpoint
   authority. Run for real now that Claude Max login is valid (2026-07-18
   amendment); it still cannot run until a green envelope exists.
5. **11D-00 recertification** — second exact-head envelope
   (`plan11d-entry.json`) at the finalized head → first source edit under 11D →
   downstream waves (11W coverage foundation, etc.) proceed unchanged.

No new gate infrastructure is invented; the corrective wave + task migration is
the minimum coherent change.

---

## 4. REMEDIATION DIRECTION

- **Security dependency (F-2):** major-bump cyclonedx to 6.0.0; regression-test
  `dist/bom.json` shape/validity; re-run `audit:ci` + OSV locally to confirm
  `GHSA-v75r-vx73-82pj` cleared. No `--fail-on` downgrade, no allowlist.
- **Platform/path behavior (F-5, F-6):** canonicalize *expected* values in the
  two oracles (realpath for receipt test; host-aware/`src/platform/paths.js`
  normalization for the PowerShell-path fixture); add
  `Import-Module Microsoft.PowerShell.Security` to the DACL harness. Do not touch
  `resolveReceiptPath` canonicalization or the product path builder.
- **Deterministic toolchain (F-7):** pin bun via `packageManager` +
  `.tool-versions` + explicit `bun-version` in every workflow; this is the
  precondition that makes local pre-flight authoritative and shrinks path/bun
  drift.
- **Performance policy (F-4):** no calendar waiver. Prefer **variance-aware**
  comparison (the baseline already stores `stddev_ms`/`samples`; comparator
  ignores them) so hosted-runner noise stops laundering as regression; if
  rebaselining instead, capture against 1.6.1 with recorded workload, sample
  count, method, and variance so the authority is reproducible. **Decision is
  user/Fable-owned** (section 5).
- **Verdaccio auth (F-3):** provision an ephemeral scoped token (e.g.
  `npm adduser`/`_authToken` into the temp `.npmrc`) for the local registry only,
  torn down with the temp root; keep genuine pack→publish→install→upgrade;
  metadata-only logging (no token to stdout).
- **Docs link policy (F-8):** deterministic transient-tolerance (retry/backoff,
  accept known third-party 5xx for badge endpoints) OR relocate badge checks to a
  scheduled non-blocking job OR replace the badge; never a silent exclude that
  hides real rot.
- **Issue-mutation governance (F-1):** diagnostic CI read-only by default (remove
  `issues: write` from `osv-scanner`); route any public issue upsert through a
  separate, explicitly-authorized (human-gated or `workflow_dispatch`) workflow.
  Leave already-posted comments #5–#11 as-is (editing them is another public
  mutation); note them in disposition.

---

## 5. USER CONSULTATION BOUNDARY

**Autonomous (local corrective plans only):** F-5/F-6 oracle fixes; F-7 toolchain
pins; F-3 Verdaccio ephemeral auth; F-8 lychee determinism; F-1 making the OSV
job read-only (reducing scope is always safe); F-2 drafting+locally testing the
cyclonedx bump.

**Requires prior approval:**
- **Any hosted re-run** — public, consequential, and (until F-1 lands) re-posts
  issue comments. Already gated by the 11R-01 human checkpoint. Keep it gated.
- **Performance policy choice (F-4)** — rebaseline vs variance-aware is a
  product-authority design decision with an evidence gap (no hosted variance
  sample exists yet). Route to Fable adjudication and/or user decision; do not
  pick autonomously.
- **Re-enabling any public issue mutation** — only under explicit, separately
  authorized workflow.

**Notify after action:** the seven comments already posted to #5–#11 (leave
intact); any oracle fix whose *runner-specific* behavior (macOS/Windows path
semantics) can only be fully confirmed by the one hosted cycle — flag as
carried-forward evidence, not as locally proven.

---

## 6. REJECTED ALTERNATIVES

- **Shape B (expand 11R to own corrections):** violates bounded-scope and
  single-ownership invariants; forces retrospective preconditions onto an
  immutable failure record. Reject.
- **Shape C (pull downstream plans forward to absorb fixes):** contaminates the
  authored intent of 11D/11V/11W and creates a circular evidence dependency
  (11D consumes 11R's passed envelope; making 11D own the corrections that
  produce that envelope is a cycle). Reject.
- **Audit suppression / lower `--fail-on` for cyclonedx:** the packet explicitly
  forbids it; hides a real HIGH advisory. Reject.
- **Another calendar waiver for perf:** forbidden by Fable F8. Reject.
- **Weaken `resolveReceiptPath` canonicalization to match the oracle:** deletes a
  symlink-escape defense to satisfy a test. Reject.
- **Silently exclude `api.star-history.com` from link checks:** masks real link
  rot. Reject in favor of deterministic transient-tolerance.
- **Forge a Fable receipt / claim the checkpoint passed while no green envelope
  exists:** invariant 9. Reject — the 2026-07-18 amendment restores login but
  cannot manufacture the required passed envelope.

---

## 7. CONFIDENCE AND OPEN EVIDENCE

**High-confidence repository facts (verified, paths cited above):** all six
failure families; fail-closed collector correctness and the missing
`post-11n.json`; 11R honestly `blocked`; exact-head contract + 11N/11P/11D-00/11Q
graph ownership; mean-only comparator with expired waivers; registry-only
`.npmrc`; `bun-version: latest` across all workflows; OSV `issues: write` +
auto-comment; cyclonedx@4.2.1 direct devDep.

**Corrections to the packet (Fact):**
1. The "Observed again in <run-url>" comments come from the **medium/low** OSV
   upsert step, not the HIGH blocker (separate gate).
2. cyclonedx@4.2.1 is a direct **devDependency**, not runtime — relevant because
   its blast radius is the SBOM/dist pipeline (Plan 43-09).
3. The invariant phrasing "already-reviewed downstream ownership" **overstates**:
   no plan is literally "already reviewed"; the Fable checkpoints 11S/11X/11Y are
   **future** gates. Plans are authored/owned, not yet reviewed. (Inference from
   the absence of the phrase + the roadmap wave positions.)

**Open evidence — needs a spike, hosted run, or user/Fable decision:**
- Whether cyclonedx **6.0.0** produces a still-valid `dist/bom.json` — needs a
  local spike against the 43-09 pipeline (Inference: likely breaking output
  changes across a major).
- Whether the F-5/F-6 oracle fixes fully pass on **macOS/Windows runners** — only
  the one hosted cycle can confirm; local Windows/WSL cannot reproduce all runner
  path semantics (Inference).
- Whether `api.star-history.com` 500 is transient or persistent — needs re-check;
  drives repair-vs-tolerate.
- The **perf policy** (rebaseline vs variance-aware) — no hosted variance sample
  exists; user/Fable decision required before implementing 43-11R.7.
- Exact hosted Bun build (1.3.14) is not encoded in any governed file — only the
  `latest` policy that causes drift is verifiable.

**Reviewer's own caveat:** recommendations here are advisory planning evidence.
They become GSD work only as the corrective-wave plans above with RED-GREEN tests
and local gates; the passed envelope and the standing Fable checkpoint remain the
only authorities that can certify the phase — neither is manufacturable by this
review.
