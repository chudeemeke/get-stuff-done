'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');
const { parse } = require('smol-toml');
const isSafeRegex = require('safe-regex');
const MarkdownIt = require('markdown-it');
const { parseFragment } = require('parse5');

const markdown = new MarkdownIt({ html: true, linkify: true });

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
    } else if (pattern[i] === ')' && ['*', '+'].includes(pattern[i + 1])) {
      // safe-regex's repetition-depth heuristic misses overlapping alternatives.
      // Reject all unbounded group repetition, not just known ambiguous examples.
      throw new Error(`Repeated exclusion groups are unsupported: ${pattern}`);
    } else if ('{}].'.includes(pattern[i])) {
      throw new Error(`Unsupported exclusion syntax: ${pattern}`);
    }
    // Rust's $ is absolute end; JavaScript's also accepts a final newline.
    source += pattern[i] === '$' ? '(?![\\s\\S])' : pattern[i];
  }
  if (!isSafeRegex(pattern)) {
    throw new Error(`Exclusion is unsafe for JavaScript regex evaluation: ${pattern}`);
  }
  return new RegExp(source);
}

function htmlAttributeLinks(source) {
  const links = [];
  function visit(node) {
    for (const { name, value } of node.attrs || []) {
      if (name === 'href' || name === 'src') links.push(value.trim());
      if (name === 'srcset') {
        for (const match of markdown.linkify.match(value) || []) links.push(match.url);
      }
    }
    for (const child of node.childNodes || []) visit(child);
    if (node.content) visit(node.content); // HTML template contents
  }
  visit(parseFragment(source));
  return links;
}

function documentLinks(source) {
  const links = [];
  function visit(tokens) {
    for (const token of tokens || []) {
      if (token.type === 'link_open') links.push(token.attrGet('href'));
      if (token.type === 'image') links.push(token.attrGet('src'));
      if (token.type === 'html_block' || token.type === 'html_inline') {
        links.push(...htmlAttributeLinks(token.content));
      }
      visit(token.children);
    }
  }
  visit(markdown.parse(source, {}));
  return links.filter(url => /^https?:\/\//.test(url));
}

function collectLinks(documents, configuration) {
  const patterns = (configuration.exclude || []).map(exclusionPattern);
  const links = new Set();
  for (const document of documents) {
    for (const url of documentLinks(document)) {
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

module.exports = { collectLinks, documentLinks, exclusionPattern };
