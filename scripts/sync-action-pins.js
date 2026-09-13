'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = 'config/phase43-toolchain-authority.json';

function synchronize(text, pins) {
  return text.replace(/(uses:\s+)([^\s@]+)@([^\s#]+)([^\S\r\n]*)(#[^\r\n]*)?/g,
    (match, prefix, action, ref, spacing, comment) => {
      if (action.startsWith('docker://')) return match;
      const pin = pins[action];
      if (!pin || !/^[0-9a-f]{40}$/.test(pin.sha) || !/^v?\d[\w.-]*$/.test(pin.tag)) {
        throw new Error(`Missing or invalid reviewed authority for ${action}`);
      }
      // Preserve explanatory comments; replace only a standalone version label.
      const nextComment = !comment || /^#\s*v?\d[\w.-]*\s*$/.test(comment)
        ? `# ${pin.tag}` : comment;
      return `${prefix}${action}@${pin.sha}${spacing || ' '}${nextComment}`;
    });
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
