import { useState, useMemo } from 'react';
import type { Topic } from '../types/index';
import { sortTopicsByVotes } from '../utils/topic-utils';

/**
 * Topic 목록을 정렬하는 커스텀 훅
 *
 * - 'latest': 생성일시 내림차순 (최신 먼저)
 * - 'votes': 투표 수 내림차순 (동점 시 생성시간 오름차순)
 *
 * @param topics - 정렬할 Topic 배열
 * @returns sortedTopics, 현재 정렬 기준, 정렬 설정 함수
 */
export function useTopicSort(topics: Topic[]) {
  const [sortBy, setSortBy] = useState<'latest' | 'votes'>('latest');

  const sortedTopics = useMemo(() => {
    if (sortBy === 'votes') {
      return sortTopicsByVotes(topics);
    }
    // 'latest': createdAt 내림차순
    return [...topics].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [topics, sortBy]);

  return {
    sortedTopics,
    sortBy,
    setSortBy,
  };
}
