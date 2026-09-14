# PR4 disposition proposal and review packet

## Decision to review

Recommend superseding the unmerged legacy doctor with acceptance tests and
recovery documentation for the supported install/update path. Do not close PR4
until the user accepts that scope decision. Do not label the current doctor
complete, approve it, or treat a diagnostic-only version as its promised repair.

This proposal supersedes the earlier assumption that retaining a standalone
doctor frontend is necessarily desirable. The user's latest instruction is to
consider everything necessary to reach the project end state, including whether
the strict refusal policy arose from misleadingly narrow choices.

## End state and boundary

The September 5 contract calls for a thin Open GSD skin, exact vetted adoption
through 1.12.0, working Windows Claude/Codex and supported Linux installation,
preserved local customizations, repeatable updates and tested recovery. Existing
planning decisions remain; a new strategic audit is outside this bounded work.

The application owner works in this repository; a separate owner handles CI
infrastructure and monitoring. PRs 4, 69 and 70 are assigned in that order, with
independent work permitted after finishing unblocked work on a decision-held PR.
No approval, merge, force-push or draft-readiness change is authorized.

## Current evidence

1. PR4 is open at `17278b2a9b28e58f561fcbdf02c96a20cb5415c8`. Its original May
   rationale explicitly describes a temporary repair for legacy v1.41/v1.42
   installations while upstream's normalizer was pending. It also proposes
   lasting diagnostics and repair of the matching shape in arbitrary hooks.
2. Open GSD 1.8.0, 1.9.1 and the fixed 1.12.0 package all contain the managed
   hook normalizer. Calling each real function on an inert managed JS fixture
   changed actual Bash execution from syntax failure (exit 2) to the expected
   output (exit 0). The installer invokes that function.
3. The actual candidate wrapper at
   `b4f2107e61410fa828812762ef969c444e172936` ran in an isolated Windows home,
   exited 0, removed the stale managed command shape without duplication,
   preserved an existing timeout, and retained an owner hook, status line and
   unrelated object. This is behavior evidence, not security/interruption proof
   or final installed 1.12.0 acceptance.
4. The doctor ignores hook type, per-entry shell and presence of an args array.
   It prescribes the same Bash rewrite for explicit PowerShell, direct execution
   and malformed/non-command entries. The upstream normalizer has related
   context gaps too, including ignoring an empty args array. Those require
   disposition in a supported migration, not blind reliance on upstream.
5. The original broken shape was absent from three inspected local settings
   files. This does not establish a clean fleet or prove all hooks work.
6. Package `files` excludes both doctor modules; no package bin or launcher
   routes to them. `npm pack --dry-run --ignore-scripts --json` also excludes
   them. That dry run had only 14 entries because this PR4 checkout lacks a
   composed dist; it is not a final package-completeness result. Static files
   rules and source routing establish the independent doctor delivery gap.
7. The exact branch delta adds the two doctor modules, four test files and a
   review document. No existing production consumer was found referencing the
   proposed tool. The repository's existing `/gsd:health` serves planning-state
   integrity; it is not a substitute for hook-execution validation.

## Safety policy: separate harms from mechanisms

The original user choices were refusal when ACLs/ownership cannot safely be
preserved, and useful repair without elevation. The user now expressly invites
examining these choices. They have not approved a weaker implementation.

Real harms include lost owner settings, access expansion or loss, changed audit
behavior, executing the wrong hook, a broken config after interruption, and
hidden support/maintenance burden. An unreadable attribute is a limit on our
evidence; it is not itself proof that an operation changes that attribute.

The current doctor replaces the original object with a new one. Its inspector
therefore demands full descriptor equality and refuses unknown metadata. Windows
inspection requests audit-security read privilege; Linux inspection demands
CAP_SYS_ADMIN to rule out hidden trusted xattrs. The result is refusal for the
ordinary accounts this tool was meant to help. This is an implementation/contract
conflict, not evidence that the user must choose elevation or TxF.

Supported Windows ReplaceFile preserves documented properties including DACLs
and streams and can fail when merging them fails. Its public preservation list
does not establish complete owner/SACL equivalence. An existing-object write
avoids replacing the security-bearing object but introduces partial-write and
recovery concerns. Neither is automatically accepted or ruled out solely because
we cannot inspect every attribute. Their exact guarantees matter only if this
product needs an independent writer at all.

The isolated TxF prototype proved bounded ordinary-account commit/rollback,
retained file identity, readable owner/DACL and streams. It did not prove full
SACL preservation or interrupted-process recovery. Microsoft discourages new
dependencies, it does not give a cross-platform solution, and stream backups
share the original file's deletion lifetime. Do not adopt it for this proposal.

## Alternatives and recommendation

| Alternative | Value | Cost / unresolved obligation | Assessment |
| --- | --- | --- | --- |
| Finish the existing generic standalone repair | Repairs old installs without upgrading; arbitrary matching hook names | Runtime-sensitive parser, cross-platform file-security/backup transaction, distribution, installed support and ongoing maintenance | Historical value exists; no demonstrated present need justifies this expansion for the skin goal |
| Ship diagnosis only | Read-only visibility | Does not satisfy promised repair; new CLI/distribution burden and classifier currently unsound | Not a completion shortcut; add only if a concrete support workflow needs it |
| Supersede the legacy PR; cover repair through vetted install/update | Aligns with upstream migration and the intended maintenance lifecycle; reduces duplicate mechanisms | Must prove migrated legacy fixtures, current shell/args boundaries, customization preservation and recovery in the actual artifact | Recommended, subject to user acceptance and explicit successor gates |

Do not claim this recommendation solves the installer's outstanding persistence
issues. It removes an unshipped parallel writer; the existing installer still
must satisfy the safe-update contract. Avoid casually broadening the upgrade
path to rewrite arbitrary owner hooks. That broader behavior in PR4 is explicitly
foregone by this recommendation and belongs in the user's decision.

## Concrete successor acceptance if the user agrees

1. Preserve PR4 branch, regression evidence and history; close as superseded,
   not merged or accepted. Carry the useful path/symlink/security lessons into
   installation acceptance rather than deleting their evidence.
2. Add representative old managed-hook fixtures to the existing isolated
   install/upgrade harness. Assert actual execution, idempotence, preserved hook
   options, unrelated owner hooks/settings and special-character paths.
3. Refuse or preserve unowned/unsupported entries; never rewrite an explicit
   PowerShell or direct-exec entry as Bash. Malformed/unknown must be surfaced
   rather than reported clean. Fix the narrow integration seam or justified
   overlay; do not duplicate all upstream hook logic.
4. Verify selected-target containment, custom directory quoting and linked
   paths. Installer's config-directory selector is not equivalent to the
   doctor's arbitrary `--settings` file selector; do not claim parity.
5. Complete the already-open installer preservation, rollback, concurrency and
   native failure gates on supported platforms. Do not relax them through this
   disposition. Any changed security/recovery promise requires a separate,
   concrete risk-backed contract decision before implementation is accepted.
6. Repeat migration proof on final composed and installed 1.12.0. Record exact
   source/artifact hashes and commands. Only then close the successor acceptance
   item and notify the original consumers through their inboxes.

Old installations that cannot upgrade and arbitrary owner hooks would use a
reviewed manual/config-owner repair until a concrete demand justifies a reusable
tool. This is a deliberate support-scope tradeoff for the user to accept, not a
claim that all historic PR4 acceptance criteria were fulfilled.

## Review ask

Review this packet only, without tools or edits. Return a bounded critique:

1. Is superseding PR4 aligned with the end state, or an evasion of a live need?
2. Which assumptions need further evidence before presenting this decision?
3. Does the proposal preserve a concrete owner and trigger for every displaced
   behavior or defect, without smuggling a weaker safety policy into PR69?
4. Challenge the strict-refusal framing: identify any distinction between real
   security harm and implementation-induced proof requirements that is missing.
5. Recommend one disposition, list material user decisions, and identify any
   must-fix flaw in the proposed successor acceptance. Do not redesign CI or
   approve implementation. Keep the critique under 1,200 words.

Evidence directory:
`C:/Users/Destiny/.codex/reports/gsd-application-2026-09-13/`.
Receipts: `pr4-paradigm-112.json`, `pr4-reinstall-probe.json`,
`pr4-package-dry-run.json`, `pr4-unprivileged-red.tap`.
Earlier assessment: `docs/reviews/pr4-first-principles-2026-09-14.md`.

Primary sources:

- https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacefilew
- https://learn.microsoft.com/en-us/windows/win32/fileio/deprecation-of-txf
- https://code.claude.com/docs/en/hooks
