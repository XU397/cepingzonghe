import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createOperationSequence,
  createPageStateResetter,
  injectFlowContext,
  shouldInjectFlowContext,
} from '@shared/services/submission/submoduleAdapter';
import type { Operation as AdapterOperation } from '@shared/services/submission/submoduleAdapter';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import { formatTimestamp } from '@shared/services/submission/createMarkObject.js';
import EventTypes from '@shared/services/submission/eventTypes.js';
import type { SubmoduleProps } from '../types';
import type { AnswerDraft, AnswerEntry, FlowContextData, OperationLog } from '../types';
import { getSubPageNumByPageId, type PageId } from '../mapping';

interface G8BananaBrowningContextState {
  currentPageId: string;
  answerDraft: AnswerDraft;
  operationLogs: OperationLog[];
  answerList: AnswerEntry[];
  pageStartTime: Date | null;
  answerSequence: number;
  flowContext: FlowContextData | null;
  validationError: string;
}

type G8BananaBrowningAction =
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'ADD_OPERATION'; payload: OperationLog }
  | { type: 'ADD_ANSWER'; payload: Omit<AnswerEntry, 'code'> }
  | { type: 'CLEAR_OPERATIONS' }
  | { type: 'SET_PAGE_START_TIME'; payload: Date }
  | { type: 'RESET_SEQUENCES' }
  | { type: 'SET_FLOW_CONTEXT'; payload: FlowContextData | null }
  | { type: 'SET_VALIDATION_ERROR'; payload: string };

interface G8BananaBrowningContextValue extends G8BananaBrowningContextState {
  flowContextInjected: boolean;
  logOperation: (operation: Omit<OperationLog, 'code'>) => void;
  collectAnswer: (answer: Omit<AnswerEntry, 'code'> & { pageId?: string }) => void;
  clearOperations: () => void;
  navigateToPage: (pageId: string) => void;
  setPageStartTime: (time: Date) => void;
  setFlowContext: (flowContext: FlowContextData | null) => void;
  setValidationError: (error: string) => void;
  getPagePrefix: () => string;
  operations: OperationLog[];
  answers: Record<string, string | number | boolean | null>;
  taskDurationMinutes: number;
}

const initialAnswerDraft: AnswerDraft = {
  pageAnswers: {},
  metadata: {
    submoduleId: 'g8-banana-browning-experiment',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    totalPages: 14,
    completedPages: [],
  },
};

const initialState: G8BananaBrowningContextState = {
  currentPageId: 'intro_notice',
  answerDraft: initialAnswerDraft,
  operationLogs: [],
  answerList: [],
  pageStartTime: null,
  answerSequence: 1,
  flowContext: null,
  validationError: '',
};

function isInjectableFlowContext(
  flowContext: FlowContextData | null
): flowContext is Required<Pick<FlowContextData, 'flowId' | 'submoduleId' | 'stepIndex'>> {
  return Boolean(
    flowContext &&
    typeof flowContext.flowId === 'string' &&
    typeof flowContext.submoduleId === 'string' &&
    typeof flowContext.stepIndex === 'number'
  );
}

function normalizeOperationValueForAdapter(value: OperationLog['value']): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function normalizeOperationsForAdapter(operations: OperationLog[]): AdapterOperation[] {
  return operations.map(({ code, targetElement, eventType, value, time }) => ({
    code,
    targetElement,
    eventType,
    value: normalizeOperationValueForAdapter(value),
    time,
  }));
}

function toLocalOperationLog(operation: AdapterOperation, pageId?: string): OperationLog {
  return {
    ...operation,
    pageId,
  };
}

function reducer(
  state: G8BananaBrowningContextState,
  action: G8BananaBrowningAction
): G8BananaBrowningContextState {
  switch (action.type) {
    case 'SET_CURRENT_PAGE': {
      return { ...state, currentPageId: action.payload };
    }
    case 'ADD_OPERATION': {
      return {
        ...state,
        operationLogs: [...state.operationLogs, action.payload],
      };
    }
    case 'ADD_ANSWER': {
      const pageId = action.payload.pageId || state.currentPageId;
      const updatedPageAnswers = {
        ...state.answerDraft.pageAnswers,
        [pageId]: {
          ...(state.answerDraft.pageAnswers[pageId] || {}),
          [action.payload.targetElement]: {
            value: action.payload.value,
            lastModified: new Date().toISOString(),
            isValid: true,
          },
        },
      };

      const newAnswer: AnswerEntry = {
        ...action.payload,
        pageId,
        value: String(action.payload.value ?? ''),
        code: state.answerSequence,
      };

      return {
        ...state,
        answerList: [...state.answerList, newAnswer],
        answerSequence: state.answerSequence + 1,
        answerDraft: {
          ...state.answerDraft,
          pageAnswers: updatedPageAnswers,
          metadata: {
            ...state.answerDraft.metadata,
            lastSavedAt: new Date().toISOString(),
          },
        },
      };
    }
    case 'CLEAR_OPERATIONS': {
      return { ...state, operationLogs: [] };
    }
    case 'SET_PAGE_START_TIME': {
      return { ...state, pageStartTime: action.payload };
    }
    case 'RESET_SEQUENCES': {
      return { ...state, answerSequence: 1 };
    }
    case 'SET_FLOW_CONTEXT': {
      return { ...state, flowContext: action.payload };
    }
    case 'SET_VALIDATION_ERROR': {
      return { ...state, validationError: action.payload };
    }
    default: {
      return state;
    }
  }
}

const G8BananaBrowningContext = createContext<G8BananaBrowningContextValue | undefined>(undefined);

interface G8BananaBrowningProviderProps {
  children: ReactNode;
  initialPageId?: string;
  options?: SubmoduleProps['options'];
  initialFlowContext?: FlowContextData | null;
}

export const G8BananaBrowningProvider: React.FC<G8BananaBrowningProviderProps> = ({
  children,
  initialPageId = 'intro_notice',
  options,
  initialFlowContext = null,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currentPageId: initialPageId,
    flowContext: initialFlowContext,
  });
  const sequenceRef = useRef(createOperationSequence());
  const flowContextRef = useRef<FlowContextData | null>(initialFlowContext);
  const flowContextInjectedRef = useRef(false);
  const [flowContextInjected, setFlowContextInjected] = useState(false);

  const pageResetter = useMemo(
    () =>
      createPageStateResetter(sequenceRef.current, (value: boolean) => {
        flowContextInjectedRef.current = value;
        setFlowContextInjected(value);
      }),
    []
  );

  const currentPageRef = useRef(initialPageId);
  currentPageRef.current = state.currentPageId;

  const operationsRef = useRef<OperationLog[]>([]);
  operationsRef.current = state.operationLogs;

  const logOperation = useCallback((operation: Omit<OperationLog, 'code'>) => {
    const code = sequenceRef.current.next();
    const pageId = operation.pageId || currentPageRef.current;
    const normalizedTime = formatTimestamp(operation.time ? new Date(operation.time) : new Date());
    const operationWithCode: OperationLog = {
      ...operation,
      code,
      pageId,
      time: normalizedTime,
    };

    dispatch({
      type: 'ADD_OPERATION',
      payload: operationWithCode,
    });

    const isPageEnter = operation.eventType === EventTypes.PAGE_ENTER;
    const currentFlowContext = flowContextRef.current;

    if (
      isPageEnter &&
      isInjectableFlowContext(currentFlowContext) &&
      !flowContextInjectedRef.current
    ) {
      const flowContextPayload = {
        flowId: currentFlowContext.flowId,
        submoduleId: currentFlowContext.submoduleId,
        stepIndex: currentFlowContext.stepIndex,
        moduleName: '8年级香蕉变黑科学探究',
        pageId,
      };

      const normalizedCurrentOperations = normalizeOperationsForAdapter(operationsRef.current);

      if (!shouldInjectFlowContext(normalizedCurrentOperations, flowContextPayload)) {
        return;
      }

      const tempOperations = [...operationsRef.current, operationWithCode];
      const normalizedTempOperations = normalizeOperationsForAdapter(tempOperations);
      const injectedOperations = injectFlowContext(
        normalizedTempOperations,
        flowContextPayload,
        sequenceRef.current,
        { allowMissingPageEnter: true }
      );

      const flowContextOp = injectedOperations.find(
        op =>
          op.eventType === EventTypes.FLOW_CONTEXT &&
          !operationsRef.current.some(existing => existing.code === op.code)
      );

      if (flowContextOp) {
        dispatch({
          type: 'ADD_OPERATION',
          payload: toLocalOperationLog(flowContextOp, pageId),
        });
      }

      flowContextInjectedRef.current = true;
      setFlowContextInjected(true);
    }
  }, []);

  const collectAnswer = useCallback((answer: Omit<AnswerEntry, 'code'> & { pageId?: string }) => {
    const pageId = answer.pageId || currentPageRef.current;
    dispatch({
      type: 'ADD_ANSWER',
      payload: {
        ...answer,
        pageId,
      },
    });
  }, []);

  const clearOperations = useCallback(() => {
    pageResetter();
    dispatch({ type: 'CLEAR_OPERATIONS' });
  }, [pageResetter]);

  const navigateToPage = useCallback(
    (pageId: string) => {
      pageResetter();
      dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
    },
    [pageResetter]
  );

  const setPageStartTime = useCallback((time: Date) => {
    dispatch({ type: 'SET_PAGE_START_TIME', payload: time });
  }, []);

  const setFlowContext = useCallback((flowContext: FlowContextData | null) => {
    flowContextRef.current = flowContext;
    dispatch({ type: 'SET_FLOW_CONTEXT', payload: flowContext });
  }, []);

  const setValidationError = useCallback((error: string) => {
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: error });
  }, []);

  const getPagePrefix = useCallback(() => {
    const subPageNum = getSubPageNumByPageId(state.currentPageId as PageId);
    const flowStepIndex = state.flowContext?.stepIndex;
    const safeStep = typeof flowStepIndex === 'number' ? flowStepIndex + 1 : 1;
    const pageNumber = encodeCompositePageNum(safeStep, subPageNum);
    return `P${pageNumber}_`;
  }, [state.currentPageId, state.flowContext?.stepIndex]);

  const answers = useMemo(() => {
    return Object.values(state.answerDraft.pageAnswers).reduce(
      (acc, pageAns) => {
        Object.entries(pageAns).forEach(([key, val]) => {
          acc[key] = val.value;
        });
        return acc;
      },
      {} as Record<string, string | number | boolean | null>
    );
  }, [state.answerDraft.pageAnswers]);

  const taskDurationMinutes = useMemo(() => {
    const taskSeconds = options?.timers?.task ?? 40 * 60;
    return Math.round(taskSeconds / 60);
  }, [options?.timers?.task]);

  const contextValue: G8BananaBrowningContextValue = useMemo(
    () => ({
      ...state,
      logOperation,
      collectAnswer,
      clearOperations,
      navigateToPage,
      setPageStartTime,
      setFlowContext,
      setValidationError,
      flowContextInjected,
      getPagePrefix,
      operations: state.operationLogs,
      answers,
      taskDurationMinutes,
    }),
    [
      state,
      logOperation,
      collectAnswer,
      clearOperations,
      navigateToPage,
      setPageStartTime,
      setFlowContext,
      setValidationError,
      flowContextInjected,
      getPagePrefix,
      answers,
      taskDurationMinutes,
    ]
  );

  return (
    <G8BananaBrowningContext.Provider value={contextValue}>
      {children}
    </G8BananaBrowningContext.Provider>
  );
};

export const useG8BananaBrowningContext = (): G8BananaBrowningContextValue => {
  const context = useContext(G8BananaBrowningContext);
  if (!context) {
    throw new Error('useG8BananaBrowningContext must be used within a G8BananaBrowningProvider');
  }
  return context;
};

export default G8BananaBrowningContext;
