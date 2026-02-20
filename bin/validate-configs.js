#!/usr/bin/env node
'use strict';

/**
 * Config Validation Script
 *
 * Validates project config files before publish:
 *   .planning/config.json -- AJV schema (planningConfigSchema)
 *   .planning/ROADMAP.md   -- required sections present
 *   .planning/STATE.md     -- required sections present
 *   .planning/PROJECT.md   -- required sections present
 *   package.json           -- files array entries exist on disk
 *
 * All validated files are also checked for git conflict markers.
 *
 * Usage:
 *   node bin/validate-configs.js [--quiet]
 *   SKIP_CONFIG_VALIDATION=1 node bin/validate-configs.js
 *
 * Exit codes:
 *   0 -- all validations passed (or skipped)
 *   1 -- one or more validations failed
 */

// Escape hatch: SKIP_CONFIG_VALIDATION=1 bypasses all checks
if (process.env.SKIP_CONFIG_VALIDATION === '1') {
  process.stderr.write('Warning: Config validation skipped (SKIP_CONFIG_VALIDATION=1)\n');
  process.exit(0);
}

const fs = require('fs');
const path = require('path');
const { validatePlanningConfig } = require('../src/config/schema');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');

// ── Conflict marker detection ─────────────────────────────────────────────────

/**
 * Checks content for git conflict markers.
 * @param {string} content
 * @returns {string[]} Error messages, empty if no markers found
 */
function checkConflictMarkers(content) {
  const errors = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const lineNum = i + 1;
    if (line.startsWith('<<<<<<<')) {
      errors.push(`Line ${lineNum}: git conflict marker '<<<<<<<' found`);
    } else if (line.startsWith('=======') && errors.length > 0) {
      errors.push(`Line ${lineNum}: git conflict marker '=======' found`);
    } else if (line.startsWith('>>>>>>>')) {
      errors.push(`Line ${lineNum}: git conflict marker '>>>>>>>' found`);
    }
  });
  return errors;
}

// ── Validators ────────────────────────────────────────────────────────────────

/**
 * Validates .planning/config.json against AJV schema.
 * @returns {{ ok: boolean, errors?: string[] }}
 */
function validatePlanningConfigFile() {
  const filePath = path.join(PROJECT_ROOT, '.planning', 'config.json');

  if (!fs.existsSync(filePath)) {
    return { ok: false, errors: ['File not found: .planning/config.json'] };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return { ok: false, errors: [`Cannot read file: ${err.message}`] };
  }

  const errors = [];

  // Check for conflict markers first
  const markerErrors = checkConflictMarkers(content);
  if (markerErrors.length > 0) {
    errors.push(...markerErrors);
  }

  // Parse and validate against schema
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    errors.push(`JSON parse error: ${err.message}`);
    return { ok: false, errors };
  }

  const schemaResult = validatePlanningConfig(parsed);
  if (!schemaResult.ok) {
    errors.push(...schemaResult.errors);
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Factory: creates a validator for a markdown file that checks required sections.
 * @param {string} name - Human-readable file name for error messages
 * @param {string[]} requiredSections - Section headers that must appear in the file
 * @returns {function(): { ok: boolean, errors?: string[] }}
 */
function validateMarkdownSections(name, requiredSections) {
  return function validateMarkdownFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return { ok: false, errors: [`File not found: ${name}`] };
    }

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      return { ok: false, errors: [`Cannot read file: ${err.message}`] };
    }

    const errors = [];

    // Check for conflict markers
    const markerErrors = checkConflictMarkers(content);
    if (markerErrors.length > 0) {
      errors.push(...markerErrors);
    }

    // Check each required section exists
    for (const section of requiredSections) {
      // Match section header anywhere in the file (case-sensitive)
      const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^${escaped}`, 'm');
      if (!pattern.test(content)) {
        errors.push(`Missing required section: "${section}"`);
      }
    }

    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  };
}

/**
 * Validates package.json: parses it and checks all files array entries exist on disk.
 * @returns {{ ok: boolean, errors?: string[] }}
 */
function validatePackageJson() {
  const filePath = path.join(PROJECT_ROOT, 'package.json');

  if (!fs.existsSync(filePath)) {
    return { ok: false, errors: ['File not found: package.json'] };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return { ok: false, errors: [`Cannot read file: ${err.message}`] };
  }

  const errors = [];

  // Check for conflict markers
  const markerErrors = checkConflictMarkers(content);
  if (markerErrors.length > 0) {
    errors.push(...markerErrors);
  }

  // Parse JSON
  let pkg;
  try {
    pkg = JSON.parse(content);
  } catch (err) {
    errors.push(`JSON parse error: ${err.message}`);
    return { ok: false, errors };
  }

  // Validate files array entries exist on disk
  const files = Array.isArray(pkg.files) ? pkg.files : [];
  for (const entry of files) {
    const entryPath = path.join(PROJECT_ROOT, entry);
    if (!fs.existsSync(entryPath)) {
      errors.push(`files[] entry does not exist on disk: "${entry}"`);
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// ── Validator registry ────────────────────────────────────────────────────────

const validators = [
  {
    label: '.planning/config.json',
    run: validatePlanningConfigFile
  },
  {
    label: '.planning/ROADMAP.md',
    run: validateMarkdownSections('ROADMAP.md', ['## Milestones', '## Phases', '## Progress']).bind(
      null,
      path.join(PROJECT_ROOT, '.planning', 'ROADMAP.md')
    )
  },
  {
    label: '.planning/STATE.md',
    run: validateMarkdownSections('STATE.md', ['## Current Position', '## Session Continuity']).bind(
      null,
      path.join(PROJECT_ROOT, '.planning', 'STATE.md')
    )
  },
  {
    label: '.planning/PROJECT.md',
    run: validateMarkdownSections('PROJECT.md', ['## What This Is', '## Requirements', '## Context']).bind(
      null,
      path.join(PROJECT_ROOT, '.planning', 'PROJECT.md')
    )
  },
  {
    label: 'package.json',
    run: validatePackageJson
  }
];

// ── Runner ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

for (const { label, run } of validators) {
  const result = run();
  if (result.ok) {
    passed++;
    if (!QUIET) {
      process.stdout.write(`PASS ${label}\n`);
    }
  } else {
    failed++;
    const errorList = (result.errors || ['unknown error']).join(', ');
    process.stderr.write(`FAIL ${label}: ${errorList}\n`);
  }
}

const summary = `${passed} passed, ${failed} failed\n`;
process.stdout.write(summary);

process.exit(failed > 0 ? 1 : 0);
