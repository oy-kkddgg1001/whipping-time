import { useParams, useNavigate } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';
import { TopicForm } from '../components/TopicForm';
import { useTopics } from '../hooks/useTopics';
import { useChapters } from '../hooks/useChapters';
import type { TopicFormData } from '../types';

/**
 * 새 주제 등록 페이지.
 */
function NewTopicPage() {
  const { id: chapterId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createTopic } = useTopics(chapterId || '');
  const { activeChapter } = useChapters();

  const handleSubmit = async (data: TopicFormData): Promise<void> => {
    await createTopic(data);
    navigate(`/chapters/${chapterId}`);
  };

  return (
    <AuthGuard>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          ✏️ 새 주제 등록
        </h1>
        <TopicForm
          onSubmit={handleSubmit}
          hasActiveChapter={activeChapter !== null}
        />
      </div>
    </AuthGuard>
  );
}

export default NewTopicPage;
