import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  BarChart3,
  User,
  X,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import { PayCommission } from './PayCommission';
import { GroupInsurance } from './GroupInsurance';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface RetirementEmployee {
  id: string;
  emp_id: string;
  employee_name: string;
  retirement_date: string | null;
  assigned_clerk: string | null;
  department: string | null;
  age: number | null;
  retirement_progress_status: string | null;
  pay_commission_status: string | null;
  group_insurance_status: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

interface DashboardStats {
  totalRetirements: number;
  processing: number;
  completed: number;
  pending: number;
  monthlyData: { [key: string]: number };
  departmentData: { [key: string]: number };
}

export const RetirementDashboard: React.FC<RetirementDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [activeView, setActiveView] = useState<'dashboard' | 'payCommission' | 'groupInsurance'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Data states
  const [retirementEmployees, setRetirementEmployees] = useState<RetirementEmployee[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRetirements: 0,
    processing: 0,
    completed: 0,
    pending: 0,
    monthlyData: {},
    departmentData: {}
  });

  // Memoized filtered data to prevent unnecessary recalculations
  const filteredEmployees = useMemo(() => {
    let filtered = retirementEmployees;

    // Role-based filtering
    if (userRole === 'clerk' && userProfile?.name) {
      filtered = filtered.filter(emp => emp.assigned_clerk === userProfile.name);
    }

    // Clerk filter (for non-clerk users)
    if (selectedClerk && userRole !== 'clerk') {
      const selectedClerkName = clerks.find(c => c.user_id === selectedClerk)?.name;
      if (selectedClerkName) {
        filtered = filtered.filter(emp => emp.assigned_clerk === selectedClerkName);
      }
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(emp => emp.retirement_progress_status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [retirementEmployees, userRole, userProfile?.name, selectedClerk, clerks, selectedDepartment, selectedStatus, searchTerm]);

  // Memoized pagination data
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, recordsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEmployees.length / recordsPerPage);
  }, [filteredEmployees.length, recordsPerPage]);

  // Fetch functions with proper error handling
  const fetchRetirementEmployees = useCallback(async () => {
    try {
      console.log('📊 Fetching retirement employees...');
      const { data, error } = await ermsClient
        .from('employee_retirement')
        .select(`
          id,
          emp_id,
          employee_name,
          retirement_date,
          assigned_clerk,
          department,
          age,
          retirement_progress_status,
          pay_commission_status,
          group_insurance_status,
          created_at,
          updated_at
        `)
        .order('employee_name');
      
      if (error) throw error;
      
      console.log('✅ Retirement employees fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching retirement employees:', error);
      return [];
    }
  }, []);

  const fetchClerks = useCallback(async () => {
    try {
      console.log('👥 Fetching clerks...');
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          name,
          roles!inner(name)
        `)
        .eq('roles.name', 'clerk')
        .not('name', 'is', null);
      
      if (error) throw error;
      
      const clerksData = data?.map(clerk => ({
        user_id: clerk.user_id,
        name: clerk.name,
        role_name: clerk.roles?.name || 'clerk'
      })) || [];
      
      console.log('✅ Clerks fetched:', clerksData.length);
      return clerksData;
    } catch (error) {
      console.error('❌ Error fetching clerks:', error);
      return [];
    }
  }, []);

  const calculateDashboardStats = useCallback((employees: RetirementEmployee[]): DashboardStats => {
    const stats: DashboardStats = {
      totalRetirements: employees.length,
      processing: 0,
      completed: 0,
      pending: 0,
      monthlyData: {},
      departmentData: {}
    };

    employees.forEach(emp => {
      // Status counts
      if (emp.retirement_progress_status === 'processing') {
        stats.processing++;
      } else if (emp.retirement_progress_status === 'completed') {
        stats.completed++;
      } else {
        stats.pending++;
      }

      // Monthly data
      if (emp.retirement_date) {
        const month = new Date(emp.retirement_date).toLocaleString('default', { month: 'long' });
        stats.monthlyData[month] = (stats.monthlyData[month] || 0) + 1;
      }

      // Department data
      if (emp.department) {
        stats.departmentData[emp.department] = (stats.departmentData[emp.department] || 0) + 1;
      }
    });

    return stats;
  }, []);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    setIsLoading(true);
    try {
      console.log('🔄 Starting data fetch...');
      
      const [employeesData, clerksData] = await Promise.all([
        fetchRetirementEmployees(),
        fetchClerks()
      ]);

      // Update state in a single batch to prevent cascading updates
      setRetirementEmployees(employeesData);
      setClerks(clerksData);
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(employeesData.map(emp => emp.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
      
      // Calculate stats
      const stats = calculateDashboardStats(employeesData);
      setDashboardStats(stats);
      
      console.log('✅ All data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRetirementEmployees, fetchClerks, calculateDashboardStats, isLoading]);

  // Initial data fetch - only run once on mount
  useEffect(() => {
    fetchAllData();
  }, []); // Empty dependency array - only run on mount

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClerk, selectedDepartment, selectedStatus, searchTerm]);

  const handleRefresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
    setSelectedStatus('');
    setCurrentPage(1);
  }, []);

  const handleViewChange = useCallback((view: 'dashboard' | 'payCommission' | 'groupInsurance') => {
    setActiveView(view);
  }, []);

  // Render different views
  if (activeView === 'payCommission') {
    return <PayCommission user={user} />;
  }

  if (activeView === 'groupInsurance') {
    return <GroupInsurance user={user} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('erms.retirementDashboard')}</h1>
                <p className="text-sm text-gray-500 mt-1">{t('erms.retirementDashboardDesc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">{t('erms.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* View Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeView === 'dashboard'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('erms.retirementDashboard')}
              </button>
              <button
                onClick={() => handleViewChange('payCommission')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeView === 'payCommission'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('retirementTracker.payCommission')}
              </button>
              <button
                onClick={() => handleViewChange('groupInsurance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeView === 'groupInsurance'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('retirementTracker.groupInsurance')}
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeView === 'dashboard' && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('erms.totalRetirements')}</p>
                        <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalRetirements}</p>
                        <p className="text-xs text-gray-500">{t('erms.withSubmissionData')}</p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('erms.processing')}</p>
                        <p className="text-3xl font-bold text-orange-600">{dashboardStats.processing}</p>
                        <p className="text-xs text-gray-500">{t('erms.withSubmissionData')}</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <Calendar className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('erms.completed')}</p>
                        <p className="text-3xl font-bold text-green-600">{dashboardStats.completed}</p>
                        <p className="text-xs text-gray-500">{t('erms.pensionApproved')}</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('erms.pending')}</p>
                        <p className="text-3xl font-bold text-purple-600">{dashboardStats.pending}</p>
                        <p className="text-xs text-gray-500">{t('erms.awaitingApproval')}</p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <FileText className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Monthly Retirement Count */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.monthWiseRetirementCount')}</h3>
                    <div className="space-y-3">
                      {Object.entries(dashboardStats.monthlyData).slice(0, 6).map(([month, count]) => (
                        <div key={month} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${(count / Math.max(...Object.values(dashboardStats.monthlyData))) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department-wise Count */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseRetirementCount')}</h3>
                    <div className="space-y-3">
                      {Object.entries(dashboardStats.departmentData).slice(0, 6).map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate flex-1 mr-2">{dept}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / Math.max(...Object.values(dashboardStats.departmentData))) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Employee Records Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('erms.employeeRecords')}</h3>
                      <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                          <Download className="h-4 w-4" />
                          <span className="text-sm">{t('common.export')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t('erms.searchEmployees')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{t('erms.allDepartments')}</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>

                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{t('erms.allReasons')}</option>
                        <option value="pending">{t('erms.pending')}</option>
                        <option value="processing">{t('erms.processing')}</option>
                        <option value="completed">{t('erms.completed')}</option>
                      </select>

                      {userRole !== 'clerk' && (
                        <select
                          value={selectedClerk}
                          onChange={(e) => setSelectedClerk(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">{t('erms.allClerks')}</option>
                          {clerks.map(clerk => (
                            <option key={clerk.user_id} value={clerk.user_id}>
                              {clerk.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={clearFilters}
                        className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                        <span className="text-sm">{t('erms.clearFilters')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employee')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.department')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.age')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerk')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementProgressStatus')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.payCommissionStatus')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.groupInsuranceStatus')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                                {t('common.loading')}
                              </div>
                            </td>
                          </tr>
                        ) : paginatedEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                              {searchTerm || selectedDepartment || selectedStatus || selectedClerk
                                ? t('erms.noEmployeesFound', 'No employees found matching your search.')
                                : t('erms.noEmployeesAvailable', 'No employees available.')
                              }
                            </td>
                          </tr>
                        ) : (
                          paginatedEmployees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                                  <div className="text-sm text-gray-500">{employee.emp_id}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.department || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.age || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.assigned_clerk || t('erms.unassigned')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  employee.retirement_progress_status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : employee.retirement_progress_status === 'processing'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {employee.retirement_progress_status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  employee.pay_commission_status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : employee.pay_commission_status === 'processing'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {employee.pay_commission_status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  employee.group_insurance_status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : employee.group_insurance_status === 'processing'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {employee.group_insurance_status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button className="text-green-600 hover:text-green-900 p-1 rounded">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {t('erms.showingEmployees', {
                            filtered: filteredEmployees.length,
                            total: retirementEmployees.length
                          })}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 text-sm border rounded-md ${
                                  currentPage === pageNum
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {activeView === 'payCommission' && (
              <PayCommission user={user} />
            )}
            
            {activeView === 'groupInsurance' && (
              <GroupInsurance user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};