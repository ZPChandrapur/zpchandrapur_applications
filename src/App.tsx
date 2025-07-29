import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { SignInForm } from './components/SignInForm';
import { Dashboard } from './components/Dashboard';
import { TestERMSConnection } from './components/TestERMSConnection';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectionTest, setShowConnectionTest] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignInSuccess = () => {
    // User state will be updated by the auth state listener
  };

  const handleSignOut = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onSignOut={handleSignOut} />;
  }

  // Show connection test if requested
  if (showConnectionTest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <button
            onClick={() => setShowConnectionTest(false)}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Sign In
          </button>
          <TestERMSConnection />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 text-sm">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Sign In Form */}
          <SignInForm onSignInSuccess={handleSignInSuccess} />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              {t('auth.secureAccess', 'Secure access to integrated government applications')}
            </p>
            <button
              onClick={() => setShowConnectionTest(true)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Test Database Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;