import { useLeaderboard, type LeaderboardUser } from '../hooks/useLeaderboard';
import styles from './LeaderboardPage.module.css';

const MEDALS = ['🥇', '🥈', '🥉'] as const;

interface RankListProps {
  users: LeaderboardUser[];
  unit: string;
}

function RankList({ users, unit }: RankListProps) {
  if (users.length === 0) {
    return <p className={styles.emptyMessage}>아직 데이터가 없습니다.</p>;
  }

  return (
    <ol className={styles.rankList}>
      {users.slice(0, 10).map((user, index) => {
        const isGold = index === 0;
        const isSilver = index === 1;
        const isBronze = index === 2;

        let itemClass = styles.rankItem;
        if (isGold) itemClass += ` ${styles.rankGold}`;
        else if (isSilver) itemClass += ` ${styles.rankSilver}`;
        else if (isBronze) itemClass += ` ${styles.rankBronze}`;

        return (
          <li key={user.login} className={itemClass}>
            {index < 3 ? (
              <span className={styles.rankMedal} aria-label={`${index + 1}위`}>
                {MEDALS[index]}
              </span>
            ) : (
              <span className={styles.rankNumber}>{index + 1}</span>
            )}
            <img
              src={user.avatarUrl}
              alt={`${user.login} 아바타`}
              className={`${styles.avatar}${isGold ? ` ${styles.avatarGold}` : ''}`}
            />
            <span className={styles.username}>{user.login}</span>
            <span className={`${styles.score}${isGold ? ` ${styles.scoreGold}` : ''}`}>
              {user.score} {unit}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function LeaderboardPage() {
  const { data, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>리더보드 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>데이터를 불러오는 데 실패했습니다.</p>
        <p>{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>🏅 명예의 전당</h1>

      <div className={styles.categories}>
        <section className={styles.categoryCard}>
          <h2 className={styles.categoryHeader}>🏆 따봉왕</h2>
          <RankList users={data.thumbsUpKing} unit="따봉" />
        </section>

        <section className={styles.categoryCard}>
          <h2 className={styles.categoryHeader}>💬 수다왕</h2>
          <RankList users={data.commentKing} unit="댓글" />
        </section>

        <section className={styles.categoryCard}>
          <h2 className={styles.categoryHeader}>✍️ 아이디어왕</h2>
          <RankList users={data.ideaKing} unit="토픽" />
        </section>
      </div>
    </div>
  );
}

export default LeaderboardPage;
