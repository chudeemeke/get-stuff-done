'use strict';
const { test, expect } = require('./helpers/portable-test-api');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const installer = path.resolve(__dirname, '../bin/install.js');

function resolve(args, overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.CODEX_HOME;
  if (overrides.CODEX_HOME) env.CODEX_HOME = overrides.CODEX_HOME;
  const child = spawnSync(process.execPath, ['-e', 'process.stdout.write(require(process.argv[1]).resolveTargetDir(JSON.parse(process.argv[2])))', installer, JSON.stringify(args)], { env, encoding: 'utf8', timeout: 10000 });
  expect(child.status).toBe(0);
  return child.stdout;
}

test('Codex global uses its home, independently of Claude configuration', () => {
  expect(resolve(['--codex', '--global'], { CLAUDE_CONFIG_DIR: path.join(os.tmpdir(), 'other-claude') })).toBe(path.join(os.homedir(), '.codex'));
  const codexHome = path.join(os.tmpdir(), 'custom-codex');
  expect(resolve(['--codex', '--global'], { CODEX_HOME: codexHome })).toBe(codexHome);
});

test('Codex local and explicit configuration match the selected runtime', () => {
  expect(resolve(['--codex', '--local'])).toBe(path.join(process.cwd(), '.codex'));
  const explicit = path.join(os.tmpdir(), 'explicit-codex');
  expect(resolve(['--codex', '--global', '--config-dir', explicit], { CODEX_HOME: path.join(os.tmpdir(), 'other-codex') })).toBe(explicit);
});

test('runtime home overrides expand tilde consistently with upstream', () => {
  expect(resolve(['--codex', '--global'], { CODEX_HOME: '~/.custom-codex' })).toBe(path.join(os.homedir(), '.custom-codex'));
  expect(resolve(['--codex', '--global'], { CODEX_HOME: '~' })).toBe(os.homedir());
  expect(resolve(['--codex', '--global', '--config-dir', '~/.explicit-codex'])).toBe(path.join(os.homedir(), '.explicit-codex'));
  expect(resolve(['--claude', '--global'], { CLAUDE_CONFIG_DIR: '~/.custom-claude' })).toBe(path.join(os.homedir(), '.custom-claude'));
});
