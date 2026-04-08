export interface OperationSequence {
  next(): number;
  reset(): void;
  current(): number;
}

export function createOperationSequence(): OperationSequence {
  let current = 0;

  return {
    next() {
      current += 1;
      return current;
    },
    reset() {
      current = 0;
    },
    current() {
      return current;
    },
  };
}
