#!/usr/bin/env node
/**
 * bin/preview-update-cli.js -- CLI entry point for preview-update.
 *
 * Thin wrapper that delegates to the library module. Keeps the library
 * (scripts/preview-update.js) free of CLI concerns and fully testable.
 */
'use strict';

const { runCLI } = require('../scripts/preview-update');

const result = runCLI();
if (result.exitCode === 0) {
  console.log(result.output);
} else {
  console.error(result.output);
}
process.exit(result.exitCode);
