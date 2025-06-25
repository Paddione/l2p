import React, { useState } from 'react';
import { Modal } from '../ui';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleSwitchToLogin = () => setMode('login');
  const handleSwitchToRegister = () => setMode('register');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="small"
      showCloseButton={false}
    >
      {mode === 'login' ? (
        <LoginForm
          onSwitchToRegister={handleSwitchToRegister}
          onSuccess={handleSuccess}
        />
      ) : (
        <RegisterForm
          onSwitchToLogin={handleSwitchToLogin}
          onSuccess={handleSuccess}
        />
      )}
    </Modal>
  );
};

export default AuthModal; 