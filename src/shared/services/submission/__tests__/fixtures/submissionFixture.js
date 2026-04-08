import {
  encodeCompositePageNum,
  buildTargetElementPrefix,
  buildPageDescPrefix,
} from '@shared/utils/pageMapping.ts';

const baseFlowContext = Object.freeze({
  flowId: 'flow-nitrogen',
  submoduleId: 'g7-lab',
  stepIndex: 0,
  pageId: 'fertilizer-planning',
});

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export function createSubmissionFixture() {
  const flowContext = { ...baseFlowContext };
  const subPageNum = 3;
  const pageNumber = encodeCompositePageNum(flowContext.stepIndex + 1, subPageNum);
  const targetPrefix = buildTargetElementPrefix(pageNumber);
  const pageDescPrefix = buildPageDescPrefix(
    flowContext.flowId,
    flowContext.submoduleId,
    flowContext.stepIndex,
  );

  const operationTimes = {
    enter: '2024-12-01 10:00:00',
    focus: '2024-12-01 10:00:05',
    change: '2024-12-01 10:00:08',
    blur: '2024-12-01 10:00:12',
    flow: '2024-12-01 10:00:20',
    next: '2024-12-01 10:00:25',
    exit: '2024-12-01 10:00:40',
  };

  const flowContextValue = {
    flowId: flowContext.flowId,
    submoduleId: flowContext.submoduleId,
    stepIndex: flowContext.stepIndex,
    pageId: flowContext.pageId,
  };

  const mark = {
    pageNumber,
    pageDesc: `${pageDescPrefix}氮肥施用逻辑`,
    beginTime: '2024-12-01 09:59:58',
    endTime: '2024-12-01 10:01:02',
    imgList: [],
    operationList: [
      {
        code: 1,
        targetElement: `${targetPrefix}PAGE`,
        eventType: 'page_enter',
        value: 'enter_page',
        time: operationTimes.enter,
        pageId: flowContext.pageId,
      },
      {
        code: 2,
        targetElement: `${targetPrefix}Q1`,
        eventType: 'input_focus',
        value: '',
        time: operationTimes.focus,
        pageId: flowContext.pageId,
      },
      {
        code: 3,
        targetElement: `${targetPrefix}Q1`,
        eventType: 'input_change',
        value: {
          prev: '',
          next: '50kg 尿素',
        },
        time: operationTimes.change,
        pageId: flowContext.pageId,
      },
      {
        code: 4,
        targetElement: `${targetPrefix}Q1`,
        eventType: 'input_blur',
        value: '',
        time: operationTimes.blur,
        pageId: flowContext.pageId,
      },
      {
        code: 5,
        targetElement: 'flow_context',
        eventType: 'flow_context',
        value: flowContextValue,
        time: operationTimes.flow,
        pageId: flowContext.pageId,
      },
      {
        code: 6,
        targetElement: `${targetPrefix}NEXT`,
        eventType: 'next_click',
        value: 'go_next',
        time: operationTimes.next,
        pageId: flowContext.pageId,
      },
      {
        code: 7,
        targetElement: `${targetPrefix}EXIT`,
        eventType: 'page_exit',
        value: 'exit_to_next',
        time: operationTimes.exit,
        pageId: flowContext.pageId,
      },
    ],
    answerList: [
      {
        code: 1,
        targetElement: `${targetPrefix}Q1`,
        value: ' 50kg 尿素 ',
      },
      {
        code: 2,
        targetElement: `${targetPrefix}Q2`,
        value: '保持土壤湿润',
      },
    ],
  };

  return {
    flowContext,
    pageNumber,
    targetPrefix,
    mark: deepClone(mark),
  };
}

export default createSubmissionFixture;
