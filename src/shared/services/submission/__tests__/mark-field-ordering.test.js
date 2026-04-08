import { describe, it, expect } from 'vitest';
import { createMarkObject, orderMarkFields, MARK_FIELD_ORDER } from '../createMarkObject.js';

describe('MarkObject field ordering', () => {
  const EXPECTED_ORDER = [
    'pageNumber',
    'pageDesc',
    'operationList',
    'answerList',
    'beginTime',
    'endTime',
    'imgList',
  ];

  describe('MARK_FIELD_ORDER constant', () => {
    it('exports correct field order constant', () => {
      expect(MARK_FIELD_ORDER).toEqual(EXPECTED_ORDER);
    });

    it('constant is frozen', () => {
      expect(Object.isFrozen(MARK_FIELD_ORDER)).toBe(true);
    });
  });

  describe('orderMarkFields', () => {
    it('orders fields in canonical sequence', () => {
      const unorderedMark = {
        imgList: [],
        endTime: '2024-12-01 10:00:00',
        answerList: [],
        pageNumber: '1.01',
        beginTime: '2024-12-01 09:00:00',
        operationList: [],
        pageDesc: 'Test Page',
      };

      const ordered = orderMarkFields(unorderedMark);
      const keys = Object.keys(ordered);

      expect(keys).toEqual(EXPECTED_ORDER);
    });

    it('preserves field values during ordering', () => {
      const mark = {
        imgList: [{ url: 'test.png' }],
        endTime: '2024-12-01 10:00:00',
        answerList: [{ code: 1, targetElement: 'P1.01_Q1', value: 'A' }],
        pageNumber: '1.01',
        beginTime: '2024-12-01 09:00:00',
        operationList: [{ code: 1, eventType: 'page_enter', targetElement: 'page', value: '', time: '2024-12-01 09:00:00' }],
        pageDesc: '[flow/mod/0] Test Page',
      };

      const ordered = orderMarkFields(mark);

      expect(ordered.pageNumber).toBe('1.01');
      expect(ordered.pageDesc).toBe('[flow/mod/0] Test Page');
      expect(ordered.operationList).toEqual(mark.operationList);
      expect(ordered.answerList).toEqual(mark.answerList);
      expect(ordered.beginTime).toBe('2024-12-01 09:00:00');
      expect(ordered.endTime).toBe('2024-12-01 10:00:00');
      expect(ordered.imgList).toEqual(mark.imgList);
    });

    it('outputs all fields even when empty (full field output)', () => {
      const minimalMark = {
        pageNumber: '1.01',
        pageDesc: 'Test',
      };

      const ordered = orderMarkFields(minimalMark);

      expect(ordered).toHaveProperty('pageNumber', '1.01');
      expect(ordered).toHaveProperty('pageDesc', 'Test');
      expect(ordered).toHaveProperty('operationList', []);
      expect(ordered).toHaveProperty('answerList', []);
      expect(ordered).toHaveProperty('beginTime', '');
      expect(ordered).toHaveProperty('endTime', '');
      expect(ordered).toHaveProperty('imgList', []);
    });

    it('handles null/undefined input gracefully', () => {
      const orderedNull = orderMarkFields(null);
      const orderedUndefined = orderMarkFields(undefined);

      [orderedNull, orderedUndefined].forEach((ordered) => {
        expect(Object.keys(ordered)).toEqual(EXPECTED_ORDER);
        expect(ordered.pageNumber).toBe('');
        expect(ordered.operationList).toEqual([]);
        expect(ordered.answerList).toEqual([]);
        expect(ordered.imgList).toEqual([]);
      });
    });

    it('ensures arrays remain arrays even if input is malformed', () => {
      const malformedMark = {
        pageNumber: '1.01',
        pageDesc: 'Test',
        operationList: 'not-an-array',
        answerList: null,
        imgList: undefined,
        beginTime: '2024-01-01 00:00:00',
        endTime: '2024-01-01 00:00:01',
      };

      const ordered = orderMarkFields(malformedMark);

      expect(Array.isArray(ordered.operationList)).toBe(true);
      expect(Array.isArray(ordered.answerList)).toBe(true);
      expect(Array.isArray(ordered.imgList)).toBe(true);
      expect(ordered.operationList).toEqual([]);
      expect(ordered.answerList).toEqual([]);
      expect(ordered.imgList).toEqual([]);
    });
  });

  describe('createMarkObject', () => {
    it('returns mark with fields in canonical order', () => {
      const mark = createMarkObject({
        imgList: [],
        endTime: new Date('2024-12-01T10:00:00'),
        answerList: [],
        pageNumber: '1.01',
        beginTime: new Date('2024-12-01T09:00:00'),
        operationList: [],
        pageDesc: 'Test Page',
      });

      const keys = Object.keys(mark);
      expect(keys).toEqual(EXPECTED_ORDER);
    });

    it('all fields present in output (full field requirement)', () => {
      const mark = createMarkObject({
        pageNumber: '1.01',
        pageDesc: 'Test',
      });

      EXPECTED_ORDER.forEach((field) => {
        expect(mark).toHaveProperty(field);
      });
    });
  });

  describe('JSON serialization order', () => {
    it('JSON.stringify preserves field order', () => {
      const mark = createMarkObject({
        pageNumber: '1.01',
        pageDesc: 'Test',
        operationList: [],
        answerList: [],
        beginTime: '2024-01-01 00:00:00',
        endTime: '2024-01-01 00:00:01',
        imgList: [],
      });

      const json = JSON.stringify(mark);
      const parsed = JSON.parse(json);
      const keys = Object.keys(parsed);

      expect(keys).toEqual(EXPECTED_ORDER);
    });

    it('serialized mark has all fields for audit compatibility', () => {
      const mark = createMarkObject({
        pageNumber: '1.01',
        pageDesc: 'Audit Test',
      });

      const json = JSON.stringify(mark);

      EXPECTED_ORDER.forEach((field) => {
        expect(json).toContain(`"${field}"`);
      });
    });
  });
});
