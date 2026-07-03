import { useState, type FormEvent } from 'react';
import { useChapters } from '../hooks/useChapters';
import { useAuth } from '../contexts/AuthContext';
import { ChapterCard } from '../components/ChapterCard';
import { validateChapterTitle } from '../utils/chapter-utils';
import styles from './HomePage.module.css';

function HomePage() {
  const { chapters, activeChapter, isLoading, error, retry, createChapter } = useChapters();
  const { isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validateChapterTitle(title);
    if (!validation.valid) {
      setValidationError(validation.errors[0]);
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      await createChapter(title);
      setTitle('');
      setShowForm(false);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : '챕터 생성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.stateContainer} role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.stateTitle}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.stateContainer} role="alert">
          <p className={styles.stateTitle}>데이터를 불러올 수 없습니다</p>
          <p className={styles.stateDescription}>{error.message}</p>
          <button className={styles.retryButton} onClick={retry} type="button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>챕터</h1>
          <p className={styles.subtitle}>프론트엔드 챕터 세션 목록</p>
        </div>
        {isAuthenticated && !showForm && (
          <button
            className={styles.addButton}
            onClick={() => setShowForm(true)}
            aria-label="새 챕터 생성"
          >
            +
          </button>
        )}
      </header>

      {/* 인라인 생성 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.inlineForm} noValidate>
          <input
            type="text"
            className={`${styles.inlineInput} ${validationError ? styles.inputError : ''}`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="새 챕터 제목"
            maxLength={50}
            aria-label="챕터 제목"
            autoFocus
            disabled={isSubmitting}
          />
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => { setShowForm(false); setTitle(''); setValidationError(null); }}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button type="submit" className={styles.confirmButton} disabled={isSubmitting}>
              {isSubmitting ? '...' : '생성'}
            </button>
          </div>
          {validationError && (
            <p className={styles.errorMessage} role="alert">{validationError}</p>
          )}
        </form>
      )}

      {/* 챕터 목록 */}
      {chapters.length === 0 ? (
        <div className={styles.stateContainer} role="status">
          <p className={styles.stateTitle}>아직 챕터가 없습니다</p>
          <p className={styles.stateDescription}>
            {isAuthenticated ? '+ 버튼을 눌러 새 챕터를 시작하세요.' : '로그인 후 챕터를 생성할 수 있습니다.'}
          </p>
        </div>
      ) : (
        <ul className={styles.chapterList} aria-label="챕터 목록">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <ChapterCard chapter={chapter} isActive={activeChapter?.id === chapter.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HomePage;
