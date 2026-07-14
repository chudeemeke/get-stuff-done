'use strict';

const { describe, expect, test } = require('bun:test');
const { canonicalJson } = require('../scripts/run-fable-checkpoint');

describe('Fable checkpoint authority', () => {
  test('canonicalizes checkpoint input recursively with one trailing LF', () => {
    const value = {
      zeta: 3,
      alpha: {
        second: true,
        first: ['preserve', 'array', 'order'],
      },
    };

    expect(canonicalJson(value)).toBe(
      '{"alpha":{"first":["preserve","array","order"],"second":true},"zeta":3}\n'
    );
  });
});
