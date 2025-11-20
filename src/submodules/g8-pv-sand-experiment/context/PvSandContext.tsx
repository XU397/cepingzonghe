import React, { createContext, useContext, useReducer, ReactNode } from 'react';
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
  currentPageId: 'page01-instructions-cover',
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
        code: state.operationSequence
      };
      return {
        ...state,
        operationLogs: [...state.operationLogs, newOperation],
        operationSequence: state.operationSequence + 1
      };
    
    case 'ADD_ANSWER':
      const newAnswer: AnswerEntry = {
        ...action.payload,
        code: state.answerSequence
      };
      return {
        ...state,
        answerList: [...state.answerList, newAnswer],
        answerSequence: state.answerSequence + 1
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
}> = ({ children, initialPageId = 'page01-instructions-cover' }) => {
  const [state, dispatch] = useReducer(pvSandReducer, {
    ...initialState,
    currentPageId: initialPageId
  });

  const logOperation = (operation: Omit<OperationLog, 'code'>) => {
    dispatch({ type: 'ADD_OPERATION', payload: operation });
  };

  const collectAnswer = (answer: Omit<AnswerEntry, 'code'>) => {
    dispatch({ type: 'ADD_ANSWER', payload: answer });
  };

  const clearOperations = () => {
    dispatch({ type: 'CLEAR_OPERATIONS' });
  };

  const clearAnswers = () => {
    dispatch({ type: 'CLEAR_ANSWERS' });
  };

  const navigateToPage = (pageId: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
  };

  const setPageStartTime = (time: Date) => {
    dispatch({ type: 'SET_PAGE_START_TIME', payload: time });
  };

  const updateExperimentState = (updates: Partial<ExperimentState>) => {
    dispatch({ type: 'UPDATE_EXPERIMENT_STATE', payload: updates });
  };

  const updateAnswerDraft = (updates: Partial<AnswerDraft>) => {
    dispatch({ type: 'UPDATE_ANSWER_DRAFT', payload: updates });
  };

  const contextValue: PvSandContextValue = {
    ...state,
    dispatch,
    logOperation,
    collectAnswer,
    clearOperations,
    clearAnswers,
    navigateToPage,
    setPageStartTime,
    updateExperimentState,
    updateAnswerDraft
  };

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