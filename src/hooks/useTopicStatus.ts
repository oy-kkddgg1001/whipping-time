import { useState, useCallback } from 'react';
import { useGraphQL } from './useGraphQL';
import { useAuth } from '../contexts/AuthContext';
import type { TopicStatus } from '../types';

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'oy-kkddgg1001';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'whipping-time';

const SELECTED_LABEL: TopicStatus = '선정완료';
const RESOLVED_LABEL: TopicStatus = '해결완료';

const GET_STATUS_LABEL_IDS_QUERY = `
  query GetStatusLabelIds($owner: String!, $repo: String!, $selectedName: String!, $resolvedName: String!) {
    repository(owner: $owner, name: $repo) {
      selectedLabel: label(name: $selectedName) { id }
      resolvedLabel: label(name: $resolvedName) { id }
    }
  }
`;

const ADD_LABELS_MUTATION = `
  mutation AddStatusLabel($labelableId: ID!, $labelIds: [ID!]!) {
    addLabelsToLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
      clientMutationId
    }
  }
`;

const REMOVE_LABELS_MUTATION = `
  mutation RemoveStatusLabel($labelableId: ID!, $labelIds: [ID!]!) {
    removeLabelsFromLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
      clientMutationId
    }
  }
`;

const ADD_COMMENT_MUTATION = `
  mutation AddStatusComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
      comment { id }
    }
  }
`;

interface StatusLabelIds {
  selected: string | null;
  resolved: string | null;
}

interface GetStatusLabelIdsResponse {
  repository: {
    selectedLabel: { id: string } | null;
    resolvedLabel: { id: string } | null;
  };
}

type GraphQLQueryFn = ReturnType<typeof useGraphQL>['query'];

// 라벨 ID는 세션 내에서 바뀌지 않으므로 카드마다 반복 조회하지 않도록 공유 캐시로 둔다
let statusLabelIdsPromise: Promise<StatusLabelIds> | null = null;

function getStatusLabelIds(query: GraphQLQueryFn): Promise<StatusLabelIds> {
  if (!statusLabelIdsPromise) {
    statusLabelIdsPromise = query<GetStatusLabelIdsResponse>(GET_STATUS_LABEL_IDS_QUERY, {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      selectedName: SELECTED_LABEL,
      resolvedName: RESOLVED_LABEL,
    }).then((data) => ({
      selected: data.repository.selectedLabel?.id ?? null,
      resolved: data.repository.resolvedLabel?.id ?? null,
    }));
  }
  return statusLabelIdsPromise;
}

export interface UseTopicStatusResult {
  status: TopicStatus | undefined;
  isLoading: boolean;
  /** 다음 단계로 진행할 수 있는지 (해결완료면 더 진행할 곳이 없음) */
  canAdvance: boolean;
  /** 한 단계 취소할 수 있는지 (없음 상태면 취소할 게 없음) */
  canCancel: boolean;
  advance: () => Promise<void>;
  cancel: () => Promise<void>;
}

/**
 * 주제의 처리 상태(없음 → 선정완료 → 해결완료)를 관리하는 훅.
 *
 * - GitHub 라벨로 현재 상태를 저장 (기존 TopicType과 동일한 방식)
 * - 상태가 바뀔 때마다 Discussion에 코멘트를 남겨 누가/언제 바꿨는지 기록
 * - 낙관적 업데이트 + 실패 시 롤백 (useVote와 동일한 패턴)
 */
export function useTopicStatus(
  discussionId: string,
  initialStatus: TopicStatus | undefined,
): UseTopicStatusResult {
  const [status, setStatus] = useState<TopicStatus | undefined>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { query, mutate } = useGraphQL();
  const { user } = useAuth();

  const transition = useCallback(
    async (previousStatus: TopicStatus | undefined, nextStatus: TopicStatus | undefined, commentBody: string) => {
      if (isLoading) return;

      setStatus(nextStatus);
      setIsLoading(true);

      try {
        const labelIds = await getStatusLabelIds(query);
        const previousLabelId = previousStatus === SELECTED_LABEL ? labelIds.selected : previousStatus === RESOLVED_LABEL ? labelIds.resolved : null;
        const nextLabelId = nextStatus === SELECTED_LABEL ? labelIds.selected : nextStatus === RESOLVED_LABEL ? labelIds.resolved : null;

        // 라벨이 저장소에 없으면 조용히 건너뛰지 말고 실패 처리 — 안 그러면 화면엔 찍힌 것처럼 보이다가 새로고침하면 사라진다
        if (nextStatus && !nextLabelId) {
          throw new Error(`"${nextStatus}" 라벨이 저장소에 없습니다. GitHub repo에 라벨을 먼저 생성하세요.`);
        }

        if (previousLabelId) {
          await mutate(REMOVE_LABELS_MUTATION, { labelableId: discussionId, labelIds: [previousLabelId] });
        }
        if (nextLabelId) {
          await mutate(ADD_LABELS_MUTATION, { labelableId: discussionId, labelIds: [nextLabelId] });
        }
        await mutate(ADD_COMMENT_MUTATION, { discussionId, body: commentBody });
      } catch (err) {
        // 실패 시 롤백
        console.error('[useTopicStatus] 상태 변경 실패:', err);
        setStatus(previousStatus);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, discussionId, query, mutate],
  );

  const advance = useCallback(() => {
    const login = user?.login ?? '누군가';
    if (status === undefined) {
      return transition(status, SELECTED_LABEL, `🏷️ @${login}님이 상태를 **선정완료**로 변경했습니다`);
    }
    if (status === SELECTED_LABEL) {
      return transition(status, RESOLVED_LABEL, `🏷️ @${login}님이 상태를 **해결완료**로 변경했습니다`);
    }
    return Promise.resolve();
  }, [status, transition, user]);

  const cancel = useCallback(() => {
    const login = user?.login ?? '누군가';
    if (status === RESOLVED_LABEL) {
      return transition(status, SELECTED_LABEL, `↩️ @${login}님이 **해결완료** 표시를 취소했습니다`);
    }
    if (status === SELECTED_LABEL) {
      return transition(status, undefined, `↩️ @${login}님이 **선정완료** 표시를 취소했습니다`);
    }
    return Promise.resolve();
  }, [status, transition, user]);

  return {
    status,
    isLoading,
    canAdvance: status !== RESOLVED_LABEL,
    canCancel: status !== undefined,
    advance,
    cancel,
  };
}
