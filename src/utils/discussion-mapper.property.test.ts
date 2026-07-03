// Feature: whipping-time, Property 10: Discussion ↔ Topic 매핑 라운드트립
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { parseDiscussionMetadata, serializeDiscussionBody } from './discussion-mapper';
import { DiscussionMetadata, TopicType } from '../types/index';

/**
 * Property 10: Discussion ↔ Topic 매핑 라운드트립
 *
 * serialize 후 parse하면 원본 type, isAnonymous, assignee, reason이 보존되는지 검증
 *
 * **Validates: Requirements 6.1, 6.3**
 */
describe('Property 10: Discussion ↔ Topic 매핑 라운드트립', () => {
  const topicTypeArb = fc.constantFrom<TopicType>('고민상담', '떠먹여 드림', '떠먹여 주세요');

  // Non-empty strings for assignee/reason (empty strings map to undefined on parse)
  const nonEmptyStringArb = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

  const metadataArb: fc.Arbitrary<DiscussionMetadata> = fc.record({
    type: topicTypeArb,
    isAnonymous: fc.boolean(),
    assignee: fc.option(nonEmptyStringArb, { nil: undefined }),
    reason: fc.option(nonEmptyStringArb, { nil: undefined }),
  });

  const descriptionArb = fc.string();

  it('serialize → parse preserves type and isAnonymous', () => {
    fc.assert(
      fc.property(metadataArb, descriptionArb, (metadata, description) => {
        const body = serializeDiscussionBody(metadata, description);
        const parsed = parseDiscussionMetadata(body);

        expect(parsed.type).toBe(metadata.type);
        expect(parsed.isAnonymous).toBe(metadata.isAnonymous);
      }),
      { numRuns: 100 },
    );
  });

  it('serialize → parse preserves assignee (undefined and non-empty strings)', () => {
    fc.assert(
      fc.property(metadataArb, descriptionArb, (metadata, description) => {
        const body = serializeDiscussionBody(metadata, description);
        const parsed = parseDiscussionMetadata(body);

        // empty string → undefined mapping: serialize converts undefined to '',
        // parse converts '' back to undefined
        if (metadata.assignee && metadata.assignee.length > 0) {
          expect(parsed.assignee).toBe(metadata.assignee);
        } else {
          expect(parsed.assignee).toBeUndefined();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('serialize → parse preserves reason (undefined and non-empty strings)', () => {
    fc.assert(
      fc.property(metadataArb, descriptionArb, (metadata, description) => {
        const body = serializeDiscussionBody(metadata, description);
        const parsed = parseDiscussionMetadata(body);

        // empty string → undefined mapping: serialize converts undefined to '',
        // parse converts '' back to undefined
        if (metadata.reason && metadata.reason.length > 0) {
          expect(parsed.reason).toBe(metadata.reason);
        } else {
          expect(parsed.reason).toBeUndefined();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('full round-trip preserves all metadata fields', () => {
    fc.assert(
      fc.property(metadataArb, descriptionArb, (metadata, description) => {
        const body = serializeDiscussionBody(metadata, description);
        const parsed = parseDiscussionMetadata(body);

        expect(parsed.type).toBe(metadata.type);
        expect(parsed.isAnonymous).toBe(metadata.isAnonymous);

        const expectedAssignee = metadata.assignee || undefined;
        const expectedReason = metadata.reason || undefined;

        expect(parsed.assignee).toBe(expectedAssignee);
        expect(parsed.reason).toBe(expectedReason);
      }),
      { numRuns: 100 },
    );
  });
});
