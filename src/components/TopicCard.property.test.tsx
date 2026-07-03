// Feature: whipping-time, Property 12: Topic 카드 필수 정보 포함
// **Validates: Requirements 8.1**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopicCard } from './TopicCard';
import type { Topic, TopicType } from '../types';

// ─── Arbitraries ─────────────────────────────────────────────────

const topicTypeArb: fc.Arbitrary<TopicType> = fc.constantFrom<TopicType>(
  '고민상담',
  '떠먹여 드림',
  '떠먹여 주세요',
);

const topicArb: fc.Arbitrary<Topic> = fc.record({
  id: fc.uuid(),
  chapterId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  type: topicTypeArb,
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  reason: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  author: fc.record({
    displayName: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    isAnonymous: fc.boolean(),
  }),
  assignee: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  voteCount: fc.nat({ max: 9999 }),
  hasVoted: fc.boolean(),
  createdAt: fc.date().map((d) => d.toISOString()),
});

// ─── Property Test ───────────────────────────────────────────────

describe('Property 12: Topic 카드 필수 정보 포함', () => {
  it('TopicCard 렌더링 시 title, type, author.displayName, voteCount가 모두 포함되어야 한다', () => {
    fc.assert(
      fc.property(topicArb, (topic) => {
        // Cleanup any previous render
        cleanup();

        const { container } = render(
          <MemoryRouter>
            <TopicCard topic={topic} />
          </MemoryRouter>,
        );

        // title이 h3로 렌더링됨
        const heading = container.querySelector('h3');
        expect(heading).not.toBeNull();
        expect(heading!.textContent).toBe(topic.title);

        // type이 TopicTypeBadge를 통해 렌더링됨
        const badge = container.querySelector('[aria-label^="주제 유형:"]');
        expect(badge).not.toBeNull();
        expect(badge!.textContent).toBe(topic.type);

        // author.displayName이 meta 섹션에 렌더링됨
        const author = container.querySelector('.author');
        expect(author).not.toBeNull();
        expect(author!.textContent).toBe(topic.author.displayName);

        // voteCount가 votes span에 렌더링됨
        const votesSpan = container.querySelector(`[aria-label="투표 ${topic.voteCount}개"]`);
        expect(votesSpan).not.toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});
