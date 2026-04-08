import { describe, it, expect } from 'vitest';
import {
  RESERVED_TARGET_ELEMENTS,
  isValidPageNumber,
  isValidTargetElement,
  validateMarkObject,
} from '../schema.ts';
import createSubmissionFixture from './fixtures/submissionFixture.js';

describe('targetElement 前缀规则', () => {
  it('接受已经符合 P<pageNumber>_ 前缀的操作与答案', () => {
    const { mark } = createSubmissionFixture();
    mark.operationList.forEach((operation) => {
      expect(isValidTargetElement(operation.targetElement)).toBe(true);
    });
    mark.answerList.forEach((answer) => {
      expect(isValidTargetElement(answer.targetElement)).toBe(true);
    });
  });

  it('允许白名单中的系统级 targetElement', () => {
    RESERVED_TARGET_ELEMENTS.forEach((systemTarget) => {
      expect(isValidTargetElement(systemTarget)).toBe(true);
    });
  });

  it('拒绝遗留的 PM<step>:<sub> 格式，新格式要求使用 P<submoduleIndex>.<pageIndexTwoDigits>_', () => {
    const { mark } = createSubmissionFixture();
    mark.operationList[1].targetElement = mark.operationList[1].targetElement.replace(
      'P1.03_',
      'PM0:3_',
    );

    expect(() => validateMarkObject(mark)).toThrow(
      /targetElement 必须以 "P" 开头（如 "P1.03_button"），系统保留字段除外/,
    );
  });
});

describe('pageNumber 格式校验', () => {
  it('只接受点分格式', () => {
    expect(isValidPageNumber('1.03')).toBe(true);
    expect(isValidPageNumber('0.3')).toBe(false);
    expect(isValidPageNumber('2')).toBe(false);
  });

  it('拒绝遗留 M 前缀格式', () => {
    expect(isValidPageNumber('M0:3')).toBe(false);

    const { mark } = createSubmissionFixture();
    mark.pageNumber = 'M0:3';
    expect(() => validateMarkObject(mark)).toThrow(
      /pageNumber 必须为新格式 <submoduleIndex>\.<pageIndexTwoDigits>（如 "1\.03"），不再支持 0\.\* 前缀、M 前缀或无零填充格式/,
    );
  });

  it('拒绝单数字格式', () => {
    expect(isValidPageNumber('5')).toBe(false);

    const { mark } = createSubmissionFixture();
    mark.pageNumber = '5';
    expect(() => validateMarkObject(mark)).toThrow(
      /pageNumber 必须为新格式 <submoduleIndex>\.<pageIndexTwoDigits>（如 "1\.03"），不再支持 0\.\* 前缀、M 前缀或无零填充格式/,
    );
  });
});
