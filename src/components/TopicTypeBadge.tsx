import type { TopicType } from '../types';
import styles from './TopicTypeBadge.module.css';

interface TopicTypeBadgeProps {
  type: TopicType;
}

const typeStyleMap: Record<TopicType, string> = {
  '고민상담': styles.consult,
  '떠먹여 드림': styles.feed,
  '떠먹여 주세요': styles.request,
};

function TopicTypeBadge({ type }: TopicTypeBadgeProps) {
  return (
    <span className={`${styles.badge} ${typeStyleMap[type]}`} aria-label={`주제 유형: ${type}`}>
      {type}
    </span>
  );
}

export default TopicTypeBadge;
