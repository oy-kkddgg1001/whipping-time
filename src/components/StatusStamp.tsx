import { useState } from 'react';
import type { TopicStatus } from '../types';
import styles from './StatusStamp.module.css';

export interface StatusStampProps {
  status: TopicStatus | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
  onCancel: () => void;
  topicTitle: string;
}

/**
 * 주제 카드 우하단에 붙는 처리 상태 도장.
 * - 상태 없음: 작은 "선정완료 표시" 버튼
 * - 상태 있음: 카드 밖으로 넘치는 도장 (클릭하면 다음 단계로), 옆에 취소(×) 버튼
 */
export function StatusStamp({
  status,
  isAuthenticated,
  isLoading,
  canAdvance,
  onAdvance,
  onCancel,
  topicTitle,
}: StatusStampProps) {
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const guard = (action: () => void) => () => {
    if (!isAuthenticated) {
      setShowLoginMessage(true);
      return;
    }
    setShowLoginMessage(false);
    action();
  };

  if (!status) {
    return (
      <div className={styles.idle}>
        <button
          type="button"
          className={styles.advanceButton}
          onClick={guard(onAdvance)}
          disabled={isLoading}
        >
          선정완료 표시
        </button>
        {showLoginMessage && (
          <span className={styles.loginMessage} role="alert">
            로그인이 필요합니다
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.stampWrapper}>
      <button
        type="button"
        className={[styles.stamp, status === '해결완료' ? styles.resolved : styles.selected].join(' ')}
        onClick={guard(onAdvance)}
        disabled={isLoading || !canAdvance}
        aria-label={`${topicTitle}: ${status}${canAdvance ? ' (클릭하면 다음 단계로)' : ''}`}
      >
        {status}
      </button>
      <button
        type="button"
        className={styles.cancelButton}
        onClick={guard(onCancel)}
        disabled={isLoading}
        aria-label={`${topicTitle} ${status} 취소`}
      >
        ×
      </button>
      {showLoginMessage && (
        <span className={styles.loginMessage} role="alert">
          로그인이 필요합니다
        </span>
      )}
    </div>
  );
}
