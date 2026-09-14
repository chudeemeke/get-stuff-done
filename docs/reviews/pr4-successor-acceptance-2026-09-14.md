# Proposed successor to PR4

Status: proposed, awaiting the user's support-scope decision. No PR is closed.
Owner: get-stuff-done application development in this CLI.
Decision: replace a separate arbitrary-settings legacy repair tool with verified
migration through the supported install/update lifecycle. Preserve PR4 history.

This is a scope disposition, not proof that PR4's promised repair works. Its
remote head remains `17278b2a9b28e58f561fcbdf02c96a20cb5415c8`. No code is approved
or merged. Until accepted, the prior repair contract remains the baseline.

## Entry ownership and disposition matrix

This is the proposed behavior contract, not a description of current upstream.
Classification occurs before mutation. Diagnosis must not execute owner hooks.

| Entry / target class | Required disposition | Proof |
| --- | --- | --- |
| Known GSD-managed legacy JS hook, verified source root/ownership, effective Bash, exact recognized broken form | Normalize through the existing migration; preserve event, matcher and all other entry fields | Actual hook fixture fails before and succeeds after installed migration; second run is stable |
| Valid explicit PowerShell command | Preserve command and shell together; do not apply a Bash transformation | Before/after bytes and actual inert PowerShell execution |
| Valid direct executable form, including `args: []` | Preserve executable and arguments as a pair | Before/after equality plus direct execution; an empty args array still selects exec form |
| Other supported valid GSD command form | Preserve unless a separately identified upstream migration applies | Existing upstream fixtures plus installed no-op behavior |
| Owner hook outside verified GSD ownership | Preserve exactly; matching basename alone does not grant ownership | Lookalike filename outside managed root and owner custom entry fixtures |
| Non-command hook type | Preserve entry; do not reinterpret an extraneous `command` field as shell code | Prompt/HTTP entry fixtures |
| Recognized legacy GSD-looking entry whose ownership or effective execution form cannot be established | Refuse migration before changing the target; name the ambiguous entry and the required clarification | No-mutation receipt, including settings and installed payload |
| Malformed settings or malformed owned entry (invalid args/shell/structure) | Refuse before mutation with an actionable diagnostic; do not call it clean | Exact original bytes and failure outcome |
| Conflicting duplicate owned entries | Refuse before mutation; do not silently choose options or delete one | Duplicate entries with different options remain intact |
| Linked settings target or publication path below selected root | Preserve/refuse under existing target-containment contract; retain the explicitly selected root alias semantics | Native symlink/junction fixtures and outside sentinel |
| Settings change after capture | Conflict, with newer owner bytes preserved; do not overwrite during apply or rollback | Competing-writer fixture at each publication boundary |

Ownership must be established using existing installation provenance and the
resolved target, rather than a new guessed filename registry. If old provenance
cannot distinguish an owner replacement, the ambiguity row applies. The installer
must not overwrite that same uncertain file later in another stage.

Current upstream does not satisfy all these rows: shell/type/empty-args handling
is a reproduced integration gap. Owner: GSD application development. Trigger:
correct the smallest supported seam or justified overlay before recommending
the affected engine step or closing this successor. Final proof also runs at
the fixed composed/installed 1.12.0 endpoint.

## Acceptance and linkage

| ID | Required result | Existing owner surface / retirement trigger |
| --- | --- | --- |
| H1 | A user with a broken managed Bash hook can start the supported installer from a regular terminal and reach migration | GSD application, isolated native install fixture; old hook must not be invoked as an installer prerequisite |
| H2 | Matrix above passes against the actual candidate artifact, with options, unrelated settings and custom paths preserved | GSD application, add to existing installation/upgrade harness before adoption recommendation |
| H3 | Documented normal-account maintenance succeeds; target ACL/ownership policy, backup exposure and interruption behavior are explicit and proven | PR69 `docs/reviews/pr69-application-2026-09-13.md`, blockers 1, 3, 5 and 7; no safety policy change hidden in this transfer |
| H4 | Rollback accounts for new files, metadata and newer owner changes; corrupted ownership evidence refuses safely | Same PR69 report, blockers 1 through 6; no mixed installation accepted |
| H5 | Windows Claude/Codex and supported Linux installations meet the final delivery/recovery contract; existing supported platforms are not silently dropped | `.planning/SKIN-COMPLETION.md`, working installs and safe updates; final 1.12.0 source/artifact/runtime receipts |
| H6 | Current diagnostics and remediation are discoverable through the supported maintenance documentation | GSD application, update the existing reinstall/troubleshooting guidance after commands and error outputs are validated |
| H7 | Historical arbitrary-file behavior has an explicit support disposition | User accepts the scope choice below; GSD application records it before PR4 closure |
| H8 | Final result, remaining risks, head and CI handoff agree | GSD application, source/review/installed acceptance and inbox closure; CI owner runs existing gates on the published head |

This adds a bounded migration contract to installation acceptance. It must be
reviewed as application behavior, not smuggled into PR69 as incidental tests.
The existing installer remains held on its existing findings regardless of PR4's
disposition. Neither current green hook probes nor retirement of a parallel writer
establish a safe installed product.

## Support-scope decision

Recommended: the vetted installer/update path owns automated GSD-managed hook
recovery. Do not ship a separate tool for arbitrary settings files and arbitrary
owner hook commands as part of this completion campaign.

This gives up automatic repair without upgrading legacy installations, and the
doctor's arbitrary `--settings` file capability. Installer `--config-dir` selects
a directory and is not equivalent. The affected historical installs are not
declared nonexistent; no fleet census has been performed.

Support owner: GSD application development. Intake: this repository's owning
`docs/inbox/`, with affected runtime/source version and a sanitized reproduction.
One reproduced supported installation that cannot reach the vetted maintenance
path reopens this decision before release. One user-confirmed requirement to
maintain an otherwise unsupported legacy version triggers a bounded support-scope
decision. Neither trigger requires restarting the strategic audit.

For a non-upgradable or ambiguous case, preserve the configuration and stop the
automated change. The application owner must qualify a case-specific repair with
the configuration owner; there is no currently tested universal manual repair
procedure or guarantee. Do not tell users that arbitrary editor saves preserve
their security metadata. This support limit is part of the proposed decision.

After user acceptance, record the successor and close PR4 as superseded only
when that disposition is explicitly authorized. Preserve the branch and evidence.
The successor remains open until H1-H8 are proven. GSD application development
owns closure notifications to the original consumer inboxes; CI owns no product
acceptance decision.

## Independent review disposition

Codex 0.154.0, live-resolved gpt-5.6-sol/xhigh, session
`01a09e2a-6f9b-79b1-9e3a-b216a71598b6`, exited 0 reviewing the cold packet without
tools. Verdict: supersede-with-successor is appropriate as an explicit support
choice, not proof that the live need vanished. Its must-fix requirement for a
normative ownership/disposition matrix is addressed above, as are displaced
behavior owners and triggers. The matrix is a revised proposal, not independently
verified implementation. No final application sign-off is claimed.

Other requested user decisions about exact security properties are premature
until a writer is being accepted; this scope choice does not relax PR69's current
contract. The existing project defines runtime/platform scope. Malformed and
ambiguous owned entries default to pre-mutation refusal, a reversible choice.
Claude architecture review remains unavailable after the earlier quota rejection;
the cold packet is retained for later review.
