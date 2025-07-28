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
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface DashboardProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const { t } = useTranslation();
  const { permissions, userRole, isLoading: permissionsLoading } = usePermissions(user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

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
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      stats: [
        { label: t('systems.erms.totalEmployees'), value: '1,247', icon: Users, color: 'text-blue-600' },
        { label: t('systems.erms.upcomingRetirements'), value: '23', icon: Calendar, color: 'text-orange-600' },
        { label: t('systems.erms.processedCases'), value: '156', icon: CheckCircle, color: 'text-green-600' },
        { label: t('systems.erms.pendingActions'), value: '8', icon: AlertCircle, color: 'text-red-600' }
      ],
      actions: [
        { label: t('systems.erms.viewEmployees'), icon: Eye, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
        { label: t('systems.erms.addEmployee'), icon: UserCheck, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
        { label: t('systems.erms.generateReport'), icon: FileText, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
      ],
      type: t('systems.erms.webApplication')
    },
    {
      id: 'estimate',
      name: t('systems.estimate.name'),
      fullName: t('systems.estimate.fullName'),
      description: t('systems.estimate.description'),
      icon: FileText,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      stats: [
        { label: t('systems.estimate.activeEstimates'), value: '45', icon: FileText, color: 'text-green-600' },
        { label: t('systems.estimate.pendingApprovals'), value: '12', icon: Clock, color: 'text-orange-600' },
        { label: t('systems.estimate.completedProjects'), value: '234', icon: CheckCircle, color: 'text-blue-600' },
        { label: t('systems.estimate.totalValue'), value: '₹2.4Cr', icon: DollarSign, color: 'text-purple-600' }
      ],
      actions: [
        { label: t('systems.estimate.createEstimate'), icon: Edit, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
        { label: t('systems.estimate.viewEstimates'), icon: Eye, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
        { label: t('systems.estimate.templates'), icon: FileText, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
      ],
      type: t('systems.estimate.mobileApplication')
    },
    {
      id: 'fims',
      name: t('systems.fims.name'),
      fullName: t('systems.fims.fullName'),
      description: t('systems.fims.description'),
      icon: Camera,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      stats: [
        { label: t('systems.fims.monthlyTarget'), value: '150', icon: BarChart3, color: 'text-purple-600' },
        { label: t('systems.fims.completed'), value: '127', icon: CheckCircle, color: 'text-green-600' },
        { label: t('systems.fims.pending'), value: '23', icon: Clock, color: 'text-orange-600' },
        { label: t('systems.fims.inspectionRate'), value: '84.7%', icon: TrendingUp, color: 'text-blue-600' }
      ],
      actions: [
        { label: t('systems.fims.newInspection'), icon: Camera, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
        { label: t('systems.fims.viewInspections'), icon: Eye, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
        { label: t('systems.fims.reports'), icon: FileText, color: 'bg-green-100 text-green-700 hover:bg-green-200' }
      ],
      type: t('systems.fims.mobileApplication')
    },
    {
      id: 'pesa',
      name: t('systems.pesa.name'),
      fullName: t('systems.pesa.fullName'),
      description: t('systems.pesa.description'),
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
      stats: [
        { label: t('systems.pesa.totalFund'), value: '₹1.2Cr', icon: DollarSign, color: 'text-orange-600' },
        { label: t('systems.pesa.utilized'), value: '₹85L', icon: TrendingUp, color: 'text-green-600' },
        { label: t('systems.pesa.remaining'), value: '₹35L', icon: AlertCircle, color: 'text-blue-600' },
        { label: t('systems.pesa.villages'), value: '42', icon: MapPin, color: 'text-purple-600' }
      ],
      actions: [
        { label: t('systems.pesa.addTransaction'), icon: Edit, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
        { label: t('systems.pesa.viewFunds'), icon: Eye, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
        { label: t('systems.pesa.compliance'), icon: Shield, color: 'bg-green-100 text-green-700 hover:bg-green-200' }
      ],
      type: t('systems.pesa.webApplication')
    }
  ];

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render individual app dashboard
  if (selectedApp) {
    const app = systems.find(s => s.id === selectedApp);
    if (!app) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToDashboard}
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors duration-200"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                <div className={`${app.color} p-2 rounded-lg`}>
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {app.name} - {app.fullName}
                  </h1>
                  <p className="text-xs text-gray-500">
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
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{user.email}</div>
                      <div className="text-xs text-gray-500">{t(`roles.${userRole}`)}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[60]">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">{t(`roles.${userRole}`)}</div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {app.name} Dashboard
            </h2>
            <p className="text-gray-600 text-lg">
              {app.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {app.stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gray-50`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Actions Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {app.actions.map((action, index) => (
                <button
                  key={index}
                  className={`${action.color} p-4 rounded-lg transition-all duration-200 flex items-center space-x-3 font-medium`}
                >
                  <action.icon className="h-5 w-5" />
                  <span>{action.label}</span>
                </button>
              ))}
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('dashboard.title')}
                </h1>
                <p className="text-xs text-gray-500">
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
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{user.email}</div>
                    <div className="text-xs text-gray-500">{t(`roles.${userRole}`)}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
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
                          <div className="font-medium text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{t(`roles.${userRole}`)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Actions */}
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}, {user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600 text-lg">
            {t('dashboard.overview')}
          </p>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {systems.map((system) => (
            <PermissionGuard
              key={system.id}
              user={user}
              application={system.id}
              permission="read"
            >
              <div 
                className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${system.hoverColor}`}
                onClick={() => handleAppClick(system.id)}
              >
                {/* System Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`${system.color} p-4 rounded-xl shadow-lg`}>
                        <system.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {system.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">{system.fullName}</p>
                        <p className="text-sm text-gray-500 mt-1">{system.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {system.type}
                      </span>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* System Stats */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="grid grid-cols-2 gap-6">
                    {system.stats.map((stat, index) => (
                      <div key={index} className="text-center bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-center mb-2">
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Actions */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {system.actions.map((action, index) => (
                      <button
                        key={index}
                        className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${action.color}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <action.icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PermissionGuard>
          ))}
        </div>
      </main>
    </div>
  );
};