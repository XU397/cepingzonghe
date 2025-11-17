import { G7TrackingExperimentComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

export const G7TrackingExperimentSubmodule = {
  submoduleId: 'g7-tracking-experiment',
  displayName: '7年级追踪-交互实验',
  version: '1.0.0',
  Component: G7TrackingExperimentComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,
};

export default G7TrackingExperimentSubmodule;
