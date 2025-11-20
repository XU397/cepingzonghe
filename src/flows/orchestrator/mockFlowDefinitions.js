/**
 * Mock FlowDefinition data for FlowOrchestrator tests.
 * 提供预定义的 Flow 测试数据，便于在本地/单元测试中复用。
 */

/** @typedef {import('@/shared/types/flow').FlowDefinition} FlowDefinition */
/** @typedef {import('@/shared/types/flow').FlowStep} FlowStep */

/**
 * 测试 Flow 1 的步骤定义（7年级实验 -> 4年级实验）。
 * @type {FlowStep[]}
 */
const TEST_FLOW_1_STEPS = [
  {
    submoduleId: 'g7-experiment',
    displayName: '7年级蒸馒头实验',
    transitionPage: {
      title: '第一部分已完成',
      content:
        '您已完成7年级蒸馒头实验部分，稍后将进入4年级火车票规划任务。',
      autoNextSeconds: 5,
    },
  },
  {
    submoduleId: 'g4-experiment',
    displayName: '4年级火车票规划任务',
    transitionPage: null,
  },
];

/**
 * 测试 Flow 2 的步骤定义（追踪实验 -> 问卷）。
 * @type {FlowStep[]}
 */
const TEST_FLOW_2_STEPS = [
  {
    submoduleId: 'g7-tracking-experiment',
    displayName: '7年级追踪实验',
    transitionPage: {
      title: '实验完成',
      content: '准备进入问卷',
      autoNextSeconds: 3,
    },
  },
  {
    submoduleId: 'g7-tracking-questionnaire',
    displayName: '7年级追踪问卷',
    transitionPage: null,
  },
];

/**
 * 创建 Flow 定义时的通用填充逻辑。
 * @param {FlowDefinition & { displayName?: string }} definition
 * @returns {FlowDefinition}
 */
const defineFlow = (definition) => ({
  status: 'draft',
  version: '0.1.0',
  ...definition,
});

/**
 * Mock Flow 定义 Map。
 * @type {Map<string, FlowDefinition & { displayName?: string }>}
 */
export const mockFlowDefinitions = new Map([
  [
    'test-flow-1',
    defineFlow({
      flowId: 'test-flow-1',
      name: '测试 Flow - 7年级实验+4年级实验',
      displayName: '测试 Flow - 7年级实验+4年级实验',
      description: '用于开发测试的混合 Flow',
      url: '/flow/test-flow-1',
      steps: TEST_FLOW_1_STEPS,
    }),
  ],
  [
    'test-flow-2',
    defineFlow({
      flowId: 'test-flow-2',
      name: '测试 Flow - 7年级追踪实验+问卷',
      displayName: '测试 Flow - 7年级追踪实验+问卷',
      description: '用于测试 remount 与追踪实验的流程',
      url: '/flow/test-flow-2',
      steps: TEST_FLOW_2_STEPS,
    }),
  ],
  [
    'g8-physics-assessment',
    defineFlow({
      flowId: 'g8-physics-assessment',
      name: '8年级光伏治沙物理实验',
      displayName: '8年级光伏治沙物理实验',
      description: '光伏治沙互动实验评估',
      url: '/flow/g8-physics-assessment',
      steps: [
        {
          submoduleId: 'g8-pv-sand-experiment',
          displayName: '光伏治沙实验',
          transitionPage: null,
        },
      ],
    }),
  ],
]);

/**
 * 获取指定 Flow ID 的 Mock 定义。
 * @param {string} flowId
 * @returns {(FlowDefinition & { displayName?: string }) | undefined}
 */
export function getMockFlowDefinition(flowId) {
  return mockFlowDefinitions.get(flowId);
}

/**
 * 判断给定 Flow ID 是否在 Mock 列表中。
 * @param {string} flowId
 * @returns {boolean}
 */
export function isMockFlow(flowId) {
  return mockFlowDefinitions.has(flowId);
}

/**
 * 列出所有 Mock Flow 定义。
 * @returns {Array<FlowDefinition & { displayName?: string }>}
 */
export function listMockFlowDefinitions() {
  return Array.from(mockFlowDefinitions.values());
}
