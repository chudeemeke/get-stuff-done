'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const { spawnSync } = require('child_process');
const { randomUUID } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createTierBRuntimeReceipt,
  defaultRunVersion,
  main,
  parseArgs,
  publishReceiptCreateOnly,
} = require('../scripts/emit-hosted-runtime-receipt');
const { validateTierBRuntimeReceipt } = require('../scripts/verify-hosted-ci');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'config', 'phase43-hosted-ci-contract.json'), 'utf8')
);
const CONTAINER_DIGEST =
  'sha256:bcd0dc5f10d0b9cca5a21b1f4fb3b08c6d90978bc87b8b46402abb271e0d573a';

function runtimeDependencies(overrides = {}) {
  return {
    platform: () => 'linux',
    release: () => '6.11.0',
    version: () => 'fixture-version',
    architecture: () => 'x64',
    nodeVersion: () => '22.18.0',
    runVersion(command, args) {
      expect(args).toEqual(['--version']);
      if (command === 'bun') return '1.3.5';
      if (command === 'hyperfine') return 'hyperfine 1.20.0';
      throw new Error('unexpected command');
    },
    ...overrides,
  };
}

function receiptOptions(overrides = {}) {
  return {
    schemaVersion: 2,
    subject: 'ci-perf-linux',
    event: 'pull_request',
    runId: 100,
    attempt: 1,
    hostedImageName: 'ubuntu24',
    hostedImageVersion: '20250720.1.0',
    tools: ['hyperfine'],
    containers: { 'verdaccio/verdaccio': CONTAINER_DIGEST },
    ...overrides,
  };
}

describe('hosted Tier B runtime receipt', () => {
  test('keeps the hosted producer independent from uninstalled verifier dependencies', () => {
    const source = fs.readFileSync(
      path.join(PROJECT_ROOT, 'scripts', 'emit-hosted-runtime-receipt.js'),
      'utf8'
    );

    expect(source).not.toContain("require('./verify-hosted-ci')");
    expect(source).not.toContain("require('./verify-toolchain-authority')");
    expect(source).toContain("require('./lib/hosted-evidence-binding')");
  });

  test('emits only bounded runner observation and runtime claims', () => {
    const receipt = createTierBRuntimeReceipt(receiptOptions(), runtimeDependencies());

    expect(validateTierBRuntimeReceipt(receipt, CONTRACT)).toBe(receipt);
    expect(receipt).toEqual({
      schemaVersion: 2,
      subject: 'ci-perf-linux',
      event: 'pull_request',
      runId: 100,
      attempt: 1,
      os: 'linux',
      osVersion: '6.11.0',
      architecture: 'x64',
      runnerImage: 'linux:6.11.0:fixture-version',
      hostedImageName: 'ubuntu24',
      hostedImageVersion: '20250720.1.0',
      nodeVersion: '22.18.0',
      bunVersion: '1.3.5',
      tools: { hyperfine: '1.20.0' },
      containers: { 'verdaccio/verdaccio': CONTAINER_DIGEST },
    });
    for (const forbidden of [
      'jobId',
      'job',
      'runnerId',
      'runnerName',
      'runnerGroupId',
      'runnerGroupName',
      'runnerLabels',
    ]) {
      expect(receipt).not.toHaveProperty(forbidden);
    }
  });

  test('fails closed on malformed claims, duplicate tools, and unresolved versions', () => {
    const cases = [
      [receiptOptions({ subject: '../unsafe' }), runtimeDependencies()],
      [receiptOptions({ event: 'pull_request_target' }), runtimeDependencies()],
      [receiptOptions({ tools: ['hyperfine', 'hyperfine'] }), runtimeDependencies()],
      [receiptOptions(), runtimeDependencies({ nodeVersion: () => '22' })],
      [receiptOptions(), runtimeDependencies({ runVersion: () => 'latest' })],
      [receiptOptions({ hostedImageName: 'ubuntu24', hostedImageVersion: null }), runtimeDependencies()],
    ];

    for (const [options, dependencies] of cases) {
      expect(() => createTierBRuntimeReceipt(options, dependencies)).toThrow();
    }
  });

  test('accepts only reviewed runtime tools and supported runner platforms', () => {
    for (const [platform, expected] of [
      ['darwin', 'macos'],
      ['win32', 'windows'],
      ['linux', 'linux'],
    ]) {
      const receipt = createTierBRuntimeReceipt(
        receiptOptions({ tools: [], containers: undefined }),
        runtimeDependencies({ platform: () => platform })
      );
      expect(receipt.os).toBe(expected);
      expect(receipt.runnerImage.startsWith(`${expected}:6.11.0:`)).toBe(true);
      expect(receipt.containers).toEqual({});
    }

    for (const tools of [
      ['bun'],
      ['git'],
      ['bad tool'],
      [1],
      Array.from({ length: 21 }, (_, index) => `tool-${index}`),
    ]) {
      expect(() =>
        createTierBRuntimeReceipt(receiptOptions({ tools }), runtimeDependencies())
      ).toThrow('runtime tool authority');
    }
    expect(() =>
      createTierBRuntimeReceipt(
        receiptOptions({ tools: [] }),
        runtimeDependencies({ platform: () => 'freebsd' })
      )
    ).toThrow('Tier B runtime receipt authority');
  });

  test('defaults optional claims and fails closed on invalid options and probe output', () => {
    const receipt = createTierBRuntimeReceipt(
      receiptOptions({
        hostedImageName: undefined,
        hostedImageVersion: undefined,
        tools: undefined,
        containers: undefined,
      }),
      runtimeDependencies()
    );
    expect(receipt.hostedImageName).toBe(null);
    expect(receipt.hostedImageVersion).toBe(null);
    expect(receipt.tools).toEqual({});
    expect(receipt.containers).toEqual({});

    for (const options of [null, [], 'invalid']) {
      expect(() => createTierBRuntimeReceipt(options, runtimeDependencies())).toThrow(
        'options are invalid'
      );
    }
    for (const output of [null, 'other 1.20.0', 'hyperfine version 1.20.0', 'hyperfine latest']) {
      expect(() =>
        createTierBRuntimeReceipt(
          receiptOptions(),
          runtimeDependencies({
            runVersion(command) {
              return command === 'bun' ? '1.3.5' : output;
            },
          })
        )
      ).toThrow();
    }
  });

  test('runs version probes without a shell or inherited unrelated environment', () => {
    const secretKey = `GSD_RUNTIME_SECRET_${randomUUID().replaceAll('-', '')}`;
    process.env[secretKey] = 'must-not-reach-child';
    try {
      const output = defaultRunVersion('node', [
        '-e',
        `if (Object.hasOwn(process.env, ${JSON.stringify(secretKey)})) process.exit(9); process.stdout.write('tool 1.2.3');`,
      ]);
      expect(output).toBe('tool 1.2.3');
      expect(defaultRunVersion('node', ['-e', ''])).toBe('');
      expect(() =>
        defaultRunVersion('node', ['-e', 'process.exit(7)'])
      ).toThrow('Runtime version probe failed');
      expect(() =>
        defaultRunVersion(`missing-runtime-${randomUUID()}`, ['--version'])
      ).toThrow();
    } finally {
      delete process.env[secretKey];
    }
  });

  test('parses a closed repeatable CLI without reading arbitrary environment', () => {
    expect(
      parseArgs([
        '--',
        '--subject',
        'ci-perf-linux',
        '--output',
        'artifacts/runtime.json',
        '--tool',
        'hyperfine',
        '--container',
        `verdaccio/verdaccio=${CONTAINER_DIGEST}`,
      ])
    ).toEqual({
      subject: 'ci-perf-linux',
      output: 'artifacts/runtime.json',
      tools: ['hyperfine'],
      containers: { 'verdaccio/verdaccio': CONTAINER_DIGEST },
    });
    expect(parseArgs(['--help'])).toEqual({ help: true });
    expect(parseArgs(['-h'])).toEqual({ help: true });
    expect(() => parseArgs(['--subject', 'one'])).toThrow('requires --subject and --output');
    expect(() => parseArgs(['--subject', 'one', '--output', 'x', '--unknown', 'value'])).toThrow(
      'Unknown or incomplete'
    );
    for (const args of [
      ['--subject'],
      ['--subject', '--output'],
      ['--subject', 'one', '--subject', 'two', '--output', 'x'],
      ['--subject', 'one', '--output', 'x', '--output', 'y'],
      ['--subject', 'one', '--output', 'x', '--container', 'invalid'],
      [
        '--subject',
        'one',
        '--output',
        'x',
        '--container',
        `verdaccio/verdaccio=${CONTAINER_DIGEST}`,
        '--container',
        `verdaccio/verdaccio=${CONTAINER_DIGEST}`,
      ],
    ]) {
      expect(() => parseArgs(args)).toThrow();
    }
  });

  test('publishes one create-only receipt inside the project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-runtime-receipt-'));
    try {
      const receipt = createTierBRuntimeReceipt(receiptOptions(), runtimeDependencies());
      const output = publishReceiptCreateOnly(root, 'artifacts/runtime.json', receipt);
      expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual(receipt);
      expect(() => publishReceiptCreateOnly(root, 'artifacts/runtime.json', receipt)).toThrow(
        'already exists'
      );
      expect(() => publishReceiptCreateOnly(root, '../outside.json', receipt)).toThrow(
        'inside the project root'
      );
      for (const invalidPath of [
        null,
        '',
        'a'.repeat(501),
        'nested\\runtime.json',
        '/absolute.json',
        'nested//runtime.json',
        'nested/./runtime.json',
        'nested/../runtime.json',
      ]) {
        expect(() => publishReceiptCreateOnly(root, invalidPath, receipt)).toThrow(
          'inside the project root'
        );
      }

      fs.writeFileSync(path.join(root, 'not-a-directory'), 'fixture');
      expect(() =>
        publishReceiptCreateOnly(root, 'not-a-directory/runtime.json', receipt)
      ).toThrow('linked path');

      const originalLstat = fs.lstatSync;
      fs.mkdirSync(path.join(root, 'linked-fixture'));
      try {
        fs.lstatSync = () => ({ isSymbolicLink: () => true, isDirectory: () => true });
        expect(() =>
          publishReceiptCreateOnly(root, 'linked-fixture/runtime.json', receipt)
        ).toThrow('linked path');
      } finally {
        fs.lstatSync = originalLstat;
      }

      const originalLink = fs.linkSync;
      try {
        fs.linkSync = () => {
          const error = new Error('simulated hard-link failure');
          error.code = 'EPERM';
          throw error;
        };
        expect(() => publishReceiptCreateOnly(root, 'artifacts/link-failure.json', receipt)).toThrow(
          'simulated hard-link failure'
        );
        expect(
          fs.readdirSync(path.join(root, 'artifacts')).some(name => name.endsWith('.tmp'))
        ).toBe(false);
      } finally {
        fs.linkSync = originalLink;
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('executes the real CLI with default adapters and bounded output', () => {
    const script = path.join(PROJECT_ROOT, 'scripts', 'emit-hosted-runtime-receipt.js');
    const relativeOutput = `coverage/runtime-receipt-${randomUUID()}.json`;
    const absoluteOutput = path.join(PROJECT_ROOT, ...relativeOutput.split('/'));
    const env = {
      ...process.env,
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_RUN_ID: '100',
      GITHUB_RUN_ATTEMPT: '1',
      ImageOS: 'ubuntu24',
      ImageVersion: '20250720.1.0',
    };
    try {
      const result = spawnSync(
        'node',
        [script, '--subject', 'ci-runtime-defaults', '--output', relativeOutput],
        { cwd: PROJECT_ROOT, encoding: 'utf8', env, shell: false, windowsHide: true }
      );
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(JSON.parse(fs.readFileSync(absoluteOutput, 'utf8')).subject).toBe(
        'ci-runtime-defaults'
      );

      const help = spawnSync('node', [script, '--help'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        env,
        shell: false,
        windowsHide: true,
      });
      expect(help.status).toBe(0);
      expect(help.stdout).toContain('Emits one create-only Tier B hosted runtime receipt.');

      const failure = spawnSync('node', [script, '--unknown'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        env,
        shell: false,
        windowsHide: true,
      });
      expect(failure.status).toBe(1);
      expect(failure.stderr).toBe('Hosted runtime receipt failed.\n');
    } finally {
      if (fs.existsSync(absoluteOutput)) fs.unlinkSync(absoluteOutput);
    }
  });

  test('CLI uses allowlisted hosted variables and sanitizes failures', () => {
    const writes = [];
    const output = [];
    const code = main(
      ['--subject', 'ci-perf-linux', '--output', 'artifacts/runtime.json', '--tool', 'hyperfine'],
      {
        env: {
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_RUN_ID: '100',
          GITHUB_RUN_ATTEMPT: '1',
          ImageOS: 'ubuntu24',
          ImageVersion: '20250720.1.0',
          SECRET_VALUE: 'must-not-leak',
        },
        createReceipt: options => {
          expect(options).not.toHaveProperty('SECRET_VALUE');
          return { schemaVersion: 2, subject: options.subject };
        },
        publishReceipt(projectRoot, filePath, receipt) {
          writes.push({ projectRoot, filePath, receipt });
          return path.join(projectRoot, filePath);
        },
        projectRoot: PROJECT_ROOT,
        stdout: { write: value => output.push(value) },
        stderr: { write() {} },
      }
    );
    expect(code).toBe(0);
    expect(writes).toHaveLength(1);
    expect(output.join('')).toContain('"subject":"ci-perf-linux"');

    const errors = [];
    expect(
      main(['--subject', 'x', '--output', 'x.json'], {
        createReceipt: () => {
          throw new Error('unsafe\nsecret-value');
        },
        stderr: { write: value => errors.push(value) },
        stdout: { write() {} },
      })
    ).toBe(1);
    expect(errors.join('')).toBe('Hosted runtime receipt failed.\n');
    expect(errors.join('')).not.toContain('secret-value');

    const helpOutput = [];
    expect(
      main(['--help'], {
        stdout: { write: value => helpOutput.push(value) },
        stderr: { write() {} },
      })
    ).toBe(0);
    expect(helpOutput.join('')).toContain('Usage:');
  });
});
