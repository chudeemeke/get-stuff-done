# Coherent resume consumer integration

Recorded September 14, 2026. GSD application owner: this CLI session.
Protocol owner: Conversations O01. Status: consumer preparation complete;
implementation waits for the versioned contract receipt. No authority migration.

Authority: `docs/inbox/2026-09-14-conversations-coherent-resume-consumer-contract.md`
in the primary checkout and Conversations' O01-COHERENT-PUBLICATION-DESIGN.md.
This extends the recovery/state-integrity rows of SKIN-COMPLETION.md. It does
not replace D1-D11, the fixed 1.12.0 endpoint, or the application PR sequence.

## Verified source and publication ownership

Inventory: `.planning/evidence/coherent-resume-consumers-2026-09-14.json`, captured
at campaign head `3aea309becee1db93d2ee60f630ac5c28e6e76f7`, upstream 1.9.1.
The receipt contains file sizes and SHA-256 hashes, including installed files.

| Consumer | Build source and delivery | Integration responsibility |
|---|---|---|
| State setters | `overrides/gsd-core/bin/lib/state.cjs` -> `dist/gsd-core/bin/lib/state.cjs`; current bytes match exactly | Retain state locking, locked progress rescans, unknown/curated frontmatter preservation and no-op guards while participating in shared candidate publication. Review every writer, not just the two common functions. |
| Resume initialization | `overrides/gsd-core/bin/lib/init.cjs`, `cmdInitResume`; paths resolved by planningWorkspace | Return/use one generation's state and discovered membership after explicit adoption. Preserve workstream resolution. |
| Resume/pause prose | Upstream `gsd-core/workflows/resume-project.md` and `pause-work.md` -> branded `dist/gsd-core/workflows/`; no existing overrides for these files | Prefer a supported upstream integration seam; otherwise a justified narrow fork override. Do not patch legacy copies or upstream in place. |
| Command/skill adapters | Composed `commands/gsd/resume-work.md` and `pause-work.md` select workflows; upstream installer emits runtime adapters | Verify fresh Claude and Codex targets resolve to the intended composed generation. |
| Pre-compact | `hooks/index.js` declares **overlay/hooks/pre-compact.js**; `scripts/build.js` bundles to `hooks/dist/`; `scripts/finalize-dist.js` copies into `dist/hooks/`; wrapper publishes overlay | Edit the overlay source, not only `hooks/pre-compact.js`. Consume the shared reader and publish a candidate through the final protocol; retain diagnostic behavior. |

Existing dist is an intermediate compose snapshot: its pre-compact bytes match
the raw overlay rather than the bundle. This inventory is not a final artifact
or installed execution receipt. The finalization script's comment saying that
pre-compact needs no bundling contradicts its bundle list and the overlay's
`../src/platform/paths` import. Owner: GSD; correct that comment and verify final
packaging when implementing/delivering this adapter. No gate is waived.

## Installed inventory and route limits

- Global Claude contains Open-GSD VERSION 1.6.1. Its current resume and pause
  SKILL.md entrypoints reference `$HOME/.claude/gsd-core/workflows/`.
- Global Codex contains the legacy VERSION 1.32.0 tree at
  `C:/Users/Destiny/.codex/get-shit-done`; its legacy resume prose still instructs
  deletion of HANDOFF.json after resume. Preserve committed history and editing
  surfaces under the new contract; do not carry that instruction into adoption.
- The `.agents` and `.codex` gsd-resume-work/gsd-pause-work directories have no
  readable SKILL.md at the inspected paths. Their existence does not prove
  working dispatch. This remains part of issue54 adapter delivery.
- The project-local Claude legacy tree reports VERSION 1.30.0.
- Both global pre-compact.js files exist and have the same recorded hash.
  Presence does not prove that the runtime invokes them.

No installed tree was edited and no installed reader/setter was executed in
this inspection. Version labels across these lineages are not comparable
provenance. Final acceptance must use newly staged installations and actual
entrypoint invocations, bound to the fork and protocol revisions.

## Impact on current work

- PR4 settings repair does not participate in project resume publication; this
  filing does not change its ACL/ownership or ordinary-account requirements.
- PR69 engine/installer safety work continues. It must not be represented as
  closing coherent recovery merely because single-file publication is atomic.
- PR70's planner input must eventually be bound to the selected committed
  project generation where applicable; do not invent a protocol or change its
  scope before receiving the final contract.
- Final skin recovery/state-integrity acceptance now requires the O01 consumer
  tests below. Current legacy behavior retains an explicitly weaker guarantee.

## Contract receipt required before implementation

Conversations must supply the versioned schema/CLI or library contract, source
revision, expected-parent token semantics, explicit adoption signal, result and
conflict statuses, membership rules, packaging/availability contract, and the
retained negative fixtures. GSD must not import a sibling checkout's mutable
implementation or hard-code a Conversations development path into its package.
Distribution of the shared implementation needs an explicit supported contract.

After receipt, map the API onto the existing candidate. Adopted writers read
and edit one candidate with expected parent; readers consume one committed
bundle and separately report newer projection edits as conflicts. Preserve all
applicable workstream, phase, spike, sketch, deliberation and root members.
Do not narrow discovery to a root HANDOFF/STATE/CONTINUE triad. Do not silently
initialize authority for existing projects or fallback from corrupt committed
state to apparently successful legacy reads.

## Required installed acceptance

1. Reader at each publication boundary returns complete old or new membership
   and bytes, or explicit conflict; never a mixed successful snapshot.
2. Two stale-parent writers cannot overwrite one another. Preserve locked
   rescans and recheck changed phase/plan/member inventories before publication.
3. Interruption before/after committed head and projection publication preserves
   candidate evidence and distinguishes not-committed, committed-with-conflict
   and indeterminate durability without blind retry.
4. Newer manual/Claude edits remain visible and intact until explicit
   reconciliation. Unknown frontmatter, curated values and no-op behavior pass.
5. Unadopted projects retain existing behavior, labelled legacy-uncommitted;
   malformed adopted data refuses rather than guessing by timestamps.
6. Run actual installed readers/setters and pause/resume/pre-compact adapters
   under Windows Node/Bun and supported Linux. Host-local locking is not evidence
   of cross-machine fencing. Return exact source, artifact, runtime and protocol
   identities plus retained failures in the closure receipt.

Next external action: Conversations supplies the final implementation/contract
receipt. Next GSD action on receipt: implement the adapter under this acceptance
map and the existing skin discipline. Full coherent recovery remains open.
