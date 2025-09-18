import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { SignInForm } from './components/SignInForm';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
        // Clear stale session data if JWT is invalid
        await supabase.auth.signOut();
        setUser(null);
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
    console.log('🚪 User signed out');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="Zpchandrapurlogo.png" 
                alt="ZP Chandrapur Logo" 
                className="h-16 w-16 object-contain"
              />
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;