/**
 * Questionnaire Data Loader Utility
 * 加载和处理问卷数据的工具函数
 */

import questionnaireData from '../assets/data/questionnaire.json';

/**
 * 根据页码获取问卷页面数据
 *
 * @param {number} pageNumber - 页码 (14-21)
 * @returns {Object|null} 页面数据对象
 */
export function getQuestionnairePageData(pageNumber) {
  if (!questionnaireData || !questionnaireData.pages) {
    console.error('[questionnaireLoader] Invalid questionnaire data structure');
    return null;
  }

  const pageData = questionnaireData.pages.find((page) => page.pageNumber === pageNumber);

  if (!pageData) {
    console.warn(`[questionnaireLoader] No data found for page ${pageNumber}`);
    return null;
  }

  return pageData;
}

/**
 * 获取所有问卷页面的页码列表
 *
 * @returns {number[]} 页码数组 [14, 15, 16, ...]
 */
export function getAllQuestionnairePageNumbers() {
  if (!questionnaireData || !questionnaireData.pages) {
    return [];
  }

  return questionnaireData.pages.map((page) => page.pageNumber).sort((a, b) => a - b);
}

/**
 * 获取问卷总题目数
 *
 * @returns {number} 总题目数
 */
export function getTotalQuestions() {
  return questionnaireData?.totalQuestions || 0;
}

/**
 * 检查是否是最后一个问卷页面
 *
 * @param {number} pageNumber - 当前页码
 * @returns {boolean} 是否是最后一页
 */
export function isLastQuestionnairePage(pageNumber) {
  const pageNumbers = getAllQuestionnairePageNumbers();
  return pageNumber === pageNumbers[pageNumbers.length - 1];
}

/**
 * 获取下一个问卷页面的页码
 *
 * @param {number} currentPageNumber - 当前页码
 * @returns {number|null} 下一页页码，如果已是最后一页则返回null
 */
export function getNextQuestionnairePage(currentPageNumber) {
  const pageNumbers = getAllQuestionnairePageNumbers();
  const currentIndex = pageNumbers.indexOf(currentPageNumber);

  if (currentIndex === -1 || currentIndex === pageNumbers.length - 1) {
    return null;
  }

  return pageNumbers[currentIndex + 1];
}
