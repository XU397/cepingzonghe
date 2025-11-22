import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { ExperimentState, AnswerDraft, OperationLog, AnswerEntry } from '../types';
import { DEFAULT_HEIGHT } from '../constants/windSpeedData';

interface PvSandContextState {
  currentPageId: string;
  experimentState: ExperimentState;
  answerDraft: AnswerDraft;
  operationLogs: OperationLog[];
  answerList: AnswerEntry[];
  pageStartTime: Date | null;
  operationSequence: number;
  answerSequence: number;
}

type PvSandAction =
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'UPDATE_EXPERIMENT_STATE'; payload: Partial<ExperimentState> }
  | { type: 'UPDATE_ANSWER_DRAFT'; payload: Partial<AnswerDraft> }
  | { type: 'ADD_OPERATION'; payload: Omit<OperationLog, 'code'> }
  | { type: 'ADD_ANSWER'; payload: Omit<AnswerEntry, 'code'> }
  | { type: 'CLEAR_OPERATIONS' }
  | { type: 'CLEAR_ANSWERS' }
  | { type: 'SET_PAGE_START_TIME'; payload: Date }
  | { type: 'RESET_SEQUENCES' };

interface PvSandContextValue extends PvSandContextState {
  dispatch: React.Dispatch<PvSandAction>;
  logOperation: (operation: Omit<OperationLog, 'code'>) => void;
  collectAnswer: (answer: Omit<AnswerEntry, 'code'>) => void;
  clearOperations: () => void;
  clearAnswers: () => void;
  navigateToPage: (pageId: string) => void;
  setPageStartTime: (time: Date) => void;
  updateExperimentState: (updates: Partial<ExperimentState>) => void;
  updateAnswerDraft: (updates: Partial<AnswerDraft>) => void;
  resetSequences: () => void;
  // Aliases for compatibility with standard hooks
  operations: OperationLog[];
  answers: Record<string, string | number | boolean | null>;
}

const initialExperimentState: ExperimentState = {
  currentHeight: DEFAULT_HEIGHT,
  isRunning: false,
  isCompleted: false,
  animationState: 'idle',
  animationStartTime: null,
  animationDuration: 2000,
  collectedData: null,
  operationHistory: []
};

const initialAnswerDraft: AnswerDraft = {
  pageAnswers: {},
  experimentAnswers: {
    designReason: '',
    tutorialCompleted: false,
    experiment1Choice: null,
    experiment2Analysis: '',
    conclusionAnswers: {
      selectedOption: '',
      reason: ''
    }
  },
  metadata: {
    submoduleId: 'g8-pv-sand-experiment',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    totalPages: 8,
    completedPages: []
  }
};

const initialState: PvSandContextState = {
  currentPageId: 'instructions_cover',
  experimentState: initialExperimentState,
  answerDraft: initialAnswerDraft,
  operationLogs: [],
  answerList: [],
  pageStartTime: null,
  operationSequence: 1,
  answerSequence: 1
};

function pvSandReducer(state: PvSandContextState, action: PvSandAction): PvSandContextState {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPageId: action.payload };

    case 'UPDATE_EXPERIMENT_STATE':
      return {
        ...state,
        experimentState: { ...state.experimentState, ...action.payload }
      };

    case 'UPDATE_ANSWER_DRAFT':
      const updatedAnswerDraft = {
        ...state.answerDraft,
        ...action.payload,
        metadata: {
          ...state.answerDraft.metadata,
          lastSavedAt: new Date().toISOString()
        }
      };
      return { ...state, answerDraft: updatedAnswerDraft };

    case 'ADD_OPERATION':
      const newOperation: OperationLog = {
        ...action.payload,
        pageId: action.payload.pageId || state.currentPageId,
        code: state.operationSequence,
      };
      return {
        ...state,
        operationLogs: [...state.operationLogs, newOperation],
        operationSequence: state.operationSequence + 1
      };

    case 'ADD_ANSWER':
      const pageId = action.payload.pageId || state.currentPageId;
      const updatedPageAnswers = {
        ...state.answerDraft.pageAnswers,
        [pageId]: {
          ...(state.answerDraft.pageAnswers[pageId] || {}),
          [action.payload.targetElement]: {
            value: action.payload.value,
            lastModified: new Date().toISOString(),
            isValid: true,
            validationMessage: undefined,
          },
        },
      };
      const newAnswer: AnswerEntry = {
        ...action.payload,
        pageId,
        value: String(action.payload.value ?? ''),
        code: state.answerSequence
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

    case 'CLEAR_OPERATIONS':
      return { ...state, operationLogs: [] };

    case 'CLEAR_ANSWERS':
      return { ...state, answerList: [] };

    case 'SET_PAGE_START_TIME':
      return { ...state, pageStartTime: action.payload };

    case 'RESET_SEQUENCES':
      return { ...state, operationSequence: 1, answerSequence: 1 };

    default:
      return state;
  }
}

const PvSandContext = createContext<PvSandContextValue | undefined>(undefined);

export const PvSandProvider: React.FC<{
  children: ReactNode;
  initialPageId?: string
}> = ({ children, initialPageId = 'instructions_cover' }) => {
  const [state, dispatch] = useReducer(pvSandReducer, {
    ...initialState,
    currentPageId: initialPageId
  });

  const currentPageRef = useRef(initialPageId);
  currentPageRef.current = state.currentPageId;

  const logOperation = useCallback((operation: Omit<OperationLog, 'code'>) => {
    dispatch({
      type: 'ADD_OPERATION',
      payload: {
        ...operation,
        pageId: operation.pageId || currentPageRef.current,
      },
    });
  }, []);

  const collectAnswer = useCallback(
    (answer: Omit<AnswerEntry, 'code'> & { pageId?: string }) => {
      const pageId = answer.pageId || currentPageRef.current;
      dispatch({
        type: 'ADD_ANSWER',
        payload: {
          ...answer,
          pageId,
        },
      });
    },
    [],
  );

  const clearOperations = useCallback(() => {
    dispatch({ type: 'CLEAR_OPERATIONS' });
  }, []);

  const clearAnswers = useCallback(() => {
    dispatch({ type: 'CLEAR_ANSWERS' });
  }, []);

  const navigateToPage = useCallback((pageId: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
  }, []);

  const setPageStartTime = useCallback((time: Date) => {
    dispatch({ type: 'SET_PAGE_START_TIME', payload: time });
  }, []);

  const updateExperimentState = useCallback((updates: Partial<ExperimentState>) => {
    dispatch({ type: 'UPDATE_EXPERIMENT_STATE', payload: updates });
  }, []);

  const updateAnswerDraft = useCallback((updates: Partial<AnswerDraft>) => {
    dispatch({ type: 'UPDATE_ANSWER_DRAFT', payload: updates });
  }, []);

  const resetSequences = useCallback(() => {
    dispatch({ type: 'RESET_SEQUENCES' });
  }, []);

  // Memoize the answers object to prevent unnecessary re-renders
  const answers = useMemo(() => {
    return Object.values(state.answerDraft.pageAnswers).reduce(
      (acc, pageAns) => {
        Object.entries(pageAns).forEach(([key, val]) => {
          acc[key] = val.value;
        });
        return acc;
      },
      {} as Record<string, string | number | boolean | null>,
    );
  }, [state.answerDraft.pageAnswers]);

  // Memoize the entire context value
  const contextValue: PvSandContextValue = useMemo(() => ({
    ...state,
    dispatch,
    logOperation,
    collectAnswer,
    clearOperations,
    clearAnswers,
    navigateToPage,
    setPageStartTime,
    updateExperimentState,
    updateAnswerDraft,
    resetSequences,
    // Aliases
    operations: state.operationLogs,
    answers
  }), [
    state,
    logOperation,
    collectAnswer,
    clearOperations,
    clearAnswers,
    navigateToPage,
    setPageStartTime,
    updateExperimentState,
    updateAnswerDraft,
    answers
  ]);

  return (
    <PvSandContext.Provider value={contextValue}>
      {children}
    </PvSandContext.Provider>
  );
};

export const usePvSandContext = (): PvSandContextValue => {
  const context = useContext(PvSandContext);
  if (!context) {
    throw new Error('usePvSandContext must be used within a PvSandProvider');
  }
  return context;
};

export default PvSandContext;
