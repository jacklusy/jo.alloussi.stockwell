import { Platform, type ViewStyle } from 'react-native';

export type ElevationLevel = 'flat' | 'raised' | 'overlay' | 'sticky';

type ElevationStyle = Pick<
  ViewStyle,
  | 'elevation'
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
  | 'borderWidth'
  | 'borderColor'
>;

const lightShadows: Record<ElevationLevel, ElevationStyle> = {
  flat: {
    elevation: 0,
    shadowOpacity: 0,
  },
  raised: Platform.select({
    ios: {
      shadowColor: '#0A1218',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: { elevation: 2 },
  }) as ElevationStyle,
  overlay: Platform.select({
    ios: {
      shadowColor: '#0A1218',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: { elevation: 8 },
  }) as ElevationStyle,
  sticky: Platform.select({
    ios: {
      shadowColor: '#0A1218',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: { elevation: 4 },
    default: { elevation: 4 },
  }) as ElevationStyle,
};

/** Dark mode: shadows are invisible — use subtle borders instead. */
const darkBorders = (borderColor: string): Record<ElevationLevel, ElevationStyle> => ({
  flat: { elevation: 0, borderWidth: 0 },
  raised: { elevation: 0, borderWidth: 1, borderColor },
  overlay: { elevation: 0, borderWidth: 1, borderColor },
  sticky: { elevation: 0, borderWidth: 1, borderColor },
});

export function getElevation(
  level: ElevationLevel,
  mode: 'light' | 'dark',
  borderColor: string,
): ElevationStyle {
  if (mode === 'dark') {
    return darkBorders(borderColor)[level];
  }
  return lightShadows[level];
}
