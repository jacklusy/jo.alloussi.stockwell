import { Container, TOKENS } from '@/core/di';
import { createTestContainer } from '@/app/bootstrap/register-dependencies';

describe('DI container', () => {
  it('resolves registered singletons', () => {
    const c = Container.createEmpty();
    c.registerInstance(TOKENS.LOGGER, { info: () => undefined });
    expect(c.resolve(TOKENS.LOGGER)).toEqual({ info: expect.any(Function) });
  });

  it('createTestContainer is isolated from app singleton', () => {
    const a = createTestContainer();
    const b = createTestContainer();
    expect(a).not.toBe(b);
    expect(a.resolve(TOKENS.LOGGER)).toBeTruthy();
  });
});
