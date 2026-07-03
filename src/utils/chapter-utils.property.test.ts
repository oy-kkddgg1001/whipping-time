import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sortChaptersByNumber,
  getNextChapterNumber,
  getActiveChapter,
  validateChapterTitle,
} from './chapter-utils';
import { Chapter } from '../types/index';

// Feature: whipping-time
// **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6**

const chapterArbitrary = fc.record({
  id: fc.string(),
  number: fc.nat(),
  title: fc.string(),
  createdAt: fc.string(),
});

describe('챕터 유틸리티 함수 Property Tests', () => {
  // Feature: whipping-time, Property 1: 챕터 정렬 순서 보장
  describe('Property 1: 챕터 정렬 순서 보장', () => {
    it('결과 배열의 인접 원소가 내림차순이어야 한다', () => {
      fc.assert(
        fc.property(fc.array(chapterArbitrary), (chapters) => {
          const sorted = sortChaptersByNumber(chapters as Chapter[]);

          // 모든 인접 쌍에서 chapters[i].number > chapters[i+1].number (또는 같은 경우 >=)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].number).toBeGreaterThanOrEqual(sorted[i + 1].number);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: whipping-time, Property 2: 새 챕터 번호 자동 증가
  describe('Property 2: 새 챕터 번호 자동 증가', () => {
    it('비어있지 않은 배열에서 max(numbers) + 1을 반환해야 한다', () => {
      fc.assert(
        fc.property(
          fc.array(chapterArbitrary, { minLength: 1 }),
          (chapters) => {
            const result = getNextChapterNumber(chapters as Chapter[]);
            const maxNumber = Math.max(...chapters.map((c) => c.number));
            expect(result).toBe(maxNumber + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('빈 배열에서 1을 반환해야 한다', () => {
      fc.assert(
        fc.property(fc.constant([]), (chapters) => {
          const result = getNextChapterNumber(chapters as Chapter[]);
          expect(result).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: whipping-time, Property 3: 활성 챕터 결정
  describe('Property 3: 활성 챕터 결정', () => {
    it('최대 number 값을 가진 챕터를 반환해야 한다', () => {
      fc.assert(
        fc.property(
          fc.array(chapterArbitrary, { minLength: 1 }),
          (chapters) => {
            const result = getActiveChapter(chapters as Chapter[]);
            const maxNumber = Math.max(...chapters.map((c) => c.number));
            expect(result).not.toBeNull();
            expect(result!.number).toBe(maxNumber);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: whipping-time, Property 4: 챕터 제목 유효성 검증
  describe('Property 4: 챕터 제목 유효성 검증', () => {
    it('빈 문자열은 유효하지 않아야 한다', () => {
      fc.assert(
        fc.property(fc.constant(''), (title) => {
          const result = validateChapterTitle(title);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('공백만 포함된 문자열은 유효하지 않아야 한다', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constant(' '), { minLength: 1 }),
          (title) => {
            const result = validateChapterTitle(title);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('50자 초과 문자열은 유효하지 않아야 한다', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 200 }),
          (title) => {
            const result = validateChapterTitle(title);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1~50자의 비공백 문자를 포함한 문자열은 유효해야 한다', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          (title) => {
            const result = validateChapterTitle(title);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
