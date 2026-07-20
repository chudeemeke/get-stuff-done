# Plan 11AH Corrected Implementation Review

## Reviewer Identity

- Model: `gpt-5.6-sol`
- Reasoning effort: `xhigh`
- Codex CLI: `0.144.6`
- Session: `019f7e79-3877-70d0-ab7e-f23936f67701`
- Review mode: read-only local inspection
- Product revision: `2d592060a25e6dd77aa7193ff59159f289d670be`
- Later-plan disposition: `1ee33cbb2fc2f94a08d78eaa406b28343ac26533`

## Verdict

`REJECT`

The five blockers from the first Sol review were substantially corrected, but
three additional authority gaps remained.

## Closure Blockers

1. The join validated `event.canonicalRepository` syntactically but did not
   bind it to `hostedContract.repository`. A valid different repository could
   therefore be supplied consistently across the event and manifests and still
   receive blocking authority.
2. Four pinned actions outside the two-entry automatic-token allowlist had
   metadata defaults that supplied `github.token`: `actions/setup-node`,
   `oven-sh/setup-bun`, `step-security/harden-runner`, and
   `lycheeverse/lychee-action`. The static verifier inspected caller workflow
   YAML but not those defaults.
3. The pinned OSV action revision transitively invoked
   `ghcr.io/google/osv-scanner-action:v2.3.8`. The caller-level action pin was
   immutable, but the effective container identity was not.

## Claim Correction

The review packet said that the legacy latest-attempt collector was removed.
That was inaccurate. Its selection and network helper functions remained in
`verify-hosted-ci.js` and remained exported; only the public envelope-producing
handler failed closed before I/O. This was classified as claim and
maintainability debt rather than an additional closure blocker.

## Prior Finding Disposition

- Raw paired evidence at the pure join: closed.
- Active latest-attempt collection path: closed by the pre-I/O activation gate.
- Workflow/job token scope checks: closed, while action-default token exposure
  remained open.
- Fork pull-request cache publication: closed for current dependency caches.
- Windows synthetic merge SHA: closed.

## Reviewer Verification

- Authoritative binding-review SHA-256 matched
  `31bfb86617ad7a1140db07060a9600269f5c2a83a5b84c57509c19c600821522`.
- Focused tests: 209 passed, zero failed, 1,445 assertions across eight files.
- Static authority returned `ok: true`, demonstrating the false-green metadata
  gaps above.
- Repository compatibility, workflow lint, documentation lint, and
  `git diff --check` passed.
- The inactive collector probe failed before creating an output file.
- No hosted workflow, real Hyperfine run, edit, or public mutation occurred.

## Lead Reproduction And Disposition

The findings were independently reproduced before acceptance:

- Local join code binds base/head/manifests to the caller-supplied canonical
  value but does not compare that value with the contract repository.
- The exact pinned upstream action metadata contains the four reported token
  defaults.
- The exact pinned OSV action metadata names the mutable `v2.3.8` image. Registry
  inspection resolved that tag to the current Linux AMD64 manifest digest
  `sha256:48406c58197201fe55e56615ad9d414f85063da320e204d0b0ed460fb3908dba`;
  the workflow does not bind that digest.
- `compareRunRecency`, `selectLatestRuns`, and `collectHostedData` remain in the
  disabled collector module, confirming the packet wording is false.

Plan 11AH remains open. The three blockers require test-first correction, the
packet claim must be narrowed, and a fresh independent review is required
before Fable receives the implementation packet.
