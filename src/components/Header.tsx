import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import styles from './Header.module.css';

function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link to="/" className={styles.title} aria-label="Whipping Time 홈으로 이동">
          Whipping Time
        </Link>

        <nav className={styles.nav} aria-label="사용자 메뉴">
          <Link to="/leaderboard" className={styles.navLink} aria-label="명예의 전당">
            🏅 명예의 전당
          </Link>
          {isAuthenticated && user ? (
            <>
              <div className={styles.userInfo}>
                <img
                  src={user.avatarUrl}
                  alt={`${user.login} 아바타`}
                  className={styles.avatar}
                />
                <span className={styles.userName}>{user.login}</span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <LoginButton />
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
