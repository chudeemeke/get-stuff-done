'use strict';

const crypto = require('crypto');
const acorn = require('acorn');

const NON_SEMANTIC_KEYS = new Set([
  'start',
  'end',
  'loc',
  'range',
  'raw',
  'comments',
  'tokens',
]);

function parseWithSourceType(source, sourceType) {
  return acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType,
    allowHashBang: true,
  });
}

function parseJavaScriptForSemanticHash(source, filePath = '<inline>') {
  try {
    return {
      ok: true,
      ast: parseWithSourceType(source, 'module'),
      sourceType: 'module',
    };
  } catch (moduleErr) {
    try {
      return {
        ok: true,
        ast: parseWithSourceType(source, 'script'),
        sourceType: 'script',
      };
    } catch (scriptErr) {
      return {
        ok: false,
        filePath,
        error: `parse failure: ${scriptErr.message || moduleErr.message}`,
      };
    }
  }
}

function normalizeJavaScriptAst(value) {
  if (Array.isArray(value)) {
    return value.map(item => normalizeJavaScriptAst(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const normalized = {};
  for (const key of Object.keys(value).sort()) {
    if (NON_SEMANTIC_KEYS.has(key)) continue;
    normalized[key] = normalizeJavaScriptAst(value[key]);
  }
  return normalized;
}

function semanticHashJavaScript(source, filePath = '<inline>') {
  const parsed = parseJavaScriptForSemanticHash(source, filePath);
  if (!parsed.ok) return parsed;

  const canonical = JSON.stringify(normalizeJavaScriptAst(parsed.ast));
  return {
    ok: true,
    hash: crypto.createHash('sha256').update(canonical).digest('hex'),
    sourceType: parsed.sourceType,
  };
}

module.exports = {
  normalizeJavaScriptAst,
  parseJavaScriptForSemanticHash,
  semanticHashJavaScript,
};
