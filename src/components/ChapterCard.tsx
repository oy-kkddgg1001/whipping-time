import { Link } from 'react-router-dom';
import type { Chapter } from '../types';
import styles from './ChapterCard.module.css';

export interface ChapterCardProps {
  chapter: Chapter;
  isActive: boolean;
}

/**
 * 챕터 정보를 카드 형태로 표시하는 컴포넌트.
 * 챕터 번호, 제목, 생성일을 표시하며, 활성 챕터에는 "활성" 배지를 표시한다.
 */
export function ChapterCard({ chapter, isActive }: ChapterCardProps) {
  const formattedDate = new Date(chapter.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const cardClassName = [styles.card, isActive ? styles.cardActive : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      to={`/chapters/${chapter.id}`}
      className={cardClassName}
      aria-label={`${chapter.number}회: ${chapter.title}${isActive ? ' (활성 챕터)' : ''}`}
    >
      <span className={styles.number} aria-hidden="true">
        {chapter.number}
      </span>
      <div className={styles.content}>
        <h3 className={styles.title}>{chapter.title}</h3>
        <div className={styles.meta}>
          <time dateTime={chapter.createdAt}>{formattedDate}</time>
          {isActive && (
            <span className={styles.badge} aria-label="활성 챕터">
              활성
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
