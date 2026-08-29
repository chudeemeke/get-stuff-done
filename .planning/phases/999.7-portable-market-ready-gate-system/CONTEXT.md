# Phase 999.7 Context: Portable Market-Ready Gate System

## Status

Backlog parking lot. This is registered ownership and durable scope, not an
active implementation phase.

## Why This Exists

Authkey produced a useful general pattern: readiness claims need current,
durable evidence across product truth, architecture, security, AI-agent safety,
testing, operations, install/upgrade, documentation, recovery, and human trust.
The portable system belongs in get-stuff-done because it is reusable GSD
methodology. Conversations owns only portfolio adoption and orchestration.

## First-Principles Boundary

The system must provide the minimum structure implied by these truths:

1. A readiness claim is invalid when its evidence is missing, stale, indirect,
   or scoped more narrowly than the claim.
2. Machine checks cannot honestly replace human UX, trust, and domain review.
3. One universal checklist will either be shallow or overfit; a baseline plus
   typed project overlays is required.
4. Exceptions are risk decisions with owners and recheck triggers, not prose
   waivers.
5. The reusable implementation and portfolio coordination need one contract but
   separate ownership boundaries.

## Locked Ownership

- `get-stuff-done`: gate taxonomy, schemas, templates, generator/checker,
  project overlays, evidence/exception lifecycle, and reusable verification.
- `conversations`: adoption inventory, reminders, stale-evidence visibility,
  and portfolio summaries over get-stuff-done outputs.
- Consumer projects: project-specific configuration, evidence, exceptions, and
  human review.

Do not create a second implementation in conversations and do not make
consumers depend on authkey.

## Activation Trigger

Promote after v1.2 Phase 44 ships, unless the user explicitly reprioritizes it.
The reason is sequencing, not a lower quality bar: Phase 43/44 are producing the
real evidence contracts that should become pilot inputs, while starting a new
multi-project methodology product now would delay the current release and mix
two definitions of done.

## Required Promotion Workflow

1. Re-read both paired inbox items and the current conversations target feed.
2. Run `/gsd-discuss-phase 999.7` and a feature specification interview for
   user-facing command/artifact choices.
3. Inventory existing GSD verification, quality-gate, UAT, exception, evidence,
   and release artifacts before adding new concepts.
4. Derive a project-neutral domain model and port/adapter boundary before
   choosing commands or markdown layouts.
5. Obtain Fable's lead developer/architect/designer decision on the whole design
   and pilot strategy before implementation.
6. Plan with TDD, independent 95% coverage metrics, security review, and
   candidate-project fixtures.

## Minimum Product Contract

- Stable requirement, gate, evidence, exception, and human-review records.
- Blocking/advisory/manual distinctions and explicit evidence freshness.
- Baseline plus overlays for at least Node, Rust, web/UI, and AI-agent-facing
  products without weakening the baseline.
- Machine-readable and human-readable status.
- Refusal to claim ready when required evidence is stale or absent.
- A read model conversations can consume without owning gate execution.
- Pilot proof across materially different first-party projects.

## Explicit Non-Goals At Capture

- No Phase 43 or Phase 44 source expansion.
- No authkey-specific universal checklist.
- No portfolio task store inside get-stuff-done.
- No claim that AI review alone satisfies UX/trust acceptance.
- No implementation before discuss/spec and Fable review.

## Evidence At Capture

- Coordination key search found only the paired inbox/control-plane records and
  existing project-specific quality gates, not a reusable implementation phase.
- Conversations records get-stuff-done as implementation owner and explicitly
  forbids duplicate implementation.
- Phase 43 context decisions D-23 already place this outside upgrade resilience
  and require Phase 44 or a dedicated methodology phase; this backlog chooses
  the dedicated post-v1.2 path.
