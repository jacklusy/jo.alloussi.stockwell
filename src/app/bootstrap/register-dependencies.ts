/**
 * DI registration — called once at bootstrap.
 * Epic 2+ registers repositories, sync engine, HTTP client, etc.
 */
import { Container, container, TOKENS } from '@/core/di';

export function registerDependencies(target: Container = container): void {
  // Sentinel so tests can assert bootstrap ran. Real services land in Epic 2.
  target.registerInstance(TOKENS.LOGGER, {
    debug: (_msg: string) => undefined,
    info: (_msg: string) => undefined,
    warn: (_msg: string) => undefined,
    error: (_msg: string) => undefined,
  });
}

/** Isolated container for tests — swap fakes without touching the app singleton. */
export function createTestContainer(): Container {
  const testContainer = Container.createEmpty();
  registerDependencies(testContainer);
  return testContainer;
}
