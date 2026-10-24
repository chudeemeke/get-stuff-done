#!/usr/bin/env node
'use strict';

// Fork-owned D4 adapter. Markdown structure belongs to the pinned engine.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { tokenizeHeadings } = require('./lib/markdown-sectionizer.cjs');

function createDigest(bytes, { source, sections, maxLines = 200, expectedHash }) {
  if (typeof source !== 'string') throw new Error('Provide a relative research source label.');
  const sourceLabel = source.replace(/\\/g, '/');
  if (!/(?:^|[/-])RESEARCH\.md$/i.test(sourceLabel) || path.win32.parse(sourceLabel).root !== '' || sourceLabel.split('/').includes('..') || sourceLabel.includes('\0')) {
    throw new Error('Source label must be a relative RESEARCH.md or phase-RESEARCH.md path without parent traversal.');
  }
  const decoded = bytes.toString('utf8');
  if (!Buffer.from(decoded, 'utf8').equals(bytes)) throw new Error('Research must be valid UTF-8.');
  if (!Number.isInteger(maxLines) || maxLines < 1 || maxLines > 2000) throw new Error('Line budget must be an integer from 1 to 2000.');
  if (!Array.isArray(sections) || sections.length === 0 || new Set(sections).size !== sections.length) {
    throw new Error('Select at least one distinct heading with --section.');
  }
  const sourceHash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (expectedHash !== undefined && expectedHash !== sourceHash) throw new Error('Supplied research bytes changed: regenerate and review the digest.');
  const text = decoded.replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const headings = tokenizeHeadings(text);
  const selected = sections.map(heading => {
    const matches = headings.filter(item => item.text === heading);
    if (matches.length !== 1) throw new Error(`Heading is missing or ambiguous: ${JSON.stringify(heading)}. Use an exact, unique heading.`);
    const item = matches[0];
    const next = headings.find(candidate => candidate.line > item.line && candidate.level <= item.level);
    return { heading, start: item.line, end: next ? next.line - 1 : lines.length };
  }).sort((a, b) => a.start - b.start);
  for (let i = 1; i < selected.length; i++) {
    if (selected[i].start <= selected[i - 1].end) throw new Error('Selected sections overlap. Select the parent or its children, not both.');
  }
  const metadata = {
    research_digest_version: 1,
    source_kind: 'supplied_bytes',
    source: sourceLabel,
    source_sha256: sourceHash,
    source_lines: lines.length,
    selected_sections: selected,
  };
  const header = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
  const excerpts = selected.map(item => `<!-- source-lines: ${item.start}-${item.end} -->\n${lines.slice(item.start - 1, item.end).join('\n').replace(/\n+$/, '')}`).join('\n\n');
  const markdown = `---\n${header}\n---\n\n# Per-plan research digest\n\n${excerpts}\n`;
  const digestLines = markdown.slice(0, -1).split('\n').length;
  if (digestLines > maxLines) throw new Error(`Digest exceeds line budget (${digestLines}/${maxLines}). Select narrower sections or explicitly increase --max-lines; no content was truncated.`);
  return { ...metadata, digest_lines: digestLines, markdown };
}

const HELP = `research-digest - extract cited per-plan research sections

USAGE
  node research-digest.cjs RESEARCH.md --stdin --section HEADING [options]

OPTIONS
  --stdin               Read research bytes from standard input (required)
  --section HEADING      Exact heading; repeat for multiple sections
  --max-lines N          Markdown line budget (default 200; maximum 2000)
  --expect-sha256 HASH   Refuse if supplied bytes differ from the reviewed hash
  --json                Emit metadata and Markdown as JSON
  -h, --help            Show help
  --version             Show the skin artifact version

EXAMPLES
  node research-digest.cjs .planning/23-RESEARCH.md --stdin --section Storage

Provide the reader's original byte snapshot on stdin. The path is a caller-
supplied provenance label; this helper never opens it or verifies disk identity.
Output is deterministic and read-only. Publish it as a per-plan digest and
reference that file in PLAN.md read_first. The planner owns section selection;
the helper does not decide whether the selected research is sufficient.
`;

function main(args = process.argv.slice(2), ports = {}) {
  const stdout = ports.stdout || (text => process.stdout.write(text));
  const stderr = ports.stderr || (text => process.stderr.write(text));
  try {
    const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
      section: { type: 'string', multiple: true },
      'max-lines': { type: 'string', default: '200' },
      'expect-sha256': { type: 'string' },
      stdin: { type: 'boolean' },
      json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean' },
    } });
    if (values.help || (positionals.length === 1 && positionals[0] === 'help')) { stdout(HELP); return 0; }
    if (values.version) {
      const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '.install-meta.json'), 'utf8'));
      stdout(`research-digest ${metadata.overlay_version}\n`);
      return 0;
    }
    if (!values.stdin || positionals.length !== 1) throw new Error('Provide one research source label and --stdin. See --help.');
    const bytes = (ports.readStdin || (() => fs.readFileSync(0)))();
    const result = createDigest(bytes, {
      source: positionals[0],
      sections: values.section,
      maxLines: Number(values['max-lines']),
      expectedHash: values['expect-sha256'],
    });
    stdout(values.json ? `${JSON.stringify(result, null, 2)}\n` : result.markdown);
    return 0;
  } catch (error) {
    stderr(`research-digest: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main();
module.exports = { createDigest, main };
