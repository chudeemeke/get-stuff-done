'use strict';

// Safe for a single-line YAML comment while still covering ordinary Git tags,
// including numeric majors, stable channels and release-v2 style names.
function isSafeTagLabel(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value);
}

module.exports = { isSafeTagLabel };
