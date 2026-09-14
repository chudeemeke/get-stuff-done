# PR 69 application recovery

Keep PR 69 draft. No approval, merge, or readiness change is authorized.

Recovered remote: df0d3f9c13134321a050a2d8de79b0622aa161d3. Current main
3d1ae34f29084d0c538fd9d8db37aa6f09c13ed1 was integrated as
7d9ca862c4deff88210af4908c7177081f9f4e74, preserving four prior local fixes.
Other worktrees and intentional dirty files remain intact.

## Changes and upstream assessment

Retain the approved 1.8.0 to 1.9.1 step. Nine override reasons and hashes remain
fresh; composition produced 849 files, and parity passed 17 checks at pickup.
The existing bump-1.9.1-port.md ledger records upstream changes, adopted behavior
and retirement triggers. The live upstream comparison includes back-merge
history; its 161 commit count is not a net feature count.

Recovered installer corrections preserve Codex shared defaults on agent-write
failure and fix Kimi Code help. Wrapper changes refuse managed paths below the
selected root that traverse links, retain snapshot/cleanup diagnostics, ignore
late child events, and snapshot local patches together with pristine baselines.
They replace the incorrect metadata-object merge with complete pre-update
snapshots; existing .gsd-patch-archive content is preserved.

Five subsequent regression cases verify refusal of --all, missing overlay
sources, and destinations redirected by upstream; rollback continues after an
individual failure, retains recovery evidence, and safely restores a substituted
leaf. These changes do not close all findings from the complete wrapper review.

## Validation and limits

Evidence root: C:/Users/Destiny/.codex/reports/gsd-application-2026-09-13/.

- Initial integration: 104 focused tests, 470 assertions, zero failures.
- Review red run: six failures, including the older test that accepted an absent
  overlay source. Updated safety suite: 96 passed, 410 assertions, zero failures.
  See pr69-review-red-corrected.log and pr69-review-green-corrected.log.
- Focused ESLint: zero errors, six existing object-injection warnings.
- Current matrix: 313 passed, 3 failed, zero skips, exit 1. Roadmap publication
  hit the existing 10-second native PowerShell timeout. The failed envelope is
  .planning/evidence/pr69-application-2026-09-13-compat.json. It was not applied
  as vetted evidence; timeouts and checks were not relaxed.
- Actual isolated 1.8.0 to 1.9.1 upgrade and same-version reinstall preserved
  custom settings, owner hooks/statusline/instructions, a modified workflow
  namespace skill, its pristine bytes/hash, and prior patch snapshots. See
  pr69-upgrade-smoke.json. This predates the five later regression fixes and
  needs refreshing. Its first fixture assumed an obsolete command layout;
  the actual global entry is skills/gsd-ns-workflow/SKILL.md. Failed evidence
  was retained. OS temporary homes were cleaned; user runtimes were not changed.
- Installed state acceptance: 9 passed, 3 failed, zero skipped, exit 1. Bullet
  phase analysis, manager handling and semantic replanned plan counts remain
  red. Unknown-key preservation and five commit-docs configurations passed.
  See pr69-installed-state-acceptance.tap. This does not close final 1.12 scope.
- The complete Bun suite returned 1745 passed, 1 failed, 6046 assertions across
  69 files: pr69-full-suite.log. The protected Windows DACL publication test
  hit the native PowerShell deadline. No whole-repository/Tier S installer
  coverage acceptance is claimed. Subsequent native-publication changes need
  a fresh complete suite and matrix.

Independent source review used live-resolved gpt-5.6-sol at xhigh under Codex
0.154.0, session 01a09ced-6966-7400-ae89-70b598898ee9. Packet and verdict:
pr69-application-review-packet.md and pr69-application-review.md. The reviewer
ran no tools or tests. Its ten findings predate the latest fixes; no clean
final-revision review is claimed.

## Remaining application blockers

September 14 progress: installed and overlay ownership reads now distinguish
absent, valid-empty and invalid inventories. Corrupt JSON, malformed maps/arrays,
non-file and linked manifest paths refuse before cleanup. A valid empty manifest
no longer triggers recursive legacy fallback. Actual isolated CLI install and
uninstall regressions preserve the original owner/legacy bytes on refusal.

The initial CLI regression failed (exit 0 instead of 1); the expanded ownership
run reproduced 11 failures out of 14 cases before correction. Pinned Bun 1.3.5
now passes 114 tests / 0 failures / 489 assertions across installer-safety,
installer-cli-safety and installer-codex-defaults. ESLint has zero errors and the
same six existing argument-parser warnings. An initial Node invocation included
the Bun-only defaults suite and failed to load `bun:test`; its 111 other tests
passed, but that combined run is not a successful gate. The proper Bun run above
is the verification result. Logs: `pr69-invalid-ownership-red.log`,
`pr69-manifest-shapes-red.log`, `pr69-ownership-node.log`, `pr69-ownership-bun.log`.

This corrects malformed/empty-manifest handling, not all ownership cleanup.
Absent-manifest legacy inference and name-only deletion of side artifacts remain
open below. Whole-file Tier S coverage, final revision review and full-suite
acceptance are still outstanding. No PR69 application changes are pushed yet.

Owner: get-stuff-done application development. Retirement trigger: implemented
and tested before recommending PR 69 adoption; no new strategic audit needed.

1. Complete rollback inventory for new upstream-only files and side metadata,
   including partial upstream failure. Old-manifest plus overlay inventory can
   leave a mixed installation.
2. Invalid and valid-empty ownership metadata now refuse/avoid legacy fallback
   as appropriate. Complete the remaining absent-manifest behavior using positive
   ownership evidence and safe handling of uncertain legacy content.
3. Begin reversible legacy migration before its first cleanup; current main
   invokes cleanup before the transaction snapshot.
4. Preserve uncertain owner files in name-based cleanup of legacy roots,
   scripts/lib, scripts/changeset and hooks/dist.
   The hooks/dist case is now corrected: only an empty, contained directory is
   pruned using rmdir. Nonempty content is preserved and linked ancestors are
   not traversed. Two RED fixtures demonstrated deletion of unclassified bytes
   and traversal into an outside directory; both now pass. Pinned Bun 1.3.5:
   115 passed, 0 failed, 487 assertions over installer-safety and CLI safety.
   Evidence: pr69-orphan-preserve-red.log and pr69-orphan-bun.log. Unclassified
   remnants remain owner-reconciliation items; no filename-based ownership claim
   is made. Other paths in this item remain open.
5. Finish containment checks for every metadata/settings publication path.
   Overlay and rollback-leaf tests cover only part of this boundary.
6. Reconcile active patch-tree residue with upstream reapply consumption.
   A complete pre-run snapshot can include old files outside the current
   metadata inventory; do not assign them fabricated generation provenance
   or delete unclassified owner bytes.
7. Make settings backup/staging exclusive and recoverable; uninstall must
   remove only a matching GSD statusline. Fixed backup/tmp names and a dangling
   uninstall command remain review findings.
8. Review other multi-destination runtime modes against the single-target
   transaction, beyond the implemented --all refusal.
9. Resolve the current roadmap timeout evidence; obtain a fresh complete matrix,
   full-suite and Tier S evidence and a final independent review.
10. Corrected: uninstall now applies the existing unsafe-target guard before
    reading/removing inventory. The guard resolves existing selected-root aliases
    and Windows path casing before comparing against the home/root boundary.
    RED fixtures demonstrated deletion in an isolated fake home and through its
    alias; both now refuse with bytes intact. Actual CLI fake-home refusal and
    normal runtime selection pass. Pinned Bun 1.3.5: 117 passed, 0 failed,
    501 assertions across installer-safety, installer-cli-safety and
    installer-target; `pr69-target-guard-bun.log`. ESLint has no errors and the
    same six pre-existing argument-parser warnings. This is not protection
    against every concurrent target substitution or a full release gate.

The three installed state failures remain on the existing skin acceptance map.
No broader STATE authority or final contract closure is implied.

Next inventory investigation must reuse existing upstream seams where possible.
The 1.9.1 `runtime-artifact-install-plan.cjs` plans staged command/skill/agent
copy destinations, but explicitly leaves pruning, migrations and final cleanup
to the installer. `--dry-run` previews legacy cleanup only. Neither is currently
proof of a complete candidate write inventory for settings, side metadata and
all failure paths. Codex has its own runtime-specific rollback; the wrapper
must not claim that applies to every runtime. Source presence is not a reason
to replace the open inventory requirement with another incomplete path list.

## CI handoff

Use the newly published branch head once changes are committed and pushed;
historical green checks on df0d3f9c are stale. Existing upgrade-verifier arguments
advance from 1.8.0/1.9.1 to 1.9.1/1.10.0. Workflow/action changes were inherited;
this session did not redesign CI. Application failures do not authorize weaker
checks. Keep PR 69 draft. PR 4 separately remains blocked on ordinary
non-elevated repair, and PR 70 has not been advanced.

## Native Windows publication experiment: not adopted

A compiler-free File.Replace experiment passed 47 focused tests once, including
protected-DACL preservation and native failure recovery. It timed out again
under Node/C8 and failed the per-file Tier S branch gate (95.56 percent branches;
98.73 percent statements/lines, 100 percent functions). These are experiment
results, not coverage evidence for the restored current source.

Bare PowerShell startup measured 649-853 ms in three probes; startup alone did
not explain the native-operation deadline failures. The root cause remains
unverified. No production timeout or existing test gate was changed.

The experiment and its three new tests were archived under the evidence root:
pr69-roadmap-compiler-experiment.patch, the two pr69-experiment-* source copies,
and pr69-roadmap-experiment-disposition.json with before/restored hashes. The
publisher and its test file were restored exactly to HEAD; neither had prior
dirty work before this experiment. Existing installer changes were preserved.

The current complete-suite result is again 1745 passed / 1 failed, from
pr69-full-suite.log. Publication remains held on application validation and the
open review findings above. No PR69 application changes have been pushed yet.
