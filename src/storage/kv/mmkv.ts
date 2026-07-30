import { createMMKV } from 'react-native-mmkv';

/** Non-secret KV. Tokens must NEVER land here. */
export const kvStorage = createMMKV({ id: 'stockwell-kv' });
