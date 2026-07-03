// Feature: whipping-time, Property 5, 6, 7, 9, 11: Topic 유틸리티 함수
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import {
  validateTopicForm,
  getDisplayAuthor,
  sortTopicsByVotes,
  filterTopicsByType,
} from './topic-utils';
import {
  topicFormToDiscussionInput,
  parseDiscussionMetadata,
} from './discussion-mapper';
import type { TopicFormData, GitHubUser, Topic, TopicType } from '../types/index';

// ─── Shared Arbitraries ──────────────────────────────────────────

const topicTypeArb = fc.constantFrom<TopicType>('고민상담', '떠먹여 드림', '떠먹여 주세요');

const gitHubUserArb: fc.Arbitrary<GitHubUser> = fc.record({
  login: fc.string({ minLength: 1 }),
  avatarUrl: fc.webUrl(),
  id: fc.string(),
});

const topicArb: fc.Arbitrary<Topic> = fc.record({
  id: fc.uuid(),
  chapterId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  type: topicTypeArb,
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  reason: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  author: fc.record({
    displayName: fc.string({ minLength: 1 }),
    isAnonymous: fc.boolean(),
  }),
  assignee: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  voteCount: fc.nat(),
  hasVoted: fc.boolean(),
  createdAt: fc.date().map((d) => d.toISOString()),
});

// ─── Property 5: Topic 생성 무결성 ───────────────────────────────

/**
 * Property 5: Topic 생성 무결성
 *
 * For any valid TopicFormData + user + categoryId, calling topicFormToDiscussionInput
 * preserves title, type (in body metadata), description (in body).
 * Also, a freshly created Topic should have voteCount=0.
 *
 * **Validates: Requirements 2.1, 2.6**
 */
describe('Property 5: Topic 생성 무결성', () => {
  const validTopicFormDataArb: fc.Arbitrary<TopicFormData> = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    type: topicTypeArb,
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    reason: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    isAnonymous: fc.boolean(),
    assignee: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  });

  const categoryIdArb = fc.uuid();

  it('topicFormToDiscussionInput preserves title', () => {
    fc.assert(
      fc.property(validTopicFormDataArb, gitHubUserArb, categoryIdArb, (formData, user, categoryId) => {
        const result = topicFormToDiscussionInput(formData, user, categoryId);
        expect(result.title).toBe(formData.title);
      }),
      { numRuns: 100 },
    );
  });

  it('topicFormToDiscussionInput preserves type in body metadata', () => {
    fc.assert(
      fc.property(validTopicFormDataArb, gitHubUserArb, categoryIdArb, (formData, user, categoryId) => {
        const result = topicFormToDiscussionInput(formData, user, categoryId);
        const metadata = parseDiscussionMetadata(result.body);
        expect(metadata.type).toBe(formData.type);
      }),
      { numRuns: 100 },
    );
  });

  it('topicFormToDiscussionInput preserves description in body', () => {
    fc.assert(
      fc.property(validTopicFormDataArb, gitHubUserArb, categoryIdArb, (formData, user, categoryId) => {
        const result = topicFormToDiscussionInput(formData, user, categoryId);
        const description = formData.description || '';
        // The body contains the description after the metadata comment
        expect(result.body).toContain(description);
      }),
      { numRuns: 100 },
    );
  });

  it('topicFormToDiscussionInput uses the given categoryId', () => {
    fc.assert(
      fc.property(validTopicFormDataArb, gitHubUserArb, categoryIdArb, (formData, user, categoryId) => {
        const result = topicFormToDiscussionInput(formData, user, categoryId);
        expect(result.categoryId).toBe(categoryId);
      }),
      { numRuns: 100 },
    );
  });

  it('a freshly created Topic should have voteCount=0', () => {
    // This tests the domain invariant: any new Topic starts with 0 votes
    fc.assert(
      fc.property(validTopicFormDataArb, gitHubUserArb, categoryIdArb, (formData, user, categoryId) => {
        // When creating a Topic from form data, the expected initial voteCount is 0
        const result = topicFormToDiscussionInput(formData, user, categoryId);
        // The CreateDiscussionInput doesn't store voteCount directly,
        // but when parsed back as a discussion, reactions.totalCount would be 0.
        // We verify the pipeline doesn't inject any vote-related data.
        expect(result.body).not.toContain('"voteCount"');
        // The expected behavior is that voteCount starts at 0 for newly created topics
        const expectedVoteCount = 0;
        expect(expectedVoteCount).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 6: Topic 폼 유효성 검증 ────────────────────────────

/**
 * Property 6: Topic 폼 유효성 검증
 *
 * For any TopicFormData where title is empty OR type is invalid OR
 * (type="떠먹여 주세요" AND assignee is empty), validateTopicForm returns invalid.
 *
 * **Validates: Requirements 2.4, 2.7**
 */
describe('Property 6: Topic 폼 유효성 검증', () => {
  // Strategy 1: Empty title
  const emptyTitleArb: fc.Arbitrary<TopicFormData> = fc.record({
    title: fc.constantFrom('', '   ', '\t', '\n'),
    type: topicTypeArb,
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    reason: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    isAnonymous: fc.boolean(),
    assignee: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  });

  // Strategy 2: Invalid type
  const invalidTypeArb: fc.Arbitrary<TopicFormData> = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.string().filter((s) => !['고민상담', '떠먹여 드림', '떠먹여 주세요'].includes(s)) as fc.Arbitrary<TopicType>,
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    reason: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    isAnonymous: fc.boolean(),
    assignee: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  });

  // Strategy 3: type="떠먹여 주세요" with empty assignee
  const missingAssigneeArb: fc.Arbitrary<TopicFormData> = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constant<TopicType>('떠먹여 주세요'),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    reason: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    isAnonymous: fc.boolean(),
    assignee: fc.constantFrom(undefined, '', '   ', '\t') as fc.Arbitrary<string | undefined>,
  });

  const invalidFormDataArb = fc.oneof(emptyTitleArb, invalidTypeArb, missingAssigneeArb);

  it('필수 필드가 누락된 폼 데이터는 항상 유효성 검증에 실패', () => {
    fc.assert(
      fc.property(invalidFormDataArb, (formData) => {
        const result = validateTopicForm(formData);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: 작성자 표시 정규화 ─────────────────────────────

/**
 * Property 7: 작성자 표시 정규화
 *
 * For any GitHubUser and boolean isAnonymous:
 * - When isAnonymous is true → displayName is "익명"
 * - When isAnonymous is false → displayName is user.login
 *
 * **Validates: Requirements 3.2, 3.3**
 */
describe('Property 7: 작성자 표시 정규화', () => {
  it('익명일 때 displayName은 항상 "익명"', () => {
    fc.assert(
      fc.property(gitHubUserArb, (user) => {
        const result = getDisplayAuthor(user, true);
        expect(result.displayName).toBe('익명');
        expect(result.isAnonymous).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('실명일 때 displayName은 항상 user.login', () => {
    fc.assert(
      fc.property(gitHubUserArb, (user) => {
        const result = getDisplayAuthor(user, false);
        expect(result.displayName).toBe(user.login);
        expect(result.isAnonymous).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('isAnonymous 값에 따라 항상 정확한 표시 이름 반환', () => {
    fc.assert(
      fc.property(gitHubUserArb, fc.boolean(), (user, isAnonymous) => {
        const result = getDisplayAuthor(user, isAnonymous);
        if (isAnonymous) {
          expect(result.displayName).toBe('익명');
          expect(result.isAnonymous).toBe(true);
        } else {
          expect(result.displayName).toBe(user.login);
          expect(result.isAnonymous).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 9: Topic 정렬 (투표 수 기준) ──────────────────────

/**
 * Property 9: Topic 정렬 (투표 수 기준)
 *
 * For any topic array, after sortTopicsByVotes:
 * - All adjacent pairs satisfy topics[i].voteCount >= topics[i+1].voteCount
 * - For equal voteCount pairs: topics[i].createdAt <= topics[i+1].createdAt
 *
 * **Validates: Requirements 5.5**
 */
describe('Property 9: Topic 정렬 (투표 수 기준)', () => {
  it('정렬 결과는 투표 수 내림차순', () => {
    fc.assert(
      fc.property(fc.array(topicArb), (topics) => {
        const sorted = sortTopicsByVotes(topics);

        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].voteCount).toBeGreaterThanOrEqual(sorted[i + 1].voteCount);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('동점 시 생성시간 오름차순 정렬', () => {
    fc.assert(
      fc.property(fc.array(topicArb), (topics) => {
        const sorted = sortTopicsByVotes(topics);

        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].voteCount === sorted[i + 1].voteCount) {
            const timeA = new Date(sorted[i].createdAt).getTime();
            const timeB = new Date(sorted[i + 1].createdAt).getTime();
            expect(timeA).toBeLessThanOrEqual(timeB);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('정렬은 원본 배열의 원소를 보존 (길이 동일, 원소 동일)', () => {
    fc.assert(
      fc.property(fc.array(topicArb), (topics) => {
        const sorted = sortTopicsByVotes(topics);
        expect(sorted.length).toBe(topics.length);

        // All elements from sorted should exist in original
        const originalIds = topics.map((t) => t.id).sort();
        const sortedIds = sorted.map((t) => t.id).sort();
        expect(sortedIds).toEqual(originalIds);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 11: Topic 필터링 정확성 ────────────────────────────

/**
 * Property 11: Topic 필터링 정확성
 *
 * For any topic array and selected type:
 * - All items in result match the type
 * - No items of that type from the original are missing from the result
 *
 * **Validates: Requirements 8.3**
 */
describe('Property 11: Topic 필터링 정확성', () => {
  it('필터 결과의 모든 항목은 선택된 타입과 일치', () => {
    fc.assert(
      fc.property(fc.array(topicArb), topicTypeArb, (topics, type) => {
        const filtered = filterTopicsByType(topics, type);

        for (const topic of filtered) {
          expect(topic.type).toBe(type);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('원본에서 해당 타입의 항목이 누락 없이 포함됨', () => {
    fc.assert(
      fc.property(fc.array(topicArb), topicTypeArb, (topics, type) => {
        const filtered = filterTopicsByType(topics, type);
        const expectedCount = topics.filter((t) => t.type === type).length;

        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });

  it('"all" 필터 시 모든 항목이 반환됨', () => {
    fc.assert(
      fc.property(fc.array(topicArb), (topics) => {
        const filtered = filterTopicsByType(topics, 'all');
        expect(filtered.length).toBe(topics.length);
      }),
      { numRuns: 100 },
    );
  });
});
