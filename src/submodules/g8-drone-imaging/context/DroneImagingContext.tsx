import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
  useRef,
} from 'react';
import { formatTimestamp } from '@shared/services/submission/createMarkObject.js';
import { PageId, getSubPageNumByPageId } from '../mapping';
import { Height, FocalLength, lookupGSD, calculateBlurAmount } from '../utils/gsdLookup';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import {
  type LogOperationParams,
  type Operation as SharedOperation,
  useOperationLogger,
} from '@shared/services/submission/submoduleAdapter';
import type { SubmoduleProps } from '@shared/types/flow';

// Operation interface for logging
export type Operation = SharedOperation;

export interface AnswerRecord {
  value: string;
}

// Capture record for experiment history
export interface CaptureRecord {
  height: 100 | 200 | 300;
  focalLength: FocalLength;
  gsd: number;
  timestamp: string;
}

// Experiment state
export interface ExperimentState {
  currentHeight: Height;
  currentFocalLength: FocalLength;
  currentGSD: number;
  blurAmount: number;
  hasCaptured: boolean;
  captureHistory: CaptureRecord[];
  operationCount: number;
}

// Context value interface
export interface DroneImagingContextValue {
  // State
  currentPageId: PageId;
  answers: Record<string, AnswerRecord>;
  operations: Operation[];
  experimentState: ExperimentState;
  pageStartTime: string;
  stepIndex: number;
  questionIds: ReturnType<typeof buildQuestionIdMap>;
  getPagePrefix: (subPageNum: number) => string;
  taskDurationMinutes: number;

  // Navigation
  navigateToPage: (pageId: PageId) => void;

  // Answer management
  setAnswer: (questionId: string, value: string) => void;
  getAnswer: (questionId: string) => string | undefined;

  // Operation logging
  logOperation: (op: LogOperationParams) => void;
  clearOperations: () => void;

  // Experiment operations
  setHeight: (height: Height) => void;
  setFocalLength: (focalLength: FocalLength) => void;
  capture: () => void;
  resetExperiment: () => void;

  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

// Storage keys
const STORAGE_KEYS = {
  ANSWERS: 'module.g8-drone-imaging.answers',
  EXPERIMENT_HISTORY: 'module.g8-drone-imaging.experimentHistory',
  LAST_PAGE_ID: 'module.g8-drone-imaging.lastPageId',
} as const;

// Default experiment state
const createDefaultExperimentState = (): ExperimentState => {
  // Start at ground level (height = 0), no GSD, no blur
  const defaultHeight: Height = 0;
  const defaultFocalLength: FocalLength = 24;

  return {
    currentHeight: defaultHeight,
    currentFocalLength: defaultFocalLength,
    currentGSD: 0,
    blurAmount: 0,
    hasCaptured: false,
    captureHistory: [],
    operationCount: 0,
  };
};


// Valid page IDs for validation
const VALID_PAGE_IDS: PageId[] = [
  'cover',
  'background',
  'hypothesis',
  'experiment_free',
  'focal_analysis',
  'height_analysis',
  'conclusion',
];

function isValidPageId(pageId: string): pageId is PageId {
  return VALID_PAGE_IDS.includes(pageId as PageId);
}

// Create context
const DroneImagingContext = createContext<DroneImagingContextValue | null>(null);

// Provider props
interface DroneImagingProviderProps {
  children: ReactNode;
  initialPageId?: PageId;
  stepIndex?: number;
  flowContext?: {
    flowId: string;
    submoduleId: string;
    moduleName?: string;
  };
  options?: SubmoduleProps['options'];
}

// 生成页面元素前缀
export const getPagePrefix = (subPageNum: number, stepIndex: number) => {
  const pageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);
  return `P${pageNumber}_`;
};

export const buildQuestionIdMap = (stepIndex: number) => ({
  confirmRead: `${getPagePrefix(1, stepIndex)}确认阅读`,
  controlVariableReason: `${getPagePrefix(3, stepIndex)}控制变量理由`,
  minGsdFocal: `${getPagePrefix(5, stepIndex)}最小GSD焦距`,
  gsdTrend: `${getPagePrefix(6, stepIndex)}GSD变化趋势`,
  priorityFactor: `${getPagePrefix(7, stepIndex)}优先调整因素`,
  priorityReason: `${getPagePrefix(7, stepIndex)}理由说明`,
  experimentCaptures: 'experiment_captures',
});

// Provider component
export function DroneImagingProvider({ children, initialPageId, stepIndex: stepIndexProp, flowContext, options }: DroneImagingProviderProps) {
  // Track if initial load has been completed
  const initialLoadComplete = useRef(false);

  const stepIndex = typeof stepIndexProp === 'number' ? stepIndexProp : 0;
  const questionIds = useMemo(() => buildQuestionIdMap(stepIndex), [stepIndex]);
  const getPagePrefixMemo = useCallback((subPageNum: number) => getPagePrefix(subPageNum, stepIndex), [stepIndex]);
  const taskDurationMinutes = useMemo(() => {
    const taskSeconds = options?.timers?.task ?? 1200;
    return Math.round(taskSeconds / 60);
  }, [options?.timers?.task]);

  const migrateLegacyAnswers = useCallback(
    (source: Record<string, string | AnswerRecord> | null | undefined) => {
      if (!source) return {} as Record<string, AnswerRecord>;

      const migrated: Record<string, AnswerRecord> = {};
      Object.entries(source).forEach(([key, value]) => {
        const answerValue = typeof value === 'string' ? value : value?.value ?? '';
        migrated[key] = { value: answerValue };
      });
      const legacyMap = {
        confirmRead: 'P1_确认阅读',
        controlVariableReason: 'P3_控制变量理由',
        minGsdFocal: 'P5_最小GSD焦距',
        gsdTrend: 'P6_GSD变化趋势',
        priorityFactor: 'P7_优先调整因素',
        priorityReason: 'P7_理由说明',
      } as const;

      (Object.keys(legacyMap) as Array<keyof typeof legacyMap>).forEach((key) => {
        const legacyId = legacyMap[key];
        const nextId = questionIds[key];
        if (legacyId in migrated) {
          if (!(nextId in migrated)) {
            migrated[nextId] = migrated[legacyId];
          }
          delete migrated[legacyId];
        }
      });

      return migrated;
    },
    [questionIds],
  );

  // Determine initial page: prop takes precedence, then try localStorage
  const getInitialPage = (): PageId => {
    // If initialPageId is explicitly provided, use it (including 'cover')
    if (initialPageId) {
      return initialPageId;
    }

    // Try to restore from localStorage only when no initialPageId is provided
    try {
      const savedPageId = localStorage.getItem(STORAGE_KEYS.LAST_PAGE_ID);
      if (savedPageId && isValidPageId(savedPageId)) {
        return savedPageId;
      }
    } catch (e) {
      console.warn('[DroneImagingContext] Failed to read last page from storage:', e);
    }

    return 'cover';
  };

  // State - initialize with restored values
  const [currentPageId, setCurrentPageId] = useState<PageId>(getInitialPage);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        return migrateLegacyAnswers(parsed);
      }
    } catch (e) {
      console.warn('[DroneImagingContext] Failed to load answers from storage:', e);
    }
    return {};
  });
  const [experimentState, setExperimentState] = useState<ExperimentState>(() => {
    const defaultState = createDefaultExperimentState();
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.EXPERIMENT_HISTORY);
      if (savedHistory) {
        const history = JSON.parse(savedHistory) as CaptureRecord[];
        return {
          ...defaultState,
          captureHistory: history,
        };
      }
    } catch (e) {
      console.warn('[DroneImagingContext] Failed to load experiment history from storage:', e);
    }
    return defaultState;
  });
  const [pageStartTime, setPageStartTime] = useState<string>(formatTimestamp(new Date()));

  const currentSubPageNum = useMemo(() => getSubPageNumByPageId(currentPageId), [currentPageId]);
  const currentPageNumber = useMemo(
    () => encodeCompositePageNum(stepIndex + 1, currentSubPageNum),
    [currentSubPageNum, stepIndex],
  );
  const currentPagePrefix = useMemo(
    () => getPagePrefixMemo(currentSubPageNum),
    [currentSubPageNum, getPagePrefixMemo],
  );
  const flowContextForLogger = useMemo(() => {
    if (!flowContext) {
      return null;
    }
    const moduleName =
      typeof flowContext.moduleName === 'string' && flowContext.moduleName.trim().length > 0
        ? flowContext.moduleName
        : 'g8-drone-imaging';
    return {
      flowId: flowContext.flowId,
      submoduleId: flowContext.submoduleId,
      stepIndex,
      moduleName,
      pageId: currentPageId,
    };
  }, [currentPageId, flowContext, stepIndex]);

  const {
    operations,
    logOperation: baseLogOperation,
    clearOperations: resetOperations,
  } = useOperationLogger({
    pageNumber: currentPageNumber,
    targetPrefix: currentPagePrefix,
    flowContext: flowContextForLogger,
  });

  const clearOperations = useCallback(() => {
    resetOperations();
  }, [resetOperations]);

  // Log initial page restoration
  useEffect(() => {
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
      console.log('[DroneImagingContext] Initialized with page:', currentPageId);
    }
  }, [currentPageId]);

  // Navigation
  const navigateToPage = useCallback((pageId: PageId) => {
    setCurrentPageId(pageId);
    setPageStartTime(formatTimestamp(new Date()));
    clearOperations();

    // Save last page to storage
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE_ID, pageId);
    } catch (e) {
      console.warn('[DroneImagingContext] Failed to save last page ID:', e);
    }
  }, [clearOperations]);

  // Answer management
  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => {
      const updatedRecord: AnswerRecord = {
        value,
      };
      const updated = { ...prev, [questionId]: updatedRecord };
      // Auto-save to storage
      try {
        localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(updated));
      } catch (e) {
        console.warn('[DroneImagingContext] Failed to save answers:', e);
      }
      return updated;
    });
  }, []);

  const getAnswer = useCallback((questionId: string): string | undefined => {
    const record = answers[questionId] as AnswerRecord | string | undefined;
    if (!record) return undefined;
    if (typeof record === 'string') {
      return record;
    }
    return record.value;
  }, [answers]);

  // Operation logging
  const logOperation = useCallback(
    (op: LogOperationParams) => {
      baseLogOperation(op);
      setExperimentState(prev => ({
        ...prev,
        operationCount: prev.operationCount + 1,
      }));
    },
    [baseLogOperation],
  );

  // Experiment operations
  const setHeight = useCallback((height: Height) => {
    setExperimentState(prev => {
      // When height changes, calculate new GSD but don't apply blur yet
      // Blur only applies after capture
      const newGSD = lookupGSD(height, prev.currentFocalLength);
      return {
        ...prev,
        currentHeight: height,
        currentGSD: newGSD,
        // Reset captured state when height changes (user is adjusting parameters)
        hasCaptured: false,
        blurAmount: 0,
      };
    });
  }, []);

  const setFocalLength = useCallback((focalLength: FocalLength) => {
    setExperimentState(prev => {
      const newGSD = lookupGSD(prev.currentHeight, focalLength);
      return {
        ...prev,
        currentFocalLength: focalLength,
        currentGSD: newGSD,
        // Reset captured state when focal length changes
        hasCaptured: false,
        blurAmount: 0,
      };
    });
  }, []);

  const capture = useCallback(() => {
    setExperimentState(prev => {
      // Only allow capture if height is selected (not 0)
      if (prev.currentHeight === 0) {
        return prev;
      }

      const record: CaptureRecord = {
        height: prev.currentHeight as 100 | 200 | 300,
        focalLength: prev.currentFocalLength,
        gsd: prev.currentGSD,
        timestamp: formatTimestamp(new Date()),
      };

      const updatedHistory = [...prev.captureHistory, record];

      // Auto-save to storage
      try {
        localStorage.setItem(STORAGE_KEYS.EXPERIMENT_HISTORY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn('[DroneImagingContext] Failed to save experiment history:', e);
      }

      return {
        ...prev,
        hasCaptured: true,
        blurAmount: calculateBlurAmount(prev.currentGSD),
        captureHistory: updatedHistory,
      };
    });
  }, []);

  const resetExperiment = useCallback(() => {
    setExperimentState(prev => ({
      ...createDefaultExperimentState(),
      // Keep the capture history
      captureHistory: prev.captureHistory,
    }));
  }, []);

  // Persistence
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
      localStorage.setItem(STORAGE_KEYS.EXPERIMENT_HISTORY, JSON.stringify(experimentState.captureHistory));
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE_ID, currentPageId);
    } catch (e) {
      console.warn('[DroneImagingContext] Failed to save to storage:', e);
    }
  }, [answers, experimentState.captureHistory, currentPageId]);

  const loadFromStorage = useCallback(() => {
    try {
      // Load answers
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(migrateLegacyAnswers(parsed));
      }

      // Load experiment history
      const savedHistory = localStorage.getItem(STORAGE_KEYS.EXPERIMENT_HISTORY);
      if (savedHistory) {
        const history = JSON.parse(savedHistory) as CaptureRecord[];
        setExperimentState(prev => ({
          ...prev,
          captureHistory: history,
        }));
      }

      // Load last page (only if no initialPageId was provided explicitly)
      if (!initialPageId) {
        const savedPageId = localStorage.getItem(STORAGE_KEYS.LAST_PAGE_ID);
        if (savedPageId && isValidPageId(savedPageId)) {
          setCurrentPageId(savedPageId);
        }
      }
    } catch (e) {
      console.warn('[DroneImagingContext] Failed to load from storage:', e);
    }
  }, [initialPageId]);

  // Context value
  const contextValue: DroneImagingContextValue = {
    // State
    currentPageId,
    answers,
    operations,
    experimentState,
    pageStartTime,
    stepIndex,
    questionIds,
    getPagePrefix: getPagePrefixMemo,
    taskDurationMinutes,

    // Navigation
    navigateToPage,

    // Answer management
    setAnswer,
    getAnswer,

    // Operation logging
    logOperation,
    clearOperations,

    // Experiment operations
    setHeight,
    setFocalLength,
    capture,
    resetExperiment,

    // Persistence
    saveToStorage,
    loadFromStorage,
  };

  return (
    <DroneImagingContext.Provider value={contextValue}>
      {children}
    </DroneImagingContext.Provider>
  );
}

// Custom hook
export function useDroneImagingContext(): DroneImagingContextValue {
  const context = useContext(DroneImagingContext);
  if (!context) {
    throw new Error('useDroneImagingContext must be used within a DroneImagingProvider');
  }
  return context;
}

export default DroneImagingContext;
