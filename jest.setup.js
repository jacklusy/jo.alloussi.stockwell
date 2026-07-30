/* eslint-env jest */

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: (key) => store.get(key),
      set: (key, value) => {
        store.set(key, value);
      },
      remove: (key) => {
        store.delete(key);
      },
      clearAll: () => {
        store.clear();
      },
    }),
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: { trigger: jest.fn() },
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View,
    createAnimatedComponent: (Component) => Component,
    call: () => undefined,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    FadeInUp: { duration: () => ({}) },
    FadeOutUp: { duration: () => ({}) },
    Easing: {
      linear: 'linear',
      ease: 'ease',
      inOut: () => 'inOut',
      bezier: () => 'bezier',
    },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (fn) => fn(),
    withTiming: (value) => value,
    withRepeat: (value) => value,
    runOnJS: (fn) => fn,
  };
});

jest.mock('react-native-worklets', () => ({
  __esModule: true,
}));

jest.mock('react-native-gesture-handler', () => {
  const { View, ScrollView } = require('react-native');
  return {
    GestureHandlerRootView: View,
    ScrollView,
    Swipeable: View,
    DrawerLayout: View,
    PanGestureHandler: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    State: {},
    Directions: {},
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  enableFreeze: jest.fn(),
  Screen: require('react-native').View,
  ScreenContainer: require('react-native').View,
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: View,
    BottomSheetModalProvider: ({ children }) => children,
    BottomSheetBackdrop: View,
    BottomSheetView: View,
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
  };
});
