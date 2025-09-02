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
  DollarSign,
  Workflow,
  Activity,
  Target,
  Timer,
  CheckSquare,
  AlertTriangle,
  TrendingDown
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
  const eEstimateUrl = 'https://zpchandrapur-estimat-bha0.bolt.host';
  
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

// Workflow Management component
const WorkflowManagement: React.FC<{ user: SupabaseUser; onBack: () => void }> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'tasks' | 'reports'>('overview');
  
  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const workflowStats = [
    {
      title: 'Active Projects',
      value: '24',
      subtitle: 'In Progress',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Completed Tasks',
      value: '156',
      subtitle: 'This Month',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pending Reviews',
      value: '8',
      subtitle: 'Awaiting Approval',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Overdue Items',
      value: '3',
      subtitle: 'Need Attention',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const recentProjects = [
    {
      id: 1,
      name: 'Road Construction - Phase 2',
      department: 'Public Works',
      progress: 75,
      status: 'In Progress',
      dueDate: '2024-02-15',
      assignee: 'Rajesh Kumar'
    },
    {
      id: 2,
      name: 'School Building Renovation',
      department: 'Education',
      progress: 45,
      status: 'In Progress',
      dueDate: '2024-03-01',
      assignee: 'Priya Sharma'
    },
    {
      id: 3,
      name: 'Water Supply Pipeline',
      department: 'Water Resources',
      progress: 90,
      status: 'Review',
      dueDate: '2024-01-30',
      assignee: 'Amit Patel'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-rose-300 to-red-400 shadow-lg border-b border-gray-200">
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
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Workflow Management - Work Progress Tracking System
                </h1>
                <p className="text-xs text-white/80">
                  Track and manage work progress across departments
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
                    Workflow Manager
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-4">
            Workflow Dashboard
          </h2>
          <p className="text-gray-600 text-lg">
            Monitor and track work progress across all departments
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {workflowStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: Target },
                { id: 'projects', name: 'Projects', icon: Activity },
                { id: 'tasks', name: 'Tasks', icon: CheckSquare },
                { id: 'reports', name: 'Reports', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Recent Projects</h3>
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.department}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'Review' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-rose-400 to-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Assignee: {project.assignee}</span>
                        <span>Due: {project.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab !== 'overview' && (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management features coming soon...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
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
    // Special handling for E-estimate - pass auth and open in new window
    if (appId === 'estimate') {
      handleEstimateClick();
      return;
    }
    
    setSelectedApp(appId);
  };

  const handleEstimateClick = async () => {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        // Open without auth if session fetch fails
        window.open('https://zpchandrapur-estimat-bha0.bolt.host', '_blank', 'noopener,noreferrer');
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
          
          localStorage.setItem('estimate_auth_transfer', JSON.stringify(authData));
          
          // Clean up after 30 seconds
          setTimeout(() => {
            localStorage.removeItem('estimate_auth_transfer');
          }, 30000);
          
        } catch (storageError) {
          console.warn('localStorage not available:', storageError);
        }
        
        // Method 2: URL parameters as fallback
        const estimateUrl = new URL('https://zpchandrapur-estimat-bha0.bolt.host');
        estimateUrl.searchParams.set('auto_login', 'true');
        estimateUrl.searchParams.set('access_token', session.access_token);
        estimateUrl.searchParams.set('refresh_token', session.refresh_token);
        estimateUrl.searchParams.set('source', 'zp_main');
        
        // Open E-estimate with auth data
        window.open(estimateUrl.toString(), '_blank', 'noopener,noreferrer');
      } else {
        console.warn('No valid session found');
        // Open without auth
        window.open('https://zpchandrapur-estimat-bha0.bolt.host', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error in handleEstimateClick:', error);
      // Fallback: open without auth
      window.open('https://zpchandrapur-estimat-bha0.bolt.host', '_blank', 'noopener,noreferrer');
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
      mobileOnly: false
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
      mobileOnly: true
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
      mobileOnly: true
    },
    {
      id: 'pesa',
      name: t('systems.pesa.name'),
      fullName: t('systems.pesa.fullName'),
      description: t('systems.pesa.description'),
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
      hoverColor: 'hover:from-orange-300 hover:via-red-400 hover:to-pink-500',
      headerColor: 'bg-gradient-to-r from-orange-300 to-pink-400',
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
    
    // Special handling for Workflow Management
    if (selectedApp === 'workflow') {
      return <WorkflowManagement user={user} onBack={handleBackToDashboard} />;
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
      <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl border-b border-purple-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img 
                src="/image.png" 
                alt="ZP Chandrapur Logo" 
                className="h-12 w-12 object-contain rounded-2xl shadow-lg"
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
                  className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/20 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                >
                  <div className="bg-gradient-to-br from-white/30 to-white/10 p-2 rounded-full shadow-lg">
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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-purple-200/50 py-2 z-[60] backdrop-blur-lg">
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
          <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>
            {isMobile ? 'मोबाइल अनुप्रयोग प्रणाली' : t('dashboard.overview')}
          </p>
          {isMobile && (
            <div className="mt-3 flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-2xl shadow-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-600 font-semibold">Mobile Application</span>
            </div>
          )}
        </div>

        {/* Systems Grid */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-8'}`}>
          {visibleSystems.map((system) => (
            <div 
              key={system.id}
              className={`${system.color} ${system.hoverColor} ${isMobile ? 'rounded-3xl' : 'rounded-3xl'} shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer ${isMobile ? 'hover:scale-105' : 'transform hover:-translate-y-2 hover:scale-105'} group`}
              onClick={() => handleAppClick(system.id)}
            >
              {/* System Header - Full card now has gradient */}
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
      </main>
    </div>
  );
};