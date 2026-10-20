# Section21 containment experiment: final evidence review

**Verdict: PASS, for bounded Windows/NTFS fixture evidence only.**

This is not product acceptance. It grants no authority for corrections, reruns or approval of rename restrictions.

**Concrete blockers:** none found.

## Independently verified

- **Provenance**
  - All three receipts carry the same source digests: probe.rs `0fb2a0…`, supervisor.cjs `dd2b5d…`, README.md `236ac7…`.
  - `sourceStable` and `binaryStable` are true in every run.
  - The compiler is rustc 1.98.0 with `-D warnings`. `binarySha256` is non-null in each receipt, which the code only allows when the build status is 0.
  - Binary digests differ per run, most likely because each build uses a different output directory. No cross-run binary identity is claimed, so this is acceptable.
- **Scope volume**
  - The volume query reports NTFS, serial 540572784.
  - This matches the handle's volume and Node's `dev` value.
- **Object identity**
  - The candidate's reported file ID (indexHigh<<32 | indexLow) equals the owner-observed `ino` for the target. This holds in all three positive phases and in the parent-swap guarded phase.
  - Example: 0x930000/238292 → 41376821576704724, and 0x11F0000/240233 → 80783318316198505.
  - So the guard held the same object the owner addressed.
- **Nine claim/control mappings**
  - All 18 control IDs reference existing events from the correct phase.
  - Each unsafe violation event follows a passing detector check or a successful unguarded action.
  - **Parent-swap, guarded:**
    - Target and ancestor renames were refused with EBUSY at both points (events 28/29/34/35).
    - The junction EEXIST is recorded as a non-claim.
    - Relative create and disposition-delete succeeded, and the outside map was unchanged.
    - The aliases resolve to the same object, and the owner write read back correctly.
  - **Leaf-swap, guarded:**
    - Exclusive create was refused for a file (0xC0000035) and for a directory and junction (0xC00000BA). Each per-kind map was unchanged.
    - Inspect succeeded on the regular file and was refused at open for the directory and junction.
    - The target rename got EBUSY, and the owner write was preserved.
  - **Moved-directory, guarded:**
    - Target and ancestor renames got EBUSY.
    - Create and remove succeeded in place, and the owner write was preserved.
    - The rename after child close succeeded (events 35→36).
- **Full map diff**
  - I compared every before/after entry. The deltas are exactly the following:
    - **Preregistered unsafe effects:**
      - Parent-swap: alias retargeted, target replaced by a junction, `moved/` created, `outside/probe.txt` changed.
      - Leaf-swap: `moved/` containing the junction leaf.
      - Moved-directory: `moved/owner.txt` changed, `ancestor-moved/` created.
    - **Owner writes:** positive and guarded `owner.txt` became sha('owner-updated').
    - **Post-exit rename:** the moved-directory guarded target became `after-exit`.
  - `home/` is unchanged, no `probe.txt` remains, and the positive/guarded `outside/` trees are unchanged in all runs.
  - Dangling aliases are consequences of the registered renames, not new deltas. I concur with the implementing agent.
- **Closure, cleanup and timing**
  - Two children per run, each exiting 0 with empty stderr and observed close. The guard close event precedes process exit.
  - Cleanup is complete with no retained paths or errors.
  - Measured windows were 12.5–17.0 s, far below the 175 s deadline. Event sequences are contiguous and elapsed times are monotonic.

## Nonblocking defects and limitations

1. **Mapping mismatch.**
   - `positive:owner-rename-effect-recorded` links events 7 and 19, the guard open and close.
   - The README preregisters "guard ready plus successful ordinary owner write" instead. Those observations exist (events 10 and 18) but are not linked.
   - Record this in the disposition; do not correct it.
2. **Unverifiable from this packet.**
   - I cannot hash the presented text, so its binding to the recorded digests rests on the implementing agent.
   - `index.json` and the build logs are absent. The claims of exactly three initial runs, `supersedes: null` and the stop state are therefore unverified.
   - Attach a read-only hash comparison and an index excerpt to the disposition. That is neither a correction nor a rerun.
3. **Mechanism concentration.**
   - Every guarded containment result in parent-swap and moved-directory rests on rename/delete denial, because the guard omits FILE_SHARE_DELETE.
   - No move ever succeeded, so handle-relative behaviour after a real move was never exercised. The defensive refutation paths are untested.
   - "moved-object-boundary" here means "held directories could not be moved." It does not mean "post-move mutation is bounded."
4. **EBUSY attribution.**
   - Only libuv codes are recorded.
   - Parent-swap and leaf-swap contrast against a different fixture instance.
   - A same-instance release contrast exists only once: the moved-directory target, not the ancestor.
5. **Recording claims.** The three `*-effect-recorded` claims are set unconditionally. Their "mechanism-observed" status says nothing about whether the rename restriction is acceptable.
6. **Non-adversarial claims.** `alias-same-object` and `owner-file-write-preserved` show that the guard did not impede ordinary owner access. The guard does not protect aliases or prevent lost writes; the unsafe controls only validate detectors.
7. **Narrow sample.**
   - One run per case.
   - Unsafe controls are sequential simulations, not races.
   - Only the Node/libuv rename path was exercised.
   - Fixture directories carry the NTFS compressed attribute (0x800).
   - There is an unexplained 12–17 s first-spawn delay, plausibly an antivirus scan, though still within bounds.
8. **Delta coverage.** Receipts do not enumerate the expected unsafe deltas; I derived them from the supervisor code. The maps cover only the run directory.

## Overclaims to avoid

- "Relative handles contain moved directories."
- "Rename restrictions are approved."
- Any inference to other filesystems or volumes, network paths, symbolic links or 8.3 names.
- Any release-latency bound.
- Production readiness.

## Remain UNPROVED

- Root bootstrap above the held ancestor.
- Adversarial aliases.
- Portable locking and takeover.
- Durability.
- Crash and quiescence.
- Production packaging.
- Owner approval of rename restrictions.
