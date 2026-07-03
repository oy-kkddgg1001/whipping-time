import { useState, useCallback } from 'react';
import { useGraphQL } from './useGraphQL';

const ADD_REACTION_MUTATION = `
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction { id }
      subject {
        ... on Discussion {
          id
          reactions(content: THUMBS_UP) { totalCount }
        }
      }
    }
  }
`;

const REMOVE_REACTION_MUTATION = `
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      subject {
        ... on Discussion {
          id
          reactions(content: THUMBS_UP) { totalCount }
        }
      }
    }
  }
`;

export interface UseVoteResult {
  hasVoted: boolean;
  voteCount: number;
  isLoading: boolean;
  toggleVote: () => Promise<void>;
}

/**
 * 투표 상태를 관리하는 훅.
 * - 낙관적 업데이트: UI를 즉시 반영한 후 API 호출
 * - 실패 시 롤백
 * - GitHub Reaction API (addReaction / removeReaction) 사용
 */
export function useVote(
  discussionId: string,
  initialVoteCount: number,
  initialHasVoted: boolean,
): UseVoteResult {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useGraphQL();

  const toggleVote = useCallback(async () => {
    if (isLoading) return;

    const previousHasVoted = hasVoted;
    const previousVoteCount = voteCount;

    // 낙관적 업데이트
    const nextHasVoted = !hasVoted;
    const nextVoteCount = nextHasVoted
      ? voteCount + 1
      : Math.max(0, voteCount - 1);

    setHasVoted(nextHasVoted);
    setVoteCount(nextVoteCount);
    setIsLoading(true);

    try {
      if (nextHasVoted) {
        await mutate(ADD_REACTION_MUTATION, {
          subjectId: discussionId,
          content: 'THUMBS_UP',
        });
      } else {
        await mutate(REMOVE_REACTION_MUTATION, {
          subjectId: discussionId,
          content: 'THUMBS_UP',
        });
      }
    } catch {
      // 실패 시 롤백
      setHasVoted(previousHasVoted);
      setVoteCount(previousVoteCount);
    } finally {
      setIsLoading(false);
    }
  }, [discussionId, hasVoted, voteCount, isLoading, mutate]);

  return { hasVoted, voteCount, isLoading, toggleVote };
}
