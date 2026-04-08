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
  metadata: {
    submoduleId: 'g8-banana-browning-experiment';
    version: string;
    createdAt: string;
    lastSavedAt: string;
    totalPages: 14;
    completedPages: string[];
  };
}

export interface AnswerEntry {
  code: number;
  targetElement: string;
  value: string;
  pageId?: string;
}

export interface OperationLog {
  code: number;
  targetElement: string;
  eventType: string;
  value: string | Record<string, unknown>;
  time: string;
  pageId?: string;
}

export interface FlowContextData {
  flowId: string;
  submoduleId: string;
  stepIndex: number;
  moduleName?: string;
  pageId?: string;
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

import type { SubmoduleDefinition, SubmoduleProps } from '@shared/types/flow';

// 重新导出类型以便本模块内使用
export type { SubmoduleDefinition, SubmoduleProps };

export interface PageNumberMapping {
  [pageId: string]: {
    pageNumber: string;
    pageDesc: string;
    mode: 'hidden' | 'experiment';
  };
}
