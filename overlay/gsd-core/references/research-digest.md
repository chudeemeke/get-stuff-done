# Per-plan research digest

The planner reads the phase research once and writes a digest for each plan.
The executor reads that plan's digest through `<read_first>`. Keep the planner
as a separate agent. A digest reduces repeated reads; it does not replace
locked decisions, requirements, independent checking or source verification.

## Select and generate

1. Read the phase research and locked decisions once. Associate each relevant
   constraint, package/API choice, verification command and failure mode with
   the plans that depend on it. Do not exclude a constraint to meet a budget.
2. Select exact, unique research headings for each plan. Parent sections include
   their children. Overlapping selections, missing/duplicate headings and
   oversized output fail rather than silently omitting content.
3. Run the helper beside the verified `GSD_TOOLS` entrypoint. Use the runtime's
   actual installed path; never resolve a different global copy as fallback.

```bash
node "${GSD_TOOLS%/*}/research-digest.cjs" \
  .planning/phases/23-recovery/23-RESEARCH.md \
  --section "Storage" --section "Verification" --json
```

In PowerShell, use `Join-Path (Split-Path $GSD_TOOLS) 'research-digest.cjs'`
to obtain the same sibling helper. The source must be inside the calling
project root. Run `--help` for the complete syntax.

4. Write the returned `markdown` value to
   `.planning/phases/23-recovery/23-01-RESEARCH-DIGEST.md` using the normal
   file-writing tool. Preserve its generated provenance header and citations.
   Include the digest in the plan's artifact inventory and commit it with the
   plan. Do not add the full RESEARCH.md to every task's read list.
5. Add the digest path to the tasks that need its research:

```xml
<read_first>
.planning/phases/23-recovery/23-01-RESEARCH-DIGEST.md
path/to/the/specific/implementation-file
</read_first>
```

The default output budget is200 lines including provenance. If relevant
research exceeds it, select narrower headings or explicitly increase
`--max-lines` with the reason recorded in the plan. Never drop required
research merely to satisfy the provisional efficiency target.

## Verify before use

The header records `source`, `source_sha256`, and `selected_sections` with
original one-based inclusive line ranges. CRLF is normalized in excerpts;
the hash covers the exact original bytes. No timestamps are added.

Before execution, rerun the same selection with
`--expect-sha256 <source_sha256> --json`. A changed source returns exit1 and
no data. Regenerate and re-review the digest and affected plan before using
it. Compare the regenerated `markdown` with the committed digest; a matching
source hash alone does not certify a manually edited excerpt.

The checker maps every task's research-dependent acceptance criterion back to
the selected sections and their original research. Inspect omitted headings
for constraints that should apply to the plan. Record omissions and their
dispositions; the helper cannot judge semantic completeness.

## Acceptance boundary

Helper tests prove deterministic extraction, source provenance and explicit
failure behavior. They do not prove that the planner uses digests, that the
checker catches an injected defect, or that token/time targets are achieved.
Those remain the final lean-profile integration and D11 comparison gates.
