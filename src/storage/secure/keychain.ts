import * as Keychain from 'react-native-keychain';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const SERVICE = 'stockwell.tokens';

/**
 * Tokens live in Keychain / Keystore only.
 * BIOMETRY_CURRENT_SET so a new fingerprint invalidates the entry.
 */
export async function saveTokens(
  tokens: TokenPair,
  options?: { requireBiometry?: boolean },
): Promise<void> {
  const base = {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  } as const;

  if (options?.requireBiometry) {
    await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
      ...base,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    });
    return;
  }

  await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), base);
}

export async function loadTokens(): Promise<TokenPair | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) {
    return null;
  }
  try {
    const parsed = JSON.parse(result.password) as TokenPair;
    if (typeof parsed.accessToken === 'string' && typeof parsed.refreshToken === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

export async function getSupportedBiometry(): Promise<string | null> {
  return Keychain.getSupportedBiometryType();
}
