'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- all mutations are guarded by canonical containment and an ownership marker */

const fs = require('fs');
const path = require('path');

const MARKER_NAME = '.gsd-owned-temp.json';

function normalizeForComparison(filePath) {
  const normalized = path.normalize(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function canonicalizeExisting(filePath) {
  const realpath = fs.realpathSync.native || fs.realpathSync;
  return realpath(path.resolve(filePath));
}

function isSameOrInside(parentPath, candidatePath) {
  const parent = normalizeForComparison(parentPath);
  const candidate = normalizeForComparison(candidatePath);
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function getComparablePaths(filePath) {
  const resolved = path.resolve(filePath);
  const candidates = [resolved];
  try {
    const canonical = canonicalizeExisting(resolved);
    if (normalizeForComparison(canonical) !== normalizeForComparison(resolved)) {
      candidates.push(canonical);
    }
  } catch {
    // A missing protected path still needs lexical protection.
  }
  return candidates;
}

function assertNotProtected(targetPath, protectedRoots = []) {
  const targetCandidates = getComparablePaths(targetPath);

  for (const protectedRoot of protectedRoots) {
    const protectedCandidates = getComparablePaths(protectedRoot);
    if (protectedCandidates.some(root => (
      targetCandidates.some(target => isSameOrInside(root, target))
    ))) {
      throw new Error(`Refusing to remove protected root: ${path.resolve(targetPath)}`);
    }
  }
}

function assertOwnedChild(targetPath, options) {
  const tempRoot = canonicalizeExisting(options.tempRoot);
  assertNotProtected(targetPath, options.protectedRoots);

  const canonicalPath = canonicalizeExisting(targetPath);
  assertNotProtected(canonicalPath, options.protectedRoots);
  if (canonicalPath === tempRoot || !isSameOrInside(tempRoot, canonicalPath)) {
    throw new Error(`Owned temp target is outside the allowed temp root: ${canonicalPath}`);
  }

  const markerPath = path.join(canonicalPath, MARKER_NAME);
  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch (err) {
    throw new Error(`Owned temp target lacks a valid ownership marker: ${err.message}`);
  }

  if (
    marker.schemaVersion !== 1 ||
    marker.owner !== options.owner ||
    normalizeForComparison(marker.canonicalPath) !== normalizeForComparison(canonicalPath)
  ) {
    throw new Error(`Owned temp target has an invalid ownership marker: ${canonicalPath}`);
  }

  return { canonicalPath, tempRoot };
}

function collectLinks(rootPath, currentPath = rootPath, links = []) {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const entryPath = path.join(currentPath, entry.name);
    const stat = fs.lstatSync(entryPath);
    if (stat.isSymbolicLink()) {
      links.push(entryPath);
    } else if (stat.isDirectory()) {
      collectLinks(rootPath, entryPath, links);
    }
  }
  return links;
}

function validateLinks(canonicalPath, allowedLinks = []) {
  const allowed = new Set(allowedLinks.map(linkPath => normalizeForComparison(path.resolve(linkPath))));
  const links = collectLinks(canonicalPath);

  for (const linkPath of links) {
    if (!isSameOrInside(canonicalPath, linkPath) || canonicalPath === linkPath) {
      throw new Error(`Owned temp link path escapes its target: ${linkPath}`);
    }

    let resolvedTarget;
    try {
      resolvedTarget = canonicalizeExisting(linkPath);
    } catch (err) {
      throw new Error(`Owned temp contains an invalid link at ${linkPath}: ${err.message}`);
    }

    if (
      !isSameOrInside(canonicalPath, resolvedTarget) &&
      !allowed.has(normalizeForComparison(linkPath))
    ) {
      throw new Error(`Owned temp contains an unregistered link: ${path.relative(canonicalPath, linkPath)}`);
    }
  }

  return links;
}

function removeLink(linkPath) {
  try {
    fs.unlinkSync(linkPath);
  } catch (err) {
    if (err.code !== 'EPERM' && err.code !== 'EISDIR') throw err;
    fs.rmdirSync(linkPath);
  }
}

function createOwnedTemp(options) {
  if (!options || !options.tempRoot || !options.owner) {
    throw new Error('createOwnedTemp requires tempRoot and owner');
  }

  const tempRoot = canonicalizeExisting(options.tempRoot);
  const prefix = options.prefix || 'gsd-owned-';
  if (path.basename(prefix) !== prefix) {
    throw new Error('Owned temp prefix must not contain path separators');
  }

  const createdPath = fs.mkdtempSync(path.join(tempRoot, prefix));
  const canonicalPath = canonicalizeExisting(createdPath);
  if (!isSameOrInside(tempRoot, canonicalPath) || canonicalPath === tempRoot) {
    throw new Error(`Created temp path escaped the allowed root: ${canonicalPath}`);
  }

  const marker = {
    schemaVersion: 1,
    owner: options.owner,
    canonicalPath,
  };
  fs.writeFileSync(
    path.join(canonicalPath, MARKER_NAME),
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );

  return { path: canonicalPath, markerPath: path.join(canonicalPath, MARKER_NAME) };
}

function cleanupOwnedTemp(targetPath, options = {}) {
  if (!options.tempRoot || !options.owner) {
    throw new Error('cleanupOwnedTemp requires tempRoot and owner');
  }

  const { canonicalPath } = assertOwnedChild(targetPath, options);
  const links = validateLinks(canonicalPath, options.allowedLinks);
  const result = {
    path: canonicalPath,
    removed: false,
    dryRun: options.dryRun === true,
    links: links.map(linkPath => path.relative(canonicalPath, linkPath)),
  };

  if (result.dryRun) return result;

  for (const linkPath of links) removeLink(linkPath);
  fs.rmSync(canonicalPath, { recursive: true, force: false });
  result.removed = true;
  return result;
}

module.exports = {
  MARKER_NAME,
  cleanupOwnedTemp,
  createOwnedTemp,
};
