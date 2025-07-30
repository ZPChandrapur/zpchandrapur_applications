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

interface Taluka {
  tal_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface OfficeLocation {
  office_id: string;
  name: string;
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
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ dept_id: '', department: '' });
  const [newTaluka, setNewTaluka] = useState({ tal_id: '', name: '' });
  const [newOfficeLocation, setNewOfficeLocation] = useState({ office_id: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'departments' | 'talukas' | 'office-locations'>('departments');

  // Function to get translated department name using i18n
  const getTranslatedDepartmentName = (departmentName: string) => {
    // Try to get translation from i18n files
    const translationKey = `erms.departments.${departmentName}`;
    const translated = t(translationKey);
    
    // If translation exists and is different from the key, return it
    if (translated && translated !== translationKey) {
      return translated;
    }
    
    // Otherwise return the original name
    return departmentName;
  };

  // Fetch departments from Supabase
  React.useEffect(() => {
    fetchAllData();
  }, []);

  // Re-fetch departments when language changes to apply translations
  React.useEffect(() => {
    // Force component re-render when language changes
    if (departments.length > 0 || talukas.length > 0 || officeLocations.length > 0) {
      console.log('Language changed to:', i18n.language, 'forcing re-render');
      // Create a new array reference to trigger re-render
      setDepartments(prevDepts => [...prevDepts]);
      setTalukas(prevTalukas => [...prevTalukas]);
      setOfficeLocations(prevOffices => [...prevOffices]);
    }
  }, [i18n.language]);

  const fetchCounts = async () => {
    try {
      setCountsLoading(true);
      console.log('🔍 Fetching counts for all tables...');
      
      // Fetch departments count
      const { count: deptCount, error: deptError } = await ermsClient
        .from('department')
        .select('*', { count: 'exact', head: true });
      
      if (deptError) {
        console.error('❌ Department count error:', deptError);
      } else {
        console.log('✅ Department count:', deptCount);
      }

      // Fetch talukas count
      const { count: talukasCount, error: talukasError } = await ermsClient
        .from('talukas')
        .select('*', { count: 'exact', head: true });
      
      if (talukasError) {
        console.error('❌ Talukas count error:', talukasError);
      } else {
        console.log('✅ Talukas count:', talukasCount);
      }

      // Fetch office locations count
      const { count: officeCount, error: officeError } = await ermsClient
        .from('office_locations')
        .select('*', { count: 'exact', head: true });
      
      if (officeError) {
        console.error('❌ Office locations count error:', officeError);
      } else {
        console.log('✅ Office locations count:', officeCount);
      }
      
    } catch (error) {
      console.error('❌ Error fetching counts:', error);
    } finally {
      setCountsLoading(false);
    }
  };

  const fetchAllData = async () => {
    // Fetch counts
    await fetchCounts();
    
    await Promise.all([
      fetchDepartments(),
      fetchTalukas(),
      fetchOfficeLocations()
    ]);
  };

  const fetchDepartments = async () => {
    try {
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
    }
  };

  const fetchTalukas = async () => {
    try {
      setError('');
      
      const { data, error } = await ermsClient
        .from('talukas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching talukas:', error.message);
        setError(`Failed to fetch talukas: ${error.message}`);
        throw error;
      } else {
        console.log('✅ Talukas data:', data);
        setTalukas(data || []);
      }
      
    } catch (err: any) {
      console.error('❌ Talukas fetch error:', err);
      setError(`Failed to fetch talukas: ${err.message || 'Unknown error'}`);
      setTalukas([]);
    }
  };

  const fetchOfficeLocations = async () => {
    try {
      setError('');
      
      const { data, error } = await ermsClient
        .from('office_locations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching office locations:', error.message);
        setError(`Failed to fetch office locations: ${error.message}`);
        throw error;
      } else {
        console.log('✅ Office locations data:', data);
        setOfficeLocations(data || []);
      }
      
    } catch (err: any) {
      console.error('❌ Office locations fetch error:', err);
      setError(`Failed to fetch office locations: ${err.message || 'Unknown error'}`);
      setOfficeLocations([]);
    } finally {
      // Set loading to false only after all data is fetched
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

  const handleAddTaluka = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaluka.tal_id.trim() || !newTaluka.name.trim()) {
      setError(t('erms.fillAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const { error } = await ermsClient
        .from('talukas')
        .insert([{
          tal_id: newTaluka.tal_id.trim(),
          name: newTaluka.name.trim()
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewTaluka({ tal_id: '', name: '' });
      setShowAddModal(false);
      
      // Refresh talukas list
      await fetchTalukas();
    } catch (err: any) {
      console.error('Error adding taluka:', err);
      setError(err.message || 'Failed to add taluka');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOfficeLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeLocation.office_id.trim() || !newOfficeLocation.name.trim()) {
      setError(t('erms.fillAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const { error } = await ermsClient
        .from('office_locations')
        .insert([{
          office_id: newOfficeLocation.office_id.trim(),
          name: newOfficeLocation.name.trim()
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewOfficeLocation({ office_id: '', name: '' });
      setShowAddModal(false);
      
      // Refresh office locations list
      await fetchOfficeLocations();
    } catch (err: any) {
      console.error('Error adding office location:', err);
      setError(err.message || 'Failed to add office location');
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

  const handleDeleteTaluka = async (talId: string) => {
    if (!confirm(t('erms.deleteConfirm'))) return;

    try {
      const { error } = await ermsClient
        .from('talukas')
        .delete()
        .eq('tal_id', talId);

      if (error) throw error;
      
      // Refresh talukas list
      await fetchTalukas();
    } catch (err: any) {
      console.error('Error deleting taluka:', err);
      setError(err.message || 'Failed to delete taluka');
    }
  };

  const handleDeleteOfficeLocation = async (officeId: string) => {
    if (!confirm(t('erms.deleteConfirm'))) return;

    try {
      const { error } = await ermsClient
        .from('office_locations')
        .delete()
        .eq('office_id', officeId);

      if (error) throw error;
      
      // Refresh office locations list
      await fetchOfficeLocations();
    } catch (err: any) {
      console.error('Error deleting office location:', err);
      setError(err.message || 'Failed to delete office location');
    }
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.dept_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter talukas based on search term
  const filteredTalukas = talukas.filter(taluka =>
    taluka.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taluka.tal_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter office locations based on search term
  const filteredOfficeLocations = officeLocations.filter(office =>
    office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.office_id.toLowerCase().includes(searchTerm.toLowerCase())
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
      value: talukas.length.toString(),
      subtitle: t('erms.administrativeUnits') || 'Administrative units',
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('erms.officeLocations') || 'Office Locations',
      value: officeLocations.length.toString(),
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
    { id: 'talukas', label: `${t('erms.talukas')} (${talukas.length})`, icon: MapPin },
    { id: 'office-locations', label: `${t('erms.officeLocations')} (${officeLocations.length})`, icon: Building2 }
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {countsLoading ? '...' : departments?.length || 0}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">{t('erms.totalDepartments')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('erms.activeDepartments')}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-50">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">19</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">{t('erms.totalDesignations')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('erms.jobPositions')}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-orange-50">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">29</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">{t('erms.totalClerks')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('erms.activeClerks')}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-50">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {countsLoading ? '...' : talukas?.length || 0}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">{t('erms.totalTalukas')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('erms.administrativeUnits')}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-50">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {countsLoading ? '...' : officeLocations?.length || 0}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">{t('erms.totalOfficeLocations')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('erms.workLocations')}</div>
            </div>
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
                  { name: i18n.language === 'mr' ? 'आरोग्य विभाग' : 'Health Department', count: 4, color: 'bg-blue-500' },
                  { name: i18n.language === 'mr' ? 'कामगार प्रशासन विभाग' : 'Labor Administration Department', count: 4, color: 'bg-blue-500' },
                  { name: i18n.language === 'mr' ? 'पशुसंवर्धन विभाग' : 'Animal Husbandry Department', count: 2, color: 'bg-blue-400' },
                  { name: i18n.language === 'mr' ? 'शिक्षण विभाग' : 'Education Department', count: 2, color: 'bg-blue-400' },
                  { name: i18n.language === 'mr' ? 'कृषी विभाग' : 'Agriculture Department', count: 1, color: 'bg-blue-300' },
                  { name: i18n.language === 'mr' ? 'ग्रामीय पाणीपुरवठा विभाग' : 'Rural Water Supply Department', count: 1, color: 'bg-blue-300' },
                  { name: i18n.language === 'mr' ? 'पंचायत विभाग' : 'Panchayat Department', count: 1, color: 'bg-blue-300' },
                  { name: i18n.language === 'mr' ? 'बांधकाम विभाग' : 'Construction Department', count: 1, color: 'bg-blue-300' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-32 text-sm text-gray-700 truncate">
                      {item.name}
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

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'departments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('erms.departments')} ({departments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('talukas')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'talukas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('erms.talukas')} ({talukas?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('office-locations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'office-locations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('erms.officeLocations')} ({officeLocations?.length || 0})
              </button>
            </div>

            {/* Department Management Table */}
            {activeTab === 'departments' && (
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
                              {getTranslatedDepartmentName(dept.department)}
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
            )}

            {/* Talukas Management Table */}
            {activeTab === 'talukas' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('erms.talukas')}</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Taluka</span>
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
                    placeholder="Search talukas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Showing {filteredTalukas.length} of {talukas.length} records
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
                          <th className="text-left py-3 px-4 font-medium text-gray-700">TALUKA ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">NAME</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">CREATED DATE</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">LAST UPDATED</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTalukas.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                              {searchTerm ? 'No talukas found matching your search.' : 'No talukas found. Add your first taluka.'}
                            </td>
                          </tr>
                        ) : (
                          filteredTalukas.map((taluka) => (
                            <tr key={taluka.tal_id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 font-medium">{taluka.tal_id}</td>
                              <td className="py-3 px-4 text-gray-900">{taluka.name}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(taluka.created_at).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(taluka.updated_at).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTaluka(taluka.tal_id)}
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
            )}

            {/* Office Locations Management Table */}
            {activeTab === 'office-locations' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('erms.officeLocations')}</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Office Location</span>
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
                    placeholder="Search office locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Showing {filteredOfficeLocations.length} of {officeLocations.length} records
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
                          <th className="text-left py-3 px-4 font-medium text-gray-700">OFFICE ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">NAME</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">CREATED DATE</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">LAST UPDATED</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOfficeLocations.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                              {searchTerm ? 'No office locations found matching your search.' : 'No office locations found. Add your first office location.'}
                            </td>
                          </tr>
                        ) : (
                          filteredOfficeLocations.map((office) => (
                            <tr key={office.office_id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 font-medium">{office.office_id}</td>
                              <td className="py-3 px-4 text-gray-900">{office.name}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(office.created_at).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(office.updated_at).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteOfficeLocation(office.office_id)}
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
            )}
          </div>
        </div>

        {/* Add Department Modal */}
        {showAddModal && activeTab === 'departments' && (
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

        {/* Add Taluka Modal */}
        {showAddModal && activeTab === 'talukas' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Taluka</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTaluka({ tal_id: '', name: '' });
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

              <form onSubmit={handleAddTaluka} className="space-y-4">
                <div>
                  <label htmlFor="tal_id" className="block text-sm font-medium text-gray-700 mb-2">Taluka ID</label>
                  <input
                    id="tal_id"
                    type="text"
                    value={newTaluka.tal_id}
                    onChange={(e) => setNewTaluka({ ...newTaluka, tal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter taluka ID"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Taluka Name</label>
                  <input
                    id="name"
                    type="text"
                    value={newTaluka.name}
                    onChange={(e) => setNewTaluka({ ...newTaluka, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter taluka name"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewTaluka({ tal_id: '', name: '' });
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add Taluka</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Office Location Modal */}
        {showAddModal && activeTab === 'office-locations' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Office Location</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewOfficeLocation({ office_id: '', name: '' });
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

              <form onSubmit={handleAddOfficeLocation} className="space-y-4">
                <div>
                  <label htmlFor="office_id" className="block text-sm font-medium text-gray-700 mb-2">Office ID</label>
                  <input
                    id="office_id"
                    type="text"
                    value={newOfficeLocation.office_id}
                    onChange={(e) => setNewOfficeLocation({ ...newOfficeLocation, office_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter office ID"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="office_name" className="block text-sm font-medium text-gray-700 mb-2">Office Name</label>
                  <input
                    id="office_name"
                    type="text"
                    value={newOfficeLocation.name}
                    onChange={(e) => setNewOfficeLocation({ ...newOfficeLocation, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter office name"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewOfficeLocation({ office_id: '', name: '' });
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add Office Location</span>
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