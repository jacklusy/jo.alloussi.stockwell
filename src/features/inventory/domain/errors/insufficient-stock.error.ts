import { DomainError } from '@/core/domain';

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';

  constructor(onHand: number, delta: number) {
    super(`Adjustment ${delta} would make on-hand ${onHand + delta} negative`);
  }
}
