# Fable Review Packet: Phase 43 Plan 11AF Current Revision

## Role And Decision Requested

Act as the authoritative lead developer, architect, security reviewer, and
project designer for this whole project. Review the current local implementation
of Phase 43 Plan 11AF in the current working tree. The tested product source is
`8d92a576`; its source- and hash-bound local lifecycle receipt is committed at
`e9be7573`. Do not edit files.

Return one closure verdict:

- `ACCEPT`: Plan 11AF is locally closure-ready as scoped.
- `ACCEPT_WITH_FOLLOW_UPS`: Plan 11AF is locally closure-ready, with clearly
  separated follow-up work that does not invalidate its acceptance criteria.
- `REVISE`: one or more Plan 11AF acceptance properties are not proven or the
  implementation creates an unacceptable security, architecture, or product
  risk.

For every finding, provide severity, evidence, why it matters, and the minimum
corrective action. Distinguish a Plan 11AF blocker from work already owned by a
later plan.

## Project Context

This repository is a market-ready overlay over active Open GSD authority. It
must preserve fork identity while remaining upgradeable across upstream
versions. Phase 43 builds executable evidence for that contract. Plan 11AF
repairs a real hosted verifier failure: an authenticated local registry rejected
publication with `ENEEDAUTH`.

The verifier is a worker inside a larger lifecycle. It does not start or stop
Verdaccio. Its report declares that an external disposable registry lifecycle
is required. The hosted workflow and its lifecycle are owned by later Plan
11AH; full root lockfile/dogfood advancement is owned by Plan 11AK. This review
must not silently transfer those later-plan deliverables into 11AF, but it must
reject any boundary that makes 11AF's evidence misleading or unsafe.

## Authoritative Scope

Read these current files:

- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AF-PLAN.md`
- `scripts/verify-upgrade.js`
- `tests/verify-upgrade.test.js`
- `.planning/evidence/phase43-upgrade-verifier-local.json`
- `.planning/evidence/hosted/first-real-run-failure.json`
- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AF-AUTHENTICATION-SPIKE.md`

Review the chronological implementation range:

- `a005b8be test(phase-43): specify authenticated upgrade lifecycle`
- `adf9b4ae fix(phase-43): authenticate upgrade verification`
- `3858de57 fix(phase-43): bind upgrade proof to source pin`
- `b1a374dc fix(phase-43): publish structured upgrade artifacts`
- `af4335c9 test(phase-43): specify upgrade isolation evidence`
- `d46992bc fix(phase-43): isolate upgrade verification evidence`
- `828fb6fc fix(phase-43): preserve current package composition`
- `a6428be8 docs(phase-43): separate registry redirect from auth defect`
- `2e47ef2a fix(phase-43): harden live upgrade packaging`
- `2fda50c0 docs(phase-43): record local upgrade lifecycle`
- `ee5b10ca test(phase-43): specify fail-closed upgrade proof`
- `8d92a576 fix(phase-43): bind upgrade proof to trusted inputs`
- `e9be7573 docs(phase-43): refresh bound upgrade lifecycle`

## Required Truths

Plan 11AF requires all of the following:

1. Upgrade verification uses an ephemeral authenticated local-registry
   identity.
2. Credentials never appear in argv, stdout, stderr, JSON reports, or committed
   configuration.
3. Pack, publish, install, bump, compose, reinstall, and smoke verification are
   real operations, not mocks or pack-only simulation.
4. Credential material is scoped to and deleted with the verifier-owned
   temporary root.
5. Pre-existing user and project npm configuration remains byte-identical
   outside that temporary root.
6. Identity bootstrap rejection or malformed output fails before publication.
7. Every success and failure path attempts bounded cleanup.
8. The smoke gate proves exact fork package/version, exact upstream
   package/version, and overlay-manifest digest rather than accepting exit zero
   alone.
9. Child processes use an allowlisted environment and no command shell.
10. Packed artifacts are regular files contained in the owned artifact root and
    are represented by digest and size in the report.

## Implementation Decisions To Challenge

### Disposable Registry Boundary

The verifier accepts a credential-free loopback HTTP registry URL, creates a
per-run random identity through the bounded HTTP adapter, writes authentication
only to an owned temporary npm config, and destroys the verifier root. It
reports:

```json
{
  "ownership": "external-disposable",
  "disposalRequired": true,
  "verifierOwnsRegistry": false
}
```

The local integration harness owned Verdaccio's process, listener, and storage,
then deleted all three. The harness was deliberately temporary and was removed;
its sanitized receipt is durable. Decide whether the receipt plus production
worker/test evidence is sufficient local proof for 11AF, given that 11AH owns
the reproducible hosted lifecycle.

### Minimum Child Environment

The verifier constructs a strict environment allowlist, supplies owned user and
global npm config paths, rejects project temp roots nested inside the checkout,
sets `shell: false`, and resolves executables explicitly. Tests cover inherited
secret/config exclusion and ambient npm config fingerprint preservation.

### Current Package Versus Bump Workspace

The current-package copy retains the already composed `dist` tree so the
current tarball is real. The bump workspace excludes generated `dist`, npm
configuration, dependencies, links, VCS data, and `bun.lock`, then regenerates
composition for the target upstream.

### Targeted Upstream Materialization

The bump step temporarily stages a minimal private manifest containing only the
exact target `@opengsd/gsd-core` dependency, runs:

```text
bun install --ignore-scripts --no-save --omit=optional
```

and restores the complete bumped package manifest in `finally` before compose
and pack. The minimal manifest also pins the exact installed Ajv version needed
by composition; it does not expose source `node_modules` through `NODE_PATH`.
Before compose, the verifier requires target package metadata to be a regular
file, canonicalizes it inside the workspace `node_modules`, and verifies exact
package name and target version. Plan 11AK owns the full repository
lockfile/root dependency bump.

Challenge whether this arrangement genuinely proves the target-upstream
composition or accidentally couples the proof to source-checkout dependencies
in a way that invalidates 11AF.

### npm 11.6.4 Prepare Compatibility

The local npm 11.6.4 installation executed the static package `prepare` script
during `npm pack` despite both `--ignore-scripts` and ignore-scripts environment
configuration. A minimal isolated probe reproduced it. The verifier requires
the package script to be exactly `prepare: husky`, creates an owned compatibility
directory containing only no-op `husky` and `husky.cmd` shims, and prepends only
that directory to the pack subprocess `PATH`. Node, npm, and Bun are resolved
once from the baseline isolated environment, must resolve to absolute paths
outside the project checkout, and are reused independently of step-level
environment changes. Direct verifier spawns remain `shell: false`; npm's static
lifecycle script remains a transitive npm-owned shell boundary and is not
claimed otherwise.

Challenge whether this compatibility handling is appropriately bounded and
whether it creates command-injection, path-precedence, or proof-integrity risk.

## Evidence At Current Revision

Local evidence was refreshed after the final product code change:

- Focused verifier tests: 54 passed, 0 failed.
- Focused coverage: statements 99.42%, branches 95.10%, functions 100%, lines
  99.42%.
- Full suite: 1,552 passed across 58 files, 0 failed, 4,378 assertions.
- `bun run dist`: passed; composed 740 files, applied 124 branding rules,
  rebuilt bundled hooks, generated SBOM, finalized distribution.
- Targeted ESLint for changed files: 0 errors and 0 warnings.
- Full ESLint: 0 errors; 220 pre-existing security-plugin warnings across the
  repository baseline.
- Documentation lint: 0 errors across both configured sets.
- Dependency policy: 7 findings, 0 blocking, 0 suppressed.
- Gitleaks over `2fda50c0..e9be7573`: 3 commits scanned, no leaks found.
- `git diff --check`: passed.
- Local pinned Verdaccio 6.8.0 lifecycle: all nine real steps passed; anonymous
  publication was rejected; exact artifact/report hashes were recorded; ambient
  npm configs remained unchanged; credentials were absent from observable
  evidence; verifier roots, registry process, listener, and registry storage
  were all gone after the run. The receipt binds source revision `8d92a576`,
  verifier SHA-256, test SHA-256, report SHA-256, and expected/observed/verified
  smoke provenance.

The local receipt is
`.planning/evidence/phase43-upgrade-verifier-local.json`. Treat hashes and
booleans as evidence only after checking that the implementation and tests make
them meaningful.

## Review History And Current Disposition

An independent GPT-5.6-Sol review raised these concerns:

1. Registry lifecycle ownership was unclear. The report now explicitly states
   external-disposable ownership, and the local harness proved process/storage
   disposal.
2. Inherited secrets/config could reach children. The verifier now uses a strict
   environment allowlist and owned npm config paths.
3. `shell: true` created Windows injection risk. All child execution now uses
   `shell: false` with explicit executable resolution.
4. Credential cleanup could prevent root cleanup. Cleanup stages are independent
   and tested under combined failure modes.
5. Exit-zero smoke and unconstrained artifacts were weak. Exact provenance,
   containment, regular-file checks, size, and SHA-256 are now required.
6. Registry/auth evidence was not bound. The structured report and lifecycle
   receipt now carry the relevant non-secret properties and report digest.
7. The plan was not closure-ready then. This packet requests a new judgment on
   the current revision rather than reusing that older review.

A current GPT-5.6-Sol review then returned `REVISE` with five worker-level
blockers. Those findings were converted into failing tests before the product
revision:

1. Target fallback: removed source `NODE_PATH`; exact workspace target
   identity and canonical containment are mandatory before compose.
2. Smoke digest: the composed manifest is digested before publication and the
   installed result must exactly match expected provenance, including digest.
3. Executable trust: outer tools are resolved from the baseline environment,
   cached as absolute non-project paths, and isolated from the narrow prepare
   compatibility `PATH`.
4. Canonical containment: source, requested temp parent, and created run root
   are checked with nearest-existing-ancestor realpath handling and
   platform-appropriate case semantics; alias coverage is included.
5. Artifact identity: every candidate path is canonicalized and checked against
   pre-existing artifacts regardless of JSON, text, or directory discovery;
   exact filename and npm JSON package identity are required.

The current Sol review is preserved separately as an advisory record. Its
`REVISE` verdict is not being rewritten after the fact; this packet requests
Fable's authoritative judgment on the corrective revision and fresh evidence.

## Explicit Non-Claims

- This is local Windows evidence, not hosted Linux or container evidence.
- No push, PR, merge, release, package publication, repository visibility
  mutation, credential change, or branch-protection change is authorized or
  claimed.
- Plan 11AF does not prove the later hosted workflow lifecycle or full dogfood
  lockfile bump.
- A green local gate is not a substitute for the final hosted PR check contract.

## Reviewer Questions

1. Does the implementation prove every Required Truth above, or which exact
   truth remains unproven?
2. Is the worker/external-lifecycle boundary coherent and honestly represented?
3. Does targeted upstream materialization preserve the semantics needed for a
   real target-upgrade test without usurping Plan 11AK?
4. Is the npm prepare workaround safe and sufficiently narrow?
5. Are redaction, environment isolation, filesystem containment, and cleanup
   fail-closed across meaningful failure combinations?
6. Can Plan 11AF be closed locally now, or what minimum revision is required?
7. List later-plan follow-ups separately so they cannot be mistaken for 11AF
   blockers.
