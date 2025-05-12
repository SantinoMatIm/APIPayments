module.exports = {
    env: {
      node: true,
      es2021: true,
      jest: true,
      commonjs: true
    },
    extends: [
      'eslint:recommended',
      'plugin:jest/recommended'
    ],
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    plugins: ['jest'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always']
    }
  };