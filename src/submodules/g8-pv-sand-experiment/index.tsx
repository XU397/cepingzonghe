import React from 'react';
import { SubmoduleDefinition } from './types';
import G8PvSandExperiment from './Component';
import { getInitialPageId, getTotalSteps, getNavigationMode } from './mapping';

export const g8PvSandExperimentSubmodule: SubmoduleDefinition = {
  submoduleId: 'g8-pv-sand-experiment',
  displayName: '光伏治沙交互实验',
  version: '1.0.0',
  Component: G8PvSandExperiment,
  
  getInitialPage: (subPageNum: string): string => {
    const pageNum = subPageNum ? parseInt(subPageNum) : 1;
    return getInitialPageId(pageNum);
  },
  
  getTotalSteps: (): number => {
    return getTotalSteps();
  },
  
  getNavigationMode: (pageId: string): 'experiment' | 'questionnaire' | 'hidden' => {
    const mode = getNavigationMode(pageId);
    return mode === 'experiment' ? 'experiment' : 'hidden';
  },
  
  getDefaultTimers: () => ({
    task: 20 * 60,         // 20分钟任务计时
    questionnaire: 10 * 60  // 10分钟问卷计时
  })
};

export default g8PvSandExperimentSubmodule;