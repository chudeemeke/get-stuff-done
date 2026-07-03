'use strict';

const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'verify-oversight-probes.js');
const FIXTURE_DIR = path.join(PROJECT_ROOT, 'tests', 'fixtures', 'oversight-probes');
const REQUIRED_TRIGGER_IDS = [
  'EBC-EXEC-POSTMERGE',
  'EBC-EXEC-SUMMARY',
  'EBC-VERIFY-CI-BEFORE-MEASURE',
  'EBC-PLAN-METRIC-COMPAT',
];

function loadProbeModule() {
  return require('../scripts/verify-oversight-probes');
}

describe('oversight trigger contract', () => {
  test('required trigger definitions are exact, compact, and evidence-governed', () => {
    const { PRINCIPLE_PATH, REQUIRED_TRIGGERS, verifyTriggerContracts } = loadProbeModule();

    expect(REQUIRED_TRIGGERS.map(trigger => trigger.id).sort()).toEqual([...REQUIRED_TRIGGER_IDS].sort());

    const result = verifyTriggerContracts(PROJECT_ROOT);
    expect(result.errors).toEqual([]);

    for (const triggerId of REQUIRED_TRIGGER_IDS) {
      const block = result.blocks[triggerId];

      expect(block, triggerId).toBeDefined();
      expect(block.lines.length, triggerId).toBeLessThanOrEqual(3);
      expect(block.text, triggerId).toContain(PRINCIPLE_PATH);
      expect(block.text, triggerId).toContain('PROCESS-07');
      expect(block.text, triggerId).toContain('MAINTENANCE.md');
      expect(block.text, triggerId).not.toContain('blocks execution');
      expect(block.text, triggerId).not.toContain('blocking in v1.2.0');
    }
  });

  test('curated fixtures map to their expected trigger IDs and abstain case', () => {
    const { FIXTURE_EXPECTATIONS, analyzeFixtureText } = loadProbeModule();

    expect(Object.values(FIXTURE_EXPECTATIONS).filter(Boolean).sort()).toEqual([...REQUIRED_TRIGGER_IDS].sort());
    expect(FIXTURE_EXPECTATIONS['evidence-backed-summary.md']).toBeNull();

    for (const [fixtureName, expectedTrigger] of Object.entries(FIXTURE_EXPECTATIONS)) {
      const fixtureText = fs.readFileSync(path.join(FIXTURE_DIR, fixtureName), 'utf8');
      const matches = analyzeFixtureText(fixtureText);

      if (expectedTrigger === null) {
        expect(matches, fixtureName).toEqual([]);
      } else {
        expect(matches, fixtureName).toEqual([expectedTrigger]);
      }
    }
  });

  test('fixture verification reports fixture name and trigger ID when detection fails', () => {
    const { FIXTURE_EXPECTATIONS, runFixtureChecks } = loadProbeModule();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-oversight-probes-'));

    try {
      fs.writeFileSync(path.join(tempDir, 'postmerge-claim.md'), 'Summary has command evidence: `git show --oneline origin/main` exited 0.\n');

      const result = runFixtureChecks(PROJECT_ROOT, tempDir, {
        'postmerge-claim.md': FIXTURE_EXPECTATIONS['postmerge-claim.md'],
      });

      expect(result.errors.join('\n')).toContain('postmerge-claim.md');
      expect(result.errors.join('\n')).toContain('EBC-EXEC-POSTMERGE');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('CLI verifier exits zero for repository fixtures', () => {
    const result = spawnSync(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('Oversight probes passed');
  });
});
