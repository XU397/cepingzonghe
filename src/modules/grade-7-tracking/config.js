/**
 * 7年级追踪测评模块配置文件
 * 定义页面映射、导航模式、实验参数等核心配置
 */

// 页面编号到描述和导航模式的映射
export const PAGE_MAPPING = {
  // 过渡页(无导航栏)
  0.1: { desc: '注意事项', navigationMode: 'hidden', pageId: 'Page_00_1_Precautions' },
  0.2: { desc: '问卷说明', navigationMode: 'hidden', pageId: 'Page_00_2_QuestionnaireIntro' },

  // 人机交互部分(第1-13页)
  1: { desc: '蜂蜜的奥秘', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_01_Intro' },
  2: { desc: '提出问题', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_02_Question' },
  3: { desc: '资料阅读', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_03_Resource' },
  4: { desc: '假设陈述', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_04_Hypothesis' },
  5: { desc: '方案设计', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_05_Design' },
  6: { desc: '方案评估', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_06_Evaluation' },
  7: { desc: '过渡页', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_07_Transition' },
  8: { desc: '模拟实验', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_08_Experiment' },
  9: { desc: '实验分析1', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_09_Analysis1' },
  10: { desc: '实验分析2', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_10_Analysis2' },
  11: { desc: '实验分析3', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_11_Analysis3' },
  12: { desc: '方案选择', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_12_Solution' },
  13: { desc: '任务总结', navigationMode: 'experiment', totalPages: 13, pageId: 'Page_13_Summary' },

  // 问卷部分(第14-21页)
  14: { desc: '问卷调查第1页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_01' },
  15: { desc: '问卷调查第2页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_02' },
  16: { desc: '问卷调查第3页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_03' },
  17: { desc: '问卷调查第4页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_04' },
  18: { desc: '问卷调查第5页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_05' },
  19: { desc: '问卷调查第6页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_06' },
  20: { desc: '问卷调查第7页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_07' },
  21: { desc: '问卷调查第8页', navigationMode: 'questionnaire', totalPages: 8, pageId: 'Questionnaire_08' },

  // 完成页
  22: { desc: '问卷已完成', navigationMode: 'hidden', pageId: 'Page_22_Completion' }
};

// 实验参数选项
export const WATER_CONTENT_OPTIONS = [15, 17, 19, 21]; // 含水量百分比(4个量筒)
export const TEMPERATURE_OPTIONS = [25, 30, 35, 40, 45]; // 温度(摄氏度, 5档)

// 计时器配置
export const EXPERIMENT_DURATION = 40 * 60; // 40分钟(秒)
export const QUESTIONNAIRE_DURATION = 10 * 60; // 10分钟(秒)
export const NOTICE_COUNTDOWN = 40; // 注意事项倒计时(秒)

// 心跳检测配置
export const HEARTBEAT_INTERVAL = 30 * 1000; // 30秒(毫秒)

// 模块信息
export const MODULE_ID = 'grade-7-tracking';
export const MODULE_DISPLAY_NAME = '7年级追踪测评-蜂蜜黏度探究';
export const MODULE_URL = '/grade-7-tracking';
export const MODULE_VERSION = '1.0.0';
