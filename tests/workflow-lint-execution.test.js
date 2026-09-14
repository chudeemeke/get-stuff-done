const { test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

for (const hosted of [true, false]) {
  for (const dockerReady of [true, false]) {
    test(`workflow lint selects authority: hosted=${hosted}, docker=${dockerReady}`, () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-authority-'));
      try {
        const log = path.join(directory, 'calls');
        for (const [name, body] of Object.entries({
          git: 'printf "%s\\n" "$TEST_REPO"',
          actionlint: 'echo local >> "$TEST_LOG"',
          npx: 'echo fallback >> "$TEST_LOG"',
          docker: 'if [ "$1" = info ]; then exit "$TEST_DOCKER_STATUS"; fi\nprintf "%s\\n" "$*" >> "$TEST_LOG"',
        })) fs.writeFileSync(path.join(directory, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
        const result = spawnSync('bash', ['scripts/lint-workflows.sh'], {
          encoding: 'utf8',
          env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CI: hosted ? 'true' : '',
            GITHUB_ACTIONS: '', TEST_REPO: process.cwd(), TEST_LOG: log,
            TEST_DOCKER_STATUS: dockerReady ? '0' : '1' },
        });
        const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
        if (!hosted) { expect(result.status).toBe(0); expect(calls).toBe('local\n'); }
        else if (dockerReady) {
          expect(result.status).toBe(0);
          expect(calls).toContain('rhysd/actionlint@sha256:');
          expect(calls).not.toContain('local');
        } else { expect(result.status).toBe(1); expect(calls).toBe(''); }
      } finally { fs.rmSync(directory, { recursive: true, force: true }); }
    });
  }
}
