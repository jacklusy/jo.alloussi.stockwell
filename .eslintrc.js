module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:import/typescript'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['boundaries', 'import'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      'babel-module': {},
    },
    // Only analyze static imports (v6+ defaults also cover export/require).
    'boundaries/dependency-nodes': ['import'],
    'boundaries/legacy-warnings': false,
    'boundaries/elements': [
      { type: 'core-domain', pattern: 'src/core/domain/*' },
      { type: 'core', pattern: 'src/core/*' },
      { type: 'feature-domain', pattern: 'src/features/*/domain/*' },
      { type: 'feature-application', pattern: 'src/features/*/application/*' },
      { type: 'feature-data', pattern: 'src/features/*/data/*' },
      { type: 'feature-presentation', pattern: 'src/features/*/presentation/*' },
      { type: 'ui', pattern: 'src/ui/*' },
      { type: 'navigation', pattern: 'src/navigation/*' },
      { type: 'services', pattern: 'src/services/*' },
      { type: 'storage', pattern: 'src/storage/*' },
      { type: 'sync', pattern: 'src/sync/*' },
      { type: 'app', pattern: 'src/app/*' },
    ],
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    // Fire-and-forget promises are intentional in RN effects / schedulers.
    'no-void': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['Text'],
            message: 'Use @/ui Text primitive instead of react-native Text.',
          },
        ],
      },
    ],
    'boundaries/dependencies': [
      'error',
      {
        default: 'allow',
        policies: [
          {
            from: { type: ['core-domain', 'feature-domain'] },
            disallow: [
              { to: { type: 'feature-presentation' } },
              { to: { type: 'feature-data' } },
              { to: { type: 'ui' } },
              { to: { type: 'navigation' } },
              { to: { type: 'services' } },
              { to: { type: 'storage' } },
              { to: { type: 'sync' } },
              { to: { type: 'app' } },
            ],
            message:
              'Domain must stay pure — no React, RN, data, or infra imports.',
          },
          {
            // Use cases may orchestrate via injected sync/services/storage.
            // They must not reach into presentation, data, or UI.
            from: { type: 'feature-application' },
            disallow: [
              { to: { type: 'feature-presentation' } },
              { to: { type: 'feature-data' } },
              { to: { type: 'ui' } },
              { to: { type: 'navigation' } },
              { to: { type: 'app' } },
            ],
            message:
              'Application must not import presentation, data, ui, navigation, or app.',
          },
          {
            from: { type: 'feature-presentation' },
            disallow: [
              { to: { type: 'feature-data' } },
              { to: { type: 'storage' } },
              { to: { type: 'sync' } },
            ],
            message: 'Presentation must not import data, storage, or sync directly.',
          },
          {
            from: { type: 'ui' },
            disallow: [
              { to: { type: 'feature-domain' } },
              { to: { type: 'feature-application' } },
              { to: { type: 'feature-data' } },
              { to: { type: 'feature-presentation' } },
              { to: { type: 'services' } },
              { to: { type: 'storage' } },
              { to: { type: 'sync' } },
            ],
            message: 'UI kit must not know the domain.',
          },
          {
            from: { type: 'navigation' },
            disallow: [
              { to: { type: 'feature-data' } },
              { to: { type: 'storage' } },
              { to: { type: 'sync' } },
            ],
            message: 'Navigation must not import data, storage, or sync.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/ui/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
        'react-native/no-inline-styles': 'off',
      },
    },
    {
      files: ['src/features/*/presentation/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['Text'],
                message: 'Use @/ui Text primitive — raw RN Text is banned in features/.',
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        '**/*.{test,spec}.{ts,tsx}',
        '**/__tests__/**',
        'scripts/**',
        '*.config.js',
        'jest.setup.js',
      ],
      rules: {
        'boundaries/dependencies': 'off',
        'no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'coverage/',
    '*.config.js',
    'babel.config.js',
    'metro.config.js',
    'commitlint.config.js',
    'react-native.config.js',
    'jest.setup.js',
  ],
};
