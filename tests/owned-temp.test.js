const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  MARKER_NAME,
  cleanupOwnedTemp,
  createOwnedTemp,
} = require('../scripts/lib/owned-temp');

const OWNER = 'get-stuff-done/upstream-compat';
const PROJECT_ROOT = path.resolve(__dirname, '..');

function makeSandbox() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-owned-temp-test-'));
}

describe('owned temp lifecycle', () => {
  test('marks canonical ownership and supports dry-run before deletion', () => {
    const sandbox = makeSandbox();

    try {
      const owned = createOwnedTemp({
        tempRoot: sandbox,
        prefix: 'compat-',
        owner: OWNER,
      });
      const marker = JSON.parse(fs.readFileSync(path.join(owned.path, MARKER_NAME), 'utf8'));

      expect(marker).toEqual({
        schemaVersion: 1,
        owner: OWNER,
        canonicalPath: fs.realpathSync(owned.path),
      });

      const dryRun = cleanupOwnedTemp(owned.path, {
        tempRoot: sandbox,
        owner: OWNER,
        dryRun: true,
      });
      expect(dryRun).toMatchObject({ removed: false, dryRun: true });
      expect(fs.existsSync(owned.path)).toBe(true);

      const removed = cleanupOwnedTemp(owned.path, {
        tempRoot: sandbox,
        owner: OWNER,
      });
      expect(removed).toMatchObject({ removed: true, dryRun: false });
      expect(fs.existsSync(owned.path)).toBe(false);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('rejects unmarked, protected, lookalike, and link-escape targets', () => {
    const sandbox = makeSandbox();
    const tempRoot = path.join(sandbox, 'temp');
    const lookalikeRoot = path.join(sandbox, 'temp-lookalike');
    fs.mkdirSync(tempRoot);
    fs.mkdirSync(lookalikeRoot);

    try {
      const unmarked = fs.mkdtempSync(path.join(tempRoot, 'unmarked-'));
      expect(() => cleanupOwnedTemp(unmarked, {
        tempRoot,
        owner: OWNER,
      })).toThrow(/ownership marker/i);

      const lookalike = createOwnedTemp({
        tempRoot: lookalikeRoot,
        prefix: 'owned-',
        owner: OWNER,
      });
      expect(() => cleanupOwnedTemp(lookalike.path, {
        tempRoot,
        owner: OWNER,
      })).toThrow(/outside the allowed temp root/i);

      for (const protectedRoot of [
        PROJECT_ROOT,
        path.join(PROJECT_ROOT, 'dist'),
        path.join(PROJECT_ROOT, 'node_modules'),
      ]) {
        expect(() => cleanupOwnedTemp(protectedRoot, {
          tempRoot: os.tmpdir(),
          owner: OWNER,
          protectedRoots: [PROJECT_ROOT],
        })).toThrow(/protected root/i);
      }

      const outside = createOwnedTemp({
        tempRoot: sandbox,
        prefix: 'outside-',
        owner: OWNER,
      });
      const escape = path.join(tempRoot, 'escape');
      fs.symlinkSync(outside.path, escape, process.platform === 'win32' ? 'junction' : 'dir');

      expect(() => cleanupOwnedTemp(escape, {
        tempRoot,
        owner: OWNER,
      })).toThrow(/outside the allowed temp root/i);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('allows internal links but rejects unregistered links outside the owned tree', () => {
    const sandbox = makeSandbox();

    try {
      const internal = createOwnedTemp({ tempRoot: sandbox, prefix: 'internal-', owner: OWNER });
      const internalTarget = path.join(internal.path, 'target');
      fs.mkdirSync(internalTarget);
      fs.symlinkSync(
        internalTarget,
        path.join(internal.path, 'link'),
        process.platform === 'win32' ? 'junction' : 'dir'
      );
      expect(cleanupOwnedTemp(internal.path, {
        tempRoot: sandbox,
        owner: OWNER,
      })).toMatchObject({ removed: true });

      const external = fs.mkdtempSync(path.join(sandbox, 'external-'));
      const escaping = createOwnedTemp({ tempRoot: sandbox, prefix: 'escaping-', owner: OWNER });
      fs.symlinkSync(
        external,
        path.join(escaping.path, 'link'),
        process.platform === 'win32' ? 'junction' : 'dir'
      );
      expect(() => cleanupOwnedTemp(escaping.path, {
        tempRoot: sandbox,
        owner: OWNER,
      })).toThrow(/unregistered link/i);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  test('protects a root when temp paths reach it through a junction alias', () => {
    const sandbox = makeSandbox();
    const protectedRoot = path.join(sandbox, 'protected');
    const protectedAlias = path.join(sandbox, 'protected-alias');
    fs.mkdirSync(protectedRoot);
    fs.symlinkSync(
      protectedRoot,
      protectedAlias,
      process.platform === 'win32' ? 'junction' : 'dir'
    );

    try {
      const owned = createOwnedTemp({
        tempRoot: protectedAlias,
        prefix: 'owned-',
        owner: OWNER,
      });
      expect(() => cleanupOwnedTemp(owned.path, {
        tempRoot: protectedAlias,
        owner: OWNER,
        protectedRoots: [protectedAlias],
      })).toThrow(/protected root/i);
      expect(fs.existsSync(owned.path)).toBe(true);
    } finally {
      fs.unlinkSync(protectedAlias);
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
