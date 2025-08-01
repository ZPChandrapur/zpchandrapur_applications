import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  BarChart3,
  FolderOpen,
  BookOpen,
  Building2,
  MapPin,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { OrganizationSetup } from './OrganizationSetup';
import { EmployeeDashboard } from './EmployeeDashboard';
import { RetirementDashboard } from './RetirementDashboard';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ERMSDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

export const ERMSDashboard: React.FC<ERMSDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState('employee-dashboard');

  const modules = [
    {
      id: 'employee-dashboard',
      name: t('erms.employeeDashboard'),
      description: t('erms.employeeDashboardDesc'),
      icon: Users,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'organization-setup',
      name: t('erms.organizationSetup'),
      description: t('erms.organizationSetupDesc'),
      icon: Settings,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'retirement-dashboard',
      name: t('erms.retirementDashboard'),
      description: t('erms.retirementDashboardDesc'),
      icon: Calendar,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      id: 'retirement-tracker',
      name: t('erms.retirementTracker'),
      description: t('erms.retirementTrackerDesc'),
      icon: TrendingUp,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      id: 'retirement-file-tracker',
      name: t('erms.retirementFileTracker'),
      description: t('erms.retirementFileTrackerDesc'),
      icon: FolderOpen,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600'
    },
    {
      id: 'custom-reports',
      name: t('erms.customReports'),
      description: t('erms.customReportsDesc'),
      icon: BarChart3,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600'
    },
    {
      id: 'instructions',
      name: t('erms.instructions'),
      description: t('erms.instructionsDesc'),
      icon: BookOpen,
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600'
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const handleBackToMain = () => {
    setActiveModule('employee-dashboard');
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'employee-dashboard':
        return <EmployeeDashboard onBack={handleBackToMain} />;
      case 'organization-setup':
        return <OrganizationSetup onBack={handleBackToMain} />;
      case 'retirement-dashboard':
        return <RetirementDashboard user={user} onBack={handleBackToMain} />;
      case 'retirement-tracker':
        return (
          <div className="p-8 text-center">
            <TrendingUp className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Retirement Tracker</h3>
            <p className="text-gray-600">Retirement tracking features coming soon...</p>
          </div>
        );
      case 'retirement-file-tracker':
        return (
          <div className="p-8 text-center">
            <FolderOpen className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Retirement File Tracker</h3>
            <p className="text-gray-600">File tracking features coming soon...</p>
          </div>
        );
      case 'custom-reports':
        return (
          <div className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-teal-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Reports</h3>
            <p className="text-gray-600">Custom reporting features coming soon...</p>
          </div>
        );
      case 'instructions':
        return (
          <div className="p-8 text-center">
            <BookOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instructions</h3>
            <p className="text-gray-600">System instructions coming soon...</p>
          </div>
        );
      default:
        return <EmployeeDashboard onBack={handleBackToMain} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">ERMS</h1>
              <p className="text-sm text-gray-500">Employee Retirement Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                  activeModule === module.id
                    ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`${module.color} ${module.hoverColor} p-2 rounded-lg transition-colors duration-200`}>
                    <module.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium transition-colors duration-200 ${
                      activeModule === module.id ? 'text-blue-900' : 'text-gray-900 group-hover:text-gray-700'
                    }`}>
                      {module.name}
                    </h3>
                    <p className={`text-sm mt-1 transition-colors duration-200 ${
                      activeModule === module.id ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {module.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderModuleContent()}
      </div>
    </div>
  );
};