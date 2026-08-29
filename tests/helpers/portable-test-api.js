'use strict';

if (process.versions.bun) {
  module.exports = require('bun:test');
} else {
  const { describe, test } = require('node:test');
  const { expect } = require('expect');

  module.exports = { describe, expect, test };
}
