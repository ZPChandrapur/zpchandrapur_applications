// Authentication receiver utility for E-estimate application
// This should be used in the E-estimate application to automatically log in users

import { supabase } from '../lib/supabase';

interface AuthTransferData {
  access_token: string;
  refresh_token: string;
  user: any;
  expires_at: number;
  auto_login: boolean;
  source_app: string;
}

export const handleAutoLogin = async (): Promise<boolean> => {
  try {
    // Method 1: Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const autoLogin = urlParams.get('auto_login');
    
    if (autoLogin === 'true') {
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (!error && data.session) {
          console.log('Auto-login successful via URL parameters');
          // Clean URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return true;
        }
      }
    }
    
    // Method 2: Check localStorage
    const authTransferData = localStorage.getItem('estimate_auth_transfer');
    if (authTransferData) {
      try {
        const authData: AuthTransferData = JSON.parse(authTransferData);
        
        if (authData.auto_login && authData.source_app === 'zp_chandrapur_main') {
          // Set the session in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: authData.access_token,
            refresh_token: authData.refresh_token
          });
          
          if (!error && data.session) {
            console.log('Auto-login successful via localStorage');
            // Clean up the transfer data
            localStorage.removeItem('estimate_auth_transfer');
            return true;
          }
        }
      } catch (parseError) {
        console.error('Error parsing auth transfer data:', parseError);
        localStorage.removeItem('estimate_auth_transfer');
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in auto-login process:', error);
    return false;
  }
};

// Function to be called when E-estimate app initializes
export const initializeAuthReceiver = async () => {
  // Check if user is already logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Try auto-login
    const autoLoginSuccess = await handleAutoLogin();
    
    if (autoLoginSuccess) {
      console.log('User automatically logged in from main application');
      // Optionally redirect to dashboard or refresh the page
      window.location.reload();
    }
  }
};

// Export for use in E-estimate application
export default {
  handleAutoLogin,
  initializeAuthReceiver
};