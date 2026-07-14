---
reviewer: Claude Fable
date: 2026-07-14
scope: whole-project hosted-CI blocker
status: dispositioned
---

# Fable Hosted CI Blocker Review And Disposition

## Review Context

Fable was invoked through `claude -p --model fable` as the standing
whole-project critic after GitHub created zero-step failures for every PR #23
workflow. The first call timed out after five minutes and left one process;
only that process was stopped. A compact tool-free retry completed.

## Fable Recommendation

Fable classified work by whether it consumes Plan 11D's coverage authority,
hosted evidence, or global runtime state:

- Safe now: blocker/resumption records, completed-plan documentation, PR diff
  review, and work whose inputs survive any hosted verdict.
- Conditional: branch commits only when the future verdict binds the final
  head SHA.
- Forbidden: Plan 11D work, local-as-hosted claims, gate weakening, alternate
  CI substitution, merge, or rerun spam during the account lock.

Fable also challenged the ambient hosted gate and recommended a materialized
verdict containing head SHA, run ID, conclusion, and timestamp.

## Repository-Truth Disposition

Accepted:

- The account lock means no hosted evidence exists.
- The user owns the off-platform billing action.
- All locked-window runs are void as platform evidence.
- Plan 11D and every later Phase 43 implementation plan are transitively
  blocked.
- The verdict must become machine-checkable and exact-head bound.

Accepted with amendment:

- The verdict receipt is local and gitignored, not tracked. A tracked receipt
  changes the commit SHA it certifies and creates a self-invalidating loop.
- GitHub remains the authority. The local JSON is a fail-closed materialized
  read model over live PR, workflow, job, step, and annotation metadata.

Rejected as inapplicable:

- No remaining implementation plan can be drained independently. Live
  frontmatter shows 11D is the root and 11K through 12 consume it transitively.
- Branch-protection contexts alone cannot define the gate because the current
  protected context `Boundary & Override Check` is stale and the complete
  Phase 43 matrix is broader.

## Standing Consequence

Plan 11N may implement only the hosted-verdict and resumption boundary while
the account is locked. The standing Fable checkpoint remains active after the
first real hosted run and before Plan 11D.

## Plan 11N Delta Checkpoint

A repository-backed follow-up call timed out after five minutes and produced no
review result. Only that exact Fable process was terminated. A bounded,
tool-free retry then reviewed the verified project delta; its conclusions are
advisory and do not substitute for repository evidence.

Disposition:

- **Rejected as disproven:** a possible 11N/11D deadlock. Current CI invokes
  Bun coverage reporting but does not enforce Plan 11D's future four-metric
  threshold, so the pre-11D hosted gate is satisfiable.
- **Accepted and fixed:** contract self-attestation risk. A structured YAML
  parser now expands the five current workflow job topologies and requires an
  exact match to the JSON contract.
- **Accepted and fixed:** command-error secret exposure. Authorization headers,
  GitHub token forms, token assignments, and URL credentials are redacted
  before diagnostics can enter a receipt or output.
- **Accepted as an exact-head invariant:** the PR head is read before and after
  workflow evidence collection. A concurrent head change now fails closed
  instead of allowing a stale-head receipt.
- **Accepted as fail-closed:** the one-page collection bound. More than 100
  runs or jobs returns `collection_error`; implement pagination only if this
  explicit operational trigger is reached.
- **Retained:** publish the passed exact-head receipt evidence out of band in
  the PR after billing recovery. The local receipt remains gitignored.

The repository-backed implementation review remains due after the first real
hosted run and before Plan 11D, matching the standing whole-project checkpoint.
