# Testing Patterns

**Analysis Date:** 2026-01-28

## Test Framework

**Status: No Automated Tests**

This codebase has no automated test suite. The `package.json` has no test script defined, and no test files exist.

**Run Commands:**
```bash
# None available - no test framework configured
npm test  # Would fail - no test script
```

## Why No Tests

This is a **meta-prompting system**, not a traditional application:

1. **Content is prompts, not code.** The primary artifacts are Markdown files containing instructions for Claude. These are validated through execution, not unit tests.

2. **Minimal executable code.** The only code is:
   - `bin/install.js` - Installer script
   - `hooks/gsd-statusline.js` - Status line display
   - `hooks/gsd-check-update.js` - Update checker
   - `scripts/build-hooks.js` - Build script

3. **Validation through usage.** The prompts are tested by running GSD commands and observing Claude's behavior.

## Verification Approach

GSD uses a different validation model documented in `get-stuff-done/references/verification-patterns.md`:

### Stub Detection (Programmatic)

**Universal patterns to detect placeholder code:**
```bash
# Comment-based stubs
grep -E "(TODO|FIXME|XXX|HACK|PLACEHOLDER)" "$file"

# Empty implementations
grep -E "return null|return undefined|return \{\}|return \[\]" "$file"

# Placeholder text
grep -E "placeholder|lorem ipsum|coming soon" "$file" -i
```

### Wiring Verification

Check that components communicate correctly:
```bash
# Component calls API
grep -E "fetch\(['\"].*$api_path" "$component_path"

# API queries database
grep -E "await.*prisma|await.*db\." "$route_path"

# Form submission has handler
grep -A 10 "onSubmit.*=" "$component_path" | grep -E "fetch|axios|mutate"
```

### Human Verification Triggers

Some things require human testing:
- Visual appearance
- User flow completion
- Real-time behavior (WebSocket, SSE)
- External service integration
- Error message clarity

## TDD Workflow (For Projects Using GSD)

GSD includes TDD support for projects it manages. See `get-stuff-done/references/tdd.md`.

**When to use TDD:**
- Business logic with defined inputs/outputs
- API endpoints with request/response contracts
- Data transformations, parsing, formatting
- Validation rules

**TDD Plan Structure:**
```markdown
---
phase: XX-name
plan: NN
type: tdd
---

<feature>
  <name>Feature name</name>
  <files>source file, test file</files>
  <behavior>Expected behavior in testable terms</behavior>
  <implementation>How to implement</implementation>
</feature>
```

**TDD Commits:**
```
test({phase}-{plan}): add failing test for [feature]    # RED
feat({phase}-{plan}): implement [feature]               # GREEN
refactor({phase}-{plan}): clean up [feature]            # REFACTOR (optional)
```

## Framework Setup Guidance

For projects using GSD that need test setup:

| Project | Framework | Install |
|---------|-----------|---------|
| Node.js | Jest | `npm install -D jest @types/jest ts-jest` |
| Node.js (Vite) | Vitest | `npm install -D vitest` |
| Python | pytest | `pip install pytest` |
| Go | testing | Built-in |
| Rust | cargo test | Built-in |

## Test File Organization

GSD recommends for managed projects:

**Location:**
- Co-located: `*.test.ts` / `*.spec.ts` next to source
- Or: `__tests__/` directory
- Or: `tests/` directory at root

**Naming:**
- `*.test.ts` or `*.spec.ts` for test files
- Match source file name: `auth.ts` -> `auth.test.ts`

## Verification Checklists

### Component Checklist
- [ ] File exists at expected path
- [ ] Exports a function/const component
- [ ] Returns JSX (not null/empty)
- [ ] No placeholder text in render
- [ ] Uses props or state (not static)
- [ ] Event handlers have real implementations
- [ ] Imports resolve correctly
- [ ] Used somewhere in the app

### API Route Checklist
- [ ] File exists at expected path
- [ ] Exports HTTP method handlers
- [ ] Handlers have more than 5 lines
- [ ] Queries database or service
- [ ] Returns meaningful response (not empty/placeholder)
- [ ] Has error handling
- [ ] Validates input
- [ ] Called from frontend

### Wiring Checklist
- [ ] Component -> API: fetch/axios call exists and uses response
- [ ] API -> Database: query exists and result returned
- [ ] Form -> Handler: onSubmit calls API/mutation
- [ ] State -> Render: state variables appear in JSX

## Testing the GSD System Itself

**Manual testing approach:**

1. **Install verification:**
   ```bash
   npx get-stuff-done --global
   # Verify commands installed to ~/.claude/commands/gsd/
   # Verify agents installed to ~/.claude/agents/
   ```

2. **Command execution:**
   ```bash
   # In Claude Code
   /gsd:help  # Should display command reference
   /gsd:new-project  # Should initiate questioning flow
   ```

3. **Cross-platform testing:**
   - Windows paths with backslashes
   - WSL paths
   - macOS/Linux paths

## Coverage Requirements

**For GSD itself:** None enforced.

**For projects using GSD:** Configurable per project. GSD supports TDD workflow but does not mandate coverage thresholds.

## Test Types (For Managed Projects)

**Unit Tests:**
- Business logic functions
- Utility functions
- Data transformations

**Integration Tests:**
- API route handlers
- Database queries
- Service interactions

**E2E Tests:**
- User flows
- Critical paths
- Usually with Playwright/Cypress

## Common Patterns

**Async Testing:**
```typescript
it('should fetch user data', async () => {
  const user = await getUser('123');
  expect(user.name).toBe('Test User');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => validate(null)).toThrow('Input required');
});
```

**Mocking:**
```typescript
// Mock external services, not internal modules
jest.mock('../lib/stripe');
```

## Quality Curve Awareness

GSD documentation notes context window quality degradation:

| Context Usage | Quality | Implication for Tests |
|---------------|---------|----------------------|
| 0-30% | PEAK | Full test coverage feasible |
| 30-50% | GOOD | Standard test coverage |
| 50-70% | DEGRADING | Prioritize critical tests |
| 70%+ | POOR | Tests may be skipped/superficial |

Plans target ~50% context usage. TDD plans target ~40% (extra room for RED-GREEN-REFACTOR cycles).

---

*Testing analysis: 2026-01-28*
