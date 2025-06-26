import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: { username: string; password: string; character: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token && !user) {
      getCurrentUser().catch(() => {
        // Silent fail - token might be expired
        console.warn('Failed to get current user on init');
      });
    }
  }, [getCurrentUser, user]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 