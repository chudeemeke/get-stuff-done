**Verdict: PASS** (bounded fixture experiment; single initial run per case, one correction budget).

I reviewed the complete `probe.rs`, `supervisor.cjs`, and `README.md` against approval-contract, safety, and false-PASS criteria, with focus on timeout settlement and output-to-claim wiring. The four prior NOT-PASS findings are materially resolved and I found no new blocker.

**Prior findings confirmed corrected**
- *Per-claim predicates:* `fill(...)` and `setClaim(...)` now use distinct selectors keyed to unique detail flags (`outsideDamageDetected`, `aliasMismatchDetected`, `lostOwnerWriteDetected`, `forbiddenDescentDetected`, `movedBoundaryViolation`, `kind==='ancestor'/'target'`). No blanket predicate remains; each unsafe/positive selector matches an event actually emitted in the corresponding phase.
- *Guarded owner-write:* `ownerWrite()` writes then reads back and emits `success`/`error`; `setClaim('owner-file-write-preserved', ow.preserved, ...)` refutes on non-preservation. Genuine assertion, not assumed.
- *Timeout/cleanup race:* `safeRemove` is gated on `allClosed && settled && remaining()>0`. `allClosed` requires every child `closeObserved`, so no live child races the snapshot/removal. `remaining()` is recomputed after removal; overrun forces `cleanup.complete=false` → `valid=false` → `unverified`. Fail-safe.
- *Native arguments:* Parent (`CreateFileW` access `1048737`/`0x001000a1`, share 3, disp 3, flags `35651584`/`0x02200000`) and guard (`NtCreateFile` access `1048737`, disp 1, options `2097185`) are now separate and match the probe exactly. Create (`1114370`, options `2097248`, disp 2) and inspect (`1048705`, disp 1) also match. Volume query outputs (`filesystem`, `serial`, `flags`, `maxComponent`) are emitted.

**False-PASS gate is sound**
`valid` requires `!failed`, source+binary stability, `allClosed`, `cleanup.complete`, `filesystemEvidence.filesystem==='NTFS'`, and every row’s positive `api-success-observed` + unsafe `violation-observed`. `verdict` then downgrades to `unverified`/`refuted` on any non-observed/refuted claim. Coarse action-based positive selectors (`['create','remove']`) are backstopped by explicit `expect(...)` checks on readback content, native `inspect` outcome, and NTFS enforcement in the probe, so a refused-but-selected event cannot yield PASS. Any unset claim defaults to `unverified`. NTFS evidence is captured pre-`ready` during the positive run.

**Approval-contract enforcement is correct**
- One-run-per-case: a case already at non-`unattempted` re-enters the correction gate, which throws unless a single preregistered `reviewed-probe-defect` correction (`correctionCount===1`, matching `caseId`, unconsumed, non-hard-stop `stopReason`, referencing an existing superseded run) is present. Second correction forbidden; `consumed` flips.
- No auto-retry: hard stops (`timeout`/`refuted`/`missing-positive`/`toolchain`) are excluded from correction eligibility and `index.stopped` halts serial progression; `process.exitCode=1`.
- Scope containment: junctions are unlinked via `lstat`+`unlink` without traversal; `safeRemove` boundary-checks against `runs/`; all fixtures (incl. `outside`) are inside `runRoot`. Private-env homes replace all identity/toolchain vars, `RUSTUP_AUTO_INSTALL=0`, `windowsHide`. Build precedes the measured window. Owner errors carry libuv codes; native events carry NTSTATUS/Win32 numeric+hex — correctly distinguished (`codeDomain`).
- Protocol: probe `ready`/`done` barriers pair with supervisor `command`/`barrier`; `exit` correctly skips the `done` barrier and `close()` awaits only `closePromise` with `exitCode===0`. Retained-owned-file guard present on probe exit; supervisor cleans up its owned file on every branch before close.

The `-effect-recorded` claims (owner/ancestor rename, guard-exit retry) always resolve to `mechanism-observed` by design — they record the observed effect, not enforcement — consistent with the README preregistration and the mandatory manual map review. Not a false PASS.

**Advisory refinements (non-blocking)**
1. `report.cleanup.complete=remaining()>0` re-evaluates the 180s wall after `safeRemove`; a healthy short run whose cleanup happens to cross the deadline (clock jitter) would be marked `unverified`. Consider timing cleanup independently of the case wall so only genuine overruns fail.
2. The per-child 60s `timer` in `native()` is not `unref`’d; harmless given `child.kill()`, but unref would avoid holding the loop on an anomalous non-close path.
3. Tighten positive selectors to additionally require `outcome==='success'` (defense-in-depth beyond the existing `expect` backstops).
4. `stderr` is embedded into every `process-exit` detail (bounded 64 KiB) — fine, but truncation marker would aid receipt readability.

No smoke run, retry, warning suppression, or scope-expansion is introduced. Root-bootstrap and adversarial sibling-alias identity remain explicitly unproved, as required. Ship to the single initial run.
