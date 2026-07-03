import { useState, useEffect } from 'react';
import styles from './LoadingIndicator.module.css';

interface LoadingIndicatorProps {
  /** Delay in ms before showing the spinner (default: 300ms) */
  delay?: number;
}

function LoadingIndicator({ delay = 300 }: LoadingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={styles.container}
      role="status"
      aria-live="polite"
      aria-label="로딩 중"
    >
      <div className={styles.spinner} aria-hidden="true" />
      <span className={styles.text}>로딩 중...</span>
    </div>
  );
}

export default LoadingIndicator;
