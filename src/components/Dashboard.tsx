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
  UserCheck
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

  const systems = [
    {
      id: 'erms',
      name: t('systems.erms.name'),
      fullName: t('systems.erms.fullName'),
      description: t('systems.erms.description'),
      icon: Users,
      color: 'bg-blue-500',
      stats: [
        { label: t('systems.erms.totalEmployees'), value: '1,247' },
        { label: t('systems.erms.upcomingRetirements'), value: '23' },
        { label: t('systems.erms.processedCases'), value: '156' },
        { label: t('systems.erms.pendingActions'), value: '8' }
      ],
      actions: [
        { label: t('systems.erms.viewEmployees'), icon: Eye },
        { label: t('systems.erms.addEmployee'), icon: UserCheck },
        { label: t('systems.erms.generateReport'), icon: FileText }
      ],
      type: t('systems.erms.webApplication')
    },
    {
      id: 'estimate',
      name: t('systems.estimate.name'),
      fullName: t('systems.estimate.fullName'),
      description: t('systems.estimate.description'),
      icon: FileText,
      color: 'bg-green-500',
      stats: [
        { label: t('systems.estimate.activeEstimates'), value: '45' },
        { label: t('systems.estimate.pendingApprovals'), value: '12' },
        { label: t('systems.estimate.completedProjects'), value: '234' },
        { label: t('systems.estimate.totalValue'), value: '₹2.4Cr' }
      ],
      actions: [
        { label: t('systems.estimate.createEstimate'), icon: Edit },
        { label: t('systems.estimate.viewEstimates'), icon: Eye },
        { label: t('systems.estimate.templates'), icon: FileText }
      ],
      type: t('systems.estimate.mobileApplication')
    },
    {
      id: 'fims',
      name: t('systems.fims.name'),
      fullName: t('systems.fims.fullName'),
      description: t('systems.fims.description'),
      icon: Smartphone,
      color: 'bg-purple-500',
      stats: [
        { label: t('systems.fims.monthlyTarget'), value: '150' },
        { label: t('systems.fims.completed'), value: '127' },
        { label: t('systems.fims.pending'), value: '23' },
        { label: t('systems.fims.inspectionRate'), value: '84.7%' }
      ],
      actions: [
        { label: t('systems.fims.newInspection'), icon: Edit },
        { label: t('systems.fims.viewInspections'), icon: Eye },
        { label: t('systems.fims.reports'), icon: FileText }
      ],
      type: t('systems.fims.mobileApplication')
    },
    {
      id: 'pesa',
      name: t('systems.pesa.name'),
      fullName: t('systems.pesa.fullName'),
      description: t('systems.pesa.description'),
      icon: TrendingUp,
      color: 'bg-orange-500',
      stats: [
        { label: t('systems.pesa.totalFund'), value: '₹1.2Cr' },
        { label: t('systems.pesa.utilized'), value: '₹85L' },
        { label: t('systems.pesa.remaining'), value: '₹35L' },
        { label: t('systems.pesa.villages'), value: '42' }
      ],
      actions: [
        { label: t('systems.pesa.addTransaction'), icon: Edit },
        { label: t('systems.pesa.viewFunds'), icon: Eye },
        { label: t('systems.pesa.compliance'), icon: Shield }
      ],
      type: t('systems.pesa.webApplication')
    }
  ];

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'read': return <Eye className="h-4 w-4" />;
      case 'write': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return null;
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}, {user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* System Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`${system.color} p-3 rounded-lg`}>
                        <system.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {system.name}
                        </h3>
                        <p className="text-sm text-gray-500">{system.fullName}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {system.type}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{system.description}</p>
                </div>

                {/* System Stats */}
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    {system.stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Actions */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {system.actions.map((action, index) => (
                      <button
                        key={index}
                        className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        <action.icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Permissions for this system */}
                <div className="px-6 pb-6">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-900 mb-2">
                      {t('profile.permissions')}:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {permissions
                        .filter(p => p.application_name === system.id)
                        .map(permission => (
                          <div key={permission.application_name} className="flex space-x-1">
                            {permission.can_read && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                {getPermissionIcon('read')}
                                <span>{t('profile.read')}</span>
                              </span>
                            )}
                            {permission.can_write && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {getPermissionIcon('write')}
                                <span>{t('profile.write')}</span>
                              </span>
                            )}
                            {permission.can_delete && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                {getPermissionIcon('delete')}
                                <span>{t('profile.delete')}</span>
                              </span>
                            )}
                            {permission.can_admin && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                {getPermissionIcon('admin')}
                                <span>{t('profile.admin')}</span>
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
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