# Preserved Phase 40.5 handoff artifacts (laptop copies)

These two files are the **laptop** copies of the Phase 40.5 handoff artifacts identified in
issue #41 as the only genuinely non-regenerable artifacts in the working tree: their exact
content exists in no commit.

Until this commit they existed only as untracked files in a working tree, and the desktop
copies existed only at a filesystem path
(`~/Projects/_preserve/get-stuff-done-2026-08-23-predesktop-cutover/`) that the Phase 20
cutover was going to overwrite. Issue #41 records that inversion: the *regenerable* commit
line had a durable git branch while the *non-regenerable* files had none.

| File here | Original path | Bytes | SHA-256 (first 16) |
|---|---|---|---|
| `HANDOFF.json` | `.planning/HANDOFF.json` | 6180 | `20b08be11b31c00a` |
| `continue-here.md` | `.planning/phases/40.5-.../.continue-here.md` | 6280 | `236f087d8058d39f` |

Copied byte-for-byte on 2026-08-26; both hashes were verified identical to their sources
immediately after copying.

## Scope and caveats

- These are the **laptop** copies. Issue #41 notes the desktop copies differ in size
  (7188 and 12101 bytes) and records different SHA-256 sums (`0f9f5a51...`, `c43408f6...`).
  **Preserving these does not preserve the desktop copies**, and #41 is not fully discharged
  until the desktop pair is also durable or is explicitly declared redundant.
- `.continue-here.md` is renamed to `continue-here.md` here so it is not hidden and cannot be
  mistaken for a live handoff. Content is unmodified.
- These are historical records of a completed phase (40.5 shipped and merged). They are kept
  for provenance, not for resuming work. The live handoff is `.planning/HANDOFF.json`.

See issue #41 for the full rationale and acceptance criteria.
