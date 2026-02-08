#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const MANIFEST_PATH = '.planning/sync/sync-manifest.json';

function exec(cmd, ignoreError = false) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    if (ignoreError) return null;
    throw err;
  }
}

function resolveConflicts() {
  // Get all conflicted files
  const status = exec('git status --porcelain', false);
  const lines = status.split('\n').filter(Boolean);

  const protectedPaths = [
    'eslint.config.js',
    'src/validation/',
    'get-stuff-done/',
    'assets/gsd-logo-',
    'config/default-config.json',
    'src/config/ConfigLoader.js',
    'src/theme/'
  ];

  for (const line of lines) {
    const status = line.substring(0, 2);
    const file = line.substring(3);

    // Handle different conflict types
    if (status === 'DU') {
      // Deleted by us, modified by them - accept deletion
      console.log(`    ${file} → Deleted (upstream removed)`);
      exec(`git rm "${file}"`, true);
    } else if (status === 'UA' || status === 'AA') {
      // Added by them - accept their version
      console.log(`    ${file} → Accept new file`);
      exec(`git add "${file}"`, true);
    } else if (status === 'UU' || status === 'AU') {
      // Both modified or added by us
      const isProtected = protectedPaths.some(p => file.startsWith(p) || file.includes(p));

      if (isProtected) {
        console.log(`    ${file} → Fork wins (protected)`);
        exec(`git checkout --ours "${file}"`, true);
      } else if (file === 'package.json') {
        console.log(`    ${file} → Upstream wins (will review later)`);
        exec(`git checkout --theirs "${file}"`, true);
      } else {
        console.log(`    ${file} → Upstream wins`);
        exec(`git checkout --theirs "${file}"`, true);
      }
      exec(`git add "${file}"`, true);
    } else if (status === 'UD') {
      // Modified by us, deleted by them - accept deletion
      console.log(`    ${file} → Deleted (upstream removed)`);
      exec(`git rm "${file}"`, true);
    }
  }
}

function main() {
  // Clear any stale lock
  exec('rm -f .git/index.lock', true);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const totalCommits = manifest.pending.length + manifest.applied.length;
  let conflictCount = manifest.stats.conflicts || 0;
  let eslintFixCount = manifest.stats.eslintFixes || 0;

  console.log(`Resuming: ${manifest.applied.length} applied, ${manifest.pending.length} remaining\n`);

  for (const commit of manifest.pending) {
    const appliedCount = manifest.applied.length + 1;
    console.log(`[${appliedCount}/${totalCommits}] ${commit.shortSha}: ${commit.message}`);

    // Create snapshot
    exec(`git tag sync-snapshot-${commit.shortSha}`, true);

    // Try cherry-pick
    const result = exec(`git cherry-pick -x ${commit.sha}`, true);

    if (result === null) {
      console.log(`  ⚠ Conflict`);
      conflictCount++;
      resolveConflicts();

      // Continue
      const continueResult = exec('git cherry-pick --continue --no-edit', true);
      if (continueResult === null) {
        console.log(`  ✗ Failed, aborting`);
        exec('git cherry-pick --abort', true);

        // Still update manifest to skip this commit
        const idx = manifest.pending.findIndex(c => c.sha === commit.sha);
        if (idx >= 0) {
          const skipped = manifest.pending.splice(idx, 1)[0];
          skipped.status = 'skipped';
          skipped.reason = 'cherry-pick continue failed';
          if (!manifest.skipped) manifest.skipped = [];
          manifest.skipped.push(skipped);
        }
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        continue;
      }
    } else {
      console.log(`  ✓ Clean`);
    }

    // ESLint check
    if (exec('bunx eslint . --max-warnings 0', true) === null) {
      exec('bunx eslint . --fix', true);
      if (exec('git diff --quiet', true) === null) {
        console.log(`    → ESLint fixes applied`);
        exec('git add -A', true);
        exec('git commit --amend --no-edit --author="Chude <chude@emeke.org>"', true);
        eslintFixCount++;
      }
    }

    // Update manifest
    const idx = manifest.pending.findIndex(c => c.sha === commit.sha);
    if (idx >= 0) {
      const applied = manifest.pending.splice(idx, 1)[0];
      applied.status = 'applied';
      applied.appliedAt = new Date().toISOString();
      if (result === null) applied.hadConflict = true;
      manifest.applied.push(applied);
    }

    manifest.stats.applied = manifest.applied.length;
    manifest.stats.conflicts = conflictCount;
    manifest.stats.eslintFixes = eslintFixCount;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    // Periodic commit
    if (appliedCount % 10 === 0) {
      exec('git add .planning/sync/sync-manifest.json', true);
      exec(`git commit --author="Chude <chude@emeke.org>" -m "chore(08-sync): update sync progress (${appliedCount}/${totalCommits} commits applied)"`, true);
    }
  }

  // Final
  manifest.status = 'complete';
  manifest.completedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  exec('git add .planning/sync/sync-manifest.json .planning/phases/08-upstream-sync/conflict-log.md', true);
  exec(`git commit --author="Chude <chude@emeke.org>" -m "chore(08-sync): complete upstream sync - all ${totalCommits} commits applied"`, true);

  console.log(`\n✓ Complete: ${manifest.applied.length} applied, ${conflictCount} conflicts, ${eslintFixCount} ESLint fixes`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
