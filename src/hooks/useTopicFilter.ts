import { useState, useMemo } from 'react';
import type { Topic, TopicType } from '../types/index';
import { filterTopicsByType } from '../utils/topic-utils';

/**
 * Topic 목록을 유형별로 필터링하는 커스텀 훅
 *
 * @param topics - 필터링할 Topic 배열
 * @returns filteredTopics, 현재 필터, 필터 설정 함수
 */
export function useTopicFilter(topics: Topic[]) {
  const [filter, setFilter] = useState<TopicType | 'all'>('all');

  const filteredTopics = useMemo(
    () => filterTopicsByType(topics, filter),
    [topics, filter]
  );

  return {
    filteredTopics,
    filter,
    setFilter,
  };
}
