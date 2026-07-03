import { useAuth } from '../contexts/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      style={styles.button}
      aria-label="로그아웃"
    >
      로그아웃
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.375rem 0.875rem',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default LogoutButton;
