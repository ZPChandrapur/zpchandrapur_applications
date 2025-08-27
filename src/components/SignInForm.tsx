import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, LogIn, Smartphone, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SignInFormProps {
  onSignInSuccess: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSignInSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Application configuration error. Please contact your administrator.');
      return;
    }

    // Basic validation
    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Failed to fetch')) {
          setError('Unable to connect to authentication server. Please check your internet connection and try again.');
        } else {
          setError(signInError.message);
        }
      } else if (data.user) {
        onSignInSuccess();
      }
    } catch (err) {
      if (err.message && err.message.includes('Failed to fetch')) {
        setError('Network connection error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <Mail className="h-16 w-16 text-teal-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('auth.checkEmail')}</h3>
          <p className="text-gray-600 mb-4">
            {t('auth.resetEmailMessage')} <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            {t('auth.didntReceiveEmail', "Didn't receive the email? Check your spam folder or try again.")}
          </p>
        </div>
        <button
          onClick={() => setResetEmailSent(false)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('auth.backToSignIn')}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Platform Indicator */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {isMobile ? (
            <>
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Mobile Application</span>
            </>
          ) : (
            <>
              <Globe className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Web Application</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {isMobile 
            ? 'Access FIMS and E-estimate on mobile' 
            : 'Full system access on web'
          }
        </p>
      </div>

    <form onSubmit={handleSignIn} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          {t('auth.email')}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder={t('auth.enterEmail')}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          {t('auth.password')}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder={t('auth.enterPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePasswordReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          disabled={isLoading}
        >
          {t('auth.forgotPassword')}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            <span>{t('auth.signIn')}</span>
          </>
        )}
      </button>
    </form>
    </div>
  );
};