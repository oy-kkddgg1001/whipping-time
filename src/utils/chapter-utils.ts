import { Chapter, ValidationResult } from '../types/index';

/**
 * 챕터 목록을 번호 기준 내림차순으로 정렬합니다.
 * 원본 배열을 변경하지 않고 새 배열을 반환합니다.
 */
export function sortChaptersByNumber(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort((a, b) => b.number - a.number);
}

/**
 * 다음 챕터 번호를 생성합니다.
 * 빈 배열이면 1을, 아니면 최대 번호 + 1을 반환합니다.
 */
export function getNextChapterNumber(chapters: Chapter[]): number {
  if (chapters.length === 0) {
    return 1;
  }
  return Math.max(...chapters.map((c) => c.number)) + 1;
}

/**
 * 가장 높은 번호를 가진 활성 챕터를 반환합니다.
 * 빈 배열이면 null을 반환합니다.
 */
export function getActiveChapter(chapters: Chapter[]): Chapter | null {
  if (chapters.length === 0) {
    return null;
  }
  return chapters.reduce((max, chapter) =>
    chapter.number > max.number ? chapter : max
  );
}

/**
 * 챕터 제목의 유효성을 검증합니다.
 * - 빈값 또는 공백만 있는 경우: 실패
 * - 50자 초과: 실패
 */
export function validateChapterTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { valid: false, errors: ['제목을 입력해주세요'] };
  }
  if (title.length > 50) {
    return { valid: false, errors: ['제목은 50자 이하로 입력해주세요'] };
  }
  return { valid: true, errors: [] };
}
