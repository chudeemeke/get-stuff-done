---
phase: 43
plan: "11AE"
wave: 19
status: complete
date: 2026-07-19
requirements: ["UPGRADE-04", "SHIP-08"]
---

# Phase 43 Plan 11AE Summary - Cross-Platform Path Authority

## Outcome

Corrected the three cross-platform failure owners without weakening the
production receipt-containment boundary. Windows PowerShell executable
construction now uses `path.win32` target semantics independently of the host
path implementation. Receipt tests compare native canonical identities, while
the production `fs.realpathSync.native` resolver remains unchanged. The Windows
ACL fixture now imports the exact compatible Windows PowerShell inbox security
manifest before exercising product behavior.

The formerly failing aggregate suite is green. The correction does not raise a
production timeout, globally normalize paths, or classify host setup as product
behavior.

## Product And Harness Boundaries

- `buildWindowsPowerShellExecutable()` constructs the target executable with
  `path.win32.join` and is used by the native Windows replacement adapter.
- Real roadmap target, replacement, backup, and recovery paths remain child
  environment values; recovery and redaction semantics are unchanged.
- The protected-DACL fixture imports
  `$PSHOME/Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1`
  with `-ErrorAction Stop`, avoiding the incompatible PowerShell 7 WindowsApps
  module that name-based resolution selected first.
- A negative fixture proves a missing security manifest stops before the probe
  body runs.
- Linked-root, macOS alias, and Windows short-path oracles use native realpath
  identity. Escape, reparse, existing-path, and out-of-root negatives remain.
- The mode-preservation test explicitly selects its POSIX rename responsibility
  instead of incidentally invoking the Windows PowerShell adapter under c8.

## Coverage

The durable `test:coverage:phase43-roadmap-persistence` script runs the portable
roadmap behavior suite under Node/c8 and enforces every metric independently on
the changed product file.

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `fork-roadmap-persistence.cjs` | 98.77% | 95.56% | 100.00% | 98.77% |
| `verify-hosted-ci.js` | 98.42% | 96.55% | 98.38% | 98.42% |
| `verify-toolchain-authority.js` | 97.10% | 95.32% | 100.00% | 97.10% |

## Validation Evidence

- Focused Bun gate: 110/110 passed with 497 expectations.
- Roadmap Node/c8 gate: 44/44 passed; the product file exceeds every per-file
  95% threshold.
- Hosted/toolchain Node/c8 gate: 120/120 passed; both verifier files remain
  above every per-file 95% threshold.
- Broad suite: 1,505/1,505 passed with 4,073 expectations. The prior protected
  Windows DACL failure is resolved.
- `bun run dist`: compose, build, SBOM, and finalize all passed; 740 files were
  composed and install metadata reports upstream 1.6.1 / overlay 3.0.2.
- Focused ESLint: zero errors and zero warnings.
- Repository ESLint: zero errors and 220 pre-existing warnings; none are in the
  changed product or test files.
- `git diff --check`: passed.

## Registry Cause Evidence

The prior Verdaccio `ENEEDAUTH` behavior now has a concrete historical cause.
The user had run `npm set registry http://localhost:4873/` from WSL. That WSL
session resolves npm to `/mnt/c/Program Files/nodejs/npm`, so the command changed
the Windows user-level `C:\Users\Destiny\.npmrc` used by both Windows npm and
WSL-invoked npm. It redirected package and publish traffic; it did not start
Verdaccio.

Current verification reports `https://registry.npmjs.org/` for both effective
Windows and WSL npm configuration. The Windows user config contains that public
registry and the project has no `.npmrc`. Verdaccio is therefore historical
cause evidence, not an active registry blocker.

## GSD Closeout

- Both plan tasks and all three must-have truths have direct local evidence.
- Plan structure reports two complete tasks with zero errors or warnings, and
  the summary verifier passes with both task commits present.
- Plan 11AE is the twentieth of fifty Phase 43 plans with a summary.
- Portfolio progress is 42/72 plans (58%).
- Documentation lint passes across 379 primary and 62 secondary Markdown files
  with zero errors.
- Consistency passes with four pre-existing warnings for the future Phase 44
  directory, two directory-less backlog phases, and legacy Phase 40.5
  frontmatter.
- Legacy artifact/key-link helpers do not decode nested `must_haves`, and the
  reference helper treats the automated verification command as a file path.
  Direct plan-structure, summary, command, and roadmap checks remain the
  closeout authority.
- Plan 11AF is the next autonomous unit and owns authenticated Verdaccio upgrade
  verification plus redaction.
- Plan 11R remains blocked because no passed exact-subject hosted envelope or
  formal post-hosted Fable checkpoint exists.

## Boundaries

This plan does not claim hosted CI evidence, release readiness, Phase 43
completion, authenticated Verdaccio upgrade verification, paired same-run
performance authority, workflow-governance correction, an Open GSD 1.7.0 bump,
or a formal post-hosted Fable decision.

No npm authentication, registry credential, machine-global Bun installation,
workflow, public issue/comment, push, PR, hosted run, branch protection, merge,
release, credential, or live `authkey`, `remotely`, or `conversations` state
changed.

Generated `coverage/` and root `dist/` remain untracked or ignored and fully
regeneratable. Earlier verified recursive cleanup attempts were blocked before
execution by the command safety layer, so they remain locally and are not
claimed clean. Reparse-point hook/bin distribution paths remain untouched.

## Task Commits

1. **RED cross-platform contracts:** `9a3a7b5b` (`test`)
2. **GREEN target-Windows semantics:** `29d5069e` (`fix`)

## Next

Execute Plan 11AF. Its first responsibility is a credential-safe authenticated
Verdaccio upgrade verifier using ephemeral owned state and explicit redaction.
No hosted or public action is authorized by this closeout.

## Self-Check: PASSED

- Product, oracle, and harness ownership remain separate and testable.
- Production receipt containment is unchanged.
- The real protected-DACL regression and broad suite are green.
- All changed-product four-metric coverage gates exceed 95% independently.
- Registry cause and current configuration are recorded without claiming a live
  Verdaccio blocker.
- The next durable resume target is Plan 11AF.
