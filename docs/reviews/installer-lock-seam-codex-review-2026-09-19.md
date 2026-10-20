1. **BLOCKER — Takeover can permanently remove a live holder’s lock.** [bin/lib/install-transaction.js:152](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/bin/lib/install-transaction.js:152)

   A reads a dead lock; B takes over successfully; A then renames B’s live lock. The recorded third-arrival race permits two successful holders. There is also a wider failure: if A’s link-back fails with `EPERM`, the catch suppresses that error and deletes B’s claimed file. C can acquire later while B remains active. I reproduced both sequences using the actual module with an in-memory filesystem.

   **Fix:** replace pathname-based stale reclamation with a primitive that cannot detach a live holder, such as an OS-held lock on a stable file. Another comparison before rename does not close this gap. Preserve the claim and report restoration failures meanwhile. The [race test](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/tests/coverage/install-transaction.test.cjs:295) must assert exclusive ownership, not merely that C’s file remains. I would not accept this residual for a live-home installer.

2. **HIGH — Exclusive creation does not protect owner writes during restoration.** [Design note:141](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/docs/reviews/installer-rollback-redesign-2026-09-18.md:141)

   After quarantine, `COPYFILE_EXCL` can create the destination before finishing its contents. An owner writes that newly visible file; the remaining restore overwrites those bytes. Verification can subsequently pass, although the owner’s edit has disappeared. This contradicts Truth 3 and the concurrent-edit proof case. Node explicitly provides no atomic-copy guarantee. [Node documentation](https://nodejs.org/api/fs.html#fscopyfilesyncsrc-dest-mode)

   **Fix:** finish a separate restore copy privately, then publish it exclusively without further writes to the published file. Link the completed staging copy, never the snapshot itself. Add an interleaving case covering owner writes during publication.

3. **HIGH — PID and timestamp do not uniquely identify an acquisition.** [bin/lib/install-transaction.js:179](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/bin/lib/install-transaction.js:179)

   Acquire L1, release it, then acquire L2 in the same process with the same timestamp. Calling L1’s `release()` again deletes L2 because their serialized contents match. Another installer can then acquire alongside L2. I reproduced this with distinct acquisition IDs and identical PID/time.

   **Fix:** include the existing randomly generated acquisition ID in the lock payload and make each release handle terminal after its first release. This fixes the identity collision; it does not fix finding 1’s pathname race.

4. **HIGH — Dead-holder detection assumes a shared liveness domain without checking it.** [bin/lib/install-transaction.js:115](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/bin/lib/install-transaction.js:115)

   If two contenders share storage but each liveness probe reports the other’s PID as absent, both acquire successfully: the second treats the first’s live lock as stale. The payload contains no identity establishing that the holder’s PID is meaningful to the probing process. I reproduced this through the supplied ports.

   **Fix:** record a liveness-domain identity and refuse takeover of foreign or unknown domains. Ordinary PID reuse and `EPERM` already refuse conservatively; they do not solve this separate scope problem.

5. **HIGH — Expected-red gates accept additional regressions.** [scripts/expect-red.cjs:55](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/scripts/expect-red.cjs:55)

   Starting with the captured recovery report, I changed `fresh:owner-bytes-preserved` from passing to failing. The judge still returned no problems because non-signature acceptance failures are ignored. Separately, the coverage judge accepts `not implemented: acquireLock`, although that seam has landed, and accepts a report containing no coverage evidence.

   **Fix:** validate the complete expected check inventory and permitted failure set. Restrict unit failures to the ten pending render cases and their expected operation; require affirmative coverage evidence. Add negative controls for owner-data loss, missing checks and regression of a landed seam.

6. **HIGH — Failed retirement after rollback has no consistent outcome.** [Design note:169](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/docs/reviews/installer-rollback-redesign-2026-09-18.md:169)

   Rollback restores some entries, collects another entry’s error, then attempts immediate retirement. If retirement fails, step 10 prescribes refusal, while step 9 assigns failed retirement exit 6—meaning nothing was touched. Files have already changed, and the live journal remains despite the assertion that only a killed wrapper leaves one.

   **Fix:** distinguish retirement before mutation from retirement following rollback. The latter must retain exit 4, preserve and name the live transaction directory, report the retirement error, and define how the next run handles that retained journal.

7. **MEDIUM — A partial pending-file write contradicts “Nothing was changed.”** [bin/lib/install-transaction.js:181](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/bin/lib/install-transaction.js:181)

   `writeFileSync(..., {flag:'wx'})` can create the pending file and then fail. That catch bypasses the later cleanup. An injected partial write followed by `ENOSPC` left the pending file while returning exit 6 and “Nothing was changed.” The existing collision test covers failure before creation, not this case.

   **Fix:** separate exclusive creation from writing so ownership is known and partial files can be cleaned safely. If cleanup fails, report the retained path instead of claiming no change.

8. **MEDIUM — Whole-directory quarantine conflicts with the prohibition on moving links.** [Design note:102](C:/Projects/get-stuff-done/.claude/worktrees/skin-campaign/docs/reviews/installer-rollback-redesign-2026-09-18.md:102)

   Step 3 says links below roots are never moved. The settled reading at line 402 requires a newly created directory to move as one unit. A new directory containing a link cannot satisfy both instructions; falling back only after a failed rename does not resolve this.

   **Fix:** specify that directories containing protected-from-movement links use per-entry handling, leave those links in place and produce an incomplete outcome. Cover this intersection explicitly.

**Verdict: NOT PASS.**

Refusing unsupported hard links is a defensible safety trade. The current takeover protocol remains unsafe even where hard links work.

I read the requested materials and ran only in-memory reproductions; I created, edited and deleted no files. I did not rerun the filesystem-writing unit suite, coverage, mutants, full suite or installer, and did not validate native macOS/Linux, APFS, overlay/network filesystems or open-handle behavior. Other workspace edits appeared during review; the reviewed modules and unit suite remained identical to `4eb3201f`.

