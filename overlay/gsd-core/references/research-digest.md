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
3. Pass the existing reader's original byte snapshot to the helper beside the
   verified `GSD_TOOLS` entrypoint. Use the runtime's actual installed path.
   The CLI requires `--stdin`; its positional path is a caller-supplied label.
   It never opens that path. The reader owns source selection and identity.

```javascript
// researchBytes is the Buffer already obtained by the source reader.
// researchLabel is that reader's project-relative research path.
const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath, [
  digestHelper, researchLabel, '--stdin',
  '--section', 'Storage', '--section', 'Verification', '--json',
], { input: researchBytes, encoding: 'utf8' });
if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
const digest = JSON.parse(result.stdout);
```

In PowerShell, use `Join-Path (Split-Path $GSD_TOOLS) 'research-digest.cjs'`
to obtain the same sibling helper. Supply the reader's byte snapshot through
the process's standard-input byte stream. Do not reconstruct it with `echo`,
formatted text pipelines or an opaque wrapper that reopens the label. A caller
already running in Node may instead call the exported `createDigest(Buffer,
options)` directly. Run `--help` for the complete CLI syntax.

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

The header records `source_kind: supplied_bytes`, the caller-supplied `source`
label, `source_sha256`, and `selected_sections` with one-based inclusive line
ranges in the supplied input. CRLF is normalized in excerpts; the hash covers
the exact supplied bytes. It does not authenticate the label, filesystem
identity or current on-disk contents. No timestamps are added.

Before execution, the source reader obtains and verifies the current research
snapshot. Feed those bytes through the same selection with
`--expect-sha256 <source_sha256> --json`. Different supplied bytes return exit1
and no data. Regenerate and re-review the digest and affected plan before using
it. Compare regenerated `markdown` with the committed digest; a matching input
hash alone does not certify an edited excerpt or the reader's provenance.

The checker maps every task's research-dependent acceptance criterion back to
the selected sections and their original research. Inspect omitted headings
for constraints that should apply to the plan. Record omissions and their
dispositions; the helper cannot judge semantic completeness.

## Acceptance boundary

Helper tests prove deterministic extraction, supplied-byte provenance, no
source-path reads and explicit failure behavior. They do not prove that the
reader selected the intended on-disk file, that the planner uses digests, that the
checker catches an injected defect, or that token/time targets are achieved.
Those remain the final lean-profile integration and D11 comparison gates.
