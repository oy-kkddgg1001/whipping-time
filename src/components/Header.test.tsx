import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { toHaveNoViolations } from 'vitest-axe/matchers';
import Header from './Header';

expect.extend({ toHaveNoViolations });

const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('"Whipping Time" 타이틀을 렌더링한다', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHeader();

    expect(screen.getByText('Whipping Time')).toBeInTheDocument();
  });

  it('비로그인 상태에서 LoginButton을 표시한다', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
    });

    renderHeader();

    expect(screen.getByRole('button', { name: /GitHub로 로그인/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /로그아웃/ })).not.toBeInTheDocument();
  });

  it('로그인 상태에서 아바타, 사용자 이름, LogoutButton을 표시한다', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        login: 'testuser',
        avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
        id: 'U_12345',
      },
      logout: vi.fn(),
    });

    renderHeader();

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByAltText('testuser 아바타')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그아웃/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /GitHub로 로그인/ })).not.toBeInTheDocument();
  });

  it('접근성 위반이 없어야 한다', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        login: 'testuser',
        avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
        id: 'U_12345',
      },
      logout: vi.fn(),
    });

    const { container } = renderHeader();
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
