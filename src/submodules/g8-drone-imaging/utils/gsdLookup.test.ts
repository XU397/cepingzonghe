import { describe, it, expect } from 'vitest';
import { lookupGSD, calculateBlurAmount } from './gsdLookup';

describe('gsdLookup - GSD 查找与模糊度计算', () => {
  describe('lookupGSD', () => {
    it('应根据高度和焦距返回正确的 GSD（数据模型说明书 GSD 查找表）', () => {
      const cases: Array<{ height: 100 | 200 | 300; focalLength: 8 | 24 | 50; expected: number }> = [
        { height: 100, focalLength: 8, expected: 3.01 },
        { height: 100, focalLength: 24, expected: 1.0 },
        { height: 100, focalLength: 50, expected: 0.48 },
        { height: 200, focalLength: 8, expected: 6.03 },
        { height: 200, focalLength: 24, expected: 2.01 },
        { height: 200, focalLength: 50, expected: 0.96 },
        { height: 300, focalLength: 8, expected: 9.04 },
        { height: 300, focalLength: 24, expected: 3.01 },
        { height: 300, focalLength: 50, expected: 1.45 },
      ];

      cases.forEach(({ height, focalLength, expected }) => {
        const gsd = lookupGSD(height, focalLength);
        expect(gsd).toBeCloseTo(expected, 2);
      });
    });

    it('应在查找表中不存在的高度/焦距组合时返回默认值 0（说明书：未找到时使用默认值）', () => {
      // 通过断言类型为 any 来构造“异常 key”场景
      const gsd = lookupGSD(999 as any, 8 as any);
      expect(gsd).toBe(0);
    });
  });

  describe('calculateBlurAmount', () => {
    it('应按默认系数 0.8 正确计算模糊量（说明书 calculateBlurAmount 规则）', () => {
      const gsd = 3.01;
      const blur = calculateBlurAmount(gsd);
      expect(blur).toBeCloseTo(3.01 * 0.8, 5);
    });

    it('应支持传入自定义系数计算模糊量', () => {
      const gsd = 9.04;
      const blur = calculateBlurAmount(gsd, 0.5);
      expect(blur).toBeCloseTo(9.04 * 0.5, 5);
    });

    it('当 GSD 为 0（例如未知组合回退值）时，模糊量也应为 0', () => {
      const gsd = lookupGSD(999 as any, 50 as any);
      const blur = calculateBlurAmount(gsd);
      expect(gsd).toBe(0);
      expect(blur).toBe(0);
    });
  });
});

