// Feature: whipping-time, Property 8: 투표 토글 라운드트립
import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVote } from './useVote';

// Mock useGraphQL hook
const mockMutate = vi.fn();
vi.mock('./useGraphQL', () => ({
  useGraphQL: () => ({
    query: vi.fn(),
    mutate: mockMutate,
  }),
}));

// Mock AuthContext (useGraphQL depends on it internally)
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    logout: vi.fn(),
  }),
}));

// ─── Property 8: 투표 토글 라운드트립 ───────────────────────────

/**
 * Property 8: 투표 토글 라운드트립
 *
 * For any initial voteCount (nat) and initial hasVoted (boolean):
 * - After toggleVote when !hasVoted: voteCount should increase by 1
 * - After toggleVote when hasVoted: voteCount should decrease by 1 (but never below 0)
 * - After two consecutive toggles: voteCount returns to original (roundtrip)
 * - voteCount is always >= 0
 *
 * **Validates: Requirements 5.2, 5.3, 5.6**
 */
describe('Property 8: 투표 토글 라운드트립', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockMutate.mockResolvedValue({});
  });

  it('투표 추가 시 count가 정확히 1 증가한다 (hasVoted=false → toggle)', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000 }), (initialVoteCount) => {
        mockMutate.mockResolvedValue({});

        const { result } = renderHook(() =>
          useVote('discussion-1', initialVoteCount, false),
        );

        // Initial state
        expect(result.current.hasVoted).toBe(false);
        expect(result.current.voteCount).toBe(initialVoteCount);

        // Toggle vote (add reaction) - optimistic update
        act(() => {
          result.current.toggleVote();
        });

        // After toggle: count should increase by 1
        expect(result.current.voteCount).toBe(initialVoteCount + 1);
        expect(result.current.hasVoted).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('투표 취소 시 count가 정확히 1 감소하며 0 미만이 되지 않는다 (hasVoted=true → toggle)', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000 }), (initialVoteCount) => {
        mockMutate.mockResolvedValue({});

        const { result } = renderHook(() =>
          useVote('discussion-1', initialVoteCount, true),
        );

        // Initial state
        expect(result.current.hasVoted).toBe(true);
        expect(result.current.voteCount).toBe(initialVoteCount);

        // Toggle vote (remove reaction) - optimistic update
        act(() => {
          result.current.toggleVote();
        });

        // After toggle: count should decrease by 1, but never below 0
        expect(result.current.voteCount).toBe(Math.max(0, initialVoteCount - 1));
        expect(result.current.hasVoted).toBe(false);
        expect(result.current.voteCount).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('두 번 연속 토글 후 원래 count로 복원된다 (라운드트립)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 1000 }).filter((n) => n >= 1),
        fc.boolean(),
        async (initialVoteCount, initialHasVoted) => {
          mockMutate.mockResolvedValue({});

          const { result } = renderHook(() =>
            useVote('discussion-1', initialVoteCount, initialHasVoted),
          );

          // Initial state
          expect(result.current.voteCount).toBe(initialVoteCount);
          expect(result.current.hasVoted).toBe(initialHasVoted);

          // First toggle
          await act(async () => {
            await result.current.toggleVote();
          });

          // Second toggle (return to original) - must wait for isLoading to clear
          await act(async () => {
            await result.current.toggleVote();
          });

          // After roundtrip: should return to original state
          expect(result.current.voteCount).toBe(initialVoteCount);
          expect(result.current.hasVoted).toBe(initialHasVoted);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('어떤 상태에서도 voteCount는 항상 0 이상이다', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }),
        fc.boolean(),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (initialVoteCount, initialHasVoted, toggleSequence) => {
          mockMutate.mockResolvedValue({});

          const { result } = renderHook(() =>
            useVote('discussion-1', initialVoteCount, initialHasVoted),
          );

          // voteCount >= 0 at initial state
          expect(result.current.voteCount).toBeGreaterThanOrEqual(0);

          // Apply a sequence of toggles and verify voteCount >= 0 after each
          for (const _toggle of toggleSequence) {
            act(() => {
              result.current.toggleVote();
            });

            expect(result.current.voteCount).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
