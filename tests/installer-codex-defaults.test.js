const { test, expect } = require('bun:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const installer = path.resolve(__dirname, '../dist/bin/install.js');

for (const previous of [null, '{\n  "custom": "retained", "resolve_model_ids": false\n}\n']) {
  test(`failed Codex agent generation restores ${previous === null ? 'absent' : 'existing'} shared defaults`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-defaults-rollback-'));
    try {
      const target = path.join(root, '.codex');
      const defaults = path.join(root, '.gsd/defaults.json');
      fs.mkdirSync(path.dirname(defaults), { recursive: true });
      if (previous !== null) fs.writeFileSync(defaults, previous);
      const fault = path.join(root, 'fault.cjs');
      fs.writeFileSync(fault, `
const fs = require('node:fs');
const original = fs.writeFileSync;
let failed = false;
fs.writeFileSync = function(file, ...args) {
  if (!failed && /[\\\\/]agents[\\\\/]gsd-.*\\.toml/.test(String(file))) {
    failed = true;
    const defaults = JSON.parse(fs.readFileSync(${JSON.stringify(defaults)}, 'utf8'));
    if (defaults.runtime !== 'codex' || defaults.resolve_model_ids !== 'omit') throw new Error('fault fired before defaults mutation');
    throw new Error('intentional post-defaults agent write failure');
  }
  return original.call(this, file, ...args);
};
`);
      const env = { ...process.env, HOME: root, USERPROFILE: root, CODEX_HOME: target, CLAUDE_CONFIG_DIR: path.join(root, '.claude'), GSD_HOME: path.join(root, '.gsd') };
      delete env.GSD_TEST_MODE;
      const result = spawnSync('node', ['--require', fault, installer, '--codex', '--global', '--config-dir', target], {
        cwd: root, env, encoding: 'utf8', timeout: 30000,
      });
      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('intentional post-defaults agent write failure');
      if (previous === null) expect(fs.existsSync(defaults)).toBe(false);
      else expect(fs.readFileSync(defaults, 'utf8')).toBe(previous);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }, 30000);
}

test('installer help selects Kimi Code with its distinct runtime flag', () => {
  const result = spawnSync('node', [installer, '--help'], { encoding: 'utf8', timeout: 10000 });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/--kimi-code.*Install for Kimi Code only/);
  expect(result.stdout).toContain('--kimi-code --global');
  expect(result.stdout).not.toContain('--kimi --global --config-dir ~/.kimi-code');
  expect(result.stdout).not.toContain('KIMI_CONFIG_DIR=~/.kimi-code');
}, 30000);
