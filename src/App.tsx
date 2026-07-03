import { Routes, Route, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ChapterPage from './pages/ChapterPage'
import TopicPage from './pages/TopicPage'
import NewTopicPage from './pages/NewTopicPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import NotFoundPage from './pages/NotFoundPage'

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/chapters/:id" element={<ChapterPage />} />
        <Route path="/topics/:id" element={<TopicPage />} />
        <Route path="/chapters/:id/new" element={<NewTopicPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
