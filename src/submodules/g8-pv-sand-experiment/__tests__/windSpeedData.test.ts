import { describe, it, expect } from 'vitest';
import {
  WIND_SPEED_DATA,
  HEIGHT_LEVELS,
  DEFAULT_HEIGHT,
  ANIMATION_DURATION,
  validateHeightLevel,
  getWindSpeedData
} from '../constants/windSpeedData';

describe('windSpeedData 常量与工具', () => {
  it('高度列表和默认值应保持一致', () => {
    expect(HEIGHT_LEVELS).toEqual([20, 50, 100]);
    expect(DEFAULT_HEIGHT).toBe(50);
    expect(ANIMATION_DURATION).toBe(2000);
  });

  it('validateHeightLevel 应正确判断合法高度', () => {
    HEIGHT_LEVELS.forEach((height) => {
      expect(validateHeightLevel(height)).toBe(true);
    });
    [0, 10, 30, 70, 999].forEach((height) => {
      expect(validateHeightLevel(height)).toBe(false);
    });
  });

  it('getWindSpeedData 应按高度返回预定义风速数据', () => {
    HEIGHT_LEVELS.forEach((height) => {
      const data = getWindSpeedData(height);
      expect(data).toEqual(WIND_SPEED_DATA[height]);
      expect(typeof data.withPanel).toBe('number');
      expect(typeof data.noPanel).toBe('number');
      expect(data.noPanel).toBeGreaterThan(0);
    });
  });
});
