import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2,
  Users,
  MapPin,
  ClipboardList,
  UserCheck,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

interface OrganizationSetupProps {
  onBack: () => void;
}

export const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('departments');

  const tabs = [
    {
      id: 'departments',
      name: t('erms.departmentsTab'),
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      id: 'designations',
      name: t('erms.designations'),
      icon: ClipboardList,
      color: 'bg-green-500'
    },
    {
      id: 'clerks',
      name: t('erms.clerkManagement'),
      icon: UserCheck,
      color: 'bg-purple-500'
    },
    {
      id: 'talukas',
      name: t('erms.talukas'),
      icon: MapPin,
      color: 'bg-orange-500'
    },
    {
      id: 'offices',
      name: t('erms.officeLocations'),
      icon: Building2,
      color: 'bg-teal-500'
    }
  ];

  const kpiData = [
    {
      title: t('erms.totalDepartments'),
      value: '9',
      subtitle: t('erms.activeDepartments'),
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
      iconBg: 'bg-blue-500'
    },
    {
      title: t('erms.totalDesignations'),
      value: '45',
      subtitle: t('erms.jobPositions'),
      icon: ClipboardList,
      color: 'bg-green-100 text-green-600',
      iconBg: 'bg-green-500'
    },
    {
      title: t('erms.totalClerks'),
      value: '16',
      subtitle: t('erms.activeClerks'),
      icon: UserCheck,
      color: 'bg-purple-100 text-purple-600',
      iconBg: 'bg-purple-500'
    },
    {
      title: t('erms.totalTalukas'),
      value: '15',
      subtitle: t('erms.administrativeUnits'),
      icon: MapPin,
      color: 'bg-orange-100 text-orange-600',
      iconBg: 'bg-orange-500'
    },
    {
      title: t('erms.totalOfficeLocations'),
      value: '28',
      subtitle: t('erms.workLocations'),
      icon: Building2,
      color: 'bg-teal-100 text-teal-600',
      iconBg: 'bg-teal-500'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'departments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('erms.departmentManagement')}</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">{t('erms.addDepartment')}</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Department management interface will be implemented here.</p>
            </div>
          </div>
        );
      
      case 'designations':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('erms.designations')}</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Designation</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Designation management interface will be implemented here.</p>
            </div>
          </div>
        );
      
      case 'clerks':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('erms.clerkManagement')}</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Clerk</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Clerk management interface will be implemented here.</p>
            </div>
          </div>
        );
      
      case 'talukas':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('erms.talukas')}</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Taluka</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Taluka management interface will be implemented here.</p>
            </div>
          </div>
        );
      
      case 'offices':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('erms.officeLocations')}</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Office</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Office location management interface will be implemented here.</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('erms.organizationSetup')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('erms.organizationSetupDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                </div>
                <div className={`${kpi.iconBg} p-3 rounded-lg`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};