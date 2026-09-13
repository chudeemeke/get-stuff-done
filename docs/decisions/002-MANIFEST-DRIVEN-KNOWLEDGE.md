# Decision Record 002: Manifest-Driven Knowledge (SSOT Pattern)

**Date:** 2026-04-30
**Status:** Accepted
**Context:** Phase 40.5 Wave 1.5a — preventing recurrence of the v3.0.0 stale-paths bug class

---

## Decision

Cross-cutting metadata (e.g., the list of hook scripts, their source locations, their kinds) lives in a **single SSOT manifest module**. All consumers — build scripts, parity checks, tests, future tooling — import from the manifest rather than duplicating the metadata as hardcoded strings.

For the hook system, the manifest is **`hooks/index.js`**.

This decision establishes a **pattern** that will be applied to other cross-cutting metadata as those touch points are next edited (e.g., upstream-required directories, key-file lists, branding rules — currently still hardcoded in their respective consumers).

---

## Context — what problem this solves

### The bug we just fixed

During the v3.0.0 architecture transition (commit `4654081e95f9`, ~2026-03-31), two hook source files moved from `overlay/hooks/` to `overrides/hooks/` as part of introducing the override-vs-overlay distinction. The move updated the file locations but did NOT update the duplicated references to those locations in:

- `scripts/build.js` — hardcoded `HOOKS_DIR = overlay/hooks` + `HOOKS_TO_BUNDLE` array
- `scripts/check-parity.js` — hardcoded `hookFiles` array
- `tests/hooks.test.js` — hardcoded `HOOKS` constant + 7 `describe()` block names
- (downstream test assertions that referenced the old paths in build/parity scripts)

CI on `main` went red on 2026-03-31 and stayed red continuously for ~50 days. The same architectural transition introduced multiple downstream regressions (Phase 29 PROTO-01/02, INST-04 uninstall, removeGsdFiles traversal) that were never resolved. The hook-paths bug was caught only when a routine upstream bump (PR #3) surfaced 586 CI failures, including 42 from the stale hook paths.

Root cause: **duplicated knowledge.** The truth ("gsd-check-update lives in `overrides/hooks/`") was encoded in 4+ places. Updating one updated some; updating all required more discipline than is sustainable.

### Why "fix the paths and move on" is insufficient

Fixing the wrong paths in each file (commit `39f1af2`) addresses the symptom but **leaves the duplication intact**. The next architectural shift (move, rename, addition) can recur the same bug class. Industry practice for this is the **SSOT pattern**: factor the knowledge into one location, have everyone read from it.

### Forces

- **DRY principle violation** — the same fact in N places.
- **Single Source of Truth** — without it, drift is inevitable on long-lived projects.
- **Open/Closed Principle (SOLID)** — adding a hook should NOT require editing N files.
- **Onboarding cost** — new contributors discover the duplication only after their changes break something elsewhere.

---

## Decision (expanded)

### The pattern

```
hooks/index.js  (SSOT manifest, the abstraction)
  ↓
scripts/build.js
scripts/check-parity.js
tests/hooks.test.js
(future consumers)
```

### Manifest module shape

A manifest module exports:

1. **A frozen array of frozen entries** — the canonical list of items
2. **Resolution functions** — typed accessors for derived values (e.g., `sourcePath(entry)`, `distPath(entry)`)
3. **Lookup helpers** — `findByName(name)`, `filterByKind(kind)` etc.
4. **Defensive contracts** — accessor functions throw on bad input

For hooks specifically:

```js
// hooks/index.js
const HOOKS = Object.freeze([
  Object.freeze({ name: 'gsd-check-update.js', source: 'overrides/hooks', kind: 'override' }),
  Object.freeze({ name: 'gsd-statusline.js',   source: 'overrides/hooks', kind: 'override' }),
  Object.freeze({ name: 'pre-compact.js',      source: 'overlay/hooks',   kind: 'overlay' }),
]);

function sourcePath(hook) { /* derives absolute path */ }
function distPath(hook)   { /* derives absolute path */ }
function findByName(name) { /* lookup */ }
function filterByKind(k)  { /* filter */ }

module.exports = { PROJECT_ROOT, HOOKS, sourcePath, distPath, findByName, filterByKind, allHooks };
```

### Defense-in-depth via meta-tests

Manifest modules are paired with **invariant tests** that assert the manifest's internal consistency:

- Required fields present on every entry
- Field values constrained to allowed sets (e.g., `kind ∈ {override, overlay}`)
- No name collisions
- Every source path resolves to an existing file
- Frozen object/array invariants
- Defensive-contract behavior (functions throw on bad input)

For hooks: **`tests/hooks-manifest.test.js`** (13 invariant tests).

Additionally, a **path-validation meta-test** at `tests/test-path-validation.test.js` scans test files for hardcoded paths under fork-owned directories and asserts they resolve. This catches FUTURE drift even in test files that don't yet consume a manifest.

### SSOT-enforcement assertions in consumer tests

Where it makes sense, consumer tests assert that the consumer ACTUALLY uses the manifest (not just that it produces correct output). Example from `tests/hooks.test.js`:

```js
test('build.js does NOT hardcode hook source directories', () => {
  const src = fs.readFileSync('scripts/build.js', 'utf8');
  expect(src).not.toMatch(/['"]gsd-check-update\.js['"]/);
  expect(src).not.toMatch(/['"]gsd-statusline\.js['"]/);
  expect(src).not.toMatch(/['"]pre-compact\.js['"]/);
});
```

These assertions catch regressions where someone reintroduces hardcoded paths during a future edit.

---

## Alignment with WoW (Ways of Working)

### SOLID

| Principle | How the SSOT pattern satisfies it |
|---|---|
| **Single Responsibility** | Manifest module's only job is metadata. Consumers' job is consuming it. Clean separation. |
| **Open/Closed** | Adding a new hook = append to manifest. Consumers extend their behavior automatically without modification. |
| **Liskov Substitution** | Every entry in the manifest is treated uniformly by consumers (any hook substitutable for any other in the iteration). |
| **Interface Segregation** | Manifest exposes minimal surface (HOOKS list + small set of helpers). No bloated config object. |
| **Dependency Inversion** | High-level scripts (build, parity, tests) depend on the manifest abstraction, not on concrete strings. |

### Hexagonal architecture

- **Domain layer** — `hooks/index.js` is the truth (port-like)
- **Infrastructure layer** — scripts/, tests/ consume the truth (adapter-like)
- **No leakage** — scripts don't depend on tests, tests don't depend on scripts; both depend on the manifest

### Design patterns

- **Registry** — the manifest IS a registry of hooks. Adding/removing entries registers/unregisters them with all consumers.
- **Frozen object** — manifest entries are immutable (`Object.freeze`). Accidental mutation is a programming error caught early.
- **Function exposure for derived values** — paths are computed by helpers, not stored as static strings. Cross-platform behavior, lazy evaluation.

---

## Consequences

### Positive

- **Drift impossible** — moving a hook = ONE file edit. Consumers update automatically.
- **Test coverage** — manifest invariants tested explicitly. Drift caught at test time.
- **Onboarding** — new contributors see the SSOT and learn the pattern from one obvious location.
- **Pattern propagates** — when the next cross-cutting metadata concern emerges (e.g., `REQUIRED_UPSTREAM_DIRS`), the SSOT shape is established and easy to apply.
- **CI stops being a "pile of failures"** — categorical fixes via SSOT eliminate failure clusters all at once.

### Trade-offs accepted

- **One extra file per metadata domain.** A simple list as inline strings is shorter than a manifest module + invariant tests. We accept this overhead because the cost of drift (50 days of red CI in this case) far exceeds the upfront cost.
- **Indirection for readers.** Consumers no longer "see" hook names inline. Readers must follow the import. We accept this because the alternative (visible-but-duplicated) is worse.
- **Discipline required when adding consumers.** A future consumer that bypasses the manifest reintroduces the original problem. Mitigation: SSOT-enforcement assertions in consumer tests + this ADR documenting the convention.

### When NOT to apply this pattern

- **Truly local data** that's only used in one place. Don't create a manifest for a single-consumer constant.
- **Dynamic data** allocated at runtime (temp dirs, computed paths). The pattern is for STATIC metadata, not runtime values.
- **Trivially duplicated data** under 3 occurrences where the duplication is unlikely to drift. Use judgment — don't over-engineer.

The threshold: **3+ consumers OR cross-cutting concern with non-trivial structure → apply SSOT.**

---

## Implementation references

- `hooks/index.js` — the hook manifest (commit `63896dc`)
- `tests/hooks-manifest.test.js` — manifest invariants (commit `9c77ef5`)
- `scripts/build.js` — refactored consumer (commit `cbd549c`)
- `scripts/check-parity.js` — refactored consumer (commit `cb5e914`)
- `tests/hooks.test.js` — refactored consumer + SSOT-enforcement assertions (commit `63e1d44`)
- `tests/test-config-hygiene.test.js` — test-discovery scope hygiene
- `tests/test-path-validation.test.js` — broader path validation across test files

## Future work (NOT in scope here)

The SSOT pattern can be applied to other cross-cutting metadata as those touch points are next edited:

- `REQUIRED_UPSTREAM_DIRS` in `scripts/compose.js`
- `keyFiles` in `scripts/check-parity.js`
- `OVERLAY_METADATA` in `scripts/compose.js`
- Branding rules (currently in `overlay/branding.json` — already JSON SSOT, but consumers may have duplications)
- Phase artifact paths (workflows + agents currently hardcode `.planning/phases/X/Y-PLAN.md` patterns)

Each application of the pattern produces its own ADR (003, 004, ...). Don't refactor everything at once — apply opportunistically when touching a duplication.

---

## Status

**Accepted** 2026-04-30 during Phase 40.5 Wave 1.5a, after user authorization to apply broad systems-thinking refactor before continuing CI hardening / branch protection / pre-push hook layers.

User framing: *"applying the broader industry practice on test paths specifically for tests. Be accurate but be thorough and systems thinking that way, you action once and all future actions benefit and allows for patterns and abstractions that are industry and git/github best practice."*
