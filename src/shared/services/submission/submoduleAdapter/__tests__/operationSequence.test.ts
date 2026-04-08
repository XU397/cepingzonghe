import { describe, it, expect } from 'vitest';
import { createOperationSequence } from '../operationSequence';

describe('operationSequence', () => {
  it('returns 1 on first next() call and increments afterwards', () => {
    const sequence = createOperationSequence();

    expect(sequence.next()).toBe(1);
    expect(sequence.next()).toBe(2);
    expect(sequence.next()).toBe(3);
  });

  it('resets to initial state so next() starts from 1 again', () => {
    const sequence = createOperationSequence();

    sequence.next();
    sequence.next();
    sequence.reset();

    expect(sequence.current()).toBe(0);
    expect(sequence.next()).toBe(1);
  });

  it('returns current value without incrementing', () => {
    const sequence = createOperationSequence();

    expect(sequence.current()).toBe(0);
    sequence.next();
    expect(sequence.current()).toBe(1);
    sequence.current();
    expect(sequence.next()).toBe(2);
  });
});
