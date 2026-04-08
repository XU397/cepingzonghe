import { describe, expect, it } from 'vitest';

import {
  getInitialPage as g4GetInitialPage,
  getTotalSteps as g4GetTotalSteps,
  getNavigationMode as g4GetNavigationMode,
} from '../g4-experiment/mapping';
import {
  getInitialPage as g7ExperimentGetInitialPage,
  getTotalSteps as g7ExperimentGetTotalSteps,
  getNavigationMode as g7ExperimentGetNavigationMode,
} from '../g7-experiment/mapping';
import {
  getInitialPage as g7QuestionnaireGetInitialPage,
  getTotalSteps as g7QuestionnaireGetTotalSteps,
  getNavigationMode as g7QuestionnaireGetNavigationMode,
} from '../g7-questionnaire/mapping';
import {
  getInitialPage as g7TrackingExperimentGetInitialPage,
  getTotalSteps as g7TrackingExperimentGetTotalSteps,
  getNavigationMode as g7TrackingExperimentGetNavigationMode,
} from '../g7-tracking-experiment/mapping';
import {
  getInitialPage as g7TrackingQuestionnaireGetInitialPage,
  getTotalSteps as g7TrackingQuestionnaireGetTotalSteps,
  getNavigationMode as g7TrackingQuestionnaireGetNavigationMode,
} from '../g7-tracking-questionnaire/mapping';

const CASES = [
  [
    'g4-experiment',
    g4GetInitialPage,
    g4GetTotalSteps,
    (pageId: string) => g4GetNavigationMode(pageId),
  ],
  [
    'g7-experiment',
    g7ExperimentGetInitialPage,
    g7ExperimentGetTotalSteps,
    (pageId: string) => g7ExperimentGetNavigationMode(pageId),
  ],
  [
    'g7-questionnaire',
    g7QuestionnaireGetInitialPage,
    g7QuestionnaireGetTotalSteps,
    (pageId: string) => g7QuestionnaireGetNavigationMode(pageId),
  ],
  [
    'g7-tracking-experiment',
    g7TrackingExperimentGetInitialPage,
    g7TrackingExperimentGetTotalSteps,
    () => g7TrackingExperimentGetNavigationMode(),
  ],
  [
    'g7-tracking-questionnaire',
    g7TrackingQuestionnaireGetInitialPage,
    g7TrackingQuestionnaireGetTotalSteps,
    () => g7TrackingQuestionnaireGetNavigationMode(),
  ],
] as const;

describe('submodule mapping interface compliance', () => {
  it.each(CASES)(
    '%s should expose valid getInitialPage/getTotalSteps/getNavigationMode',
    (_name, getInitialPage, getTotalSteps, getNavigationMode) => {
      const initialPage = getInitialPage('1');
      expect(typeof initialPage).toBe('string');
      expect(initialPage.length).toBeGreaterThan(0);

      const totalSteps = getTotalSteps();
      expect(typeof totalSteps).toBe('number');
      expect(totalSteps).toBeGreaterThan(0);

      const mode = getNavigationMode(initialPage);
      expect(['hidden', 'experiment', 'questionnaire']).toContain(mode);
    }
  );
});
