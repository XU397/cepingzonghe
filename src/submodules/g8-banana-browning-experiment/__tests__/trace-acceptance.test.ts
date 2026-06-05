import { describe, expect, it } from 'vitest';
import page02Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json';
import page05Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page05_multi_idea_generation.json';
import page08Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page08_direct_skip.json';
import page09Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page09_experiment_question.json';
import page12Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page12_solution_selection.json';
import page13Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page13_task_finish.json';
import { validateTraceMark } from '@shared/services/submission/trace';

const cases = [page02Case, page05Case, page08Case, page09Case, page12Case, page13Case];

describe('banana L2 acceptance contracts', () => {
  it.each(cases)('validates %s', acceptanceCase => {
    const mark = {
      pageNumber: acceptanceCase.input.pageNumber,
      pageDesc: acceptanceCase.input.pageDesc,
      beginTime: acceptanceCase.input.beginTime,
      endTime: acceptanceCase.input.endTime,
      answerList: [],
      imgList: acceptanceCase.input.imgList || [],
      operationList: acceptanceCase.input.operationList,
    };
    expect(() => validateTraceMark(mark)).not.toThrow();
  });
});
