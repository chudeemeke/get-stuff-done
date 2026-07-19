# Plan 43-11AC D6 Extraction Disposition

**Date:** 2026-07-19
**Decision:** Abort the optional mechanical extraction under Fable D6's
explicit stop criterion.

## Boundary Examined

The bounded candidate was limited to:

- hosted CLI composition: `parseArgs` and `main`
- hosted infrastructure adapters: `createDefaultDependencies`,
  `runJsonCommand`, `runTextCommand`, `writeReceiptAtomic`, and
  `resolveReceiptPath`
- toolchain CLI composition: `runCli`

No evaluator, validator, or policy behavior was eligible to move.

## Evidence

The named functions are not a mechanically separable unit in the current
layout:

- `createDefaultDependencies` depends on hosted contract validation, bounded
  JSON parsing, receipt publication, and command adapters that remain core
  responsibilities in the current file.
- `main` composes three core handlers and the default adapter set; moving it
  alone requires a new factory or handler-registration interface.
- `resolveReceiptPath` shares containment and path-existence policy with the
  core receipt lifecycle.
- `runJsonCommand` and `runTextCommand` share bounded diagnostic policy with
  the collector.
- toolchain `runCli` depends on private CLI parsing, containment, bounded
  evidence parsing, filesystem limits, and `verifyToolchainAuthority`.

A split limited to the named functions therefore requires either circular
imports or new factories/wrappers. Both change the composition contract and
are semantic shims rather than a pure move. They would also make the original
entry-path re-exports and adapter-only-through-injection requirement harder to
prove, not easier.

## Disposition

No extraction modules were created. The corrected D1-D4 policy remains in the
two existing entry modules, with the bounded D5 coverage lane retaining only
those two production files.

Phase 44 owns the full policy/I/O separation. The trigger is mandatory: finish
that split before the first post-v1.2 feature changes either verifier. The
Phase 44 roadmap also owns the hosted coverage and no-publish release-plan
gates that will consume the resulting boundary.

This disposition does not claim the current files satisfy the final
hexagonal/SRP end state. It applies only Fable's explicit Plan 11AC abort
criterion and preserves the named future owner and trigger.
