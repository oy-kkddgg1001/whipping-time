import type { TopicType } from '../types/index';
import styles from './TopicFilter.module.css';

export interface TopicFilterProps {
  /** 현재 선택된 필터 타입 */
  selectedType: TopicType | 'all';
  /** 필터 변경 콜백 */
  onChange: (type: TopicType | 'all') => void;
  /** 필터 결과가 비어있는지 여부 */
  isEmpty?: boolean;
}

interface FilterOption {
  value: TopicType | 'all';
  label: string;
  activeClass?: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: '전체' },
  { value: '고민상담', label: '고민상담', activeClass: styles.filterButtonConsult },
  { value: '떠먹여 드림', label: '떠먹여 드림', activeClass: styles.filterButtonFeed },
  { value: '떠먹여 주세요', label: '떠먹여 주세요', activeClass: styles.filterButtonRequest },
];

/**
 * TopicType별 필터링 UI 컴포넌트
 *
 * 버튼 그룹으로 전체/고민상담/떠먹여 드림/떠먹여 주세요 필터를 제공합니다.
 * 접근성: role="group", aria-pressed로 현재 선택 상태를 표시합니다.
 */
export function TopicFilter({ selectedType, onChange, isEmpty = false }: TopicFilterProps) {
  return (
    <div className={styles.container}>
      <div
        className={styles.filterGroup}
        role="group"
        aria-label="주제 유형 필터"
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = selectedType === option.value;
          const activeClass = isActive
            ? option.activeClass || styles.filterButtonActive
            : '';

          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.filterButton} ${activeClass}`}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isEmpty && (
        <p className={styles.emptyMessage} role="status" aria-live="polite">
          선택한 유형의 주제가 없습니다.
        </p>
      )}
    </div>
  );
}
