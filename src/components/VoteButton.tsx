import { useState } from 'react';
import styles from './VoteButton.module.css';

export interface VoteButtonProps {
  /** 현재 투표 수 */
  count: number;
  /** 현재 사용자의 투표 여부 */
  hasVoted: boolean;
  /** 인증 상태 */
  isAuthenticated: boolean;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 투표 토글 클릭 핸들러 */
  onClick: () => void;
  /** 접근성 레이블에 사용할 주제 제목 */
  topicTitle: string;
}

/**
 * 투표 버튼 컴포넌트.
 * - 투표 전/후 시각적 상태 구분 (outline vs filled)
 * - 투표 수 표시
 * - 비로그인 시 투표 차단 + 로그인 안내 메시지
 * - 로딩 중 버튼 비활성화
 * - topicTitle 기반 접근성 aria-label
 */
export function VoteButton({
  count,
  hasVoted,
  isAuthenticated,
  isLoading,
  onClick,
  topicTitle,
}: VoteButtonProps) {
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const ariaLabel = hasVoted
    ? `${topicTitle} 투표 취소하기`
    : `${topicTitle}에 투표하기`;

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowLoginMessage(true);
      return;
    }
    setShowLoginMessage(false);
    onClick();
  };

  const buttonClassName = [
    styles.button,
    hasVoted ? styles.voted : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleClick}
        disabled={isLoading}
        aria-label={ariaLabel}
        aria-pressed={hasVoted}
      >
        <span className={styles.icon} aria-hidden="true">
          {hasVoted ? '👍' : '👍'}
        </span>
        <span className={styles.count}>{count}</span>
      </button>
      {showLoginMessage && !isAuthenticated && (
        <span className={styles.loginMessage} role="alert">
          로그인이 필요합니다
        </span>
      )}
    </div>
  );
}
