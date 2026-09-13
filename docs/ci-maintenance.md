# CI maintenance

CI ownership covers workflow behavior, required checks, action upgrades, and
failure triage across all open PRs. Application changes and feature approval
remain with the development workflow. Passing CI does not approve a feature.

## Action upgrades

1. Check the PR head and current main before editing; reuse fixes already merged.
2. Review the action release and breaking changes against every workflow usage.
3. Update the action's tag, immutable SHA, and update trigger in
   `config/phase43-toolchain-authority.json`.
4. Run `node scripts/sync-action-pins.js --write`, then `--check`.
5. Run `bun run test -- tests/ci-workflow.test.js` and
   `node --test tests/toolchain-authority.test.js`.
6. Inspect the diff and publish to the existing action-update branch without
   force-pushing. Check hosted results on that exact commit.

The manifest is the approved pin authority. Workflow tests consume its SHAs;
separate schema tests validate immutable commits and the authority structure.
Dependabot proposes changes but does not approve a new authority automatically.
Generated action-version comments use `# pin: <tag>`. Git-valid tag punctuation
is accepted when it is safe in a single-line YAML comment. Only legacy `vN` and
`vN.N[.N]` comments are migrated on their next update; numeric-prefixed prose and
all other comments are preserved as human context.

## Failure triage

Record the PR head, base, run URL, failed job, and relevant log evidence.
Classify failures as a PR regression, existing repository health issue, or
external availability failure. An old branch is not evidence that main lacks a
fix: inspect main's manifest, lockfile, and recent commits first.

Security scanners retain blocking HIGH/CRITICAL enforcement. Weekly CI checks
main even when no PR changes dependencies. Bun Dependabot updates keep the
manifest and text lockfile reviewable; existing exact overrides still need review.
Never add suppressions solely to make an unrelated PR green.

External links excluded from the blocking checker are enumerated from the same
Lychee configuration and monitored weekly. Stable URL keys allow reports to be
compared across runs. Repeated 404/410 responses require an owned repair;
timeouts and 5xx responses are availability evidence, not proof of link rot.
The report names the repository owner for follow-up and sets the next weekly
review date. An exclusion is not permission to stop monitoring the reference.
Markdown links, autolinks, bare links and standard URL-bearing HTML attributes
are parsed structurally, whether quoted or unquoted, so punctuation and
apostrophes are not confused with delimiters. Multi-URL attributes such as
`srcset` and `ping` are expanded into individual monitored URLs.
HTML character references in URL attributes are decoded to their browser target
before availability checks and recurrence-key hashing. URLs are escaped when
rendered in Markdown evidence tables without changing the requested URL or key.
URL-standard ASCII tabs and newlines are removed from single-URL attributes,
and HTTP scheme matching is case-insensitive before exclusions are evaluated.

The collector and Lychee share a deliberately restricted regex subset, validated
against `lychee.toml` by PR tests: case-sensitive ASCII literals, escaped regex
punctuation, anchors, capturing groups, alternation, `?`, `*`, `+`, and `[0-9]`.
Unescaped wildcard dots, other character classes, counted repetition, shorthand
or Unicode escapes, lookaround and inline flags (including `(?i)`) are rejected.
Use explicit case alternatives when needed. An exclusion needing a wider dialect
requires a reviewed matcher change before it is added; do not assume arbitrary
Rust regex syntax works in JavaScript. End anchors use absolute-end semantics.
The validator also rejects expressions considered unsafe for JavaScript's
backtracking engine, even if Lychee's linear-time Rust engine accepts them.
Unbounded repetition of groups (`(...)*` and `(...)+`) is always rejected,
including overlapping alternatives missed by repetition-depth heuristics.
Optional groups remain supported for the existing host exclusions.

Retry transient failed jobs once after the run completes. GitHub rejects job
retries while another job in the run is active. Do not cancel valid performance
evidence solely to enable a retry, and do not change performance gates without
reviewing their existing authority contracts.
