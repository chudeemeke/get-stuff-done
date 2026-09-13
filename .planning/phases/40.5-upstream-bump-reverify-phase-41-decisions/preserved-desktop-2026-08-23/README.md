# Preserved desktop artifacts — 2026-08-23 pre-cutover capture (issue #41)

Byte-identical copies of the only non-regenerable artifacts from the DESKTOP
working tree, captured 2026-08-23 before the Phase 20 cutover, fetched from
`/home/destiny/Projects/_preserve/get-stuff-done-2026-08-23-predesktop-cutover/`
on 2026-08-29 via `remotely fetch` and verified against the recorded sums.

These DIFFER from the laptop copies at the same repo paths (laptop 6180/6280
bytes vs desktop 7188/12101 bytes); the laptop line is preserved separately
(branch `preserve/laptop-main-2026-08-23`, commit `82012fc2`).

| File | Original path | SHA-256 | Bytes |
|---|---|---|---|
| `HANDOFF.json` | `.planning/HANDOFF.json` | `0f9f5a5139405397023586630e67449307ceb7fce0346de3d0fbf86dfddcb3dc` | 7188 |
| `.continue-here.md` | `.planning/phases/40.5-upstream-bump-reverify-phase-41-decisions/.continue-here.md` | `c43408f6b3d9744456170aa29eb1747e1cc087a1f4a1e63212b247a3d1739f56` | 12101 |

Provenance sidecars from the same capture: `HEAD.txt` (desktop HEAD
`265e3659f0b7477cf8e59bca24433e8904bdf093`), `SHA256SUMS` (recorded at capture
time), `git-status-porcelain-2026-08-23.txt` (desktop tree state).

The `.gitattributes` rule `preserved-desktop-2026-08-23/** -text` prevents
line-ending normalization; verify integrity at any time with:

```bash
git show HEAD:.planning/phases/40.5-upstream-bump-reverify-phase-41-decisions/preserved-desktop-2026-08-23/HANDOFF.json | sha256sum
```

Do not edit files in this directory; it is an archival capture.
