---
phase: 43
plan: 11AE
status: evidence-only
captured: 2026-07-19
subject: Windows PowerShell ACL harness
---

# Plan 11AE Windows ACL Harness Diagnosis

## Scope

This is pre-execution evidence for pending Plan 11AE. It does not satisfy the
11AC dependency, change product or test code, or complete a plan task.

## Observations

Bounded `-NoProfile -NonInteractive` Windows PowerShell probes established:

- The child runtime is Windows PowerShell `5.1.26100.8521`.
- `Get-Command Get-Acl` fails before any product call because `Get-Acl` does
  not autoload in that child.
- Module discovery returns two `Microsoft.PowerShell.Security` candidates: a
  PowerShell 7.6 WindowsApps module and the Windows PowerShell inbox module.
- Import by module name selects the incompatible PowerShell 7 candidate and
  fails on duplicate `System.Security.AccessControl.ObjectSecurity` type data.
- Importing the manifest below succeeds and exposes `Get-Acl`:

  ```powershell
  $manifest = Join-Path $PSHOME `
    'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1'
  Import-Module $manifest -ErrorAction Stop
  ```
- A disposable-file follow-up used that manifest to call `Get-Acl`, protect the
  DACL, call `Set-Acl`, and read it back. The result reported `protected=True`
  and a non-empty 283-character access SDDL; the temporary root was removed.

No probe changed `PSModulePath`, credentials, GitHub state, repository files,
or live first-party services. The long-running exploratory child was terminated
after exceeding its bound; subsequent probes used a five-second child timeout.

## Diagnosis

The observed failure belongs to test bootstrap and module resolution, not to
roadmap publication behavior. `protectWindowsDacl()` runs before
`publishRoadmapPreservingBytes()`, so the failing broad test did not reach the
product operation it is meant to verify.

Name-based import is not deterministic when Windows PowerShell inherits module
paths containing PowerShell 7 modules. Pending Plan 11AE should import the
Windows PowerShell-owned `$PSHOME` manifest explicitly, or use an equivalent
.NET ACL API, without mutating global module search paths.

## Required Follow-Through

- Preserve the declared 11AC dependency before implementation.
- Add a RED harness negative for an unavailable host-owned manifest.
- Keep the protected-DACL product assertion unchanged after bootstrap repair.
- Re-run the focused 40-test file and the broad suite.
- Do not claim a product fix unless product behavior itself changes and is
  independently exercised.
