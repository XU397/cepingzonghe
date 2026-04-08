import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventTypes from '../eventTypes.js';
import { formatTimestamp } from '../createMarkObject.js';
import { isReservedElement } from './constants';
import { injectFlowContext, shouldInjectFlowContext } from './flowContextInjector';
import { createOperationSequence } from './operationSequence';
import { createPageStateResetter } from './pageStateReset';
import {
  LogOperationParams,
  Operation,
  OperationLoggerOptions,
  OperationLoggerResult,
} from './types';

const VALID_PREFIX_REGEX = /^P\d+\.\d{2}_/;

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

const prefixTargetElement = (targetElement: string, targetPrefix: string): string => {
  if (!targetElement || isReservedElement(targetElement)) {
    return targetElement;
  }
  if (targetElement.startsWith(targetPrefix) || VALID_PREFIX_REGEX.test(targetElement)) {
    return targetElement;
  }
  return `${targetPrefix}${targetElement}`;
};

/**
 * Stable logger template for submodule contexts.
 *
 * Differences vs common unstable pattern:
 * - `logOperation` keeps stable reference (`useCallback([])`)
 * - mutable runtime data is read from refs
 * - page-level flow_context injection state is tracked by ref + state mirror
 */
export function useStableOperationLogger(options: OperationLoggerOptions): OperationLoggerResult {
  const [operations, setOperations] = useState<Operation[]>([]);
  // eslint-disable-next-line no-unused-vars
  const [_flowContextInjected, setFlowContextInjected] = useState(false);

  const targetPrefixRef = useRef(options.targetPrefix);
  const flowContextRef = useRef(options.flowContext);
  const flowContextInjectedRef = useRef(false);

  const sequenceRef = useRef(createOperationSequence());
  const resetPageState = useMemo(
    () =>
      createPageStateResetter(sequenceRef.current, (value: boolean) => {
        flowContextInjectedRef.current = value;
        setFlowContextInjected(value);
      }),
    []
  );

  useEffect(() => {
    targetPrefixRef.current = options.targetPrefix;
  }, [options.targetPrefix]);

  useEffect(() => {
    flowContextRef.current = options.flowContext;
  }, [options.flowContext]);

  const logOperation = useCallback((params: LogOperationParams) => {
    const targetPrefix = targetPrefixRef.current;
    const targetElement = prefixTargetElement(params.targetElement, targetPrefix);

    const operation: Operation = {
      code: sequenceRef.current.next(),
      targetElement,
      eventType: params.eventType,
      value: normalizeValue(params.value),
      time: params.time || formatTimestamp(new Date()),
    };

    setOperations(prev => {
      const nextOperations = [...prev, operation];
      const flowContext = flowContextRef.current;

      if (
        params.eventType === EventTypes.PAGE_ENTER &&
        flowContext &&
        !flowContextInjectedRef.current &&
        shouldInjectFlowContext(nextOperations, flowContext)
      ) {
        const injectedOperations = injectFlowContext(
          nextOperations,
          flowContext,
          sequenceRef.current
        );
        flowContextInjectedRef.current = true;
        setFlowContextInjected(true);
        return injectedOperations;
      }

      return nextOperations;
    });
  }, []);

  const clearOperations = useCallback(() => {
    setOperations([]);
    resetPageState();
  }, [resetPageState]);

  const currentCode = sequenceRef.current.current();

  return useMemo(
    () => ({
      operations,
      logOperation,
      clearOperations,
      currentCode,
    }),
    [operations, logOperation, clearOperations, currentCode]
  );
}

export function useOperationLoggerTemplate(options: OperationLoggerOptions): OperationLoggerResult {
  return useStableOperationLogger(options);
}
