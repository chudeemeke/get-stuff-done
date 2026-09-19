VERDICT: PASS WITH CHANGES

### Findings

#### 1. BLOCKER — Ask 6: Digest Taken from Snapshot Copy Destroys Verification Truthfulness
- **Claim:** The pre-image digest is "taken from the snapshot copy, so the index describes exactly what can be restored" (Readings Table, packet lines 438).
- **Evidence:** Packet Section 2, lines 153–154 (Truth 4), lines 203–205 (Step 4), lines 246–250 (Step 9), and line 438.
- **Critique:** Taking the SHA-256 hash from the snapshot copy rather than the live source file breaks Truth 4 ("A rollback message is a claim. It is printed only after verification and says exactly what was verified"). If a disk error, bit rot, truncation, or I/O failure corrupts the snapshot copy during the pre-image phase, hashing that copy records the corrupted bytes as the ground truth. During rollback (Step 8c), the corrupted file is copied into the live target. In Step 9, verification compares the live file against the index hash and reports a successful match, printing `Rollback applied... and verified` while owner data has been silently corrupted.
- **Required Change:** The pre-image hash must be calculated from the source file at capture time (either by streaming the source file concurrently to the SHA-256 hasher and snapshot destination, or by hashing the source file directly). The snapshot copy must then be re-hashed in Step 8(a) against the source hash to verify copy integrity before any restoration occurs.

---

#### 2. BLOCKER — Ask 4: Acceptance Assertion Blind Spot on Protected Names and Leftover State
- **Claim:** Acceptance assertion replaces the zero-residual check with: "no residue outside Protected names; every root byte-identical to its pre-image; the quarantine holds exactly the residue; the message and the exit code are asserted" (packet lines 354–358).
- **Evidence:** Packet Section 2, line 170 (Protected class definition), lines 262–264 (Step 9), and Section 4, lines 845–853 (`tests/acceptance/installer-recovery.cjs`).
- **Critique:** Blanket exemption of Protected names (`gsd-install-transaction/`, `gsd-install-transaction-retired-*`, `gsd-install.lock`, `gsd-install.lock.stale-*`, `gsd-local-patch-history/`) creates two major verification holes:
  1. Any rogue or unintended write by the upstream child into a path matching a Protected name (e.g. creating files inside `gsd-local-patch-history/` or `gsd-install-transaction/`) is ignored and treated as passing.
  2. Step 9 explicitly specifies that upon an `applied` outcome, `journal.json` is deleted first and `snapshot/` second, leaving only `quarantine/` and `moved.txt`. An assertion that merely ignores everything under `gsd-install-transaction/` fails to verify that `snapshot/` and `journal.json` were actually deleted.
- **Required Change:** The acceptance assertion must explicitly validate the internal contents of Protected directories:
  1. Under `gsd-install-transaction/`, assert that `snapshot/` and `journal.json` do not exist, and that only `quarantine/<txid>/` and `moved.txt` remain.
  2. Assert that no files were created under `gsd-local-patch-history/` other than the expected generation.
  3. Assert that the files in `quarantine/` match the independent `upstreamWriteTrace` captured by the test harness preload.
  4. Non-root top-level files (such as `owner.txt`) must be explicitly asserted as preserved.

---

#### 3. HIGH — Ask 6: Future-Dated Journal Treated as Stale Silently Retires Fresh State
- **Claim:** A journal with a last-updated time in the future is treated as "Stale, so retired. Retiring keeps everything; an automatic rollback mutates" (Readings Table, packet line 435).
- **Evidence:** Packet Section 2, lines 268–270 (Step 10), line 435; Section 2, lines 456–457 (Owner Decision D4).
- **Critique:** Step 10 defines stale as "last updated more than 60 minutes ago." A future timestamp is an indication of system clock adjustments, NTP step synchronization, or timezone skew—not of an abandoned transaction older than 60 minutes. Under Step 10 (lines 285–286), retiring a transaction immediately leads to: "Then start a fresh transaction from the current state." If an active or recently interrupted transaction has a future timestamp due to clock skew, treating it as stale retires its state without completing recovery and immediately starts a fresh install that mutates the target.
- **Required Change:** A future-dated journal must be treated as an unresolvable anomaly. The installer must refuse to proceed (Exit 6) with an actionable error message naming the path, the recorded timestamp, and the current system time, instructing the user to verify system time before retrying.

---

#### 4. HIGH — Ask 6: Exit 6 for Argument Misuse Violates CLI Standards
- **Claim:** Refusals before the lock, including `--all`, exit with code 6 because "Step 9 defines 6 as every refusal before any mutation and 1 as 'failed and rolled back'" (Readings Table, packet lines 428–429).
- **Evidence:** Packet Section 2, lines 254–257 (Step 9), lines 428–429; Section 6, lines 961, 971–973 (`assertSupportedInstallMode`).
- **Critique:** Standard CLI design (and the repository's own CLI conventions) reserves Exit 2 for command-line syntax errors, invalid flags, and argument misuse. Exit 6 was approved specifically for environmental and preflight state refusals (lock held, child alive, cap limits exceeded, link roots, unreadable journal). Conflating argument syntax errors (`--all`) with preflight state refusals under Exit 6 breaks standard shell conventions and scripting expectations.
- **Required Change:** Revert argument validation errors to Exit 2. Restrict Exit 6 strictly to preflight state/environment refusals where arguments were valid but preconditions were not satisfied.

---

#### 5. HIGH — Ask 2: Guard Test Bypass Routes and Vacuous Positive Control
- **Claim:** An observed preload hooking `Module._load` and wrapping spawn entry points, asserting a one-entry loader allowlist, 12 bound names, and zero spawn events with four controls, reliably guards against child process execution (packet lines 368–381).
- **Evidence:** Packet Section 2, lines 368–381; Section 5b, lines 914–920 (`shell-command-projection.cjs`).
- **Critique:**
  1. *Loader bypasses:* `Module._load` intercepts CommonJS `require()` calls only. It does not intercept ECMAScript module dynamic imports (`import('node:child_process')`). Furthermore, `worker_threads` are not hooked; a child spawning a worker thread that loads `child_process` completely bypasses parent hooks. Native addons loaded via `process.dlopen` can spawn processes via libc `posix_spawn`/`fork` or Windows `CreateProcessW` without invoking Node's JS APIs.
  2. *Environment stripping:* If a subprocess executes `process.execPath` and scrubs `NODE_OPTIONS` (as shown in Section 5b, line 951 and Section 4, line 832), grandchild processes run uninstrumented.
  3. *Control vacuity:* The positive control ("a fixture child that does spawn must be detected", line 377) tests only the spawn wrap. It does NOT test the `Module._load` hook, does NOT test detection of an unallowlisted module loading `child_process`, and does NOT test detection of an unauthorized bound name.
- **Required Change:**
  1. Expand the guard preload to hook `worker_threads` and block `process.dlopen`.
  2. Expand positive controls to include: (a) a fixture requiring `child_process` from an unallowlisted module, and (b) a fixture accessing an unallowlisted 13th export from `shell-command-projection.cjs`, asserting that both fail the gate.
  3. Address ESM by asserting via static AST check or `--loader`/`module.register` hook that ESM imports of process APIs do not occur.

---

#### 6. MEDIUM — Ask 1: Missing Code Evidence for the 12 Bound Functions
- **Claim:** "The installer binds twelve names from it, all pure text projection (module lines 108 to 455), and none of `execGit`, `execNpm`, `execTool`, `dispatchGsdCommand` or `probeTty`" (packet lines 363–365).
- **Evidence:** Packet Section 5a, lines 881–894 (`dist/bin/install.js`); Section 5b, lines 909–923, 928–996, 1001–1075 (`shell-command-projection.cjs`).
- **Critique:** Section 5a confirms that `dist/bin/install.js:8-21` destructures exactly 12 names. However, Section 5b provides only lines 50–60, 456–520, and 555–625. Lines 61 to 455 of `shell-command-projection.cjs` are omitted from the packet. It is impossible to verify from the packet that those 12 functions are purely text projection and never call spawning functions (like `execTool` or `probeTty`) directly or indirectly. Furthermore, Section 5a shows only lines 1–30 of `dist/bin/install.js`; the packet notes (lines 365–367) that 12 other `require(path.join(_gsdLibDir, ...))` calls exist, which are not visible in Section 5.
- **Required Change:** Provide the function definitions of the 12 bound names from `shell-command-projection.cjs` (lines 108–455) and an AST export-reachability audit showing zero call paths to `node_child_process_1` or any spawning helper.

---

#### 7. MEDIUM — Ask 2: Deriving Exactly Twelve Bound Names at Runtime Is Brittle
- **Claim:** The guard test asserts that "the installer binds exactly the twelve known names from it" (packet lines 373–374).
- **Evidence:** Packet Section 2, lines 373–374; Section 5a, lines 881–894; Section 5b, line 914.
- **Critique:** Observing destructuring access at runtime via a `Proxy` trap on module exports is brittle across Node.js versions and toolchains. Any standard property access performed by module loaders, TypeScript interop helpers (`__esModule`), debugging tools, or inspectors (e.g. `default`, `Symbol.toStringTag`, `then`) registers as a property access and triggers false-positive test failures.
- **Required Change:** Specify that the 12-name binding assertion is verified via static AST inspection of `dist/bin/install.js` import/destructuring sites, or filter runtime Proxy tracking to ignore engine/interop symbols (`__esModule`, `Symbol.*`, `default`).

---

#### 8. MEDIUM — Ask 6: Target Directory Creation Before Lock Violates Exit 6 Invariant
- **Claim:** If the target directory is absent on fresh install, it is "Created after `isSafeToClean` and before the lock; removed on a refusal if this run created it and it is empty" (Readings Table, packet line 431).
- **Evidence:** Packet Section 2, lines 178–181 (Step 1), line 256–257 (Step 9), line 431.
- **Critique:** Step 9 establishes that Exit 6 "always means nothing was touched." Creating the target directory before acquiring `gsd-install.lock` introduces a filesystem mutation prior to mutual exclusion. If the installer is killed (SIGKILL) or encounters an error between directory creation and refusal, or if another process writes to the directory in that window, an untracked directory remains on disk, violating the guarantee.
- **Required Change:** The target directory must only be created if lock acquisition succeeds, or the lock must be acquired using a file descriptor / directory handle mechanism that does not mutate the target tree prior to single-writer exclusion. If cleanup on refusal fails or is interrupted, the run has mutated state and cannot cleanly claim Exit 6.

---

#### 9. MEDIUM — Ask 3: Rejection of Process-Tree Killing Holds for 1.9.1 but Premise Must Be Clarified
- **Claim:** Killing the child's process tree is rejected because the wrapper has no timeout path and the child is dead before rollback (packet lines 334–338).
- **Evidence:** Packet Section 2, lines 268–276 (Step 10), lines 334–338; Section 5b, lines 953–961, 1067–1074.
- **Critique:** The rejection's original supporting premise ("the child never requires `child_process`") was false. While synchronous spawns (`spawnSync`, `execFileSync`) block the direct child while it is alive, they do not guarantee that a grandchild process (e.g. a daemonized background process spawned by git or npm) terminates when the child closes. Furthermore, if the wrapper is killed mid-install and a later run recovers under Step 10, the check `process.kill(journal.childPid, 0)` checks ONLY the direct child pid; it cannot detect an orphaned grandchild that may still be writing to the target directory.
- **Required Change:** The owner should NOT be asked to reopen process-tree killing for 1.9.1, because the guard test proves that zero spawn events occur during install (meaning no grandchildren exist). However, the design note must explicitly state this rationale: process-tree killing is rejected for 1.9.1 because zero child processes are spawned, but if an upstream bump ever triggers a spawn event, process-tree management must be reopened as mandated by line 379–380.

---

#### 10. LOW — Ask 5: Portable Implementation of Restore Failure for Acceptance Mutation Check
- **Claim:** The mutation check requires a second acceptance scenario: a restore forced to fail, expecting `Rollback incomplete`, exit 4, and a retired directory (packet lines 418–420).
- **Evidence:** Packet Section 2, lines 415–420; Section 4, lines 792–824 (`installer-recovery.cjs`).
- **Critique:** Attempting to force a restore failure via operating system permissions (`chmod 0444` on POSIX fails to block directory modifications on Windows) or native file locks (PowerShell `FileShare.None` is Windows-only) causes cross-platform flakiness in CI.
- **Required Change:** Force the restore failure using the existing preload mechanism in `tests/acceptance/installer-recovery.cjs`. By setting an environment variable (e.g. `INJECT_RESTORE_FAILURE=1`), the preload's wrapped `fs.copyFileSync` can deterministically throw `EACCES` when copying from `snapshot/` to the live target. This guarantees identical, zero-flakiness behavior across Windows, macOS, and Linux without OS-specific helpers.

---

### Questions the Owner Must Answer

1. **CLI Argument Misuse Exit Code:** Should CLI syntax and argument misuse errors (e.g. `--all`) exit with code 2 to conform with repository CLI standards, or with code 6 as proposed in the readings table?
2. **Future-Dated Journal Disposition:** If a journal's `last-updated` timestamp is in the future (due to clock skew or NTP adjustment), should the installer refuse to run (Exit 6) to avoid race conditions, or retire the transaction and proceed with a fresh installation?
3. **Pre-Lock Target Directory Creation:** Should the installer create the target directory prior to acquiring the lock on fresh installs (with best-effort removal on refusal), or must the guarantee that Exit 6 touches zero filesystem state remain absolute?
4. **Authority of Pre-Image Digest:** Confirm that the pre-image digest must represent the source file as read from disk (streaming source to digest and snapshot), rejecting the proposal in Row 10 to hash only the snapshot copy.
