import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  width: 100%;
`;

const NotificationItem = styled.div<{ type: Notification['type']; isLeaving?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border-left: 4px solid ${({ theme, type }) => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.primary;
    }
  }};
  animation: ${({ isLeaving }) => isLeaving ? slideOut : slideIn} 0.3s ease-in-out;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
`;

const NotificationTitle = styled.h4`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
`;

const NotificationMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
  line-height: 1;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setLeavingIds(prev => new Set(prev).add(id));
    
    // Remove after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setLeavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showNotification({ type: 'success', title, message });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string) => {
    showNotification({ type: 'error', title, message, duration: 7000 });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    showNotification({ type: 'warning', title, message });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            isLeaving={leavingIds.has(notification.id)}
          >
            <NotificationHeader>
              <NotificationTitle>{notification.title}</NotificationTitle>
              <CloseButton onClick={() => hideNotification(notification.id)}>
                ×
              </CloseButton>
            </NotificationHeader>
            {notification.message && (
              <NotificationMessage>{notification.message}</NotificationMessage>
            )}
          </NotificationItem>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
} 