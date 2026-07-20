import { Link } from 'react-router-dom';
import type { Topic } from '../types';
import TopicTypeBadge from './TopicTypeBadge';
import { VoteButton } from './VoteButton';
import { StatusStamp } from './StatusStamp';
import { useVote } from '../hooks/useVote';
import { useTopicStatus } from '../hooks/useTopicStatus';
import { useAuth } from '../contexts/AuthContext';
import styles from './TopicCard.module.css';

export interface TopicCardProps {
  topic: Topic;
}

/**
 * Topic 정보를 카드 형태로 표시하는 컴포넌트.
 * - 제목, TopicType 배지, 작성자, 투표 버튼 표시
 * - "떠먹여 주세요" 유형일 경우 Assignee 표시
 * - 클릭 시 상세 페이지로 이동
 * - 투표 버튼 클릭 시 이벤트 전파를 막아 네비게이션 방지
 */
export function TopicCard({ topic }: TopicCardProps) {
  const { isAuthenticated } = useAuth();
  const { hasVoted, voteCount, isLoading, toggleVote } = useVote(
    topic.id,
    topic.voteCount,
    topic.hasVoted,
  );
  const {
    status,
    isLoading: isStatusLoading,
    canAdvance,
    advance,
    cancel,
  } = useTopicStatus(topic.id, topic.status);

  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleVote();
  };

  return (
    <article className={styles.card} aria-label={`주제: ${topic.title}`}>
      <Link to={`/topics/${topic.id}`} className={styles.link}>
        <div className={styles.header}>
          <TopicTypeBadge type={topic.type} />
          <div
            onClick={handleVoteClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggleVote();
              }
            }}
            role="presentation"
          >
            <VoteButton
              count={voteCount}
              hasVoted={hasVoted}
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
              onClick={toggleVote}
              topicTitle={topic.title}
            />
          </div>
        </div>
        <h3 className={styles.title}>{topic.title}</h3>
        <div className={styles.meta}>
          <span className={styles.author}>{topic.author.displayName}</span>
          {topic.type === '떠먹여 주세요' && topic.assignee && (
            <span className={styles.assignee}>
              → {topic.assignee}
            </span>
          )}
        </div>
      </Link>
      <StatusStamp
        status={status}
        isAuthenticated={isAuthenticated}
        isLoading={isStatusLoading}
        canAdvance={canAdvance}
        onAdvance={advance}
        onCancel={cancel}
        topicTitle={topic.title}
      />
    </article>
  );
}
