/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'prettier'
  ],
  ignorePatterns: ['dist', 'dist/**', 'coverage', 'coverage/**', 'node_modules', 'node_modules/**'],
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'info', 'debug']
      }
    ]
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
        node: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: ['**/*.config.cjs', '**/*.config.mjs', '**/*.config.ts', '**/*.config.js'],
      env: {
        node: true
      },
      parserOptions: {
        sourceType: 'module',
        project: null
      }
    }
  ]
};
