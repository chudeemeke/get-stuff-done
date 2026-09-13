'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');
const { parse } = require('smol-toml');

// Deliberately small, case-sensitive ASCII subset shared with Rust regex.
// Validate in PR tests, rather than discovering dialect drift in the weekly job.
function exclusionPattern(pattern) {
  if (typeof pattern !== 'string' || /[^\x20-\x7e]/.test(pattern)) {
    throw new Error('Exclusions must use the documented shared regex subset');
  }
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '\\') {
      source += pattern[i];
      if (!'.^$*+?()[]{}|\\/-'.includes(pattern[++i] || '\0')) {
        throw new Error(`Unsupported exclusion escape: ${pattern}`);
      }
      source += pattern[i];
      continue;
    } else if (pattern[i] === '[') {
      if (pattern.slice(i, i + 5) !== '[0-9]') {
        throw new Error(`Only [0-9] character classes are supported: ${pattern}`);
      }
      source += '[0-9]';
      i += 4;
      continue;
    } else if (pattern[i] === '(' && pattern[i + 1] === '?') {
      throw new Error(`Unsupported exclusion group/flags: ${pattern}`);
    } else if ('{}].'.includes(pattern[i])) {
      throw new Error(`Unsupported exclusion syntax: ${pattern}`);
    }
    // Rust's $ is absolute end; JavaScript's also accepts a final newline.
    source += pattern[i] === '$' ? '(?![\\s\\S])' : pattern[i];
  }
  return new RegExp(source);
}

function trimLink(candidate) {
  let url = candidate.replace(/[.,;]+$/, '');
  // Markdown closes its destination with an extra ')'; keep balanced URL ones.
  let balance = [...url].reduce((n, char) => n + (char === '(' ? 1 : char === ')' ? -1 : 0), 0);
  while (url.endsWith(')') && balance < 0) {
    url = url.slice(0, -1);
    balance++;
  }
  return url;
}

function collectLinks(documents, configuration) {
  const patterns = (configuration.exclude || []).map(exclusionPattern);
  const links = new Set();
  for (const document of documents) {
    for (const match of document.matchAll(/https?:\/\/[^\s<>"'`]+/g)) {
      const url = trimLink(match[0]);
      if (/^https?:\/\/localhost(?::|\/|$)/.test(url)) continue;
      if (patterns.some(pattern => pattern.test(url))) links.add(url);
    }
  }
  return [...links].sort();
}

if (require.main === module) {
  const config = parse(fs.readFileSync('lychee.toml', 'utf8'));
  const excludedPaths = (config.exclude_path || []).map(exclusionPattern);
  const files = execFileSync('git', ['ls-files', '-z', '*.md'], { encoding: 'utf8' })
    .split('\0').filter(file => file && !excludedPaths.some(pattern => pattern.test(file)));
  const urls = collectLinks(files.map(file => fs.readFileSync(file, 'utf8')), config);
  if (!urls.length) throw new Error('No excluded external links found; check the monitoring configuration.');
  process.stdout.write(`${urls.join('\n')}\n`);
}

module.exports = { collectLinks, exclusionPattern };
