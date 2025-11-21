/**
 * DroneImagingContext Interface
 *
 * This contract defines the state management interface for the
 * g8-drone-imaging submodule.
 */

// Page identifiers
export type PageId =
  | 'cover'
  | 'background'
  | 'hypothesis'
  | 'experiment_free'
  | 'focal_analysis'
  | 'height_analysis'
  | 'conclusion';

// Experiment parameters
export type Height = 100 | 200 | 300;
export type FocalLength = 8 | 24 | 50;

// Question identifiers
export type QuestionId = 'Q3_1' | 'Q5_1' | 'Q6_1' | 'Q7_1' | 'Q7_2';

// Event types
export type EventType =
  | 'PAGE_ENTER'
  | 'PAGE_EXIT'
  | 'INPUT_CHANGE'
  | 'RADIO_SELECT'
  | 'CLICK'
  | 'SIMULATION_OPERATION'
  | 'TIMER_STOP'
  | 'CLICK_BLOCKED'
  | 'AUTO_SUBMIT'
  | 'READING_COMPLETE';

/**
 * Operation record
 */
export interface Operation {
  code: number;
  targetElement: string;
  eventType: EventType;
  value: string;
  time: string;
}

/**
 * Experiment capture record
 */
export interface CaptureRecord {
  height: Height;
  focalLength: FocalLength;
  gsd: number;
  timestamp: string;
}

/**
 * Experiment state
 */
export interface ExperimentState {
  currentHeight: Height;
  currentFocalLength: FocalLength;
  currentGSD: number;
  blurAmount: number;
  captureHistory: CaptureRecord[];
  operationCount: number;
}

/**
 * Context value interface
 */
export interface DroneImagingContextValue {
  // State
  currentPageId: PageId;
  answers: Record<QuestionId, string>;
  operations: Operation[];
  experimentState: ExperimentState;
  pageStartTime: string;

  // Navigation
  navigateToPage: (pageId: PageId) => void;

  // Answers
  setAnswer: (questionId: QuestionId, value: string) => void;
  getAnswer: (questionId: QuestionId) => string | undefined;

  // Operations
  logOperation: (operation: Omit<Operation, 'code'>) => void;
  clearOperations: () => void;

  // Experiment
  setHeight: (height: Height) => void;
  setFocalLength: (focalLength: FocalLength) => void;
  capture: () => void;
  resetExperiment: () => void;

  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

/**
 * Provider props
 */
export interface DroneImagingProviderProps {
  children: React.ReactNode;
  initialPageId: PageId;
}
