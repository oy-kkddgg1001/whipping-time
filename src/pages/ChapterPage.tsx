import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTopics } from '../hooks/useTopics';
import { useChapters } from '../hooks/useChapters';
import { TopicCard } from '../components/TopicCard';
import { CommentSection } from '../components/CommentSection';
import { sortTopicsByVotes } from '../utils/topic-utils';
import styles from './ChapterPage.module.css';

/**
 * TopicListPage — 특정 챕터의 주제 목록을 표시하는 페이지.
 */
function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const chapterId = id ?? '';
  const { topics, isLoading, error, retry } = useTopics(chapterId);
  const { chapters } = useChapters();
  const [sortBy, setSortBy] = useState<'latest' | 'votes'>('latest');

  // 현재 챕터 찾기
  const currentChapter = chapters.find((ch) => ch.id === chapterId);

  // 정렬 적용
  const sortedTopics = sortBy === 'votes'
    ? sortTopicsByVotes(topics)
    : [...topics].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.status} role="status" aria-live="polite">
          <p>주제 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.status} role="alert">
          <p className={styles.errorText}>주제 목록을 불러오는데 실패했습니다.</p>
          <p className={styles.errorDetail}>{error.message}</p>
          <button className={styles.retryButton} onClick={retry} type="button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 챕터 제목 영역 */}
      {currentChapter && (
        <div className={styles.chapterBanner}>
          <span className={styles.chapterNumber}>{currentChapter.number}회</span>
          <h2 className={styles.chapterTitle}>{currentChapter.title}</h2>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.pageTitle}>주제 목록</h1>
        <div className={styles.headerActions}>
          <div className={styles.sortToggle} role="group" aria-label="정렬 기준">
            <button
              type="button"
              className={`${styles.sortButton} ${sortBy === 'latest' ? styles.sortButtonActive : ''}`}
              onClick={() => setSortBy('latest')}
              aria-pressed={sortBy === 'latest'}
            >
              🕐 최신순
            </button>
            <button
              type="button"
              className={`${styles.sortButton} ${sortBy === 'votes' ? styles.sortButtonActive : ''}`}
              onClick={() => setSortBy('votes')}
              aria-pressed={sortBy === 'votes'}
            >
              👍 따봉순
            </button>
          </div>
          <Link to={`/chapters/${chapterId}/new`} className={styles.newTopicLink}>
            + 새 주제 등록
          </Link>
        </div>
      </header>

      {sortedTopics.length === 0 ? (
        <div className={styles.empty} role="status">
          <div className={styles.emptyIcon} aria-hidden="true">💬</div>
          <p className={styles.emptyText}>아직 등록된 주제가 없습니다.</p>
          <p className={styles.emptyHint}>첫 번째 주제를 등록해 보세요!</p>
        </div>
      ) : (
        <ul className={styles.topicList} aria-label="주제 목록">
          {sortedTopics.map((topic) => (
            <li key={topic.id} className={styles.topicItem}>
              <TopicCard topic={topic} />
            </li>
          ))}
        </ul>
      )}

      {/* 챕터 댓글 섹션 */}
      {chapterId && (
        <CommentSection
          discussionId={chapterId}
          title="잡담 & 기대감"
          placeholder="이번 챕터에 대한 기대, 하고 싶은 이야기를 자유롭게 남겨주세요 ✨"
          emptyMessage="아직 이야기가 없어요. 이번 챕터에 기대하는 점이나 하고 싶은 말을 남겨보세요! 🎉"
        />
      )}
    </div>
  );
}

export default ChapterPage;
