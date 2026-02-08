const security = require('eslint-plugin-security');

module.exports = [
  {
    ignores: ['node_modules/**', '.upstream/**', 'hooks/dist/**', 'assets/.backup/**']
  },
  {
    files: ['**/*.js'],
    plugins: {
      security
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Security rules - errors
      'security/detect-child-process': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'error',

      // Security rules - warnings (may have false positives)
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-object-injection': 'warn',
      'security/detect-unsafe-regex': 'warn'
    }
  }
];
