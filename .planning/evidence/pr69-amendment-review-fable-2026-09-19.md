VERDICT: NOT PASS

Every required change is a text change to the amendment. None touches the eleven owner decisions. As written, the amendment repeats the same kind of mistake it set out to fix: it checked one site and then made a claim about the whole. It also rests one of its proof items on an outcome rule that the accepted note never defines.

I checked the composed files at `C:\Projects\get-stuff-done\dist`, read-only, and did not read the other review lane's output. Findings marked **[repo]** depend on that check. Re-verify them against `e235c9f2`, because that checkout may not be the branch the packet was cut from.

## Findings

### 1. BLOCKER (asks 1, 3, 7): "none that spawn" is true of one `require` statement and false of the installer's require graph

**Claim.** The "Guard test" paragraph says the installer "binds twelve names from it, all pure text projection ... and none of `execGit`, `execNpm`, `execTool`, `dispatchGsdCommand` or `probeTty`." It uses that to conclude the process-tree rejection still holds. The review record agrees: "the rejection's conclusion still appears to hold" (item 1 of the "Implementation planning: proposed amendment" section).

**What holds up.**
- Section 5a lines 8 to 21 destructures exactly twelve names, and none is a spawner.
- Section 5b confirms `node:child_process` is loaded at line 57 and used at lines 478, 489, 500 and 618.
- **[repo]** Inside `shell-command-projection.cjs` the only callers of the spawning functions are at lines 478, 489, 500, 581 and 618. Nothing in lines 108 to 455 reaches them, so "pure text projection" is true of the twelve.

**What makes the claim false as a statement about the installer. [repo]**
- `dist/bin/install.js:45` requires `worktree-base-ref.cjs`. That file holds the module at its line 26 and calls `execGit` at lines 310, 320, 328 and 332. The installer binds only `applyWorktreeBaseRef` and `readBaseRefFromSettings`, used at lines 12073, 12109 and 12115. The spawning code is loaded but not called from what I saw.
- `install.js` lines 377 to 379 require `model-resolver.cjs`, which requires `config-loader.cjs` at its line 26. `config-loader.cjs:169` runs `git check-ignore` inside `isGitIgnored`, called at its line 567 when config loads. Whether this fires depends on the working directory, and the acceptance fixture's working directory is inside a git work tree.
- `install.js:433` requires `capability-loader.cjs`. Its line 418 requires `capability-consent.cjs`, whose line 53 requires `capability-lock.cjs`. That file destructures `execTool` at line 45 and spawns `powershell` (line 195) or `ps` (line 201) to read a pid's start time. Consent locking calls it at `capability-consent.cjs:495`. It runs only when a lock already exists, which none of the three planned runs produces.
- Seven more modules in the graph hold the whole module object and can call a spawner at any time: `install-engine`:31, `installer-migrations`:17, `install-profiles`:16, `runtime-artifact-conversion`:29, `runtime-artifact-layout`:26, `runtime-hooks-surface`:33 and `runtime-artifact-install-plan`:70.

**Required change.**
- Replace the sentence with an enumeration of every spawn call site in the graph. For each, state whether it is reachable from an install path, whether it is synchronous, its timeout, and whether it can write to the target.
- The rejection must rest on that argument: on 1.9.1 the reachable spawns are synchronous, time-bounded, read-only probes. The guard is a tripwire behind it. The Alternatives sentence saying the guard "now carries this rejection" hands a design decision to a three-run test that does not exist yet.
- The amendment must also list this as something the author got wrong, as the review record did for the first four rounds.

### 2. HIGH (ask 5): the second scenario may not kill the mutant, because the note never says what decides `incomplete`

**Claim.** The mutation-check amendment under "Proof" says "Under the mutant it reports `applied`."

**Evidence.**
- Step 8 collects per-entry errors.
- Step 9 lists "what did not move or restore and why".
- No accepted text says whether `incomplete` comes from verification alone, or from verification or any collected error.
- Any sensible implementer chooses "or". Under "or", a forced restore error yields `incomplete` whatever the comparison returns, so the always-equal mutant survives the new scenario too.
- The author is right that a clean rollback cannot kill the mutant.

**Required change.**
- Write the rule into step 9: the outcome is `incomplete` if any entry error was collected or verification found a mismatch.
- Kill the verify mutant with a scenario in which the rollback reports no error and the state is still wrong. A preload is gated on the wrapper's script path. It lets the restore copy of one named file succeed and then appends a byte to the destination. Correct code reports `Rollback incomplete`, exits 4 and retires the directory. The mutant reports `applied` and exits 1. This runs the same on Windows, macOS and Linux with no file locks and no timing.
- Keep the forced-error scenario. It tests error collection, which is a different thing.
- To force the error, use the same gated preload and throw `EPERM` for the one destination. Patch every copy primitive the restore could use, and assert that the injection was reached, as lines 97 and 107 of the existing test do.
  - Do not use `chmod`: CI containers run as root.
  - Do not use the PowerShell `FileShare.None` helper in the gate: it is Windows-only and timing-sensitive, so leave it in the adversarial list.
- State how the mutant is applied. Use a copy of `bin/install.js` in the same directory, an exact text replacement with an asserted match count of one, and a wrapper-path override that lives in the test. Do not put a mutation switch into Tier S product code.

### 3. HIGH (asks 4, 5): the acceptance fixture is a fresh target, so "every root byte-identical to its pre-image" checks one file

**Evidence.**
- Section 4 lines 42 to 45: the target holds only `settings.json` and `owner.txt`. Steps 8(c) and 8(d) never run.
- `inventory()` at lines 21 to 35 lists files only, so an empty directory left behind is invisible.
- Line 98 matches both the old false message and the new messages, and nothing asserts it.

**Required change.**
- Add an upgrade fixture. Run a successful install. Have the test hash the whole tree with its own walker, recording type, SHA-256, link targets and empty directories. Run the failing install over it, then require deep equality outside an exact allowlist.
- The test must not read the wrapper's journal or snapshot to decide what the pre-image was.
- Assert the exact outcome string ending "and verified".
- Assert `status === 1` rather than `status !== 0`.

### 4. HIGH (ask 4): as written the replacement is weaker than the original

**Evidence.**
- "No residue outside Protected names" exempts five name patterns. Three of them end in wildcards.
- The original assertion allowed nothing.
- "The quarantine holds exactly the residue" has no independent source for what the residue is.
- An implementation that deletes residue, which breaks truth 3 and step 8(b), passes a roots-only check. So does a run in which the child wrote nothing.

**Required change.**
- Assert an exact allowlist for this scenario. The top level must equal `owner.txt`, `settings.json` and `gsd-install-transaction`. Inside the transaction directory, only `quarantine/<one id>/` with `new/**`, `displaced/**` and `moved.txt` may exist. There must be no lock, no journal, no `snapshot/`, no `gsd-install.lock.stale-*`, no retired directory, and no `gsd-local-patch-history/` (the fixture has no patches).
- For "exactly the residue", run the same failure-injected child without the wrapper against a twin fixture. Require the set of relative paths under `new/` to equal that inventory, and require it to be non-empty.
- Use the write trace only as a lower bound, as line 102 already concedes.

### 5. HIGH (ask 2): "exactly twelve bound names" is brittle and not the safety property

**Evidence.**
- A thirteenth pure helper turns the gate red and "reopens the process-tree decision" with no safety content.
- `installer-migrations.cjs` starting to call `execGit` leaves the count at twelve.
- Deriving the count at test time means parsing source, which the same paragraph rejects, or returning a per-parent Proxy from the `Module._load` hook. The Proxy changes module identity for the seven other modules that hold it.

**Required change.**
- Drop the assertion. Zero spawn events covers it.
- If access evidence is wanted, record reads of the five spawning exports during the runs and require none.

### 6. HIGH (ask 2): bypass routes, and a control that can pass without checking anything

**Gate and marker.**
- The preload is gated on the child's script path.
- If the "preload loaded" marker is written outside that gate, a path mismatch gives a marker and zero events, which looks like a pass. A mismatch can come from Windows drive-letter case, an 8.3 short name, or a realpath difference.
- Write the marker inside the gate, with the pid and `argv[1]`. Assert exactly one armed process per run.

**Routes the hooks miss.**
- `process.getBuiltinModule('child_process')` does not go through `Module._load`.
- `node:cluster` is missing from the list, although `cluster` is there. Strip the `node:` prefix before matching.
- `worker_threads` is not recorded.
- Loading a `.node` addon through `process.dlopen` is not recorded.
- `process.execve` is unwrapped on Node versions that have it.
- `import('node:child_process')` bypasses loader attribution. The spawn wraps still catch what such an import does, because `syncBuiltinESMExports()` is included. Say in the note that loader attribution covers CommonJS only. **[repo]** `install.js` contains no `import(` today.

**What is sound.**
- Wrapping `ChildProcess.prototype.spawn` plus all three sync exports covers every route in `child_process`.
- `--require` runs before the entry script, so no reference is captured before patching.
- `process.binding` is a fair tripwire.

**Preload hygiene.**
- The guard must capture its own `fs.appendFileSync` first. The acceptance preload already patches that method at section 4 line 57.

**Controls.**
- One spawning fixture proves one route, under a different gate path than the real run.
- Instead, arm the guard in the real composed child and inject one event per route: `spawn`, `spawnSync`, `execFileSync`, a `require` from a module outside the allowlist, a Worker, and `getBuiltinModule`. Assert each is caught with the right attribution.

**Set relation.**
- Subset is the right relation, because lazy requires depend on platform.
- "Entry present" checks that the hook works and should be labelled as that.
- Key entries by dist-relative POSIX path, case-folded on win32.

**Scenarios.**
- The three runs do not exercise the conditional spawns named in finding 1.
- Add runs with the working directory inside and outside a git work tree, with a pre-existing consent lock, and in every mode `assertSupportedInstallMode` allows.
- Record Bun as a named residual risk. The owner's tooling prefers bun, the child is started with `process.execPath`, and a text scan for `Bun.spawn` does not cover Bun's `node:child_process`.

### 7. MEDIUM (ask 3): the rejection holds for 1.9.1, on corrected grounds and with two caveats

**Analysis.**
- A synchronous spawn blocks the child, so the direct grandchild cannot outlive `close`. Its descendants can.
- `execNpm` uses `shell: true` on win32 (section 5b line 491). On timeout Node kills `cmd.exe`, not the npm and node processes beneath it.
- With `stdio: 'inherit'` (section 6 line 1056), `close` says nothing about descendants.
- If the wrapper is killed, the journal's pid check covers the direct child only. A journal that is fresh, in `spawning` and has a dead pid rolls back automatically while a grandchild could still be writing.
- Killing the process tree would not fix that case, because the wrapper that could do it is already dead.
- On 1.9.1 the reachable spawns are read-only probes, so the practical exposure is nil.

**Recommendation.**
- Do not reopen this as a design question.
- Do put a one-line confirmation to the owner, because acceptance was given on a false fact.
- The guard's failure message must name the note section. Otherwise a later session will simply edit the allowlist.

### 8. HIGH (ask 6, row 4): the manifest first-segment rule can make owner data a root

**Evidence.**
- A stale or corrupt manifest entry starting with `projects/` or naming `.credentials.json` turns that path into a root.
- The pre-image then opens and copies it, against truth 8. A credentials file is duplicated into `snapshot/` and then into a retired directory that is kept.
- Or the 256 MiB cap blocks every install with exit 6.
- The packet does not show what the kept ownership-manifest validation restricts.

**Required change.**
- State that bound in the row.
- If validation does not limit manifest roots to names GSD has shipped, this goes to the owner.

### 9. MEDIUM (ask 6, row 7): "future-dated means stale" is not the literal reading and weakens the pid check

**Evidence.**
- Step 10 retires a stale journal "whatever its pid says".
- The literal text reads "last updated more than 60 minutes ago", which is false for a future time, so a future-dated journal is fresh under the accepted wording.
- If the clock steps back while an orphaned child is still writing, this reading retires the journal and starts a second writer. Clock steps are routine on WSL2 after host sleep and on dual-boot machines.

**Required change.**
- Treat a future date as "age cannot be decided".
- If the phase is `spawning` and the pid is alive or unknown, refuse with exit 6.
- Otherwise retire. Never run the automatic rollback in this case.
- Name the embedded last-updated field as the clock, not the file's modification time.
- Confirm with the owner, because D4 was theirs.

### 10. MEDIUM (ask 6, row 1): exit 6 for `--all` is the literal reading of step 9, and it contradicts the owner's own CLI standard

**Evidence.**
- The owner's CLI standard uses 2 for misuse.
- The row folds three classes into one code: retry later, fix your command, and broken package.
- Today this path exits 1 (section 6 lines 961 and 972).
- An exit-code contract is a public surface.
- Exit 2 for misuse does not break the accepted wording "6 always means nothing was touched".

**Required change.** This is an owner decision. My recommendation is 2 for argument misuse and 6 for the rest.

### 11. MEDIUM (ask 6, row 3): every refusal reachable with an absent target can be decided before creating it

**Evidence.**
- An absent target cannot have a lock, a journal, a link root or a cap breach.
- Free space can be measured on the nearest existing ancestor.
- Creating the target after all refusals removes the undo clause and keeps exit 6 literally true.

**If creating then removing stays, the row must specify three things.**
- The installer records the first ancestor it created, which a recursive `mkdir` returns, and removes only directories this run made.
- It uses a non-recursive `rmdir`.
- It ignores `ENOTEMPTY`.

### 12. MEDIUM (ask 6, row 10): hashing only the snapshot copy cannot detect a torn copy of a live file

**Evidence.**
- Another session may write a file such as `settings.json` while it is being copied.
- The installer would then later report "restored to their state at <time> and verified" against a state that never existed.

**Required change.**
- Hash the copy, then re-hash the source, and require the two to match.
- Retry on mismatch, then abort as a read error with exit 6.
- This uses content only, so it fits step 9's ban on size and time as inputs.

### 13. LOW to MEDIUM (ask 6, remaining rows and gaps)

- **Row 2.** This is an exception to step 3 for two Observed roots. The packet does not show `assertRegularBackupTree`. If it is existing behaviour, keep it. The refusal message must name the link and the remedy.
- **Row 5.** This is consistent with truth 3. Say plainly that it means three attempts in total.
- **Row 6.** This is consistent. The refusal template needs a form for an unreadable lock, where pid and time are unknown. Creating the lock with `linkSync` from a temp file would close the window in which the lock exists but is still empty.
- **Row 8.** A field that nothing reads is dead schema. Either make "never read" a tested property or amend step 5 to remove it.
- **Row 9.** A directory rename fails with `EBUSY` on Windows if any file inside is open, which strands hundreds of files behind one handle. Specify whether a failed unit move falls back to per-entry renames or is reported incomplete. `moved.txt` must list every file, and the count must print both units and files.
- **Row 11.** This is consistent with D1. Show the owner the consequence: one large owner file in a shared root such as `skills/` blocks every install.
- **Missing rows.** Two points are absent from the table: the outcome rule from finding 2, and the exit code when commit's deletion of the snapshot fails.

### 14. LOW (ask 7)

- "Touches none of the eleven owner decisions" is contestable, given rows 1 and 7.
- "Each is the reading the failing tests encode" describes tests that do not exist yet. The packet contains only the one red acceptance test.
- The proposed revision row has no commit hash.
- The guard's failed-install run is the acceptance scenario. Run both preloads in one child rather than paying for extra real installs on three operating systems.
- Section 4 line 93 keeps a 30-second timeout, which is tight once snapshot, hashing and quarantine run under Windows Defender. A timeout there kills only the wrapper and leaves the child writing into a directory the `finally` block is deleting.

## Questions the owner must answer

1. The process-tree rejection was accepted on a false fact. On the corrected evidence (reachable spawns are synchronous, time-bounded, read-only probes, and the guard trips on anything else), do you confirm the rejection?
2. Which exit code applies to argument misuse such as `--all`? Literal step 9 says 6. Your CLI standard says 2.
3. How should a journal dated in the future be treated? The choices are stale (the author's reading), fresh (the literal text), or "age undecidable: refuse if the child may be alive, otherwise retire" (my recommendation).
4. If ownership-manifest validation does not restrict manifest-named roots to GSD-shipped names, may a manifest make an arbitrary top-level entry a root, given that the pre-image would then copy files such as `.credentials.json`?
