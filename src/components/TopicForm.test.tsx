import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { TopicForm } from './TopicForm';

describe('TopicForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  function renderForm(hasActiveChapter = true) {
    return render(
      <TopicForm onSubmit={mockOnSubmit} hasActiveChapter={hasActiveChapter} />,
    );
  }

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('필수 필드(타이틀, 유형 라디오 버튼)를 렌더링한다', () => {
    renderForm();

    expect(screen.getByLabelText(/타이틀/)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByLabelText('고민상담')).toBeInTheDocument();
    expect(screen.getByLabelText('떠먹여 드림')).toBeInTheDocument();
    expect(screen.getByLabelText('떠먹여 주세요')).toBeInTheDocument();
  });

  it('타이틀 없이 제출하면 유효성 검증 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderForm();

    // Select a type but leave title empty
    await user.click(screen.getByLabelText('고민상담'));
    await user.click(screen.getByRole('button', { name: '주제 등록' }));

    const errors = await screen.findAllByText(/제목은 필수입니다/);
    expect(errors.length).toBeGreaterThan(0);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('유형 미선택 시 제출하면 유효성 검증 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderForm();

    // Fill title but don't select type
    await user.type(screen.getByLabelText(/타이틀/), '테스트 주제');
    await user.click(screen.getByRole('button', { name: '주제 등록' }));

    const errors = await screen.findAllByText(/유효한 주제 유형을 선택해야 합니다/);
    expect(errors.length).toBeGreaterThan(0);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('유형이 "떠먹여 주세요"가 아닐 때 Assignee 필드를 숨긴다', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByLabelText('고민상담'));

    expect(screen.queryByLabelText(/지목 대상/)).not.toBeInTheDocument();
  });

  it('유형이 "떠먹여 주세요"일 때 Assignee 필드를 표시한다', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByLabelText('떠먹여 주세요'));

    expect(screen.getByLabelText(/지목 대상/)).toBeInTheDocument();
  });

  it('"떠먹여 주세요" 유형에서 assignee 없이 제출하면 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/타이틀/), '테스트 주제');
    await user.click(screen.getByLabelText('떠먹여 주세요'));
    await user.click(screen.getByRole('button', { name: '주제 등록' }));

    const errors = await screen.findAllByText(/지목 대상은 필수입니다/);
    expect(errors.length).toBeGreaterThan(0);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('"익명으로 표시" 체크박스가 기본적으로 해제되어 있다', () => {
    renderForm();

    const checkbox = screen.getByLabelText('익명으로 표시');
    expect(checkbox).not.toBeChecked();
  });

  it('"익명으로 표시" 체크박스를 체크할 수 있다', async () => {
    const user = userEvent.setup();
    renderForm();

    const checkbox = screen.getByLabelText('익명으로 표시');
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('제출 성공 시 폼을 초기화하고 성공 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    renderForm();

    // Fill the form
    await user.type(screen.getByLabelText(/타이틀/), '성공 테스트 주제');
    await user.click(screen.getByLabelText('고민상담'));
    await user.click(screen.getByRole('button', { name: '주제 등록' }));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('주제가 등록되었습니다')).toBeInTheDocument();
    });

    // Form should be reset
    expect(screen.getByLabelText(/타이틀/)).toHaveValue('');
    expect(screen.getByLabelText('고민상담')).not.toBeChecked();
    expect(screen.getByLabelText('떠먹여 드림')).not.toBeChecked();
    expect(screen.getByLabelText('떠먹여 주세요')).not.toBeChecked();
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('hasActiveChapter=false일 때 제출 버튼이 비활성화된다', () => {
    renderForm(false);

    const submitButton = screen.getByRole('button', { name: '주제 등록' });
    expect(submitButton).toBeDisabled();
  });

  it('활성 챕터가 없을 때 경고 메시지를 표시한다', () => {
    renderForm(false);

    expect(
      screen.getByText('활성 챕터가 없어 주제를 등록할 수 없습니다'),
    ).toBeInTheDocument();
  });

  it('접근성 위반이 없다', async () => {
    const { container } = renderForm();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
