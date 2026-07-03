import { graphql, HttpResponse } from 'msw'

// Mock data for GitHub GraphQL API responses
export const mockDiscussionNodes = [
  {
    id: 'D_kwDOTest1',
    title: 'React Server Components 실무 적용기',
    body: '<!-- metadata:{"type":"고민상담","isAnonymous":false,"assignee":"","reason":"관련 경험 공유"} -->\n\nReact Server Components를 실무에 적용한 경험을 공유합니다.',
    createdAt: '2024-01-15T09:00:00Z',
    author: { login: 'user1', avatarUrl: 'https://avatars.githubusercontent.com/u/1' },
    labels: { nodes: [{ name: '고민상담' }] },
    reactions: { totalCount: 5 },
    viewerHasReacted: false,
  },
  {
    id: 'D_kwDOTest2',
    title: 'TypeScript 5.0 새 기능 정리',
    body: '<!-- metadata:{"type":"떠먹여 드림","isAnonymous":true,"assignee":"","reason":""} -->\n\nTypeScript 5.0의 주요 변경사항을 정리합니다.',
    createdAt: '2024-01-14T10:00:00Z',
    author: { login: 'user2', avatarUrl: 'https://avatars.githubusercontent.com/u/2' },
    labels: { nodes: [{ name: '떠먹여 드림' }] },
    reactions: { totalCount: 3 },
    viewerHasReacted: true,
  },
  {
    id: 'D_kwDOTest3',
    title: 'Vite 빌드 최적화 방법 알려주세요',
    body: '<!-- metadata:{"type":"떠먹여 주세요","isAnonymous":false,"assignee":"user1","reason":"빌드 시간이 너무 오래 걸립니다"} -->\n\nVite 빌드 최적화에 대해 알고 싶습니다.',
    createdAt: '2024-01-13T11:00:00Z',
    author: { login: 'user3', avatarUrl: 'https://avatars.githubusercontent.com/u/3' },
    labels: { nodes: [{ name: '떠먹여 주세요' }] },
    reactions: { totalCount: 1 },
    viewerHasReacted: false,
  },
]

// Mock nodes with category info for SearchDiscussions
const mockDiscussionNodesWithCategory = mockDiscussionNodes.map((node) => ({
  ...node,
  category: { id: 'CAT_chapter1' },
}))

export const handlers = [
  // GetDiscussions query
  graphql.query('GetDiscussions', () => {
    return HttpResponse.json({
      data: {
        repository: {
          discussions: {
            nodes: mockDiscussionNodes,
          },
        },
      },
    })
  }),

  // SearchDiscussions query (used by useTopicDetail)
  graphql.query('SearchDiscussions', () => {
    return HttpResponse.json({
      data: {
        repository: {
          discussions: {
            nodes: mockDiscussionNodesWithCategory,
          },
        },
      },
    })
  }),

  // CreateDiscussion mutation
  graphql.mutation('CreateDiscussion', ({ variables }) => {
    const { title, body } = variables as { title: string; body: string }
    const newDiscussion = {
      id: `D_kwDONew_${Date.now()}`,
      title,
      body,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json({
      data: {
        createDiscussion: {
          discussion: newDiscussion,
        },
      },
    })
  }),

  // AddReaction mutation
  graphql.mutation('AddReaction', ({ variables }) => {
    const { subjectId } = variables as { subjectId: string }
    return HttpResponse.json({
      data: {
        addReaction: {
          reaction: { id: `R_new_${Date.now()}` },
          subject: {
            id: subjectId,
            reactions: { totalCount: 6 },
          },
        },
      },
    })
  }),

  // RemoveReaction mutation
  graphql.mutation('RemoveReaction', ({ variables }) => {
    const { subjectId } = variables as { subjectId: string }
    return HttpResponse.json({
      data: {
        removeReaction: {
          subject: {
            id: subjectId,
            reactions: { totalCount: 5 },
          },
        },
      },
    })
  }),
]
