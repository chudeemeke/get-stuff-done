#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PRINCIPLE_PATH = 'overlay/memory/oversight-principle-evidence-before-claim.md';
const MAINTENANCE_PATH = 'MAINTENANCE.md';
const FIXTURE_DIR = 'tests/fixtures/oversight-probes';

const REQUIRED_TRIGGERS = [
  {
    id: 'EBC-EXEC-POSTMERGE',
    agentPath: 'overlay/agents/gsd-oversight-execution.md',
    detect: text => hasUnverifiedPostMergeClaim(text),
  },
  {
    id: 'EBC-EXEC-SUMMARY',
    agentPath: 'overlay/agents/gsd-oversight-execution.md',
    detect: text => hasUnevidencedSummaryClaim(text),
  },
  {
    id: 'EBC-VERIFY-CI-BEFORE-MEASURE',
    agentPath: 'overlay/agents/gsd-oversight-verification.md',
    detect: text => hasCiGateBeforeMeasurementClaim(text),
  },
  {
    id: 'EBC-PLAN-METRIC-COMPAT',
    agentPath: 'overlay/agents/gsd-oversight-planning.md',
    detect: text => hasMetricCompatibilityGap(text),
  },
];

const FIXTURE_EXPECTATIONS = {
  'postmerge-claim.md': 'EBC-EXEC-POSTMERGE',
  'summary-without-evidence.md': 'EBC-EXEC-SUMMARY',
  'ci-before-measure.md': 'EBC-VERIFY-CI-BEFORE-MEASURE',
  'metric-incompatible-plan.md': 'EBC-PLAN-METRIC-COMPAT',
  'evidence-backed-summary.md': null,
};

function readText(rootDir, relPath) {
  const filePath = path.join(rootDir, relPath);
  // All paths are constrained to known repository-relative contract files.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(filePath, 'utf8');
}

function exists(rootDir, relPath) {
  const filePath = path.join(rootDir, relPath);
  // All paths are constrained to known repository-relative contract files.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.existsSync(filePath);
}

function expectedTriggerIds() {
  return REQUIRED_TRIGGERS.map(trigger => trigger.id);
}

function uniqueAgentPaths() {
  return [...new Set(REQUIRED_TRIGGERS.map(trigger => trigger.agentPath))];
}

function extractTriggerBlocks(text, filePath) {
  const blocks = new Map();
  const lines = text.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const match = line.match(/`(EBC-[A-Z0-9-]+)`/);
    if (!match) continue;

    const triggerId = match[1];
    const blockLines = [line.trim()];
    for (const nextLine of lines.slice(index + 1)) {
      const trimmed = nextLine.trim();

      if (trimmed === '') break;
      if (/^- `EBC-[A-Z0-9-]+`/.test(trimmed)) break;
      if (/^<\//.test(trimmed)) break;
      blockLines.push(trimmed);
    }

    blocks.set(triggerId, {
      filePath,
      lines: blockLines,
      text: blockLines.join('\n'),
    });
  }

  return blocks;
}

function collectTriggerBlocks(rootDir) {
  const blocks = new Map();

  for (const agentPath of uniqueAgentPaths()) {
    const text = readText(rootDir, agentPath);
    for (const [triggerId, block] of extractTriggerBlocks(text, agentPath)) {
      blocks.set(triggerId, block);
    }
  }

  return blocks;
}

function blocksToObject(blocks) {
  return {
    'EBC-EXEC-POSTMERGE': blocks.get('EBC-EXEC-POSTMERGE'),
    'EBC-EXEC-SUMMARY': blocks.get('EBC-EXEC-SUMMARY'),
    'EBC-VERIFY-CI-BEFORE-MEASURE': blocks.get('EBC-VERIFY-CI-BEFORE-MEASURE'),
    'EBC-PLAN-METRIC-COMPAT': blocks.get('EBC-PLAN-METRIC-COMPAT'),
  };
}

function verifyTriggerContracts(rootDir = PROJECT_ROOT) {
  const errors = [];
  let blocks = new Map();

  if (!exists(rootDir, PRINCIPLE_PATH)) {
    errors.push(`Missing principle document: ${PRINCIPLE_PATH}`);
  }

  try {
    blocks = collectTriggerBlocks(rootDir);
  } catch (error) {
    errors.push(`Failed to read oversight agent files: ${error.message}`);
    return { errors, blocks: blocksToObject(blocks) };
  }

  const requiredIds = expectedTriggerIds();
  const unexpectedIds = [...blocks.keys()].filter(id => !requiredIds.includes(id));
  for (const unexpectedId of unexpectedIds) {
    const block = blocks.get(unexpectedId);
    errors.push(`Unexpected trigger ID ${unexpectedId} in ${block.filePath}`);
  }

  for (const trigger of REQUIRED_TRIGGERS) {
    const block = blocks.get(trigger.id);
    if (!block) {
      errors.push(`Missing trigger ${trigger.id} in ${trigger.agentPath}`);
      continue;
    }

    if (block.filePath !== trigger.agentPath) {
      errors.push(`Trigger ${trigger.id} found in ${block.filePath}, expected ${trigger.agentPath}`);
    }
    if (block.lines.length > 3) {
      errors.push(`Trigger ${trigger.id} block is ${block.lines.length} lines; maximum is 3`);
    }
    if (!block.text.includes(PRINCIPLE_PATH)) {
      errors.push(`Trigger ${trigger.id} must reference ${PRINCIPLE_PATH}`);
    }
    if (!block.text.includes('PROCESS-07') || !block.text.includes(MAINTENANCE_PATH)) {
      errors.push(`Trigger ${trigger.id} must reference PROCESS-07 graduation criteria in ${MAINTENANCE_PATH}`);
    }
    if (block.text.includes('blocks execution') || block.text.includes('blocking in v1.2.0')) {
      errors.push(`Trigger ${trigger.id} must stay advisory in v1.2.0`);
    }
  }

  return { errors, blocks: blocksToObject(blocks) };
}

function hasCommandEvidence(text) {
  return /\bEvidence:/i.test(text) ||
    /`(?:bun test|node scripts\/|git (?:fetch|show|rev-parse|ls-remote)|gh (?:pr|run) view|bash scripts\/)[^`]*`/i.test(text) ||
    /\b(?:run|command|workflow) [0-9]{5,}\b/i.test(text);
}

function hasUnverifiedPostMergeClaim(text) {
  return !hasCommandEvidence(text) &&
    /\b(?:merged|merge|squash merged|origin\/main|remote state|branch state|PR #\d+)\b/i.test(text) &&
    /\b(?:origin\/main|remote|branch|PR #\d+|state)\b/i.test(text);
}

function hasUnevidencedSummaryClaim(text) {
  return !hasCommandEvidence(text) &&
    /\b(?:summary|verification|verified|complete|passed|green)\b/i.test(text) &&
    /\b(?:passed|green|complete|verified|closed)\b/i.test(text);
}

function hasCiGateBeforeMeasurementClaim(text) {
  return !hasCommandEvidence(text) &&
    /\b(?:CI|workflow|gate)\b/i.test(text) &&
    /\b(?:before|after|without|pending|once the YAML exists|can happen after)\b/i.test(text) &&
    /\b(?:measure|measurement|local|evidence|proven)\b/i.test(text);
}

function hasMetricCompatibilityGap(text) {
  return /\b(?:95%|coverage|statements|branches|functions|lines|metric|target)\b/i.test(text) &&
    /\b(?:bun test --coverage|coverage target|metric-target|metric compatibility|reporter)\b/i.test(text) &&
    /\b(?:without|no|not needed|before committing|promises?)\b/i.test(text);
}

function analyzeFixtureText(text) {
  return REQUIRED_TRIGGERS
    .filter(trigger => trigger.detect(text))
    .map(trigger => trigger.id);
}

function runFixtureChecks(rootDir = PROJECT_ROOT, fixtureDir = path.join(PROJECT_ROOT, FIXTURE_DIR), expectations = FIXTURE_EXPECTATIONS) {
  const errors = [];
  const results = new Map();

  for (const [fixtureName, expectedTrigger] of Object.entries(expectations)) {
    const fixturePath = path.join(fixtureDir, fixtureName);
    let text;
    try {
      // Fixture names come from a static expectation map.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      text = fs.readFileSync(fixturePath, 'utf8');
    } catch (error) {
      errors.push(`Missing fixture ${fixtureName}: ${error.message}`);
      continue;
    }

    const matches = analyzeFixtureText(text);
    results.set(fixtureName, matches);

    if (expectedTrigger === null) {
      if (matches.length > 0) {
        errors.push(`${fixtureName}: expected abstain, got ${matches.join(', ')}`);
      }
      continue;
    }

    if (!matches.includes(expectedTrigger)) {
      errors.push(`${fixtureName}: expected ${expectedTrigger}, got ${matches.length > 0 ? matches.join(', ') : 'no trigger'}`);
      continue;
    }

    const unexpectedMatches = matches.filter(match => match !== expectedTrigger);
    if (unexpectedMatches.length > 0) {
      errors.push(`${fixtureName}: unexpected trigger(s) ${unexpectedMatches.join(', ')} alongside ${expectedTrigger}`);
    }
  }

  return { errors, results, rootDir };
}

function runVerification(rootDir = PROJECT_ROOT) {
  const contract = verifyTriggerContracts(rootDir);
  const fixtures = runFixtureChecks(rootDir, path.join(rootDir, FIXTURE_DIR));
  return {
    errors: [...contract.errors, ...fixtures.errors],
    contract,
    fixtures,
  };
}

function main(argv = process.argv.slice(2)) {
  const rootDir = argv[0] ? path.resolve(argv[0]) : PROJECT_ROOT;
  const result = runVerification(rootDir);

  if (result.errors.length > 0) {
    process.stderr.write('Oversight probe verification failed:\n');
    for (const error of result.errors) {
      process.stderr.write(`- ${error}\n`);
    }
    return 1;
  }

  process.stdout.write(`Oversight probes passed: ${REQUIRED_TRIGGERS.length} triggers, ${Object.keys(FIXTURE_EXPECTATIONS).length} fixtures.\n`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  FIXTURE_EXPECTATIONS,
  PRINCIPLE_PATH,
  REQUIRED_TRIGGERS,
  analyzeFixtureText,
  extractTriggerBlocks,
  runFixtureChecks,
  runVerification,
  verifyTriggerContracts,
};
