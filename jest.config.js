module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-mmkv|react-native-haptic-feedback|@gorhom|react-native-worklets|react-native-svg)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/__tests__/helpers/'],
};
