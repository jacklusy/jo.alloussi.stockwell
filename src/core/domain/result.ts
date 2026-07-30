export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const Result = {
  ok<T>(value: T): Ok<T> {
    return { ok: true, value };
  },
  err<E>(error: E): Err<E> {
    return { ok: false, error };
  },
  isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok;
  },
  isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return !result.ok;
  },
} as const;
