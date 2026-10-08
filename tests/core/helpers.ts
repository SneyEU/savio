import type { Clock, IdGenerator } from '../../src/core/ports';

/** Horloge contrôlable pour simuler le passage des jours. */
export class FakeClock implements Clock {
  private current: Date;
  constructor(start = '2026-01-05T09:00:00.000Z') {
    this.current = new Date(start);
  }
  now(): Date {
    return new Date(this.current);
  }
  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * 86_400_000);
  }
  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export class SequentialIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}
