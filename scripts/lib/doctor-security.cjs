'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// Read-only native inspectors. Paths travel as arguments/environment data,
// never as executable shell text. A missing inspector or privilege is refusal.
const WINDOWS_INSPECTOR = String.raw`
$ErrorActionPreference = 'Stop'
try {
  $file = Get-Acl -LiteralPath $env:GSD_DOCTOR_SECURITY_FILE -Audit
  $probe = Get-Acl -LiteralPath $env:GSD_DOCTOR_SECURITY_PROBE -Audit
  $item = Get-Item -LiteralPath $env:GSD_DOCTOR_SECURITY_FILE -Force
  $extraStreams = @(Get-Item -LiteralPath $env:GSD_DOCTOR_SECURITY_FILE -Stream * | Where-Object { $_.Stream -ne ':$DATA' })
  $sections = [System.Security.AccessControl.AccessControlSections]::All
  $safe = (-not $file.AreAccessRulesProtected) -and
    (-not $file.AreAuditRulesProtected) -and
    (@($file.Access | Where-Object { -not $_.IsInherited }).Count -eq 0) -and
    ($file.Audit.Count -eq 0) -and ($probe.Audit.Count -eq 0) -and
    (($item.Attributes.value__ -band (-bnot 160)) -eq 0) -and ($extraStreams.Count -eq 0) -and
    ($file.GetSecurityDescriptorSddlForm($sections) -eq $probe.GetSecurityDescriptorSddlForm($sections))
  @{ safe = $safe } | ConvertTo-Json -Compress
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
`;

const LINUX_INSPECTOR = String.raw`
import fcntl, json, os, struct, sys
file, probe = sys.argv[1:]
original, replacement = os.stat(file), os.stat(probe)
# trusted.* xattrs can be hidden without CAP_SYS_ADMIN. Never infer absence
# from an unprivileged listxattr result, and never attempt to gain privilege.
with open('/proc/self/status') as status:
    effective = next(line.split()[1] for line in status if line.startswith('CapEff:'))
if not int(effective, 16) & (1 << 21):
    print(json.dumps({'safe': False}))
    sys.exit(0)

def inode_metadata(name):
    with open(name, 'rb') as handle:
        size = struct.calcsize('L')
        flags = struct.unpack('L', fcntl.ioctl(handle, 0x80006601 | (size << 16), bytes(size)))[0]
        xflags, extent_size, _, project, cow_extent, _ = struct.unpack('IIIII8s', fcntl.ioctl(handle, 0x801c581f, bytes(28)))
        return flags, xflags, extent_size, project, cow_extent

safe = (original.st_uid == replacement.st_uid and original.st_gid == replacement.st_gid
        and not original.st_mode & 0o7000
        and not os.listxattr(file) and not os.listxattr(probe)
        and not os.listxattr(os.path.dirname(file))
        and inode_metadata(file) == inode_metadata(probe))
print(json.dumps({'safe': safe}))
`;

function assertRepairSafe(settingsPath, { platform = process.platform, run = spawnSync } = {}) {
  const file = path.resolve(settingsPath);
  const refuse = detail => new Error(`Refusing repair of ${file}: security metadata cannot be safely preserved (${detail}). ` +
    'Settings are unchanged. Use check or repair --dry-run; have the file owner inspect its ACLs and ownership. No permission changes were attempted.');
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.nlink !== 1) throw refuse('requires a regular file with one link');
  if (platform !== 'win32' && platform !== 'linux') throw refuse('unsupported security inspector on this platform');
  // Linux compatibility filesystems can hide native Windows/server ACLs.
  if (platform === 'linux' && ![0xef53, 0x9123683e, 0x58465342, 0x01021994].includes(fs.statfsSync(file).type)) {
    throw refuse('filesystem security semantics are not supported');
  }
  const probe = path.join(path.dirname(file), `.gsd-doctor-security-${crypto.randomUUID()}`);
  fs.closeSync(fs.openSync(probe, 'wx', 0o600));
  let inspectionError;
  try {
    const windows = platform === 'win32';
    const executable = windows ? path.join(process.env.SystemRoot || 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe') : 'python3';
    const args = windows ? ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_INSPECTOR] : ['-I', '-c', LINUX_INSPECTOR, file, probe];
    const result = run(executable, args, {
      encoding: 'utf8', timeout: 10000, maxBuffer: 16384,
      env: { ...process.env, GSD_DOCTOR_SECURITY_FILE: file, GSD_DOCTOR_SECURITY_PROBE: probe },
    });
    if (result.error || result.status !== 0) throw refuse('native inspection unavailable; Windows requires audit-security read privilege, Linux requires Python 3 and complete xattr/ioctl inspection');
    let evidence;
    try { evidence = JSON.parse(result.stdout); } catch { throw refuse('malformed inspector response'); }
    if (!evidence || evidence.safe !== true) throw refuse('custom ACLs, ownership, attributes, or incomplete evidence');
  } catch (error) {
    inspectionError = error;
    throw error;
  } finally {
    try { fs.unlinkSync(probe); } catch (cleanupError) {
      if (inspectionError) throw new AggregateError([inspectionError, cleanupError],
        `${inspectionError.message}; empty probe cleanup failed at ${probe}: ${cleanupError.message}`);
      throw cleanupError;
    }
  }
}

module.exports = { assertRepairSafe, WINDOWS_INSPECTOR, LINUX_INSPECTOR };
