import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SubmoduleProps } from '../types';
import { ExperimentState, AnswerDraft, OperationLog, AnswerEntry } from '../types';
import { DEFAULT_HEIGHT } from '../constants/windSpeedData';
import { getSubPageNumByPageId, PageId } from '../mapping';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import {
  createOperationSequence,
  createPageStateResetter,
  injectFlowContext,
  shouldInjectFlowContext,
} from '@shared/services/submission/submoduleAdapter';
import { formatTimestamp } from '@shared/services/submission/createMarkObject';
import { EventTypes } from '@shared/services/submission/eventTypes';

interface FlowContextData {
  flowId?: string;
  submoduleId?: string;
  stepIndex?: number;
}

interface PvSandContextState {
  currentPageId: string;
  experimentState: ExperimentState;
  answerDraft: AnswerDraft;
  operationLogs: OperationLog[];
  answerList: AnswerEntry[];
  pageStartTime: Date | null;
  answerSequence: number;
  flowContext: FlowContextData | null;
}

type PvSandAction =
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'UPDATE_EXPERIMENT_STATE'; payload: Partial<ExperimentState> }
  | { type: 'UPDATE_ANSWER_DRAFT'; payload: Partial<AnswerDraft> }
  | { type: 'ADD_OPERATION'; payload: OperationLog }
  | { type: 'ADD_ANSWER'; payload: Omit<AnswerEntry, 'code'> }
  | { type: 'CLEAR_OPERATIONS' }
  | { type: 'CLEAR_ANSWERS' }
  | { type: 'SET_PAGE_START_TIME'; payload: Date }
  | { type: 'RESET_SEQUENCES' }
  | { type: 'SET_FLOW_CONTEXT'; payload: FlowContextData | null };

interface PvSandContextValue extends PvSandContextState {
  dispatch: React.Dispatch<PvSandAction>;
  flowContextInjected: boolean;
  logOperation: (operation: Omit<OperationLog, 'code'>) => void;
  collectAnswer: (answer: Omit<AnswerEntry, 'code'>) => void;
  clearOperations: () => void;
  clearAnswers: () => void;
  navigateToPage: (pageId: string) => void;
  setPageStartTime: (time: Date) => void;
  updateExperimentState: (updates: Partial<ExperimentState>) => void;
  updateAnswerDraft: (updates: Partial<AnswerDraft>) => void;
  resetSequences: () => void;
  setFlowContext: (flowContext: FlowContextData | null) => void;
  getPagePrefix: () => string;
  // Aliases for compatibility with standard hooks
  operations: OperationLog[];
  answers: Record<string, string | number | boolean | null>;
  taskDurationMinutes: number;
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
  answerSequence: 1,
  flowContext: null,
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
      return {
        ...state,
        operationLogs: [...state.operationLogs, action.payload as OperationLog],
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
      return { ...state, answerSequence: 1 };

    case 'SET_FLOW_CONTEXT':
      return { ...state, flowContext: action.payload };

    default:
      return state;
  }
}

const PvSandContext = createContext<PvSandContextValue | undefined>(undefined);

interface PvSandProviderProps {
  children: ReactNode;
  initialPageId?: string;
  options?: SubmoduleProps['options'];
  initialFlowContext?: FlowContextData | null;
}

export const PvSandProvider: React.FC<PvSandProviderProps> = ({
  children,
  initialPageId = 'instructions_cover',
  options,
  initialFlowContext = null,
}) => {
  const [state, dispatch] = useReducer(pvSandReducer, {
    ...initialState,
    currentPageId: initialPageId,
    flowContext: initialFlowContext,
  });
  const sequenceRef = useRef(createOperationSequence());
  const flowContextRef = useRef<FlowContextData | null>(initialFlowContext);
  // 使用 ref 而非 state 存储 flowContextInjected，避免 logOperation 依赖变化导致 useEffect 重复执行
  // 参考 g8-mikania-experiment 的 stableLogOperation 模式
  const flowContextInjectedRef = useRef(false);
  // 保留 state 版本用于 Context 暴露（向后兼容）
  const [flowContextInjected, setFlowContextInjected] = useState(false);

  // 创建页面状态重置器（重置序号与 flowContextInjected 标记）
  const pageResetter = useMemo(
    () => createPageStateResetter(sequenceRef.current, (value: boolean) => {
      flowContextInjectedRef.current = value;
      setFlowContextInjected(value);
    }),
    [],
  );

  const currentPageRef = useRef(initialPageId);
  currentPageRef.current = state.currentPageId;

  // 维护当前操作列表的引用（用于 shouldInjectFlowContext 检查）
  const operationsRef = useRef<OperationLog[]>([]);
  operationsRef.current = state.operationLogs;

  // 稳定的 logOperation：不依赖任何 state，只使用 ref
  // 这样页面组件的 useEffect 不会因为 logOperation 引用变化而重复执行
  const logOperation = useCallback((operation: Omit<OperationLog, 'code'>) => {
    const code = sequenceRef.current.next();
    const pageId = operation.pageId || currentPageRef.current;
    // 无条件使用 formatTimestamp 规范化时间格式为 YYYY-MM-DD HH:mm:ss
    // 即使调用方传入 ISO 字符串或 Date 对象，也统一转换
    const normalizedTime = formatTimestamp(
      operation.time ? new Date(operation.time) : new Date()
    );
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

    // 在 page_enter 后注入 flow_context，使用共享工具检查和注入
    const isPageEnter = operation.eventType === EventTypes.PAGE_ENTER;
    const currentFlowContext = flowContextRef.current;

    // 使用 ref 检查是否已注入，避免依赖 state 导致 useCallback 重建
    // 使用 shouldInjectFlowContext 检查：
    // 1. flowContext 存在
    // 2. 当前 operationLogs 中没有 flow_context 事件（防止重复）
    // 3. 本页尚未注入过（flowContextInjectedRef 标记）
    if (
      isPageEnter &&
      currentFlowContext &&
      !flowContextInjectedRef.current &&
      shouldInjectFlowContext(operationsRef.current, currentFlowContext)
    ) {
      // 使用共享 injectFlowContext 注入，它会使用 formatTimestamp 格式化时间
      const flowContextPayload = {
        flowId: currentFlowContext.flowId,
        submoduleId: currentFlowContext.submoduleId,
        stepIndex: currentFlowContext.stepIndex,
        moduleName: '光伏治沙实验',
        pageId,
      };

      // 构建临时操作列表用于注入（包含刚添加的 page_enter）
      const tempOperations = [...operationsRef.current, operationWithCode];
      const injectedOperations = injectFlowContext(
        tempOperations,
        flowContextPayload,
        sequenceRef.current,
        { allowMissingPageEnter: true }
      );

      // 找到新注入的 flow_context 操作并 dispatch
      const flowContextOp = injectedOperations.find(
        (op) => op.eventType === EventTypes.FLOW_CONTEXT && !operationsRef.current.some((existing) => existing.code === op.code)
      );

      if (flowContextOp) {
        dispatch({
          type: 'ADD_OPERATION',
          payload: flowContextOp as OperationLog,
        });
      }

      // 同时更新 ref 和 state
      flowContextInjectedRef.current = true;
      setFlowContextInjected(true);
    }
  }, []); // 空依赖数组，logOperation 永远稳定

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
    pageResetter(); // 同时重置序号和 flowContextInjected
    dispatch({ type: 'CLEAR_OPERATIONS' });
  }, [pageResetter]);

  const clearAnswers = useCallback(() => {
    dispatch({ type: 'CLEAR_ANSWERS' });
  }, []);

  const navigateToPage = useCallback((pageId: string) => {
    // 切换页面前重置序号和 flowContextInjected 标记
    // 确保每页重新注入 flow_context 且 code 从 1 开始
    pageResetter();
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
  }, [pageResetter]);

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
    pageResetter();
    dispatch({ type: 'RESET_SEQUENCES' });
  }, [pageResetter]);

  const setFlowContext = useCallback((flowContext: FlowContextData | null) => {
    flowContextRef.current = flowContext;
    dispatch({ type: 'SET_FLOW_CONTEXT', payload: flowContext });
  }, []);

  /**
   * 获取当前页面的 targetElement 前缀
   * 格式: P{submoduleIndex}.{pageIndex}_
   * 通过 encodeCompositePageNum 符合 submodule-submission-guidelines.md 规范
   */
  const getPagePrefix = useCallback(() => {
    const subPageNum = getSubPageNumByPageId(state.currentPageId as PageId);
    const flowStepIndex = state.flowContext?.stepIndex;
    const safeStep = typeof flowStepIndex === 'number' ? flowStepIndex + 1 : 1;
    const pageNumber = encodeCompositePageNum(safeStep, subPageNum);
    return `P${pageNumber}_`;
  }, [state.currentPageId, state.flowContext?.stepIndex]);

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

  const taskDurationMinutes = useMemo(() => {
    const taskSeconds = options?.timers?.task ?? 1200; // 默认 20 分钟
    return Math.round(taskSeconds / 60);
  }, [options?.timers?.task]);

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
    setFlowContext,
    flowContextInjected,
    getPagePrefix,
    // Aliases
    operations: state.operationLogs,
    answers,
    taskDurationMinutes
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
    resetSequences,
    setFlowContext,
    flowContextInjected,
    getPagePrefix,
    answers,
    taskDurationMinutes
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
