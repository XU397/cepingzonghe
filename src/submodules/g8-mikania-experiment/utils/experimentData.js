/**
 * 薇甘菊防治实验数据模型
 * 发芽率数据表 - 必须严格遵循，不得随机生成
 */

// 发芽率数据表 (处理时间/天 -> 浓度 -> 发芽率%)
export const GERMINATION_DATA = {
  1: { 0: 0, 5: 0, 10: 0 },
  2: { 0: 45, 5: 15, 10: 10 },
  3: { 0: 68, 5: 30, 10: 22 },
  4: { 0: 72, 5: 40, 10: 35 },
  5: { 0: 75, 5: 50, 10: 45 },
  6: { 0: 78, 5: 55, 10: 50 },
  7: { 0: 78, 5: 60, 10: 55 },
};

// 按浓度组织的数据 (用于图表)
export const GERMINATION_BY_CONCENTRATION = {
  '0mg/ml': [0, 45, 68, 72, 75, 78, 78],
  '5mg/ml': [0, 15, 30, 40, 50, 55, 60],
  '10mg/ml': [0, 10, 22, 35, 45, 50, 55],
};

// 浓度选项
export const CONCENTRATION_OPTIONS = [
  { value: 0, label: '0mg/ml' },
  { value: 5, label: '5mg/ml' },
  { value: 10, label: '10mg/ml' },
];

// 天数范围
export const DAYS_RANGE = {
  min: 1,
  max: 7,
  default: 1,
};

// 种子总数
export const TOTAL_SEEDS = 60;

// Valid concentration values
const VALID_CONCENTRATIONS = [0, 5, 10];

/**
 * 获取发芽率
 * @param {number} concentration - 浓度 (0, 5, 10)
 * @param {number} days - 天数 (1-7)
 * @returns {number|null} 发芽率百分比, or null if invalid params
 */
export function getGerminationRate(concentration, days) {
  if (!isValidConcentration(concentration) || !isValidDays(days)) {
    return null;
  }
  return GERMINATION_DATA[days][concentration];
}

/**
 * Get germination data organized by concentration for chart rendering
 * @returns {Object} Data organized as { concentration: [{ day, rate }] }
 */
export function getGerminationByConcentration() {
  const result = {
    0: [],
    5: [],
    10: []
  };

  for (let day = DAYS_RANGE.min; day <= DAYS_RANGE.max; day++) {
    VALID_CONCENTRATIONS.forEach(concentration => {
      result[concentration].push({
        day,
        rate: GERMINATION_DATA[day][concentration]
      });
    });
  }

  return result;
}

/**
 * 计算发芽种子数量
 * @param {number} concentration - 浓度
 * @param {number} days - 天数
 * @returns {number} 发芽种子数量
 */
export function getSproutedSeedCount(concentration, days) {
  const rate = getGerminationRate(concentration, days);
  if (rate === null) return 0;
  return Math.round((rate / 100) * TOTAL_SEEDS);
}

/**
 * 验证浓度值
 * @param {number} value - 浓度值
 * @returns {boolean}
 */
export function isValidConcentration(value) {
  return VALID_CONCENTRATIONS.includes(value);
}

/**
 * 验证天数值
 * @param {number} value - 天数值
 * @returns {boolean}
 */
export function isValidDays(value) {
  return Number.isInteger(value) && value >= DAYS_RANGE.min && value <= DAYS_RANGE.max;
}
