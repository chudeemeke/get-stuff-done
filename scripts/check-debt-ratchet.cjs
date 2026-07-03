#!/usr/bin/env node

'use strict';

/**
 * scripts/check-debt-ratchet.cjs
 *
 * RATCHET GATE — enforce the no-increase invariant on tracked technical debt.
 *
 * Reads .planning/audits/debt-baseline.json (SSOT, committed Wave 1.5d) and
 * compares observed counts to thresholds. Counts may decrease (debt paydown
 * is welcome). Counts MUST NOT increase (regression).
 *
 * Tracked thresholds (Phase 40.5 Wave 1.6 Task 1.6-04):
 *   - boundary_violations_max     ← scripts/check-boundary.js
 *   - upstream_compat_diffs_max   ← scripts/run-upstream-compat.js
 *
 * Threshold updates (paydown ratchets) are conscious decisions captured in
 * debt-baseline.json's `ratchet_history` log — never automatic.
 *
 * Composition: this script is a CONSUMER of two existing producers that
 * already export their result objects. It does not re-implement either
 * check; it re-uses their results.
 *
 * Exit codes:
 *   0 — all observed counts ≤ thresholds (ratchet holds)
 *   1 — at least one observed count > threshold (ratchet broken) OR fatal error
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const hooksManifest = require('../hooks');
const { checkBoundary } = require('./check-boundary');
const { runUpstreamCompat } = require('./run-upstream-compat');

const PROJECT_ROOT = hooksManifest.PROJECT_ROOT;
const BASELINE_PATH = path.join(
  PROJECT_ROOT,
  '.planning',
  'audits',
  'debt-baseline.json'
);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

/**
 * Read and parse the SSOT baseline.
 *
 * @returns {{ thresholds: Object, version: string, policy: string }}
 */
function readBaseline(baselinePath = BASELINE_PATH) {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(
      `Debt baseline not found at ${baselinePath}.\n` +
        `Expected SSOT committed in Wave 1.5d. ` +
        `If this file is missing, the ratchet gate cannot run.`
    );
  }
  const raw = fs.readFileSync(baselinePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Debt baseline at ${baselinePath} is not valid JSON: ${err.message}`
    );
  }
  if (!parsed.thresholds || typeof parsed.thresholds !== 'object') {
    throw new Error(
      `Debt baseline at ${baselinePath} has no .thresholds object.`
    );
  }
  return parsed;
}

/**
 * Normalise Node's os.platform() to the keys used in baseline per-OS maps.
 *
 *   'linux'   → 'linux'
 *   'darwin'  → 'macos'
 *   'win32'   → 'windows'
 *
 * Other platforms (freebsd, sunos, etc.) pass through unchanged so an explicit
 * baseline mapping can be added if ever needed without re-coding this fn.
 *
 * @param {string} [platform] defaults to os.platform()
 * @returns {string}
 */
function normalisePlatform(platform = os.platform()) {
  if (platform === 'darwin') return 'macos';
  if (platform === 'win32') return 'windows';
  return platform;
}

/**
 * Extract the threshold integer for a named entry. The baseline `value` field
 * is a UNION schema — it MAY be either:
 *   - a scalar number (OS-independent threshold), OR
 *   - an object keyed by normalised platform name (per-OS threshold), e.g.
 *     `{ linux: 132, macos: 132, windows: 133 }`.
 *
 * This function abstracts both shapes so call sites stay single-line. Future
 * thresholds can adopt either shape with no changes to consumers (OCP).
 *
 * @param {Object} baseline parsed baseline JSON
 * @param {string} key       e.g. 'boundary_violations_max'
 * @param {string} [platform] override for testing; defaults to current OS
 * @returns {{ threshold: number, variant: 'scalar' | string }}
 *   variant === 'scalar' when value was a number; otherwise the OS key used
 */
function getThreshold(baseline, key, platform) {
  const entry = baseline.thresholds[key];
  if (!entry || entry.value === undefined || entry.value === null) {
    throw new Error(
      `Baseline threshold '${key}' missing or has no .value`
    );
  }
  if (typeof entry.value === 'number') {
    return { threshold: entry.value, variant: 'scalar' };
  }
  if (typeof entry.value === 'object' && !Array.isArray(entry.value)) {
    const osKey = normalisePlatform(platform);
    const v = entry.value[osKey];
    if (typeof v !== 'number') {
      const known = Object.keys(entry.value).join(', ');
      throw new Error(
        `Baseline threshold '${key}' is a per-OS map but has no entry for '${osKey}'. ` +
          `Known keys: ${known}. Add an entry to .planning/audits/debt-baseline.json ` +
          `or update normalisePlatform() if a new platform must be supported.`
      );
    }
    return { threshold: v, variant: osKey };
  }
  throw new Error(
    `Baseline threshold '${key}' has unsupported .value type (${typeof entry.value}). ` +
      `Expected number or per-OS object {linux,macos,windows,...}.`
  );
}

/**
 * Run all producers and return observed counts.
 *
 * @param {{ composeFirst?: boolean }} [opts]
 * @returns {{ boundary: number, compat: number }}
 */
function observe(opts = {}) {
  const composeFirst = opts.composeFirst !== false; // default true; CI passes false

  const boundaryResult = checkBoundary({});
  const compatResult = runUpstreamCompat({ composeFirst });

  return {
    boundary: Array.isArray(boundaryResult.violations)
      ? boundaryResult.violations.length
      : 0,
    compat: typeof compatResult.failed === 'number' ? compatResult.failed : 0,
  };
}

/**
 * Compare observed counts to thresholds and produce a verdict per check.
 *
 * @param {{ boundary: number, compat: number }} observed
 * @param {Object} baseline parsed baseline
 * @param {string} [platform] override for testing
 * @returns {{ ok: boolean, lines: string[] }}
 */
function compare(observed, baseline, platform) {
  const lines = [];
  let ok = true;

  const checks = [
    { label: 'boundary', key: 'boundary_violations_max', count: observed.boundary },
    { label: 'compat',   key: 'upstream_compat_diffs_max', count: observed.compat   },
  ];

  for (const c of checks) {
    const { threshold, variant } = getThreshold(baseline, c.key, platform);
    const variantTag = variant === 'scalar' ? '' : ` (${variant})`;
    if (c.count > threshold) {
      ok = false;
      const over = c.count - threshold;
      lines.push(
        `${RED}[FAIL]${NC} ${c.label}${variantTag}: ${c.count} / ${threshold} (OVER BY ${over} — RATCHET BROKEN)`
      );
    } else if (c.count === threshold) {
      lines.push(
        `${GREEN}[PASS]${NC} ${c.label}${variantTag}: ${c.count} / ${threshold} (at threshold)`
      );
    } else {
      const under = threshold - c.count;
      lines.push(
        `${GREEN}[PASS]${NC} ${c.label}${variantTag}: ${c.count} / ${threshold} (under by ${under} — paydown welcome)`
      );
    }
  }

  return { ok, lines };
}

/**
 * Format the failure-mode guidance shown when the ratchet breaks.
 *
 * @returns {string}
 */
function failureGuidance() {
  return [
    '',
    `${YELLOW}Ratchet policy:${NC} counts may decrease (paydown), never increase.`,
    'If this regression is intentional (rare):',
    '  1. Investigate the new violations — fix at source rather than raising the threshold.',
    '  2. If raising the threshold is justified, edit .planning/audits/debt-baseline.json',
    '     and append a {date, action, committer, note} entry to ratchet_history.',
    '  3. The threshold change must land in the same PR as the regression-causing change',
    '     so the rationale is co-located with the diff.',
    '',
  ].join('\n');
}

function main() {
  let baseline;
  try {
    baseline = readBaseline();
  } catch (err) {
    console.error(`${RED}FATAL:${NC} ${err.message}`);
    process.exit(1);
  }

  console.log(`Ratchet gate (debt-baseline.json v${baseline.version})`);
  console.log('================================================');

  // In CI, dist/ is already composed by a prior step. Locally, callers may
  // need composeFirst=true. Default to true; CI overrides via --no-compose.
  const composeFirst = !process.argv.includes('--no-compose');
  const observed = observe({ composeFirst });

  const verdict = compare(observed, baseline);
  for (const line of verdict.lines) console.log(line);

  if (!verdict.ok) {
    console.error(failureGuidance());
    process.exit(1);
  }

  console.log('');
  console.log(`${GREEN}OK:${NC} ratchet holds — observed counts ≤ thresholds`);
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  readBaseline,
  getThreshold,
  normalisePlatform,
  observe,
  compare,
  failureGuidance,
};
