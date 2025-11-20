import { describe, it, expect } from 'vitest';
import {
  GERMINATION_DATA,
  GERMINATION_BY_CONCENTRATION,
  CONCENTRATION_OPTIONS,
  DAYS_RANGE,
  TOTAL_SEEDS,
  getGerminationRate,
  getGerminationByConcentration,
  getSproutedSeedCount,
  isValidConcentration,
  isValidDays,
} from '../utils/experimentData';

describe('experiment data utilities', () => {
  it('returns germination rate only for valid concentration/days pairs', () => {
    expect(getGerminationRate(0, 1)).toBe(GERMINATION_DATA[1][0]);
    expect(getGerminationRate(10, 7)).toBe(GERMINATION_DATA[7][10]);

    expect(getGerminationRate(99, 1)).toBeNull();
    expect(getGerminationRate(0, 12)).toBeNull();
  });

  it('generates per-concentration series for charts', () => {
    const chartData = getGerminationByConcentration();

    expect(Object.keys(chartData)).toEqual(['0', '5', '10']);
    Object.entries(chartData).forEach(([concentration, series]) => {
      expect(series).toHaveLength(DAYS_RANGE.max);
      series.forEach((point, idx) => {
        expect(point.day).toBe(idx + 1);
        expect(point.rate).toBe(GERMINATION_DATA[idx + 1][Number(concentration)]);
      });
    });
  });

  it('computes sprouted seed counts from rates', () => {
    const rate = GERMINATION_DATA[5][5]; // 50%
    expect(getSproutedSeedCount(5, 5)).toBe(Math.round((rate / 100) * TOTAL_SEEDS));

    expect(getSproutedSeedCount(100, 1)).toBe(0); // invalid concentration
  });

  it('validates concentration options and day range', () => {
    const validValues = CONCENTRATION_OPTIONS.map(({ value }) => value);
    validValues.forEach((value) => {
      expect(isValidConcentration(value)).toBe(true);
    });
    expect(isValidConcentration(999)).toBe(false);

    for (let day = DAYS_RANGE.min; day <= DAYS_RANGE.max; day += 1) {
      expect(isValidDays(day)).toBe(true);
    }
    expect(isValidDays(DAYS_RANGE.min - 1)).toBe(false);
    expect(isValidDays(DAYS_RANGE.max + 1)).toBe(false);
  });

  it('exposes canonical data structures for append-only checks', () => {
    // 结构存在且包含预期 key，作为回归保护
    expect(Object.keys(GERMINATION_BY_CONCENTRATION)).toEqual(['0mg/ml', '5mg/ml', '10mg/ml']);
  });
});
