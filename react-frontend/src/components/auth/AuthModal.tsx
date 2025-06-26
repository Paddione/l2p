import React, { useState } from 'react';
import { Modal } from '../ui';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="small"
      showCloseButton={false}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => setMode('login')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: mode === 'login' ? '#007bff' : 'transparent',
            color: mode === 'login' ? 'white' : '#007bff',
            cursor: 'pointer',
            borderRadius: '4px 0 0 4px',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setMode('register')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: mode === 'register' ? '#007bff' : 'transparent',
            color: mode === 'register' ? 'white' : '#007bff',
            cursor: 'pointer',
            borderRadius: '0 4px 4px 0',
          }}
        >
          Register
        </button>
      </div>
      {mode === 'login' ? (
        <LoginForm onSuccess={handleSuccess} />
      ) : (
        <RegisterForm onSuccess={handleSuccess} />
      )}
    </Modal>
  );
};

export default AuthModal; 