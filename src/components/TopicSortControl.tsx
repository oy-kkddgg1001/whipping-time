import styles from './TopicSortControl.module.css';

export interface TopicSortControlProps {
  /** 현재 정렬 기준 */
  sortBy: 'latest' | 'votes';
  /** 정렬 변경 콜백 */
  onChange: (sort: 'latest' | 'votes') => void;
}

interface SortOption {
  value: 'latest' | 'votes';
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'votes', label: '투표순' },
];

/**
 * Topic 정렬 옵션 컨트롤 컴포넌트
 *
 * 최신순/투표순 정렬을 선택할 수 있는 셀렉트 드롭다운을 제공합니다.
 * 접근성: label과 연결된 select 요소를 사용합니다.
 */
export function TopicSortControl({ sortBy, onChange }: TopicSortControlProps) {
  return (
    <div className={styles.container}>
      <label htmlFor="topic-sort" className={styles.label}>
        정렬
      </label>
      <select
        id="topic-sort"
        className={styles.select}
        value={sortBy}
        onChange={(e) => onChange(e.target.value as 'latest' | 'votes')}
        aria-label="주제 정렬 기준"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
