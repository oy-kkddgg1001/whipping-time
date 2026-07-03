import { useState, useEffect, useCallback } from 'react';
import type { Topic, TopicFormData } from '../types';
import { useGraphQL } from './useGraphQL';
import { useAuth } from '../contexts/AuthContext';
import {
  discussionToTopic,
  topicFormToDiscussionInput,
  parseDiscussionMetadata,
  type GitHubDiscussion,
} from '../utils/discussion-mapper';
import { validateTopicForm } from '../utils/topic-utils';

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'oy-kkddgg1001';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'whipping-time';

// "Topics" 카테고리의 모든 Discussion을 가져온 뒤 chapterId로 필터링
const GET_REPO_AND_CATEGORIES_QUERY = `
  query GetRepoAndCategories($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
      discussionCategories(first: 50) {
        nodes { id name }
      }
    }
  }
`;

const GET_TOPICS_QUERY = `
  query GetTopics($owner: String!, $repo: String!, $categoryId: ID!) {
    repository(owner: $owner, name: $repo) {
      discussions(categoryId: $categoryId, first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          id
          title
          body
          createdAt
          author { login avatarUrl }
          labels(first: 5) { nodes { name } }
          reactions(content: THUMBS_UP) { totalCount viewerHasReacted }
        }
      }
    }
  }
`;

const CREATE_DISCUSSION_MUTATION = `
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
      discussion { id title createdAt }
    }
  }
`;

interface DiscussionNode extends GitHubDiscussion {}

interface GetRepoAndCategoriesResponse {
  repository: {
    id: string;
    discussionCategories: {
      nodes: Array<{ id: string; name: string }>;
    };
  };
}

interface GetTopicsResponse {
  repository: {
    discussions: {
      nodes: DiscussionNode[];
    };
  };
}

interface CreateDiscussionResponse {
  createDiscussion: {
    discussion: {
      id: string;
      title: string;
      createdAt: string;
    };
  };
}

export interface UseTopicsReturn {
  topics: Topic[];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  createTopic: (data: TopicFormData) => Promise<void>;
}

/**
 * 특정 챕터의 Topic 목록 조회, Topic 생성을 관리하는 커스텀 훅.
 *
 * - "Topics" 카테고리의 Discussion을 가져와서 body 메타데이터의 chapterId로 필터링
 * - Topic 생성 시 body에 chapterId를 메타데이터로 포함
 */
export function useTopics(chapterId: string): UseTopicsReturn {
  const { query, mutate } = useGraphQL();
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [repoId, setRepoId] = useState<string>('');
  const [topicsCategoryId, setTopicsCategoryId] = useState<string>('');

  const fetchTopics = useCallback(async () => {
    if (!chapterId) {
      setTopics([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. repo 정보 + 카테고리 찾기
      const repoData = await query<GetRepoAndCategoriesResponse>(GET_REPO_AND_CATEGORIES_QUERY, {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
      });

      setRepoId(repoData.repository.id);

      // "Topics" 카테고리 찾기
      const topicsCategory = repoData.repository.discussionCategories.nodes.find(
        (cat) => {
          const name = cat.name.toLowerCase().trim();
          return name === 'topics' || name === '주제' || name.includes('topic');
        }
      );

      if (!topicsCategory) {
        setTopics([]);
        setIsLoading(false);
        return;
      }

      setTopicsCategoryId(topicsCategory.id);

      // 2. 해당 카테고리의 Discussion들 가져오기
      const data = await query<GetTopicsResponse>(GET_TOPICS_QUERY, {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        categoryId: topicsCategory.id,
      });

      // 3. body 메타데이터에서 chapterId로 필터링
      const discussionNodes = data.repository.discussions.nodes;
      const filteredNodes = discussionNodes.filter((node) => {
        const metadata = parseDiscussionMetadata(node.body);
        return (metadata as unknown as Record<string, unknown>).chapterId === chapterId;
      });

      const mappedTopics = filteredNodes.map((node) =>
        discussionToTopic(node, chapterId),
      );

      setTopics(mappedTopics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('주제 목록을 불러오는데 실패했습니다'));
    } finally {
      setIsLoading(false);
    }
  }, [query, chapterId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const retry = useCallback(() => {
    fetchTopics();
  }, [fetchTopics]);

  const createTopic = useCallback(
    async (data: TopicFormData): Promise<void> => {
      const validation = validateTopicForm(data);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!topicsCategoryId) {
        throw new Error('Topics 카테고리가 없습니다. GitHub repo에서 "Topics" Discussion 카테고리를 생성해주세요.');
      }

      // topicFormToDiscussionInput은 categoryId에 topicsCategoryId를 사용
      const input = topicFormToDiscussionInput(data, user, topicsCategoryId);

      // body에 chapterId를 추가해서 소속 챕터를 식별
      const bodyWithChapter = input.body.replace(
        '<!-- metadata:',
        `<!-- metadata:`,
      ).replace(
        /<!-- metadata:(\{.*?\}) -->/s,
        (_, json) => {
          const parsed = JSON.parse(json);
          parsed.chapterId = chapterId;
          return `<!-- metadata:${JSON.stringify(parsed)} -->`;
        }
      );

      await mutate<CreateDiscussionResponse>(CREATE_DISCUSSION_MUTATION, {
        repositoryId: repoId,
        categoryId: topicsCategoryId,
        title: input.title,
        body: bodyWithChapter,
      });

      await fetchTopics();
    },
    [user, mutate, chapterId, topicsCategoryId, repoId, fetchTopics],
  );

  return {
    topics,
    isLoading,
    error,
    retry,
    createTopic,
  };
}
