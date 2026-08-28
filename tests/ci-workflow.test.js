const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');
const CI_WORKFLOW = path.join(WORKFLOWS_DIR, 'ci.yml');
const ACTION_PINS = {
  cache: 'caa296126883cff596d87d8935842f9db880ef25',
  checkout: 'df4cb1c069e1874edd31b4311f1884172cec0e10',
  downloadArtifact: '3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c',
  githubScript: 'ed597411d8f924073f98dfc5c65a23a2325f34cd',
  gitleaks: 'e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e',
  hardenRunner: 'bf7454d06d71f1098171f2acdf0cd4708d7b5920',
  lychee: 'e7477775783ea5526144ba13e8db5eec57747ce8',
  setupNode: '249970729cb0ef3589644e2896645e5dc5ba9c38',
  setupBun: '0c5077e51419868618aeaa5fe8019c62421857d6',
  uploadArtifact: '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
};
const OSV_IMAGE = 'ghcr.io/google/osv-scanner-action';
const OSV_IMAGE_DIGEST = 'sha256:48406c58197201fe55e56615ad9d414f85063da320e204d0b0ed460fb3908dba';
const ACTION_TOKEN_DEFAULTS = new Map([
  ['actions/setup-node', 'token'],
  ['lycheeverse/lychee-action', 'token'],
  ['oven-sh/setup-bun', 'token'],
  ['step-security/harden-runner', 'token'],
]);

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

function workflowFiles() {
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter(fileName => fileName.endsWith('.yml') || fileName.endsWith('.yaml'))
    .sort();
}

function readPerfBudgetJob() {
  const workflow = readCiWorkflow();
  const start = workflow.indexOf('  perf-budget:');
  const end = workflow.indexOf('\n  parity:', start);
  return workflow.slice(start, end);
}

function findBareBunTestCommands(workflowText) {
  return workflowText
    .split('\n')
    .map(line => line.trim())
    .map(line => (line.startsWith('run:') ? line.slice('run:'.length).trim() : line))
    .filter(command => command === 'bun test' || command.startsWith('bun test '));
}

describe('bun per-test timeout is applied by flag, not env', () => {
  // bun ignores BUN_TEST_TIMEOUT. Verified on bun 1.3.5: a 7s test dies at 5000ms with the
  // env var set and passes with `--timeout 30000`. The env var lived in these workflows for
  // months while every test stayed capped at bun's 5s default, because verification checked
  // that the string was present in the YAML rather than that it had any effect.
  test('workflows running bun test pass --timeout explicitly', () => {
    for (const fileName of ['ci.yml', '10x-validation.yml']) {
      const workflow = readWorkflow(fileName);
      expect(workflow).toContain('--timeout 30000');
    }
  });

  test('no workflow reintroduces the ineffective BUN_TEST_TIMEOUT env var', () => {
    expect(readAllWorkflowText()).not.toContain('BUN_TEST_TIMEOUT:');
  });
});

describe('CI workflow security action contracts', () => {
  test('gitleaks receives the GitHub token required for pull request scans', () => {
    const workflow = readCiWorkflow();
    const gitleaksStepMarker = `uses: gitleaks/gitleaks-action@${ACTION_PINS.gitleaks}`;
    const gitleaksStep = workflow.slice(workflow.indexOf(gitleaksStepMarker));

    expect(workflow).toContain(gitleaksStepMarker);
    expect(workflow).not.toContain('uses: gitleaks/gitleaks-action@v2');
    expect(gitleaksStep).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
  });

  test('OSV scanner executes the reviewed container by immutable digest', () => {
    const workflow = readCiWorkflow();
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-toolchain-authority.json'), 'utf8')
    );

    expect(manifest.containers.pins[OSV_IMAGE].digest).toBe(OSV_IMAGE_DIGEST);
    expect(workflow).toContain(`uses: docker://${OSV_IMAGE}@${OSV_IMAGE_DIGEST}`);
    expect(workflow).not.toContain('google/osv-scanner-action/osv-scanner-action@');
  });

  test('suppresses automatic token defaults exposed by pinned action metadata', () => {
    for (const fileName of workflowFiles()) {
      const document = yaml.load(readWorkflow(fileName));
      for (const job of Object.values(document.jobs || {})) {
        for (const step of job.steps || []) {
          if (typeof step?.uses !== 'string') continue;
          const action = step.uses.slice(0, step.uses.lastIndexOf('@'));
          const tokenInput = ACTION_TOKEN_DEFAULTS.get(action);
          if (!tokenInput) continue;
          expect(step.with?.[tokenInput]).toBe('');
        }
      }
    }
  });

  test('first-party Node actions use reviewed Node 24-compatible commits', () => {
    const workflows = [
      'ci.yml',
      'compat-matrix.yml',
      'cousin-install.yml',
      'issue-proposal-maintenance.yml',
      'perf-baseline.yml',
    ]
      .map(readWorkflow)
      .join('\n');

    expect(workflows).toContain(`actions/setup-node@${ACTION_PINS.setupNode}`);
    expect(workflows).toContain(`actions/upload-artifact@${ACTION_PINS.uploadArtifact}`);
    expect(workflows).toContain(`actions/download-artifact@${ACTION_PINS.downloadArtifact}`);
    expect(workflows).toContain(`actions/github-script@${ACTION_PINS.githubScript}`);
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

describe('Phase 43 reproducible workflow toolchains', () => {
  const governedFiles = workflowFiles();

  test('all governed and historical workflow actions use reviewed immutable commits', () => {
    const actionAuthority = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-toolchain-authority.json'), 'utf8')
    ).githubActions.pins;
    const usages = governedFiles.flatMap(fileName =>
      [...readWorkflow(fileName).matchAll(/uses:\s+([^\s@]+)@([^\s#]+)/g)].map(match => ({
        fileName,
        action: match[1],
        ref: match[2],
      }))
    );

    expect(usages.length).toBeGreaterThan(0);
    for (const usage of usages) {
      if (usage.action.startsWith('docker://')) {
        expect(`${usage.action}@${usage.ref}`).toBe(`docker://${OSV_IMAGE}@${OSV_IMAGE_DIGEST}`);
        continue;
      }
      expect(usage.ref).toMatch(/^[0-9a-f]{40}$/);
      expect(usage.ref).toBe(actionAuthority[usage.action]?.sha);
    }
  });

  test('all governed Bun setup consumes the exact version file', () => {
    const workflows = governedFiles.map(readWorkflow).join('\n');
    const setupCount = workflows.split(`oven-sh/setup-bun@${ACTION_PINS.setupBun}`).length - 1;
    const versionFileCount = workflows.split('bun-version-file: .bun-version').length - 1;

    expect(setupCount).toBeGreaterThan(0);
    expect(versionFileCount).toBe(setupCount);
    expect(workflows).not.toContain('bun-version: latest');
  });

  test('pull request workflows cannot publish dependency caches for fork heads', () => {
    const trustedCacheCondition =
      "${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}";
    for (const fileName of ['ci.yml', 'compat-matrix.yml']) {
      const workflow = readWorkflow(fileName);
      const cacheSteps = [...workflow.matchAll(/- name: Cache bun dependencies[\s\S]*?(?=\n\s*- (?:name:|uses:|run:)|\n\s{2}\S|$)/g)];
      expect(cacheSteps.length).toBeGreaterThan(0);
      for (const [cacheStep] of cacheSteps) {
        expect(cacheStep).toContain(`if: ${trustedCacheCondition}`);
      }
    }
  });

  test('pins Verdaccio and keeps historical performance capture on reviewed Hyperfine', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-toolchain-authority.json'), 'utf8')
    );
    const upgrade = readWorkflow('upgrade-verifier.yml');
    const historical = readWorkflow('perf-baseline.yml');

    // Verdaccio is started by a docker run step (not services:) so it can load
    // the repository config that disables the npmjs uplink for @chude/* (#47).
    expect(upgrade).toContain(
      `verdaccio/verdaccio@${manifest.containers.pins['verdaccio/verdaccio'].digest}`
    );
    expect(upgrade).not.toContain('services:');
    expect(upgrade).toContain('.github/verdaccio/config.yaml');
    expect(historical).toContain('node scripts/install-hyperfine.js');
    for (const command of ['apt-get install', 'brew install', 'choco install']) {
      expect(historical).not.toContain(command);
    }
  });

  test('proposes GitHub Actions pin updates through Dependabot', () => {
    const dependabotPath = path.join(PROJECT_ROOT, '.github', 'dependabot.yml');

    expect(fs.existsSync(dependabotPath)).toBe(true);
    if (!fs.existsSync(dependabotPath)) return;
    const dependabot = fs.readFileSync(dependabotPath, 'utf8');
    expect(dependabot).toContain('package-ecosystem: "github-actions"');
    expect(dependabot).toContain('directory: "/"');
    expect(dependabot).toContain('interval: "weekly"');
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
      'bun run test:coverage:bun -- --timeout 30000 --reporter=junit --reporter-outfile test-results.xml'
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

describe('Phase 43 issue mutation boundary', () => {
  test('pull-request CI is read-only and emits issue proposal artifacts', () => {
    const workflow = readCiWorkflow();
    const header = workflow.slice(0, workflow.indexOf('\njobs:'));

    expect(header).toContain('permissions:\n  contents: read');
    expect(workflow).not.toContain('issues: write');
    expect(workflow).not.toContain('github.rest.issues.');
    expect(workflow).toContain('name: osv-issue-proposals-${{ github.run_id }}');
    expect(workflow).toContain('name: windows-flake-issue-proposals-${{ github.run_id }}');
    expect(workflow).toContain('osv-triage.json');
    expect(workflow).toContain('path: flake-events.json');
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
    expect(workflow).toContain(
      '--commit "${{ github.event_name == \'pull_request\' && github.event.pull_request.head.sha || github.sha }}"'
    );
    expect(workflow).not.toContain('--commit "${{ github.sha }}"');
  });

  test('scheduled flake maintenance is report-only', () => {
    const workflow = readWorkflow('flake-issue-maintenance.yml');

    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('issues: read');
    expect(workflow).not.toContain('issues: write');
    expect(workflow).not.toContain('github.rest.issues.createComment');
    expect(workflow).not.toContain('github.rest.issues.update');
    expect(workflow).toContain('flake-maintenance-proposals.json');
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
  });

  test('manual issue mutation defaults to preview and requires explicit apply confirmation', () => {
    const workflow = readWorkflow('issue-proposal-maintenance.yml');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toContain('pull_request:');
    expect(workflow).not.toContain('schedule:');
    expect(workflow).toContain('apply:');
    expect(workflow).toContain('type: boolean');
    expect(workflow).toContain('default: false');
    expect(workflow).toContain('confirmation:');
    expect(workflow).toContain("inputs.apply && inputs.confirmation == 'APPLY'");
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('<!-- gsd-osv:');
    expect(workflow).toContain('<!-- gsd-flake:');
    expect(workflow).toContain('github.rest.issues.update');
    expect(workflow).toContain('github.rest.issues.create');
    expect(workflow).not.toContain('github.rest.issues.createComment');
    expect(workflow).toContain(`actions/download-artifact@${ACTION_PINS.downloadArtifact}`);
    expect(workflow).toContain(`actions/github-script@${ACTION_PINS.githubScript}`);
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

describe('Phase 43 paired performance workflow', () => {
  test('limits blocking authority to same-repository pull request heads', () => {
    const perfJob = readPerfBudgetJob();

    expect(perfJob).toContain(
      "if: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository }}"
    );
    expect(perfJob).toContain('name: Perf Budget (${{ matrix.platform }})');
    expect(perfJob).toContain('runs-on: ${{ matrix.os }}');
    expect(perfJob).toContain('os: ubuntu-latest');
    expect(perfJob).toContain('platform: linux');
    expect(perfJob).toContain('os: macos-15');
    expect(perfJob).toContain('platform: macos');
    expect(perfJob).toContain('os: windows-latest');
    expect(perfJob).toContain('platform: windows');
    expect(perfJob).not.toContain('macos-latest');
    expect(perfJob).not.toContain('pull_request_target');
    expect(perfJob).not.toContain('self-hosted');
    expect(perfJob).not.toContain('secrets.');
    for (const permission of ['contents: write', 'issues: write', 'actions: write', 'pull-requests: write']) {
      expect(perfJob).not.toContain(permission);
    }
    expect(perfJob).not.toContain('actions/cache@');
  });

  test('verifies all four immutable subjects and preflights their authority files', () => {
    const perfJob = readPerfBudgetJob();

    expect(perfJob.split(`actions/checkout@${ACTION_PINS.checkout}`).length - 1).toBe(4);
    expect(perfJob.match(/persist-credentials: false/g)).toHaveLength(4);
    expect(perfJob.match(/fetch-depth: 1/g)).toHaveLength(4);
    for (const expected of [
      'name: Checkout trusted bootstrap',
      'name: Verify trusted bootstrap',
      'ref: 5c813db4d8a17bd2dbf7523e016a5152a6a0c3ce',
      'path: authority-bootstrap',
      'name: Checkout trusted measurement harness',
      'name: Verify trusted measurement harness',
      'ref: 32dc22f9dc9cfd7d84333256f0768f5a792b186c',
      'path: measurement-harness',
      'name: Checkout exact pull request base',
      'name: Verify exact pull request base',
      'repository: ${{ github.event.pull_request.base.repo.full_name }}',
      'ref: ${{ github.event.pull_request.base.sha }}',
      'path: reference',
      'name: Checkout exact pull request head',
      'name: Verify exact pull request head',
      'repository: ${{ github.event.pull_request.head.repo.full_name }}',
      'ref: ${{ github.event.pull_request.head.sha }}',
      'path: candidate',
    ]) {
      expect(perfJob).toContain(expected);
    }
    expect(perfJob).toContain('for subject in authority-bootstrap measurement-harness reference candidate; do');
    expect(perfJob).toContain("for required in package.json bun.lock .planning/upstream-authority.json; do");
    expect(perfJob.indexOf('name: Preflight paired authority files')).toBeLessThan(
      perfJob.indexOf('name: Install reviewed Hyperfine')
    );
    expect(perfJob).toContain('cp authority-bootstrap/.bun-version .bun-version');
    expect(perfJob).not.toContain('cp candidate/.bun-version');
  });

  test('uses only trusted paired controls and uploads one closed evidence bundle', () => {
    const perfJob = readPerfBudgetJob();

    expect(perfJob).toContain(`actions/setup-node@${ACTION_PINS.setupNode}`);
    expect(perfJob).toContain('node-version: "22"');
    expect(perfJob).toContain(`oven-sh/setup-bun@${ACTION_PINS.setupBun}`);
    expect(perfJob).toContain('bun-version-file: .bun-version');
    expect(perfJob).toContain('node authority-bootstrap/scripts/install-hyperfine.js');
    expect(perfJob).not.toContain('apt-get');
    expect(perfJob).not.toContain('brew install');
    expect(perfJob).not.toContain('choco install');
    expect(perfJob.match(/bun install --frozen-lockfile --ignore-scripts/g)).toHaveLength(1);
    expect(perfJob).toContain('working-directory: measurement-harness');
    expect(perfJob).toContain('node measurement-harness/scripts/bench.js');
    expect(perfJob).toContain('--paired');
    expect(perfJob).toContain('--reference-worktree "$GITHUB_WORKSPACE/reference"');
    expect(perfJob).toContain('--candidate-worktree "$GITHUB_WORKSPACE/candidate"');
    expect(perfJob).toContain('--pairs 10');
    expect(perfJob).toContain('--warmup 3');
    expect(perfJob).toContain('node measurement-harness/scripts/check-perf.js');
    expect(perfJob).toContain('--comparison "$GITHUB_WORKSPACE/evidence-bundle/comparison.json"');
    // Acceptance policy is read from the candidate checkout so every acceptance
    // is a reviewable PR diff, while the adjudicating code stays pinned.
    expect(perfJob).toContain('--accepted "$GITHUB_WORKSPACE/candidate/config/perf-accepted-regressions.json"');
    expect(perfJob).not.toContain('--baseline');
    expect(perfJob).not.toContain('--current');
    expect(perfJob).not.toContain('--warn-ratio');
    expect(perfJob).not.toContain('--fail-ratio');

    expect(perfJob).toContain('candidate/scripts/emit-hosted-runtime-receipt.js');
    // The staged file subset must carry hosted-evidence-binding's whole
    // relative require graph or the Tier B step dies at runtime with
    // MODULE_NOT_FOUND (first seen 2026-08-28 when the Enforce step stopped
    // failing ahead of it). Derived from the source, not restated.
    const bindingSource = fs.readFileSync(
      path.join(PROJECT_ROOT, 'scripts', 'lib', 'hosted-evidence-binding.js'), 'utf8');
    const relativeRequires = [...bindingSource.matchAll(/require\('\.\/([\w-]+)'\)/g)]
      .map(match => match[1]);
    expect(relativeRequires.length).toBeGreaterThan(0);
    for (const moduleName of relativeRequires) {
      expect(perfJob).toContain(
        `cp candidate/scripts/lib/${moduleName}.js evidence-producer/scripts/lib/`);
    }
    expect(perfJob).toContain('candidate/scripts/emit-paired-binding-manifest.js');
    expect(perfJob).toContain('node evidence-producer/scripts/emit-hosted-runtime-receipt.js');
    expect(perfJob).toContain('node evidence-producer/scripts/emit-paired-binding-manifest.js');
    expect(perfJob).toContain('--tool hyperfine');
    expect(perfJob).toContain(`actions/upload-artifact@${ACTION_PINS.uploadArtifact}`);
    expect(perfJob.match(/actions\/upload-artifact@/g)).toHaveLength(1);
    expect(perfJob).toContain('name: paired-performance-ci-perf-${{ matrix.platform }}');
    for (const file of [
      'evidence-producer/artifacts/comparison.json',
      'evidence-producer/artifacts/runtime-receipt.json',
      'evidence-producer/artifacts/binding-manifest.json',
    ]) {
      expect(perfJob).toContain(file);
    }
    expect(perfJob).toContain('if-no-files-found: error');
    expect(perfJob).toContain('overwrite: false');
    expect(perfJob.indexOf('name: Enforce paired performance budget')).toBeLessThan(
      perfJob.indexOf('name: Stage bounded evidence producer')
    );
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
    expect(workflow).toContain(`uses: oven-sh/setup-bun@${ACTION_PINS.setupBun}`);
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
    expect(workflow).toContain(`actions/setup-node@${ACTION_PINS.setupNode}`);
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
    expect(workflow).not.toContain('NPM_READONLY_TOKEN');
    expect(workflow).not.toContain('secrets.');
    expect(workflow).toContain('scripts/cousin-smoke.js');
    expect(workflow).toContain('--package-manager "${{ matrix.package-manager }}"');
    expect(workflow).toContain('--temp-root "${{ runner.temp }}"');
    expect(workflow).toContain('--version --json');
  });

  test('cousin install binds every runtime row to exact subject and immutable receipt transport', () => {
    const workflow = readWorkflow('cousin-install.yml');

    expect(workflow).toContain(`actions/checkout@${ACTION_PINS.checkout}`);
    expect(workflow).toContain('name: Checkout exact event subject');
    expect(workflow).toContain(
      "repository: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name || github.repository }}"
    );
    expect(workflow).toContain(
      "ref: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}"
    );
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('name: Verify execution subject');
    expect(workflow).toContain('actual="$(git -C "$GSD_SUBJECT_PATH" rev-parse HEAD)"');
    expect(workflow).toContain(`oven-sh/setup-bun@${ACTION_PINS.setupBun}`);
    expect(workflow).toContain('bun-version-file: .bun-version');
    expect(workflow).not.toContain('bun-version: latest');
    expect(workflow).toContain('node scripts/emit-hosted-runtime-receipt.js');
    expect(workflow).toContain(
      '--subject "cousin-${{ matrix.os }}-node-${{ matrix.node-version }}-${{ matrix.package-manager }}"'
    );
    expect(workflow).toContain('--output "artifacts/runtime-receipt.json"');
    expect(workflow).toContain(`actions/upload-artifact@${ACTION_PINS.uploadArtifact}`);
    expect(workflow).toContain(
      'name: runtime-receipt-cousin-${{ matrix.os }}-node-${{ matrix.node-version }}-${{ matrix.package-manager }}'
    );
    expect(workflow).toContain('path: artifacts/runtime-receipt.json');
    expect(workflow).toContain('if-no-files-found: error');
    expect(workflow).toContain('overwrite: false');
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
    expect(docsJob).toContain(`uses: oven-sh/setup-bun@${ACTION_PINS.setupBun}`);
    expect(docsJob).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(docsJob).toContain('bun run lint:docs');
    expect(docsJob).toContain(`lycheeverse/lychee-action@${ACTION_PINS.lychee}`);
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
    expect(workflow).toContain(
      'verdaccio/verdaccio@sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a'
    );
    expect(workflow).toContain('4873:4873');
    expect(workflow).toContain(`actions/setup-node@${ACTION_PINS.setupNode}`);
    expect(workflow).toContain('node-version: "22"');
    expect(workflow).toContain(`oven-sh/setup-bun@${ACTION_PINS.setupBun}`);
    expect(workflow).toContain('bun install --frozen-lockfile --ignore-scripts');
    // verify-upgrade fails with exitClassification "source_pin_mismatch" unless --from equals
    // the upstream pin in the checkout, so --from is derived from package.json rather than
    // written as a literal. The previous literal asserted the command matched itself, which is
    // why the pin bump in 689fa9eb moved the pin to 1.6.1 while the workflow kept sending
    // --from 1.5.0, and every upgrade-verifier run failed for weeks without this gate noticing.
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    const upstreamPin = pkg.devDependencies['@opengsd/gsd-core'];
    expect(upstreamPin).toMatch(/^\d+\.\d+\.\d+$/);
    expect(workflow).toContain(`bun run verify-upgrade --from ${upstreamPin} --to `);
    // The verifier packs the current package with the checkout's dist/, and
    // the real installer refuses a tarball without it - compose must run
    // before the verifier does.
    expect(workflow.indexOf('bun run compose')).toBeGreaterThan(-1);
    expect(workflow.indexOf('bun run compose'))
      .toBeLessThan(workflow.indexOf('bun run verify-upgrade'));
    expect(workflow).toContain('--registry-url http://localhost:4873/ --json --report upgrade-report.json');
    expect(workflow).toContain(`actions/upload-artifact@${ACTION_PINS.uploadArtifact}`);
    expect(workflow).toContain('upgrade-report.json');
  });
});

describe('Phase 43 compat matrix workflow', () => {
  test('compat matrix blocks on the active pin while retaining historical evidence', () => {
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
    expect(workflow).toContain(`actions/setup-node@${ACTION_PINS.setupNode}`);
    expect(workflow).toContain('node-version: "22"');
    expect(workflow).toContain(`oven-sh/setup-bun@${ACTION_PINS.setupBun}`);
    expect(workflow).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(workflow).toContain('node scripts/vetted-upstream-versions.js --validate');
    expect(workflow).toContain('node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --json --report compat-matrix-report.json');
    expect(workflow).not.toContain('Compatibility matrix reported blocking drift; workflow remains informational per AF-7.');
    expect(workflow).not.toContain('set +e');
    expect(workflow).not.toContain('exit 0');
    expect(workflow).not.toContain('continue-on-error: true');
    expect(workflow).toContain(`actions/upload-artifact@${ACTION_PINS.uploadArtifact}`);
    expect(workflow).toContain('compat-matrix-report.json');
    expect(workflow).toContain('if-no-files-found: error');
  });
});

describe('Phase 43 SBOM evidence workflow', () => {
  test('CI generates, verifies, and uploads dist/bom.json', () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain('bun run sbom');
    expect(workflow).toContain('dist/bom.json');
    expect(workflow).toContain(`actions/upload-artifact@${ACTION_PINS.uploadArtifact}`);
  });
});
