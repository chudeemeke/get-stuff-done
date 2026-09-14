# PR4 first-principles reassessment

Date: 2026-09-14. Application owner: get-stuff-done CLI.
Source: PR4 `17278b2a9b28e58f561fcbdf02c96a20cb5415c8`.
Status: bounded assessment; no production implementation or release acceptance.
This supersedes the proposed next decision in `pr4-native-repair-2026-09-14.md`.

Current disposition proposal and successor matrix:
`pr4-successor-acceptance-2026-09-14.md`. A bounded independent critique supports
supersession as an explicit support-scope choice, not a claim that every legacy
need vanished. That concrete choice has been presented to the user; no answer is
inferred. PR4 remains open and its implementation unchanged.

## Latest user steering: assess the requirements too

The user explicitly invited reconsidering the strict-refusal policy, including
whether the options previously presented led to an inaccurate understanding or
an unnecessarily rigid constraint. The aim is the project end state, not forcing
PR4's current implementation through its accumulated requirements.

The right boundary for this reassessment is the September 5 skin completion
contract: a thin, maintainable fork with working supported-runtime installations,
safe updates, preserved owner customizations, reliable recovery and validated
upstream adoption. `.planning/PROJECT.md` supports the thin-overlay direction
but contains older version/status claims; the completion contract and live
evidence take precedence. There is no reason yet to reopen portfolio strategy,
change the GSD workflow methodology, or repeat the D1-D11 strategic interview.

Work backward in this order:

1. Identify the real maintenance failure that would prevent that end state.
2. Establish whether the failure survives the supported upgrade/install path,
   and whether a separate repair product is necessary at all.
3. Identify the concrete harms to prevent: lost settings, unexpected access
   changes, ineffective hooks, unrecoverable updates and ongoing support burden.
4. Compare proportionate mechanisms, including consolidating or superseding
   PR4, against those harms and the full installation/recovery lifecycle.
5. Only then set the revised acceptance contract and choose implementation.

The user's prior refusal decision is therefore an input to reassess, not an
axiom exempt from scrutiny. This does not itself authorize weakening behavior or
shipping a changed contract. Present any changed guarantee concretely, with its
residual risk and tested recovery, rather than another abstract strict/lenient
choice. The no-approval/no-merge instruction is unchanged.

**Pause the proposed classification implementation slice until this product-level
assessment establishes whether the standalone doctor should remain.** The
classifier findings remain valid evidence and require disposition if its code
ships. Neither sunk work nor the existence of a PR establishes product value.

## Correction to the framing

The previous investigation asked how a standalone doctor could atomically
replace an arbitrary settings file while proving preservation of every security
attribute with an ordinary account. It reached privileged inspection and then
Transactional NTFS (TxF). That investigated a selected implementation more
deeply than it investigated whether that implementation still served the problem.

The statement that no simpler mechanism was proven **under those assumptions**
was not proof that TxF was the right architecture, or that no other design could
meet the user's outcome. The proposed TxF-versus-blocked owner decision is
withdrawn. There is no pending request to relax the user's security policy.

## Existing acceptance baseline and its provenance

This table records the inherited contract; it does not claim every row is an
irreducible truth. In particular, strict refusal, exact backup form and atomic
visibility are candidate policies/mechanisms to evaluate against the harms above.

| Requirement | Provenance and implication |
| --- | --- |
| Hooks must execute correctly in the intended runtime | Original defect: a PowerShell command was passed to Bash. Command text alone does not identify the execution contract. |
| Repair the selected settings file | Original custom-path issue; preserve quoted `--settings`, including spaces, and the accepted symlink refusal. |
| Preserve unrelated owner configuration | Original acceptance. Preserve semantics and do not silently round numbers or reinterpret unrelated hook types. |
| Preserve ownership and custom access controls; otherwise refuse safely | Earlier user decision, now explicitly open to reassessment. Explain what can be preserved by a supported API contract versus what must actually be inspected. |
| Ordinary non-elevated repair must work | Earlier user release requirement. Evaluate the supported maintenance experience; safe refusal alone cannot be relabeled as successful repair. |
| Atomic publication, exact backup and useful failure recovery | Existing PR contract and review acceptance. Distinguish atomic visibility, durability, recovery and backup confidentiality; do not silently exchange one for another. |
| Keep ownership and acceptance truthful | Application fixes stay here; CI has a separate owner. No approval, merge, draft readiness or contract reduction is authorized. |

Whole-file JSON reserialization, sibling-file replacement, a doctor-specific
security inspector and NTFS alternate-stream backups are implementation choices.
They are not separately mandated by the user. Changing an existing observable
backup or failure guarantee still needs an explicit contract decision.

## Minimum structure if a repair capability is still justified

1. Resolve the target and actual execution form: runtime, hook type, shell or
   executable-plus-arguments form, and whether GSD owns the entry.
2. Produce a deterministic repair plan only where the defect and intended
   transformation are established. Distinguish valid, repairable, unsupported
   and malformed entries; unsupported must not be reported as clean.
3. Apply only the approved changes through a bounded settings-write operation
   with explicit concurrency, security, backup and interruption guarantees.
4. Re-read and validate the result, preserve recovery evidence, and prevent the
   producer from emitting the defect again.

Diagnosis, migration knowledge and persistence are separate responsibilities.
A repair CLI can be a small frontend to that flow; it does not inherently need
to own a second installation or filesystem transaction system.

## Comparison with existing infrastructure: verified findings

### Upstream already migrates this stale managed command

Both installed dependency versions, Open GSD 1.8.0 in the PR4 worktree and 1.9.1
in the candidate campaign, contain `rewriteLegacyManagedNodeHookCommands` in
`gsd-core/bin/lib/runtime-hooks-surface.cjs`. The real upstream installer invokes
it before generating hooks. The doctor header's assertion that reinstall cannot
self-heal this shape is stale. The archived May 13 inbox's May 14 correction
also identifies the original shared Gemini/Claude command-emitter regression;
the doctor's claim that origin remains unpinned is stale.

Retained probes called each actual pinned migration against an inert temporary
managed hook. Bash exited 2 on the old command and 0 with the expected output
after migration, for both versions.

A separate probe ran the **actual candidate wrapper installer** at
`b4f2107e61410fa828812762ef969c444e172936`, with an isolated OS-temp home and
configuration directory. It exited 0, normalized the stale managed hook without
duplicating it, retained its timeout, and preserved an unrelated object, owner
hook and owner status line. Temporary fixtures were removed.

This is positive migration evidence, not whole-installer release acceptance.
Upstream `writeSettings` still writes JSON directly with `fs.writeFileSync`.
The probe does not establish ACL preservation or interruption safety, and the
candidate installer has separately recorded unresolved application findings.
Blindly telling the doctor to run a full reinstall is therefore not a fix.

### The doctor's classifier lacks execution context

`diagnose` and `walkHookCommands` pass every string `h.command` into a regex
without considering `h.type`, `h.shell` or presence of `h.args`. The probe produced
the same finding for Bash, explicit PowerShell, exec form with `args: []`, and
a non-command entry containing an extraneous command field.

These cases are not all valid configurations. The defect is that the doctor
prescribes the same Bash rewrite without establishing their meaning. In explicit
PowerShell, `&` is a legitimate call operator. In exec form, the command is an
executable path, not a shell program to rewrite. Malformed input needs its own
diagnostic. The upstream migration also ignores per-entry shell/type and skips
only nonempty argument arrays, so reusing it requires a guarded integration,
not assuming that upstream is correct for every modern schema.

Current official Claude documentation supports direct executable-plus-arguments
hooks, which avoid shell quoting. This is a prevention candidate only after
checking the supported runtime versions; it is not authority to migrate older
installations blindly. Adding another settings layer or plugin hook cannot be
assumed to remove an already configured legacy hook.

Read-only diagnosis found no matching legacy shape in the user's global Claude
settings, this project's Claude settings, or its local settings. This bounds the
observed local urgency; it is not a fleet-wide cleanliness or runtime-health claim.

## Decision and bounded next work

**Do not adopt TxF for PR4 now. First establish whether PR4 should remain a
separate repair capability.** If it should, the current evidence favors correct
runtime-aware migration and one accountable settings-write boundary.

The TxF experiment was useful capability evidence: an ordinary account could
commit or roll back changes to an existing NTFS object while retaining its file
ID, readable owner/DACL and streams. It did not verify the full audit descriptor,
process-kill recovery or other filesystems. Stream backups also share the original
file's deletion/replacement lifetime. Microsoft discourages new TxF dependencies
and warns that the API may be unavailable in future Windows versions.

The reusable asset is upstream's managed-hook migration knowledge. The doctor can
retain diagnosis, preview and repair as a frontend, with the already validated
target-path and symlink safeguards. Avoid duplicating migrations or silently
changing the existing treatment of owner-managed hooks: establish and preserve
that scope, or present a concrete scope change for user acceptance.

If that capability remains justified, the first implementation slice is
classification, backed by regression tests for
explicit Bash/PowerShell, direct execution including empty args, non-command and
malformed entries, unknown runtime, managed and owner hooks, and special paths.
Then qualify the existing migration through that boundary without performing a
full install. Separately compare documented supported write mechanisms against
the exact required security and recovery properties, including concurrent edits.
Sharing a writer is responsibility consolidation, **not a solution to the
unproven ordinary-account atomic-write guarantee**. No generic persistence
framework, database, elevation broker or TxF backend is justified by this finding.

Assess whether the inherited guarantees are proportionate before spending more
effort proving them. If they should change, present the concrete harm, mechanism,
evidence and residual risk. If retained guarantees cannot be jointly proven on a
supported platform, explain the precise conflict and a tested alternative.
Do not ask the user to repeat previous answers; the latest steering explicitly
authorizes examining how those answers were framed.
Do not declare diagnosis-only behavior, reinstall success or a green mock-based
suite sufficient. PR4 remains blocked on application correctness and native repair
acceptance; it is not waiting for CI to fix this.

## Evidence and review

Retained reports are under
`C:/Users/Destiny/.codex/reports/gsd-application-2026-09-13/`:

- `pr4-paradigm-probe.cjs` and `.json`: real pinned migration calls, source hashes
  and actual inert Bash executions; classifier observations.
- `pr4-reinstall-probe.cjs`, `.json`, `.log`: actual isolated candidate installer.
- `pr4-txf-probe.ps1`, `.log`: bounded native capability experiment.
- `pr4-unprivileged-red.tap`: actual doctor remains unable to repair as this
  ordinary account; this is a failing acceptance test.

The earlier Codex TxF design review is qualified by its narrower assumptions.
The fresh end-state-first critique completed at exit0, session
`01a09e2a-6f9b-79b1-9e3a-b216a71598b6`; its packet is
`pr4-disposition-review-2026-09-14.md`, verdict `pr4-disposition-sol.md` in the
external reports directory, and dispositions are in the successor matrix.
Claude review remains pending after the earlier Fable/high quota rejection;
that rejection is not review evidence. No final production sign-off is claimed.

Primary references:

- [Microsoft: alternatives to TxF](https://learn.microsoft.com/en-us/windows/win32/fileio/deprecation-of-txf)
- [Microsoft: ReplaceFileW contract](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacefilew)
- [Claude: hook execution forms and configuration](https://code.claude.com/docs/en/hooks)
