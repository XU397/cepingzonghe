// GSD 查找表 - 9种参数组合
export const GSD_LOOKUP_TABLE: Record<string, number> = {
  '100-8': 3.01,
  '100-24': 1.00,
  '100-50': 0.48,
  '200-8': 6.03,
  '200-24': 2.01,
  '200-50': 0.96,
  '300-8': 9.04,
  '300-24': 3.01,
  '300-50': 1.45,
};

// Height can be 0 (ground), 100, 200, or 300
export type Height = 0 | 100 | 200 | 300;
export type FocalLength = 8 | 24 | 50;

// 查找 GSD 值
export function lookupGSD(height: Height, focalLength: FocalLength): number {
  if (height === 0) return 0;
  const key = `${height}-${focalLength}`;
  return GSD_LOOKUP_TABLE[key] ?? 0;
}

// 计算模糊量 (系数默认0.8)
export function calculateBlurAmount(gsd: number, coefficient: number = 0.8): number {
  return gsd * coefficient;
}
