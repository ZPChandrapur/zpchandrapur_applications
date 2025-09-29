import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured, supabaseConfigErrors } from "./lib/supabase";
import { SignInForm } from './SignInForm'; // Ensure your SignInForm accepts props as shown!
import { Dashboard } from './components/Dashboard';
import type { User } from '@supabase/supabase-js';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryTokens, setRecoveryTokens] = useState<{ accessToken: string | null; refreshToken: string | null }>({ accessToken: null, refreshToken: null });

  useEffect(() => {
    const checkForRecovery = () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = params.get('type') || hashParams.get('type');
      const accessToken = params.get('access_token') || hashParams.get('access_token');
      const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
      if (type === 'recovery' && accessToken && refreshToken) {
        setIsRecoveryMode(true);
        setRecoveryTokens({ accessToken, refreshToken });
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return true;
      }
      return false;
    };
    checkForRecovery();

    const checkUser = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          await supabase.auth.signOut();
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();

    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
        }
        setIsLoading(false);
      });
      subscription = authSubscription;
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleSignInSuccess = () => { };
  const handleSignOut = () => {
    setUser(null);
    setIsRecoveryMode(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration Required</h3>
              <p className="text-gray-600 mb-4">Variables are missing or invalid.</p>
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">Required steps:</p>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Create a .env file in project root</li>
                  <li>2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                  <li>3. Get values from Supabase dashboard</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>
              {supabaseConfigErrors.length > 0 && (
                <div className="mt-4 bg-red-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {supabaseConfigErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRecoveryMode || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Web Application Card */}
            <div className="mb-6">
              <div className="flex items-center bg-blue-100 rounded-2xl shadow-lg px-8 py-6">
                <div className="bg-green-200 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                  {/* Globe Icon */}
                  <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path d="M2 12h20M12 2c4.418 0 8 4.48 8 10s-3.582 10-8 10-8-4.48-8-10 3.582-10 8-10z" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-green-700 text-lg">
                    Web Application
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-gray-500">
                Full system access on web
              </div>
            </div>

            {/* Header */}
            <h1 className="text-lg font-medium text-center mb-6 text-gray-800 tracking-wide">
              एकात्मिक अनुप्रयोग प्रणाली
            </h1>

            {/* Sign In Form block starts */}
            <SignInForm
              onSignInSuccess={handleSignInSuccess}
              forceResetMode={isRecoveryMode}
              accessToken={recoveryTokens.accessToken}
              refreshToken={recoveryTokens.refreshToken}
              showLabels={true}
              showIcons={true}
              buttonText="साईन इन"
              forgotText="आपला पासवर्ड विसरलात?"
              inputStyles={{
                container: "mb-5 flex items-center bg-blue-50 rounded-2xl shadow p-2",
                icon: "bg-blue-200 rounded-full h-10 w-10 flex items-center justify-center mr-3",
                input: "flex-1 bg-transparent border-none text-lg placeholder-gray-400 focus:outline-none"
              }}
              passwordStyles={{
                container: "mb-4 flex items-center bg-purple-50 rounded-2xl shadow p-2",
                icon: "bg-purple-200 rounded-full h-10 w-10 flex items-center justify-center mr-3",
                input: "flex-1 bg-transparent border-none text-lg placeholder-gray-400 focus:outline-none"
              }}
              forgotStyles="text-blue-700 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 font-semibold text-base mb-6"
              buttonStyles="w-full flex items-center justify-center gap-2 text-white text-xl font-bold rounded-2xl py-4 bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 shadow-xl"
              buttonIcon={
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 12H3m12 0l-4-4m4 4l-4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            {/* Sign In Form block ends */}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Secure access to integrated government applications
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} onSignOut={handleSignOut} />;
}

export default App;
