import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface AuthViewProps {
  onLoginSuccess?: () => void;
}

export function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  return (
    <>
      <AuthLayout mode={mode}>
        {mode === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onForgotPassword={() => setIsForgotOpen(true)}
            onLoginSuccess={onLoginSuccess}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setMode('login')}
            onRegisterSuccess={onLoginSuccess}
          />
        )}
      </AuthLayout>

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </>
  );
}