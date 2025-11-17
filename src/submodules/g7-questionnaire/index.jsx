import { G7QuestionnaireComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

export const G7QuestionnaireSubmodule = {
  submoduleId: 'g7-questionnaire',
  displayName: '7年级蒸馒头-问卷',
  version: '1.0.0',
  Component: G7QuestionnaireComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,

  onInitialize: () => {
    console.log('[G7Questionnaire] 子模块初始化');
  },

  onDestroy: () => {
    console.log('[G7Questionnaire] 子模块销毁');
  },
};

export default G7QuestionnaireSubmodule;
