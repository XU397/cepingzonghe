import { describe, expect, it } from 'vitest';
import { createPageTraceLogger, validateTraceMark } from '@shared/services/submission/trace';
import page02QuestionGeneration from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json';
import page02PageIdle from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_page_idle.json';
import page05MultiIdeaGeneration from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page05_multi_idea_generation.json';
import page08DirectSkip from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page08_direct_skip.json';
import page09ExperimentQuestion from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page09_experiment_question.json';
import page12SolutionSelection from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page12_solution_selection.json';
import page13TaskFinish from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page13_task_finish.json';
import { getTracePageConfigByLegacyPageId, type TracePageConfig } from '../mapping';

const REQUIRED_CASE_IDS = [
  'page02_question_generation_v2_2',
  'page02_page_idle_v2_2',
  'page05_multi_idea_generation_v2_2',
  'page08_direct_skip_v2_2',
  'page09_experiment_question_v2_2',
  'page12_solution_selection_v2_2',
  'page13_banana_submodule_finish_v2_2',
];

type AcceptanceCase = {
  case_id: string;
  input: {
    pageNumber: string | number;
    pageDesc: string;
    beginTime: string;
    endTime: string;
    answerList?: unknown[];
    imgList?: unknown[];
    operationList: unknown[];
  };
};

const cases: AcceptanceCase[] = [
  page02QuestionGeneration,
  page02PageIdle,
  page05MultiIdeaGeneration,
  page08DirectSkip,
  page09ExperimentQuestion,
  page12SolutionSelection,
  page13TaskFinish,
];

const getFixtureOperation = (acceptanceCase: AcceptanceCase, eventType: string) => {
  const operation = acceptanceCase.input.operationList.find(
    candidate =>
      typeof candidate === 'object' &&
      candidate !== null &&
      (candidate as { eventType?: unknown }).eventType === eventType
  );
  if (!operation) {
    throw new Error(`Missing ${eventType} in ${acceptanceCase.case_id}`);
  }
  return operation as { value: Record<string, any> };
};

const getTracePageConfig = (legacyPageId: TracePageConfig['legacyPageId']) => {
  const page = getTracePageConfigByLegacyPageId(legacyPageId);
  if (!page) {
    throw new Error(`Missing trace page config for ${legacyPageId}`);
  }
  return page;
};

const createRuntimeOperationProbe = (page: TracePageConfig, pageNumber: string) => {
  const operations: Array<{ value: Record<string, any> }> = [];
  const logger = createPageTraceLogger({
    page,
    pageNumber,
    logOperation: operation => operations.push(operation as { value: Record<string, any> }),
    now: () => new Date('2026-06-03T02:08:06.000Z'),
    idFactory: {
      traceId: () => 'runtime-trace-id',
      submitAttemptId: () => 'runtime-submit-id',
    },
  });
  return { logger, operations };
};

describe('banana L2 acceptance contracts', () => {
  it('locks the required authoritative acceptance case set', () => {
    expect(cases.map(acceptanceCase => acceptanceCase.case_id)).toEqual(REQUIRED_CASE_IDS);
    expect(cases).toHaveLength(7);
  });

  it.each(cases.map(acceptanceCase => [acceptanceCase.case_id, acceptanceCase] as const))(
    'validates %s',
    (_caseId, acceptanceCase) => {
      const pageNumber = String(acceptanceCase.input.pageNumber);
      expect(pageNumber).not.toHaveLength(0);
      expect(acceptanceCase.input.pageDesc).toEqual(expect.any(String));
      expect(acceptanceCase.input.pageDesc).not.toHaveLength(0);
      expect(acceptanceCase.input.beginTime).toEqual(expect.any(String));
      expect(acceptanceCase.input.beginTime).not.toHaveLength(0);
      expect(acceptanceCase.input.endTime).toEqual(expect.any(String));
      expect(acceptanceCase.input.endTime).not.toHaveLength(0);

      const mark = {
        pageNumber,
        pageDesc: acceptanceCase.input.pageDesc,
        beginTime: acceptanceCase.input.beginTime,
        endTime: acceptanceCase.input.endTime,
        answerList: acceptanceCase.input.answerList || [],
        imgList: acceptanceCase.input.imgList || [],
        operationList: acceptanceCase.input.operationList,
      };
      expect(() => validateTraceMark(mark)).not.toThrow();
    }
  );

  it('keeps Page02 fixture field names aligned with backend v2.2', () => {
    const startPage = getFixtureOperation(page02QuestionGeneration, 'START_PAGE');
    const chatScroll = getFixtureOperation(page02QuestionGeneration, 'CHAT_SCROLL');
    const pageIdle = getFixtureOperation(page02PageIdle, 'PAGE_IDLE');

    expect(startPage.value.metadata).toMatchObject({
      schema_version: 'science-inquiry-trace-v2.2',
      field_registry_version: 'science-inquiry-field-registry-v2.2',
      field_registry_hash: '93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54',
      content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
      content_registry_hash: '2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35',
      rule_config_version: 'rule-config-v2.2',
      rule_config_hash: 'c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83',
    });
    expect(Object.keys(startPage.value.metadata.viewport_state).sort()).toEqual([
      'height',
      'scroll_y',
      'width',
    ]);
    expect(Object.keys(chatScroll.value.metadata).sort()).toEqual([
      'phase',
      'scroll_delta',
      'scroll_direction',
      'visible_content_ids_after',
      'visible_content_ids_before',
    ]);
    expect(pageIdle.value.metadata.idle_duration_ms).toBeGreaterThanOrEqual(5000);
    expect(pageIdle.value.metadata).toMatchObject({
      idle_phase: 'initial_before_first_action',
      page_visible: true,
      window_focused: true,
      threshold_ms: 5000,
    });
  });

  it('keeps runtime-sensitive acceptance fixture values aligned with emitted trace operations', () => {
    const page08Runtime = createRuntimeOperationProbe(
      getTracePageConfig('banana_browning_simulation_main'),
      '1.09'
    );
    page08Runtime.logger.submitAttempt({
      validationStatus: 'success',
      targetId: 'next_button',
    });

    expect(page08Runtime.operations[0].value.metadata?.submit_trigger).toBe(
      getFixtureOperation(page08DirectSkip, 'SUBMIT_ATTEMPT').value.metadata?.submit_trigger
    );

    const page12Runtime = createRuntimeOperationProbe(
      getTracePageConfig('solution_selection'),
      '1.13'
    );
    page12Runtime.logger.chartHover('chart_evidence_1', 'day_12', {
      hover_ms: 1200,
      data_snapshot: {
        day: '12',
        series_id: '10℃-海南香蕉',
        black_ratio: 0.23,
      },
    });

    const page12ChartFixture = getFixtureOperation(page12SolutionSelection, 'CHART_HOVER');
    expect(page12Runtime.operations[0].value.chart_id).toBe(page12ChartFixture.value.chart_id);
    expect(page12Runtime.operations[0].value.point_id).toBe(page12ChartFixture.value.point_id);
    expect(page12Runtime.operations[0].value.target_id).toBe(page12ChartFixture.value.target_id);
    expect(page12Runtime.operations[0].value.metadata?.data_snapshot).toMatchObject(
      page12ChartFixture.value.metadata?.data_snapshot
    );
  });
});
