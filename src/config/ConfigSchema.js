const Ajv = require('ajv');

// JSON Schema for GSD configuration
const configSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    version: { type: 'number', const: 1 },
    context_management: {
      type: 'object',
      properties: {
        // Note: autocompact_threshold removed - Claude Code controls this internally
        // CLAUDE_AUTOCOMPACT_PCT_OVERRIDE env var has a known bug
        precompact_save_state: { type: 'boolean', default: true }
      },
      additionalProperties: false
    },
    workflow: {
      type: 'object',
      properties: {
        pause_between_tasks: { type: 'boolean', default: false },
        pause_between_phases: { type: 'boolean', default: true },
        auto_checkpoint_interval: { type: 'number', minimum: 1, maximum: 60, default: 5 }
      },
      additionalProperties: false
    },
    subagents: {
      type: 'object',
      properties: {
        default_model: { type: 'string', default: 'sonnet' },
        executor_model: { type: 'string', default: 'sonnet' },
        verifier_model: { type: 'string', default: 'sonnet' },
        researcher_model: { type: 'string', default: 'haiku' }
      },
      additionalProperties: false
    },
    ui: {
      type: 'object',
      properties: {
        show_progress_bar: { type: 'boolean', default: true },
        show_context_usage: { type: 'boolean', default: true },
        theme: { type: 'string', default: 'aidev' }
      },
      additionalProperties: false
    }
  },
  required: ['version'],
  additionalProperties: false
};

// Create validator
const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  coerceTypes: false
});

const validate = ajv.compile(configSchema);

/**
 * Validates configuration object against schema
 * @param {object} config - Configuration object to validate
 * @throws {Error} If validation fails with user-friendly message
 * @returns {object} The validated config (with defaults applied)
 */
function validateConfig(config) {
  const valid = validate(config);

  if (!valid) {
    const errors = validate.errors || [];
    const messages = [];

    for (const err of errors) {
      if (err.keyword === 'additionalProperties') {
        const unknownKey = err.params.additionalProperty;
        messages.push(`Unknown config key: "${unknownKey}"`);
      } else if (err.keyword === 'type') {
        const field = err.instancePath.replace(/^\//, '') || 'config';
        messages.push(`${field}: must be ${err.params.type}`);
      } else if (err.keyword === 'minimum') {
        const field = err.instancePath.replace(/^\//, '');
        messages.push(`${field}: must be >= ${err.params.limit}`);
      } else if (err.keyword === 'maximum') {
        const field = err.instancePath.replace(/^\//, '');
        messages.push(`${field}: must be <= ${err.params.limit}`);
      } else if (err.keyword === 'const') {
        const field = err.instancePath.replace(/^\//, '');
        messages.push(`${field}: must be ${err.params.allowedValue}`);
      } else if (err.keyword === 'required') {
        const missing = err.params.missingProperty;
        messages.push(`Missing required field: "${missing}"`);
      } else {
        // Fallback for other errors
        messages.push(err.message);
      }
    }

    throw new Error('Config validation failed:\n  ' + messages.join('\n  '));
  }

  return config;
}

module.exports = {
  configSchema,
  validateConfig
};
