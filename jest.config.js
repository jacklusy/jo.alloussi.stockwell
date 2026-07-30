module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-mmkv|react-native-haptic-feedback|@gorhom|react-native-worklets|react-native-svg|react-native-vision-camera|react-native-permissions)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/__tests__/helpers/'],
  collectCoverageFrom: [
    'src/sync/**/*.{ts,tsx}',
    'src/features/**/domain/**/*.{ts,tsx}',
    'src/features/**/application/**/*.{ts,tsx}',
    'src/services/api/**/*.{ts,tsx}',
    'src/services/auth/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 50,
      statements: 50,
      functions: 40,
      branches: 35,
    },
    './src/sync/': {
      lines: 70,
      statements: 70,
      functions: 60,
      branches: 50,
    },
  },
};
