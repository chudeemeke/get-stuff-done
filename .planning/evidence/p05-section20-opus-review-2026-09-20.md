# Final Review — P04/P05 repaired validator and approved section 20 bytes

**Verdict: PASS WITH CHANGES**

Read-only critique of the supplied bytes only. I executed nothing, read no disk, and verified no hash. Two fixtures the tests depend on (`install-transaction-render-red.tap.txt`, `install-transaction-render-coverage.json`, `install-transaction-known-red.tap.txt`) were **not** supplied; claims resting on their exact bytes are marked.

## What I confirm code-locally

Section 20 landed as approved. `report.checks` is exactly 27 identities (`expect-red.cjs:95-106`: 14 required-PASS including both `home-outside-target-preserved` rows, 13 required-FAIL), and the fixture carries 27 rows with 14 `ok:true`. Cardinality is genuinely closed by `unreviewed check` (`:293`) + `duplicate check` (`:292`) + the two presence loops (`:312-319`).

The prior review's blockers are repaired and the repairs are real, not cosmetic:

- **F1 closed.** `snapshotOutsideTarget` (`installer-recovery.cjs:126-128`) walks `fixture.home` excluding only the exact target, captured before the wrapper run (`:322`, `:380`) and after (`:333`, `:398`), and the complete before/after maps survive into the report. `validHomeObservation` (`expect-red.cjs:185-234`) independently re-validates: seeded owner digests are recomputed from literal bytes (`:213-220`), `other-owner/empty` and the XDG dirs must be `dir` (`:221`), every ancestor must be a `dir` (`:205-208`), and the runtime exception is exactly the four named directories plus the one regular file — with `before.has(name) && before.get(name) !== 'dir'` and the file-digest twin forbidding type/symlink substitution and deletion (`:226-231`). No descendant glob is exempted: an extra `…/Caches/unapproved.bin` falls through to `before.get(name) !== after.get(name)` and rejects. The `identity(segments[0]) === identity('runtime with spaces')` guard (`:201`) prevents smuggling target contents into the home map.
- **F3 closed.** `installer-recovery.cjs:447-458` wraps cleanup in try/catch, forces `accepted=false` and `exitCode=1`, folds the message into `harnessError`, names the retained fixture on stderr, and always reaches the stdout write at `:459`. Proven by `captureCleanupFailure` (`test.js:96-141`, asserted at `:400-410`).
- **F4 closed.** `captureNode` sets `maxBuffer: 64 * 1024 * 1024` (`test.js:73`), with a 2 MiB round-trip control (`:945-950`).
- **F5 closed, and harder than asked.** Any non-blank inherited `NODE_OPTIONS` refuses before spawn (`expect-red.cjs:500-503`), `env.NODE_OPTIONS` is deleted for the child (`:550`), and twelve flag families plus a whitespace-only case are covered (`test.js:1036-1067`).
- **F2 closed.** `captureHarnessOracle` modes `stat-error`, `before-observe`, `after-observe`, `without-code` drive real `EACCES` throws through `fs.readdirSync`/`lstatSync` and assert the emitted `observation-error` shape, including `code: null` for a code-less error (`test.js:383-399`) — exercising both disjuncts of `record`'s guard (`installer-recovery.cjs:50`).
- **F6 closed.** `RECOVERY_RESIDUE_ROOTS` (`expect-red.cjs:107-110`) pins the eight top-level residue entries by name *and type*, enforced by an exact deep-equal of the non-nested slice (`:139`). The dropped-`hooks` control (`test.js:587-597`) proves a self-consistent smaller twin rejects.
- **F7 closed.** Invalid context now accumulates (`:278`) rather than returning, and the abort-shaped report control (`test.js:509-522`) asserts *both* messages appear.
- **F9/F10 closed.** Outer timeout 400 s > inner 300 s (`test.js:980`); `nodeRuntime()` resolves an absolute `execPath` and pins version/platform (`:57-70`).

The 16 decision mutants (`test.js:815-874`) are the strongest artifact here: each asserts the real judge rejects, asserts the predicate occurs exactly once in source, compiles a weakened copy in `vm.runInNewContext`, and requires `[]`. Four of them target `validHomeObservation`'s runtime branches specifically. The harness-side mutant (`:361-366`) removes the home comparison and proves the damage control flips from reject to accept.

---

## Findings

### F1 — MEDIUM. `moved-txt-lists-every-file` accepts a superset; `listed` is unconstrained

`expect-red.cjs:173-179` pins `moved-list.actual` to `{expected: <derived>, listed: []}`. The `listed` value is pinned to empty only because the current RED has an absent quarantine. The harness computes `listed` as `quarantine.moved.split(/\r?\n/).filter(Boolean)` (`installer-recovery.cjs:311`) but asserts only `files.filter(name => !quarantine.moved.includes(name))` (`:312`) — a **substring** containment test over the whole file, not a set comparison. A `moved.txt` naming a thousand unrelated paths, or one line containing every expected name as a substring of a longer path, satisfies the assertion.

This does not weaken the current gate (the row is required-FAIL with `listed: []`), so it is a latent defect that activates the day the fix lands and the row is retired from `RECOVERY_REQUIRED_FAIL`.

Counterexample: `moved.txt` containing the single line `prefix/skills/gsd-add-tests/SKILL.md-BACKUP` satisfies `includes('skills/gsd-add-tests/SKILL.md')`.

Repair (harness-local, no shape change): replace the `includes` scan with `assert.deepEqual(listed.sort(), files)` at `installer-recovery.cjs:312-313`, keeping the same `observe` payload. Confidence: high that the substring test is weak; medium that it matters before the fix lands.

### F2 — MEDIUM. `upgrade:moved-txt-lists-every-file` expects a one-element list, not "every file"

`expect-red.cjs:176-178` derives the upgrade expectation as `[context.upgrade.removed]`, matching `assertMovedListsFiles(scenario, quarantine, { [removed]: 'file' })` (`installer-recovery.cjs:420`). The identity says "every file"; the oracle checks one. The edited file is displaced rather than moved, so this is arguably correct by design — but nothing in the packet states that `moved.txt` should exclude displaced entries, and the fresh scenario's version of the same identity checks the full residue file set. The asymmetry is invisible from the check name and will silently under-specify the post-fix contract.

Repair: rename to `upgrade:moved-txt-lists-removed-file`, or document the divergence in the contract. **A rename changes the approved inventory and returns to the owner.** Reporting, not authorizing. Confidence: medium — this may be intended.

### F3 — MEDIUM. `validHomeObservation` does not require the `before` and `after` roots to agree on the fixture identity

The function validates each map's internal consistency and then compares entries pairwise, but never requires that `after` contains the seeded owner files. Line `:218-220` checks only `before`. If a mutation deletes `.gsd/owner.json` from **both** maps, `:221`-style checks catch `other-owner/empty` and `.cache`/`.local/share`, and the ownerFiles loop catches `before` — so the paired deletion is caught. But consider deleting `AppData/Roaming/owner.txt` from `after` only: `:225` iterates the union, the name is not a runtime path, `before.get(name) !== after.get(name)` fires, reject. Good.

The actual gap is narrower: `after` may contain entries whose ancestors exist in `before` but whose own ancestor chain in `after` is validated only within `after` (`:205-208` runs per-map). That is correct. I could not construct a counterexample that evades both the per-map ancestor walk and the union comparison.

**Downgrading this to a non-finding.** The per-map validation plus union comparison is sound. I am leaving the analysis visible because the two-map structure invites exactly this class of error and a future edit that moves the ownerFiles check inside the `for (const state of …)` loop would be a regression, not an improvement.

### F4 — MEDIUM-LOW. `RECOVERY_REQUIRED_PASS` rows other than the home rows remain uncorroborated booleans

`recoveryObservation` returns `{kind:'assertion-pass', actual:{}}` for all 14 required-PASS keys before consulting `check.id` (`:150`). Section 20 explicitly retains this shape and the packet states the duplicate-F8-digest proposal is *not* being made, so this is **not** a contract violation.

The asymmetry is now three-way, which is worth stating: `upgrade:owner-bytes-preserved` is corroborated by the pinned `tree-delta` (`:168`); both home rows are corroborated by complete independent maps; `fresh:owner-bytes-preserved` and `fresh:displaced-equals-twin-changes` have no second machine signal anywhere. If `installer-recovery.cjs:341-345` or `:348` were weakened, the validator has nothing to compare against.

The open item the packet flags — "independent comparison mutation proof remains an open review item" — is exactly this. The harness-side mutant at `test.js:361-366` proves the *home* comparison is load-bearing; no equivalent exists for the fresh owner-bytes or displaced comparisons. Repair: extend `captureHarnessOracle`'s weaken path to a second decision string (`assert.equal(fs.readFileSync(path.join(fixture.target, file), 'utf8'), content, file)`) and assert the report flips. This is test-only, no shape change. Confidence: high.

### F5 — MEDIUM-LOW. The c8 config default is overridden but the Node-native disable directive is still unscanned

`expect-red.cjs:512-518` scans the two covered modules for `/(?:c8|v8|istanbul)\s+ignore\b/i` and refuses before spawn, tested for all three providers (`test.js:982-1001`). `--config=<fresh {}>` is spliced ahead of c8's argv (`:562`) and asserted (`test.js:1020-1022`), which per the packet overrides c8's find-up default.

Not covered: Node's own `/* node:coverage disable */` and `/* node:coverage ignore next */` forms. The packet states these "are not yet established" as reachable through c8's V8 consumption. I cannot settle that from this packet — it depends on whether Node applies the directive to the raw V8 coverage JSON that c8 reads via `NODE_V8_COVERAGE`. If it does, a single comment in `install-transaction.js` silently manufactures the 100% figure the gate depends on.

Repair: add `node:coverage` to the existing alternation at `:514` — one token, no behavior change if the directive is inert, closes the hole if it is not. Confidence: low on reachability, high that the repair is free.

### F6 — LOW. `commandFor` mutates its return value, which `main` then splices

`commandFor` returns `args` (`:480`), a fresh array from `command.split(' ')`, and `main` mutates it at `:561-562`. That is safe today because `commandFor` is called once per `main` invocation. But `test.js:1285-1290` calls `commandFor` directly and inspects the result, and `:1288` asserts `coverage` contains `--include=bin/lib/install-transaction.js` — if a future edit caches the parsed command, the splice would corrupt the cached vector across invocations.

Repair: `command.splice` on a copy, or freeze the return. Defense-in-depth only. Confidence: high that it is currently safe.

### F7 — LOW. `tapFramingProblems` accepts an optional `# Subtest:` line, weakening the framing pin

`:328-330` treats the `# Subtest: ` line as optional: if present it must match, if absent the loop proceeds. A reporter that emits subtest lines for some cases and not others passes. Given the packet's claim that this is real captured TAP from `node --test --test-reporter=tap`, the optionality exists to tolerate version drift — reasonable — but it means the framing pin is weaker than the surrounding exactness suggests.

Repair: require all-or-none across the 51 cases (count subtest lines; require 0 or 51). Confidence: medium; depends on unsupplied fixture bytes.

### F8 — LOW. `recoveryObservation` still returns `undefined` for unknown ids

`:180-181`. A forged row `{scenario:'fresh', id:'unreviewed', kind:'acceptance', ok:true}` with no `evidence` field satisfies `isDeepStrictEqual(undefined, undefined)` at `:298`, so only `expectedKeys` (`:293`) rejects it — a single point of failure, which is precisely what mutant #2 (`test.js:819`) demonstrates. Previously reported as F11; unrepaired. The packet states F11 sentinels are "not claimed necessary," which I accept as a deliberate scope decision. Repair remains: return a unique non-equal sentinel object. Confidence: high.

### F9 — LOW. Two live `longTest` cases share a memoized capture, so a failure in the first masks the second

`captureRecovery()` (`test.js:81-94`) memoizes into `liveRecovery`. If the first `longTest` (`:411`) throws inside `captureRecovery`, the second (`:418`) re-enters and re-spawns a fresh 180 s acceptance run rather than reusing a cached result — doubling wall time on failure and producing two independent real installs. Minor operational cost, not a correctness defect.

### F10 — LOW / evidence gap, not a code defect

The packet is explicit and I accept its framing: native win32 Node 24.20.0 only; no Node 22, Linux, or macOS acceptance; CI last 18 jobs zero steps. The per-platform code that would differ is reachable and real — `identity` at `:135-136` and `:189-190`, the `path.win32`/`path.posix` selection at `:372`, the darwin NFC+lowercase rule at `:377`, and the Windows reserved-device-name regex at `:200`. Injected-platform controls (`test.js:490-503`, `:533-544`, `:762-770`) exercise the judge's logic on all three platforms, which is a genuine portability control for the **validator**; they prove nothing about c8's actual summary key spelling or the harness's real behavior on those hosts.

Also unestablished from this packet: whether the focused-GREEN claim survives the pending full coverage/full-project rerun on current bytes. The packet says that rerun is required and has not happened. That is correctly flagged, not concealed.

---

## Answers to the framing questions

**Does any additional regression still pass?** I found no reproducible one in the home-state or target-tree dimensions. The two remaining blind spots are narrow: `fresh` nested target damage beyond the two owner files and the ten top-level names (unchanged from the prior review, and defensible because the fresh scenario's `new-equals-twin-residue` pins the full residue delta), and non-`Rollback `-prefixed false output lines (`installer-recovery.cjs:250`).

**Are the 13 known failures correctly bounded?** Yes. `RECOVERY_REQUIRED_FAIL` (`:101-106`) and `RECOVERY_REQUIRED_PASS` (`:95-100`) are enforced by independent loops (`:312-319`) with contradictory requirements, so listing a safety row in both cannot launder its failure. The 14/13 split matches the fixture and the approved contract.

**Is the approved runtime ownership respected without demanding literal cache equality?** Yes. Exactly four directories and one regular file, creation-or-identical for the directories, creation-or-update-as-regular-file for the file, both digests reported, no deletion/type/symlink/descendant exemption, Windows-only. The six damage controls plus six runtime-substitution controls (`test.js:306-316`) cover the negative space.

---

## Required before PASS

Blocking: none. No finding above reproduces a safety regression in the current bytes.

Recommended before merge, all test-local or one-token: **F4** (second harness comparison mutant — closes the packet's own stated open item), **F5** (add `node:coverage` to the ignore scan), **F1** (set-equality in `assertMovedListsFiles`).

Returns to the owner, not authorized here: **F2** (identity rename changes the approved 27-row inventory).

Advisory: **F6**–**F9**.

This verdict covers the supplied bytes only. It is not acceptance of the unimplemented transaction, not acceptance of the unchanged installer wrapper or unsafe lock, not approval of P07, and not a release judgment. The 13 failing rows record known, reviewed product defects; nothing here establishes those properties as safe.
