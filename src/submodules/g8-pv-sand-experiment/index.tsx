import { lazy } from 'react';
import type { SubmoduleDefinition } from '@shared/types/flow';
import { getPageIdBySubPageNum, getPageConfig, PAGE_CONFIGS } from './mapping';
import type { PageId } from './mapping';

const Component = lazy(() => import('./Component'));

export const g8PvSandExperimentSubmodule: SubmoduleDefinition = {
  submoduleId: 'g8-pv-sand-experiment',
  displayName: '光伏治沙交互实验',
  version: '1.0.0',

  Component,

  getInitialPage: (subPageNum: string): string => {
    const num = parseInt(subPageNum, 10) || 1;
    return getPageIdBySubPageNum(num);
  },

  getTotalSteps: (): number => {
    return PAGE_CONFIGS.filter(config => config.stepIndex > 0).length;
  },

  getNavigationMode: (pageId: string): 'experiment' | 'questionnaire' | 'hidden' => {
    const config = getPageConfig(pageId as PageId);
    return config?.navigationMode ?? 'experiment';
  },

  getDefaultTimers: () => ({
    task: 20 * 60,
    questionnaire: 0
  })
};

export default g8PvSandExperimentSubmodule;