/**
 * 蜂蜜黏度物理模型
 *
 * 基于实际实验数据表:
 * - 数据来源: 7年级追踪测评需求文档中的实验数据表
 * - 含水量选项: 15%, 17%, 19%, 21%
 * - 温度选项: 25℃, 30℃, 35℃, 40℃, 45℃
 * - 数据表示小球在蜂蜜中的下落时间(秒)
 *
 * 实验数据表:
 * ┌────────┬──────┬──────┬──────┬──────┬──────┐
 * │ 温度\含水量│ 15%  │ 17%  │ 19%  │ 21%  │
 * ├────────┼──────┼──────┼──────┼──────┤
 * │  25℃  │ 16.5 │  5.7 │  2.9 │  1.5 │
 * │  30℃  │  8.6 │  3.1 │  1.6 │  1.1 │
 * │  35℃  │  4.8 │  1.8 │  1.0 │  0.7 │
 * │  40℃  │  2.7 │  1.1 │  0.6 │  0.4 │
 * │  45℃  │  1.6 │  0.7 │  0.4 │  0.3 │
 * └────────┴──────┴──────┴──────┴──────┘
 */

/**
 * 实验数据表 - 小球下落时间(秒)
 * 第一层键: 含水量(15, 17, 19, 21)
 * 第二层键: 温度(25, 30, 35, 40, 45)
 * 值: 下落时间(秒)
 */
const FALL_TIME_DATA = {
  15: {
    25: 16.5,
    30: 8.6,
    35: 4.8,
    40: 2.7,
    45: 1.6
  },
  17: {
    25: 5.7,
    30: 3.1,
    35: 1.8,
    40: 1.1,
    45: 0.7
  },
  19: {
    25: 2.9,
    30: 1.6,
    35: 1.0,
    40: 0.6,
    45: 0.4
  },
  21: {
    25: 1.5,
    30: 1.1,
    35: 0.7,
    40: 0.4,
    45: 0.3
  }
};

/**
 * 计算小球在蜂蜜中的下落时间
 *
 * @param {number} waterContent - 含水量百分比(15, 17, 19, 21)
 * @param {number} temperature - 温度(摄氏度, 25-45)
 * @returns {number} 下落时间(秒)
 */
export function calculateFallTime(waterContent, temperature) {
  // 验证参数
  if (!FALL_TIME_DATA[waterContent]) {
    console.error(`[physicsModel] Invalid water content: ${waterContent}`);
    return 5.0; // 返回默认值
  }

  if (!FALL_TIME_DATA[waterContent][temperature]) {
    console.error(`[physicsModel] Invalid temperature: ${temperature} for water content: ${waterContent}`);
    return 5.0; // 返回默认值
  }

  // 直接返回数据表中的精确值，不添加任何波动
  return FALL_TIME_DATA[waterContent][temperature];
}

/**
 * 验证实验参数是否有效
 *
 * @param {number} waterContent - 含水量百分比
 * @param {number} temperature - 温度(摄氏度)
 * @returns {{isValid: boolean, error?: string}} 验证结果
 */
export function validateExperimentParameters(waterContent, temperature) {
  const validWaterContents = [15, 17, 19, 21];
  const validTemperatures = [25, 30, 35, 40, 45];

  if (!validWaterContents.includes(waterContent)) {
    return {
      isValid: false,
      error: `含水量必须是 ${validWaterContents.join(', ')} 之一`
    };
  }

  if (!validTemperatures.includes(temperature)) {
    return {
      isValid: false,
      error: `温度必须是 ${validTemperatures.join(', ')} 之一`
    };
  }

  return { isValid: true };
}

/**
 * 计算预期下落时间范围(用于验证实验结果的合理性)
 *
 * @param {number} waterContent - 含水量百分比
 * @param {number} temperature - 温度(摄氏度)
 * @returns {{min: number, max: number, avg: number}} 时间范围(秒)
 */
export function calculateExpectedRange(waterContent, temperature) {
  // 验证参数
  if (!FALL_TIME_DATA[waterContent] || !FALL_TIME_DATA[waterContent][temperature]) {
    console.error(`[physicsModel] Invalid parameters for range calculation: waterContent=${waterContent}, temperature=${temperature}`);
    return {
      min: 0.0,
      max: 0.0,
      avg: 0.0
    };
  }

  // 获取精确时间（无波动）
  const exactTime = FALL_TIME_DATA[waterContent][temperature];

  // 返回精确值（min、max、avg都相同）
  return {
    min: exactTime,
    max: exactTime,
    avg: exactTime
  };
}

/**
 * 获取所有实验参数组合的数据
 * 用于生成折线图或数据表格
 *
 * @returns {Array<{waterContent: number, temperature: number, fallTime: number}>} 所有组合的数据
 */
export function getAllExperimentData() {
  const data = [];

  for (const waterContent in FALL_TIME_DATA) {
    for (const temperature in FALL_TIME_DATA[waterContent]) {
      data.push({
        waterContent: parseInt(waterContent),
        temperature: parseInt(temperature),
        fallTime: FALL_TIME_DATA[waterContent][temperature]
      });
    }
  }

  return data;
}
