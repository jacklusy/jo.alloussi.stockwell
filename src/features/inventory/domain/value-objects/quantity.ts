export class Quantity {
  private constructor(readonly value: number) {
    Object.freeze(this);
  }

  static create(value: number): Quantity {
    if (!Number.isFinite(value)) {
      throw new Error('Quantity must be finite');
    }
    return new Quantity(value);
  }

  add(other: Quantity): Quantity {
    return Quantity.create(this.value + other.value);
  }
}
