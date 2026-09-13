# Backlog 999.6 Context

## Observation

After Plan 11L corrected plan classification, the composed command returned the
right semantic result:

```json
{
  "updated": true,
  "phase": "43",
  "plan_count": 24,
  "summary_count": 14,
  "status": "In Progress",
  "complete": false
}
```

The same write changed the progress row from the repository's valid form:

```text
| 43 | v1.2.0 | 13/24 | In Progress | - |
```

to:

```text
| 43 | v1.2.0 | 14/24 | In Progress|  |
```

The count/status semantics are correct. The spacing and incomplete-date
placeholder are not preserved.

## Source Boundary

The current behavior is in
`overrides/gsd-core/bin/lib/roadmap.cjs` inside
`cmdRoadmapUpdatePlanProgress`:

- the status cell uses `status.padEnd(11)` without an explicit trailing cell
  space for the 11-character `In Progress` value; and
- incomplete phases force the date cell to two spaces rather than preserving a
  valid non-date placeholder such as `-`.

This is separate from plan classification and does not belong in Plan 11L's
shared `plan-scan.cjs` correction.

## Acceptance Boundary

The eventual fix must preserve valid source formatting while retaining current
semantic self-healing for invalid completed dates. Tests must cover five-column
and four-column rows, incomplete and complete transitions, LF and CRLF bytes,
publication failure, and no-op behavior.

## Current Disposition

Backlog. The live ROADMAP row was corrected manually after the dogfood command.
Promote with the next roadmap-writer change or before v1.2.0 closeout so the
release does not retain a known formatting regression in a first-party writer.
