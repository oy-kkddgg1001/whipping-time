import type {
  TopicFormData,
  ValidationResult,
  GitHubUser,
  AuthorInfo,
  Topic,
  TopicType,
} from '../types/index';

const VALID_TOPIC_TYPES: TopicType[] = ['고민상담', '떠먹여 드림', '떠먹여 주세요'];

/**
 * Topic 생성 폼 데이터의 유효성을 검증합니다.
 *
 * - title: 필수 (빈값/공백 불가), 최대 100자
 * - type: 필수, 유효한 TopicType 값
 * - assignee: type이 "떠먹여 주세요"일 때 필수 (빈값/공백 불가)
 * - description: 선택, 최대 500자
 */
export function validateTopicForm(data: TopicFormData): ValidationResult {
  const errors: string[] = [];

  // title 검증
  if (!data.title || data.title.trim().length === 0) {
    errors.push('제목은 필수입니다.');
  } else if (data.title.length > 100) {
    errors.push('제목은 100자 이내여야 합니다.');
  }

  // type 검증
  if (!data.type || !VALID_TOPIC_TYPES.includes(data.type)) {
    errors.push('유효한 주제 유형을 선택해야 합니다.');
  }

  // assignee 검증 (떠먹여 주세요일 때 필수)
  if (data.type === '떠먹여 주세요') {
    if (!data.assignee || data.assignee.trim().length === 0) {
      errors.push('지목 대상은 필수입니다.');
    }
  }

  // description 검증
  if (data.description && data.description.length > 500) {
    errors.push('설명은 500자 이내여야 합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 작성자 표시 정보를 결정합니다.
 *
 * - 익명: { displayName: '익명', isAnonymous: true }
 * - 실명: { displayName: user.login, isAnonymous: false }
 */
export function getDisplayAuthor(user: GitHubUser, isAnonymous: boolean): AuthorInfo {
  if (isAnonymous) {
    return { displayName: '익명', isAnonymous: true };
  }
  return { displayName: user.login, isAnonymous: false };
}

/**
 * Topic 목록을 투표 수 기준 내림차순으로 정렬합니다.
 * 동점일 경우 생성시간 오름차순(이른 것이 먼저)으로 정렬합니다.
 * 원본 배열을 변경하지 않고 새 배열을 반환합니다.
 */
export function sortTopicsByVotes(topics: Topic[]): Topic[] {
  return [...topics].sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    // 동점 시 생성시간 오름차순
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * Topic 목록을 유형별로 필터링합니다.
 * 'all'이면 전체를 복사하여 반환합니다.
 */
export function filterTopicsByType(topics: Topic[], type: TopicType | 'all'): Topic[] {
  if (type === 'all') {
    return [...topics];
  }
  return topics.filter((topic) => topic.type === type);
}
