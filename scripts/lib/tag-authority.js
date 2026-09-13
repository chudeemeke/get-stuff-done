'use strict';

// Safe for a single-line YAML comment while still covering ordinary Git tags,
// including numeric majors, stable channels and release-v2 style names.
function isSafeTagLabel(value) {
  if (typeof value !== 'string' || !value || value === '@') return false;
  // Match Git's ref-name restrictions while also keeping the generated YAML
  // comment on one line. Characters such as + and # are valid tag content.
  if (/[\x00-\x20\x7f~^:?*[\\\u2028\u2029]/.test(value)) return false;
  if (value.includes('..') || value.includes('@{') || value.includes('//')) return false;
  if (value.startsWith('/') || value.endsWith('/') || value.endsWith('.')) return false;
  return value.split('/').every(part => part && !part.startsWith('.') && !part.endsWith('.lock'));
}

module.exports = { isSafeTagLabel };
