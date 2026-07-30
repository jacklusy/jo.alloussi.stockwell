export type ColorTokens = {
  brand: {
    primary: string;
    primaryPressed: string;
    primarySubtle: string;
    onPrimary: string;
  };
  surface: {
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceSunken: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    onBrand: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
  };
  status: {
    success: string;
    successSubtle: string;
    warning: string;
    warningSubtle: string;
    danger: string;
    dangerSubtle: string;
    info: string;
    infoSubtle: string;
  };
  sync: {
    pending: string;
    syncing: string;
    synced: string;
    failed: string;
    conflict: string;
  };
};

/** Cool industrial slate + safety amber. */
export const lightColors: ColorTokens = {
  brand: {
    primary: '#B87709',
    primaryPressed: '#8B5E00',
    primarySubtle: '#FBF0D6',
    onPrimary: '#1A1406',
  },
  surface: {
    background: '#EEF2F4',
    surface: '#F7F9FA',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#E2E8EC',
  },
  text: {
    primary: '#1A2329',
    secondary: '#4A5A66',
    tertiary: '#5A6B78',
    inverse: '#F7F9FA',
    onBrand: '#1A1406',
  },
  border: {
    subtle: '#D5DEE4',
    default: '#6B7C88',
    strong: '#4A5A66',
    focus: '#B87709',
  },
  status: {
    success: '#1F7A4D',
    successSubtle: '#D8F0E4',
    warning: '#B86A00',
    warningSubtle: '#FCECCF',
    danger: '#C62828',
    dangerSubtle: '#F8D7D7',
    info: '#1B6B8A',
    infoSubtle: '#D4EBF4',
  },
  sync: {
    pending: '#B87709',
    syncing: '#1B6B8A',
    synced: '#1F7A4D',
    failed: '#B86A00',
    conflict: '#C62828',
  },
};

/** Dark: surfaces lift from #12161A; amber slightly desaturated. */
export const darkColors: ColorTokens = {
  brand: {
    primary: '#E8A820',
    primaryPressed: '#C99214',
    primarySubtle: '#3A2E12',
    onPrimary: '#1A1406',
  },
  surface: {
    background: '#12161A',
    surface: '#1A2026',
    surfaceRaised: '#232B33',
    surfaceSunken: '#0E1216',
  },
  text: {
    primary: '#E8EEF2',
    secondary: '#A8B6C0',
    tertiary: '#7E8F9B',
    inverse: '#1A2329',
    onBrand: '#1A1406',
  },
  border: {
    subtle: '#2A333C',
    default: '#6A7B88',
    strong: '#8A9BA8',
    focus: '#E8A820',
  },
  status: {
    success: '#3DAB72',
    successSubtle: '#1A3A2A',
    warning: '#E0A03A',
    warningSubtle: '#3A2E12',
    danger: '#E05555',
    dangerSubtle: '#3A1818',
    info: '#4AA0C0',
    infoSubtle: '#1A3040',
  },
  sync: {
    pending: '#E8A820',
    syncing: '#4AA0C0',
    synced: '#3DAB72',
    failed: '#E0A03A',
    conflict: '#E05555',
  },
};
