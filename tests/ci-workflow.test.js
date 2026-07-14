const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');
const CI_WORKFLOW = path.join(WORKFLOWS_DIR, 'ci.yml');

function readCiWorkflow() {
  return fs.readFileSync(CI_WORKFLOW, 'utf8');
}

function readWorkflow(fileName) {
  return fs.readFileSync(path.join(WORKFLOWS_DIR, fileName), 'utf8');
}

function readAllWorkflowText() {
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter(fileName => fileName.endsWith('.yml') || fileName.endsWith('.yaml'))
    .map(fileName => readWorkflow(fileName))
    .join('\n');
}

function findBareBunTestCommands(workflowText) {
  return workflowText
    .split('\n')
    .map(line => line.trim())
    .map(line => (line.startsWith('run:') ? line.slice('run:'.length).trim() : line))
    .filter(command => command === 'bun test' || command.startsWith('bun test '));
}

describe('CI workflow security action contracts', () => {
  test('gitleaks receives the GitHub token required for pull request scans', () => {
    const workflow = readCiWorkflow();
    const gitleaksStepMarker = 'uses: gitleaks/gitleaks-action@v3';
    const gitleaksStep = workflow.slice(workflow.indexOf(gitleaksStepMarker));

    expect(workflow).toContain(gitleaksStepMarker);
    expect(workflow).not.toContain('uses: gitleaks/gitleaks-action@v2');
    expect(gitleaksStep).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
  });

  test('OSV scanner action is pinned to a resolvable concrete v2 tag', () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain('uses: google/osv-scanner-action/osv-scanner-action@v2.3.8');
    expect(workflow).not.toContain('uses: google/osv-scanner-action/osv-scanner-action@v2\n');
  });

  test('first-party Node actions use Node 24-compatible majors', () => {
    const workflows = readAllWorkflowText();

    expect(workflows).toContain('actions/setup-node@v6');
    expect(workflows).not.toContain('actions/setup-node@v4');
    expect(workflows).toContain('actions/upload-artifact@v7');
    expect(workflows).not.toContain('actions/upload-artifact@v4');
    expect(workflows).toContain('actions/download-artifact@v8');
    expect(workflows).not.toContain('actions/download-artifact@v4');
    expect(workflows).toContain('actions/github-script@v8');
    expect(workflows).not.toContain('actions/github-script@v7');
  });

  test('macOS runners are pinned away from macos-latest migration', () => {
    const ciWorkflow = readCiWorkflow();
    const perfWorkflow = readWorkflow('perf-baseline.yml');
    const workflows = readAllWorkflowText();

    expect(workflows).not.toContain('macos-latest');
    expect(ciWorkflow).toContain('macos-15');
    expect(perfWorkflow).toContain('os: macos-15');
  });
});

describe('CI workflow informational gates', () => {
  test('upstream compatibility reports through a non-blocking CI wrapper', () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain('node scripts/run-upstream-compat-ci.js');
    expect(workflow).not.toContain('run: node scripts/run-upstream-compat.js');
  });

  test('repository compatibility contracts are blocking in the cross-platform job', () => {
    const workflow = readCiWorkflow();
    const upstreamJobStart = workflow.indexOf('upstream-compat:');
    const boundaryJobStart = workflow.indexOf('boundary-check:', upstreamJobStart);
    const upstreamJob = workflow.slice(upstreamJobStart, boundaryJobStart);
    const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));

    expect(packageJson.scripts['test:repository-compat']).toBe(
      'node scripts/run-repository-compat.js'
    );
    expect(upstreamJob).toContain('bun run test:repository-compat');
    expect(upstreamJob).not.toContain('continue-on-error: true');
  });

  test('functional test gates route through the canonical package script', () => {
    const workflow = readCiWorkflow();
    const workflows = readAllWorkflowText();

    expect(workflow).toContain(
      'bun run test:coverage:bun -- --reporter=junit --reporter-outfile test-results.xml'
    );
    expect(findBareBunTestCommands(workflows)).toEqual([]);
  });

  test('boundary debt reports without producing a failed-step annotation', () => {
    const workflow = readCiWorkflow();
    const boundaryJobStart = workflow.indexOf('boundary-check:');
    const overrideJobStart = workflow.indexOf('override-check:');
    const boundaryJob = workflow.slice(boundaryJobStart, overrideJobStart);

    expect(boundaryJob).toContain('node scripts/check-boundary.js --report-only');
    expect(boundaryJob).not.toContain('continue-on-error: true');
    expect(boundaryJob).toContain('node scripts/check-debt-ratchet.cjs --no-compose');
  });
});

describe('Phase 41 validation workflows', () => {
  test('10x validation workflow is manual-only and runs all pinned platform suites ten times', () => {
    const workflow = readWorkflow('10x-validation.yml');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toContain('pull_request:');
    expect(workflow).not.toContain('push:');
    expect(workflow).toContain('ubuntu-latest');
    expect(workflow).toContain('macos-15');
    expect(workflow).toContain('windows-latest');
    expect(workflow).toContain('10x validation run');
    expect(workflow).toContain('bun run test:coverage:bun');
    expect(findBareBunTestCommands(workflow)).toEqual([]);
  });

  test('flake issue maintenance workflow encodes stale closure and rel-03 guard policy', () => {
    const workflow = readWorkflow('flake-issue-maintenance.yml');

    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('flake-report');
    expect(workflow).toContain('30');
    expect(workflow).toContain('last-hit');
    expect(workflow).toContain('total-hits');
    expect(workflow).toContain('rel-03-candidate');
  });

  test('maintenance log makes the D-11 and REL-03 escape hatch visible', () => {
    const maintenance = fs.readFileSync(path.join(PROJECT_ROOT, 'MAINTENANCE.md'), 'utf8');

    expect(maintenance).toContain('Escape-Hatch Decisions Log');
    expect(maintenance).toContain('2 working days');
    expect(maintenance).toContain('No active REL-03 skips');
    expect(maintenance).toContain('| ID | test-path | platform | issue | deadline | reviewer | status |');
  });
});

describe('Phase 42 perf budget workflow', () => {
  test('perf-budget job compares fresh metrics against committed thresholds on pinned runners', () => {
    const workflow = readCiWorkflow();
    const perfJobStart = workflow.indexOf('perf-budget:');
    const parityJobStart = workflow.indexOf('\n  parity:', perfJobStart);
    const perfJob = workflow.slice(perfJobStart, parityJobStart);

    expect(perfJobStart).toBeGreaterThan(-1);
    expect(perfJob).toContain('name: Perf Budget (${{ matrix.platform }})');
    expect(perfJob).toContain('runs-on: ${{ matrix.os }}');
    expect(perfJob).toContain('os: ubuntu-latest');
    expect(perfJob).toContain('platform: linux');
    expect(perfJob).toContain('os: macos-15');
    expect(perfJob).toContain('platform: macos');
    expect(perfJob).toContain('os: windows-latest');
    expect(perfJob).toContain('platform: windows');
    expect(perfJob).not.toContain('macos-latest');
    expect(perfJob).toContain('node scripts/bench.js --platform ${{ matrix.platform }} --runs 3 --warmup 1 --out perf-current.json');
    expect(perfJob).toContain('node scripts/check-perf.js --baseline perf-baseline.json --current perf-current.json --platform ${{ matrix.platform }} --warn-ratio 1.10 --fail-ratio 1.25');
  });
});

describe('Phase 42 oversight probes workflow', () => {
  test('oversight probes run on schedule, manual dispatch, and relevant pull request paths', () => {
    const workflow = readWorkflow('oversight-probes.yml');

    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('overlay/memory/oversight-principle-evidence-before-claim.md');
    expect(workflow).toContain('overlay/agents/gsd-oversight-execution.md');
    expect(workflow).toContain('overlay/agents/gsd-oversight-verification.md');
    expect(workflow).toContain('overlay/agents/gsd-oversight-planning.md');
    expect(workflow).toContain('scripts/verify-oversight-probes.js');
    expect(workflow).toContain('tests/verify-oversight-probes.test.js');
    expect(workflow).toContain('uses: oven-sh/setup-bun@v2');
    expect(workflow).toContain('node scripts/verify-oversight-probes.js');
  });
});

describe('Phase 42 cousin install workflow', () => {
  test('cousin install covers OS, Node, and package-manager matrix axes', () => {
    const workflow = readWorkflow('cousin-install.yml');

    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('os: [ubuntu-latest, macos-15, windows-latest]');
    expect(workflow).not.toContain('macos-latest');
    expect(workflow).toContain('node-version: [20, 22]');
    expect(workflow).toContain('package-manager: [npm, pnpm, bun]');
    expect(workflow).toContain('actions/setup-node@v6');
    expect(workflow).toContain('node-version: ${{ matrix.node-version }}');
    expect(workflow).toContain('corepack enable');
    expect(workflow).toContain('PNPM_VERSION: 10.17.1');
    expect(workflow).toContain('corepack prepare pnpm@${{ env.PNPM_VERSION }} --activate');
  });

  test('cousin install tests packed PR artifacts and published scheduled artifacts', () => {
    const workflow = readWorkflow('cousin-install.yml');

    expect(workflow).toContain('bun run dist');
    expect(workflow).toContain('npm pack --pack-destination "$RUNNER_TEMP"');
    expect(workflow).toContain('@chude/get-stuff-done@latest');
    expect(workflow).toContain('NODE_AUTH_TOKEN: ${{ secrets.NPM_READONLY_TOKEN }}');
    expect(workflow).toContain('scripts/cousin-smoke.js');
    expect(workflow).toContain('--package-manager "${{ matrix.package-manager }}"');
    expect(workflow).toContain('--temp-root "${{ runner.temp }}"');
    expect(workflow).toContain('--version --json');
  });
});

describe('Phase 42 docs gates workflow', () => {
  test('docs gate lints and link-checks tracked markdown with narrow exclusions', () => {
    const workflow = readCiWorkflow();
    const docsJobStart = workflow.indexOf('docs-gates:');
    const nextJobStart = workflow.indexOf('\n  osv-scanner:', docsJobStart);
    const docsJob = workflow.slice(docsJobStart, nextJobStart);

    expect(docsJobStart).toBeGreaterThan(-1);
    expect(docsJob).toContain('name: Docs Gates');
    expect(docsJob).toContain('uses: oven-sh/setup-bun@v2');
    expect(docsJob).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(docsJob).toContain('bun run lint:docs');
    expect(docsJob).toContain('lycheeverse/lychee-action@v2');
    expect(docsJob).toContain('--files-from .lychee-targets');
    expect(docsJob).toContain('ls-files "*.md"');
    expect(docsJob).not.toContain('**/*.md');
    expect(docsJob).toContain('node_modules/');
    expect(docsJob).toContain('dist/');
    expect(docsJob).toContain('.upstream/');
    expect(docsJob).toContain('overlay/get-shit-done/');
    expect(docsJob).not.toContain('.planning/');
    expect(docsJob).not.toContain('docs/');
  });
});

describe('Phase 43 upgrade verifier workflow', () => {
  test('upgrade verifier runs Verdaccio-backed upgrade verification on Linux and relevant triggers', () => {
    const workflow = readWorkflow('upgrade-verifier.yml');

    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('.planning/upstream-authority.json');
    expect(workflow).toContain('package.json');
    expect(workflow).toContain('bun.lock');
    expect(workflow).toContain('scripts/compose.js');
    expect(workflow).toContain('scripts/verify-upgrade.js');
    expect(workflow).toContain('bin/install.js');
    expect(workflow).toContain('overlay/**');
    expect(workflow).toContain('overrides/**');
    expect(workflow).toContain('runs-on: ubuntu-latest');
    expect(workflow).toContain('verdaccio/verdaccio:6');
    expect(workflow).toContain('4873:4873');
    expect(workflow).toContain('actions/setup-node@v6');
    expect(workflow).toContain('node-version: "22"');
    expect(workflow).toContain('oven-sh/setup-bun@v2');
    expect(workflow).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(workflow).toContain('bun run verify-upgrade --from 1.5.0 --to 1.6.1 --registry-url http://localhost:4873/ --json --report upgrade-report.json');
    expect(workflow).toContain('actions/upload-artifact@v7');
    expect(workflow).toContain('upgrade-report.json');
  });
});

describe('Phase 43 compat matrix workflow', () => {
  test('compat matrix validates vetted pins, runs report-only matrix, and uploads evidence', () => {
    const workflow = readWorkflow('compat-matrix.yml');

    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('.planning/vetted-upstream-versions.json');
    expect(workflow).toContain('.planning/upstream-authority.json');
    expect(workflow).toContain('package.json');
    expect(workflow).toContain('bun.lock');
    expect(workflow).toContain('scripts/run-compat-matrix.js');
    expect(workflow).toContain('scripts/run-upstream-compat*.js');
    expect(workflow).toContain('scripts/run-repository-compat.js');
    expect(workflow).toContain('tests/upstream-compat-contract.json');
    expect(workflow).toContain('tests/*.test.cjs');
    expect(workflow).toContain('tests/helpers.cjs');
    expect(workflow).toContain('tests/helpers/**');
    expect(workflow).toContain('overlay/**');
    expect(workflow).toContain('overrides/**');
    expect(workflow).toContain('actions/setup-node@v6');
    expect(workflow).toContain('node-version: "22"');
    expect(workflow).toContain('oven-sh/setup-bun@v2');
    expect(workflow).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(workflow).toContain('node scripts/vetted-upstream-versions.js --validate');
    expect(workflow).toContain('node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --json --report compat-matrix-report.json');
    expect(workflow).toContain('Compatibility matrix reported blocking drift; workflow remains informational per AF-7.');
    expect(workflow).toContain('exit 0');
    expect(workflow).not.toContain('continue-on-error: true');
    expect(workflow).toContain('actions/upload-artifact@v7');
    expect(workflow).toContain('compat-matrix-report.json');
    expect(workflow).toContain('if-no-files-found: error');
  });
});

describe('Phase 43 SBOM evidence workflow', () => {
  test('CI generates, verifies, and uploads dist/bom.json', () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain('bun run sbom');
    expect(workflow).toContain('dist/bom.json');
    expect(workflow).toContain('actions/upload-artifact@v7');
  });
});
