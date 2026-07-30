export const en = {
  'app.name': 'Stockwell',
  'bootstrap.loading': 'Starting…',
  'login.subtitle': 'Sign in to continue',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.biometric': 'Unlock with biometrics',
  'login.offline': 'You need a connection to sign in the first time',
  'warehouse.title': 'Select warehouse',
  'warehouse.subtitle': 'This scopes sync and inventory queries.',
  'inventory.title': 'Inventory',
  'inventory.search': 'Search SKU or location',
  'inventory.adjust': 'Adjust stock',
  'inventory.confirmAdjust': 'Confirm adjustment',
  'inventory.emptyHeadline': 'No stock yet',
  'inventory.emptyBody': 'Balances will appear after the first sync.',
  'inventory.noResultsHeadline': 'No matches',
  'inventory.noResultsBody': 'Try a different SKU or location.',
  'inventory.errorHeadline': 'Could not load inventory',
  'inventory.retry': 'Retry',
  'sync.title': 'Sync centre',
  'sync.emptyHeadline': 'Everything synced',
  'sync.emptyBody': 'Pending, failed, and conflicted items will show here.',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.gallery': 'Component gallery',
  'settings.logout': 'Log out',
  'tabs.inventory': 'Inventory',
  'tabs.sync': 'Sync',
  'tabs.settings': 'Settings',
} as const;

export type TranslationKey = keyof typeof en;

export function t(key: TranslationKey): string {
  return en[key];
}
