/**
 * 页面信息映射表
 * 将页面ID映射到页面序号和描述信息，用于数据提交
 */
export const pageInfoMapping = {
  'Page_Login': {
    number: 'Login',
    desc: '用户登录',
    stepNumber: 0,
    isInProgress: false
  },
  'Page_01_Precautions': {
    number: '1',
    desc: '注意事项',
    stepNumber: 0,
    isInProgress: false
  },
  'Page_02_Introduction': {
    number: '2',
    desc: '第一题',
    stepNumber: 1,
    isInProgress: true
  },
  'Page_03_Dialogue_Question': {
    number: '3',
    desc: '第二题',
    stepNumber: 2,
    isInProgress: true
  },
  'Page_04_Material_Reading_Factor_Selection': {
    number: '4',
    desc: '第三题',
    stepNumber: 3,
    isInProgress: true
  },
  'Modal_Page_05_Process': {
    number: '5',
    desc: '蒸馒头全流程',
    stepNumber: 3,
    isInProgress: false
  },
  'Modal_Page_06_Principle': {
    number: '6',
    desc: '发酵原理趣话',
    stepNumber: 3,
    isInProgress: false
  },
  'Modal_Page_07_Techniques': {
    number: '7',
    desc: '发酵技巧讲堂',
    stepNumber: 3,
    isInProgress: false
  },
  'Modal_Page_08_Discussion': {
    number: '8',
    desc: '发酵问题讨论',
    stepNumber: 3,
    isInProgress: false
  },
  'Modal_Page_09_Yeast_Dosage': {
    number: '9',
    desc: '酵母用量秘籍',
    stepNumber: 3,
    isInProgress: false
  },
  'Page_10_Hypothesis_Focus': {
    number: '10',
    desc: '第四题',
    stepNumber: 4,
    isInProgress: true
  },
  'Page_11_Solution_Design_Measurement_Ideas': {
    number: '11',
    desc: '第五题',
    stepNumber: 5,
    isInProgress: true
  },
  'Page_12_Solution_Evaluation_Measurement_Critique': {
    number: '12',
    desc: '第六题',
    stepNumber: 6,
    isInProgress: true
  },
  'Page_13_Transition_To_Simulation': {
    number: '13',
    desc: '第七题',
    stepNumber: 7,
    isInProgress: true
  },
  'Page_14_Simulation_Intro_Exploration': {
    number: '14',
    desc: '第八题',
    stepNumber: 8,
    isInProgress: true
  },
  'Page_15_Simulation_Question_1': {
    number: '15',
    desc: '第九题',
    stepNumber: 9,
    isInProgress: true
  },
  'Page_16_Simulation_Question_2': {
    number: '16',
    desc: '第十题',
    stepNumber: 10,
    isInProgress: true
  },
  'Page_17_Simulation_Question_3': {
    number: '17',
    desc: '第十一题',
    stepNumber: 11,
    isInProgress: true
  },
  'Page_18_Solution_Selection': {
    number: '18',
    desc: '第十二题',
    stepNumber: 12,
    isInProgress: true
  },
  'Page_19_Task_Completion': {
    number: '19',
    desc: '第十三题',
    stepNumber: 13,
    isInProgress: true
  },
  // 问卷调查页面映射
  'Page_20_Questionnaire_Intro': {
    number: '20',
    desc: '问卷调查说明',
    stepNumber: 14,
    isInProgress: true
  },
  'Page_21_Curiosity_Questions': {
    number: '21',
    desc: '好奇心问卷',
    stepNumber: 15,
    isInProgress: true
  },
  'Page_22_Creativity_Questions': {
    number: '22',
    desc: '创造力问卷',
    stepNumber: 16,
    isInProgress: true
  },
  'Page_23_Imagination_Questions': {
    number: '23',
    desc: '想象力问卷',
    stepNumber: 17,
    isInProgress: true
  },
  'Page_24_Science_Efficacy_Questions': {
    number: '24',
    desc: '科学自效能问卷',
    stepNumber: 18,
    isInProgress: true
  },
  'Page_25_Environment_Questions': {
    number: '25',
    desc: '创造环境问卷',
    stepNumber: 19,
    isInProgress: true
  },
  'Page_26_School_Activities': {
    number: '26',
    desc: '校内科学活动调查',
    stepNumber: 20,
    isInProgress: true
  },
  'Page_27_Outschool_Activities': {
    number: '27',
    desc: '校外科学活动调查',
    stepNumber: 21,
    isInProgress: true
  },
  'Page_28_Effort_Submit': {
    number: '28',
    desc: '努力评估与提交',
    stepNumber: 22,
    isInProgress: true
  }
};

/**
 * PageNum到PageId的映射表
 * 用于根据后端返回的pageNum自动跳转到对应的页面
 */
export const pageNumToPageIdMapping = {
  '0': 'Page_01_Precautions',     // pageNum 0: 从登录开始
  '1': 'Page_01_Precautions',     // pageNum 1: 注意事项页面
  '2': 'Page_02_Introduction',    // pageNum 2: 第一题
  '3': 'Page_03_Dialogue_Question', // pageNum 3: 第二题
  '4': 'Page_04_Material_Reading_Factor_Selection', // pageNum 4: 第三题
  '10': 'Page_10_Hypothesis_Focus', // pageNum 10: 第四题
  '11': 'Page_11_Solution_Design_Measurement_Ideas', // pageNum 11: 第五题
  '12': 'Page_12_Solution_Evaluation_Measurement_Critique', // pageNum 12: 第六题
  '13': 'Page_13_Transition_To_Simulation', // pageNum 13: 第七题
  '14': 'Page_14_Simulation_Intro_Exploration', // pageNum 14: 第八题
  '15': 'Page_15_Simulation_Question_1', // pageNum 15: 第九题
  '16': 'Page_16_Simulation_Question_2', // pageNum 16: 第十题
  '17': 'Page_17_Simulation_Question_3', // pageNum 17: 第十一题
  '18': 'Page_18_Solution_Selection', // pageNum 18: 第十二题
  '19': 'Page_19_Task_Completion',  // pageNum 19: 第十三题（任务完成）
  // 问卷页面映射
  '20': 'Page_20_Questionnaire_Intro', // pageNum 20: 问卷说明
  '21': 'Page_21_Curiosity_Questions', // pageNum 21: 好奇心问卷
  '22': 'Page_22_Creativity_Questions', // pageNum 22: 创造力问卷
  '23': 'Page_23_Imagination_Questions', // pageNum 23: 想象力问卷
  '24': 'Page_24_Science_Efficacy_Questions', // pageNum 24: 科学自效能问卷
  '25': 'Page_25_Environment_Questions', // pageNum 25: 创造环境问卷
  '26': 'Page_26_School_Activities', // pageNum 26: 校内科学活动
  '27': 'Page_27_Outschool_Activities', // pageNum 27: 校外科学活动
  '28': 'Page_28_Effort_Submit' // pageNum 28: 努力评估与提交
};

/**
 * 根据后端返回的pageNum获取对应的页面ID
 * @param {string|number} pageNum - 后端返回的页面编号
 * @returns {string} 对应的页面ID，如果找不到则返回注意事项页面
 */
export const getPageIdFromPageNum = (pageNum) => {
  const pageNumStr = String(pageNum);
  const pageId = pageNumToPageIdMapping[pageNumStr];
  
  if (!pageId) {
    console.warn(`[pageMappings] 未找到pageNum ${pageNum}对应的页面，默认跳转到注意事项页面`);
    return 'Page_01_Precautions';
  }
  
  console.log(`[pageMappings] pageNum ${pageNum} 映射到页面: ${pageId}`);
  return pageId;
};

/**
 * 根据pageNum判断用户是否已完成所有任务（包括问卷）
 * @param {string|number} pageNum - 后端返回的页面编号
 * @returns {boolean} 是否已完成所有任务
 */
export const isTaskCompletedByPageNum = (pageNum) => {
  const pageNumStr = String(pageNum);
  return parseInt(pageNumStr) >= 28; // 所有内容完成需要到达28（问卷最后一页）
};

/**
 * 根据pageNum判断用户是否已完成主任务（测评部分）
 * @param {string|number} pageNum - 后端返回的页面编号
 * @returns {boolean} 是否已完成主任务
 */
export const isMainTaskCompletedByPageNum = (pageNum) => {
  const pageNumStr = String(pageNum);
  return parseInt(pageNumStr) >= 19; // 主任务完成为19
};

/**
 * 根据pageNum获取应该跳转的目标页面
 * 如果用户已完成当前pageNum对应的页面，则跳转到下一页
 * @param {string|number} pageNum - 后端返回的页面编号
 * @returns {string} 应该跳转到的页面ID
 */
export const getTargetPageIdFromPageNum = (pageNum) => {
  const pageNumStr = String(pageNum);
  const pageNumInt = parseInt(pageNumStr);
  
  // 如果已完成所有任务（包括问卷），直接跳转到最终提交页面并标记为已完成
  if (isTaskCompletedByPageNum(pageNum)) {
    console.log(`[pageMappings] 所有任务已完成，pageNum: ${pageNum}，跳转到最终提交页面`);
    return 'Page_28_Effort_Submit';
  }
  
  // 如果已经进入问卷阶段（pageNum >= 20）但还未完成所有问卷，跳转到对应的问卷页面
  // 注意：pageNum为19时应该停留在19页，让用户手动点击按钮进入问卷
  if (pageNumInt >= 20 && pageNumInt < 28) {
    const targetPageId = pageNumToPageIdMapping[pageNumStr];
    if (targetPageId) {
      console.log(`[pageMappings] 用户正在问卷阶段，pageNum: ${pageNum}，跳转到: ${targetPageId}`);
      return targetPageId;
    } else {
      console.log(`[pageMappings] 问卷阶段但找不到对应页面，pageNum: ${pageNum}，跳转到问卷说明页`);
      return 'Page_20_Questionnaire_Intro';
    }
  }
  
  // 如果pageNum对应一个存在的页面，直接跳转到该页面
  const targetPageId = pageNumToPageIdMapping[pageNumStr];
  if (targetPageId) {
    console.log(`[pageMappings] 找到pageNum ${pageNum}对应的页面: ${targetPageId}`);
    return targetPageId;
  }
  
  // 如果当前pageNum对应一个有效页面，跳转到下一页
  // 否则跳转到当前pageNum对应的页面
  const currentPageId = getPageIdFromPageNum(pageNum);
  const nextPageId = getNextPageId(currentPageId);
  
  // 如果有下一页且pageNum大于等于当前页面编号，说明用户已完成当前页面
  if (nextPageId && pageNumInt >= parseInt(pageInfoMapping[currentPageId]?.number || '0')) {
    console.log(`[pageMappings] 用户已完成pageNum ${pageNum}，跳转到下一页: ${nextPageId}`);
    return nextPageId;
  }
  
  // 否则跳转到当前页面
  console.log(`[pageMappings] 用户需要继续完成pageNum ${pageNum}，跳转到: ${currentPageId}`);
  return currentPageId;
};

/**
 * 总的用户可见步骤数
 */
export const TOTAL_USER_STEPS = 13;

/**
 * 问卷总步骤数
 */
export const TOTAL_QUESTIONNAIRE_STEPS = 9;

/**
 * 问卷页面ID到问卷步骤号的映射
 */
export const questionnaireStepMapping = {
  'Page_20_Questionnaire_Intro': 1,
  'Page_21_Curiosity_Questions': 2,
  'Page_22_Creativity_Questions': 3,
  'Page_23_Imagination_Questions': 4,
  'Page_24_Science_Efficacy_Questions': 5,
  'Page_25_Environment_Questions': 6,
  'Page_26_School_Activities': 7,
  'Page_27_Outschool_Activities': 8,
  'Page_28_Effort_Submit': 9
};

/**
 * 获取当前页面的问卷步骤号
 * @param {string} pageId - 页面ID
 * @returns {number} 问卷步骤号，如果不是问卷页面则返回0
 */
export const getQuestionnaireStepNumber = (pageId) => {
  return questionnaireStepMapping[pageId] || 0;
};

/**
 * 判断当前页面是否是问卷页面
 * @param {string} pageId - 页面ID
 * @returns {boolean} 是否是问卷页面
 */
export const isQuestionnairePage = (pageId) => {
  return pageId && Object.prototype.hasOwnProperty.call(questionnaireStepMapping, pageId);
};

/**
 * 获取下一页ID
 * 根据当前页面ID获取下一页ID
 * @param {string} currentPageId - 当前页面ID
 * @returns {string|null} 下一页ID，如果没有下一页则返回null
 */
export const getNextPageId = (currentPageId) => {
  // 完整的页面序列，包括主任务和问卷调查
  const pageSequence = [
    'Page_01_Precautions',
    'Page_02_Introduction',
    'Page_03_Dialogue_Question',
    'Page_04_Material_Reading_Factor_Selection',
    'Page_10_Hypothesis_Focus',
    'Page_11_Solution_Design_Measurement_Ideas',
    'Page_12_Solution_Evaluation_Measurement_Critique',
    'Page_13_Transition_To_Simulation',
    'Page_14_Simulation_Intro_Exploration',
    'Page_15_Simulation_Question_1',
    'Page_16_Simulation_Question_2',
    'Page_17_Simulation_Question_3',
    'Page_18_Solution_Selection',
    'Page_19_Task_Completion',
    // 问卷调查页面
    'Page_20_Questionnaire_Intro',
    'Page_21_Curiosity_Questions',
    'Page_22_Creativity_Questions',
    'Page_23_Imagination_Questions',
    'Page_24_Science_Efficacy_Questions',
    'Page_25_Environment_Questions',
    'Page_26_School_Activities',
    'Page_27_Outschool_Activities',
    'Page_28_Effort_Submit'
  ];

  const currentIndex = pageSequence.indexOf(currentPageId);
  if (currentIndex === -1 || currentIndex === pageSequence.length - 1) {
    return null;
  }
  
  return pageSequence[currentIndex + 1];
};

/**
 * 获取页面标题
 * 根据页面ID获取页面标题
 * @param {string} pageId - 页面ID
 * @returns {string} 页面标题
 */
export const getPageTitle = (pageId) => {
  const titleMap = {
    'Page_Login': '登录 - 蒸馒头科学探究任务',
    'Page_01_Precautions': '注意事项',
    'Page_02_Introduction': '蒸馒头',
    'Page_03_Dialogue_Question': '蒸馒头',
    'Page_04_Material_Reading_Factor_Selection': '蒸馒头:资料阅读',
    'Modal_Page_05_Process': '蒸馒头全流程',
    'Modal_Page_06_Principle': '发酵原理趣话',
    'Modal_Page_07_Techniques': '发酵技巧讲堂',
    'Modal_Page_08_Discussion': '发酵问题讨论',
    'Modal_Page_09_Yeast_Dosage': '酵母用量秘籍',
    'Page_10_Hypothesis_Focus': '蒸馒头',
    'Page_11_Solution_Design_Measurement_Ideas': '蒸馒头:方案设计',
    'Page_12_Solution_Evaluation_Measurement_Critique': '蒸馒头:方案评估',
    'Page_13_Transition_To_Simulation': '蒸馒头',
    'Page_14_Simulation_Intro_Exploration': '蒸馒头:模拟实验',
    'Page_15_Simulation_Question_1': '蒸馒头:模拟实验',
    'Page_16_Simulation_Question_2': '蒸馒头:模拟实验',
    'Page_17_Simulation_Question_3': '蒸馒头:模拟实验',
    'Page_18_Solution_Selection': '蒸馒头:方案选择',
    'Page_19_Task_Completion': '蒸馒头:任务完成'
  };
  
  return titleMap[pageId] || '蒸馒头探究任务';
}; 