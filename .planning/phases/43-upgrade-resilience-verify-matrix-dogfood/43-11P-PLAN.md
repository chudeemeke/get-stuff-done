---
phase: 43
plan: "11P"
type: execute
gap_closure: true
wave: 16
depends_on: ["43-11M"]
status: pending
requirements: []
files_modified:
  - config/schemas/fable-checkpoint-input.schema.json
  - config/schemas/fable-checkpoint-receipt.schema.json
  - scripts/run-fable-checkpoint.js
  - scripts/verify-fable-checkpoint.js
  - tests/verify-fable-checkpoint.test.js
  - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11P-SUMMARY.md
autonomous: true
must_haves:
  truths:
    - "every standing Fable checkpoint uses one fail-closed record contract"
    - "every review is bound to a checkpoint-specific input manifest and subject commit"
    - "the exact Fable subprocess execution is captured without a shell"
    - "a fresh nonce prevents a prior review body from satisfying a later checkpoint"
    - "the recorded review digest is recomputed from the returned review body"
    - "every checkpoint records Fable's explicit lead decision and implementation direction"
    - "hosted CI envelopes are bound only as tracked evidence from the committed subject tree"
    - "the displayed lead decision and direction equal uniquely marked content in the hashed returned review"
    - "finding IDs, disposition IDs, classifications, and counts agree exactly"
    - "rejected and deferred findings carry evidence and ownership metadata"
    - "Fable direction is default-adopted; rejection is limited to enumerated verified constraints"
    - "the new scripts are test-first and enter Plan 11W's blocking coverage-foundation 95%-per-metric gate"
  artifacts:
    - "config/schemas/fable-checkpoint-input.schema.json"
    - "config/schemas/fable-checkpoint-receipt.schema.json"
    - "scripts/run-fable-checkpoint.js"
    - "scripts/verify-fable-checkpoint.js"
    - "tests/verify-fable-checkpoint.test.js"
    - "43-11P-SUMMARY.md"
  key_links:
    - "subject commit and evidence digests -> input manifest -> deterministic packet"
    - "exact Fable subprocess plus nonce -> execution receipt -> checkpoint record"
    - "Fable response body -> SHA-256 -> execution receipt and checkpoint record"
    - "finding IDs -> dispositions -> classification counts"
    - "deferred finding -> owner and trigger -> durable follow-through"
    - "11P source/tests -> 11D live source classification -> 11W coverage-foundation 95% gate"
---

<objective>
Create one tested, reusable authority for every evidence-bearing checkpoint in
Fable's standing lead developer, architect, and designer role.
</objective>

<context>
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md
@.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-GSD-REVIEW.md
</context>

<tasks>

<task id="11P-01" type="auto" tdd="true">
  <name>Specify and implement captured Fable checkpoint authority</name>
  <files>config/schemas/fable-checkpoint-input.schema.json; config/schemas/fable-checkpoint-receipt.schema.json; scripts/run-fable-checkpoint.js; scripts/verify-fable-checkpoint.js; tests/verify-fable-checkpoint.test.js; .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11P-SUMMARY.md</files>
  <behavior>
    - A valid zero-finding record uses exact `- None.` sentinels in Findings and Disposition; a valid mixed record connects every `F-NNN` finding to exactly one classification and complete metadata.
    - Missing, duplicate, pending, empty, malformed, disconnected, count-mismatched, stale-subject, stale-digest, path-escaping, invalid-UTF-8, or externally changed evidence fails closed.
    - Rejected findings require `evidence=` and an allowed `basis=`; accepted-with-revision findings require `revision=`; deferred findings require non-empty `owner=` and `trigger=`.
    - The returned review has exactly one fresh nonce and one ordered marker pair for each lead decision and implementation direction; the displayed values equal the marked returned-review bytes.
    - A prior review, old nonce, self-reported invocation, recomputed output digest, or receipt/record disagreement cannot satisfy a later checkpoint.
    - Marker-like or prompt-style evidence remains length/digest-bound untrusted data and cannot alter packet instructions or output marker counts.
    - The child process receives only an explicit cross-platform runtime/auth allowlist and never an ambient sentinel secret.
    - Returned-review hashing excludes marker lines, normalizes CRLF/CR to LF, removes only the structural newline before the end marker, encodes UTF-8, and emits lowercase SHA-256.
    - Tracked evidence matches raw bytes from the 40-hex subject commit; external evidence matches its declared authority, checked commit, repository-contained local path, and current raw-byte digest.
    - Any `.planning/evidence/hosted/` input is rejected unless declared as tracked evidence resolved from the subject commit; ambient or external hosted bytes are never admissible.
    - Manifest raw-byte, canonical-input, evidence raw-byte, and returned-review digests are deterministic and independently recomputed.
  </behavior>
  <implementation>
    Define versioned input-manifest and execution-receipt schemas plus an
    importable manifest/packet builder, execution adapter, record evaluator, and
    thin CLIs. `run-fable-checkpoint.js` accepts `--manifest`, `--receipt`,
    `--record`, and exact `--checkpoint`; validates tracked and external
    evidence; creates a cryptographically random nonce; builds canonical JSON
    with recursively sorted object keys, preserved array order, and one LF;
    and spawns exact argv `claude -p --model fable` with shell disabled and the
    packet over stdin. Require hosted envelope paths to use the tracked-evidence
    branch and read their bytes from the subject tree; their caller must first
    pass strict hosted-envelope verification. Pass only the explicit minimal cross-platform environment
    required to locate the executable, user profile, subscription credentials,
    and temp directory; never print raw environment values.

    Frame Fable as the project's lead developer, architect, and designer and
    request an explicit technical/design decision, implementation direction,
    prioritized corrections, and rationale. State that Fable direction is
    adopted by default. Rejection is limited to a verified repository fact,
    locked user decision, security/WoW constraint, or contradictory executable
    evidence; fresh product judgment is deferred with `owner=user` and an
    AskUserQuestion trigger. Keep authority instructions separate from
    length/digest-bound untrusted repository evidence.

    Capture stdout, status, timestamps, subject, nonce, exact argv, and all
    digests atomically without printing the review body. On exit zero, append one
    uniquely delimited `### <checkpoint> - pending-disposition` section with the
    captured review and exact marked lead fields; never claim `dispositioned`.
    On failure, publish no section. `verify-fable-checkpoint.js` recomputes the
    manifest and packet, verifies subject/external evidence and captured argv,
    connects nonce and digests to the review, and enforces headings, markers,
    field equality, IDs, classifications, counts, and metadata with concise
    diagnostics only. Keep filesystem/CLI adapters outside the pure evaluator
    and expose dependencies for tests.
  </implementation>
  <action>
    Execute one Open GSD RED-GREEN-REFACTOR cycle. RED: implement the behavior
    fixtures first and run the nearest focused command, `bun run test --
    tests/verify-fable-checkpoint.test.js`; it must fail for the missing
    production behavior within the 30-second feedback target. Commit the RED
    state. GREEN: implement the schemas, pure domain evaluator, injected
    execution/filesystem adapters, and thin CLIs described above until the same
    focused command passes. Commit the GREEN state. REFACTOR: simplify without
    changing behavior, rerun the focused test, both help commands, lint, and diff
    check, then write `43-11P-SUMMARY.md` with schemas, record template,
    packet/hash algorithms, replay negatives, exact caller commands, coverage
    ownership, tracked hosted-envelope semantics, and external-evidence rules. The final verifier is always the
    passing GREEN/REFACTOR suite, never the intentionally failing RED command.
  </action>
  <acceptance_criteria>
    - all positive and negative fixtures pass.
    - malformed, replayed, stale-subject, or uncaptured records fail closed with no raw review-body output.
    - the implementation is reusable by every later Fable plan task.
    - every introduced branch has a named fixture; Plan 11D classifies both scripts and Plan 11W blocks until the coverage-foundation group is at least 95% for statements, branches, functions, and lines.
  </acceptance_criteria>
  <verify>
    <automated>bun run test -- tests/verify-fable-checkpoint.test.js</automated>
    <automated>node scripts/run-fable-checkpoint.js --help</automated>
    <automated>node scripts/verify-fable-checkpoint.js --help</automated>
    <automated>bun run lint</automated>
    <automated>git diff --check</automated>
  </verify>
  <done>false</done>
</task>

</tasks>

<threat_model>
A pasted digest, rewritten lead decision, or balanced count can falsely imply
review completion. Bind the captured subprocess to a checkpoint-specific
subject, manifest, evidence digests, deterministic input, and fresh nonce;
preserve Fable's marked lead direction exactly; then connect every finding to
exactly one metadata-complete disposition.
</threat_model>

<verification>
- `bun run test -- tests/verify-fable-checkpoint.test.js`
- `node scripts/run-fable-checkpoint.js --help`
- `node scripts/verify-fable-checkpoint.js --help`
- `bun run lint`
- `git diff --check`
</verification>
