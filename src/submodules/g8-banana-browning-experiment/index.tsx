import { lazy } from 'react';
import type { SubmoduleDefinition } from '@shared/types/flow';
import { getPageIdBySubPageNum, getPageConfig, PAGE_CONFIGS } from './mapping';
import type { PageId } from './mapping';

const Component = lazy(() => import('./Component'));

export const g8BananaBrowningExperimentSubmodule: SubmoduleDefinition = {
  submoduleId: 'g8-banana-browning-experiment',
  displayName: '8年级香蕉变黑科学探究',
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
    task: 40 * 60,
    questionnaire: 0,
  }),
};

export default g8BananaBrowningExperimentSubmodule;
