import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ermsClient } from '../lib/supabase';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Phone,
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  MapPin,
  UserCheck,
  Briefcase,
  Filter,
  X
} from 'lucide-react';

interface Department {
  dept_id: string;
  department: string;
  created_at: string;
  updated_at: string;
}

interface ERMSDashboardProps {
  onBack: () => void;
}

export const ERMSDashboard: React.FC<ERMSDashboardProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState('organization-setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ dept_id: '', department: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('departments');

  // Language-specific department names mapping
  const departmentTranslations: { [key: string]: { en: string; mr: string } } = {
    'आरोग्य विभाग': { en: 'Health Department', mr: 'आरोग्य विभाग' },
    'कामगार प्रशासन विभाग': { en: 'Labor Administration Department', mr: 'कामगार प्रशासन विभाग' },
    'पशुसंवर्धन विभाग': { en: 'Animal Husbandry Department', mr: 'पशुसंवर्धन विभाग' },
    'शिक्षण विभाग': { en: 'Education Department', mr: 'शिक्षण विभाग' },
    'कृषी विभाग': { en: 'Agriculture Department', mr: 'कृषी विभाग' },
    'ग्रामीय पाणीपुरवठा विभाग': { en: 'Rural Water Supply Department', mr: 'ग्रामीय पाणीपुरवठा विभाग' },
    'पंचायत विभाग': { en: 'Panchayat Department', mr: 'पंचायत विभाग' },
    'बांधकाम विभाग': { en: 'Construction Department', mr: 'बांधकाम विभाग' },
    'सामान्य प्रशासन विभाग': { en: 'General Administration Department', mr: 'सामान्य प्रशासन विभाग' },
    // Add reverse mappings for English to Marathi
    'Health Department': { en: 'Health Department', mr: 'आरोग्य विभाग' },
    'Labor Administration Department': { en: 'Labor Administration Department', mr: 'कामगार प्रशासन विभाग' },
    'Animal Husbandry Department': { en: 'Animal Husbandry Department', mr: 'पशुसंवर्धन विभाग' },
    'Education Department': { en: 'Education Department', mr: 'शिक्षण विभाग' },
    'Agriculture Department': { en: 'Agriculture Department', mr: 'कृषी विभाग' },
    'Rural Water Supply Department': { en: 'Rural Water Supply Department', mr: 'ग्रामीय पाणीपुरवठा विभाग' },
    'Panchayat Department': { en: 'Panchayat Department', mr: 'पंचायत विभाग' },
    'Construction Department': { en: 'Construction Department', mr: 'बांधकाम विभाग' },
    'General Administration Department': { en: 'General Administration Department', mr: 'सामान्य प्रशासन विभाग' }
  };

  // Function to get translated department name
  const getTranslatedDepartmentName = (departmentName: string) => {
    console.log('Translating department:', departmentName, 'to language:', i18n.language);
    const translation = departmentTranslations[departmentName];
    if (translation) {
      const result = i18n.language === 'mr' ? translation.mr : translation.en;
      console.log('Translation result:', result);
      return result;
    }
    console.log('No translation found, returning original:', departmentName);
    return departmentName; // Return original if no translation found
  };

  // Fetch departments from Supabase
  React.useEffect(() => {
    fetchDepartments();
  }, []);

  // Re-fetch departments when language changes to apply translations
  React.useEffect(() => {
    // Force component re-render when language changes
    if (departments.length > 0) {
      console.log('Language changed to:', i18n.language, 'forcing re-render');
      // Create a new array reference to trigger re-render
      setDepartments(prevDepts => [...prevDepts]);
    }
  }, [i18n.language]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await ermsClient
        .from('department')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setDepartments(data);
      } else {
        setDepartments([]);
      }
      
    } catch (err: any) {
      console.error('❌ Department fetch error:', err);
      setError(`Failed to fetch departments: ${err.message || 'Unknown error'}`);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.dept_id.trim() || !newDepartment.department.trim()) {
      setError(t('erms.fillAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const { error } = await ermsClient
        .from('department')
        .insert([{
          dept_id: newDepartment.dept_id.trim(),
          department: newDepartment.department.trim()
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewDepartment({ dept_id: '', department: '' });
      setShowAddModal(false);
      
      // Refresh departments list
      await fetchDepartments();
    } catch (err: any) {
      console.error('Error adding department:', err);
      setError(err.message || 'Failed to add department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm(t('erms.deleteConfirm'))) return;

    try {
      const { error } = await ermsClient
        .from('department')
        .delete()
        .eq('dept_id', deptId);

      if (error) throw error;
      
      // Refresh departments list
      await fetchDepartments();
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.message || 'Failed to delete department');
    }
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.dept_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarItems = [
    {
      id: 'employee-dashboard',
      icon: Users,
      title: t('erms.employeeDashboard') || 'Employee Dashboard',
      subtitle: t('erms.employeeDashboardDesc') || 'View employee statistics and manage records'
    },
    {
      id: 'retirement-dashboard',
      icon: Calendar,
      title: t('erms.retirementDashboard') || 'Retirement Dashboard',
      subtitle: t('erms.retirementDashboardDesc') || 'Manage retirement processes and benefits'
    },
    {
      id: 'retirement-tracker',
      icon: BarChart3,
      title: t('erms.retirementTracker') || 'Retirement Tracker',
      subtitle: t('erms.retirementTrackerDesc') || 'Track retirement progress, pay commission and insurance'
    },
    {
      id: 'retirement-file-tracker',
      icon: FileText,
      title: t('erms.retirementFileTracker') || 'Retirement File Tracker',
      subtitle: t('erms.retirementFileTrackerDesc') || 'Track retirement case submissions and approval workflow'
    },
    {
      id: 'organization-setup',
      icon: Building2,
      title: t('erms.organizationSetup'),
      subtitle: t('erms.organizationSetupDesc') || 'Manage departments, designations, talukas, and office locations',
      active: true
    },
    {
      id: 'custom-reports',
      icon: FileText,
      title: t('erms.customReports') || 'Custom Reports',
      subtitle: t('erms.customReportsDesc') || 'Create interactive reports and graphs from all database tables'
    },
    {
      id: 'instructions',
      icon: HelpCircle,
      title: t('erms.instructions') || 'Instructions',
      subtitle: t('erms.instructionsDesc') || 'System instructions and operational guidelines'
    }
  ];

  const kpiCards = [
    {
      title: t('erms.totalDepartments') || 'Total Departments',
      value: departments.length.toString(),
      subtitle: t('erms.activeDepartments') || 'Active departments',
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('erms.totalDesignations') || 'Total Designations',
      value: '19',
      subtitle: t('erms.jobPositions') || 'Job positions',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('erms.totalClerks') || 'Total Clerks',
      value: '29',
      subtitle: t('erms.activeClerks') || '16 active',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('erms.totalTalukas') || 'Total Talukas',
      value: '15',
      subtitle: t('erms.administrativeUnits') || 'Administrative units',
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('erms.officeLocations') || 'Office Locations',
      value: '34',
      subtitle: t('erms.workLocations') || 'Work locations',
      icon: Building2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const tabItems = [
    { id: 'departments', label: `${t('erms.departments')} (${departments.length})`, icon: Building },
    { id: 'designations', label: `${t('erms.designations')} (19)`, icon: Briefcase },
    { id: 'clerk-management', label: `${t('erms.clerkManagement')} (29)`, icon: UserCheck },
    { id: 'talukas', label: `${t('erms.talukas')} (15)`, icon: MapPin },
    { id: 'office-locations', label: `${t('erms.officeLocations')} (34)`, icon: Building2 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ERMS</h1>
              <p className="text-xs text-gray-600">{t('systems.erms.fullName')}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-start space-x-3">
                <item.icon className={`h-5 w-5 mt-0.5 ${
                  activeSection === item.id ? 'text-white' : 'text-gray-400'
                }`} />
                <div>
                  <div className={`font-medium text-sm ${
                    activeSection === item.id ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </div>
                  <div className={`text-xs mt-1 ${
                    activeSection === item.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-gray-600">{t('systems.erms.fullName')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Organization Setup Content */}
        <div className="p-6">
          {/* Organization Setup Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('erms.organizationSetup')}</h2>
                <p className="text-gray-600">{t('erms.organizationSetupDesc') || 'Manage organizational structure and master data'}</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {kpiCards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${card.bgColor} p-2 rounded-lg`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
                <div className="text-sm text-gray-600 mb-1">{card.title}</div>
                <div className="text-xs text-gray-500">{card.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Department-wise Designation Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{t('erms.departmentWiseDistribution') || 'Department-wise Designation Distribution'}</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'आरोग्य विभाग', count: 4, color: 'bg-blue-500' },
                  { name: 'कामगार प्रशासन विभाग', count: 4, color: 'bg-blue-500' },
                  { name: 'पशुसंवर्धन विभाग', count: 2, color: 'bg-blue-400' },
                  { name: 'शिक्षण विभाग', count: 2, color: 'bg-blue-400' },
                  { name: 'कृषी विभाग', count: 1, color: 'bg-blue-300' },
                  { name: 'ग्रामीय पाणीपुरवठा विभाग', count: 1, color: 'bg-blue-300' },
                  { name: 'पंचायत विभाग', count: 1, color: 'bg-blue-300' },
                  { name: 'बांधकाम विभाग', count: 1, color: 'bg-blue-300' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-32 text-sm text-gray-700 truncate">
                      {getTranslatedDepartmentName(item.name)}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / 4) * 100}%` }}></div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 w-6">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clerk Workload Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">{t('erms.clerkWorkloadDistribution') || 'Clerk Workload Distribution'}</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'pr@coparpana', workload: t('erms.low') || 'Low', color: 'bg-green-500' },
                  { name: 'pr@nagbhid', workload: t('erms.low') || 'Low', color: 'bg-green-500' },
                  { name: 'health@zpchandra...', workload: t('erms.low') || 'Low', color: 'bg-green-400' },
                  { name: 'pr@chimur', workload: t('erms.low') || 'Low', color: 'bg-green-400' },
                  { name: 'pr@gadpipari', workload: t('erms.low') || 'Low', color: 'bg-green-400' },
                  { name: 'pr@bhadravati', workload: t('erms.low') || 'Low', color: 'bg-green-300' },
                  { name: 'pr@chandrapur', workload: t('erms.low') || 'Low', color: 'bg-green-300' },
                  { name: 'pr@mul', workload: t('erms.low') || 'Low', color: 'bg-green-300' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">{item.name}</div>
                    <div className="flex items-center space-x-2">
                      <div className={`${item.color} h-2 w-16 rounded-full`}></div>
                      <span className="text-xs text-gray-500 w-8">{item.workload}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex space-x-0 overflow-x-auto">
                {tabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Department Management Table */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('erms.departmentManagement')}</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('erms.addDepartment')}</span>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Filter className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('erms.searchDepartments')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="text-sm text-gray-500 mb-4">
                {t('erms.showingRecords', { filtered: filteredDepartments.length, total: departments.length })}
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">{t('erms.departmentId').toUpperCase()}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">{t('erms.departmentName').toUpperCase()}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">{t('erms.createdDate').toUpperCase()}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">{t('erms.lastUpdated').toUpperCase()}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">{t('erms.actions').toUpperCase()}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDepartments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                            {searchTerm ? t('erms.noDepartmentsFound') : t('erms.addFirstDepartment')}
                          </td>
                        </tr>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <tr key={dept.dept_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900 font-medium">{dept.dept_id}</td>
                            <td className="py-3 px-4 text-gray-900">
                              {(() => {
                                const translatedName = getTranslatedDepartmentName(dept.department);
                                console.log('Rendering department:', dept.department, 'as:', translatedName);
                                return translatedName;
                              })()}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(dept.created_at).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(dept.updated_at).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDepartment(dept.dept_id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Department Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('erms.addNewDepartment')}</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDepartment({ dept_id: '', department: '' });
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div>
                  <label htmlFor="dept_id" className="block text-sm font-medium text-gray-700 mb-2">{t('erms.departmentId')}</label>
                  <input
                    id="dept_id"
                    type="text"
                    value={newDepartment.dept_id}
                    onChange={(e) => setNewDepartment({ ...newDepartment, dept_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterDepartmentId')}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">{t('erms.departmentName')}</label>
                  <input
                    id="department"
                    type="text"
                    value={newDepartment.department}
                    onChange={(e) => setNewDepartment({ ...newDepartment, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterDepartmentName')}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewDepartment({ dept_id: '', department: '' });
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('erms.adding')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>{t('erms.addDepartment')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};