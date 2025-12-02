import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// import { Building2, Users, Calendar, FileText, TrendingUp, User, Settings, LogOut, ChevronDown, Smartphone, Globe, Shield, Eye, CreditCard as Edit, Trash2, UserCheck, ArrowRight, BarChart3, Camera, MapPin, Clock, CheckCircle, AlertCircle, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard } from './PermissionGuard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SessionTimeoutModal } from './SessionTimeoutModal';
import { SessionTimeoutManager, SESSION_CONFIG } from '../utils/security';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Import ERMSDashboard directly since lazy loading is causing issues
import { ERMSDashboard } from './ERMSDashboard';

// new imports
import { Building2, FileText, Users, Map, Calendar, Phone, Mail, MapPin, ChevronRight, Award, TrendingUp, Home, User, Settings, LogOut, ChevronDown, Smartphone, Globe, Shield, Eye, CreditCard as Edit, Trash2, UserCheck, ArrowRight, BarChart3, Camera, Clock, CheckCircle, AlertCircle, DollarSign, Activity } from 'lucide-react';
import ImageSlider from './ImageSlider';
import GallerySlider from './GallerySlider';


// E-estimate iframe component
const EEstimateFrame: React.FC<{ user: SupabaseUser; onBack: () => void }> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  
  // E-estimate application URL - replace with actual URL when available
  const eEstimateUrl = 'https://eestimatemb.zpchandrapurapps.com/';
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-emerald-600 to-teal-700 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors duration-200"
              >
                <ArrowRight className="h-5 w-5 text-white rotate-180" />
              </button>
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {t('systems.estimate.name')} - {t('systems.estimate.fullName')}
                </h1>
                <p className="text-xs text-white/80">
                  {t('systems.estimate.description')}
                </p>
              </div>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-6">
              <LanguageSwitcher />
              
              <div className="flex items-center space-x-3 px-3 py-2 text-white">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-white/80">
                    E-estimate User
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading E-estimate application...</span>
        </div>
      )}

      {/* E-estimate iframe */}
      <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
        <iframe
          src={eEstimateUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          title="E-estimate Application"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
        />
      </div>
    </div>
  );
};

// FIMS iframe component
const FIMSFrame: React.FC<{ user: SupabaseUser; onBack: () => void }> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  
  // FIMS application URL - replace with actual URL when available
  const fimsUrl = 'https://fieldinspection.zpchandrapurapps.com/';
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors duration-200"
              >
                <ArrowRight className="h-5 w-5 text-white rotate-180" />
              </button>
              <div className="bg-white/20 p-2 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {t('systems.fims.name')} - {t('systems.fims.fullName')}
                </h1>
                <p className="text-xs text-white/80">
                  {t('systems.fims.description')}
                </p>
              </div>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-6">
              <LanguageSwitcher />
              
              <div className="flex items-center space-x-3 px-3 py-2 text-white">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-white/80">
                    FIMS User
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading FIMS application...</span>
        </div>
      )}

      {/* FIMS iframe */}
      <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
        <iframe
          src={fimsUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          title="FIMS Application"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
        />
      </div>
    </div>
  );
};

interface DashboardProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const { t } = useTranslation();
  const { hasAccess, permissions, userRole, userProfile, isLoading: permissionsLoading } = usePermissions(user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionManager] = useState(() => new SessionTimeoutManager(
    () => handleSessionTimeout(),
    () => setShowTimeoutWarning(true)
  ));
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SESSION_CONFIG.WARNING_DURATION);

  // Detect if running on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle back button navigation - log out user
  useEffect(() => {
    const handlePopState = async (event: PopStateEvent) => {
      //console.log('🔙 Back button pressed - logging out user for security');
      
      // Prevent the default back navigation
      event.preventDefault();
      
      // Sign out the user
      try {
        await supabase.auth.signOut();
        onSignOut();
      } catch (error) {
        console.error('Error during back button logout:', error);
        // Force sign out even if there's an error
        onSignOut();
      }
    };

    // Add state to history to detect back button
    window.history.pushState({ page: 'dashboard' }, '', window.location.href);
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onSignOut]);

  // Prevent password saving and form autocomplete
  useEffect(() => {
    // Disable password managers and autocomplete
    const disablePasswordSaving = () => {
      // Add meta tag to prevent password saving
      const metaTag = document.createElement('meta');
      metaTag.name = 'save-password';
      metaTag.content = 'never';
      document.head.appendChild(metaTag);
      
      // Disable autocomplete on all forms
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        form.setAttribute('autocomplete', 'off');
      });
      
      // Disable autocomplete on all input fields
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('data-form-type', 'other');
      });
    };

    disablePasswordSaving();
    
    // Run periodically to catch dynamically added forms
    const interval = setInterval(disablePasswordSaving, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  // Session timeout management
  useEffect(() => {
    if (user) {
      sessionManager.start();
      
      // Update remaining time every second when warning is shown
      let interval: NodeJS.Timeout;
      if (showTimeoutWarning) {
        interval = setInterval(() => {
          setRemainingTime(sessionManager.getRemainingTime());
        }, 1000);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      sessionManager.stop();
    }
    
    return () => {
      sessionManager.stop();
    };
  }, [user, sessionManager, showTimeoutWarning]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen]);

  const handleSessionTimeout = async () => {
    //console.log('⏰ Session timeout - automatically signing out user');
    setShowTimeoutWarning(false);
    sessionManager.stop();
    
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error during automatic sign out:', error);
      // Force sign out even if there's an error
      onSignOut();
    }
  };

  const handleExtendSession = () => {
    console.log('🔄 User extended session');
    sessionManager.extendSession();
    setShowTimeoutWarning(false);
  };

  const handleSignOut = async () => {
    sessionManager.stop();
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAppClick = (appId: string) => {
    // Special handling for E-estimate - pass auth and open in new window
    if (appId === 'estimate') {
      handleEstimateClick();
      return;
    }
    
    // Special handling for FIMS - pass auth and open in new window
    if (appId === 'fims') {
      handleFIMSClick();
      return;
    }
    
    // Special handling for PESA - pass auth and open in new window
    if (appId === 'pesa') {
      handlePESAClick();
      return;
    }
    
    // Special handling for Workflow Management - open in new window
    if (appId === 'workflow') {
      handleWorkflowClick();
      return;
    }
    
    setSelectedApp(appId);
  };

  const handleEstimateClick = async () => {
    try {
      //console.log('🚀 E-estimate: Starting authentication transfer...');
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ E-estimate: Error getting session:', error);
        // Open without auth if session fetch fails
        window.open('https://eestimatemb.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
        return;
      }

      if (session?.access_token && session?.refresh_token) {
        //console.log('🔑 E-estimate: Valid session found, preparing auth transfer...');
        // Method 1: Try localStorage approach
        try {
          const authData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at,
            auto_login: true,
            source_app: 'zp_chandrapur_main',
            timestamp: Date.now()
          };
          
          localStorage.setItem('estimate_auth_transfer', JSON.stringify(authData));
          //console.log('💾 E-estimate: Auth data stored in localStorage');
          
          // Clean up after 30 seconds
          setTimeout(() => {
            localStorage.removeItem('estimate_auth_transfer');
            console.log('🧹 E-estimate: Auth data cleaned up from localStorage');
          }, 30000);
          
        } catch (storageError) {
          console.warn('⚠️ E-estimate: localStorage not available:', storageError);
        }
        
        // Method 2: URL parameters as fallback
        const estimateUrl = new URL('https://eestimatemb.zpchandrapurapps.com/');
        estimateUrl.searchParams.set('auto_login', 'true');
        estimateUrl.searchParams.set('access_token', session.access_token);
        estimateUrl.searchParams.set('refresh_token', session.refresh_token);
        estimateUrl.searchParams.set('source', 'zp_main');
        
        //console.log('🌐 E-estimate: Opening with auth data...');
        // Open E-estimate with auth data
        window.open(estimateUrl.toString(), '_blank', 'noopener,noreferrer');
      } else {
        console.warn('⚠️ E-estimate: No valid session found');
        // Open without auth
        window.open('https://eestimatemb.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('❌ E-estimate: Error in handleEstimateClick:', error);
      // Fallback: open without auth
      window.open('https://eestimatemb.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
    }
  };

  const handleFIMSClick = async () => {
    try {
     // console.log('🚀 FIMS: Starting authentication transfer...');
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ FIMS: Error getting session:', error);
        // Open without auth if session fetch fails
        window.open('https://fieldinspection.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
        return;
      }

      if (session?.access_token && session?.refresh_token) {
        console.log('🔑 FIMS: Valid session found, preparing auth transfer...');
        
        // Method 1: Try localStorage approach
        try {
          const authData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at,
            auto_login: true,
            source_app: 'zp_chandrapur_main',
            timestamp: Date.now()
          };
          
          localStorage.setItem('fims_auth_transfer', JSON.stringify(authData));
         // console.log('💾 FIMS: Auth data stored in localStorage');
          
          // Clean up after 30 seconds
          setTimeout(() => {
            localStorage.removeItem('fims_auth_transfer');
            //console.log('🧹 FIMS: Auth data cleaned up from localStorage');
          }, 30000);
          
        } catch (storageError) {
          console.warn('⚠️ FIMS: localStorage not available:', storageError);
        }
        
        // Method 2: URL parameters as fallback
        const fimsUrl = new URL('https://fieldinspection.zpchandrapurapps.com/');
        fimsUrl.searchParams.set('auto_login', 'true');
        fimsUrl.searchParams.set('access_token', session.access_token);
        fimsUrl.searchParams.set('refresh_token', session.refresh_token);
        fimsUrl.searchParams.set('source', 'zp_main');
        
       // console.log('🌐 FIMS: Opening with auth data...');
        // Open FIMS with auth data
        window.open(fimsUrl.toString(), '_blank', 'noopener,noreferrer');
      } else {
        console.warn('⚠️ FIMS: No valid session found');
        // Open without auth
        window.open('https://fieldinspection.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('❌ FIMS: Error in handleFIMSClick:', error);
      // Fallback: open without auth
      window.open('https://fieldinspection.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
    }
  };

  const handlePESAClick = async () => {
    try {
     // console.log('🚀 PESA: Starting authentication transfer...');
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ PESA: Error getting session:', error);
        // Open without auth if session fetch fails
        window.open('https://pesaworks.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
        return;
      }

      //https://zpchandrapur-pesa-fi-r90q.bolt.host
      if (session?.access_token && session?.refresh_token) {
        console.log('🔑 PESA: Valid session found, preparing auth transfer...');
        
        // Method 1: Try localStorage approach
        try {
          const authData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at,
            auto_login: true,
            source_app: 'zp_chandrapur_main',
            timestamp: Date.now()
          };
          
          localStorage.setItem('pesa_auth_transfer', JSON.stringify(authData));
          console.log('💾 PESA: Auth data stored in localStorage');
          
          // Clean up after 30 seconds
          setTimeout(() => {
            localStorage.removeItem('pesa_auth_transfer');
            console.log('🧹 PESA: Auth data cleaned up from localStorage');
          }, 30000);
          
        } catch (storageError) {
          console.warn('⚠️ PESA: localStorage not available:', storageError);
        }
        
        // Method 2: URL parameters as fallback
        const pesaUrl = new URL('https://pesaworks.zpchandrapurapps.com/');
        pesaUrl.searchParams.set('auto_login', 'true');
        pesaUrl.searchParams.set('access_token', session.access_token);
        pesaUrl.searchParams.set('refresh_token', session.refresh_token);
        pesaUrl.searchParams.set('source', 'zp_main');
        
        //console.log('🌐 PESA: Opening with auth data...');
        // Open PESA with auth data
        window.open(pesaUrl.toString(), '_blank', 'noopener,noreferrer');
      } else {
        console.warn('⚠️ PESA: No valid session found');
        // Open without auth
        window.open('https://pesaworks.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('❌ PESA: Error in handlePESAClick:', error);
      // Fallback: open without auth
      window.open('https://pesaworks.zpchandrapurapps.com/', '_blank', 'noopener,noreferrer');
    }
  };

  const handleWorkflowClick = async () => {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        // Open without auth if session fetch fails
        window.open('https://ajdpulse-workflowbui-s078.bolt.host', '_blank', 'noopener,noreferrer');
        return;
      }

      if (session?.access_token && session?.refresh_token) {
        // Method 1: Try localStorage approach
        try {
          const authData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_at: session.expires_at,
            auto_login: true,
            source_app: 'zp_chandrapur_main',
            timestamp: Date.now()
          };
          
          localStorage.setItem('workflow_auth_transfer', JSON.stringify(authData));
          
          // Clean up after 30 seconds
          setTimeout(() => {
            localStorage.removeItem('workflow_auth_transfer');
          }, 30000);
          
        } catch (storageError) {
          console.warn('localStorage not available:', storageError);
        }
        
        // Method 2: URL parameters as fallback
        const workflowUrl = new URL('https://ajdpulse-workflowbui-s078.bolt.host');
        workflowUrl.searchParams.set('auto_login', 'true');
        workflowUrl.searchParams.set('access_token', session.access_token);
        workflowUrl.searchParams.set('refresh_token', session.refresh_token);
        workflowUrl.searchParams.set('source', 'zp_main');
        
        // Open Workflow Management with auth data
        window.open(workflowUrl.toString(), '_blank', 'noopener,noreferrer');
      } else {
        console.warn('No valid session found');
        // Open without auth
        window.open('https://ajdpulse-workflowbui-s078.bolt.host', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error in handleWorkflowClick:', error);
      // Fallback: open without auth
      window.open('https://ajdpulse-workflowbui-s078.bolt.host', '_blank', 'noopener,noreferrer');
    }
  };

  const handleBackToDashboard = () => {
    setSelectedApp(null);
  };

  const systems = [
    {
      id: 'erms',
      name: t('systems.erms.name'),
      fullName: t('systems.erms.fullName'),
      description: t('systems.erms.description'),
      icon: Users,
      color: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-300 hover:via-blue-400 hover:to-indigo-500',
      headerColor: 'bg-gradient-to-r from-blue-300 to-indigo-400',
      type: t('systems.erms.webApplication'),
      mobileOnly: false,
      applicationName: 'erms'
    },
    {
      id: 'estimate',
      name: t('systems.estimate.name'),
      fullName: t('systems.estimate.fullName'),
      description: t('systems.estimate.description'),
      icon: FileText,
      color: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
      hoverColor: 'hover:from-emerald-300 hover:via-green-400 hover:to-teal-500',
      headerColor: 'bg-gradient-to-r from-emerald-300 to-teal-400',
      type: t('systems.estimate.mobileApplication'),
      mobileOnly: true,
      applicationName: 'estimate'
    },
    {
      id: 'fims',
      name: t('systems.fims.name'),
      fullName: t('systems.fims.fullName'),
      description: t('systems.fims.description'),
      icon: Camera,
      color: 'bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600',
      hoverColor: 'hover:from-purple-300 hover:via-violet-400 hover:to-indigo-500',
      headerColor: 'bg-gradient-to-r from-purple-300 to-indigo-400',
      type: t('systems.fims.mobileApplication'),
      mobileOnly: false,
      applicationName: 'fims'
    },
    {
      id: 'pesa',
      name: t('systems.pesa.name'),
      fullName: t('systems.pesa.fullName'),
      description: t('systems.pesa.description'),
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500',
      hoverColor: 'hover:from-sky-200 hover:via-blue-300 hover:to-indigo-400',
      headerColor: 'bg-gradient-to-r from-sky-300 to-indigo-400',
      type: t('systems.pesa.webApplication'),
      mobileOnly: false,
      applicationName: 'pesa'
    },
  ];

  // Filter systems based on device type
  const getVisibleSystems = () => {
    
    let filteredSystems = systems;
    
    // Filter by device type - but allow all systems on both platforms for developer role
    if (isMobile && userRole !== 'developer') {
      // Mobile: Show only FIMS and E-estimate (unless developer)
      filteredSystems = systems.filter(system => system.id === 'fims' || system.id === 'estimate');
    }
    
    //console.log('📋 Systems after device filter:', filteredSystems.map(s => s.id));
    
    // Filter by user permissions
    const accessibleSystems = filteredSystems.filter(system => {
      // Check if user has read access to this application
      const hasPermission = hasAccess(system.applicationName, 'read');
      //console.log(`🔐 System ${system.id} (${system.applicationName}): ${hasPermission ? '✅ ALLOWED' : '❌ DENIED'}`);
      return hasPermission;
    });
    
   // console.log('✅ Final accessible systems:', accessibleSystems.map(s => s.id));
    return accessibleSystems;
  };

  const getSystemGradient = (systemId: string) => {
    switch (systemId) {
      case 'erms':
        return 'from-blue-500 to-indigo-600';
      case 'estimate':
        return 'from-emerald-300 to-cyan-400';
      case 'fims':
        return 'from-violet-300 to-fuchsia-400';
      case 'pesa':
        return 'from-amber-300 to-red-400';
      default:
        return 'from-gray-200 to-gray-300';
    }
  };

  const visibleSystems = getVisibleSystems();
  
  // Show message if no systems are accessible
  const renderNoAccessMessage = () => (
    <div className="text-center py-12">
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-3xl shadow-xl max-w-md mx-auto">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('permissions.accessRestricted')}
        </h3>
        <p className="text-gray-600 mb-4">
          You don't have access to any applications at the moment.
        </p>
        <p className="text-sm text-gray-500">
          {t('permissions.contactAdmin')}
        </p>
      </div>
    </div>
  );
  
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render individual app dashboard
  if (selectedApp) {
    // Special handling for ERMS
    if (selectedApp === 'erms') {
      return <ERMSDashboard user={user} onBack={handleBackToDashboard} />;
    }
    
    // Special handling for FIMS (iframe)
    if (selectedApp === 'fims') {
      return <FIMSFrame user={user} onBack={handleBackToDashboard} />;
    }
    
    const app = systems.find(s => s.id === selectedApp);
    if (!app) return null;

    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className={`${app.headerColor} shadow-lg border-b border-gray-200`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToDashboard}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors duration-200"
                >
                  <ArrowRight className="h-5 w-5 text-white rotate-180" />
                </button>
                <div className="bg-white/20 p-2 rounded-lg">
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    {app.name} - {app.fullName}
                  </h1>
                  <p className="text-xs text-white/80">
                    {app.description}
                  </p>
                </div>
              </div>

              {/* Right side navigation */}
              <div className="flex items-center space-x-6">
                <LanguageSwitcher />
                
                <div className="relative user-profile-dropdown">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <div className="bg-white/20 p-1.5 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {userProfile?.name || user.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-white/80">
                        {userProfile?.role_name ? t(`roles.${userProfile.role_name}`) : t(`roles.${userRole}`)}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[60]">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {userProfile?.name || user.email?.split('@')[0]}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userProfile?.role_name ? t(`roles.${userProfile.role_name}`) : t(`roles.${userRole}`)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                          <User className="h-4 w-4" />
                          <span>{t('profile.userProfile')}</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                          <Settings className="h-4 w-4" />
                          <span>{t('navigation.settings')}</span>
                        </button>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('auth.signOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* App Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              {app.name} Dashboard
            </h2>
            <p className="text-gray-600 text-lg">
              {app.description}
            </p>
          </div>

          {/* Stats Grid */}
          {/* Actions Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">Quick Actions</h3>
            <div className="text-center py-8">
              <div className="text-gray-500">
                Quick actions will be available soon...
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

    const stats = [
    { label: 'Active Employees', value: '1,245', icon: Users },
    { label: 'Departments', value: '28', icon: Building2 },
    { label: 'Pending Tasks', value: '342', icon: Calendar },
    { label: 'Efficiency Rate', value: '94.5%', icon: TrendingUp }
  ];

    const applications = [
    {
      title: 'Employee Portal',
      description: 'Manage attendance, payroll, leave applications, and performance reviews',
      icon: Users,
      color: 'from-yellow-500 to-amber-600',
      url: '#employee-portal'
    },
    {
      title: 'Document Management',
      description: 'Upload, track, and approve official documents and file records',
      icon: FileText,
      color: 'from-green-500 to-emerald-600',
      url: '#documents'
    },
    {
      title: 'Task Assignment',
      description: 'Assign, track, and monitor departmental tasks and workflows',
      icon: Calendar,
      color: 'from-amber-700 to-yellow-600',
      url: '#tasks'
    },
    {
      title: 'Asset Management',
      description: 'Track government assets, inventory, and equipment allocation',
      icon: Map,
      color: 'from-green-600 to-teal-600',
      url: '#assets'
    }
  ];

  // Main Dashboard View
  return (
    // <div className="min-h-screen bg-gray-50">
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-green-50">
      {/* Navigation Header */}
        <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
            {/* <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-3 rounded-lg shadow-lg border-2 border-yellow-300"> */}
                <div className="bg-transparent p-0 rounded-lg shadow-lg border-2 border-white/30">
                {/* <Building2 className="w-8 h-8 text-brown-900" /> */}
                <img 
                src="Zpchandrapurlogo.png" 
                alt="ZP Chandrapur Logo" 
                className="h-24 w-24 object-contain rounded-2xl shadow-lg"/>
            </div>
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-white text-3xl font-bold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                  {t('dashboard.title')}
                </h1>
                <p className="text-[#f0e005] text-lg font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                  {t('dashboard.subtitle')}
                </p>
              </div>
            </div>
            </div>

            {/* Right side navigation with proper spacing */}
            <div className="flex items-center space-x-8">
            <LanguageSwitcher />
            {/* <a href="#dashboard" className="text-white hover:text-yellow-300 transition-colors font-semibold drop-shadow">Dashboard</a> */}
            {/* <a href="#reports" className="text-white hover:text-yellow-300 transition-colors font-semibold drop-shadow">Reports</a> */}
            {/* <a href="#profile" className="text-white hover:text-yellow-300 transition-colors font-semibold drop-shadow">Profile</a> */}
            
            {/* User Profile Dropdown */}
            <div className="relative user-profile-dropdown">
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="group flex items-center space-x-3 px-4 py-2 text-white rounded-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                >
                <div className="bg-gradient-to-br from-white/30 to-white/10 p-2 rounded-full shadow-lg">
                    <User className="h-4 w-4 text-white group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="text-left">
                    <div className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">
                    {userProfile?.name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-white/80 group-hover:text-yellow-300 transition-colors">
                    {t(`roles.${userRole}`)}
                    </div>
                </div>
                <ChevronDown className="h-4 w-4 text-white transition-colors group-hover:text-yellow-400" />
            </button>


            {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-purple-200/50 py-2 z-[60] backdrop-blur-lg overflow-hidden">
                {/* Profile Header */}
                <div className="px-6 py-4 border-b border-gradient-to-r from-purple-100 to-pink-100">
                    <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-2xl shadow-lg">
                        <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                        {userProfile?.name || user.email?.split('@')[0]}
                        </div>
                        <div className="text-sm text-gray-500">
                        {userProfile?.role_name ? t(`roles.${userProfile.role_name}`) : t(`roles.${userRole}`)}
                        </div>
                    </div>
                    </div>
                </div>

                {/* Profile Actions */}
                <div className="py-2">
                    <button 
                    className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-2xl mx-2 transition-all duration-300 hover:scale-105 flex items-center space-x-3"
                    onClick={() => {
                        // Show user profile details
                        alert(`Profile Details:\nName: ${userProfile?.name || 'Not set'}\nEmail: ${userProfile?.email || 'Not available'}\nPhone: ${userProfile?.phone_number || 'Not set'}\nRole: ${userProfile?.role_name || 'Not assigned'}`);
                    }}
                    >
                    <User className="h-4 w-4" />
                    <span>{t('profile.userProfile')}</span>
                    </button>
                    <button className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 rounded-2xl mx-2 transition-all duration-300 hover:scale-105 flex items-center space-x-3">
                    <Settings className="h-4 w-4" />
                    <span>{t('navigation.settings')}</span>
                    </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 pt-2">
                    <button
                    onClick={handleSignOut}
                    className="w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-2xl mx-2 transition-all duration-300 hover:scale-105 flex items-center space-x-3"
                    >
                    <LogOut className="h-4 w-4" />
                    <span>{t('auth.signOut')}</span>
                    </button>
                </div>
                </div>
            )}
            </div>
            </div>
        </nav>

        {/* Hero Image Slider */}
        <ImageSlider />


        {/* Stats Section */}
        <section className="relative -mt-22 z-30 max-w-7xl mx-auto px-8">
        <div className="bg-gradient-to-r from-yellow-400 via-green-400 to-amber-500 rounded-2xl shadow-2xl p-1">
            <div className="bg-white rounded-xl overflow-hidden">
            <img
                src="Chanda.png"
                alt="Statistics Header"
                className="w-full h-full object-cover"
            />
            </div>
        </div>
        </section>
      

      {/* Applications Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl mb-3 font-bold bg-gradient-to-r from-yellow-600 via-green-600 to-amber-700 bg-clip-text text-transparent leading-tight py-2">{isMobile ? 'मोबाइल अनुप्रयोग प्रणाली' : t('dashboard.applicationsHeading')}</h2>
          <p className="text-2xl text-[#4b2e05] max-w-2xl mx-auto font-semibold">
            Welcome, {userProfile?.name || user.email?.split('@')[0]}
          </p>
        </div>

                {/* Systems Grid */}
        {/* {visibleSystems.length === 0 ? (
            renderNoAccessMessage()
        ) : (
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-8'}`}>
                {visibleSystems.map((system) => (
                <div 
                    key={system.id}
                    className={`${system.color} ${system.hoverColor} ${isMobile ? 'rounded-3xl' : 'rounded-3xl'} shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer ${isMobile ? 'hover:scale-105' : 'transform hover:-translate-y-2 hover:scale-105'} group`}
                    onClick={() => handleAppClick(system.id)}
                >
                    <div className={`${isMobile ? 'p-6' : 'p-8'} h-full`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                        <div className={`bg-white/30 backdrop-blur-sm ${isMobile ? 'p-4' : 'p-5'} rounded-3xl shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                            <system.icon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
                        </div>
                        <div>
                            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white mb-1 drop-shadow-lg`}>
                            {system.name}
                            </h3>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/90 font-medium drop-shadow`}>{system.fullName}</p>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/80 mt-1 drop-shadow`}>{system.description}</p>
                        </div>
                        </div>
                        <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-2xl text-xs font-semibold bg-white/30 text-white backdrop-blur-sm shadow-lg`}>
                            {system.type}
                        </span>
                        <ArrowRight className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white/80 group-hover:translate-x-1 transition-all duration-300`} />
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        )} */}


        {visibleSystems.length === 0 ? (
            renderNoAccessMessage()
        ) : (
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-8'}`}>
                {visibleSystems.map((system) => (
                    <div
                        key={system.id}
                        onClick={() => handleAppClick(system.id)}
                        className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 border-2 border-yellow-200 hover:border-yellow-400 cursor-pointer"
                        >
                    <div className={`absolute inset-0 bg-gradient-to-br ${system.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="p-8">
                        <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${system.color} mb-5 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <system.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-brown-900 mb-1 group-hover:text-green-700 transition-colors">
                        {system.name}
                        </h3>
                        <p className="text-brown-600 mb-2 leading-relaxed font-bold">
                            {system.fullName}
                        </p>
                        <p className="text-brown-600 mb-6 leading-relaxed">
                        {system.description}
                        </p>
                        <div className="flex items-center text-green-700 font-bold group-hover:gap-2 transition-all">
                        <span>Launch Application</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                    </div>
                ))}
            </div>
        )}

        

      </section>

      

    <footer className="bg-gradient-to-r from-[#3b2b24] via-[#6b4f3f] to-[#3b2b24] text-yellow-400 py-12 border-t-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-8">
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-brown-900" />
                </div>
                <span className="font-bold text-lg text-yellow-300">Employee System</span>
              </div>
              <p className="text-yellow-100 text-sm font-medium">
                Committed to excellence in public service and community development.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-yellow-300">Quick Links</h4>
              <ul className="space-y-2 text-sm text-yellow-100">
                <li><a href="#about" className="hover:text-yellow-300 transition-colors font-medium">About Us</a></li>
                <li><a href="#services" className="hover:text-yellow-300 transition-colors font-medium">Services</a></li>
                <li><a href="#news" className="hover:text-yellow-300 transition-colors font-medium">News & Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-yellow-300">Resources</h4>
              <ul className="space-y-2 text-sm text-yellow-100">
                <li><a href="#faq" className="hover:text-yellow-300 transition-colors font-medium">FAQ</a></li>
                <li><a href="#forms" className="hover:text-yellow-300 transition-colors font-medium">Forms & Documents</a></li>
                <li><a href="#accessibility" className="hover:text-yellow-300 transition-colors font-medium">Accessibility</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-yellow-300">Connect</h4>
              <ul className="space-y-2 text-sm text-yellow-100 font-medium">
                <li>Phone: (555) 123-4567</li>
                <li>Email: info@metrodistrict.gov</li>
                <li>500 Government Plaza</li>
              </ul>
            </div>
          </div> */}
          <div className="border-t-2 border-yellow-600 pt-8 text-center text-sm text-yellow-200 font-medium">
            <p>&copy; 2025 ZP Chandrapur, Govt of Maharashtra. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Session Timeout Warning Modal */}
      <SessionTimeoutModal
        isVisible={showTimeoutWarning}
        remainingTime={remainingTime}
        onExtendSession={handleExtendSession}
        onSignOut={handleSessionTimeout}
      />
    </div>
  );
};