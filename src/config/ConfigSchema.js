const Ajv = require('ajv');

// JSON Schema for GSD configuration
const configSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    version: {
      type: 'number',
      const: 1,
      description: 'Config version for future migrations'
    },
    working_context: {
      type: 'number',
      minimum: 10000,
      maximum: 180000,
      default: 100000,
      description: 'Your usable context in tokens before auto-compaction triggers'
    },
    chrome: {
      type: 'boolean',
      default: false,
      description: 'Enable Chrome browser integration (--chrome flag)'
    },
    dangerous_skip_permissions: {
      type: 'boolean',
      default: false,
      description: 'Skip all permission prompts (dangerous - use with caution)'
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
