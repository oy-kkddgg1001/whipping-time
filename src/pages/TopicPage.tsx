import { useParams, useNavigate } from 'react-router-dom';
import { useTopicDetail } from '../hooks/useTopicDetail';
import { useVote } from '../hooks/useVote';
import { useAuth } from '../contexts/AuthContext';
import TopicTypeBadge from '../components/TopicTypeBadge';
import { VoteButton } from '../components/VoteButton';
import { CommentSection } from '../components/CommentSection';
import styles from './TopicPage.module.css';

function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { topic, isLoading, error, retry } = useTopicDetail(id);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading} role="status" aria-live="polite">
          주제 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <button
          className={styles.backButton}
          onClick={handleBack}
          aria-label="이전 페이지로 돌아가기"
        >
          ← 돌아가기
        </button>
        <div className={styles.error} role="alert">
          <p className={styles.errorMessage}>{error.message}</p>
          <button className={styles.retryButton} onClick={retry}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={styles.container}>
        <button
          className={styles.backButton}
          onClick={handleBack}
          aria-label="이전 페이지로 돌아가기"
        >
          ← 돌아가기
        </button>
        <div className={styles.error} role="alert">
          <p className={styles.errorMessage}>주제를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.backButton}
        onClick={handleBack}
        aria-label="이전 페이지로 돌아가기"
      >
        ← 돌아가기
      </button>

      <TopicDetailContent topic={topic} />

      <CommentSection discussionId={topic.id} />
    </div>
  );
}

// Separate component to use hooks that depend on topic data
function TopicDetailContent({ topic }: { topic: NonNullable<ReturnType<typeof useTopicDetail>['topic']> }) {
  const { isAuthenticated } = useAuth();
  const { hasVoted, voteCount, isLoading: voteLoading, toggleVote } = useVote(
    topic.id,
    topic.voteCount,
    topic.hasVoted,
  );

  const formattedDate = new Date(topic.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className={styles.card} aria-labelledby="topic-title">
      <header className={styles.header}>
        <h1 id="topic-title" className={styles.title}>
          {topic.title}
        </h1>
      </header>

      <div className={styles.metaRow}>
        <TopicTypeBadge type={topic.type} />

        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>작성자:</span>
          {topic.author.displayName}
        </span>

        {topic.assignee && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>대상:</span>
            {topic.assignee}
          </span>
        )}

        <VoteButton
          count={voteCount}
          hasVoted={hasVoted}
          isAuthenticated={isAuthenticated}
          isLoading={voteLoading}
          onClick={toggleVote}
          topicTitle={topic.title}
        />
      </div>

      {topic.description && (
        <section className={styles.section} aria-labelledby="section-description">
          <h2 id="section-description" className={styles.sectionTitle}>
            설명
          </h2>
          <p className={styles.sectionContent}>{topic.description}</p>
        </section>
      )}

      {topic.reason && (
        <section className={styles.section} aria-labelledby="section-reason">
          <h2 id="section-reason" className={styles.sectionTitle}>
            이유
          </h2>
          <p className={styles.sectionContent}>{topic.reason}</p>
        </section>
      )}

      <p className={styles.createdAt}>
        생성일: <time dateTime={topic.createdAt}>{formattedDate}</time>
      </p>
    </article>
  );
}

export default TopicPage;
