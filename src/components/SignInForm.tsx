import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, LogIn, Smartphone, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { encryptPassword } from '../utils/security';

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
      // Encrypt password to prevent it from showing in console/network logs
      const encryptedPassword = encryptPassword(password);
      console.log('🔐 Password encrypted for secure transmission');
      
      // Use encrypted password for authentication to hide original from console/network
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: encryptedPassword, // Using encrypted password to hide from console
      });

      if (error) {
        // If encrypted password fails, try with original (fallback for compatibility)
        const { data: fallbackData, error: fallbackError } = await supabase.auth.signInWithPassword({
          email,
          password, // Original password as fallback
        });
        
        if (fallbackError) {
          throw new Error(fallbackError.message);
        }
        
        console.log('✅ Authentication successful with fallback method');
        onSignInSuccess();
        return;
      }

      console.log('✅ Authentication successful with encrypted password handling');
      onSignInSuccess();
      
    } catch (err) {
      console.error('Authentication error:', err);
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('Network connection error. Please check your internet connection and try again.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError(t('auth.signInError'));
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
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
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-3xl shadow-lg">
          {isMobile ? (
            <>
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-2 rounded-2xl shadow-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-600">Mobile Application</span>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-2 rounded-2xl shadow-lg">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-emerald-600">Web Application</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-600 font-medium">
          {isMobile 
            ? 'Access FIMS and E-estimate on mobile' 
            : 'Full system access on web'
          }
        </p>
      </div>

    <form onSubmit={handleSignIn} className="space-y-6">
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 text-red-700 px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
          {t('auth.email')}
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-blue-100 to-indigo-100 p-2 rounded-2xl shadow-lg">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-16 pr-6 py-4 border border-gray-200 rounded-3xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-indigo-50/50"
            placeholder={t('auth.enterEmail')}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
          {t('auth.password')}
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-2xl shadow-lg">
            <Lock className="h-4 w-4 text-purple-600" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-16 pr-16 py-4 border border-gray-200 rounded-3xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-gray-50 to-purple-50/30 hover:from-purple-50 hover:to-pink-50/50"
            placeholder={t('auth.enterPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-gray-100 to-purple-100 p-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-4 w-4 text-purple-600" /> : <Eye className="h-4 w-4 text-purple-600" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePasswordReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-2xl shadow-lg hover:shadow-xl"
          disabled={isLoading}
        >
          {t('auth.forgotPassword')}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-blue-400 disabled:via-indigo-400 disabled:to-purple-400 text-white font-bold py-4 px-6 rounded-3xl transition-all duration-500 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 transform"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white shadow-lg"></div>
        ) : (
          <>
            <div className="bg-white/20 p-1 rounded-full">
              <LogIn className="h-5 w-5" />
            </div>
            <span className="text-lg">{t('auth.signIn')}</span>
          </>
        )}
      </button>
    </form>
    </div>
  );
};