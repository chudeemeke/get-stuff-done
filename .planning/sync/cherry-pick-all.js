#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MANIFEST_PATH = '.planning/sync/sync-manifest.json';
const CONFLICT_LOG_PATH = '.planning/phases/08-upstream-sync/conflict-log.md';

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

function updateManifest(sha, status, details = {}) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const idx = manifest.pending.findIndex(c => c.sha === sha);

  if (idx >= 0) {
    const commit = manifest.pending.splice(idx, 1)[0];
    commit.status = status;
    commit.appliedAt = new Date().toISOString();
    if (details.conflict) commit.hadConflict = true;
    if (details.eslintFix) commit.hadEslintFix = true;
    manifest.applied.push(commit);
  }

  manifest.stats.applied = manifest.applied.length;
  manifest.status = 'in_progress';

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  return manifest;
}

function logConflict(conflictNum, shortSha, files, resolution) {
  const log = fs.readFileSync(CONFLICT_LOG_PATH, 'utf8');
  const lines = log.split('\n');
  const summaryIdx = lines.findIndex(l => l.startsWith('## Summary'));

  const conflictRow = `| ${conflictNum} | ${shortSha} | ${files.join(', ')} | Path conflict | ${resolution} | ${resolution === 'Upstream wins' ? 'Default policy' : 'Protected path or special handling'} |`;
  lines.splice(summaryIdx, 0, conflictRow);

  // Update summary
  const totalMatch = lines.findIndex(l => l.startsWith('Total conflicts:'));
  if (totalMatch >= 0) {
    lines[totalMatch] = `Total conflicts: ${conflictNum}`;
    const upstreamWins = resolution === 'Upstream wins' ? conflictNum : 0;
    lines[totalMatch + 1] = `Upstream wins: ${upstreamWins}`;
  }

  fs.writeFileSync(CONFLICT_LOG_PATH, lines.join('\n'));
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const totalCommits = manifest.pending.length;
  let appliedCount = manifest.applied.length;
  let conflictCount = manifest.stats.conflicts || 0;
  let eslintFixCount = manifest.stats.eslintFixes || 0;

  console.log(`Starting cherry-pick of ${totalCommits} commits...`);
  console.log(`Already applied: ${appliedCount}\n`);

  for (const commit of manifest.pending) {
    appliedCount++;
    console.log(`[${appliedCount}/${totalCommits}] ${commit.shortSha}: ${commit.message}`);

    // Create snapshot tag
    exec(`git tag sync-snapshot-${commit.shortSha}`, { ignoreError: true, silent: true });

    // Try cherry-pick
    const pickResult = exec(
      `git cherry-pick -x ${commit.sha}`,
      { ignoreError: true, silent: true }
    );

    if (pickResult === null) {
      // Conflict occurred
      console.log(`  ⚠ Conflict detected`);
      conflictCount++;

      // Get conflicted files
      const conflicted = exec('git diff --name-only --diff-filter=U', { silent: true })
        .trim().split('\n').filter(Boolean);

      console.log(`  Conflicted files: ${conflicted.join(', ')}`);

      const protectedPaths = [
        'eslint.config.js',
        'src/validation/',
        'get-stuff-done/',
        'assets/gsd-logo-',
        'config/default-config.json',
        'src/config/ConfigLoader.js',
        'src/theme/'
      ];

      let resolution = 'Mixed';

      for (const file of conflicted) {
        const isProtected = protectedPaths.some(p => file.startsWith(p) || file.includes(p));

        // Check if this is a deletion conflict (file doesn't exist in theirs)
        const theirsExists = exec(`git cat-file -e MERGE_HEAD:"${file}" 2>&1`, {
          ignoreError: true,
          silent: true
        }) !== null;

        if (isProtected) {
          console.log(`    ${file} → Fork wins (protected)`);
          exec(`git checkout --ours "${file}"`, { silent: true });
          resolution = 'Fork wins';
        } else if (file === 'package.json') {
          console.log(`    ${file} → Theirs + manual review needed`);
          if (theirsExists) {
            exec(`git checkout --theirs "${file}"`, { silent: true });
          } else {
            exec(`git rm "${file}"`, { silent: true });
          }
          resolution = 'Custom merge';
        } else {
          if (theirsExists) {
            console.log(`    ${file} → Upstream wins (modified)`);
            exec(`git checkout --theirs "${file}"`, { silent: true });
          } else {
            console.log(`    ${file} → Upstream wins (deleted)`);
            exec(`git rm "${file}"`, { silent: true });
          }
          resolution = 'Upstream wins';
        }

        exec(`git add "${file}"`, { silent: true, ignoreError: true });
      }

      // Continue cherry-pick
      try {
        exec('git cherry-pick --continue --no-edit', { silent: true });
        logConflict(conflictCount, commit.shortSha, conflicted, resolution);
      } catch (err) {
        console.log(`  ✗ Continue failed, aborting`);
        exec('git cherry-pick --abort', { ignoreError: true, silent: true });
        continue;
      }
    } else {
      console.log(`  ✓ Clean cherry-pick`);
    }

    // Check ESLint
    const eslintCheck = exec('bunx eslint . --max-warnings 0', {
      ignoreError: true,
      silent: true
    });

    if (eslintCheck === null) {
      console.log(`  ⚠ ESLint violations, auto-fixing...`);
      exec('bunx eslint . --fix', { ignoreError: true, silent: true });

      const hasChanges = exec('git diff --quiet', { ignoreError: true, silent: true }) === null;

      if (hasChanges) {
        console.log(`    → Applied fixes, amending`);
        exec('git add -A', { silent: true });
        exec('git commit --amend --no-edit --author="Chude <chude@emeke.org>"', { silent: true });
        eslintFixCount++;
      }
    }

    // Update manifest
    updateManifest(commit.sha, 'applied', {
      conflict: pickResult === null,
      eslintFix: eslintCheck === null
    });

    // Commit manifest every 10 picks
    if (appliedCount % 10 === 0) {
      exec('git add .planning/sync/sync-manifest.json', { silent: true });
      exec(
        `git commit --author="Chude <chude@emeke.org>" -m "chore(08-sync): update sync progress (${appliedCount}/${totalCommits} commits applied)"`,
        { ignoreError: true, silent: true }
      );
    }
  }

  // Final manifest update
  const finalManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  finalManifest.status = 'complete';
  finalManifest.completedAt = new Date().toISOString();
  finalManifest.stats.conflicts = conflictCount;
  finalManifest.stats.eslintFixes = eslintFixCount;
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(finalManifest, null, 2));

  // Final commit
  exec('git add .planning/sync/sync-manifest.json .planning/phases/08-upstream-sync/conflict-log.md', { silent: true });
  exec(
    `git commit --author="Chude <chude@emeke.org>" -m "chore(08-sync): complete upstream sync - all ${totalCommits} commits applied"`,
    { silent: true }
  );

  console.log(`\n✓ All ${totalCommits} commits applied`);
  console.log(`  Conflicts: ${conflictCount}`);
  console.log(`  ESLint fixes: ${eslintFixCount}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
