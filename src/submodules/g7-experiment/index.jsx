/**
 * 7年级蒸馒头实验 - 子模块定义
 */

import { G7ExperimentComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

/**
 * G7 Experiment 子模块定义
 */
export const G7ExperimentSubmodule = {
  submoduleId: 'g7-experiment',
  displayName: '7年级蒸馒头-交互',
  version: '1.0.0',
  Component: G7ExperimentComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,

  onInitialize: () => {
    console.log('[G7Experiment] 子模块初始化');
  },

  onDestroy: () => {
    console.log('[G7Experiment] 子模块销毁');
  },
};
