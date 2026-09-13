# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **chude@emeke.org** (or file a private security advisory at https://github.com/chudeemeke/get-stuff-done/security/advisories/new)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity, but we aim for:
  - Critical: 24-48 hours
  - High: 1 week
  - Medium/Low: Next release

## Ship-Ready Hardening Triage Policy

All dependency, secret, static-analysis, and CI runner findings are triaged through
the same suppression workflow. Scanner-level filtering must not hide findings
before they can be reviewed.

- **critical** findings are fixed in the current ship-ready hardening milestone
  before release. They are not suppressed unless the finding is proven
  non-exploitable in this project and the suppression is explicitly reviewed.
- **high** findings block CI unless an unexpired suppression covers the exact id.
  A high-severity suppression must include a concrete exploitability rationale.
- **moderate** findings are planned for the next hardening milestone unless
  project-specific exploitability requires immediate handling.
- **low** findings are backlogged with a review date and remain visible through
  audit output or durable audit logs.

Every suppression entry in `.planning/audits/suppressions.json` must include:

- `id`
- `severity`
- `reason`
- `reviewer`
- `reviewedDate`
- `reReviewDate`

The `reReviewDate` must be no more than 60 calendar days after `reviewedDate`.
Expired suppressions fail before `audit-ci` is allowed to hide a finding.

## Scope

Security issues in the GSD codebase that could:
- Execute arbitrary code on user machines
- Expose sensitive data (API keys, credentials)
- Compromise the integrity of generated plans/code

## Recognition

We appreciate responsible disclosure and will credit reporters in release notes (unless you prefer to remain anonymous).
