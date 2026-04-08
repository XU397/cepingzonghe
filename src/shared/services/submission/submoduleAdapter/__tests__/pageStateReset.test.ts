import { describe, it, expect } from 'vitest';
import { createOperationSequence } from '../operationSequence';
import { createPageStateResetter } from '../pageStateReset';

describe('pageStateReset', () => {
  it('resets the operation sequence to its initial state', () => {
    const sequence = createOperationSequence();
    const resetPageState = createPageStateResetter(sequence);

    sequence.next();
    sequence.next();
    resetPageState();

    expect(sequence.current()).toBe(0);
    expect(sequence.next()).toBe(1);
  });

  it('resets flowContextInjected flag by default', () => {
    const sequence = createOperationSequence();
    let flowContextInjected = true;
    const resetPageState = createPageStateResetter(sequence, value => {
      flowContextInjected = value;
    });

    resetPageState();

    expect(flowContextInjected).toBe(false);
    expect(sequence.current()).toBe(0);
  });

  it('does not reset the flag when resetFlowContextFlag is false', () => {
    const sequence = createOperationSequence();
    let flowContextInjected = true;
    const resetPageState = createPageStateResetter(sequence, value => {
      flowContextInjected = value;
    });

    sequence.next();
    resetPageState({ resetFlowContextFlag: false });

    expect(flowContextInjected).toBe(true);
    expect(sequence.current()).toBe(0);
  });

  it('works without setFlowContextInjected callback', () => {
    const sequence = createOperationSequence();
    const resetPageState = createPageStateResetter(sequence);

    sequence.next();
    resetPageState();

    expect(sequence.current()).toBe(0);
  });
});
