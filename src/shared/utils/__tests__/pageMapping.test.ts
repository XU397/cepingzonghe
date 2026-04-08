import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  encodeCompositePageNum,
  isValidCompositePageNum,
  parseCompositePageNum,
  convertLegacyPageNum,
  buildCompositePageNum,
} from '../pageMapping';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('encodeCompositePageNum', () => {
  it('encodes submodule and page indexes with zero padding', () => {
    expect(encodeCompositePageNum(1, 3)).toBe('1.03');
    expect(encodeCompositePageNum(2, 10)).toBe('2.10');
    expect(encodeCompositePageNum(12, 99)).toBe('12.99');
  });

  it('warns when submoduleIndex or pageIndex is less than 1', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    encodeCompositePageNum(0, 1);
    encodeCompositePageNum(1, 0);

    expect(warnSpy).toHaveBeenCalledWith(
      '[encodeCompositePageNum] submoduleIndex 应从 1 开始，收到:',
      0
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[encodeCompositePageNum] pageIndex 应从 1 开始，收到:',
      0
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('pads pageIndex 1-9 with a leading zero', () => {
    const padded = Array.from({ length: 9 }, (_, index) => encodeCompositePageNum(1, index + 1));
    expect(padded).toEqual([
      '1.01',
      '1.02',
      '1.03',
      '1.04',
      '1.05',
      '1.06',
      '1.07',
      '1.08',
      '1.09',
    ]);
  });
});

describe('isValidCompositePageNum', () => {
  it('accepts valid composite page numbers', () => {
    expect(isValidCompositePageNum('1.01')).toBe(true);
    expect(isValidCompositePageNum('1.10')).toBe(true);
    expect(isValidCompositePageNum('2.03')).toBe(true);
    expect(isValidCompositePageNum('12.99')).toBe(true);
  });

  it('rejects invalid composite page numbers', () => {
    expect(isValidCompositePageNum('0.1')).toBe(false);
    expect(isValidCompositePageNum('0.10')).toBe(false);
    expect(isValidCompositePageNum('1.1')).toBe(false);
    expect(isValidCompositePageNum('M2:10')).toBe(false);
    expect(isValidCompositePageNum('1.001')).toBe(false);
    expect(isValidCompositePageNum('')).toBe(false);
    expect(isValidCompositePageNum(null as unknown as string)).toBe(false);
  });
});

describe('parseCompositePageNum', () => {
  it('parses new format and derives indexes', () => {
    expect(parseCompositePageNum('1.03')).toEqual({
      submoduleIndex: 1,
      pageIndex: 3,
      stepIndex: 0,
      subPageNum: 3,
    });
  });

  it('parses legacy dot format with warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const parsed = parseCompositePageNum('0.3');

    expect(parsed).toEqual({ stepIndex: 0, subPageNum: 3 });
    expect(warnSpy).toHaveBeenCalledWith(
      '[parseCompositePageNum] 检测到已废弃的点分格式，请迁移至 X.YY 新格式'
    );
  });

  it('parses M-prefixed legacy format with warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const parsed = parseCompositePageNum('M2:10');

    expect(parsed).toEqual({ stepIndex: 2, subPageNum: 10 });
    expect(warnSpy).toHaveBeenCalledWith('已废弃的 M 前缀格式，请使用点分格式');
  });

  it('returns null for invalid formats', () => {
    expect(parseCompositePageNum('invalid')).toBeNull();
    expect(parseCompositePageNum('')).toBeNull();
    expect(parseCompositePageNum(null as unknown as string)).toBeNull();
  });
});

describe('convertLegacyPageNum', () => {
  it('converts legacy dot format to new format', () => {
    expect(convertLegacyPageNum('0.3')).toBe('1.03');
    expect(convertLegacyPageNum('1.10')).toBe('2.10');
    expect(convertLegacyPageNum('0.1')).toBe('1.01');
  });

  it('converts M-prefixed legacy format to new format with warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const converted = convertLegacyPageNum('M0:5');

    expect(converted).toBe('1.05');
    expect(warnSpy).toHaveBeenCalledWith('已废弃的 M 前缀格式，请使用点分格式');
  });

  it('returns null for invalid inputs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(convertLegacyPageNum(null as unknown as string)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      '[convertLegacyPageNum] 仅支持字符串格式的页码，收到:',
      null
    );

    warnSpy.mockClear();

    expect(convertLegacyPageNum('invalid')).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('[convertLegacyPageNum] 无法解析旧格式页码:', 'invalid');
  });
});

describe('buildCompositePageNum', () => {
  it('acts as an alias of encodeCompositePageNum', () => {
    expect(buildCompositePageNum(2, 5)).toBe(encodeCompositePageNum(2, 5));
    expect(buildCompositePageNum(3, 1)).toBe(encodeCompositePageNum(3, 1));
  });
});
