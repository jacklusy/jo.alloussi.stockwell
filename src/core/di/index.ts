import { useMemo } from 'react';

import { container } from './container';
import type { Token } from './tokens';

export function useService<T>(token: Token): T {
  return useMemo(() => container.resolve<T>(token), [token]);
}

export { container, Container } from './container';
export { TOKENS, type Token } from './tokens';
