import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
