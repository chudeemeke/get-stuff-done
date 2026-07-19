# Fable Adjudication — Plan 11AC and Whole-Project Sequence (2026-07-19)

## Context

Phase 43 requested a read-only, evidence-backed Fable adjudication of the
uncommitted Plan 11AC implementation (hosted evidence + toolchain authority +
narrow coverage seam) and a whole-project lead checkpoint. Evidence was
gathered by three independent read-only passes over (1) the verifier
implementation and manifests, (2) live workflow topology and git state, and
(3) the planning/governance corpus. All packet factual claims that were
checkable against the repository were corroborated; divergences are noted in
section 9. No files were edited, no workflows run, no GitHub mutation, no
credential change.

---

## 1. Verdict

**Proceed-with-corrections.**

The Plan 11AC implementation is architecturally sound, fail-closed by
default, and evidence-grounded. No finding rises to Stop-and-redesign. The
corrections are the D1–D4 semantic closures below (which were correctly
reserved for this adjudication rather than silently chosen), one design
defect I found beyond the packet (blanket dual-runtime rule, folded into D1),
claim-language truthfulness (D3/D4), and a bounded module extraction (D6).
D5 and D7 are accepted/decided; D8 ordering is confirmed with one amendment.

---

## 2. Decisions D1–D8

### D1 — Control step vs runtime step: ADOPT closed exemption, plus replace the blanket dual-runtime rule with a closed per-job runtime declaration

Two rulings:

**D1a (as asked).** Adopt the recommended closed, injected control-step
exemption. A step is a control step iff it matches the hosted contract on all
four dimensions byte-exactly — step name (`Verify execution subject`),
`shell: bash`, env set exactly `{GSD_EXPECTED_SUBJECT: <contract expression>}`,
and `run` bytes equal to the contract `verificationRun` — AND sits at the
contract-mandated position (immediately after the governed checkout). A
matching step anywhere else, or with any deviation, remains a runtime step and
fails closed. The exemption is **injected from the hosted contract at
composition time** (verify-hosted-ci already imports the toolchain parser and
enforces workflow-set equality); it is not a new free-form toolchain-manifest
field, so there is a single source of truth for the step bytes. Reject the
alternative (setup-node/setup-bun in every governed job): it adds mutable
execution surface and false runtime claims to action-only jobs (e.g.
Secret Scan, which today has zero `run` steps) and improves no proof.

**D1b (defect found during adjudication).** The current rule
(`verify-toolchain-authority.js` ~lines 659–678) requires **both** setup-bun
AND setup-node in any job containing any `run` step. Live `ci.yml` has nine
bun-only jobs (lint, test, docs-gates, perf-budget, parity, upstream-compat,
boundary-check, override-check, workflow-lint has neither). Conformance under
the current rule would force setup-node into all of them — exactly the
mutable-surface/misleading-claim defect D1 exists to prevent, one level up.
Replace the blanket rule with a **closed per-job runtime declaration** in the
toolchain manifest: every governed job that contains any non-control `run`
step MUST appear in a `runtimeRequirements` map declaring its exact runtime
set (`bun`, `node`, or `both`); the evaluator enforces the declared set
exactly (missing declared setup → fail; extraneous undeclared runtime setup →
fail; run-step job absent from the map → fail). This preserves "no
executable-name guessing" — the closure moves from a guess-free blanket to a
guess-free declaration. The existing `runtimeSubjectJobs` concept generalizes
into this map rather than duplicating it.

### D2 — Security prelude and checkout closure: Option 1 (exact allowlisted prelude), with per-job checkout-input policy

Choose topology (1): an optional, exactly-specified security prelude, then
checkout, then adjacent verification. Rationale: `harden-runner` is only
effective when it runs before any other step (it monitors subsequent egress,
including the checkout fetch itself); placing checkout first (option 2) would
structurally weaken the three jobs that are currently hardened. The closed
rule:

- Step 0 MAY be exactly one `step-security/harden-runner` step pinned to the
  toolchain-manifest SHA, with inputs drawn from a closed allowlist of keys
  and literal values recorded in the hosted contract (e.g.
  `egress-policy: audit|block`). No other prelude step type is allowed.
- Checkout is then at index 0 (no prelude) or 1 (prelude present); the verify
  step is adjacent after checkout, unchanged.
- **Checkout-input policy is per-job and closed**: default inputs remain
  exactly `ref: ${{ github.event.pull_request.head.sha }}`; the contract
  gains a per-workflow/per-job checkout-input allowlist, whose only current
  entry is `ci.yml` / `Secret Scan` → additionally `fetch-depth: 0`. The
  secret scan's full-history requirement is preserved; `fetch-depth` anywhere
  else fails closed.
- Uniform adoption of harden-runner across all governed jobs is a real
  hardening improvement but is NOT required for 11AC/11AH; it is recorded as
  a Phase 44 hardening candidate (P2) so scope stays bounded.

### D3 — Meaning of executed subject: claim exactly "pre-payload subject, governed step program"

Plan 11AC may claim, and may only claim: **"each governed job started from
the exact event subject (proven pre-payload), executed a byte-pinned governed
step program (workflow-file digests bound to the verified subject), with no
subsequent checkout and a closed injection surface."** That composition —
subject proof + governed workflow bytes + the existing
no-second-checkout rule + D1/D2 closures — is materially stronger than
"momentary HEAD" but is not whole-job worktree immutability, and no product
text may say otherwise. Reject the wrapper/post-payload-receipt path for
Phase 43: later steps legitimately mutate the worktree (builds do), a re-run
of `git rev-parse` at job end proves little beyond what the no-second-checkout
rule already closes, and a wrapper is itself new mutable surface. If a
stronger execution attestation is ever wanted, it is a Phase 44+ item using
GitHub-native artifact attestation at the release-evidence boundary, not a
Phase 43 gate. Minimum evidence for the permitted claim: the current envelope
(run/job/attempt-bound subject evidence) + governed-path digest binding +
D1/D2 closures. All of these except D1/D2 already exist and are tested.

### D4 — Runtime receipts and runner identity: rename now; two-tier receipts owned by 11AH, consumed first in 11AJ

- **Rename `full` → `local-runtime` in 11AC now** (Sol SOL-AC-06 accepted).
  The mode consumes caller-supplied evidence and must say so. A
  `hosted-runtime` mode name is reserved and may only appear when trusted
  hosted receipts are actually consumed.
- **Which jobs need hosted runtime receipts:** exactly the jobs whose product
  claims depend on resolved runtime identity — the 18 Cousin Install matrix
  jobs (OS × Node major × package manager) and the 3 perf-budget platform
  jobs. The closed exemption rule for all other jobs: a governed job needs no
  runtime receipt iff it declares no entry in the D1b `runtimeRequirements`
  map beyond `bun` on a single OS, or has no non-control run steps at all.
  (Test/Upstream Compat OS-matrix jobs get Tier A only.)
- **Tier A (metadata receipts):** the collector already calls the run-attempt
  jobs endpoint; capture `runs-on`/runner `labels` and `runner_name` per
  governed job into the envelope. Cheap, no workflow change. Owner: **11AH**
  (collector + envelope schema extension), consumed in 11AJ.
- **Tier B (in-job emitted receipts):** one governed receipt step per
  runtime-subject job emitting resolved OS+version, arch, runner labels, Node
  patch, Bun version, tool versions (hyperfine), and container digest where
  applicable, bound to jobId/runId/attempt. **11AC defines the receipt schema
  fields** (so 11AH does not invent schema); **11AH owns emission topology and
  wiring; 11AJ is the first consumer.** 11AJ's envelope for the corrected
  hosted cycle must include Tier A for all governed jobs and Tier B for the 21
  runtime subjects.

### D5 — Coverage seam: ACCEPT as implemented, with a frozen include-list AC

Accept the bounded seam inside 11AC: `node:test` lane (pre-existing),
standalone `expect@30.4.1`, `c8@9.1.0` (c8 11 is incompatible with the
deliberate minimatch 3 security override — a discovered constraint, now
recorded), the 10-line portable test API, per-file 95% on all four metrics,
`brace-expansion@1.1.13` override clearing the new-path advisory, full Jest
removed. Measured results (98.76/96.81/98.21/98.76 and 97.04/95.33/100/97.04)
independently clear every metric. Required amendment: the c8 include list may
name **only** the two verifier entry scripts plus any modules mechanically
extracted from them under D6, enumerated in the plan; adding any other
production file to this lane requires an 11D/11W-owned decision. 11D/11W's
canonical coverage-runner decision proceeds unconstrained; this seam is
explicitly non-precedential (already stated in 11AC-03 — keep that sentence).

### D6 — Verifier module boundaries: retain evaluators in place; bounded CLI/adapter extraction as 11AC-04, before the 11AJ envelope binds digests

Neither a full hexagonal split now nor status quo. Ruling:

- **Do not split the domain evaluators/validators now.** D1–D4 corrections
  will rework exactly those regions; splitting first churns the review
  subject twice and buys nothing until semantics stabilize.
- **Do extract the mechanical shells** as a final 11AC task (11AC-04), after
  D1–D4 corrections are green and before the 11AJ hosted cycle (the envelope
  binds governed source digests; the layout must be final first):
  - From `verify-hosted-ci.js`: CLI composition (`parseArgs`, `main`) and
    infrastructure adapters (`createDefaultDependencies`, `runJsonCommand`,
    `runTextCommand`, `writeReceiptAtomic`, `resolveReceiptPath`) into at
    most two modules under `scripts/lib/` (suggested:
    `scripts/lib/hosted-ci-adapters.js`, `scripts/lib/hosted-ci-cli.js`).
  - From `verify-toolchain-authority.js`: CLI composition (`runCli`) only.
  - Pure move, byte-identical behavior; original entry paths re-export moved
    symbols so the 119-test suite and coverage lane run unchanged; c8 include
    list extended per D5's enumeration rule.
- **RED boundary tests required if/when extracted:** (a) re-export stability
  (existing public symbols still importable from the original paths); (b)
  import-graph purity (the entry scripts' evaluator regions require no
  `child_process`; adapters are only reachable through injected dependency
  objects — assert via a static require-graph test).
- The **full 4-layer hexagonal split is deferred to Phase 44** with a
  concrete trigger: before any post-v1.2 feature work touches either
  verifier. Owner: Phase 44 pre-release hardening plan. This satisfies
  no-hidden-debt (named owner + firing trigger).
- If 11AC-04's pure move cannot be proven cheaply (tests or coverage shift),
  abort the extraction, keep single files, and carry the Phase 44 trigger.
  Cosmetic slicing is not the goal; separating audit-critical policy from I/O
  plumbing is.

### D7 — Audit lock authority: Option 1 — single Bun authority, Bun-native adapter, no `package-lock.json`, owned by 11AD

Keep `bun.lock` as the sole dependency-graph authority. Amend Plan 11AD:

1. **11AD-A (unchanged intent):** remove the CycloneDX HIGH by exact-pin
   upgrade to `@cyclonedx/cyclonedx-npm@6.0.0` (spike-proven: byte-identical
   repeat runs, schema-valid 1.6 BOM, no CLI-arg migration).
2. **11AD-B (new):** replace the `audit-ci` delegation in
   `scripts/audit-check.js` with a tested Bun-native adapter over
   `bun audit --json` (Bun 1.3.5 pinned): fail-closed JSON parsing pinned to
   the observed schema; canonical GHSA IDs derived from advisory URLs via a
   strict validator (Bun's `--ignore` is proven ineffective for this
   advisory — the adapter owns suppression itself); the existing
   expiry-bounded `suppressions.json` policy applied verbatim; HIGH/CRITICAL
   blocking semantics preserved; schema drift, network failure, tool absence,
   and URL-less advisories all fail closed.
3. **Delete the `package-lock.json` requirement entirely** (never generate
   it); drop `audit-ci` from the dependency tree if nothing else consumes it.
4. **RED tests (fixture-driven, before implementation):** high/critical
   fixture → nonzero exit; valid unexpired suppression → pass with reported
   suppression; expired suppression → fail; malformed JSON → fail; advisory
   without a parseable GHSA URL → fail; tool missing → fail; the live
   CycloneDX advisory disappears only via the 6.0.0 upgrade, never via
   suppression.
5. **Non-migration criterion:** if the pinned-Bun JSON shape cannot be
   validated fail-closed, stop and re-adjudicate before falling back to a
   dual-lock design. Rejected: option 2 (generated npm lock + parity
   machinery) — permanent dual-authority drift risk in a Bun-first repo for a
   one-time adapter cost; also rejected: warning-only audit, raw ignore, OSV
   substitution (OSV stays an independent signal only).

Hosted job name "Audit CI (blocking HIGH/CRITICAL)" and the contract job set
are unchanged.

### D8 — Upstream 1.7.0: confirmed ordering; ONE combined bump + override-reconciliation plan, inserted after 11AI and before 11AJ

The proposed boundary is correct: do not fold 1.7.0 into 11AC (it would
invalidate the reviewed subject), and do not run the 11AJ hosted cycle
against a stale stable (Phase 43 exists to prove a live bump). Rulings:

- **One plan, not two.** Bump and override re-adjudication are mechanically
  inseparable: the plan-scan override's removal trigger fires "on every pin
  change," and re-adjudicating overrides against the old pin is meaningless.
  Insert a single autonomous, local-only plan (next free ID, e.g. 43-11AK)
  with `depends_on: [43-11AI]`, and make 11AJ depend on it.
- **Scope:** exact pin → `1.7.0` (`package.json`, `bun.lock`,
  `.planning/upstream-authority.json`, `scripts/lib/upstream-source.js`,
  snapshots); rotate N=3 to `1.6.0/1.6.1/1.7.0` with prune-oldest per policy;
  update `COMMON_COMPAT_VERSIONS` and the upgrade-verifier args to the real
  contract (`--from 1.6.1 --to 1.7.0`, coordinated with 11AH's wiring since
  11AH lands first); execute the real upgrade and override-churn contracts;
  re-adjudicate **every** override; retain the plan-scan override on current
  evidence (stable 1.7.0 still classifies embedded `PLAN11AC` refs as plans —
  runtime-probed) with `REASON.md` refreshed to the 1.7.0 snapshot; rerun all
  affected local gates.
- **Also owned by this plan (stale-version defect found during
  adjudication):** `bin/install.js` `getActivePackageVersion` still defaults
  to `'1.5.0'`, and `perf-baseline.json`/test-timing reference upstream
  1.5.0. Pruning 1.5.0 from the vetted set while an install default points at
  it is incoherent — align or explicitly justify both in the bump plan.
  (11AG already demotes `perf-baseline.json` to non-blocking trend data.)
- **RED tests:** N=3 rotation expectation; snapshot hash updates; a
  plan-scan fixture test proving 1.7.0-upstream behavior (PLAN-REVIEW
  excluded upstream; embedded `PLAN11AC` still requires the local override);
  upgrade-contract tests for 1.6.1 → 1.7.0.
- **Upstream proposal for the broader classifier delta:** justified by
  evidence, but it is public mutation — file only after explicit user
  approval, batched into the 11AJ authorization window. Nothing here
  authorizes a filing.

---

## 3. Plan 11AC task and acceptance-criterion amendments

- **11AC-01** (hosted evidence): add ACs — (a) jobs are fetched from the
  run-attempt endpoint and every subject record is attempt-bound
  (implemented; promote to AC); (b) contract supports the D2 prelude
  allowlist and per-job checkout-input allowlist, with fail-closed negatives;
  (c) all product/claim text uses the D3 wording ("pre-payload subject,
  governed step program"); (d) envelope schema defines the D4 Tier A/Tier B
  receipt fields (definition only; emission is 11AH).
- **11AC-02** (toolchain authority): add ACs — (a) the D1a byte-exact
  control-step exemption, injected from the hosted contract, with
  one-byte-deviation and wrong-position negatives; (b) the D1b closed
  `runtimeRequirements` per-job map replacing the blanket dual-runtime rule,
  with undeclared-run-step, missing-setup, and extraneous-setup negatives;
  (c) mode `full` renamed `local-runtime`; `hosted-runtime` reserved.
- **11AC-03** (coverage seam): add AC — the c8 include list names exactly the
  two verifier entry scripts plus D6-extracted modules enumerated in the
  plan; any other inclusion requires an 11D/11W decision. Keep the existing
  "not the 11D/11W migration" sentence.
- **New 11AC-04** (bounded extraction): as specified in D6, executed last,
  before any 11AJ envelope binds governed source digests; abort criteria as
  stated.

## 4. Downstream ownership amendments

- **11AH**: + wire the D2 prelude and per-job checkout inputs into the five
  governed workflows; + conform every job to the D1b runtime map (bun-only
  jobs get setup-bun only); + Tier A runner-label capture in the collector
  and envelope; + Tier B receipt-step emission for the 21 runtime subjects
  per the 11AC schema; existing scope (subject steps, SHA pins,
  `.bun-version` consumption, mutation-workflow split, 266 comments left
  untouched) unchanged.
- **11AJ**: + depends on the new D8 bump plan; + first consumption of Tier
  A/Tier B receipts in the corrected envelope; + user-gated batch now
  explicitly includes: branch-protection context reconciliation (stale
  "Boundary & Override Check" → the two real contexts), the
  `docs/pr-issue-evidence-workflow` governance branch pushed as its **own
  separate PR** (never mixed into the phase43 PR), the optional historical
  bot-comment cleanup decision, and the ask-user question on filing the
  upstream classifier proposal.
- **11D**: consumes the post-11AC-04 file layout; the seam-non-precedent
  language stands; its second exact-head envelope requirement unchanged.
- **11W**: record the discovered constraint — c8 11 is incompatible with the
  deliberate minimatch 3 override; 11W may not silently upgrade c8; resolving
  that tension (if it chooses c8) is an explicit 11W decision with its own
  evidence.

## 5. Required RED tests before implementation continues

1. D1a exemption: action-only job + byte-exact control step passes without
   runtime setups; any single-dimension deviation (name/shell/env/bytes) or
   wrong position → runtime-classification failure.
2. D1b map: run-step job absent from `runtimeRequirements` → fail; declared
   `bun` job missing setup-bun → fail; declared `bun` job containing
   setup-node → fail (exact-set semantics).
3. D2: pinned harden-runner at step 0 + checkout + adjacent verify → pass;
   unpinned/duplicated/other-action prelude, or prelude after checkout →
   fail; `fetch-depth: 0` accepted only for the Secret Scan allowlist entry;
   anywhere else → fail.
4. D4: `--mode full` rejected with actionable error; `local-runtime`
   accepted; receipt-schema field validation negatives (missing/unsafe
   receipt identifiers fail closed).
5. D6 (only if extraction runs): re-export stability + require-graph purity.
6. D7 fixture suite (owned by 11AD, listed in D7.4).
7. D8 suite (owned by the bump plan, listed in D8).

## 6. Additional defects (not covered by D1–D8)

- **D1b blanket dual-runtime rule** — resolved above; called out as the one
  substantive design defect the packet did not surface.
- **`bin/install.js` default `'1.5.0'` + perf-baseline 1.5.0 references** —
  stale after N=3 prune; assigned to the D8 bump plan.
- **Branch protection** requires a context no job emits (also mirrored in
  `scripts/setup-branch-protection.json`); already 11AJ-owned, but the
  repo-tracked JSON must be corrected in the same change so the tracked
  intent and live setting cannot drift apart again.
- `governedPaths.source` also governs `tests/test-config-hygiene.test.js`,
  which the packet's review-subject list omits — harmless, but the packet's
  subject list and the contract's governed set should be reconciled in the
  11AC summary for audit cleanliness.
- No other security, product-claim, extensibility, or maintenance defect
  found beyond those dispositioned above; Sol's SOL-AC-01/02/04/05 closures
  were verified as actually implemented in the current diff (attempt-bound
  jobs endpoint, `BASH_ENV`/loader/`NODE_OPTIONS`/`PATH`/`GIT_*` blocklist,
  version-file-only setup-bun, workflow-set equality).

## 7. Whole-project lead decision

**The sequence is confirmed as minimum-coherent with two amendments already
folded in above** (insert the D8 bump plan between 11AI and 11AJ; receipts
split 11AC-schema/11AH-emission/11AJ-consumption). Specifically:

- **Phase 43 → 44 sequence:** 11AC (corrected) → 11AD–11AI local corrective
  wave → 11AK bump/override reconciliation → 11AJ human-gated push + hosted
  cycle + formal Fable window → 11D → 11W → Phase 44. No deliverable needs to
  be stopped, combined, or further split. The formal standing Fable
  checkpoint after a passed hosted envelope remains required; this
  adjudication does not substitute for it.
- **Governance branch:** correctly decoupled from Phase 43's critical path.
  Keep local; push as a separate PR inside the 11AJ authorization batch. It
  does not gate any Phase 43 plan.
- **Missing hosted gates** (95%-per-metric coverage enforcement job,
  no-publish release-plan job, recorded by the governance contract): owned by
  **Phase 44 release readiness**, consuming 11D/11W's runner. Naming Phase 44
  as owner here removes the hidden-debt risk. Fuzzing's "not applicable"
  classification is accepted — the project currently owns no
  untrusted-input/binary/protocol boundary; revisit only if one appears.
- **Public-artifact policy:** forward-hygiene contract in 11AH plus
  user-gated repository-setting reconciliation in 11AJ is correct. The
  historical personal paths and bounded diagnostics in published history are
  not credentials; no history rewrite is claimed or advised.
- **Useful but unnecessarily elaborate (trim/decline):** (a) the blanket
  dual-runtime setup requirement (replaced by D1b); (b) any whole-job
  immutability wrapper ambition (declined in D3); (c) dual-lock parity
  machinery (declined in D7); (d) a full 4-layer hexagonal verifier split now
  (bounded to D6's extraction, remainder Phase 44); (e) uniform harden-runner
  adoption inside Phase 43 (deferred to Phase 44 as a candidate).

## 8. Prioritized action list

**P0 — before Plan 11AC can be marked done (owner: 11AC, gate: focused
authority suite + Node coverage lane green):**
1. D1a control-step exemption + D1b `runtimeRequirements` map (with RED
   tests 5.1–5.2).
2. D2 prelude + per-job checkout-input allowlist (RED tests 5.3).
3. D3 claim-language sweep + D4 `local-runtime` rename + receipt schema
   definition (RED tests 5.4).
4. Record the 11AC AC amendments (section 3) in the plan file.

**P1 — corrective wave, before 11AJ (gates: each plan's local suite; 11AK
gates additionally on override re-adjudication evidence):**
5. 11AC-04 bounded extraction (owner: 11AC; gate: pure-move proof, tests 5.5).
6. 11AD CycloneDX 6.0.0 + Bun-native audit adapter, no npm lock (owner:
   11AD; gate: fixture suite 5.6 + live advisory removed by upgrade).
7. 11AE Windows ACL bootstrap fix via `$PSHOME` manifest import (owner: 11AE;
   gate: 1,459/1,459 broad suite).
8. 11AF Verdaccio ephemeral auth + npm-config byte-invariance evidence
   (owner: 11AF; gate: ENEEDAUTH path closed locally).
9. 11AG paired same-run perf with unchanged 1.10/1.25 budgets (owner: 11AG).
10. 11AH live wiring incl. D2 topology, D1b conformance, Tier A/B receipts,
    mutation-workflow split (owner: 11AH; gate: static toolchain check
    reports zero drift against live workflows).
11. 11AK upstream 1.7.0 bump + override reconciliation + stale-version
    alignment (owner: new plan per D8; gate: all affected local gates green).

**P2 — user-gated or deferred with named owner/trigger:**
12. 11AJ authorization batch: push, hosted cycle, receipts consumption,
    branch-protection fix (+ tracked JSON), governance-branch PR, optional
    bot-comment cleanup, upstream-proposal question (owner: 11AJ; gate:
    explicit user approval per item).
13. Phase 44: coverage-gate + release-plan hosted jobs (consuming 11D/11W),
    full hexagonal verifier split (trigger: first post-v1.2 verifier-touching
    feature), uniform harden-runner adoption candidate.

## 9. Confidence classification

**Repository-fact, high confidence (independently verified this session):**
verifier rules and line/export counts; contract/manifest contents and the
byte-exact verify-step spec; run-attempt binding; env blocklist contents;
workflow-set equality enforcement; named tests for every closure claimed
corrected; live workflow topology (harden-runner ordering, secret-scan
`fetch-depth: 0`, bun-only jobs, absence of any verify-subject step in live
workflows); pins (`1.6.1`, c8 `9.1.0`, expect `30.4.1`, overrides,
`.bun-version` 1.3.5); git state (HEAD = 94021639, origin 3 behind,
governance branch 5 ahead); plan-scan override semantics and REASON content;
plan ownership text for 11AC/11AD–11AH/11AJ/11D/11W; stale 1.5.0 references.

**Context-dependent judgment, medium confidence:** all D1–D8 rulings and the
sequencing assessment (they are decisions, not facts); the claim that live
GitHub branch protection currently requires the stale context (packet +
resume doc + tracked JSON agree, but the live API state was not re-queried
here); test-pass and coverage numbers (corroborated by reading the suites and
scripts, not re-executed — plan mode is read-only); Bun 1.3.5 `bun audit
--json` schema stability and the `--ignore` ineffectiveness (single bounded
probe, D7.5 guards this); 1.7.0 runtime-probe classifier behavior (recorded
evidence, not re-executed).

## Verification (post-approval execution of corrections)

For each P0/P1 item: write the RED tests in section 5 first, watch them fail,
implement, then gate on: `bun run test -- tests/toolchain-authority.test.js
tests/verify-hosted-ci.test.js tests/test-config-hygiene.test.js` green;
`bun run test:coverage:phase43-verifiers` ≥95% per file per metric;
`node --check` on both scripts; ESLint zero errors; broad suite red only on
the known 11AE item until item 7 lands. No push, hosted run, GitHub
mutation, credential change, or gate weakening at any point before 11AJ's
explicit user authorizations.
