'use strict';

const fs = require('fs');
const path = require('path');
const { parseDocument, isMap, isSeq, isScalar } = require('yaml');
const { isSafeTagLabel } = require('./lib/tag-authority');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = 'config/phase43-toolchain-authority.json';

function synchronize(text, pins) {
  const document = parseDocument(text);
  if (document.errors.length) throw document.errors[0];
  const edits = [];
  function update(mapping) {
    if (!isMap(mapping)) return;
    const node = mapping.get('uses', true);
    if (!node) return;
    if (!isScalar(node) || typeof node.value !== 'string' || !node.range) {
      throw new Error('Action uses must be a literal scalar, not an alias');
    }
    const value = node.value;
    if (value.startsWith('./') || value.startsWith('docker://')) return;
    const match = /^([^\s@]+)@([^\s]+)$/.exec(value);
    if (!match) throw new Error(`Invalid action reference: ${value}`);
    const action = match[1];
    const pin = pins[action];
    if (!pin || !/^[0-9a-f]{40}$/.test(pin.sha) || !isSafeTagLabel(pin.tag)) {
      throw new Error(`Missing or invalid reviewed authority for ${action}`);
    }
    let [start, end] = node.range;
    const original = text.slice(start, end);
    if (!['PLAIN', 'QUOTE_SINGLE', 'QUOTE_DOUBLE'].includes(node.type)) {
      throw new Error('Action uses must be a single-line scalar');
    }
    const quote = original[0] === '"' || original[0] === "'" ? original[0] : '';
    let replacement = `${quote}${action}@${pin.sha}${quote}`;
    // Legacy numeric version labels are unambiguous. New generated comments use
    // an explicit marker so nonnumeric tags cannot be confused with prose.
    const comment = /^[ \t]+#([^\r\n]*)(?=\r?\n|$)/.exec(text.slice(end));
    const body = comment?.[1].trim();
    // Legacy comments predate the explicit marker and only used numeric majors
    // or dotted versions. Do not guess from numeric-prefixed human prose.
    const legacyTag = body && /^v\d+(?:\.\d+){0,2}$/.test(body) ? body : null;
    const managedTag = body?.startsWith('pin: ') ? body.slice(5) : null;
    if (comment && (legacyTag || managedTag) && (legacyTag || managedTag) !== pin.tag) {
      end += comment[0].length;
      replacement += ` # pin: ${pin.tag}`;
    }
    edits.push({ start, end, replacement });
  }
  const jobs = document.get('jobs', true);
  if (isMap(jobs)) for (const { value: job } of jobs.items) {
    update(job); // reusable workflow invocation
    const steps = isMap(job) ? job.get('steps', true) : null;
    if (isSeq(steps)) for (const step of steps.items) update(step);
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
  }
  return text;
}

function syncActionPins(root = ROOT, write = false) {
  const pins = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')).githubActions.pins;
  const directory = path.join(root, '.github/workflows');
  // Validate and prepare every file before writing any of them.
  const edits = fs.readdirSync(directory).filter(name => /\.ya?ml$/.test(name)).sort()
    .map(name => {
      const file = path.join(directory, name);
      const before = fs.readFileSync(file, 'utf8');
      return { file, before, after: synchronize(before, pins) };
    }).filter(edit => edit.before !== edit.after);
  if (write) for (const edit of edits) fs.writeFileSync(edit.file, edit.after);
  return edits.map(edit => path.relative(root, edit.file));
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !['--check', '--write'].includes(args[0])) {
      throw new Error('Usage: node scripts/sync-action-pins.js --check|--write');
    }
    const changed = syncActionPins(ROOT, args[0] === '--write');
    for (const file of changed) console.log(file);
    if (changed.length && args[0] === '--check') {
      console.error('Action pins differ from reviewed authority. Review the proposed release, update the manifest, then run --write.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { synchronize, syncActionPins };
