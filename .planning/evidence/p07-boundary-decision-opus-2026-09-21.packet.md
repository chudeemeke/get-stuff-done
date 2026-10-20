You are the owner's independent critical reviewer, explicitly requested Opus5 at xhigh. Review ONLY the supplied packet, no tools or edits. This is a proposed trade-off for owner decision, not an implementation plan or approval-ready API. The owner wants a polished robust useful reduced Open-GSD skin, Windows and supported Linux delivery, native macOS CI, fixed1.12 endpoint. They approved strict containment under concurrent topology changes and safe automatic takeover only with proof. They explicitly require every API approval before RED tests. Three Windows cases just proved move refusal, not portable/post-move safety. We must not substitute an easier weaker end state without a conscious owner decision. Section23 proposes a maintenance-window boundary because no full portable mechanism is qualified. Challenge whether this is warranted, usable, sufficiently precise, or premature. We prefer to complete useful software, not an endless research/approval chain. No new runtime experiment, helper, implementation or package is authorized. Node-only does NOT mean implementation-ready. Find a better concrete next step if this recommendation is wrong. Return PASS FOR OWNER DECISION, PASS WITH CHANGES, or NOT PASS; max1000words; concrete blocking changes versus nonblocking unknowns. Explicitly consider: trusted owner versus arbitrary same-user adversary; ordinary atomic-save editors; helpers cannot change POSIX semantics; crash windows/children; containment of black-box upstream writes versus wrapper-only operations; absence of proof is not impossibility; staged private generation and commit may help but still need proof and alter scope. No new broad strategic audit. User accepted reduced-skin after measured upstream comparison; do not reopen it gratuitously.
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
atomic replacement with another regular file would remain in scope: snapshots,
collision handling and rollback must preserve the accepted owner-data guarantees.
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
Then ask only whether to accept this explicit boundary/availability trade-off or
retain the strict boundary. Do not re-ask the settled takeover policy or imply that
an API, product test or native helper is authorized by that answer.

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

EXPERIMENT FINDINGS
# Section21 containment experiment findings

Owner approved the bounded experiment on2026-09-21. Three initial cases executed
serially; no runtime retry. One pre-execution source-review correction consumed
the entire correction allowance. Product installer and transaction source unchanged.

| Case | Fixture result | Observed cost or limit |
|---|---|---|
| parent-swap | Three claims observed; owner file edits preserved; outside sentinels unchanged | Target and held ancestor renames refused while guard held; aliases are pre-existing identity observations only |
| leaf-swap | Three claims observed; replacement file/directory/junction preserved; non-file inspection refused | Exclusive creation refuses occupied names; this is not an overwrite/restore implementation |
| moved-directory | Three claims observed; guarded moves refused; owner rename succeeded after child close | Temporary rename restriction is real; one post-exit observation supplies no release-latency bound |

All nine positive and nine unsafe controls produced their required observations.
All six child closures were observed with exit0. All three runtime fixtures were
removed after settlement. Build artifacts and immutable receipts remain privately
in the approved directories. Each case compiled the fixed Rust source using the
existing1.98.0 toolchain with warnings denied; no dependency download or installation.
The recorded volume is NTFS. See index.json for all raw receipt names and
map-review.json for receipt hashes and every before/after map delta.

Manual map review found only preregistered unsafe control changes, positive/guarded
owner.txt updates, and the moved-directory guarded owner rename after child close.
No other owner/home/outside map delta occurred. Native failures preserve NTSTATUS;
owner Node failures preserve libuv codes and do not prove a specific Win32 cause.

Source correction review: Opus5 PASS, requested xhigh, complete frozen sources.
Independent raw-receipt review: Opus5 PASS for bounded fixture evidence only,
no blockers. runtime-review.md retains the complete judgment; completion.json
attaches source hash comparisons, the exact index and build-evidence hashes.

The reviewer found one nonblocking reference mismatch: the leaf rename-effect
positive control links open/close events7/19 instead of the preregistered ready and
owner-write observations. The required observations exist at events10/18. This is
recorded without a source correction or rerun; the correction allowance is spent.
The index confirms three initial runs, no supersedes, no stopped case. Frozen
source hashes match the source review and live files. Build logs remain retained.

Guarded moves were refused: no post-successful-move safety was demonstrated.
The three effect-recorded claims only record behavior. Unsafe controls are
sequential simulations; aliases and file edits are ordinary owner access, not
protection against adversarial alias changes or lost updates. Only one local NTFS
volume was exercised; fixture attributes include compression. The initial child
startup delay of roughly12-17s is unexplained, not assigned to antivirus as fact.
Maps cover the runtime fixture, not the whole host. Only the moved-directory target
has a same-instance post-close rename contrast; ancestor release was not measured.
These limitations remain agent-owned at the next production contract/proof gate.

## Delivery implications and remaining gaps

This supports further design of a Windows handle-relative containment mechanism
at and below an already-held ancestor. It does not approve a production helper,
dependency, API, native distribution, or restrictions on owner directory renames.
Native packaging, ABI support, signing/release, maintenance and platform coverage
would impose additional work that requires a concrete proposal before adoption.

Unproved: safe bootstrap above the held ancestor; malicious or replaced sibling
aliases; symbolic-link, UNC/network,8.3 and non-NTFS semantics; non-Windows behavior;
lock ownership/publication/takeover/release; liveness domains; crash recovery,
durability, child quiescence and restore publication. Agent owns these at the P07
contract/review gate and later approved seams; no portable safety claim is made.
The next decision must address owner rename effects and the native delivery cost
alongside the complete protocol/API before any production RED tests.

Source-review advisories remain bounded: keep the approved180s total deadline
(reject the suggested relaxation); timer unref, stricter positive selectors and
stderr truncation markers are optional future harness considerations only if that
harness is reused under newly approved scope. Existing assertions and deadline
downgrades remain enforced. No second correction or extra run is authorized here.

Inbox correction: both ez-deploy reports are in the MAIN project's docs/inbox,
not missing. p07-inbox-location-2026-09-21.json records their exact paths and hashes.
They concern the main source CLI; branch behavior and resolution remain unverified.
Agent owns validation during inbox triage before claiming those defects resolved.

INDEPENDENT EXPERIMENT REVIEW
# Section21 containment experiment: final evidence review

**Verdict: PASS, for bounded Windows/NTFS fixture evidence only.**

This is not product acceptance. It grants no authority for corrections, reruns or approval of rename restrictions.

**Concrete blockers:** none found.

## Independently verified

- **Provenance**
  - All three receipts carry the same source digests: probe.rs `0fb2a0…`, supervisor.cjs `dd2b5d…`, README.md `236ac7…`.
  - `sourceStable` and `binaryStable` are true in every run.
  - The compiler is rustc 1.98.0 with `-D warnings`. `binarySha256` is non-null in each receipt, which the code only allows when the build status is 0.
  - Binary digests differ per run, most likely because each build uses a different output directory. No cross-run binary identity is claimed, so this is acceptable.
- **Scope volume**
  - The volume query reports NTFS, serial 540572784.
  - This matches the handle's volume and Node's `dev` value.
- **Object identity**
  - The candidate's reported file ID (indexHigh<<32 | indexLow) equals the owner-observed `ino` for the target. This holds in all three positive phases and in the parent-swap guarded phase.
  - Example: 0x930000/238292 → 41376821576704724, and 0x11F0000/240233 → 80783318316198505.
  - So the guard held the same object the owner addressed.
- **Nine claim/control mappings**
  - All 18 control IDs reference existing events from the correct phase.
  - Each unsafe violation event follows a passing detector check or a successful unguarded action.
  - **Parent-swap, guarded:**
    - Target and ancestor renames were refused with EBUSY at both points (events 28/29/34/35).
    - The junction EEXIST is recorded as a non-claim.
    - Relative create and disposition-delete succeeded, and the outside map was unchanged.
    - The aliases resolve to the same object, and the owner write read back correctly.
  - **Leaf-swap, guarded:**
    - Exclusive create was refused for a file (0xC0000035) and for a directory and junction (0xC00000BA). Each per-kind map was unchanged.
    - Inspect succeeded on the regular file and was refused at open for the directory and junction.
    - The target rename got EBUSY, and the owner write was preserved.
  - **Moved-directory, guarded:**
    - Target and ancestor renames got EBUSY.
    - Create and remove succeeded in place, and the owner write was preserved.
    - The rename after child close succeeded (events 35→36).
- **Full map diff**
  - I compared every before/after entry. The deltas are exactly the following:
    - **Preregistered unsafe effects:**
      - Parent-swap: alias retargeted, target replaced by a junction, `moved/` created, `outside/probe.txt` changed.
      - Leaf-swap: `moved/` containing the junction leaf.
      - Moved-directory: `moved/owner.txt` changed, `ancestor-moved/` created.
    - **Owner writes:** positive and guarded `owner.txt` became sha('owner-updated').
    - **Post-exit rename:** the moved-directory guarded target became `after-exit`.
  - `home/` is unchanged, no `probe.txt` remains, and the positive/guarded `outside/` trees are unchanged in all runs.
  - Dangling aliases are consequences of the registered renames, not new deltas. I concur with the implementing agent.
- **Closure, cleanup and timing**
  - Two children per run, each exiting 0 with empty stderr and observed close. The guard close event precedes process exit.
  - Cleanup is complete with no retained paths or errors.
  - Measured windows were 12.5–17.0 s, far below the 175 s deadline. Event sequences are contiguous and elapsed times are monotonic.

## Nonblocking defects and limitations

1. **Mapping mismatch.**
   - `positive:owner-rename-effect-recorded` links events 7 and 19, the guard open and close.
   - The README preregisters "guard ready plus successful ordinary owner write" instead. Those observations exist (events 10 and 18) but are not linked.
   - Record this in the disposition; do not correct it.
2. **Unverifiable from this packet.**
   - I cannot hash the presented text, so its binding to the recorded digests rests on the implementing agent.
   - `index.json` and the build logs are absent. The claims of exactly three initial runs, `supersedes: null` and the stop state are therefore unverified.
   - Attach a read-only hash comparison and an index excerpt to the disposition. That is neither a correction nor a rerun.
3. **Mechanism concentration.**
   - Every guarded containment result in parent-swap and moved-directory rests on rename/delete denial, because the guard omits FILE_SHARE_DELETE.
   - No move ever succeeded, so handle-relative behaviour after a real move was never exercised. The defensive refutation paths are untested.
   - "moved-object-boundary" here means "held directories could not be moved." It does not mean "post-move mutation is bounded."
4. **EBUSY attribution.**
   - Only libuv codes are recorded.
   - Parent-swap and leaf-swap contrast against a different fixture instance.
   - A same-instance release contrast exists only once: the moved-directory target, not the ancestor.
5. **Recording claims.** The three `*-effect-recorded` claims are set unconditionally. Their "mechanism-observed" status says nothing about whether the rename restriction is acceptable.
6. **Non-adversarial claims.** `alias-same-object` and `owner-file-write-preserved` show that the guard did not impede ordinary owner access. The guard does not protect aliases or prevent lost writes; the unsafe controls only validate detectors.
7. **Narrow sample.**
   - One run per case.
   - Unsafe controls are sequential simulations, not races.
   - Only the Node/libuv rename path was exercised.
   - Fixture directories carry the NTFS compressed attribute (0x800).
   - There is an unexplained 12–17 s first-spawn delay, plausibly an antivirus scan, though still within bounds.
8. **Delta coverage.** Receipts do not enumerate the expected unsafe deltas; I derived them from the supervisor code. The maps cover only the run directory.

## Overclaims to avoid

- "Relative handles contain moved directories."
- "Rename restrictions are approved."
- Any inference to other filesystems or volumes, network paths, symbolic links or 8.3 names.
- Any release-latency bound.
- Production readiness.

## Remain UNPROVED

- Root bootstrap above the held ancestor.
- Adversarial aliases.
- Portable locking and takeover.
- Durability.
- Crash and quiescence.
- Production packaging.
- Owner approval of rename restrictions.

