'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const TRANSIENT_FILE_ERRORS = new Set(['EPERM', 'EBUSY', 'EACCES']);
const FILE_OPERATION_MAX_ATTEMPTS = 3;
const FILE_OPERATION_RETRY_DELAY_MS = 50;
const WINDOWS_REPLACE_SCRIPT = Buffer.from(`
  $ErrorActionPreference = 'Stop'
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class GsdRoadmapNativeFile {
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true,
    EntryPoint = "ReplaceFileW")]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool ReplaceFile(
    string replaced,
    string replacement,
    string backup,
    uint flags,
    IntPtr exclude,
    IntPtr reserved
  );
}
'@
  $recoveryAcl = New-Object System.Security.AccessControl.DirectorySecurity
  $recoveryAcl.SetAccessRuleProtection($true, $false)
  $currentSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $inheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor
    [Security.AccessControl.InheritanceFlags]::ObjectInherit
  $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $currentSid,
    [Security.AccessControl.FileSystemRights]::FullControl,
    $inheritance,
    [Security.AccessControl.PropagationFlags]::None,
    [Security.AccessControl.AccessControlType]::Allow
  )
  $recoveryAcl.AddAccessRule($rule)
  [IO.Directory]::SetAccessControl($env:GSD_ROADMAP_RECOVERY_DIR, $recoveryAcl)
  $replaced = [GsdRoadmapNativeFile]::ReplaceFile(
    $env:GSD_ROADMAP_TARGET_PATH,
    $env:GSD_ROADMAP_REPLACEMENT_PATH,
    $env:GSD_ROADMAP_BACKUP_PATH,
    0,
    [IntPtr]::Zero,
    [IntPtr]::Zero
  )
  if (-not $replaced) {
    $nativeCode = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    [Console]::Error.Write("GSD_REPLACE_ERROR=$nativeCode")
    exit 1
  }
`, 'utf16le').toString('base64');
let sleepBuffer = null;

function sleepSync(delayMs) {
  if (sleepBuffer === null) {
    sleepBuffer = new Int32Array(new SharedArrayBuffer(4));
  }
  Atomics.wait(sleepBuffer, 0, 0, delayMs);
}

function detectDominantEol(content) {
  const crlfCount = (content.match(/\r\n/g) || []).length;
  const lfCount = (content.replace(/\r\n/g, '').match(/\n/g) || []).length;
  if (crlfCount > lfCount) return '\r\n';
  if (lfCount > crlfCount) return '\n';
  return content.match(/\r\n|\n/)?.[0] || '\n';
}

function projectRoadmapEol(originalContent, updatedContent) {
  if (typeof originalContent !== 'string' || typeof updatedContent !== 'string') {
    throw new TypeError('roadmap content must be a string');
  }

  const normalized = updatedContent.replace(/\r\n/g, '\n');
  return detectDominantEol(originalContent) === '\r\n'
    ? normalized.replace(/\n/g, '\r\n')
    : normalized;
}

function cleanupTemp(fileSystem, tempPath) {
  try {
    fileSystem.unlinkSync(tempPath);
    return null;
  } catch (error) {
    return error.code === 'ENOENT' ? null : error;
  }
}

function throwAfterCleanup(fileSystem, tempPath, publicationError) {
  const cleanupError = cleanupTemp(fileSystem, tempPath);
  if (cleanupError) {
    throw new AggregateError(
      [publicationError, cleanupError],
      'roadmap publication failed and its temp file could not be removed',
      { cause: publicationError }
    );
  }
  throw publicationError;
}

function cleanupDirectory(fileSystem, directoryPath) {
  try {
    fileSystem.rmdirSync(directoryPath);
    return null;
  } catch (error) {
    return error.code === 'ENOENT' ? null : error;
  }
}

function pathExists(fileSystem, filePath) {
  try {
    return fileSystem.existsSync(filePath);
  } catch {
    return false;
  }
}

function retryTransientFileOperation(operation, sleep) {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return operation();
    } catch (error) {
      if (TRANSIENT_FILE_ERRORS.has(error.code) && attempt < FILE_OPERATION_MAX_ATTEMPTS) {
        sleep(FILE_OPERATION_RETRY_DELAY_MS);
        continue;
      }
      throw error;
    }
  }
}

function aggregateRecoveryFailure(publicationError, recoveryErrors, message) {
  const error = new AggregateError(
    [publicationError, ...recoveryErrors],
    message,
    { cause: publicationError }
  );
  error.preserveReplacement = true;
  return error;
}

function readExpectedRegularFile(fileSystem, filePath, expectedContent, expectedIdentity = null) {
  try {
    const stat = fileSystem.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    if (expectedIdentity && (
      stat.dev !== expectedIdentity.dev || stat.ino !== expectedIdentity.ino
    )) return null;
    if (fileSystem.readFileSync(filePath, 'utf8') !== expectedContent) return null;
    return { dev: stat.dev, ino: stat.ino };
  } catch {
    return null;
  }
}

function reconcileWindowsFailure(fileSystem, paths, publicationError, sleep, expectedOriginal) {
  const { targetPath, replacementPath, backupPath, recoveryDir } = paths;
  const recoveryErrors = [];
  const displacedPath = path.join(recoveryDir, 'displaced-target');
  const unvalidatedPath = path.join(recoveryDir, 'unvalidated-restored');
  const targetMatchesOriginal = readExpectedRegularFile(
    fileSystem,
    targetPath,
    expectedOriginal.content,
    expectedOriginal.identity
  );
  const backupExists = pathExists(fileSystem, backupPath);
  const backupMatchesOriginal = readExpectedRegularFile(
    fileSystem,
    backupPath,
    expectedOriginal.content,
    expectedOriginal.identity
  );

  if (targetMatchesOriginal) {
    if (backupExists && !backupMatchesOriginal) {
      throw aggregateRecoveryFailure(
        publicationError,
        [new Error('Windows roadmap backup path was substituted or changed')],
        'Windows roadmap replacement failed with an untrusted recovery object'
      );
    }
  } else if (backupMatchesOriginal) {
    // The reserved hardlink identifies the authoritative original. Keep any
    // displaced target until the restored path has been validated again.
    let displacedTarget = false;
    if (pathExists(fileSystem, targetPath)) {
      try {
        retryTransientFileOperation(
          () => fileSystem.renameSync(targetPath, displacedPath),
          sleep
        );
        displacedTarget = true;
      } catch (error) {
        throw aggregateRecoveryFailure(
          publicationError,
          [error],
          'Windows roadmap replacement failed and the changed target could not be isolated'
        );
      }
    }

    try {
      retryTransientFileOperation(
        () => fileSystem.renameSync(backupPath, targetPath),
        sleep
      );
    } catch (restoreError) {
      recoveryErrors.push(restoreError);
      if (displacedTarget) {
        try {
          retryTransientFileOperation(
            () => fileSystem.renameSync(displacedPath, targetPath),
            sleep
          );
        } catch (rollbackError) {
          recoveryErrors.push(rollbackError);
        }
      }
      throw aggregateRecoveryFailure(
        publicationError,
        recoveryErrors,
        'Windows roadmap replacement failed and the original target could not be restored'
      );
    }

    if (!readExpectedRegularFile(
      fileSystem,
      targetPath,
      expectedOriginal.content,
      expectedOriginal.identity
    )) {
      recoveryErrors.push(new Error('restored Windows roadmap did not match the reserved original'));
      if (displacedTarget) {
        try {
          retryTransientFileOperation(
            () => fileSystem.renameSync(targetPath, unvalidatedPath),
            sleep
          );
          retryTransientFileOperation(
            () => fileSystem.renameSync(displacedPath, targetPath),
            sleep
          );
        } catch (rollbackError) {
          recoveryErrors.push(rollbackError);
        }
      }
      throw aggregateRecoveryFailure(
        publicationError,
        recoveryErrors,
        'Windows roadmap replacement restored an untrusted target'
      );
    }

    if (displacedTarget) {
      const cleanupError = cleanupTemp(fileSystem, displacedPath);
      if (cleanupError) recoveryErrors.push(cleanupError);
    }
  } else if (backupExists) {
    throw aggregateRecoveryFailure(
      publicationError,
      [new Error('Windows roadmap backup was not a regular file with the original identity and bytes')],
      'Windows roadmap replacement failed with an untrusted recovery object'
    );
  } else if (!pathExists(fileSystem, targetPath)) {
    if (!pathExists(fileSystem, replacementPath)) {
      throw aggregateRecoveryFailure(
        publicationError,
        [new Error('no roadmap copy remained at the target, replacement, or backup path')],
        'Windows roadmap replacement failed without a recoverable file copy'
      );
    }
    try {
      retryTransientFileOperation(
        () => fileSystem.renameSync(replacementPath, targetPath),
        sleep
      );
    } catch (restoreError) {
      throw aggregateRecoveryFailure(
        publicationError,
        [restoreError],
        'Windows roadmap replacement failed and its surviving replacement could not be restored'
      );
    }
  }

  const backupCleanupError = cleanupTemp(fileSystem, backupPath);
  if (backupCleanupError) recoveryErrors.push(backupCleanupError);
  const directoryCleanupError = cleanupDirectory(fileSystem, recoveryDir);
  if (directoryCleanupError) recoveryErrors.push(directoryCleanupError);
  if (recoveryErrors.length > 0) {
    throw aggregateRecoveryFailure(
      publicationError,
      recoveryErrors,
      'Windows roadmap replacement was reconciled but recovery artifacts remain'
    );
  }
}

function windowsReplaceError(result) {
  if (result.error) return result.error;
  const nativeCode = Number(result.stderr.match(/GSD_REPLACE_ERROR=(\d+)/)?.[1]);
  const code = nativeCode === 5
    ? 'EACCES'
    : nativeCode === 32 || nativeCode === 33
      ? 'EBUSY'
      : nativeCode === 2 || nativeCode === 3
        ? 'ENOENT'
        : nativeCode === 1175
          ? 'EWIN_UNABLE_TO_REMOVE_REPLACED'
          : nativeCode === 1176
            ? 'EWIN_UNABLE_TO_MOVE_REPLACEMENT'
            : nativeCode === 1177
              ? 'EWIN_UNABLE_TO_MOVE_REPLACEMENT_2'
              : 'EIO';
  const error = new Error(`Windows atomic roadmap replacement failed (native code ${nativeCode || 'unknown'})`);
  error.code = code;
  error.nativeCode = Number.isFinite(nativeCode) ? nativeCode : null;
  return error;
}

function replaceWindowsFileSync(replacementPath, targetPath, deps = {}) {
  const environment = deps.env || process.env;
  const spawn = deps.spawnSync || spawnSync;
  const fileSystem = deps.fs || fs;
  const processId = deps.pid ?? process.pid;
  const entropy = deps.entropy || crypto.randomUUID;
  const sleep = deps.sleep || sleepSync;
  const expectedContent = deps.expectedOriginalContent;
  if (typeof expectedContent !== 'string') {
    throw new TypeError('expected original roadmap content must be a string');
  }
  const originalIdentity = readExpectedRegularFile(fileSystem, targetPath, expectedContent);
  if (!originalIdentity) {
    throw new Error('roadmap target changed or is not a regular file before Windows publication');
  }
  const recoveryToken = entropy();
  if (typeof recoveryToken !== 'string' || !/^[A-Za-z0-9_-]+$/.test(recoveryToken)) {
    throw new TypeError('roadmap recovery entropy must be a non-empty path-safe string');
  }
  const recoveryDir = `${targetPath}.recovery.${processId}.${recoveryToken}`;
  const backupPath = path.join(recoveryDir, 'original');
  fileSystem.mkdirSync(recoveryDir);
  try {
    fileSystem.linkSync(targetPath, backupPath);
  } catch (error) {
    const cleanupError = cleanupDirectory(fileSystem, recoveryDir);
    if (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Windows roadmap backup reservation and recovery-directory cleanup failed',
        { cause: error }
      );
    }
    throw error;
  }
  const executable = path.join(
    environment.SystemRoot || 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe'
  );
  const result = spawn(executable, [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    WINDOWS_REPLACE_SCRIPT,
  ], {
    env: {
      ...environment,
      GSD_ROADMAP_REPLACEMENT_PATH: replacementPath,
      GSD_ROADMAP_TARGET_PATH: targetPath,
      GSD_ROADMAP_BACKUP_PATH: backupPath,
      GSD_ROADMAP_RECOVERY_DIR: recoveryDir,
    },
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000,
    maxBuffer: 16 * 1024,
  });
  if (result.status === 0 && !result.error) {
    const cleanupErrors = [
      cleanupTemp(fileSystem, backupPath),
      cleanupDirectory(fileSystem, recoveryDir),
    ].filter(Boolean);
    if (cleanupErrors.length > 0) {
      const error = new AggregateError(
        cleanupErrors,
        'roadmap was published but Windows recovery artifacts could not be removed'
      );
      error.published = true;
      error.preserveReplacement = true;
      throw error;
    }
    return;
  }

  const error = windowsReplaceError(result);
  reconcileWindowsFailure(fileSystem, {
    targetPath,
    replacementPath,
    backupPath,
    recoveryDir,
  }, error, sleep, {
    content: expectedContent,
    identity: originalIdentity,
  });
  throw error;
}

function publishRoadmapPreservingBytes(filePath, originalContent, updatedContent, deps = {}) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new TypeError('roadmap file path must be a non-empty string');
  }
  if (typeof originalContent !== 'string' || typeof updatedContent !== 'string') {
    throw new TypeError('roadmap content must be a string');
  }
  if (updatedContent === originalContent) return false;

  const projected = projectRoadmapEol(originalContent, updatedContent);
  if (projected === originalContent) return false;

  const fileSystem = deps.fs || fs;
  const processId = deps.pid ?? process.pid;
  const entropy = deps.entropy || crypto.randomUUID;
  const sleep = deps.sleep || sleepSync;
  const platform = deps.platform || process.platform;
  const replaceFile = platform === 'win32'
    ? deps.replaceFile || ((replacementPath, targetPath) =>
      replaceWindowsFileSync(replacementPath, targetPath, {
        ...deps,
        expectedOriginalContent: originalContent,
      }))
    : fileSystem.renameSync.bind(fileSystem);
  const tempToken = entropy();
  if (typeof tempToken !== 'string' || !/^[A-Za-z0-9_-]+$/.test(tempToken)) {
    throw new TypeError('roadmap temp entropy must be a non-empty path-safe string');
  }
  const tempPath = `${filePath}.tmp.${processId}.${tempToken}`;
  fileSystem.mkdirSync(path.dirname(filePath), { recursive: true });

  try {
    fileSystem.copyFileSync(filePath, tempPath, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code === 'EEXIST') throw error;
    throwAfterCleanup(fileSystem, tempPath, error);
  }
  try {
    fileSystem.writeFileSync(tempPath, projected, 'utf8');
  } catch (error) {
    throwAfterCleanup(fileSystem, tempPath, error);
  }

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      replaceFile(tempPath, filePath);
      return true;
    } catch (error) {
      const isTransient = TRANSIENT_FILE_ERRORS.has(error.code);
      if (isTransient && attempt < FILE_OPERATION_MAX_ATTEMPTS) {
        sleep(FILE_OPERATION_RETRY_DELAY_MS);
        continue;
      }
      if (error.preserveReplacement) throw error;
      throwAfterCleanup(fileSystem, tempPath, error);
    }
  }
}

module.exports = {
  projectRoadmapEol,
  publishRoadmapPreservingBytes,
};
