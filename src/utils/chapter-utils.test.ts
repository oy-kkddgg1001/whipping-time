import { describe, it, expect } from 'vitest';
import {
  sortChaptersByNumber,
  getNextChapterNumber,
  getActiveChapter,
  validateChapterTitle,
} from './chapter-utils';
import { Chapter } from '../types/index';

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'node-1',
    number: 1,
    title: '테스트 챕터',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('sortChaptersByNumber', () => {
  it('빈 배열을 반환한다', () => {
    expect(sortChaptersByNumber([])).toEqual([]);
  });

  it('내림차순으로 정렬된 배열을 반환한다', () => {
    const chapters = [
      makeChapter({ number: 1 }),
      makeChapter({ number: 3 }),
      makeChapter({ number: 2 }),
    ];
    const sorted = sortChaptersByNumber(chapters);
    expect(sorted.map((c) => c.number)).toEqual([3, 2, 1]);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const chapters = [
      makeChapter({ number: 1 }),
      makeChapter({ number: 3 }),
    ];
    const original = [...chapters];
    sortChaptersByNumber(chapters);
    expect(chapters).toEqual(original);
  });
});

describe('getNextChapterNumber', () => {
  it('빈 배열이면 1을 반환한다', () => {
    expect(getNextChapterNumber([])).toBe(1);
  });

  it('최대 번호 + 1을 반환한다', () => {
    const chapters = [
      makeChapter({ number: 2 }),
      makeChapter({ number: 5 }),
      makeChapter({ number: 3 }),
    ];
    expect(getNextChapterNumber(chapters)).toBe(6);
  });

  it('단일 챕터에서도 올바르게 동작한다', () => {
    const chapters = [makeChapter({ number: 10 })];
    expect(getNextChapterNumber(chapters)).toBe(11);
  });
});

describe('getActiveChapter', () => {
  it('빈 배열이면 null을 반환한다', () => {
    expect(getActiveChapter([])).toBeNull();
  });

  it('가장 높은 번호의 챕터를 반환한다', () => {
    const chapters = [
      makeChapter({ id: 'a', number: 1 }),
      makeChapter({ id: 'b', number: 5 }),
      makeChapter({ id: 'c', number: 3 }),
    ];
    const active = getActiveChapter(chapters);
    expect(active?.id).toBe('b');
    expect(active?.number).toBe(5);
  });
});

describe('validateChapterTitle', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = validateChapterTitle('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('제목을 입력해주세요');
  });

  it('공백만 있는 문자열이면 실패한다', () => {
    const result = validateChapterTitle('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('제목을 입력해주세요');
  });

  it('50자 초과 시 실패한다', () => {
    const longTitle = 'a'.repeat(51);
    const result = validateChapterTitle(longTitle);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('제목은 50자 이하로 입력해주세요');
  });

  it('유효한 제목이면 성공한다', () => {
    const result = validateChapterTitle('프론트엔드 챕터 1회차');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('정확히 50자인 제목은 성공한다', () => {
    const title = 'a'.repeat(50);
    const result = validateChapterTitle(title);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
