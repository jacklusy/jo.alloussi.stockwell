/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-react',
      comment: 'Domain must stay framework-free.',
      severity: 'error',
      from: { path: '^src/(core/domain|features/[^/]+/domain)' },
      to: {
        path: '^(react|react-native|axios|@react-navigation|zustand|react-native-)',
        pathNot: '^src/',
      },
    },
    {
      name: 'presentation-no-data',
      comment: 'Screens/hooks must not import data layer or sync/storage infrastructure.',
      severity: 'error',
      from: { path: '^src/features/[^/]+/presentation' },
      to: {
        path: '^src/(features/[^/]+/data|storage|sync)/',
      },
    },
    {
      name: 'ui-no-domain',
      comment: 'Design system must not know domain.',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: { path: '^src/features/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
