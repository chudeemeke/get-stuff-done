# Open-GSD value comparison, 2026-09-19

Status: bounded comparison complete; reduced-skin direction accepted by owner.
Owner decision (2026-09-19): "Retain a reduced skin: preserve measured protections,
retire duplication only after parity proof, and resume the eight lock-review
dispositions." This authorizes the direction, not removal of any particular behavior.
Authority: owner selected "Compare value first" on 2026-09-19, extending the
lock-only session to disposable comparison work. No migration, upstream pin change,
product repair, PR closure, push or merge is authorized by these results.

## Judgment

**Retain a reduced skin for now. Do not replace the installed tool with stock 1.14.0
on the evidence available. Do not treat the entire existing fork as justified.**

The measured advantage is specific: correct current-phase/milestone selection,
declared-plan accounting, precise roadmap mutation and installer ownership. Native
upstream configuration can already provide planner skill routing and effort sync.
The derivative-plan exclusion is also native now, subject to a legacy-filename
compatibility decision. These findings justify retaining selected behaviors, not
reimplementing upstream workflows or preserving a separate identity for its own sake.

This revises the initial provisional preference for upstream plus configuration/skills
alone: configuration did not remove the measured routing and counting differences,
and the exact-phase roadmap mutation defect persists. A narrow code layer remains
justified unless those requirements change or equivalent upstream fixes are delivered.

Both alternatives fail the agreed failed-install recovery requirement. The current
skin additionally makes a false rollback claim. Continuing the accepted installer
repair has a concrete purpose if the owner retains this delivery model; its current
implementation is not yet a safety advantage.

## Candidates and method

- Skin source: branch `chore/upstream-bump-1.9.1`, HEAD `e50bda5b`; pinned upstream
  1.9.1. A fresh composition was written to a separate comparison directory. A copy
  of the current wrapper used that composed child. No product source was changed.
- Alternative: exact npm package `@opengsd/gsd-core@1.14.0`, gitHead
  `f8542fef67c1f978ffa70912cb6f2aaab76464c6`. Registry SHA-512 integrity verified.
  [Official release](https://github.com/open-gsd/gsd-core/releases/tag/v1.14.0).
- Host: Windows, Node v24.20.0. Pinned Bun 1.3.5 was verified and put first on child
  PATH. Node-only experiments ran serially. The upstream package requires Node >=24;
  this is a migration prerequisite, not a changed requirement for this project.
- Each subprocess used disposable HOME, USERPROFILE, runtime/config/cache and temp
  paths beneath this worktree. Installer runs explicitly selected their destination.
  A preload rejected synchronous writes outside the disposable root; its negative
  control rejected an attempted external write without creating the file. This is
  defense in depth, not a complete native/async filesystem sandbox.
- The original 12-case state-delivery suite was run unchanged against both exact
  candidates. Eight behavioral cases were extracted from existing regression suites,
  dropping private-adapter imports and fork-only diagnostic-field requirements.
  Fixtures, commands, raw TAP, installer logs and JSON receipts are retained.
- Extra upstream-only probes used canonical state/roadmap fields to distinguish
  adoption work from missing behavior. Installed configuration probes exercised real
  CLI invocation and inspected the resulting agent bytes and skill paths.

Evidence directory: `.planning/evidence/value-comparison-2026-09-19/`.
`provenance.json` records source identity and composition; `evidence-manifest.json`
records evidence hashes. Downloaded package and archive are local, ignored material;
their registry identity is retained. Fixtures and composed candidates are under
`.claude/value-comparison-2026-09-19/` and are not shipping artifacts.

## Measured results

| Experiment | Stock upstream 1.14.0 | Current skin | Interpretation |
|---|---|---|---|
| Existing state-delivery suite | 9 pass, 3 fail, 0 skipped | 9 pass, 3 fail, 0 skipped | Shared gaps; no skin advantage on these three cases |
| Eight selected behavioral cases | 0 pass, 8 fail, 0 skipped | 8 pass, 0 fail, 0 skipped | Specific differences; not an overall product score and not eight independent benefits |
| Claude install/reinstall/uninstall | 19 checks pass, 2 fail | 21 checks pass, 0 fail | Upstream claims two seeded owner helpers in its manifest; owner bytes survive this lifecycle in both |
| Codex install/reinstall/uninstall | 19 checks pass, 2 fail | 21 checks pass, 0 fail | Same ownership difference; all commands exit 0 |
| Claude manifest-publication fault | Owner files preserved; 946 residual files; exit 1; no false rollback claim | Owner files preserved; 622 residual files; exit 1; false "Rollback applied" claim | Neither meets recovery contract; raw residue totals are not a severity ranking |
| Upstream installed configuration, Claude | 9 checks pass, 0 fail | Not repeated | Native skill routing, low-to-high effort repair and idempotent second sync work |
| Upstream installed configuration, Codex | 9 checks pass, 0 fail | Not repeated | Native skill routing, removal of stale Anthropic model/effort fields and idempotent second sync work |

Final installer receipts end in `-isolated.json`; final configuration receipts end
in `-configuration-isolated-v2.json`. Installer results without `-isolated` precede
the ancestor-config isolation correction and are not the decision evidence. The
first Claude configuration run used the wrong `--write` flag and correctly failed;
`--apply` is the supported command. Those logs are preserved and are not product
defects. Source unchanged between the two state/behavior candidate runs.

Every result above was read from a suite summary or individual assertions. Experiment
drivers can exit 0 while recording failed acceptance checks; that is not a green
quality gate. This comparison does not establish coverage or release readiness.

## Per-feature decision brief

| Behavior or custom machinery | Evidence | Recommended disposition and retirement condition |
|---|---|---|
| Current-phase routing | Stock roadmap and init select old phase 40.5 instead of explicit current phase 41. Canonical Current Phase fields still reproduce it. Skin selects 41. | Keep the narrow behavior. Retire only when identical behavioral cases pass on the chosen upstream candidate. |
| Stale milestone recovery | Stock reads v4.0 from stale frontmatter despite v5.0 in the body/active roadmap; skin selects v5.0 and excludes old phases. | Keep while these documents are supported. A migration that removes contradictory state could be an alternative, but is not a tested recurrent-recovery solution. |
| Declared future-plan counts | Stock counts disk plans rather than the declared five; its state writer refuses unscoped progress in this fixture. Skin reports 1 of 5, 20%. Canonical-format probe does not remove the gap. | Keep the required accounting. Do not describe upstream's conservative refusal as a false 100% claim. Clarify this requirement in any upstream contribution. |
| Exact roadmap update and byte preservation | Stock completes phase 09.2 because its description mentions target 09.3, leaves 09.3 unchecked, and reformats CRLF. Skin changes only intended content. | Keep the exact-phase fix. Preserve current byte/ACL contract until native parity is proved; this run did not re-test ACL failure paths. |
| Derivative plan exclusion | Stock correctly excludes PLAN-REVIEW and PLAN11AC packets; test failure is solely that it rejects `legacy-plan-draft.md`, which the skin accepts. | Candidate for retirement after auditing/deciding legacy filename compatibility. Do not count the original defect as still missing upstream. |
| Metadata-preserving state writers and docs commits | Both candidates pass all nine other state-delivery cases, including five commit configuration variants. | Prefer native behavior; retire workarounds only after the selected installed generation passes and owning consumers receive closure. |
| Replanning and bullet-only phases | Both candidates fail old `Plan: 1 of 2` count replacement and omit bullet-only phase 22 from two readers. Stock replanning succeeds with canonical Total Plans in Phase. | Treat separately: canonical-field migration is viable for the count case; bullet-only support still needs a decision/fix or migration proof. Neither is a delivered skin advantage. |
| Installer ownership | Stock manifest claims pre-existing scripts/lib and scripts/changeset helper files; the skin manifest excludes them. Both preserve them on tested uninstall. | Keep the narrow ownership fix until the same source-inventory case passes upstream. Do not claim this experiment reproduced owner-file deletion. |
| Installer transaction and lock | Both installed candidates leave residue on injected failure; the new lock seam is not wired and remains NOT PASS. | Complete the accepted repair if retaining the current delivery contract. No claim of superior rollback today. Eight review findings remain owner-dispositioned work. |
| Planner digest delivery | Native `agent_skills` emits the correct installed Claude/Codex skill paths. A probe skill was used, not the real digest. | Deliver necessary digest logic as an additive skill through the native mechanism. Actual planner consumption and D11 benefit still require validation. |
| Effort synchronization | Installed stock Claude sync repairs low to high; Codex sync removes stale Anthropic-specific pins; second runs report zero syncs. | Use native configuration/sync. This does not establish D1 model-tier choice or D2 external reviewer routing and does not authorize reverting the real-home workaround yet. |
| Branded package, update throttles and duplicated workflow prose | No measured task benefit in this experiment; these cases were not benchmarked. | Require a separate retained user need. Prefer upstream-owned mechanisms where parity is proven; no deletion or scope change yet. |

## What would justify each direction

1. **Reduced skin (recommended):** retain the measured corrections, deliver native
   configuration/additive skills where proved, and finish the already accepted safe
   installer contract. Retire each override when its behavior passes without it.
   Keep the ratified 1.12.0 delivery endpoint until the owner explicitly changes it.
2. **Stock upstream:** first decide how to handle the reproduced routing, counting,
   roadmap mutation, ownership and failed-install gaps. A direct real-home replacement
   now would discard protections without meeting the same requirements.
3. **Full existing roadmap without reduction:** not justified by these results.
   Passing fork-specific tests is insufficient evidence that every feature pays for
   its maintenance. D11 and real workflow use remain required.

The owner accepted option 1 after reviewing this comparison. Individual retirements
remain gated on parity proof; the fixed endpoint and installer decisions stand.

## Remaining validation and limits

- Windows-only source and installed-CLI experiments. No new native Linux/macOS,
  APFS/network filesystem, permissions/ACL failure, process-kill or multi-installer
  concurrency proof; the earlier lock blocker is still open.
- The selected cases deliberately target known differences. They do not establish
  overall quality, feature completeness or superiority across representative use.
  Candidates use different upstream versions; this is a practical choice comparison,
  not a same-base causal benchmark.
- No live planner, checker or end-to-end agent workflow was launched. D11 remains
  unmeasured: orchestration reads <8k, planner prompt <300 lines, total <300k tokens,
  checker catches injected error without a hand brief. Numerical targets retain the
  owner's provisional interpretation, not automatic failure.
- No security/dependency audit, full repository suite, coverage/mutation gate,
  independent review or hosted CI refresh was run for this experimental documentation.
  Account-lock status is inherited from the handoff, not freshly reverified; no push
  was attempted. No current market-ready claim is made for either candidate.
- Original inbox contract file is absent from this worktree and its exact Git path
  history. Ratification is recoverable in `38504333` and HANDOFF; full source-contract
  reconciliation still needs the owning source. Owner: get-stuff-done; trigger: before
  final contract closure. No access to the excluded main checkout was used.
- Retained original decisions D1-D11 and fifteen installer decisions are unchanged.
  PR4 closure, preflight/snapshot implementation and real installation changes remain
  unauthorized in this session.

## Next action

Return to the eight sixth-review findings, one row at a time, and obtain lock-shape
approval before RED tests. Do not build a new comparison framework or broaden the
installer seam in this session. The comparison's useful output is this decision and
its reproducers, not another permanent subsystem.
