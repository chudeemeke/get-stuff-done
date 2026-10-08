**Verdict: PASS WITH CHANGES.** The direction is warranted and timely, but the packet is not yet precise enough to support a conscious owner decision.

## Why the recommendation is not premature

The accepted text says the mechanism "must be proved or the operation refused." Section21's allowance is spent, and no qualified mechanism exists on any platform. Keeping the strict boundary unchanged therefore means refusal on every platform, which conflicts with Windows, Linux and macOS delivery.

That is the honest cost of the strict option. The packet should say so in those words, not "P07 remains unapproved."

## Blocking changes

1. **Show the requirement change word for word.** H4 is not quoted anywhere in the packet. The packet should show H4's current text and the exact replacement text side by side. Otherwise the owner decides on a paraphrase.

2. **State who the boundary protects against.**
   - Against an arbitrary same-user adversary, the window is unenforceable. So is any containment mechanism, because that actor can alter owner data directly without going through the installer.
   - The strict boundary really buys protection against the installer being misdirected by benign concurrent actors. Examples: sync clients, IDEs, git checkouts or branch switches, backup tools, and possibly the host agent itself.
   - The window gives up a guaranteed outcome against exactly those actors. The owner cannot judge how large the weakening is without this statement.

3. **Separate "the installer writes only inside the object" from "the object stays at its original path," and cite the source of each.**
   - Section 23 asserts the second as a separate accepted requirement but cites nothing for it.
   - This matters decisively. I know of no unprivileged Linux primitive that stops a same-user rename of a directory the user owns, with or without a native helper.
   - If path stability is required, strict Linux support is likely unattainable. This is a judgment, not proof.
   - If only object containment plus truthful reporting of a detected root-identity change is required, the gap is smaller.

4. **List who writes into the target: the wrapper, or black-box upstream children.**
   - No wrapper-side helper can constrain an upstream child's path-based operations on Linux or macOS without sandboxing. The native-helper comparison is therefore overstated.
   - The exception is if upstream output is generated in a private staging directory and then committed by the wrapper. State which design is current.
   - Staging still needs proof and changes scope, because upstream would then run outside the real target. It would, however, shrink the window to commit, rollback and recovery. The owner should see that option.

5. **Make the allowed/forbidden list closed, with forbidden as the default.** These are currently unclassified:
   - creating or deleting entries inside the target, for both managed and unmanaged names;
   - replacing a managed regular file with a symlink, junction, directory, or hard link to an outside file;
   - attribute and ACL changes.

   Each item needs a class: allowed, forbidden, or detected-and-refused.

6. **Show how regular-file replacement survives with Node alone, or withdraw the promise.**
   - Node has no rename-without-replace and no compare-and-swap. `fs.rename` replaces files on both Windows and POSIX, so "check, then restore" loses a save that lands in between.
   - One plausible candidate:
     - never open existing target entries for writing;
     - rename the current entry aside into transaction-owned quarantine, then verify;
     - publish completed staging bytes by exclusive link, treating EEXIST as a retained collision.
   - Its honest guarantee is weaker:
     - a concurrent save may end up in quarantine or as a collision, reported rather than kept in place;
     - an editor holding an already-open handle writes into the quarantined object;
     - filesystems without hard links refuse.
   - Present this as a proposed guarantee, not a proven one.

7. **Cover children and state between invocations.**
   - The Node-only candidate list omits child quiescence, which Section 23 itself says an owner promise cannot replace.
   - Name the mechanism per platform and its limits. Examples: POSIX process groups can be escaped by `setsid`. Windows depends on libuv's job-object behavior for non-detached children, which is unverified here, including grandchildren that break away. Otherwise, state the resulting refusal.
   - State whether the window persists across an unresolved transaction until recovery completes.
   - Require recovery to re-verify the recorded root identities and refuse on mismatch.
   - Describe the manual recovery the owner is accepting: what they check, and how.

8. **Say that Node-only makes Windows depend on the window too.** Section21's Windows mechanism would be set aside for now. Any later strengthening must be additive, not a change to the contract.

## Nonblocking unknowns

- **Unexamined Node-only options.** Linux traversal relative to a held directory (`/proc/self/fd/N/name` with `O_DIRECTORY|O_NOFOLLOW`) and macOS `O_NOFOLLOW_ANY` have not been examined.
  - The table's "Node pathname operations" row is correctly scoped, but it must not be read as "Node cannot."
  - Record this and defer it; it does not justify new research now.
- **Real targets may violate the window routinely.** If a target is the host agent's own config directory, the running agent writes there constantly. That is a usability risk; name the targets in the P07 packet.
- **Detection is not enforcement.** Comparing root identity (`dev`/`ino`, file ID) before and after improves truthful outcomes, not guarantees. It belongs in the outcome contract.
- **Irrelevant to this decision:** Windows rename-release latency, the NTFS compression attribute, and the 12–17 s spawn delay.
- **Correctly handled in the packet:**
  - Section 23 says a native helper does not change POSIX semantics.
  - It says the absence of a qualified mechanism is not a universal impossibility claim.
  - It leaves the takeover policy and the reduced skin untouched.

## Better concrete next step

The next step should be neither another experiment nor a bare accept/retain question. Amend Section 23 once with items 1–8. This is desk work only, followed by one independent review. Then ask the owner a single question with explicitly costed answers:

- **A — Keep the strict boundary.** Mutation refuses wherever no mechanism is qualified, which today means every platform. Under the path-stability reading, Linux may stay refused indefinitely.
- **B — Adopt the window contract, Node-only.** This carries the weaker regular-file guarantee from item 6, manual crash recovery, and refusal of every existing lock.
- **C — Adopt B plus private upstream staging.** This narrows the window to commit, rollback and recovery, at the cost of the scope change described in item 4.

Any answer authorizes only preparation of the combined P07 API and support-matrix packet. It does not authorize RED tests, helpers or experiments.
