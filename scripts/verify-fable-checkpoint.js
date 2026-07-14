'use strict';

const {
  buildCheckpointPacket,
  canonicalJson,
  createDefaultDependencies,
  normalizeEvidencePath,
  recordMetadata,
  resolveEvidence,
  sanitizeDiagnostic,
  sha256,
  validateInputManifest,
  validateReceipt,
} = require('./run-fable-checkpoint');
const { TextDecoder } = require('util');

const ALLOWED_REJECTION_BASES = new Set([
  'repository-fact',
  'locked-user-decision',
  'security-wow',
  'executable-evidence',
]);
const CLASSIFICATIONS = new Set([
  'accepted',
  'accepted-with-revision',
  'rejected',
  'deferred',
]);
const VERIFY_HELP = [
  'Usage: node scripts/verify-fable-checkpoint.js --manifest <path> --receipt <path> --record <path> --checkpoint <name>',
  '',
  'Strictly verifies captured claude -p --model fable evidence and final dispositions.',
  'Verification performs no network calls or writes. --help performs no file or Git access.',
  '',
].join('\n');

function normalizeNewlines(value) {
  return String(value).replace(/\r\n?/g, '\n');
}

function uniqueLineIndex(lines, value, label) {
  const indexes = [];
  lines.forEach((line, index) => {
    if (line === value) indexes.push(index);
  });
  if (indexes.length !== 1) throw new Error(`Checkpoint record must contain exactly one ${label}.`);
  return indexes[0];
}

function extractDelimited(lines, start, end, label) {
  const startIndex = uniqueLineIndex(lines, start, `${label} start marker`);
  const endIndex = uniqueLineIndex(lines, end, `${label} end marker`);
  if (endIndex <= startIndex) throw new Error(`Checkpoint record has misordered ${label} markers.`);
  return {
    value: lines.slice(startIndex + 1, endIndex).join('\n'),
    startIndex,
    endIndex,
  };
}

function trimBlankLines(lines) {
  const copy = [...lines];
  while (copy[0] === '') copy.shift();
  while (copy.at(-1) === '') copy.pop();
  return copy;
}

function extractHeadingSection(lines, heading, startAt = 0) {
  const matches = [];
  lines.forEach((line, index) => {
    if (index >= startAt && line === heading) matches.push(index);
  });
  if (matches.length !== 1) throw new Error(`Checkpoint record must contain exactly one ${heading}.`);
  const start = matches[0] + 1;
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    if (/^#### /.test(lines[index])) {
      end = index;
      break;
    }
  }
  return trimBlankLines(lines.slice(start, end));
}

function parseFindings(reviewBody) {
  const lines = normalizeNewlines(reviewBody).split('\n');
  const entries = extractHeadingSection(lines, '#### Findings');
  if (entries.length === 1 && entries[0] === '- None.') return [];
  if (entries.length === 0 || entries.includes('- None.')) {
    throw new Error('Findings must use exact - None. or structured F-NNN entries.');
  }

  const findings = entries.map(line => {
    const match = /^- (F-\d{3}) \| severity=(blocker|warning) \| summary=(.+)$/.exec(line);
    if (!match) throw new Error('Finding entry is malformed.');
    return { id: match[1], severity: match[2], summary: match[3] };
  });
  if (new Set(findings.map(item => item.id)).size !== findings.length) {
    throw new Error('Finding ids must be unique.');
  }
  return findings;
}

function parseDispositionLine(line) {
  const parts = line.split(' | ');
  const idMatch = /^- (F-\d{3})$/.exec(parts.shift() || '');
  if (!idMatch) throw new Error('Disposition entry is malformed.');
  const metadata = {};
  for (const part of parts) {
    const separator = part.indexOf('=');
    if (separator <= 0 || separator === part.length - 1) {
      throw new Error(`Disposition ${idMatch[1]} has malformed metadata.`);
    }
    const key = part.slice(0, separator);
    const value = part.slice(separator + 1);
    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      throw new Error(`Disposition ${idMatch[1]} repeats ${key}.`);
    }
    metadata[key] = value;
  }
  if (!CLASSIFICATIONS.has(metadata.classification)) {
    throw new Error(`Disposition ${idMatch[1]} has an invalid classification.`);
  }
  const allowedKeys = new Set(['classification', 'revision', 'basis', 'evidence', 'owner', 'trigger']);
  if (Object.keys(metadata).some(key => !allowedKeys.has(key))) {
    throw new Error(`Disposition ${idMatch[1]} has unknown metadata.`);
  }
  if (metadata.classification === 'accepted-with-revision' && !metadata.revision) {
    throw new Error(`Disposition ${idMatch[1]} requires revision metadata.`);
  }
  if (metadata.classification === 'rejected') {
    if (!metadata.evidence || !ALLOWED_REJECTION_BASES.has(metadata.basis)) {
      throw new Error(`Disposition ${idMatch[1]} requires evidence and an allowed rejection basis.`);
    }
  }
  if (metadata.classification === 'deferred' && (!metadata.owner || !metadata.trigger)) {
    throw new Error(`Disposition ${idMatch[1]} requires owner and trigger metadata.`);
  }
  return { id: idMatch[1], ...metadata };
}

function parseDispositions(sectionLines, returnedReviewEnd) {
  const entries = extractHeadingSection(sectionLines, '#### Disposition', returnedReviewEnd + 1);
  if (entries.length === 1 && entries[0] === '- None.') return [];
  if (entries.length === 1 && entries[0] === '- Pending.') {
    throw new Error('Checkpoint disposition is still pending.');
  }
  if (entries.length === 0 || entries.includes('- None.') || entries.includes('- Pending.')) {
    throw new Error('Disposition must use exact - None. or structured F-NNN entries.');
  }
  const dispositions = entries.map(parseDispositionLine);
  if (new Set(dispositions.map(item => item.id)).size !== dispositions.length) {
    throw new Error('Disposition ids must be unique.');
  }
  return dispositions;
}

function parseCounts(sectionLines, startAt) {
  const entries = extractHeadingSection(sectionLines, '#### Classification Counts', startAt);
  if (entries.length !== 1) throw new Error('Classification counts must contain exactly one line.');
  const match = /^- findings=(\d+) accepted=(\d+) accepted-with-revision=(\d+) rejected=(\d+) deferred=(\d+)$/.exec(entries[0]);
  if (!match) throw new Error('Classification counts are malformed.');
  return {
    findings: Number(match[1]),
    accepted: Number(match[2]),
    acceptedWithRevision: Number(match[3]),
    rejected: Number(match[4]),
    deferred: Number(match[5]),
  };
}

function evaluateCheckpointRecord(recordText, rawReceipt, checkpoint, receiptPath) {
  const receipt = validateReceipt(rawReceipt);
  if (checkpoint !== receipt.checkpoint) throw new Error('Checkpoint does not match the receipt.');
  const normalized = normalizeNewlines(recordText);
  const lines = normalized.split('\n');
  const heading = `### ${checkpoint} - dispositioned`;
  const headingIndex = uniqueLineIndex(lines, heading, 'dispositioned checkpoint heading');
  let sectionEnd = lines.length;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^### /.test(lines[index])) {
      sectionEnd = index;
      break;
    }
  }
  const sectionLines = lines.slice(headingIndex, sectionEnd);

  const metadataBlock = extractDelimited(
    sectionLines,
    '<!-- fable-checkpoint-metadata:start -->',
    '<!-- fable-checkpoint-metadata:end -->',
    'checkpoint metadata'
  );
  let metadata;
  try {
    metadata = JSON.parse(metadataBlock.value);
  } catch {
    throw new Error('Checkpoint metadata is not valid JSON.');
  }
  const expectedMetadata = recordMetadata(receipt, receiptPath);
  if (canonicalJson(metadata) !== canonicalJson(expectedMetadata)) {
    throw new Error('Checkpoint metadata does not match the execution receipt.');
  }

  const lead = extractDelimited(
    sectionLines,
    '<!-- fable-lead-decision:start -->',
    '<!-- fable-lead-decision:end -->',
    'lead decision'
  ).value;
  const direction = extractDelimited(
    sectionLines,
    '<!-- fable-implementation-direction:start -->',
    '<!-- fable-implementation-direction:end -->',
    'implementation direction'
  ).value;
  const returnedReview = extractDelimited(
    sectionLines,
    '<!-- fable-returned-review:start -->',
    '<!-- fable-returned-review:end -->',
    'returned review'
  );
  if (
    lead !== receipt.returnedReview.leadDecision ||
    sha256(Buffer.from(lead, 'utf8')) !== receipt.returnedReview.leadDecisionSha256
  ) {
    throw new Error('Displayed lead decision does not match captured Fable bytes.');
  }
  if (
    direction !== receipt.returnedReview.implementationDirection ||
    sha256(Buffer.from(direction, 'utf8')) !== receipt.returnedReview.implementationDirectionSha256
  ) {
    throw new Error('Displayed implementation direction does not match captured Fable bytes.');
  }
  if (
    sha256(Buffer.from(returnedReview.value, 'utf8')) !== receipt.returnedReview.sha256 ||
    Buffer.byteLength(returnedReview.value, 'utf8') !== receipt.returnedReview.byteLength
  ) {
    throw new Error('Returned review bytes do not match the execution receipt.');
  }

  const findings = parseFindings(returnedReview.value);
  const dispositions = parseDispositions(sectionLines, returnedReview.endIndex);
  if (findings.length !== dispositions.length) {
    throw new Error('Every finding must have exactly one disposition.');
  }
  const findingIds = new Set(findings.map(item => item.id));
  if (dispositions.some(item => !findingIds.has(item.id))) {
    throw new Error('Disposition ids do not match finding ids.');
  }
  const actualCounts = {
    findings: findings.length,
    accepted: dispositions.filter(item => item.classification === 'accepted').length,
    acceptedWithRevision: dispositions.filter(item => item.classification === 'accepted-with-revision').length,
    rejected: dispositions.filter(item => item.classification === 'rejected').length,
    deferred: dispositions.filter(item => item.classification === 'deferred').length,
  };
  const recordedCounts = parseCounts(sectionLines, returnedReview.endIndex);
  if (canonicalJson(actualCounts) !== canonicalJson(recordedCounts)) {
    throw new Error('Classification counts do not match findings and dispositions.');
  }
  return actualCounts;
}

function readJson(dependencies, filePath, label) {
  const bytes = dependencies.readFile(filePath);
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new Error(`${label} is not valid UTF-8.`);
  }
  try {
    return { buffer, value: JSON.parse(text) };
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function readUtf8(dependencies, filePath, label) {
  const bytes = dependencies.readFile(filePath);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8.`);
  }
}

function verifyCheckpoint(options, dependencies) {
  const manifestPath = normalizeEvidencePath(options.manifestPath);
  const receiptPath = normalizeEvidencePath(options.receiptPath);
  const recordPath = normalizeEvidencePath(options.recordPath);
  const manifestRead = readJson(dependencies, manifestPath, 'Fable checkpoint manifest');
  const manifest = validateInputManifest(manifestRead.value);
  const receiptRead = readJson(dependencies, receiptPath, 'Fable checkpoint receipt');
  const receipt = validateReceipt(receiptRead.value);

  if (options.checkpoint !== manifest.checkpoint || options.checkpoint !== receipt.checkpoint) {
    throw new Error('Checkpoint name does not match manifest and receipt.');
  }
  if (receipt.subjectCommit !== manifest.subjectCommit) {
    throw new Error('Fable receipt subject commit does not match the input manifest.');
  }
  if (receipt.manifest.path !== manifestPath || receipt.recordPath !== recordPath) {
    throw new Error('Receipt paths do not match verifier inputs.');
  }
  if (sha256(manifestRead.buffer) !== receipt.manifest.rawSha256) {
    throw new Error('Manifest raw-byte digest does not match the receipt.');
  }

  const evidence = resolveEvidence(manifest, dependencies);
  const evidenceReceipt = evidence.map(({ content, ...item }) => item);
  if (canonicalJson(evidenceReceipt) !== canonicalJson(receipt.evidence)) {
    throw new Error('Resolved evidence does not match the execution receipt.');
  }
  const packet = buildCheckpointPacket(manifest, evidence, receipt.nonce);
  if (
    packet.canonicalInputSha256 !== receipt.manifest.canonicalInputSha256 ||
    packet.packetSha256 !== receipt.manifest.packetSha256
  ) {
    throw new Error('Reconstructed checkpoint input does not match the execution receipt.');
  }

  const record = readUtf8(dependencies, recordPath, 'Fable checkpoint record');
  const counts = evaluateCheckpointRecord(record, receipt, options.checkpoint, receiptPath);
  return {
    checkpoint: receipt.checkpoint,
    subjectCommit: receipt.subjectCommit,
    returnedReviewSha256: receipt.returnedReview.sha256,
    counts,
  };
}

function parseVerifyArgs(args) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) return { help: true };
  const mapping = {
    '--manifest': 'manifestPath',
    '--receipt': 'receiptPath',
    '--record': 'recordPath',
    '--checkpoint': 'checkpoint',
  };
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!mapping[flag] || typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      throw new Error('Unknown or incomplete Fable verification argument.');
    }
    const key = mapping[flag];
    if (result[key]) throw new Error(`Duplicate Fable verification argument: ${flag}.`);
    result[key] = value;
  }
  if (Object.values(mapping).some(key => !result[key])) {
    throw new Error('All --manifest, --receipt, --record, and --checkpoint arguments are required.');
  }
  return result;
}

function verifyMain(args = process.argv.slice(2), dependencyOverrides = {}) {
  const stdout = dependencyOverrides.stdout || (value => process.stdout.write(value));
  const stderr = dependencyOverrides.stderr || (value => process.stderr.write(value));
  try {
    const options = parseVerifyArgs(args);
    if (options.help) {
      stdout(VERIFY_HELP);
      return 0;
    }
    const dependencies = { ...createDefaultDependencies(), ...dependencyOverrides, stdout, stderr };
    const result = verifyCheckpoint(options, dependencies);
    stdout(`Verified ${result.checkpoint} for ${result.subjectCommit} (${result.returnedReviewSha256}).\n`);
    return 0;
  } catch (error) {
    stderr(`Error: ${sanitizeDiagnostic(error.message)}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = verifyMain();
}

module.exports = {
  evaluateCheckpointRecord,
  parseDispositions,
  parseFindings,
  parseVerifyArgs,
  verifyCheckpoint,
  verifyMain,
};
