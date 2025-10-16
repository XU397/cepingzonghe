/**
 * 蜂蜜黏度物理模型
 *
 * 基于简化的Stokes定律近似:
 * - 基准下落时间: 10.0秒 (15%含水量@25℃)
 * - 含水量影响: 每增加1%,时间减少约8%
 * - 温度影响: 每增加5℃,时间减少约10%
 *
 * 参考: research.md - Research Topic 1
 */

/**
 * 计算小球在蜂蜜中的下落时间
 *
 * @param {number} waterContent - 含水量百分比(15, 17, 19, 21)
 * @param {number} temperature - 温度(摄氏度, 25-45)
 * @returns {number} 下落时间(秒, 保留1位小数)
 */
export function calculateFallTime(waterContent, temperature) {
  // 基准参数
  const BASE_TIME = 10.0; // 基准下落时间(秒), 15%含水量@25℃
  const WATER_BASE = 15; // 基准含水量
  const TEMP_BASE = 25; // 基准温度

  // 含水量影响系数: 含水量每增加1%, 时间减少约8%
  const waterContentFactor = 1 - (waterContent - WATER_BASE) * 0.08;

  // 温度影响系数: 温度每增加1℃, 时间减少约2%
  const temperatureFactor = 1 - (temperature - TEMP_BASE) * 0.02;

  // 计算理论下落时间
  const theoreticalTime = BASE_TIME * waterContentFactor * temperatureFactor;

  // 添加±4%的随机波动(模拟真实实验的测量误差)
  const randomVariation = 0.96 + Math.random() * 0.08; // 0.96-1.04

  // 返回最终时间(保留1位小数)
  const fallTime = theoreticalTime * randomVariation;
  return parseFloat(fallTime.toFixed(1));
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
  const BASE_TIME = 10.0;
  const waterContentFactor = 1 - (waterContent - 15) * 0.08;
  const temperatureFactor = 1 - (temperature - 25) * 0.02;

  const avgTime = BASE_TIME * waterContentFactor * temperatureFactor;

  return {
    min: parseFloat((avgTime * 0.96).toFixed(1)),
    max: parseFloat((avgTime * 1.04).toFixed(1)),
    avg: parseFloat(avgTime.toFixed(1))
  };
}
