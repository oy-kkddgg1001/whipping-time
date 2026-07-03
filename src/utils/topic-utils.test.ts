import { describe, it, expect } from 'vitest';
import {
  validateTopicForm,
  getDisplayAuthor,
  sortTopicsByVotes,
  filterTopicsByType,
} from './topic-utils';
import type { TopicFormData, GitHubUser, Topic } from '../types/index';

// ─── Helpers ─────────────────────────────────────────────────────

function makeTopicFormData(overrides: Partial<TopicFormData> = {}): TopicFormData {
  return {
    title: '테스트 주제',
    type: '고민상담',
    isAnonymous: false,
    ...overrides,
  };
}

function makeGitHubUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    login: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
    id: 'node-id-1',
    ...overrides,
  };
}

function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 'topic-1',
    chapterId: 'chapter-1',
    title: '주제 제목',
    type: '고민상담',
    author: { displayName: 'testuser', isAnonymous: false },
    voteCount: 0,
    hasVoted: false,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── validateTopicForm ───────────────────────────────────────────

describe('validateTopicForm', () => {
  it('유효한 폼 데이터일 때 valid: true를 반환', () => {
    const result = validateTopicForm(makeTopicFormData());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('title이 빈 문자열이면 에러 반환', () => {
    const result = validateTopicForm(makeTopicFormData({ title: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('제목은 필수입니다.');
  });

  it('title이 공백만 있으면 에러 반환', () => {
    const result = validateTopicForm(makeTopicFormData({ title: '   ' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('제목은 필수입니다.');
  });

  it('title이 100자 초과이면 에러 반환', () => {
    const longTitle = 'a'.repeat(101);
    const result = validateTopicForm(makeTopicFormData({ title: longTitle }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('제목은 100자 이내여야 합니다.');
  });

  it('title이 정확히 100자이면 유효', () => {
    const title = 'a'.repeat(100);
    const result = validateTopicForm(makeTopicFormData({ title }));
    expect(result.valid).toBe(true);
  });

  it('유효하지 않은 type이면 에러 반환', () => {
    const result = validateTopicForm(makeTopicFormData({ type: 'invalid' as any }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('유효한 주제 유형을 선택해야 합니다.');
  });

  it('type이 "떠먹여 주세요"일 때 assignee가 없으면 에러 반환', () => {
    const result = validateTopicForm(
      makeTopicFormData({ type: '떠먹여 주세요', assignee: undefined })
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('지목 대상은 필수입니다.');
  });

  it('type이 "떠먹여 주세요"일 때 assignee가 공백이면 에러 반환', () => {
    const result = validateTopicForm(
      makeTopicFormData({ type: '떠먹여 주세요', assignee: '  ' })
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('지목 대상은 필수입니다.');
  });

  it('type이 "떠먹여 주세요"일 때 assignee가 있으면 유효', () => {
    const result = validateTopicForm(
      makeTopicFormData({ type: '떠먹여 주세요', assignee: 'someone' })
    );
    expect(result.valid).toBe(true);
  });

  it('description이 500자 초과이면 에러 반환', () => {
    const longDesc = 'b'.repeat(501);
    const result = validateTopicForm(makeTopicFormData({ description: longDesc }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('설명은 500자 이내여야 합니다.');
  });

  it('description이 정확히 500자이면 유효', () => {
    const desc = 'b'.repeat(500);
    const result = validateTopicForm(makeTopicFormData({ description: desc }));
    expect(result.valid).toBe(true);
  });

  it('description이 없으면 유효', () => {
    const result = validateTopicForm(makeTopicFormData({ description: undefined }));
    expect(result.valid).toBe(true);
  });
});

// ─── getDisplayAuthor ────────────────────────────────────────────

describe('getDisplayAuthor', () => {
  it('익명일 때 displayName이 "익명"이고 isAnonymous가 true', () => {
    const user = makeGitHubUser({ login: 'octocat' });
    const result = getDisplayAuthor(user, true);
    expect(result.displayName).toBe('익명');
    expect(result.isAnonymous).toBe(true);
  });

  it('실명일 때 displayName이 user.login이고 isAnonymous가 false', () => {
    const user = makeGitHubUser({ login: 'octocat' });
    const result = getDisplayAuthor(user, false);
    expect(result.displayName).toBe('octocat');
    expect(result.isAnonymous).toBe(false);
  });
});

// ─── sortTopicsByVotes ───────────────────────────────────────────

describe('sortTopicsByVotes', () => {
  it('투표 수 내림차순으로 정렬', () => {
    const topics = [
      makeTopic({ id: 'a', voteCount: 1 }),
      makeTopic({ id: 'b', voteCount: 5 }),
      makeTopic({ id: 'c', voteCount: 3 }),
    ];
    const sorted = sortTopicsByVotes(topics);
    expect(sorted.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('동점 시 생성시간 오름차순으로 정렬', () => {
    const topics = [
      makeTopic({ id: 'a', voteCount: 3, createdAt: '2024-03-01T00:00:00Z' }),
      makeTopic({ id: 'b', voteCount: 3, createdAt: '2024-01-01T00:00:00Z' }),
      makeTopic({ id: 'c', voteCount: 3, createdAt: '2024-02-01T00:00:00Z' }),
    ];
    const sorted = sortTopicsByVotes(topics);
    expect(sorted.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('원본 배열을 변경하지 않음', () => {
    const topics = [
      makeTopic({ id: 'a', voteCount: 1 }),
      makeTopic({ id: 'b', voteCount: 5 }),
    ];
    const original = [...topics];
    sortTopicsByVotes(topics);
    expect(topics).toEqual(original);
  });

  it('빈 배열은 빈 배열을 반환', () => {
    const result = sortTopicsByVotes([]);
    expect(result).toEqual([]);
  });
});

// ─── filterTopicsByType ──────────────────────────────────────────

describe('filterTopicsByType', () => {
  const topics = [
    makeTopic({ id: 'a', type: '고민상담' }),
    makeTopic({ id: 'b', type: '떠먹여 드림' }),
    makeTopic({ id: 'c', type: '떠먹여 주세요' }),
    makeTopic({ id: 'd', type: '고민상담' }),
  ];

  it('"all"이면 전체 반환', () => {
    const result = filterTopicsByType(topics, 'all');
    expect(result).toHaveLength(4);
  });

  it('"all"은 원본 배열의 복사본을 반환', () => {
    const result = filterTopicsByType(topics, 'all');
    expect(result).not.toBe(topics);
    expect(result).toEqual(topics);
  });

  it('특정 타입으로 필터링', () => {
    const result = filterTopicsByType(topics, '고민상담');
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === '고민상담')).toBe(true);
  });

  it('해당 타입이 없으면 빈 배열 반환', () => {
    const singleType = [makeTopic({ type: '고민상담' })];
    const result = filterTopicsByType(singleType, '떠먹여 드림');
    expect(result).toEqual([]);
  });
});
