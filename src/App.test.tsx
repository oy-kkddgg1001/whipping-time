import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

function renderWithRouter(initialRoute = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('App Routing', () => {
  it('renders home page at /', () => {
    renderWithRouter('/')
    // HomePage shows loading state while fetching chapters
    expect(screen.getByText('챕터 목록을 불러오는 중...')).toBeInTheDocument()
  })

  it('renders chapter page at /chapters/:id', () => {
    renderWithRouter('/chapters/1')
    // ChapterPage shows loading state while fetching topics
    expect(screen.getByText('주제 목록을 불러오는 중...')).toBeInTheDocument()
  })

  it('renders topic page at /topics/:id', () => {
    renderWithRouter('/topics/42')
    // TopicPage shows loading state while fetching topic detail
    expect(screen.getByText('주제 정보를 불러오는 중...')).toBeInTheDocument()
  })

  it('renders new topic page at /chapters/:id/new', () => {
    renderWithRouter('/chapters/3/new')
    // NewTopicPage is wrapped in AuthGuard — unauthenticated shows login prompt
    expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
  })

  it('renders auth callback page at /auth/callback', () => {
    renderWithRouter('/auth/callback')
    // Without a code param, shows error state
    expect(screen.getByText('인증 실패')).toBeInTheDocument()
  })

  it('renders 404 page for unknown routes', () => {
    renderWithRouter('/unknown-path')
    expect(screen.getByText('404 - 페이지를 찾을 수 없습니다')).toBeInTheDocument()
  })
})
