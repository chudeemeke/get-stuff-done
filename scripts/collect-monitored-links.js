'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');
const { parse } = require('smol-toml');

function collectLinks(documents, configuration) {
  const patterns = (configuration.exclude || []).map(pattern => new RegExp(pattern));
  const links = new Set();
  for (const document of documents) {
    for (const match of document.matchAll(/https?:\/\/[^\s<>"`]+/g)) {
      const url = match[0].replace(/[).,;]+$/, '');
      if (/^https?:\/\/localhost(?::|\/|$)/.test(url)) continue;
      if (patterns.some(pattern => pattern.test(url))) links.add(url);
    }
  }
  return [...links].sort();
}

if (require.main === module) {
  const config = parse(fs.readFileSync('lychee.toml', 'utf8'));
  const excludedPaths = (config.exclude_path || []).map(pattern => new RegExp(pattern));
  const files = execFileSync('git', ['ls-files', '-z', '*.md'], { encoding: 'utf8' })
    .split('\0').filter(file => file && !excludedPaths.some(pattern => pattern.test(file)));
  const urls = collectLinks(files.map(file => fs.readFileSync(file, 'utf8')), config);
  if (!urls.length) throw new Error('No excluded external links found; check the monitoring configuration.');
  process.stdout.write(`${urls.join('\n')}\n`);
}

module.exports = { collectLinks };
