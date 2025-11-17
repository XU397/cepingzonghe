import { G7TrackingQuestionnaireComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

export const G7TrackingQuestionnaireSubmodule = {
  submoduleId: 'g7-tracking-questionnaire',
  displayName: '7年级追踪-问卷',
  version: '1.0.0',
  Component: G7TrackingQuestionnaireComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,
};

export default G7TrackingQuestionnaireSubmodule;
