import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * PAT(Personal Access Token) 입력 모달.
 * GitHub Pages 환경에서 프록시 서버 없이 인증을 처리합니다.
 */
export function LoginModal() {
  const { showLoginModal, loginWithToken, closeLoginModal, isLoading, error } = useAuth();
  const [tokenInput, setTokenInput] = useState('');

  if (!showLoginModal) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    await loginWithToken(tokenInput.trim());
  };

  const handleClose = () => {
    closeLoginModal();
  };

  return (
    <div style={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="login-modal-title" style={styles.title}>GitHub 로그인</h2>
        <p style={styles.description}>
          GitHub Personal Access Token을 입력하세요.
          <br />
          <a
            href="https://github.com/settings/tokens/new?scopes=public_repo,read:user&description=Whipping+Time"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            여기서 토큰 생성 →
          </a>
        </p>
        <p style={styles.scopeHint}>
          필요 권한: <code>public_repo</code>, <code>read:user</code>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            style={styles.input}
            aria-label="Personal Access Token"
            autoFocus
            disabled={isLoading}
          />
          {error && (
            <p style={styles.error} role="alert">{error.message}</p>
          )}
          <div style={styles.buttons}>
            <button type="button" onClick={handleClose} style={styles.cancelButton} disabled={isLoading}>
              취소
            </button>
            <button type="submit" style={styles.submitButton} disabled={isLoading || !tokenInput.trim()}>
              {isLoading ? '확인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  description: {
    margin: '0 0 0.5rem',
    fontSize: '0.875rem',
    color: '#555',
    lineHeight: 1.5,
  },
  scopeHint: {
    margin: '0 0 1rem',
    fontSize: '0.75rem',
    color: '#888',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    marginBottom: '0.75rem',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.8rem',
    margin: '0 0 0.75rem',
  },
  buttons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  submitButton: {
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#24292e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
};
