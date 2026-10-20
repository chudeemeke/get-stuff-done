# Cold review — P07 prerequisite mechanism decision (section 21)

**Verdict: PASS WITH CHANGES.**

The *direction* is right and should be approved: refusing to commit a native production helper on citations alone, and buying a bounded falsification study first, is the correct response to the section 13/14 gap. Several boundary choices are unusually disciplined and should be preserved verbatim — no caller-provided target path/command/PID/timeout/expected-result/skip switch; barriers over sleeps and marker polling; before/after source hash binding; complete home maps with **no** cache exclusion glob; "a timeout is never liveness proof"; explicit UNVERIFIED-and-stop for absent native hosts.

The *boundary text as written is not approvable*. It is not yet the smallest useful step, its closed report schema contradicts its own prose, its cost controls (platform set, stop rule) are unenforceable, and it re-creates two failure modes this project already paid to fix (§17 lint relocation, §19→§20 home-isolation). Findings 1–12 must be resolved in the packet before any study work begins; they are text-level corrections, not new research.

This review is packet-only. I executed nothing, opened no file, and verified no source claim. See "Unverified premises" below.

---

## Blocking

**1. The platform inventory is unbounded on paper and Windows-only in practice; the cost/benefit is therefore misstated.**
"Each promised environment" is never enumerated, yet the same packet excludes remote execution, CI cannot run (18 zero-step jobs, no-push condition), and §3/§13 make Linux a *product* promise. As written, the study's realistically obtainable output today is win32 fixture evidence, while the containment question that drives the portable production design stays UNVERIFIED on the platform that matters equally. Enumerate the exact environments with expected status now (e.g. win32/NTFS local = attempt; WSL2 ext4 and WSL-shared path = attempt if present, else explicit gap; native Linux/macOS = UNVERIFIED-now), and state on the face of the approval that **no production P07 API may be approved from Windows-only fixture evidence**.

**2. The stop rule — the study's only real cost control — is ambiguous.**
"One complete candidate pass and at most one focused correction/recheck per available native platform" does not say: whether "one candidate" is per platform or total; whether a FAIL of the first candidate authorizes the second; or whether a *probe/supervisor defect* consumes the single correction. Define: corrections are for supervisor/probe defects only and are unlimited-but-logged; any change to the **candidate design** terminates the study and returns to the owner; a candidate FAIL returns to the owner rather than silently starting candidate two.

**3. The report schema contradicts the prose that governs it.**
The schema is declared closed ("all keys present and no additional keys"), but the prose requires content with no key to live in: "every report names the tested scope and **non-claims**"; the negative-control observation; build provenance; timings. Under a closed schema those requirements are unsatisfiable. Fix the schema to include them explicitly.

**4. The claim inventory is undefined — repeating the exact defect P03/P04 already solved.**
`claims: [{ id, ... }]` accepts any ids. The ratified principle in §12/§16 is a reviewed inventory held as a constant, with completeness and cardinality checked, never learned from the output being judged. Fix the same way: a fixed claim-id set per scenario, agreed before execution; a missing or unknown claim id forces UNVERIFIED; extra claims reject.

**5. Nothing in the schema records the intentionally-unsafe control, so PASS is reachable without it.**
The prose demands one unsafe control per guarantee observed to violate *before* accepting the candidate observation — the correct discipline — but `claims[]` has no control field. Add a required per-claim control record (control id, observed violation, event sequences); its absence forces UNVERIFIED. Add the mirrored **positive** control too: proof the native API was actually invoked successfully (handle value / raw OS error code) before a "refuted" is accepted. Hand-written `extern "system"` declarations for LockFileEx/NtCreateFile/openat2 without a crate are easy to get subtly wrong, and a mis-declared signature currently records as mechanism refutation.

**6. "A timeout fails the case" conflates environment failure with mechanism refutation.**
This host has an unresolved native timing flake on record (§20: protected-DACL case hit a 10000 ms PowerShell timeout; root cause explicitly unproven; CPU 90–91 % noted as context, not causation). A barrier-synchronised concurrency experiment is precisely where that recurs. A false "refuted" would wrongly kill a viable candidate and push delivery toward refusal-only. Require `unverified(timeout)` as a distinct status from `refuted`, and capture host load/concurrency conditions in the report.

**7. The compiler's own home is not isolated, and the first run will fail closed on it.**
The private-home policy redirects APPDATA/LOCALAPPDATA/XDG_* and TEMP/TMP, but not `CARGO_HOME`/`RUSTUP_HOME` (nor rustc's temp/incremental output). Meanwhile `ownerState` demands complete outside-target maps with **only** the fixture target and compiler-output directory excluded. Compiler artifacts in the observed home will therefore fail the comparison — creating exactly the pressure to add an exclusion glob that §20 forbids. Fix by either (a) performing the build outside the observed window with recorded provenance, or (b) redirecting the toolchain variables explicitly before the before-snapshot, same as §20's mixed-case alias handling.

**8. The study's source location re-creates the lint problem just fixed at owner cost.**
§17 required an owner-approved relocation of a 1,074-file tree *out of* `.planning/evidence/` because full lint reported 684 errors from it, and the owner-approved lint extension deliberately enumerates only two CJS paths. A new `supervisor.cjs` plus `README.md` under `.planning/evidence/p07-native-qualification-2026-09-20/` walks straight back into that, and §11 additionally notes `scripts/lint-docs.js` discovers tracked files only. Decide the location and the expected gate output before approval, on the explicit condition that **no lint configuration change is requested**.

**9. Section 21 silently raises an already-approved bar on refusal-only.**
"Do not implement an always-refuse lock and call automatic recovery done," plus the table rating refusal-only "insufficient," conflicts with §7 ("If no safe supported takeover exists, implement the accepted explicit refusal behavior") and §14 ("otherwise truthful refusal… an owner-visible trade-off"). The correct reconciliation is structural, and the packet nearly reaches it but does not state it: **containment is orthogonal to takeover**. Containment is unsolved under *every* option, refusal-only included; takeover policy is decidable by the owner today. Re-frame the study as containment + liveness evidence, not as a precondition that makes automatic takeover mandatory.

**10. There is no owner decision rule for a PASS, so the study may be evidence that cannot change the decision.**
The same packet rates an immediate native production helper "Premature" on packaging/ABI/distribution grounds for a *reduced skin whose thesis is reduced maintenance*. If that objection survives a PASS, the study's positive branch buys nothing. State before work begins what PASS / FAIL / UNVERIFIED each cause, including the packaging-cost envelope the owner would accept for a shipping native component. A FAIL branch is already defined; the PASS branch is not.

**11. Scenarios 3–4 omit the decisive containment case, which appears only in the closing deliverable list.**
"A retained directory moved outside the current pathname" is named in the wrap-up but is not a scenario or a claim. This is the crux: a POSIX dirfd survives *ancestor* renames but follows the directory itself out of the tree, and on Windows the retained-handle guard changes what the owner can do to that directory. Promote it to an explicit numbered claim with an expected status, or the report can reach PASS while the actual open question is untested. Scenario 3 as written tests parent replacement only.

**12. Two required outcomes are missing from the study's deliverables.**
(a) **Collateral impact on ordinary owner operations.** The CreateFile candidate works by *denying* delete/rename sharing; a guard held across the install window can make the owner's own rename/move/backup of the target or an ancestor fail. That is a product trade-off under the authority's owner-edit protections and must be measured now, not discovered at P19. (b) **Post-exit release delay.** The packet's own LockFileEx citation says release after holder exit can be delayed and does not prevent mapped-view access. Require an explicit measurement and a claim on whether unattended recovery can be blocked for an unbounded interval — that is the precise failure mode OS-held ownership is supposed to remove.

**13. Disclose the shipped capability-lock exposure before prioritising this study.**
Per §21's own reading, `dist/gsd-core/bin/lib/capability-lock.cjs` uses hostname/start-time heuristics, treats a missing hostname as local, and carries a 600000 ms deadman policy — and it ships. `install-transaction.js` states in its own header that nothing requires it yet. Approving a native study for currently-unreachable code while a heuristic lock ships is a prioritisation the owner should make knowingly. State the capability lock's reachability and user-facing exposure in the approval packet. Deferring it to P21 may still be right; deferring it undisclosed is not.

---

## Should fix

**14. `posix-descriptors` conflates Linux and macOS, and "Windows/Linux/macOS delivery" conflicts with §3.** `openat2`/`RESOLVE_BENEATH` has no macOS equivalent; §3 makes macOS CI-only, not a promised install target. Split the candidate into per-platform variants with their distinct primitives, and correct the delivery claim.

**15. Scenarios 5 and 6 substantially duplicate the planned P08/P09 RED matrix in §7** (publication faults, repeat release, same-PID/time acquisitions) and are decidable in the portable layer. Either justify why handle-relative publication/release genuinely differs, or defer them and shrink the study.

**16. The probe-host choice is asserted, not argued.** PowerShell/.NET `FileShare.None` and `flock(1)` are already-installed primitives covering several scenarios with no compiler. §19–20 give a strong reason to avoid PowerShell (cache writes, timeout flake) — record that reasoning, or the Rust build is unjustified cost.

**17. One fixed `report.json` cannot hold one-scenario-per-run output** (up to 16+ runs per platform overwrite each other). Require per-run receipt naming bound to runId/candidate/scenario plus an index. Also hash the **compiled binary** and record the exact build command/flags: source hash alone does not bind executed behaviour.

**18. Under-specified vocabularies.** `environment.filesystem` determination method; `events[].actor/action/outcome` value sets; and scenario 1's "alias paths" (Windows: 8.3 short name, `\\?\`, UNC vs drive letter, case; POSIX: symlink, bind mount). Enumerate alias forms per claim so an untested alias is not implicitly covered.

**19. State the report validation method** — documented rules plus human review, *not* a third expect-red-style validator. Otherwise scope quietly grows into building another gate.

**20. Reconsider the top-level verdict vocabulary.** This project has a documented history of green artefacts being read as product acceptance. `mechanism-observed-in-fixture` / `refuted` / `unverified` is safer than `PASS` at the report root, and matches the already-correct `claims[].status` vocabulary.

---

## Optional

**21.** Mark scenario 8 as refutation-only by construction so a scenario-level verdict is not misread as quiescence evidence.
**22.** State plainly that the rejected rename-before-verify takeover remains in tree during the study and is unreachable from `bin/install.js`, so deferral carries no live risk.
**23.** Name the receipt index / HANDOFF / CONTINUE updates as explicit study deliverables.

---

## Recommended narrower shape (answering "is this the smallest useful step?")

**No — it bundles a decidable policy question with an undecidable mechanism question, and pays full framework cost for one executable platform.** A smaller sequence that reaches the same decision:

1. Owner decides takeover policy now (automatic takeover is not provable today; refusal-only is already an accepted fallback per §7/§14). This is decidable without any native evidence.
2. Approve a **containment-only** Windows spike: scenarios 3, 4 and the retained-moved-directory case from finding 11, each with its unsafe control and its positive API-invocation control. One candidate, one platform, fixed claim inventory.
3. Defer the full eight-scenario framework until Linux execution is actually available, and consider whether a bounded subset of the P07 contract (acquisition identity, terminal release semantics, refusal report shapes) can be approved independently so P08 is not idled behind native evidence it does not need.

If the owner prefers the full study, findings 1–12 still apply unchanged.

---

## Unverified premises (owner should spot-check; I verified none)

Presence and version of a local Rust toolchain; the repository search finding no existing lock adapter in `bin`/`scripts`/overlay; every quoted property of `dist/gsd-core/bin/lib/capability-lock.cjs` (line 195, hostname handling, 600000 ms deadman); whether `.planning/evidence/` is linted and `.claude/` excluded; whether WSL2 is available on this host. Finding 13's priority argument depends on the capability-lock claims being accurate.

## Preservation check

Section 21 does not touch the validator, harness or lock source, does not re-open P03/P04/P05 approvals, requests no lint-rule or severity change, and correctly keeps P08/P09 and preflight/snapshot unauthorised. The requested allowlist extension is concrete and bounded to one new directory plus the already-allowlisted plan/brief/continuity files. On those axes it is clean; no re-approval of validator work is being sought.

*No files were written and no tools were run, per the no-edits instruction.*