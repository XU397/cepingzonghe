export interface WindSpeedDataEntry {
  withPanel: number;
  noPanel: number;
}

export interface WindSpeedData {
  [heightCm: number]: WindSpeedDataEntry;
}

export type HeightLevel = 20 | 50 | 100;

export type AnimationState = 'idle' | 'starting' | 'running' | 'completed';

export interface ExperimentState {
  currentHeight: HeightLevel;
  isRunning: boolean;
  isCompleted: boolean;
  animationState: AnimationState;
  animationStartTime: number | null;
  animationDuration: 2000;
  collectedData: {
    heightLevel: number;
    withPanelSpeed: number;
    noPanelSpeed: number;
    timestamp: string;
  } | null;
  operationHistory: {
    action: 'height_change' | 'start_experiment' | 'reset_experiment';
    fromValue?: any;
    toValue?: any;
    timestamp: string;
  }[];
}

export interface AnswerDraft {
  pageAnswers: {
    [pageId: string]: {
      [questionId: string]: {
        value: string | number | boolean;
        lastModified: string;
        isValid: boolean;
        validationMessage?: string;
      };
    };
  };
  experimentAnswers: {
    designReason: string;
    tutorialCompleted: boolean;
    experiment1Choice: 'withPanel' | 'noPanel' | null;
    experiment2Analysis: string;
    conclusionAnswers: {
      selectedOption: string;
      reason: string;
    };
  };
  metadata: {
    submoduleId: 'g8-pv-sand-experiment';
    version: string;
    createdAt: string;
    lastSavedAt: string;
    totalPages: 8;
    completedPages: string[];
  };
}

export type StandardEventType = 
  | 'page_enter' | 'page_exit'
  | 'click' | 'change'
  | 'click_blocked'
  | 'flow_context';

export interface OperationLog {
  code: number;
  targetElement: string;
  eventType: StandardEventType;
  value: string | object;
  time: string;
  pageId?: string;
}

export interface AnswerEntry {
  code: number;
  targetElement: string;
  value: string;
}

export interface MarkObject {
  pageNumber: string;
  pageDesc: string;
  operationList: OperationLog[];
  answerList: AnswerEntry[];
  beginTime: string;
  endTime: string;
  imgList: any[];
}

import type { SubmoduleDefinition, SubmoduleProps } from '@/shared/types/flow';

// 重新导出类型以便本模块内使用
export type { SubmoduleDefinition, SubmoduleProps };

export interface PageNumberMapping {
  [pageId: string]: {
    pageNumber: string;
    pageDesc: string;
    mode: 'hidden' | 'experiment';
  };
}