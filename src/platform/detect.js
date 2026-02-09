const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Platform Detection Module
 *
 * Detects OS, shell, environment, Node.js version, and git availability.
 * Results are cached on first call for performance.
 *
 * Usage:
 *   const { detectPlatform } = require('./detect');
 *   const platform = detectPlatform();
 *   console.log(platform.os);      // 'win32', 'darwin', 'linux'
 *   console.log(platform.shell);   // 'bash', 'zsh', 'pwsh', 'cmd'
 *   console.log(platform.isMingw); // true/false
 */

let cachedPlatform = null;

/**
 * Detect the current shell environment
 * @returns {object} Shell detection result
 */
function detectShell() {
  const env = process.env;

  // Windows detection
  if (process.platform === 'win32') {
    // Check for MinGW/Git Bash
    if (env.MSYSTEM) {
      return {
        shell: 'bash',
        isBash: true,
        isZsh: false,
        isPowerShell: false,
        isCmd: false,
        variant: 'mingw',
      };
    }

    // Check for PowerShell
    if (env.PSModulePath || env.POWERSHELL_DISTRIBUTION_CHANNEL) {
      return {
        shell: 'pwsh',
        isBash: false,
        isZsh: false,
        isPowerShell: true,
        isCmd: false,
        variant: 'powershell',
      };
    }

    // Default to cmd on Windows
    return {
      shell: 'cmd',
      isBash: false,
      isZsh: false,
      isPowerShell: false,
      isCmd: true,
      variant: 'cmd',
    };
  }

  // Unix-like detection
  const shellPath = env.SHELL || '';

  if (shellPath.includes('zsh')) {
    return {
      shell: 'zsh',
      isBash: false,
      isZsh: true,
      isPowerShell: false,
      isCmd: false,
      variant: 'zsh',
    };
  }

  if (shellPath.includes('bash')) {
    return {
      shell: 'bash',
      isBash: true,
      isZsh: false,
      isPowerShell: false,
      isCmd: false,
      variant: 'bash',
    };
  }

  // Unknown shell, assume bash for Unix
  return {
    shell: 'bash',
    isBash: true,
    isZsh: false,
    isPowerShell: false,
    isCmd: false,
    variant: 'unknown',
  };
}

/**
 * Detect special environments (MinGW, WSL, Git Bash)
 * @returns {object} Environment detection result
 */
function detectEnvironment() {
  const env = process.env;
  const platform = process.platform;

  // MinGW detection (Git Bash, MSYS2)
  const isMingw = !!(
    env.MSYSTEM ||
    env.MINGW_PREFIX ||
    (env.EXEPATH && env.EXEPATH.toLowerCase().includes('git'))
  );

  // WSL detection
  let isWSL = false;
  if (platform === 'linux') {
    try {
      // Check /proc/version for Microsoft or WSL
      const procVersion = fs.readFileSync('/proc/version', 'utf8');
      isWSL = procVersion.includes('Microsoft') || procVersion.includes('WSL');
    } catch (err) {
      // /proc/version not readable or doesn't exist
      // Check WSL_DISTRO_NAME as fallback
      isWSL = !!env.WSL_DISTRO_NAME;
    }
  }

  // Git Bash detection (MinGW + Git in EXEPATH)
  const isGitBash =
    isMingw && env.EXEPATH && env.EXEPATH.toLowerCase().includes('git');

  return {
    isMingw,
    isWSL,
    isGitBash,
    isNative: !isMingw && !isWSL,
  };
}

/**
 * Detect Node.js version and validate LTS requirement
 * @returns {object} Node version info
 */
function detectNodeVersion() {
  const version = process.versions.node;
  const major = parseInt(version.split('.')[0], 10);

  // Node.js 20 LTS is minimum recommended
  const isLTS = major >= 20;
  const warning = isLTS ? null : `Node.js ${major}.x detected. Node.js 20+ LTS recommended.`;

  return {
    version,
    major,
    isLTS,
    warning,
  };
}

/**
 * Detect git availability
 * @returns {object} Git detection result
 */
function detectGit() {
  try {
    const gitPath = execSync(
      process.platform === 'win32' ? 'where git' : 'which git',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    const gitVersion = execSync('git --version', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    return {
      available: true,
      path: gitPath.split('\n')[0], // Take first path if multiple
      version: gitVersion.replace('git version ', ''),
    };
  } catch (err) {
    return {
      available: false,
      path: null,
      version: null,
    };
  }
}

/**
 * Detect all platform information
 * Results are cached after first call
 * @returns {object} Complete platform detection result
 */
function detectPlatform() {
  if (cachedPlatform) {
    return cachedPlatform;
  }

  const osPlatform = process.platform;
  const shellInfo = detectShell();
  const envInfo = detectEnvironment();
  const nodeInfo = detectNodeVersion();
  const gitInfo = detectGit();

  cachedPlatform = {
    // OS information
    os: osPlatform,
    isWindows: osPlatform === 'win32',
    isMac: osPlatform === 'darwin',
    isLinux: osPlatform === 'linux',

    // Shell information
    shell: shellInfo.shell,
    isBash: shellInfo.isBash,
    isZsh: shellInfo.isZsh,
    isPowerShell: shellInfo.isPowerShell,
    isCmd: shellInfo.isCmd,
    shellVariant: shellInfo.variant,

    // Environment information
    isMingw: envInfo.isMingw,
    isWSL: envInfo.isWSL,
    isGitBash: envInfo.isGitBash,
    isNative: envInfo.isNative,

    // Node.js information
    nodeVersion: nodeInfo.version,
    nodeMajor: nodeInfo.major,
    nodeIsLTS: nodeInfo.isLTS,
    nodeWarning: nodeInfo.warning,

    // Git information
    gitAvailable: gitInfo.available,
    gitPath: gitInfo.path,
    gitVersion: gitInfo.version,

    // System information
    arch: os.arch(),
    cpus: os.cpus().length,
    homedir: os.homedir(),
  };

  return cachedPlatform;
}

/**
 * Clear cached platform detection (for testing)
 */
function clearCache() {
  cachedPlatform = null;
}

module.exports = {
  detectPlatform,
  clearCache,
};
