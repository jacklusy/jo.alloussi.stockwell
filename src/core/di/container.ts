import type { Token } from './tokens';

type Factory<T> = () => T;

/**
 * Hand-rolled DI container. Swap registrations in tests for in-memory fakes.
 */
export class Container {
  private readonly singletons = new Map<Token, unknown>();
  private readonly factories = new Map<Token, Factory<unknown>>();

  register<T>(token: Token, factory: Factory<T>): void {
    this.factories.set(token, factory as Factory<unknown>);
    this.singletons.delete(token);
  }

  registerInstance<T>(token: Token, instance: T): void {
    this.singletons.set(token, instance);
    this.factories.delete(token);
  }

  resolve<T>(token: Token): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }
    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`No registration for token: ${String(token)}`);
    }
    const instance = factory() as T;
    this.singletons.set(token, instance);
    return instance;
  }

  clear(): void {
    this.singletons.clear();
    this.factories.clear();
  }

  /** Create an isolated container for tests. */
  static createEmpty(): Container {
    return new Container();
  }
}

export const container = new Container();
