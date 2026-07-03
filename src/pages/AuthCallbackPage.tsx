import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, OAUTH_PROXY } from '../contexts/AuthContext';

const RETURN_PATH_KEY = 'whipping_time_return_path';

function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const { setAuthData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setErrorMessage('인증 코드가 없습니다.');
      return;
    }

    const exchangeToken = async () => {
      try {
        // 프록시로 token 교환
        const tokenRes = await fetch(OAUTH_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!tokenRes.ok) throw new Error('토큰 교환에 실패했습니다.');

        const tokenData = await tokenRes.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }

        const accessToken = tokenData.access_token;

        if (!accessToken) throw new Error('액세스 토큰을 받지 못했습니다.');

        // 유저 정보 가져오기
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userRes.ok) throw new Error('사용자 정보를 가져오는데 실패했습니다.');

        const userData = await userRes.json();
        setAuthData(accessToken, {
          login: userData.login,
          avatarUrl: userData.avatar_url,
          id: userData.node_id,
        });

        const returnPath = sessionStorage.getItem(RETURN_PATH_KEY) || '/';
        sessionStorage.removeItem(RETURN_PATH_KEY);
        navigate(returnPath, { replace: true });
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '인증 처리 중 오류 발생');
      }
    };

    exchangeToken();
  }, [setAuthData, navigate, searchParams]);

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '0.5rem' }}>인증 실패</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{errorMessage}</p>
          <a href="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1e293b', color: '#fff', borderRadius: '9999px', textDecoration: 'none', fontWeight: 500 }}>
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>로그인 중...</h1>
        <p style={{ color: '#666' }}>GitHub 인증을 완료하고 있습니다.</p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
