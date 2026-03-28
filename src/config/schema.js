'use strict';

/**
 * AJV Schema for .planning/config.json
 *
 * This schema validates the project-level planning config, which stores
 * model profile, memory, effort, and teams settings. It is separate from
 * src/config/ConfigSchema.js, which validates ~/.gsd/config.json (user-level).
 *
 * Exports:
 *   planningConfigSchema -- AJV-compatible JSON Schema Draft-07 object
 *   validatePlanningConfig(config) -- validates config, returns {ok, errors?}
 */

const Ajv = require('ajv');

const planningConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    // Flat keys (gsd-tools.js loadConfig top-level format)
    model_profile: { type: 'string', enum: ['quality', 'balanced', 'budget'] },
    commit_docs: { type: 'boolean' },
    search_gitignored: { type: 'boolean' },
    skip_research: { type: 'boolean' },
    skip_plan_check: { type: 'boolean' },
    skip_verification: { type: 'boolean' },
    branch_per_phase: { type: 'boolean' },
    branching_strategy: { type: 'string', enum: ['none', 'phase', 'milestone'] },
    phase_branch_template: { type: 'string' },
    milestone_branch_template: { type: 'string' },
    research: { type: 'boolean' },
    plan_checker: { type: 'boolean' },
    verifier: { type: 'boolean' },
    parallelization: {
      oneOf: [
        { type: 'boolean' },
        {
          type: 'object',
          properties: { enabled: { type: 'boolean' } },
          required: ['enabled'],
          additionalProperties: false
        }
      ]
    },
    // Nested sections (gsd-tools.js loadConfig nested format)
    planning: {
      type: 'object',
      properties: {
        commit_docs: { type: 'boolean' },
        search_gitignored: { type: 'boolean' }
      },
      additionalProperties: false
    },
    git: {
      type: 'object',
      properties: {
        branching_strategy: { type: 'string', enum: ['none', 'phase', 'milestone'] },
        phase_branch_template: { type: 'string' },
        milestone_branch_template: { type: 'string' }
      },
      additionalProperties: false
    },
    workflow: {
      type: 'object',
      properties: {
        research: { type: 'boolean' },
        plan_check: { type: 'boolean' },
        verifier: { type: 'boolean' },
        auto_advance: { type: 'boolean' },
        nyquist_validation: { type: 'boolean' }
      },
      additionalProperties: false
    },
    gsd: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['maintainer', 'consumer'] }
      },
      additionalProperties: false
    },
    // Phase 10 sections -- fully specified with real sub-properties
    memory: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        location: { type: 'string' },
        curation: { type: 'string', enum: ['auto', 'manual'] },
        staleness_check: { type: 'boolean' }
      },
      additionalProperties: false
    },
    effort: {
      type: 'object',
      properties: {
        default: { type: 'string' },
        // keys are dynamic agent names, values are effort level strings
        agents: { type: 'object' }
      },
      additionalProperties: false
    },
    teams: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        experimental_flag: { type: 'string' },
        oversight: {
          type: 'object',
          properties: {
            default: { type: 'boolean' },
            // keys are workflow names, values are booleans
            per_workflow: { type: 'object' }
          },
          additionalProperties: false
        },
        soft_cap: { type: 'number', minimum: 1 }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

const ajv = new Ajv({ allErrors: true });
const _validate = ajv.compile(planningConfigSchema);

/**
 * Validates a .planning/config.json object against the schema.
 * @param {object} config - Parsed config object
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
function validatePlanningConfig(config) {
  const valid = _validate(config);
  if (!valid) {
    const errors = (_validate.errors || []).map(e => {
      const fieldPath = e.instancePath || '';
      return fieldPath ? `${fieldPath}: ${e.message}` : e.message;
    });
    return { ok: false, errors };
  }
  return { ok: true };
}

module.exports = { planningConfigSchema, validatePlanningConfig };
