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
    'boundaries/element-types': [
      'error',
      {
        default: 'allow',
        rules: [
          {
            from: ['core-domain', 'feature-domain'],
            disallow: [
              'feature-presentation',
              'feature-data',
              'ui',
              'navigation',
              'services',
              'storage',
              'sync',
              'app',
            ],
            message: 'Domain must stay pure — no React, RN, data, or infra imports.',
          },
          {
            from: ['feature-application'],
            disallow: [
              'feature-presentation',
              'feature-data',
              'ui',
              'navigation',
              'services',
              'storage',
              'sync',
              'app',
            ],
            message: 'Application may only import domain.',
          },
          {
            from: ['feature-presentation'],
            disallow: ['feature-data', 'services', 'storage', 'sync'],
            message: 'Presentation must not import data or infrastructure directly.',
          },
          {
            from: ['ui'],
            disallow: [
              'feature-domain',
              'feature-application',
              'feature-data',
              'feature-presentation',
              'services',
              'storage',
              'sync',
            ],
            message: 'UI kit must not know the domain.',
          },
          {
            from: ['navigation'],
            disallow: ['feature-data', 'services', 'storage', 'sync'],
            message: 'Navigation must not import data or infrastructure.',
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
        'boundaries/element-types': 'off',
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
