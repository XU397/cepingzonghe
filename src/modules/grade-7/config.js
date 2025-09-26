/**
 * 7年级模块配置
 * 
 * 封装现有的页面映射和配置信息
 * 保持与现有 pageMappings.js 的兼容性
 */

// 导入必要的映射函数
import { 
  pageInfoMapping, 
  pageNumToPageIdMapping, 
  TOTAL_USER_STEPS, 
  TOTAL_QUESTIONNAIRE_STEPS,
  getTargetPageIdFromPageNum,
  isTaskCompletedByPageNum,
  isQuestionnairePage
} from '../../utils/pageMappings.js';

/**
 * 7年级模块配置对象
 * 基于现有的pageInfoMapping数据结构
 */
export const grade7Config = {
  // 模块基本信息
  moduleId: 'grade-7',
  displayName: '7年级蒸馒头科学探究测评',
  url: '/seven-grade',
  version: '1.0.0',
  
  // 测评时间配置
  timers: {
    mainTask: 40 * 60,        // 主任务40分钟
    questionnaire: 10 * 60    // 问卷10分钟
  },

  // API端点配置（使用现有的）
  apiEndpoints: {
    login: '/login',
    saveHcMark: '/saveHcMark'
  },

  // 页面配置 - 引用现有的页面映射
  // 注意：这里我们不复制数据，而是引用现有的配置
  get pages() {
    return pageInfoMapping || {};
  },

  // 页面编号到页面ID的映射 - 引用现有的映射
  get pageNumMapping() {
    return pageNumToPageIdMapping || {};
  },

  // 总步骤数 - 引用现有的配置
  get totalSteps() {
    return TOTAL_USER_STEPS || 0;
  },

  // 问卷相关配置
  questionnaire: {
    get totalSteps() {
      return TOTAL_QUESTIONNAIRE_STEPS || 9;
    }
  },

  // 页面恢复相关的工具函数
  pageUtils: {
    /**
     * 根据pageNum获取目标页面ID
     * 使用现有的页面恢复逻辑
     */
    getTargetPageId: (pageNum) => {
      try {
        return getTargetPageIdFromPageNum(pageNum);
      } catch (error) {
        console.error('[Grade7Config] ❌ 页面恢复失败:', error);
        return 'Page_01_Precautions'; // 默认页面
      }
    },

    /**
     * 检查任务是否完成
     */
    isTaskCompleted: (pageNum) => {
      try {
        return isTaskCompletedByPageNum(pageNum);
      } catch (error) {
        console.error('[Grade7Config] ❌ 任务完成检查失败:', error);
        return false;
      }
    },

    /**
     * 检查是否为问卷页面
     */
    isQuestionnairePage: (pageId) => {
      try {
        return isQuestionnairePage(pageId);
      } catch (error) {
        console.error('[Grade7Config] ❌ 问卷页面检查失败:', error);
        return false;
      }
    }
  },

  // 模块特性标识
  features: [
    'page-resume',        // 支持页面恢复
    'timer-system',       // 支持计时器系统
    'data-logging',       // 支持数据日志
    'questionnaire',      // 支持问卷调查
    'simulation',         // 支持仿真实验
    'material-reading'    // 支持材料阅读
  ],

  // 开发调试配置
  debug: {
    enabled: import.meta.env.DEV,
    logLevel: 'info'
  }
};

/**
 * 获取模块配置的快照
 * 用于调试和状态检查
 */
export const getConfigSnapshot = () => {
  return {
    moduleId: grade7Config.moduleId,
    displayName: grade7Config.displayName,
    url: grade7Config.url,
    version: grade7Config.version,
    timers: grade7Config.timers,
    totalSteps: grade7Config.totalSteps,
    questionnaireTotalSteps: grade7Config.questionnaire.totalSteps,
    pageCount: Object.keys(grade7Config.pages).length,
    features: grade7Config.features
  };
};

export default grade7Config;