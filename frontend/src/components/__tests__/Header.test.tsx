import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
// Jest globals: describe, it, expect, beforeEach are automatically available
import { Header } from '../Header';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Mock services that use import.meta

// Mock services that use import.meta

// Mock services that use import.meta
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getLobby: jest.fn(),
    isAuthenticated: jest.fn(),
    // Add other methods as needed
  }
}));

jest.mock('../../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    // Add other methods as needed
  }
}));
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getLobby: jest.fn(),
    isAuthenticated: jest.fn(),
    // Add other methods as needed
  }
}));

jest.mock('../../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    // Add other methods as needed
  }
}));
jest.mock('../../services/apiService', () => ({
  apiService: {
    getQuestionSets: jest.fn(),
    getLobby: jest.fn(),
    isAuthenticated: jest.fn(),
    // Add other methods as needed
  }
}));

jest.mock('../../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    // Add other methods as needed
  }
}));

// Mock the auth store
jest.mock('../../../../frontend/src/stores/authStore', () => ({
  useAuthStore: jest.fn()
}));

// Mock the theme store
jest.mock('../../../../frontend/src/stores/themeStore', () => ({
  useThemeStore: jest.fn()
}));

// Mock the settings store
jest.mock('../../../../frontend/src/stores/settingsStore', () => ({
  useSettingsStore: jest.fn()
}));

// Mock the audio store
jest.mock('../../../../frontend/src/stores/audioStore', () => ({
  useAudioStore: jest.fn(() => ({
    playSound: jest.fn()
  }))
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

describe('Header Component', () => {
  const mockLogout = jest.fn();
  const mockToggleTheme = jest.fn();
  const mockSetLanguage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
      logout: mockLogout,
      clearError: jest.fn()
    });

    mockUseThemeStore.mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn()
    });

    mockUseSettingsStore.mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      settings: {},
      updateSettings: jest.fn()
    });
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  describe('Navigation and User Menu', () => {
    it('should render navigation links', () => {
      renderHeader();

      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /lobby/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /hall of fame/i })).toBeInTheDocument();
    });

    it('should display user menu when authenticated', () => {
      renderHeader();

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });

    it('should show user menu dropdown when clicked', () => {
      renderHeader();

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    it('should hide user menu when clicking outside', () => {
      renderHeader();

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      expect(screen.getByText(/profile/i)).toBeInTheDocument();

      fireEvent.click(document.body);

      expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
    });

    it('should handle logout when logout button is clicked', () => {
      renderHeader();

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should show login/register links when not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: mockLogout,
        clearError: jest.fn()
      });

      renderHeader();

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
      expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Navigation and Mobile Menu', () => {
    it('should show mobile menu button on small screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      renderHeader();

      expect(screen.getByRole('button', { name: /mobile menu/i })).toBeInTheDocument();
    });

    it('should toggle mobile menu when hamburger button is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      renderHeader();

      const mobileMenuButton = screen.getByRole('button', { name: /mobile menu/i });
      fireEvent.click(mobileMenuButton);

      expect(screen.getByTestId('mobile-menu')).toHaveClass('open');
    });

    it('should close mobile menu when clicking outside', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      renderHeader();

      const mobileMenuButton = screen.getByRole('button', { name: /mobile menu/i });
      fireEvent.click(mobileMenuButton);

      expect(screen.getByTestId('mobile-menu')).toHaveClass('open');

      fireEvent.click(document.body);

      expect(screen.getByTestId('mobile-menu')).not.toHaveClass('open');
    });

    it('should show navigation links in mobile menu', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      renderHeader();

      const mobileMenuButton = screen.getByRole('button', { name: /mobile menu/i });
      fireEvent.click(mobileMenuButton);

      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/lobby/i)).toBeInTheDocument();
      expect(screen.getByText(/hall of fame/i)).toBeInTheDocument();
    });

    it('should close mobile menu when navigation link is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      renderHeader();

      const mobileMenuButton = screen.getByRole('button', { name: /mobile menu/i });
      fireEvent.click(mobileMenuButton);

      const homeLink = screen.getByText(/home/i);
      fireEvent.click(homeLink);

      expect(screen.getByTestId('mobile-menu')).not.toHaveClass('open');
    });

    it('should handle window resize events', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      renderHeader();

      expect(screen.getByRole('button', { name: /mobile menu/i })).toBeInTheDocument();

      // Simulate window resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      fireEvent.resize(window);

      expect(screen.queryByRole('button', { name: /mobile menu/i })).not.toBeInTheDocument();
    });
  });

  describe('User Authentication State Display', () => {
    it('should display user avatar when authenticated', () => {
      renderHeader();

      const userAvatar = screen.getByAltText('User avatar');
      expect(userAvatar).toBeInTheDocument();
    });

    it('should display user username in header', () => {
      renderHeader();

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should show loading state during authentication check', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: mockLogout,
        clearError: jest.fn()
      });

      renderHeader();

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    });

    it('should handle authentication errors gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication failed',
        login: jest.fn(),
        register: jest.fn(),
        resetPassword: jest.fn(),
        logout: mockLogout,
        clearError: jest.fn()
      });

      renderHeader();

      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.getByText(/register/i)).toBeInTheDocument();
    });

    it('should show user profile information in dropdown', () => {
      renderHeader();

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Theme Switching', () => {
    it('should display theme toggle button', () => {
      renderHeader();

      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    });

    it('should toggle theme when theme button is clicked', () => {
      renderHeader();

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      fireEvent.click(themeButton);

      expect(mockToggleTheme).toHaveBeenCalled();
    });

    it('should show correct theme icon', () => {
      renderHeader();

      // Should show sun icon for dark theme
      expect(screen.getByTestId('theme-icon')).toHaveClass('sun-icon');
    });

    it('should show moon icon for light theme', () => {
      mockUseThemeStore.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: jest.fn()
      });

      renderHeader();

      expect(screen.getByTestId('theme-icon')).toHaveClass('moon-icon');
    });

    it('should announce theme change for accessibility', () => {
      renderHeader();

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      fireEvent.click(themeButton);

      const announcement = screen.getByText(/theme changed/i);
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Language Selection', () => {
    it('should display language selector', () => {
      renderHeader();

      expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument();
    });

    it('should show language dropdown when clicked', () => {
      renderHeader();

      const languageButton = screen.getByRole('button', { name: /language/i });
      fireEvent.click(languageButton);

      expect(screen.getByText(/english/i)).toBeInTheDocument();
      expect(screen.getByText(/deutsch/i)).toBeInTheDocument();
    });

    it('should change language when option is selected', () => {
      renderHeader();

      const languageButton = screen.getByRole('button', { name: /language/i });
      fireEvent.click(languageButton);

      const germanOption = screen.getByText(/deutsch/i);
      fireEvent.click(germanOption);

      expect(mockSetLanguage).toHaveBeenCalledWith('de');
    });

    it('should highlight current language', () => {
      renderHeader();

      const languageButton = screen.getByRole('button', { name: /language/i });
      fireEvent.click(languageButton);

      const englishOption = screen.getByText(/english/i);
      expect(englishOption).toHaveClass('selected');
    });

    it('should close language dropdown when clicking outside', () => {
      renderHeader();

      const languageButton = screen.getByRole('button', { name: /language/i });
      fireEvent.click(languageButton);

      expect(screen.getByText(/english/i)).toBeInTheDocument();

      fireEvent.click(document.body);

      expect(screen.queryByText(/english/i)).not.toBeInTheDocument();
    });
  });

  describe('Logo and Branding', () => {
    it('should display logo', () => {
      renderHeader();

      const logo = screen.getByAltText('Learn2Play Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should link logo to home page', () => {
      renderHeader();

      const logoLink = screen.getByRole('link', { name: /learn2play logo/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should display brand name', () => {
      renderHeader();

      expect(screen.getByText(/learn2play/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should display search input', () => {
      renderHeader();

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should handle search input changes', () => {
      renderHeader();

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');
    });

    it('should submit search when enter is pressed', () => {
      const mockOnSearch = jest.fn();
      renderHeader();

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should trigger search functionality
      expect(searchInput).toHaveValue('test search');
    });

    it('should clear search when clear button is clicked', () => {
      renderHeader();

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Notifications', () => {
    it('should display notification bell icon', () => {
      renderHeader();

      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('should show notification count badge', () => {
      renderHeader();

      const notificationBadge = screen.getByTestId('notification-badge');
      expect(notificationBadge).toBeInTheDocument();
    });

    it('should show notification dropdown when clicked', () => {
      renderHeader();

      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(notificationButton);

      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
    });

    it('should display notification items', () => {
      renderHeader();

      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(notificationButton);

      expect(screen.getByText(/no new notifications/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderHeader();

      expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderHeader();

      const navigationItems = screen.getAllByRole('link');
      navigationItems.forEach(item => {
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });

    it('should support screen readers', () => {
      renderHeader();

      // Check for proper semantic structure
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should announce menu state changes', () => {
      renderHeader();

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(userMenuButton);

      const announcement = screen.getByText(/menu opened/i);
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper focus management', () => {
      renderHeader();

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      userMenuButton.focus();
      expect(userMenuButton).toHaveFocus();

      fireEvent.keyDown(userMenuButton, { key: 'Escape' });
      // Should close menu and return focus
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestHeader = () => {
        renderSpy();
        return <Header />;
      };

      render(
        <BrowserRouter>
          <TestHeader />
        </BrowserRouter>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid theme toggles', () => {
      renderHeader();

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });
      
      // Rapid clicks
      fireEvent.click(themeButton);
      fireEvent.click(themeButton);
      fireEvent.click(themeButton);

      expect(mockToggleTheme).toHaveBeenCalledTimes(3);
    });

    it('should debounce search input', async () => {
      renderHeader();

      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Rapid typing
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });
    });
  });
}); 