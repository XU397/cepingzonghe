import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../LoginPage';
import { loginUser } from '../../shared/services/apiService';

vi.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    handleLoginSuccess: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../shared/services/apiService', () => ({
  loginUser: vi.fn(),
}));

vi.mock('../../shared/services/loginPageConfig', () => {
  const defaultMockConfig = {
    logo: { displayType: 'image', position: 'top_left' },
    title: { highlightText: 'TestHighlight', mainText: 'TestMain', subtitleText: 'TestSubtitle' },
    loginBoxTitle: 'Test Login Title',
    password: { hidden: false, defaultPasswordPolicy: 'fixed_1234' },
  };
  let mockConfig = JSON.parse(JSON.stringify(defaultMockConfig));
  return {
    useLoginPageConfig: () => mockConfig,
    __setMockConfig: (c) => { mockConfig = c; },
    __resetMockConfig: () => { mockConfig = JSON.parse(JSON.stringify(defaultMockConfig)); },
  };
});

describe('LoginPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    const mod = await import('../../shared/services/loginPageConfig');
    mod.__resetMockConfig();
  });

  it('renders highlight text in span with login-product-highlight class', () => {
    render(<LoginPage />);
    const highlight = screen.getByText('TestHighlight');
    expect(highlight).toHaveClass('login-product-highlight');
  });

  it('renders main text in h1', () => {
    render(<LoginPage />);
    expect(screen.getByText('TestMain')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<LoginPage />);
    expect(screen.getByText('TestSubtitle')).toBeInTheDocument();
  });

  it('renders loginBoxTitle from config', () => {
    render(<LoginPage />);
    expect(screen.getByText('Test Login Title')).toBeInTheDocument();
  });

  it('shows password field when config says hidden is false', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
  });

  it('renders image logo by default', () => {
    render(<LoginPage />);
    const logo = document.querySelector('.login-header-logo');
    expect(logo).toBeInTheDocument();
  });

  it('hides password field when config says hidden', async () => {
    const mod = await import('../../shared/services/loginPageConfig');
    mod.__setMockConfig({
      logo: { displayType: 'image', position: 'top_left' },
      title: { highlightText: 'H', mainText: 'M' },
      loginBoxTitle: 'Login',
      password: { hidden: true, defaultPasswordPolicy: 'fixed_1234' },
    });

    render(<LoginPage />);
    expect(screen.queryByPlaceholderText('请输入密码')).not.toBeInTheDocument();
  });

  it('keeps password hidden when VITE_PASSWORD_FREE is enabled even if config shows password', async () => {
    vi.stubEnv('VITE_PASSWORD_FREE', '1');
    loginUser.mockResolvedValue({
      code: 200,
      obj: { studentName: 'Test Student', examNo: 'E001', batchCode: 'B001' },
    });

    render(<LoginPage />);

    expect(screen.queryByPlaceholderText('请输入密码')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('请输入账号'), {
      target: { value: 'abcdefg' },
    });
    fireEvent.click(screen.getByRole('button', { name: /快速登录/ }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({ userId: 'abcdefg', password: '1234' });
    });
  });

  it('does not load a non-whitelisted remote logo URL', async () => {
    const mod = await import('../../shared/services/loginPageConfig');
    mod.__setMockConfig({
      logo: {
        displayType: 'image',
        position: 'top_left',
        imageUrl: 'http://tracker.example/pixel.png',
      },
      title: { highlightText: 'H', mainText: 'M' },
      loginBoxTitle: 'Login',
      password: { hidden: false, defaultPasswordPolicy: 'fixed_1234' },
    });

    render(<LoginPage />);

    const logo = document.querySelector('.login-header-logo');
    expect(logo).toBeInTheDocument();
    expect(logo).not.toHaveAttribute('src', 'http://tracker.example/pixel.png');
    expect(logo).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('renders text logo when displayType is text', async () => {
    const mod = await import('../../shared/services/loginPageConfig');
    mod.__setMockConfig({
      logo: { displayType: 'text', position: 'top_center', text: 'TextLogo' },
      title: { highlightText: 'H', mainText: 'M' },
      loginBoxTitle: 'Login',
      password: { hidden: false, defaultPasswordPolicy: 'fixed_1234' },
    });

    render(<LoginPage />);
    expect(screen.getByText('TextLogo')).toHaveClass('login-logo-text');
  });

  it('does not render subtitle when empty', async () => {
    const mod = await import('../../shared/services/loginPageConfig');
    mod.__setMockConfig({
      logo: { displayType: 'image', position: 'top_left' },
      title: { highlightText: 'H', mainText: 'M', subtitleText: '' },
      loginBoxTitle: 'Login',
      password: { hidden: false, defaultPasswordPolicy: 'fixed_1234' },
    });

    render(<LoginPage />);
    const subtitleEl = document.querySelector('.login-product-subtitle');
    expect(subtitleEl).not.toBeInTheDocument();
  });
});
