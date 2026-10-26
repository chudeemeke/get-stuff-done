'use strict';

const { test, expect } = require('./helpers/portable-test-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const doctor = require(process.env.GSD_DOCTOR_TEST_SUBJECT || '../scripts/gsd-doctor.cjs');
const { assertRepairSafe } = require(process.env.GSD_DOCTOR_SECURITY_SUBJECT || '../scripts/lib/doctor-security.cjs');
const { WINDOWS_INSPECTOR } = require('../scripts/lib/doctor-security.cjs');

test('security refusal precedes every backup or replacement write', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-security-'));
  const file = path.join(root, 'owner settings with spaces.json');
  const raw = JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ command: '& "C:/bunx" "C:/hook.js"' }] }] }, owner: true });
  try {
    fs.writeFileSync(file, raw);
    expect(() => doctor.repair({ settingsPath: file, inspectSecurity: () => { throw new Error('Cannot preserve custom security metadata'); } })).toThrow('Cannot preserve custom security metadata');
    expect(fs.readFileSync(file, 'utf8')).toBe(raw);
    expect(fs.readdirSync(root)).toEqual([path.basename(file)]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

for (const [label, response, expected] of [
  ['verified plain metadata', { status: 0, stdout: '{"safe":true}' }, null],
  ['custom metadata', { status: 0, stdout: '{"safe":false}' }, /custom ACLs/],
  ['missing proof', { status: 0, stdout: '{}' }, /incomplete evidence/],
  ['null proof', { status: 0, stdout: 'null' }, /incomplete evidence/],
  ['string proof', { status: 0, stdout: '{"safe":"true"}' }, /incomplete evidence/],
  ['malformed proof', { status: 0, stdout: '{' }, /malformed inspector/],
  ['failed inspection', { status: 1, stdout: '{"safe":true}' }, /inspection unavailable/],
  ['timed out inspection', { status: null, error: new Error('timeout') }, /inspection unavailable/],
]) {
  test(`native security protocol: ${label}`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-security-'));
    const file = path.join(root, "owner's settings $literal.json");
    try {
      fs.writeFileSync(file, '{}');
      const check = () => assertRepairSafe(file, { platform: 'win32', run: (exe, args, options) => {
        expect(exe).toContain('powershell.exe');
        expect(args.join(' ')).not.toContain(file);
        expect(options.env.GSD_DOCTOR_SECURITY_FILE).toBe(file);
        expect(fs.readFileSync(options.env.GSD_DOCTOR_SECURITY_PROBE, 'utf8')).toBe('');
        expect(options.timeout).toBe(10000);
        return response;
      } });
      if (expected) expect(check).toThrow(expected); else check();
      expect(fs.readdirSync(root)).toEqual([path.basename(file)]);
      expect(fs.readFileSync(file, 'utf8')).toBe('{}');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
}

test('refuses hard links, directories, unsupported platforms and compatibility filesystems', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-security-'));
  const file = path.join(root, 'settings.json');
  const statfs = fs.statfsSync;
  try {
    fs.writeFileSync(file, '{}');
    expect(() => assertRepairSafe(root)).toThrow(/regular file/);
    fs.linkSync(file, path.join(root, 'other.json'));
    expect(() => assertRepairSafe(file)).toThrow(/one link/);
    fs.unlinkSync(path.join(root, 'other.json'));
    expect(() => assertRepairSafe(file, { platform: 'darwin' })).toThrow(/unsupported/);
    fs.statfsSync = () => ({ type: 0x9fa0 });
    expect(() => assertRepairSafe(file, { platform: 'linux' })).toThrow(/filesystem/);
    fs.statfsSync = () => ({ type: 0xef53 });
    assertRepairSafe(file, { platform: 'linux', run: (exe, args) => {
      expect(exe).toBe('python3');
      expect(args[0]).toBe('-I');
      expect(args[3]).toBe(file);
      return { status: 0, stdout: '{"safe":true}' };
    } });
  } finally { fs.statfsSync = statfs; fs.rmSync(root, { recursive: true, force: true }); }
});

test('native inspector proves ordinary metadata or refuses without settings writes', { timeout: 20000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-security-'));
  const file = path.join(root, 'settings with spaces.json');
  try {
    fs.writeFileSync(file, '{}', { mode: 0o600 });
    try { assertRepairSafe(file); } catch (error) {
      expect(error.message).toMatch(/security metadata cannot be safely preserved/);
      expect(error.message).toContain(file);
    }
    expect(fs.readFileSync(file, 'utf8')).toBe('{}');
    expect(fs.readdirSync(root)).toEqual([path.basename(file)]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('inspector startup failure cleans its empty probe and preserves settings', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-security-'));
  const file = path.join(root, 'settings.json');
  const systemRoot = process.env.SystemRoot;
  try {
    fs.writeFileSync(file, '{}');
    delete process.env.SystemRoot;
    expect(() => assertRepairSafe(file, { platform: 'win32', run: () => { throw new Error('inspector could not start'); } })).toThrow('inspector could not start');
    expect(fs.readdirSync(root)).toEqual(['settings.json']);
    expect(fs.readFileSync(file, 'utf8')).toBe('{}');
  } finally {
    if (systemRoot === undefined) delete process.env.SystemRoot; else process.env.SystemRoot = systemRoot;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

for (const unsafe of [false, true]) {
  test(`probe cleanup failure retains inspection diagnostic (unsafe: ${unsafe})`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-security-'));
    const file = path.join(root, 'settings.json');
    const unlink = fs.unlinkSync;
    try {
      fs.writeFileSync(file, '{}');
      fs.unlinkSync = candidate => {
        if (path.basename(candidate).startsWith('.gsd-doctor-security-')) throw new Error('probe cleanup denied');
        return unlink(candidate);
      };
      expect(() => assertRepairSafe(file, { platform: 'win32', run: () => ({ status: 0, stdout: JSON.stringify({ safe: !unsafe }) }) })).toThrow(unsafe ? /custom ACLs.*probe cleanup denied/ : /probe cleanup denied/);
      expect(fs.readFileSync(file, 'utf8')).toBe('{}');
    } finally { fs.unlinkSync = unlink; fs.rmSync(root, { recursive: true, force: true }); }
  });
}

if (process.platform === 'win32') {
  test('native Windows predicate rejects custom ACL, owner, audit, attribute and stream evidence', { timeout: 20000 }, () => {
    // Synthetic descriptors stay in process memory. No on-disk ACL is changed.
    const cases = [
      {}, { protected: true }, { auditProtected: true }, { explicit: true },
      { audit: true }, { probeAudit: true }, { descriptor: 'different owner' },
      { attributes: 1 }, { attributes: 16384 }, { stream: 'custom' },
    ];
    const encoded = Buffer.from(JSON.stringify(cases)).toString('base64');
    const program = `
$cases = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}')) | ConvertFrom-Json
$env:GSD_DOCTOR_SECURITY_FILE = 'file'
$env:GSD_DOCTOR_SECURITY_PROBE = 'probe'
function Get-Acl {
  param($LiteralPath, [switch]$Audit)
  $isFile = $LiteralPath -eq 'file'
  $auditRules = @()
  if (($isFile -and $script:current.audit) -or ((-not $isFile) -and $script:current.probeAudit)) { $auditRules = @('audit') }
  $descriptor = 'default owner and ACL'
  if ($isFile -and $script:current.descriptor) { $descriptor = $script:current.descriptor }
  $acl = [pscustomobject]@{
    AreAccessRulesProtected = $isFile -and [bool]$script:current.protected
    AreAuditRulesProtected = $isFile -and [bool]$script:current.auditProtected
    Access = @([pscustomobject]@{ IsInherited = -not ($isFile -and $script:current.explicit) })
    Audit = $auditRules
    Descriptor = $descriptor
  }
  $acl | Add-Member ScriptMethod GetSecurityDescriptorSddlForm { param($sections) $this.Descriptor }
  return $acl
}
function Get-Item {
  param($LiteralPath, $Stream, [switch]$Force)
  if ($Stream) {
    if ($script:current.stream) { return [pscustomobject]@{ Stream = $script:current.stream } }
    return [pscustomobject]@{ Stream = ':$DATA' }
  }
  $attributes = 32
  if ($script:current.attributes) { $attributes = $script:current.attributes }
  return [pscustomobject]@{ Attributes = [IO.FileAttributes]$attributes }
}
foreach ($case in $cases) { $script:current = $case; & { ${WINDOWS_INSPECTOR} } }
`;
    const result = spawnSync(path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-NonInteractive', '-Command', program], { encoding: 'utf8', timeout: 15000 });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line).safe)).toEqual([true, false, false, false, false, false, false, false, false, false]);
  });
}
