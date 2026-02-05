---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified: [bin/install.js]
autonomous: true

must_haves:
  truths:
    - "Switching from --link to copy mode removes hooks symlink before copying"
    - "Hooks installation mirrors agents installation pattern"
  artifacts:
    - path: "bin/install.js"
      provides: "Hooks symlink-to-copy transition fix"
      contains: "fs.lstatSync(hooksDest)"
  key_links:
    - from: "bin/install.js (hooks section)"
      to: "bin/install.js (agents section)"
      via: "Same symlink detection pattern"
      pattern: "lstatSync.*isSymbolicLink.*unlinkSync"
---

<objective>
Fix hooks symlink-to-copy transition bug in bin/install.js

Purpose: When users switch from `--link` mode to copy mode, the hooks directory must be handled the same way as agents - check for existing symlink and remove it before copying files.

Output: Patched bin/install.js with symlink detection for hooks matching the agents pattern
</objective>

<context>
@bin/install.js (lines 1168-1176 for reference pattern, lines 1250-1276 for fix location)

**Bug:** The agents directory correctly checks for symlinks before copying (lines 1170-1175), but the hooks directory does not (lines 1260-1276). This causes hooks to remain as symlinks when switching to copy mode.

**Reference pattern from agents (lines 1170-1175):**
```javascript
if (fs.existsSync(agentsDest)) {
  const stat = fs.lstatSync(agentsDest);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(agentsDest);
  }
}
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add symlink detection to hooks installation</name>
  <files>bin/install.js</files>
  <action>
Insert symlink detection code between lines 1260 and 1261 (before `fs.mkdirSync(hooksDest, ...)`).

Add this block:
```javascript
    } else {
      // If hooksDest is a symlink (from previous link-mode install), remove it first
      // Otherwise mkdirSync may fail or behave unexpectedly with symlinks
      if (fs.existsSync(hooksDest)) {
        const stat = fs.lstatSync(hooksDest);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(hooksDest);
        }
      }
      fs.mkdirSync(hooksDest, { recursive: true });
```

The key points:
1. Check BEFORE mkdirSync, not after
2. Use lstatSync (not statSync) - stat follows symlinks, lstat does not
3. Only remove if it IS a symlink (preserve real directories)
4. Comment explains WHY this check exists
  </action>
  <verify>
1. Read lines 1258-1285 of bin/install.js
2. Confirm the symlink check appears before mkdirSync
3. Confirm the pattern matches agents section (lstatSync + isSymbolicLink + unlinkSync)
  </verify>
  <done>
- hooks section has symlink detection matching agents pattern
- Comment explains the purpose
- Code is in correct position (before mkdirSync)
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify consistency with agents pattern</name>
  <files>bin/install.js</files>
  <action>
Compare the agents symlink check (lines 1170-1175) with the new hooks symlink check.

Verify:
1. Same conditional structure: existsSync -> lstatSync -> isSymbolicLink -> unlinkSync
2. Both use lstatSync (not statSync)
3. Both are positioned before mkdirSync
4. Comments explain the rationale
  </action>
  <verify>
Run: `grep -n "lstatSync" bin/install.js | head -5`
Should show TWO occurrences: one for agentsDest, one for hooksDest
  </verify>
  <done>
- Pattern is consistent between agents and hooks sections
- Both use lstatSync for symlink detection
  </done>
</task>

</tasks>

<verification>
```bash
# Verify fix is in place
grep -A 3 "If hooksDest is a symlink" bin/install.js

# Verify both sections use lstatSync
grep -n "lstatSync" bin/install.js

# Ensure no syntax errors
node --check bin/install.js
```
</verification>

<success_criteria>
- bin/install.js passes syntax check (node --check)
- hooks section has symlink detection before mkdirSync
- Pattern matches agents section (lstatSync, isSymbolicLink, unlinkSync)
- Switching from --link to copy mode will now properly remove hooks symlinks
</success_criteria>

<output>
After completion, create `.planning/quick/002-fix-hooks-symlink-to-copy-transition-bug/002-SUMMARY.md`
</output>
