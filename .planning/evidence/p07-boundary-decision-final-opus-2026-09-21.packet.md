Final decision-readiness review. User explicitly requested Opus5/xhigh. Review packet only, no tools. Prior review PASS WITH CHANGES had eight blocking clarifications. They are now appended in Critical-review amendments, exact replacement H4, closed action table, writer/child/manual-recovery limits and A/B/C decision table. Read the whole section for contradictions. This is a PROPOSED policy trade-off, not an accepted weakening, implementation approval or claim a Node-only solution exists. Full goal includes supported Windows/Linux and macOS CI; retain reduced skin/fixed1.12. We must not substitute an easier end state without explicit owner decision. Check that the owner can now make an informed choice; do not require a complete unapproved implementation just to discuss a policy choice, but reject materially misleading options. Challenge whether recommending B is defensible. Tell us precisely if current text would change additional accepted guarantees beyond topology and conservative-lock availability. Required output: PASS FOR OWNER DECISION, PASS WITH CHANGES or NOT PASS; <=800 words, concrete remaining blockers. No review loop for optional wording. Sources below are exact current section23, prior review and the accepted authority. Distinguish unknown versus impossible and benign-interference protection versus arbitrary adversary guarantees.
## 23. Post-experiment containment decision,2026-09-21

Status: **DRAFT FOR CRITICAL REVIEW; NOT AN OWNER DECISION OR P07 APPROVAL.**
Section21 is complete, not pending. The full campaign goal remains active and
incomplete. This section changes no requirement until the owner explicitly decides.
It does not authorize tests, another experiment, a native helper, or product edits.

### Requirements and minimum mechanism

The installer must exclude competing installers; preserve owner data; publish only
completed lock/restore state; preserve uncertain child/transaction state; and give
truthful failure/cleanup outcomes. Exclusion between cooperating installers does
not stop an editor, shell or sync tool from moving their parent directories.
Containing access to a directory object also does not establish that object is
still beneath its original pathname. Those are separate requirements.

Section21 supports one Windows/local-NTFS mechanism: retain directory handles with
delete sharing denied. It observed blocked directory moves, successful ordinary
file edits, exclusive publication refusal on collisions, and a successful rename
after child close. It supplies no portable lock, root-bootstrap or post-move proof.
Receipts and final independent PASS are in p07-containment-spike-2026-09-20/.

Minimum structure for the strict currently accepted boundary: trusted acquisition
of an anchor; enforcement of every relevant namespace boundary for the entire
operation; exclusive lock publication/release; and independent child quiescence.
Neither a PID check nor an advisory lock on installer metadata supplies the
namespace enforcement. Neither a preflight scan nor a last-moment recheck closes
the interval between inspection and a pathname mutation. These are deductions from
the operation ordering, not new runtime evidence or a universal impossibility claim.

### Platform and cost comparison

| Environment/mechanism | Available evidence | Remaining obligation and cost |
|---|---|---|
| Windows/local NTFS, retained handles and relative operations | Three bounded native cases, independently reviewed | Bootstrap from a trusted anchor, every operation boundary, normal-account ACLs, child lifetime, crash behavior, distribution and final-revision qualification; directory rename restrictions require explicit acceptance |
| Linux, directory descriptors/openat2 | Documentation: stable object reference and constrained open resolution | Does not by itself freeze the directory's original pathname or constrain later unlink/rename/write operations; no native fixture or complete strict-boundary mechanism qualified |
| macOS/POSIX-relative operations | No native proof obtained in this experiment | Existing native CI requirement remains; Linux-only openat2 is not a macOS implementation; no claim of portable containment |
| Windows/WSL shared targets, network/shared filesystems | No interoperability qualification | No common liveness or lock domain inferred; refusal remains required wherever proof is absent |
| Current Node pathname operations plus rechecks | Existing module and rejected takeover reviewed | Cannot be certified as enforcing the strict concurrent-topology boundary; more tests cannot manufacture the missing primitive |
| Explicitly coordinated topology during a maintenance window | Proposed product precondition, not current evidence | Smaller implementation may be possible, but unsupported concurrent moves/link changes cease to have a guaranteed outcome; a warning, checkbox or lock file does not enforce this precondition |

Primary sources checked2026-09-21:
[Linux open](https://man7.org/linux/man-pages/man2/open.2.html) documents stable
directory references across rename;
[Linux openat2](https://man7.org/linux/man-pages/man2/openat2.2.html) constrains path
resolution for the open operation;
[Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html) describes advisory
locking, not a directory-rename fence;
[Microsoft CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)
describes delete-sharing effects on rename/delete. These documents support the
primitive distinctions; they do not establish native portability or product safety.

A first-party helper would add a native build/release matrix, artifact integrity,
packaging, OS/filesystem compatibility and crash/IPC ownership work. The existing
scope permits no production dependency, module or port for it. A proposal must
retain the owner's cost envelope: no admin service, install-time compiler or
install-time binary download. No calendar estimate is asserted before a supported
design exists. Merely choosing Rust would not resolve the Linux boundary.

### Proposed decision and its precise trade-off

Recommendation for review: **consider a coordinated-topology installation contract
before authorizing a native subsystem**. The reduced skin retains measured workflow
value; a general concurrent-filesystem boundary is substantial additional scope.
This is a proposed relaxation of H4, not an interpretation already authorized by
the owner and not a claim to the original stronger end state.

The proposed maintenance window would run from before target/bootstrap checks until
all installer children are confirmed closed and metadata cleanup reaches its
reported terminal outcome. The owner must arrange that no other process moves or
replaces the target, its ancestors, traversed directories, mounts, junctions or
symlinks during that window. Protected transaction/lock names must remain exclusively
under the installer protocol. Ordinary content writes to existing regular files and
atomic replacement with another regular file would remain in scope of the existing
captured-pre-image/rollback guarantees, not a guarantee of retaining every
intermediate edit overwritten by another actor before observation. The closed
action table and preservation qualifications below govern this proposal.
The distinction between allowed regular-file replacement and forbidden topology
changes must be reflected in later operation contracts and adversarial tests.

The program cannot reliably prove that an arbitrary same-user actor will honor
that window. Diagnostics may identify known conflicts and refuse; they cannot turn
absence of detected activity into a guarantee. Crashes do not automatically end the
window: unresolved children must be quiescent before manual cleanup or another run.
An owner promise cannot replace automatic enforcement of cooperating-installer
exclusion, child safety, exclusive restore publication or terminal release.

If the owner accepts this change, it unlocks preparation of a **Node-only P07
candidate**, not its implementation: exclusive completed-file publication, unique
acquisition identity, terminal release, owned-temp cleanup and explicit residue
outcomes. All existing locks would refuse unless a separate safe takeover protocol
and shared liveness mechanism is later qualified. That has an availability cost:
a crashed lock may require owner-established wrapper AND child quiescence and
manual recovery. The exact argument/return shapes and support matrix still require
one combined approval before RED tests. No new CLI confirmation flag is proposed
or approved here; the user-facing support/precondition wording belongs in that packet.

If the owner retains the strict boundary, retain it verbatim: no Node-only repair
or Windows-only delivery is silently substituted. P07 remains unapproved until a
complete supported-platform boundary is designed and reviewed. The next proposal
must name actual mechanisms, scope and proof cases, not request unlimited native
research. Another experiment requires its own bounded approval because section21's
three-run/one-correction allowance is exhausted.

Windows-only completion and replacing the skin with stock upstream are not offered
as equivalent completions: neither fulfills the current accepted campaign scope.
The September19 reduced-skin decision and fixed1.12.0 destination are unchanged.

### Verification and owner decision gate

Independent review must challenge: whether the proposed window is understandable
and usable; whether ordinary editor behavior makes it impractical; whether a
Node-only protocol can preserve regular-file replacement guarantees; whether this
is an unjustified weakening of the requested end state; and any smaller mechanism
that preserves the strict boundary without changing scope. Review is judgment,
not native proof. No requirement changes merely because the reviewer agrees.

Before asking the owner, retain the final review and disposition every finding.
Then ask whether to accept this explicit boundary/availability trade-off, retain
the strict boundary, or prepare the window candidate with private upstream staging.
Do not re-ask the settled takeover policy or imply that an API, product test or
native helper is authorized by that answer.

### Critical-review amendments: exact decision boundary

First Opus5/xhigh-requested review: PASS WITH CHANGES, session
bf7e9979-eb77-479e-b380-b06a9f10b02b, terminal success, zero tools. Its eight required
clarifications are addressed below. Evidence prefix p07-boundary-decision-opus-2026-09-21.

**Current H4**, Sixth-review holistic table, accepted September19:

> Define the supported writer/threat model, then require a filesystem boundary
> that can enforce it. Refuse unsupported operations instead of declaring path
> rechecks race-free. No silent dependency/port expansion.

Its problem statement says preflight does not freeze links/directories/shared-path
topology. Separately, section21's approved moved-directory case requires that a
moved handle not authorize mutation outside the target boundary. That experimental
claim is the source of the stronger pathname-stability reading here, not a verbatim
universal H4 clause. H4 alone does not settle whether final production authority
follows an anchored object after its pathname changes. We must not silently accept
post-move writes: object-relative authority would also need an explicit supported
contract and counterexamples. No impossibility theorem is claimed.

**Exact proposed replacement H4 for the window candidate only:**

> Installation, uninstall locking, rollback and recovery require a coordinated
> topology maintenance window. External actors may perform only actions marked
> allowed in section23's action table. The program does not enforce external
> topology coordination and does not guarantee containment if a forbidden action
> occurs; detection/refusal are best effort, not proof of absence. Cooperating
> installer exclusion, child quiescence, captured-pre-image verification, exclusive
> restore publication, owned cleanup and truthful outcomes remain mandatory.
> Unknown/mismatched recovery identities refuse automatic mutation. Unsupported
> primitive, filesystem or liveness behavior refuses. No new dependency, module,
> port, API or CLI surface is approved by this policy decision.

This would apply to Windows too: the experimental native guard would not ship in
the Node-only candidate. It reduces protection against benign concurrent moves/link
changes by editors, sync clients, branch-switching tools and runtimes. An arbitrary
same-user adversary can also modify owner bytes directly; neither proposal promises
to prevent all such attacks. That observation does not excuse unsafe installer
writes. The window relinquishes guaranteed containment even when a benign actor
breaks its precondition. Later native strengthening requires separate scope/proof.

### Closed external-action table for the proposed window

Unlisted actions affecting traversed paths, managed roots or protected metadata are
forbidden. Root/ancestor restrictions take precedence over general allowed rows.
Targets include Claude/Codex config homes; runtime sessions and sync clients may
need to stop. This table covers external actors, not transaction-owned operations.

| External action | Classification | Required behavior within the proposed contract |
|---|---|---|
| Read ordinary regular-file contents | Allowed | No globally atomic view promised |
| Write existing regular-file bytes; atomic-save replacement by an independent regular file | Allowed | Captured-pre-image/rollback preservation below, not retention of every intermediate byte version |
| Create/delete independent regular files below an existing managed directory | Allowed | Existing rollback/new-entry rules, bounded collisions, truthful incomplete outcomes |
| Change entries solely in unmanaged subtrees unrelated to traversed ancestors | Allowed | Do not descend/open their contents; preserve outside-root policy and truthful top-level observations |
| Rename/delete/replace target, traversed ancestor or managed directory; change mount/reparse topology | Forbidden | Known conflict refuses; absence of a detected conflict is not enforcement |
| Introduce/retarget a symlink/junction on traversed/managed paths; replace a regular file with a directory | Forbidden | Refuse known unsupported shape; do not follow it |
| Introduce hard links involving traversed/managed files, including outside aliases | Forbidden | Known multiply linked mutable entries refuse absent separate proof; scans do not detect every concurrent violation |
| Change ACL, ownership, mode or special attributes on traversed/managed/protected objects | Forbidden | Refuse or retain incomplete state under the later seam's metadata contract |
| Alter/remove lock, journal, snapshot, staging, attempt records or quarantine outside protocol | Forbidden | No manual deletion with live/unknown writers |
| Existing links/reparse entries/aliases before the window | Detected-and-refused for traversal/mutation without a safe operation | No authority to delete owner links or weaken accepted per-entry link preservation |

### Writers, ordinary saves and child limits

Current bin/install.js runs upstream against the real target, then writes overlay,
metadata and status-line state. It does not generate privately and commit only
through a guarded writer. A wrapper helper is therefore not an upstream sandbox.
The contract must cover both writers and permitted descendants. This is source
inspection, not a new exploit or execution demonstration.

The approved restore direction remains: completed private staging, exclusive
hard-link publication, never link snapshot bytes, never write the published file.
Move the current entry into an exclusively reserved transaction-owned quarantine
destination; reservation must prevent rename from replacing another retained entry.
A concurrent save may end up in quarantine; an open editor handle may keep writing
there. Publication collisions follow the accepted bounded quarantine/retry rule:
three attempts, then leave the colliding entry and report incomplete. Do not promise
the edit stays at its original name or quarantine is immutable. Unsupported hard
links/metadata refuse, never fall back to overwriting. These existing design rules
are not a proven Node implementation or permission to start the restore seam.

Child quiescence is an independent open gate. No qualified production mechanism
for all descendants after wrapper failure is supplied here on Windows, Linux or
macOS. A Node close event, POSIX process group, or assumed Windows job behavior does
not establish that proof. Live/unknown children refuse; normal completion still
needs the later guarded-child contract to establish the permitted process graph
and its terminal state. The maintenance promise does not replace that requirement.

The window continues through unresolved invocation state until quiescence and
recovery/retirement reach their reported terminal outcome. Later recovery must
reverify recorded root identities and refuse mismatch; that improves truthful
outcomes, not enforcement of earlier pathname stability. An owner unable to sustain
the window cannot treat this profile as supporting their target.

Manual crash recovery would require identifying the target and all potentially
writing wrappers/runtimes/hosts, stopping them using reliable native process-identity
evidence, then re-establishing the window before owned lock cleanup. Missing local
PID or timeout is insufficient. Without trustworthy quiescence retain/refuse; a
separately reviewed operator procedure may require controlled host shutdown/restart
with writers disabled. Unknown shared/remote writers remain unsupported. This is
an availability burden; the executable operator runbook remains owed before release,
not replaced by today's blanket 'delete the lock and retry' wording.

### Decision outcomes and cost

| Choice | Authorization sought | Cost/acceptance limit |
|---|---|---|
| A: retain strict boundary | No policy relaxation; prepare a bounded mechanism proposal preserving it | No complete production mechanism qualified on any platform today; repaired-contract mutation refuses until proof. Pathname-stable Linux support may require different coordination/isolation; feasibility unknown, not proved impossible. |
| B: coordinated window, Node-only candidate | Exact replacement H4/table above; prepare combined P07 protocol/API and refusal matrix | Owner controls topology through operation and unresolved recovery; all existing locks refuse until safe takeover qualified; manual crash recovery burden; child/platform proof still gates release |
| C: window plus private upstream generation candidate | Prepare B with upstream writing a private target and wrapper-controlled publication | Additional design for existing-state seeding, path-sensitive settings/migrations/patches, output binding and real-install parity; may shorten the live-target window, but capture/commit/rollback/recovery still need coordination. Staging is not itself a sandbox. |

Recommendation B is conditional on the owner's informed acceptance and operational
ability to sustain the weaker topology promise. C is not free safety: upstream
semantics may change under a private target. No answer completes P07, permits RED
tests, or changes the reduced-skin decision/fixed1.12.0 destination.

Review assertions not adopted as facts: no universal same-user containment
impossibility, no unverified libuv job guarantee, no claim the existing unmodified
installer currently refuses on every platform. 'Refuse until qualified' applies to
the repaired contract. Unexamined /proc/self/fd and platform-specific no-follow
facilities remain possible inputs, not proven mechanisms or new experiment authority.

PRIOR REVIEW
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

CURRENT ACCEPTED AUTHORITY
# Installer rollback redesign: observe, do not predict

## Current authority: owner acceptance after holistic review, 2026-09-19

The owner accepted all eight repair directions and the integrated recommendations
in the Sixth-review holistic assessment. This section supersedes conflicting
historical text below, including the earlier fixed installer D3/D4 decisions; it
does not change the separate campaign D1-D11 decisions. Historical wording is
retained for traceability, not as an alternative executable contract. The detailed
operation arguments/returns, filesystem support and durability mechanisms remain
subject to approval before tests. Implementation has not been accepted.

- Lock ownership: publish completed lock contents exclusively; distinguish every
  acquisition and make release terminal. Automatic takeover is permitted only with
  proof of the complete acquire/takeover/release protocol. Foreign or unknown
  liveness domains refuse; platform/hostname alone are not a proof. Report retained
  lock metadata and cleanup errors. The old rename/verify/link-back protocol below
  is rejected. No OS-lock adapter or identity-marker candidate is approved merely
  by accepting this policy.
- Child safety: a live or unknown child blocks recovery/retirement that would
  permit another writer, regardless of journal age or clock direction. First
  establish quiescence; only then use freshness to select policy. A recorded valid
  child-closed state is distinct from guessing that a PID has gone away.
- Before rollback changes any installation entry, persist and validate permission
  for one automatic attempt, tied to the transaction. Failure or uncertain record
  persistence grants no permission. An existing/partial attempt record never grants
  a later invocation permission to replay rollback. Invalid or incompatible evidence
  refuses automatic mutation. Record the result separately after the pass.
- An interrupted attempt, incomplete result or missing result after an attempt is
  preserved and diagnosed; later invocations inspect and may safely retire it, but
  do not automatically restore again into newer owner edits. This supersedes fresh
  journal replay and automatic mid-rollback resumption below. An eligible fresh
  journal with no prior attempt may still begin its first recovery attempt.
- Rollback result, current verification and metadata cleanup are separate facts.
  Failed retirement after an incomplete attempt retains exit 4, reports actual live
  paths and errors, and preserves journal/snapshot/quarantine. Retiring moves retained
  data; it does not establish successful restoration. No new installation starts
  against an unresolved live transaction. Finish recovery/retirement invocation
  before starting a new install. A later ordinary install uses the current roots
  as its baseline and must report retained retired data.
- A verified result may support completion of metadata cleanup without redoing
  restoration. Persisted attempt/result records take precedence over the historical
  rule to delete every snapshot lacking a journal: inconsistent or unexplained
  evidence is retained, not blindly deleted. Define all cleanup-crash states in the
  approved lifecycle and outcome contract before implementation.
- Keep finding 2's completed private staging and exclusive publication; never link
  snapshot bytes or write to the published restore. Preserve existing collision
  bounds and per-entry errors. Preflight path checks alone do not establish safe
  containment under concurrent topology changes; the supported mechanism must be
  proved or the operation refused. Links must not be moved inside a bulk directory
  move. Retain unsafe structures as incomplete rather than claim a scan closes races.
- Mutable quarantine is retained unless safe deletion can be established. A hash
  comparison alone does not make deletion safe against an active writer. Explicit
  owner cleanup is preferred to an unproved automatic prune. This supersedes the
  byte-equality-only quarantine deletion rule in step 11; unrelated patch-history
  retention remains unchanged unless separately dispositioned.
- Cleanup only files exclusively created by this run; preserve collision files.
  Report partial-write residue and both primary/cleanup errors. Refusal language
  must distinguish installation-content changes from transaction metadata and prior
  attempts; the unqualified "nothing was touched" claim is not valid with residue.
- Claims describe the captured pre-image and actual verification, not a globally
  atomic snapshot of a live tree. Process-crash safety and power-loss durability
  need separate evidence. Uninstall instructions reflect retained state and must
  not promise that one retry clears a journal. Exact text/exits remain part of the
  owner-approved outcome shape.

