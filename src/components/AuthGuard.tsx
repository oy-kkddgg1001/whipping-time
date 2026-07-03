import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from './LoginButton';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 인증 가드 컴포넌트.
 *
 * - 인증된 사용자: children 렌더링
 * - 로딩 중: 로딩 상태 표시
 * - 비인증 사용자: fallback 또는 기본 로그인 안내 UI 표시
 *
 * Requirements: 10.2, 10.3
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-label="인증 상태 확인 중">
        인증 상태를 확인하고 있습니다...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={styles.container}>
        <h2 className={styles.message}>로그인이 필요합니다</h2>
        <p className={styles.description}>
          이 기능을 사용하려면 GitHub 계정으로 로그인해 주세요.
        </p>
        <LoginButton />
      </div>
    );
  }

  return <>{children}</>;
}
