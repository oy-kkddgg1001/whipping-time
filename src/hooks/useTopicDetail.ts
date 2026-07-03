import { useState, useEffect, useCallback } from 'react';
import type { Topic } from '../types';
import { useGraphQL } from './useGraphQL';
import {
  discussionToTopic,
  type GitHubDiscussion,
} from '../utils/discussion-mapper';

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'deokgoo';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'whipping-time';

const SEARCH_DISCUSSIONS_QUERY = `
  query SearchDiscussions($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          id
          title
          body
          createdAt
          author { login avatarUrl }
          labels(first: 5) { nodes { name } }
          reactions(content: THUMBS_UP) { totalCount viewerHasReacted }
          category { id }
        }
      }
    }
  }
`;

interface DiscussionWithCategory extends GitHubDiscussion {
  category: { id: string };
}

interface SearchDiscussionsResponse {
  repository: {
    discussions: {
      nodes: DiscussionWithCategory[];
    };
  };
}

export interface UseTopicDetailReturn {
  topic: Topic | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * 특정 Topic ID로 상세 정보를 조회하는 커스텀 훅.
 * 
 * Discussion node ID를 사용하여 전체 discussion 목록에서 해당 topic을 찾아 반환합니다.
 */
export function useTopicDetail(topicId: string | undefined): UseTopicDetailReturn {
  const { query } = useGraphQL();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTopic = useCallback(async () => {
    if (!topicId) {
      setTopic(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await query<SearchDiscussionsResponse>(SEARCH_DISCUSSIONS_QUERY, {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
      });

      const discussionNodes = data.repository.discussions.nodes;
      const found = discussionNodes.find((node) => node.id === topicId);

      if (!found) {
        setError(new Error('주제를 찾을 수 없습니다'));
        setTopic(null);
      } else {
        const mappedTopic = discussionToTopic(found, found.category.id);
        setTopic(mappedTopic);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('주제 정보를 불러오는데 실패했습니다'));
    } finally {
      setIsLoading(false);
    }
  }, [query, topicId]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  const retry = useCallback(() => {
    fetchTopic();
  }, [fetchTopic]);

  return {
    topic,
    isLoading,
    error,
    retry,
  };
}
