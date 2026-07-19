'use strict';

const { describe, test, expect } = require('./helpers/portable-test-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const JSON5 = require('json5');

const {
  buildCycloneDxArgs,
  buildCycloneDxEnv,
  findCycloneDxExecutable,
  generateSbom,
  main: mainSbom,
  validateBom,
} = require('../scripts/generate-sbom');

const PACKAGE_MANIFEST = {
  name: '@chude/get-stuff-done',
  version: '3.0.2',
};

function validBom(overrides = {}) {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    version: 1,
    metadata: {
      component: {
        type: 'application',
        group: '@chude',
        name: 'get-stuff-done',
        version: '3.0.2',
      },
    },
    ...overrides,
  };
}

function withFixture(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-sbom-'));
  const distDir = path.join(projectRoot, 'dist');
  const binDir = path.join(projectRoot, 'node_modules', '.bin');
  const executable = path.join(
    binDir,
    process.platform === 'win32' ? 'cyclonedx-npm.exe' : 'cyclonedx-npm'
  );
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(PACKAGE_MANIFEST));
  fs.writeFileSync(executable, 'fixture');

  try {
    return run({ projectRoot, distDir, executable });
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

describe('CycloneDX dependency authority', () => {
  test('exact-pins CycloneDX 6 in package.json and the sole Bun lock', () => {
    const packageJson = require('../package.json');
    const lock = JSON5.parse(
      fs.readFileSync(path.join(__dirname, '..', 'bun.lock'), 'utf-8')
    );

    expect(packageJson.devDependencies['@cyclonedx/cyclonedx-npm']).toBe('6.0.0');
    expect(lock.workspaces[''].devDependencies['@cyclonedx/cyclonedx-npm']).toBe(
      '6.0.0'
    );
    expect(lock.packages['@cyclonedx/cyclonedx-npm'][0]).toBe(
      '@cyclonedx/cyclonedx-npm@6.0.0'
    );
    expect(fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))).toBe(false);
  });
});

describe('CycloneDX generator port', () => {
  test('selects only a direct local executable and never falls back to bunx', () => {
    const windowsBase = 'C:\\repo\\node_modules\\.bin\\cyclonedx-npm';
    expect(
      findCycloneDxExecutable({
        projectRoot: 'C:\\repo',
        platform: 'win32',
        existsSync: candidate => candidate === `${windowsBase}.bunx`,
      })
    ).toEqual({ command: `${windowsBase}.bunx`, prefixArgs: [] });

    expect(() =>
      findCycloneDxExecutable({
        projectRoot: '/repo',
        platform: 'linux',
        existsSync: () => false,
      })
    ).toThrow('local CycloneDX executable was not found');

    expect(findCycloneDxExecutable().command).toContain('cyclonedx-npm');
  });

  test('builds the reviewed CycloneDX 6 reproducible validation arguments', () => {
    expect(buildCycloneDxArgs('/repo/dist/bom.json')).toEqual([
      'package.json',
      '--ignore-npm-errors',
      '--output-format',
      'JSON',
      '--output-file',
      '/repo/dist/bom.json',
      '--output-reproducible',
      '--validate',
      '--mc-type',
      'application',
    ]);
  });

  test('removes npm launcher identity while preserving unrelated environment', () => {
    expect(
      buildCycloneDxEnv({
        npm_config_user_agent: 'npm',
        npm_execpath: '/npm',
        npm_node_execpath: '/node',
        PATH: '/bin',
      })
    ).toEqual({ PATH: '/bin' });
  });

  test('invokes the local binary without a shell and validates package identity', () => {
    withFixture(({ projectRoot, executable }) => {
      const outputFile = path.join(projectRoot, 'dist', 'bom.json');
      const calls = [];
      const result = generateSbom({
        projectRoot,
        outputFile,
        env: { PATH: 'fixture-path', npm_execpath: 'remove-me' },
        spawnSync: (command, args, options) => {
          calls.push({ command, args, options });
          fs.writeFileSync(outputFile, JSON.stringify(validBom()));
          return { status: 0, stdout: '', stderr: '' };
        },
      });

      expect(result.outputFile).toBe(outputFile);
      expect(result.bom.metadata.component.name).toBe('get-stuff-done');
      expect(calls).toHaveLength(1);
      expect(calls[0].command).toBe(executable);
      expect(calls[0].args).toEqual(buildCycloneDxArgs(outputFile));
      expect(calls[0].options).toEqual(
        expect.objectContaining({
          cwd: projectRoot,
          env: { PATH: 'fixture-path' },
          shell: false,
        })
      );
    });
  });

  test('fails before invocation when dist or the local executable is absent', () => {
    const missingDistRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-sbom-'));
    try {
      expect(() => generateSbom({ projectRoot: missingDistRoot })).toThrow(
        'dist/ not found'
      );
    } finally {
      fs.rmSync(missingDistRoot, { recursive: true, force: true });
    }

    withFixture(({ projectRoot, executable }) => {
      fs.rmSync(executable);
      expect(() => generateSbom({ projectRoot })).toThrow(
        'local CycloneDX executable was not found'
      );
    });
  });

  test('fails closed on child errors without exposing child output', () => {
    withFixture(({ projectRoot }) => {
      const execute = () =>
        generateSbom({
          projectRoot,
          spawnSync: () => ({
            status: null,
            error: new Error('spawn failed'),
            stdout: 'sensitive stdout',
            stderr: 'sensitive stderr',
          }),
        });

      expect(execute).toThrow('CycloneDX SBOM generation failed');
      expect(execute).not.toThrow('sensitive stderr');

      expect(() =>
        generateSbom({ projectRoot, spawnSync: () => ({ status: 2 }) })
      ).toThrow('exit 2');
    });
  });

  test('rejects malformed SBOM metadata and mismatched root package identity', () => {
    withFixture(({ projectRoot }) => {
      const outputFile = path.join(projectRoot, 'dist', 'bom.json');
      fs.writeFileSync(outputFile, JSON.stringify(validBom({ specVersion: undefined })));
      expect(() => validateBom(outputFile, { projectRoot })).toThrow(
        'SBOM specification version'
      );

      fs.writeFileSync(
        outputFile,
        JSON.stringify(
          validBom({
            metadata: {
              component: {
                type: 'application',
                group: '@chude',
                name: 'wrong-package',
                version: '3.0.2',
              },
            },
          })
        )
      );
      expect(() => validateBom(outputFile, { projectRoot })).toThrow(
        'SBOM root component does not match package.json'
      );

      fs.writeFileSync(outputFile, '{');
      expect(() => validateBom(outputFile, { projectRoot })).toThrow('not valid JSON');

      fs.writeFileSync(outputFile, JSON.stringify(validBom({ bomFormat: undefined })));
      expect(() => validateBom(outputFile, { projectRoot })).toThrow(
        'Unexpected SBOM format: (missing)'
      );

      fs.writeFileSync(outputFile, JSON.stringify(validBom({ version: 0 })));
      expect(() => validateBom(outputFile, { projectRoot })).toThrow(
        'positive integer'
      );
    });
  });

  test('validates an unscoped package identity through an injected manifest', () => {
    withFixture(({ projectRoot }) => {
      const outputFile = path.join(projectRoot, 'dist', 'bom.json');
      const bom = validBom({
        metadata: {
          component: {
            type: 'application',
            name: 'plain-package',
            version: '1.0.0',
          },
        },
      });
      fs.writeFileSync(outputFile, JSON.stringify(bom));

      expect(
        validateBom(outputFile, {
          packageManifest: { name: 'plain-package', version: '1.0.0' },
        })
      ).toEqual(bom);

      expect(() =>
        validateBom(outputFile, { packageManifest: {} })
      ).toThrow('package.json identity is invalid');
    });
  });

  test('rejects output paths outside the project dist directory', () => {
    withFixture(({ projectRoot }) => {
      expect(() =>
        generateSbom({
          projectRoot,
          outputFile: path.join(projectRoot, 'outside.json'),
          spawnSync: () => ({ status: 0 }),
        })
      ).toThrow('must remain inside');
    });
  });

  test('produces byte-identical output for repeated identical invocations', () => {
    withFixture(({ projectRoot }) => {
      const outputFile = path.join(projectRoot, 'dist', 'bom.json');
      const spawnSync = () => {
        fs.writeFileSync(outputFile, `${JSON.stringify(validBom(), null, 2)}\n`);
        return { status: 0, stdout: '', stderr: '' };
      };

      generateSbom({ projectRoot, spawnSync });
      const first = fs.readFileSync(outputFile);
      generateSbom({ projectRoot, spawnSync });
      const second = fs.readFileSync(outputFile);

      expect(second.equals(first)).toBe(true);
    });
  });

  test('main reports generated paths and redacted failures through injected ports', () => {
    const stdout = [];
    const stderr = [];
    expect(
      mainSbom({
        projectRoot: path.parse(process.cwd()).root,
        generateSbom: () => ({
          outputFile: path.join(path.parse(process.cwd()).root, 'dist', 'bom.json'),
        }),
        writeOutput: value => stdout.push(value),
        writeError: value => stderr.push(value),
      })
    ).toBe(0);
    expect(stdout.join('')).toContain('Generated SBOM: dist/bom.json');
    expect(stderr).toEqual([]);

    expect(
      mainSbom({
        generateSbom: () => {
          throw new Error('generation unavailable');
        },
        writeOutput: value => stdout.push(value),
        writeError: value => stderr.push(value),
      })
    ).toBe(1);
    expect(stderr.join('')).toContain('Error: generation unavailable');
  });
});
