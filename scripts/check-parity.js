#!/usr/bin/env node

/**
 * Source-to-installed parity check
 *
 * Verifies that all files declared in package.json "files" array exist in the project source.
 * Also checks that key distributable files exist.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

let passCount = 0;
let failCount = 0;
let skipCount = 0;

function checkDirectory(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return { status: 'FAIL', message: 'exists but is not a directory' };
    }

    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
      return { status: 'FAIL', message: 'directory is empty' };
    }

    return { status: 'PASS', message: `${files.length} files` };
  } catch (err) {
    return { status: 'FAIL', message: err.code === 'ENOENT' ? 'does not exist' : err.message };
  }
}

function checkFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { status: 'FAIL', message: 'exists but is not a file' };
    }
    return { status: 'PASS', message: 'exists' };
  } catch (err) {
    return { status: 'FAIL', message: err.code === 'ENOENT' ? 'does not exist' : err.message };
  }
}

function printResult(status, label, message) {
  const color = status === 'PASS' ? GREEN : status === 'FAIL' ? RED : YELLOW;
  console.log(`${color}[${status}]${NC} ${label}${message ? ` (${message})` : ''}`);

  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
  else if (status === 'SKIP') skipCount++;
}

function main() {
  console.log('Source-to-installed parity check');
  console.log('================================\n');

  // Read package.json
  let packageJson;
  try {
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    packageJson = JSON.parse(packageJsonContent);
  } catch (err) {
    console.error(`${RED}Error:${NC} Failed to read package.json: ${err.message}`);
    process.exit(1);
  }

  if (!packageJson.files || !Array.isArray(packageJson.files)) {
    console.error(`${RED}Error:${NC} package.json does not have a "files" array`);
    process.exit(1);
  }

  console.log('Checking package.json "files" entries:\n');

  // Check each entry in "files" array
  for (const entry of packageJson.files) {
    const fullPath = path.join(PROJECT_ROOT, entry);

    // Special handling for hooks/dist/ (build-generated)
    if (entry === 'hooks/dist') {
      printResult('SKIP', entry, 'build-generated, checking source');

      // Check hooks/ source directory instead
      const hooksSourcePath = path.join(PROJECT_ROOT, 'hooks');
      const result = checkDirectory(hooksSourcePath);
      printResult(result.status, 'hooks/ source', result.message);
      continue;
    }

    // Check if path exists
    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch (err) {
      printResult('FAIL', entry, err.code === 'ENOENT' ? 'does not exist' : err.message);
      continue;
    }

    // Check directory or file
    if (stats.isDirectory()) {
      const result = checkDirectory(fullPath);
      printResult(result.status, entry + '/', result.message);
    } else if (stats.isFile()) {
      printResult('PASS', entry, 'exists');
    } else {
      printResult('FAIL', entry, 'unknown file type');
    }
  }

  // Check key distributable files
  console.log('\nKey files:\n');

  const keyFiles = [
    'bin/gsd.js',
    'bin/install.js',
    'get-stuff-done/bin/gsd-tools.js',
    'src/config/ConfigLoader.js',
    'src/platform/detect.js'
  ];

  for (const file of keyFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    const result = checkFile(fullPath);
    printResult(result.status, file, result.message === 'exists' ? '' : result.message);
  }

  // Check hooks/ source files (since hooks/dist/ is build-generated)
  console.log('\nHooks source files:\n');

  const hookFiles = [
    'hooks/gsd-check-update.js',
    'hooks/gsd-statusline.js',
    'hooks/pre-compact.js'
  ];

  for (const file of hookFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    const result = checkFile(fullPath);
    printResult(result.status, file, result.message === 'exists' ? '' : result.message);
  }

  // Summary
  console.log('\n================================');
  console.log(`Parity check: ${passCount}/${passCount + failCount} passed`);

  if (skipCount > 0) {
    console.log(`Skipped: ${skipCount} (build-generated)`);
  }

  if (failCount > 0) {
    console.log(`${RED}FAILED${NC}: ${failCount} checks failed`);
    process.exit(1);
  } else {
    console.log(`${GREEN}PASSED${NC}: All checks passed`);
    process.exit(0);
  }
}

main();
