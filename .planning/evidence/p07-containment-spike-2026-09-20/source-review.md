# Review verdict: **NOT PASS** (pre-execution source review)

Reviewed: the supplied `probe.rs`, `supervisor.cjs`, `README.md` snapshot against §21 as quoted. No tools used; nothing compiled or executed. Everything below is a source-level finding with a concrete counterexample. Because no case has run, all of this is correctable without touching the single defect-correction allowance — that is the main reason to stop now rather than after case 1.

---

## P1 — Must fix before the first supervised run

**1. The evidence directory is never created; the first run dies before the `try`.**
`evidence` is used at `fs.writeFileSync(path.join(evidence, \`${runId}-build.json\`), …, {flag:'wx'})`, which sits **above** `try {`. There is `mkdir(buildDir)` and `mkdir(runRoot)` but no `mkdir(evidence)`. The `fs.existsSync(indexFile)` fallback shows the author expected a possibly-absent index, so the directory's existence is an unstated precondition. Counterexample: `.planning/evidence/p07-containment-spike-2026-09-20/` absent → `ENOENT` → `main().catch` prints one line, `exitCode=1`, **no receipt, no index entry, no `cleanup` record**, and `.claude/p07-.../build/<uuid>/` (with its private home tree) is left on disk. Fix: create the evidence directory recursively before the build-log write.

**2. `-D warnings` will very likely fail the build on never-read FFI fields.**
`dead_code` reports "field is never read" for fields that are only written. Never read anywhere in `probe.rs`: `UnicodeString.{length,maximum_length,buffer}`, all six `ObjectAttributes` fields, `IoStatus.{status,information}`, `FileTime.{low,high}`, and `FileInfo.{creation,access,write,size_high,size_low,links}`. `repr(C)` and FFI use do not exempt them. With `-D warnings` this is a hard error, so `build.status!==0` → `expect(build.status===0…)` → the case is recorded `unverified` and `index.stopped=true` (see finding 6) for a lint, not for a mechanism. Minimal fix: one crate-level `#![allow(dead_code)]` (harmless if the lint does not fire; add `non_snake_case` too if the foreign-fn names lint on 1.98). Secondary: `-D warnings` makes *any* lint a study stopper — that is a deliberate choice, but it should be a conscious one.

**3. A genuine refutation is reported as UNVERIFIED (contract's negative branch is unreachable in parent-swap).**
In the parent-swap guarded block, after the `for(const point of …)` loop breaks with `proof=false`, the code unconditionally runs `const targetId=identity(guarded.target)`. Counterexample: the owner rename at `before-create` succeeds → `<runRoot>\guarded\ancestor\target` no longer exists → `fs.statSync` throws `ENOENT` → `catch` sets `failed` → **every** claim becomes `status:'unverified'`, `verdict:'unverified'`, `reason:"ENOENT: no such file or directory, stat …"`. `identity(guarded.alias)` dangles the same way after either rename kind. The owner would be told to name a missing tool/privilege/host when the correct answer is "the candidate was refuted, here is the counterexample."
Second instance: leaf-swap, if `FILE_CREATE` unexpectedly succeeds over the existing leaf (exactly the `leaf-replacement-preserved` violation), the probe retains `owned`, exits with `"exit with retained owned file"` and code 1 → `expect(childRow.exitCode===0)` throws → `unverified`, even though the counterexample is sitting in `events`.
Third instance: parent-swap, if the guarded `create` is refused, the later `cleanup` hits `owned.take().ok_or("no owned file")?` → child exit 1 → `unverified`.
Fix direction: decide explicitly which failures are `proof=false` (refuted) versus `expect` (unverified), and make every post-`proof=false` step defensive.

**4. `owner-file-write-preserved` has no guarded predicate — a false PASS by construction.**
The only guarded evidence is
`emit('owner','write','success',0,{phase:'guarded',ownerWritePreserved:fs.readFileSync(…)==='owner-updated'})`.
`proof` is never updated from it. Counterexample: all renames/junction attempts refused, aliases agree, `outside` map unchanged → `proof=true`; readback returns `owner-original` → the receipt contains `ownerWritePreserved:false` **and** `owner-file-write-preserved: mechanism-observed-in-fixture`, run verdict `mechanism-observed-in-fixture`. Also note the block is `if(proof)`-gated, so when proof is false this claim's own evidence is never collected yet it is still reported `refuted`.

**5. One `proof` boolean carries three claims.**
`for(const c of rows()){c.status=proof?…:'refuted'…}` gives all three claims of a case the same status and the same event range. Two contract violations: (a) "Refuted requires a concrete counterexample" — a leaf-type failure marks `owner-rename-effect-recorded` refuted with no counterexample of its own; (b) a claim with no assertion (finding 4) inherits a pass from unrelated assertions. Minimum fix: three named booleans/reason strings per case, each written only by the step that tests it.

**6. No correction/rerun path, and the index guard permanently locks a case.**
`if (index.stopped || index.cases[input.caseId].status !== 'unattempted') throw …` — after *any* non-success, including an environment-only UNVERIFIED that §21 says must **not** consume the allowance ("a pre-measurement missing/broken compiler or linker also returns UNVERIFIED and does not consume that allowance"), the same `caseId` can never be run again without hand-editing `index.json`. `correctionCount:0` is initialized and never incremented; `index.cases[caseId]` is overwritten on any rerun, so the required "superseded/superseding run IDs" survive only incidentally in `runs[]`. This is exactly the manual evidence mutation the immutability rule exists to prevent. Minimum fix: an explicit, recorded supersession field plus a gate that distinguishes "environment UNVERIFIED, rerun allowed once" from "attempted".

---

## P2 — Evidence fidelity and control validity (fix or record as a stated limitation before running)

**7. The `guards` open event misreports the parent handle's arguments.**
`event("open","success",0,"{\"label\":\"guards\",\"access\":1048737,\"share\":3,\"disposition\":1,\"options\":2097185}")` is emitted once for **two different opens**. The parent is opened by `CreateFileW(…, 0x001000a1, 3, …, 3, 0x02200000, …)` — disposition `3` (OPEN_EXISTING) and *flags* `0x02200000` (BACKUP_SEMANTICS|OPEN_REPARSE_POINT), not disposition `1` / options `2097185`. §21 requires "the exact access/share/create options" and "open/create event detail contains access/share/disposition/flags". As written, the receipt asserts NtCreateFile parameters for a CreateFileW call — the single most checkable fact in this spike is recorded incorrectly. Also: no identity (`volume/index`) is recorded for the parent handle, only the target.
(Everything else I checked in the constants is correct: `0x001000a1`=1048737, `0x00110102`=1114370, `0x00100081`=1048705, dir options `0x00200021`=2097185, file options `0x00200060`=2097248, disposition 2=FILE_CREATE / 1=FILE_OPEN, `attributes:0x40`=OBJ_CASE_INSENSITIVE, class `4`=FileDispositionInfo with a 1-byte BOOLEAN, `DELETE` present in the create mask so the disposition delete is legal.)

**8. `filesystemEvidence` is a literal, not the measured string.** The probe compares `filesystem!="NTFS"` and then emits a hardcoded `\"filesystem\":\"NTFS\"`. Functionally equivalent, but the contract's "names the native volume-query method/result" is better served by echoing the measured `{filesystem}` string and the raw `flags`/`max_component` it already retrieved.

**9. Owner-side `osCode` cannot carry a literal OS status.** `action()` records `error.errno ?? error.code ?? null` — a libuv errno (negative) or, in the fallback, a *string*. The Win32 code is lost, so `owner-rename-effect-recorded` / `ancestor-rename-effect-recorded` cannot distinguish `ERROR_SHARING_VIOLATION` (the candidate's effect) from `ERROR_ACCESS_DENIED` beyond libuv's `EBUSY`/`EACCES`/`EPERM` mapping. Node cannot do better; the receipt must therefore state this limitation explicitly rather than let "literal OS status codes" be implied.

**10. Two guarded "controls" are guard-independent, and one attack is never attempted.**
- `fs.symlinkSync(guarded.outside, guarded.target, 'junction')` over an **existing directory** fails with `EEXIST` on any Windows host, guard or no guard. It proves nothing and is asserted with `expect`, so it can only ever produce unverified. The real freeing operations — `rmdirSync`/`unlinkSync` of the held target — are never attempted under guard, although DELETE-share denial is precisely what should block them.
- `guarded.alias` is a sibling of `ancestor` and is covered by no handle; the guarded phase never repoints it, so `alias-same-object` passes only because the attack is omitted. If the receipt is to say "mechanism observed", it must say in the same breath that alias identity was checked non-adversarially and that the candidate cannot protect an alias outside its held subtree.
- Two unsafe detectors are self-overwrites that cannot fail: `write(owner,'owner-updated'); write(owner,'owner-original'); expect(read!=='owner-updated')` and the leaf equivalent. They induce the violation but validate nothing beyond read-back. (The junction-descent detector and the unguarded-rename detectors *are* genuine.)

**11. `fill()` attributes controls by phase, not by claim.** All three claims get identical `events` ranges and one blanket `violation-observed` / `api-success-observed`. §21 wants per-claim control identity plus its own sequence references. The `expect`s do prevent a fabricated `violation-observed`, so this is fidelity, not fabrication.

**12. The timeout path races cleanup against a still-running `work()`.** `Promise.race` does not cancel `work()`. After the 180 s rejection, `finally` kills children, snapshots `ownerState.after`, runs `safeRemove(runRoot)` and writes the receipt while `work()` may still be resuming on `write`/`mapTree`/`command`. (Its later rejection is swallowed by the race, so no crash — but `cleanup.complete:true`, `retainedPaths:[]` and the `after` maps can be wrong, and `report.events` can gain entries after the state snapshot.) Timeout is a first-class contract outcome; its receipt must be trustworthy. Minimum fix: a `cancelled` flag checked at each phase boundary, and cleanup only after `work()` settles.

**13. `guard-exit-effect-recorded` loses its required observation on the refuting path.** In moved-directory, `proof && action('rename', … 'after-exit')` short-circuits, so the mandated "retry outcome after actual guard-process closure" is never recorded when the case refutes. Likewise `proof && !renameGuarded('ancestor').ok` skips the ancestor attempt entirely once the target rename succeeded, so `ancestor-rename-effect-recorded` is marked `refuted` with zero observations of its own.

---

## P3 — Smaller, still concrete

14. `timing.deadlineMs:180000` excludes cleanup (contract says the case deadline includes it), while `start=performance.now()` is taken **before** the two 60 s `spawnSync` calls, so `elapsedMs` and `deadlineMs` have different origins; worst-case wall time is ~5 min.
15. `environment.bun` is `undefined` when `bun` is absent or is a `.cmd` (Node 22 rejects `.cmd` without `shell`), so `JSON.stringify` **drops the key** — the receipt then lacks a field §21 lists. Same for `build.error?.message`. Coerce to `null`.
16. `expectedOwnerWrites` is prose and is assigned only at the end of `work()`, so every failed run reports `[]` next to a non-empty `ownerState.after` delta. `targetState.after[phase]=null` conflates "missing", "replaced by a link" and "unreadable".
17. NTSTATUS is recorded as signed decimal only (`-1073741771`); include the unsigned hex so a reviewer can match `0xC0000035` without arithmetic.
18. `…filter(…).at(-1)` in the leaf loop lacks `?.` (the positive phase has it) → a `TypeError` instead of a named reason if the inspect event is missing.
19. `-C incremental=` buys nothing for a one-shot build and deepens already-long paths; the `bun --version` probe adds an unnecessary subprocess just before the window.
20. Linking `ntdll` (SDK `ntdll.lib`) is untested — your successful link was a minimal program. Because the *first* compile of `probe.rs` happens **inside** the supervisor, a link failure consumes a case slot and trips finding 6. Building `probe.rs` once by hand with the exact recorded command, and smoke-running the binary against a scratch fixture under `.claude/p07-containment-spike-2026-09-20/`, would de-risk findings 2 and 20 and the undocumented access requirements of `GetVolumeInformationByHandleW` on a handle holding only `SYNCHRONIZE|READ_ATTRIBUTES|LIST_DIRECTORY|TRAVERSE`. Confirm with the owner that a manual probe smoke test is not counted as the case's initial run.

---

## What I checked and found sound (do not rework these)

- FFI shapes match the published signatures: `NtCreateFile` parameter order/types, `CreateFileW`, `GetFileInformationByHandle` (field order matches `BY_HANDLE_FILE_INFORMATION`), `GetVolumeInformationByHandleW`, `WriteFile`, `SetFileInformationByHandle`, `CloseHandle`. `repr(C)` padding for `UNICODE_STRING`/`OBJECT_ATTRIBUTES` on x64 is correct; pointer-sized `IoStatus` matches the README's stated choice; `h as isize == -1` is the right `INVALID_HANDLE_VALUE` test; `Owned::close` with `mem::forget` correctly avoids a double `CloseHandle`; the `Drop` on the inspect handle runs before the `done` barrier, so the supervisor's subsequent `unlinkSync` is not racing a held handle.
- Barrier protocol has no hang path: every command emits `done`, `exit` breaks without one, child death/`error`/timeout all reject pending waiters, and the 64 KB stdout/stderr bounds and the 10 000-event cap are enforced before `emit`.
- `safeRemove` boundary (`absolute === boundary || !startsWith(boundary+sep)`) is correct, `lstat`-first, unlinks junctions without traversal, and is gated on `report.children.every(c=>c.closeObserved)` — uncertain closure retains the fixture as required. `mapTree` likewise never traverses a link.
- Input is genuinely closed (`argv.length===3`, exact key set, `schema===1`, `Object.hasOwn(IDS,…)`; numbers/strings/arrays/null all rejected before any fixture exists).
- Receipt field set matches §21 exactly, the nine claim IDs match the table exactly, the eight `nonClaims` match, `scope.aliases` matches, the `valid` gate correctly forbids `mechanism-observed-in-fixture` on drift/closure/cleanup/non-NTFS/control failure, and a non-NTFS volume aborts UNVERIFIED via the probe's own check.
- `privateEnv` removes the target keys case-insensitively (correct for Windows) before re-adding canonical names, and `rustc` is invoked directly from the toolchain `bin`, not a rustup shim; `--sysroot` derivation is right. Junctions (not symlinks) avoid any privilege requirement. Fixtures never leave `runs/<uuid>`, and `cwd:runRoot` pins the directory for the child's lifetime.
- The containment premise is plausible as written: a retained directory handle with `share=FILE_SHARE_READ|FILE_SHARE_WRITE` (no DELETE share) should make the owner's rename of the target *and* of the held ancestor fail, because the rename path must open with `DELETE`. That is a real, falsifiable test.

**Containment assumption to state in the receipt, not to fix:** nothing in the design protects `guarded.base`, `runRoot`, or anything above `ancestor`; the README says so, and the per-claim `reason` strings should not read as broader than "at and below the held ancestor, in this fixture."

**Condition to reach PASS:** fix P1 1–6 in a single pre-execution revision; fix or explicitly record P2 7–13 as stated limitations in README before case 1. P3 is optional. Since nothing has run, this revision is free of the one-correction budget — spend the budget on something you learn from an actual case, not on these.