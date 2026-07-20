import { describe, it, expect } from 'vitest';
import { discussionToTopic, type GitHubDiscussion } from './discussion-mapper';

function makeDiscussion(labelNames: string[]): GitHubDiscussion {
  return {
    id: 'D_1',
    title: '제목',
    body: '<!-- metadata:{"type":"고민상담","isAnonymous":false,"assignee":"","reason":""} -->\n\n설명',
    createdAt: '2024-01-01T00:00:00Z',
    author: { login: 'user1', avatarUrl: '' },
    labels: { nodes: labelNames.map((name) => ({ name })) },
    reactions: { totalCount: 0, viewerHasReacted: false },
  };
}

describe('discussionToTopic - status 추출', () => {
  it('상태 라벨이 없으면 status는 undefined다', () => {
    const topic = discussionToTopic(makeDiscussion(['고민상담']), 'ch-1');
    expect(topic.status).toBeUndefined();
  });

  it('"선정완료" 라벨이 있으면 status는 "선정완료"다', () => {
    const topic = discussionToTopic(makeDiscussion(['고민상담', '선정완료']), 'ch-1');
    expect(topic.status).toBe('선정완료');
  });

  it('"선정완료"와 "해결완료"가 동시에 있으면 뒷 단계인 "해결완료"가 우선한다', () => {
    const topic = discussionToTopic(makeDiscussion(['선정완료', '해결완료']), 'ch-1');
    expect(topic.status).toBe('해결완료');
  });
});
