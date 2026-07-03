import { useState } from 'react';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../contexts/AuthContext';

export interface CommentSectionProps {
  discussionId: string;
  title?: string;
  placeholder?: string;
  emptyMessage?: string;
}

/**
 * 댓글 섹션 컴포넌트.
 * - 댓글 목록 (아바타, 작성자, 본문, 시간)
 * - 인증된 사용자에게 댓글 작성 폼 표시
 * - 댓글 작성 후 자동 새로고침
 */
export function CommentSection({ discussionId, title, placeholder, emptyMessage }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const { comments, isLoading, error, addComment, isAddingComment } = useComments(discussionId);
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isAddingComment) return;

    try {
      await addComment(body.trim());
      setBody('');
    } catch {
      // Error is handled by mutation state
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section style={sectionStyle} aria-labelledby="comments-title">
      <h2 id="comments-title" style={titleStyle}>
        💬 {title || '댓글'} {comments.length > 0 && `(${comments.length})`}
      </h2>

      {isLoading && (
        <p style={loadingStyle} role="status">댓글을 불러오는 중...</p>
      )}

      {error && (
        <p style={errorStyle} role="alert">댓글을 불러오는데 실패했습니다.</p>
      )}

      {!isLoading && comments.length === 0 && !error && (
        <p style={emptyStyle}>{emptyMessage || '아직 댓글이 없습니다. 첫 댓글을 남겨보세요!'}</p>
      )}

      <ul style={listStyle} aria-label="댓글 목록">
        {comments.map((comment) => (
          <li key={comment.id} style={commentItemStyle}>
            <div style={commentHeaderStyle}>
              <img
                src={comment.author.avatarUrl}
                alt={`${comment.author.login} 아바타`}
                style={avatarStyle}
              />
              <span style={authorNameStyle}>{comment.author.login}</span>
              <time style={timeStyle} dateTime={comment.createdAt}>
                {formatDate(comment.createdAt)}
              </time>
            </div>
            <p style={commentBodyStyle}>{comment.body}</p>
          </li>
        ))}
      </ul>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} style={formStyle}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder || '댓글을 입력하세요...'}
            style={textareaStyle}
            rows={3}
            disabled={isAddingComment}
            aria-label="댓글 입력"
          />
          <button
            type="submit"
            disabled={!body.trim() || isAddingComment}
            style={{
              ...submitButtonStyle,
              opacity: !body.trim() || isAddingComment ? 0.6 : 1,
              cursor: !body.trim() || isAddingComment ? 'not-allowed' : 'pointer',
            }}
          >
            {isAddingComment ? '등록 중...' : '댓글 등록'}
          </button>
        </form>
      ) : (
        <p style={loginHintStyle}>댓글을 작성하려면 로그인이 필요합니다.</p>
      )}
    </section>
  );
}

// ─── Inline Styles ───────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  marginTop: '2rem',
  padding: '1.5rem',
  backgroundColor: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginTop: 0,
  marginBottom: '1rem',
  color: 'var(--color-text, #1f2937)',
};

const loadingStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary, #6b7280)',
  textAlign: 'center',
  padding: '1rem 0',
};

const errorStyle: React.CSSProperties = {
  color: 'var(--color-error, #ef4444)',
  textAlign: 'center',
  padding: '1rem 0',
};

const emptyStyle: React.CSSProperties = {
  color: 'var(--color-text-tertiary, #9ca3af)',
  textAlign: 'center',
  padding: '1.5rem 0',
  fontStyle: 'italic',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const commentItemStyle: React.CSSProperties = {
  padding: '1rem 0',
  borderBottom: '1px solid var(--color-border, #e5e7eb)',
};

const commentHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const avatarStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  objectFit: 'cover',
};

const authorNameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--color-text, #1f2937)',
};

const timeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-tertiary, #9ca3af)',
  marginLeft: 'auto',
};

const commentBodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-text, #374151)',
  whiteSpace: 'pre-wrap',
};

const formStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border, #d1d5db)',
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  resize: 'vertical',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const submitButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  padding: '0.5rem 1.25rem',
  backgroundColor: 'var(--color-primary, #3b82f6)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'opacity 0.15s',
};

const loginHintStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--color-primary-light, #eff6ff)',
  borderRadius: '8px',
  color: 'var(--color-text-secondary, #6b7280)',
  fontSize: '0.875rem',
  textAlign: 'center',
};
