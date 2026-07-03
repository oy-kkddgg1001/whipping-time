import { useState, useEffect, useCallback } from 'react';
import type { Chapter } from '../types';
import { useGraphQL } from './useGraphQL';
import {
  getActiveChapter,
  sortChaptersByNumber,
  validateChapterTitle,
  getNextChapterNumber,
} from '../utils/chapter-utils';

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'oy-kkddgg1001';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'whipping-time';

// "Chapters" 카테고리의 Discussion을 챕터로 사용
// 먼저 카테고리 ID를 찾고, 그 안의 Discussion들을 챕터로 파싱
const GET_CHAPTERS_QUERY = `
  query GetChapters($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
      discussionCategories(first: 50) {
        nodes {
          id
          name
        }
      }
    }
  }
`;

const GET_CHAPTER_DISCUSSIONS_QUERY = `
  query GetChapterDiscussions($owner: String!, $repo: String!, $categoryId: ID!) {
    repository(owner: $owner, name: $repo) {
      discussions(categoryId: $categoryId, first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          id
          title
          body
          createdAt
        }
      }
    }
  }
`;

const CREATE_CHAPTER_MUTATION = `
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
      discussion {
        id
        title
        body
        createdAt
      }
    }
  }
`;

interface CategoryNode {
  id: string;
  name: string;
}

interface DiscussionNode {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

interface GetChaptersResponse {
  repository: {
    id: string;
    discussionCategories: {
      nodes: CategoryNode[];
    };
  };
}

interface GetChapterDiscussionsResponse {
  repository: {
    discussions: {
      nodes: DiscussionNode[];
    };
  };
}

interface CreateChapterResponse {
  createDiscussion: {
    discussion: DiscussionNode;
  };
}

/**
 * Discussion 제목에서 챕터 번호를 파싱합니다.
 * 예: "3회: React Hooks" → 3
 *     "Chapter 3: Hooks" → 3
 */
function parseChapterFromDiscussion(node: DiscussionNode): Chapter | null {
  const match = node.title.match(/(\d+)/);
  if (!match) return null;

  const number = parseInt(match[1], 10);
  return {
    id: node.id,
    number,
    title: node.title,
    createdAt: node.createdAt,
  };
}

export interface UseChaptersReturn {
  chapters: Chapter[];
  activeChapter: Chapter | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  createChapter: (title: string) => Promise<void>;
}

/**
 * 챕터 목록 조회, 활성 챕터 결정, 챕터 생성을 관리하는 커스텀 훅.
 *
 * - "Chapters" 카테고리 안의 Discussion을 챕터로 사용
 * - 가장 높은 번호의 챕터를 활성 챕터로 결정
 * - 새 챕터 생성 시 createDiscussion mutation 호출
 */
export function useChapters(): UseChaptersReturn {
  const { query, mutate } = useGraphQL();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [repoId, setRepoId] = useState<string>('');
  const [chapterCategoryId, setChapterCategoryId] = useState<string>('');

  const fetchChapters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. repo ID와 카테고리 목록 가져오기
      const repoData = await query<GetChaptersResponse>(GET_CHAPTERS_QUERY, {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
      });

      setRepoId(repoData.repository.id);

      // "Chapters" 카테고리 찾기 (대소문자 무관, 부분 매칭)
      const chaptersCategory = repoData.repository.discussionCategories.nodes.find(
        (cat) => {
          const name = cat.name.toLowerCase().trim();
          return name === 'chapters' || name === '챕터' || name.includes('chapter');
        }
      );

      if (!chaptersCategory) {
        // 카테고리가 없으면 어떤 카테고리들이 있는지 에러에 표시
        const availableNames = repoData.repository.discussionCategories.nodes
          .map((cat) => cat.name)
          .join(', ');
        setError(new Error(
          `"Chapters" 카테고리를 찾을 수 없습니다. 현재 카테고리: [${availableNames}]`
        ));
        setChapters([]);
        setIsLoading(false);
        return;
      }

      setChapterCategoryId(chaptersCategory.id);

      // 2. 해당 카테고리의 Discussion들 가져오기
      const discussionData = await query<GetChapterDiscussionsResponse>(
        GET_CHAPTER_DISCUSSIONS_QUERY,
        {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          categoryId: chaptersCategory.id,
        }
      );

      const parsedChapters = discussionData.repository.discussions.nodes
        .map(parseChapterFromDiscussion)
        .filter((ch): ch is Chapter => ch !== null);

      const sorted = sortChaptersByNumber(parsedChapters);
      setChapters(sorted);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('챕터 목록을 불러오는데 실패했습니다'));
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const retry = useCallback(() => {
    fetchChapters();
  }, [fetchChapters]);

  const createChapter = useCallback(
    async (title: string): Promise<void> => {
      const validation = validateChapterTitle(title);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }

      if (!chapterCategoryId) {
        throw new Error('챕터 카테고리가 설정되지 않았습니다. GitHub repo에서 "Chapters" Discussion 카테고리를 생성해주세요.');
      }

      const nextNumber = getNextChapterNumber(chapters);
      const chapterTitle = `${nextNumber}회: ${title}`;
      const chapterBody = `<!-- chapter:${nextNumber} -->\n\n${title}`;

      await mutate<CreateChapterResponse>(CREATE_CHAPTER_MUTATION, {
        repositoryId: repoId,
        categoryId: chapterCategoryId,
        title: chapterTitle,
        body: chapterBody,
      });

      await fetchChapters();
    },
    [chapters, repoId, chapterCategoryId, mutate, fetchChapters],
  );

  const activeChapter = getActiveChapter(chapters);

  return {
    chapters,
    activeChapter,
    isLoading,
    error,
    retry,
    createChapter,
  };
}
