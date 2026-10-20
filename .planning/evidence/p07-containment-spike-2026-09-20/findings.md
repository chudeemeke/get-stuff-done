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
