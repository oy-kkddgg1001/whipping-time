import { useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import type { TopicFormData, TopicType } from '../types';
import { validateTopicForm } from '../utils/topic-utils';
import styles from './TopicForm.module.css';

interface TopicFormProps {
  onSubmit: (data: TopicFormData) => Promise<void>;
  hasActiveChapter: boolean;
}

const TOPIC_TYPE_OPTIONS = [
  { value: '고민상담' as TopicType, emoji: '💭', description: '함께 고민하고 싶은 주제', activeClass: styles.typeCardConsult },
  { value: '떠먹여 드림' as TopicType, emoji: '🍰', description: '내가 발표할 주제', activeClass: styles.typeCardFeed },
  { value: '떠먹여 주세요' as TopicType, emoji: '🙏', description: '누군가에게 부탁하는 주제', activeClass: styles.typeCardRequest },
];

/**
 * 주제 등록 폼 컴포넌트.
 *
 * - 필수 필드: 타이틀, TopicType 선택
 * - 선택 필드: 설명, 이유
 * - 조건부 필드: Assignee ("떠먹여 주세요" 선택 시 필수)
 * - "익명으로 표시" 체크박스 (기본 해제)
 * - 유효성 검증 메시지 표시
 * - 제출 성공 시 폼 초기화 + 완료 피드백
 * - 활성 챕터 없을 시 제출 비활성화 + 안내 메시지
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 2.9, 3.1
 */
export function TopicForm({ onSubmit, hasActiveChapter }: TopicFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TopicType | ''>('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [assignee, setAssignee] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = useCallback(() => {
    setTitle('');
    setType('');
    setDescription('');
    setReason('');
    setAssignee('');
    setIsAnonymous(false);
    setErrors([]);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors([]);

    const formData: TopicFormData = {
      title: title.trim(),
      type: type as TopicType,
      description: description.trim() || undefined,
      reason: reason.trim() || undefined,
      isAnonymous,
      assignee: type === '떠먹여 주세요' ? assignee.trim() : undefined,
    };

    const validation = validateTopicForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      resetForm();
      setSuccessMessage('주제가 등록되었습니다');
    } catch (err) {
      setErrors([err instanceof Error ? err.message : '주제 등록에 실패했습니다.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAssigneeField = type === '떠먹여 주세요';

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {!hasActiveChapter && (
        <div className={styles.warningMessage} role="alert">
          활성 챕터가 없어 주제를 등록할 수 없습니다
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage} role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" aria-live="assertive">
          {errors.map((error, index) => (
            <p key={index} className={styles.errorMessage}>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* 타이틀 */}
      <div className={styles.fieldGroup}>
        <label htmlFor="topic-title" className={styles.label}>
          타이틀<span className={styles.required} aria-hidden="true">*</span>
        </label>
        <input
          id="topic-title"
          type="text"
          className={`${styles.input} ${errors.some(e => e.includes('제목')) ? styles.inputError : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          aria-required="true"
          aria-invalid={errors.some(e => e.includes('제목'))}
          aria-describedby="title-char-count title-error"
          placeholder="주제 제목을 입력하세요"
          disabled={!hasActiveChapter}
        />
        <span
          id="title-char-count"
          className={`${styles.charCount} ${title.length >= 90 ? styles.charCountWarning : ''} ${title.length >= 100 ? styles.charCountError : ''}`}
        >
          {title.length}/100
        </span>
        {errors.some(e => e.includes('제목')) && (
          <span id="title-error" className={styles.errorMessage}>
            {errors.find(e => e.includes('제목'))}
          </span>
        )}
      </div>

      {/* TopicType 선택 */}
      <fieldset className={styles.fieldGroup}>
        <legend className={styles.label}>
          주제 유형<span className={styles.required} aria-hidden="true">*</span>
        </legend>
        <div
          className={styles.typeCardGroup}
          role="radiogroup"
          aria-required="true"
          aria-invalid={errors.some(e => e.includes('유형'))}
          aria-describedby="type-error"
        >
          {TOPIC_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`${styles.typeCard} ${type === option.value ? styles.typeCardSelected : ''} ${type === option.value ? option.activeClass : ''}`}
            >
              <input
                type="radio"
                name="topicType"
                value={option.value}
                checked={type === option.value}
                onChange={(e) => setType(e.target.value as TopicType)}
                disabled={!hasActiveChapter}
              />
              <span className={styles.typeCardEmoji}>{option.emoji}</span>
              <span className={styles.typeCardTitle}>{option.value}</span>
              <span className={styles.typeCardDesc}>{option.description}</span>
            </label>
          ))}
        </div>
        {errors.some(e => e.includes('유형')) && (
          <span id="type-error" className={styles.errorMessage}>
            {errors.find(e => e.includes('유형'))}
          </span>
        )}
      </fieldset>

      {/* 설명 */}
      <div className={styles.fieldGroup}>
        <label htmlFor="topic-description" className={styles.label}>
          설명
        </label>
        <textarea
          id="topic-description"
          className={`${styles.textarea} ${errors.some(e => e.includes('설명')) ? styles.inputError : ''}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          aria-describedby="desc-char-count"
          placeholder="주제에 대한 설명을 입력하세요 (선택)"
          disabled={!hasActiveChapter}
        />
        <span
          id="desc-char-count"
          className={`${styles.charCount} ${description.length >= 450 ? styles.charCountWarning : ''} ${description.length >= 500 ? styles.charCountError : ''}`}
        >
          {description.length}/500
        </span>
      </div>

      {/* 이유 */}
      <div className={styles.fieldGroup}>
        <label htmlFor="topic-reason" className={styles.label}>
          이유
        </label>
        <input
          id="topic-reason"
          type="text"
          className={styles.input}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="이 주제를 제안하는 이유 (선택)"
          disabled={!hasActiveChapter}
        />
      </div>

      {/* Assignee (조건부) */}
      {showAssigneeField && (
        <div className={styles.fieldGroup}>
          <label htmlFor="topic-assignee" className={styles.label}>
            지목 대상<span className={styles.required} aria-hidden="true">*</span>
          </label>
          <input
            id="topic-assignee"
            type="text"
            className={`${styles.input} ${errors.some(e => e.includes('지목')) ? styles.inputError : ''}`}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            aria-required="true"
            aria-invalid={errors.some(e => e.includes('지목'))}
            aria-describedby="assignee-error"
            placeholder="발표 대상자를 입력하세요"
            disabled={!hasActiveChapter}
          />
          {errors.some(e => e.includes('지목')) && (
            <span id="assignee-error" className={styles.errorMessage}>
              {errors.find(e => e.includes('지목'))}
            </span>
          )}
        </div>
      )}

      {/* 익명으로 표시 */}
      <div className={styles.fieldGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={!hasActiveChapter}
          />
          익명으로 표시
        </label>
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={!hasActiveChapter || isSubmitting}
      >
        {isSubmitting ? '등록 중...' : '주제 등록'}
      </button>
    </form>
  );
}
