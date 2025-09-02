import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Smartphone,
  Globe,
  Shield,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  ArrowRight,
  BarChart3,
  Camera,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard } from './PermissionGuard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ERMSDashboard } from './ERMSDashboard';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// E-estimate iframe component
const EEstimateFrame: React.FC<{ user: SupabaseUser; onBack: () => void }> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  
  // E-estimate application URL - replace with actual URL when available
  const eEstimateUrl = 'https://your-e-estimate-app.bolt.new';
  
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
  const fimsUrl = 'https://keen-cactus-aafab0.netlify.app/';
  
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
  const { permissions, userRole, userProfile, isLoading: permissionsLoading } = usePermissions(user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAppClick = (appId: string) => {
    setSelectedApp(appId);
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
      color: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
      hoverColor: 'hover:from-blue-600 hover:via-blue-700 hover:to-indigo-800',
      headerColor: 'bg-gradient-to-r from-blue-600 to-indigo-700',
      type: t('systems.erms.webApplication'),
      mobileOnly: false
    },
    {
      id: 'estimate',
      name: t('systems.estimate.name'),
      fullName: t('systems.estimate.fullName'),
      description: t('systems.estimate.description'),
      icon: FileText,
      color: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700',
      hoverColor: 'hover:from-emerald-600 hover:via-green-700 hover:to-teal-800',
      headerColor: 'bg-gradient-to-r from-emerald-600 to-teal-700',
      type: t('systems.estimate.mobileApplication'),
      mobileOnly: true
    },
    {
      id: 'fims',
      name: t('systems.fims.name'),
      fullName: t('systems.fims.fullName'),
      description: t('systems.fims.description'),
      icon: Camera,
      color: 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700',
      hoverColor: 'hover:from-purple-600 hover:via-violet-700 hover:to-indigo-800',
      headerColor: 'bg-gradient-to-r from-purple-600 to-indigo-700',
      type: t('systems.fims.mobileApplication'),
      mobileOnly: true
    },
    {
      id: 'pesa',
      name: t('systems.pesa.name'),
      fullName: t('systems.pesa.fullName'),
      description: t('systems.pesa.description'),
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
      hoverColor: 'hover:from-orange-600 hover:via-red-600 hover:to-pink-700',
      headerColor: 'bg-gradient-to-r from-orange-600 to-pink-600',
      type: t('systems.pesa.webApplication'),
      mobileOnly: false
    }
  ];

  // Filter systems based on device type
  const getVisibleSystems = () => {
    if (isMobile) {
      // Mobile: Show only FIMS and E-estimate
      return systems.filter(system => system.id === 'fims' || system.id === 'estimate');
    } else {
      // Web: Show all systems
      return systems;
    }
  };

  const visibleSystems = getVisibleSystems();

  // Helper function to get gradient colors for each system
  const getSystemGradient = (systemId: string) => {
    switch (systemId) {
      case 'erms':
        return 'from-indigo-500 via-blue-600 to-purple-700';
      case 'estimate':
        return 'from-emerald-500 via-teal-600 to-green-700';
      case 'fims':
        return 'from-purple-500 via-violet-600 to-pink-700';
      case 'pesa':
        return 'from-orange-500 via-red-500 to-pink-600';
      default:
        return 'from-gray-500 via-gray-600 to-gray-700';
    }
  };

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
    
    // Special handling for E-estimate (iframe)
    if (selectedApp === 'estimate') {
      return <EEstimateFrame user={user} onBack={handleBackToDashboard} />;
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

  // Main Dashboard View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img 
                src="/image.png" 
                alt="ZP Chandrapur Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {t('dashboard.title')}
                </h1>
                <p className="text-xs text-white/80">
                  {t('dashboard.subtitle')}
                </p>
              </div>
            </div>

            {/* Right side navigation with proper spacing */}
            <div className="flex items-center space-x-6">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* User Profile Dropdown */}
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
                    <div className="text-xs text-white/80">{t(`roles.${userRole}`)}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[60]">
                    {/* Profile Header */}
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

                    {/* Profile Actions */}
                    <div className="py-2">
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                        onClick={() => {
                          // Show user profile details
                          alert(`Profile Details:\nName: ${userProfile?.name || 'Not set'}\nEmail: ${userProfile?.email || 'Not available'}\nPhone: ${userProfile?.phone_number || 'Not set'}\nRole: ${userProfile?.role_name || 'Not assigned'}`);
                        }}
                      >
                        <User className="h-4 w-4" />
                        <span>{t('profile.userProfile')}</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                        <Settings className="h-4 w-4" />
                        <span>{t('navigation.settings')}</span>
                      </button>
                    </div>

                    {/* Sign Out */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2`}>
            Welcome, {userProfile?.name || user.email?.split('@')[0]}
          </h2>
          <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {isMobile ? 'मोबाइल अनुप्रयोग प्रणाली' : t('dashboard.overview')}
          </p>
          {isMobile && (
            <div className="mt-2 flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Mobile Application</span>
            </div>
          )}
        </div>

        {/* Systems Grid */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-8'}`}>
          {visibleSystems.map((system) => (
              <div 
                key={system.id}
                className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${isMobile ? '' : 'transform hover:-translate-y-1'} ${system.hoverColor}`}
                onClick={() => handleAppClick(system.id)}
              >
                {/* System Header */}
                <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-100`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`${system.color} ${isMobile ? 'p-3' : 'p-4'} rounded-xl shadow-lg`}>
                        <system.icon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
                      </div>
                      <div>
                        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-1`}>
                          {system.name}
                        </h3>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium`}>{system.fullName}</p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>{system.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-1' : 'px-3 py-1'} rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                        {system.type}
                      </span>
                      <ArrowRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
                    </div>
                  </div>
                </div>

                {/* System Actions */}
              </div>
          ))}
        </div>
      </main>
    </div>
  );
};