'use strict';

// Shared by the suites that inject filesystem failures through an fs seam.

// An error shaped like the ones Node's fs throws: the code is what callers branch on.
function fileError(code) {
  return Object.assign(new Error(code), { code });
}

module.exports = { fileError };
