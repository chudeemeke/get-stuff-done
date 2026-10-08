# Expected-red evidence fixtures

These are captured outputs, not product acceptance.

- `installer-recovery-known-red.json`: historical 24-check report, before structured
  observations and the independent upgrade owner-preservation check.
- `installer-recovery-structured-red.json`: fresh disposable capture on win32,
  Node24.20.0, 2026-09-20; 27 checks, 14 pass / 13 fail, fixture cleanup confirmed.
  Source digests are embedded. Capture receipt:
  `.planning/evidence/p05-private-home-recovery-final-2026-09-20.*`.
  Before/after source hashes match; fixture bytes match the retained capture.
  Both full home-state observations preserve owner data and record the exact
  section20 Windows runtime writes. Prior25-check receipts remain historical.
- `install-transaction-known-red.tap.txt`: historical skeleton output. It must be
  rejected now that the lock cases are required to pass.
- `install-transaction-render-red.tap.txt` and
  `install-transaction-render-coverage.json`: exact copies of the reviewed
  `.planning/evidence/p03-validator-baseline-2026-09-19/` output and coverage report.
  That directory's receipt records source identities and the reviewed 51 cases.

Tests mutate copies to prove rejection. Production obtains new private reports
and checks current source identities; it never loads these fixtures as evidence.
