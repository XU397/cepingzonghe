import { OperationSequence } from './operationSequence';

export interface PageStateResetOptions {
  resetFlowContextFlag?: boolean;
}

// eslint-disable-next-line no-unused-vars
export function createPageStateResetter(
  sequence: OperationSequence,
  setFlowContextInjected?: (/* eslint-disable */ _value: boolean) => void
) {
  return function resetPageState(options: PageStateResetOptions = {}) {
    const { resetFlowContextFlag = true } = options;

    sequence.reset();

    if (resetFlowContextFlag && setFlowContextInjected) {
      setFlowContextInjected(false);
    }
  };
}
