import { G4ExperimentComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

export const G4ExperimentSubmodule = {
  submoduleId: 'g4-experiment',
  displayName: '4年级火车购票-交互',
  version: '1.0.0',
  Component: G4ExperimentComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,
};

export default G4ExperimentSubmodule;
