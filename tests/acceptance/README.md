# State delivery acceptance

Run explicitly against a composed or installed candidate:

```powershell
$env:GSD_ACCEPTANCE_TOOLS = 'C:/absolute/candidate/gsd-core/bin/gsd-tools.cjs'
node --test --test-reporter=tap tests/acceptance/state-delivery.cjs
```

The exact tool path is mandatory. Temporary projects and homes isolate writers
and Git commits from the real project. These fixtures are acceptance work for
the final 1.12.0 delivery, not a replacement for the compatibility matrix.

September 5 RED baseline against the downloaded pure 1.12.0 package:
12 tests, 9 pass, 3 fail, 0 skipped, exit 1. Full TAP:
`.planning/evidence/skin-1.12.0-state-pure.tap`.

- Preserved: three reported state writers, milestone position and unknown nested
  metadata; missing, empty, partial, explicit true and explicit false docs-commit
  configuration agree with the staged commit guard. Successful commits verify bytes.
- Residual: bullet-only phases absent from roadmap.analyze and init.manager;
  planned-phase accepts three plans but leaves semantic `Plan: 1 of 2` unchanged.
- Adoption correction before the recorded baseline: released milestone.complete
  requires --confirm; fixture-only invocation now supplies that flag.

Owner: get-stuff-done. Trigger: final bump narrow override/seam review, then the
same fixtures against composed and Windows Claude/Codex + Linux installed bytes.
These are source-package observations, not installed-runtime acceptance or a D3
closure. The Conversations workaround remains until delivery evidence passes.
