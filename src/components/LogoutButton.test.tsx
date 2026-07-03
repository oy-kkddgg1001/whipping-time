import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogoutButton from './LogoutButton';

const mockLogout = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('"로그아웃" 텍스트로 렌더링된다', () => {
    render(<LogoutButton />);

    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  it('클릭 시 logout()을 호출한다', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /로그아웃/ }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
