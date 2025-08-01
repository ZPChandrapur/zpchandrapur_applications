import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface RetirementEmployee {
  id: string;
  emp_id: string;
  employee_name: string;
  date_of_birth: string | null;
  retirement_date: string | null;
  reason: string;
  desination_time_of_retirement: string | null;
  assigned_clerk_name: string | null;
  department: string | null;
  designation: string | null;
  date_of_submission: string | null;
  department_submitted: string | null;
  type_of_pension: string | null;
  date_of_pension_case_approval: string | null;
  date_of_actual_benefit_provided_for_group_insurance: string | null;
  date_of_benefit_provided_for_gratuity: string | null;
  date_of_actual_benefit_provided_for_leave_encashment: string | null;
  date_of_actual_benefit_provided_for_medical_allowance_if_applic: string | null;
  date_of_benefit_provided_for_hometown_travel_allowance_if_appli: string | null;
  date_of_actual_benefit_provided_for_pending_travel_allowance_if: string | null;
  government_decision_march_31_2023: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

interface EditingEmployee extends RetirementEmployee {
  // All fields are already included in RetirementEmployee
}

export const RetirementDashboard: React.FC<RetirementDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EditingEmployee | null>(null);
  
  // Data states
  const [retirementEmployees, setRetirementEmployees] = useState<RetirementEmployee[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<RetirementEmployee[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [retirementEmployees, selectedClerk, userRole, userProfile]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRetirementEmployees(),
        fetchClerks()
      ]);
    } catch (error) {
      console.error('Error fetching retirement dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRetirementEmployees = async () => {
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement')
        .select(`
          id,
          emp_id,
          employee_name,
          date_of_birth,
          retirement_date,
          reason,
          desination_time_of_retirement,
          assigned_clerk_name,
          department,
          designation,
          date_of_submission,
          department_submitted,
          type_of_pension,
          date_of_pension_case_approval,
          date_of_actual_benefit_provided_for_group_insurance,
          date_of_benefit_provided_for_gratuity,
          date_of_actual_benefit_provided_for_leave_encashment,
          date_of_actual_benefit_provided_for_medical_allowance_if_applic,
          date_of_benefit_provided_for_hometown_travel_allowance_if_appli,
          date_of_actual_benefit_provided_for_pending_travel_allowance_if,
          government_decision_march_31_2023,
          created_at,
          updated_at
        `)
        .order('retirement_date', { ascending: true });
      
      if (error) throw error;
      setRetirementEmployees(data || []);
    } catch (error) {
      console.error('Error fetching retirement employees:', error);
    }
  };

  const fetchClerks = async () => {
    try {
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
      
      setClerks(clerksData);
    } catch (error) {
      console.error('Error fetching clerks:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = retirementEmployees;

    // Role-based filtering
    if (userRole === 'clerk' && userProfile?.name) {
      // Clerk can only see their assigned employees
      filtered = filtered.filter(emp => emp.assigned_clerk_name === userProfile.name);
    }

    // Clerk filter (for non-clerk users)
    if (selectedClerk && userRole !== 'clerk') {
      const selectedClerkName = clerks.find(c => c.user_id === selectedClerk)?.name;
      if (selectedClerkName) {
        filtered = filtered.filter(emp => emp.assigned_clerk_name === selectedClerkName);
      }
    }

    setFilteredEmployees(filtered);
  };

  const getProgressStatus = (employee: RetirementEmployee) => {
    const progressFields = [
      employee.date_of_submission,
      employee.department_submitted,
      employee.type_of_pension,
      employee.date_of_pension_case_approval,
      employee.date_of_actual_benefit_provided_for_group_insurance,
      employee.date_of_benefit_provided_for_gratuity,
      employee.date_of_actual_benefit_provided_for_leave_encashment,
      employee.date_of_actual_benefit_provided_for_medical_allowance_if_applic,
      employee.date_of_benefit_provided_for_hometown_travel_allowance_if_appli,
      employee.date_of_actual_benefit_provided_for_pending_travel_allowance_if,
      employee.government_decision_march_31_2023
    ];

    const filledFields = progressFields.filter(field => field && field.trim() !== '').length;
    const totalFields = progressFields.length;

    if (filledFields === 0) return 'pending';
    if (filledFields === totalFields) return 'completed';
    return 'processing';
  };

  const getStatusCounts = () => {
    const total = filteredEmployees.length;
    const processing = filteredEmployees.filter(emp => getProgressStatus(emp) === 'processing').length;
    const completed = filteredEmployees.filter(emp => getProgressStatus(emp) === 'completed').length;
    const pending = filteredEmployees.filter(emp => getProgressStatus(emp) === 'pending').length;

    return { total, processing, completed, pending };
  };

  const getMonthWiseData = () => {
    // Get 6 months: 3 before selected month, selected month, 2 after selected month
    const monthData = [];
    for (let i = -3; i <= 2; i++) {
      const targetDate = new Date(selectedYear, selectedMonth + i, 1);
      const monthName = targetDate.toLocaleString('default', { month: 'short' });
      const year = targetDate.getFullYear();
      monthData.push({
        month: `${monthName} ${year.toString().slice(-2)}`,
        fullDate: targetDate,
      count: 0
      });
    }

    // Count employees for each month
    filteredEmployees.forEach(emp => {
      if (emp.retirement_date) {
        const retirementDate = new Date(emp.retirement_date);
        const monthIndex = monthData.findIndex(m => 
          m.fullDate.getMonth() === retirementDate.getMonth() && 
          m.fullDate.getFullYear() === retirementDate.getFullYear()
        );
        if (monthIndex !== -1) {
          monthData[monthIndex].count++;
        }
      }
    });

    return monthData;
  };

  const getDepartmentWiseData = () => {
    const deptCounts: { [key: string]: number } = {};
    
    filteredEmployees.forEach(emp => {
      const dept = emp.department || 'Not Assigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getClerkWiseData = () => {
    const clerkCounts: { [key: string]: number } = {};
    
    filteredEmployees.forEach(emp => {
      const clerk = emp.assigned_clerk_name || 'Unassigned';
      clerkCounts[clerk] = (clerkCounts[clerk] || 0) + 1;
    });

    return Object.entries(clerkCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getDesignationWiseData = () => {
    const designationCounts: { [key: string]: number } = {};
    
    filteredEmployees.forEach(emp => {
      const designation = emp.designation || 'Not Assigned';
      designationCounts[designation] = (designationCounts[designation] || 0) + 1;
    });

    return Object.entries(designationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const handleEditEmployee = (employee: RetirementEmployee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee_retirement')
        .update({
          desination_time_of_retirement: editingEmployee.desination_time_of_retirement,
          assigned_clerk_name: editingEmployee.assigned_clerk_name,
          date_of_submission: editingEmployee.date_of_submission,
          department_submitted: editingEmployee.department_submitted,
          type_of_pension: editingEmployee.type_of_pension,
          date_of_pension_case_approval: editingEmployee.date_of_pension_case_approval,
          date_of_actual_benefit_provided_for_group_insurance: editingEmployee.date_of_actual_benefit_provided_for_group_insurance,
          date_of_benefit_provided_for_gratuity: editingEmployee.date_of_benefit_provided_for_gratuity,
          date_of_actual_benefit_provided_for_leave_encashment: editingEmployee.date_of_actual_benefit_provided_for_leave_encashment,
          date_of_actual_benefit_provided_for_medical_allowance_if_applic: editingEmployee.date_of_actual_benefit_provided_for_medical_allowance_if_applic,
          date_of_benefit_provided_for_hometown_travel_allowance_if_appli: editingEmployee.date_of_benefit_provided_for_hometown_travel_allowance_if_appli,
          date_of_actual_benefit_provided_for_pending_travel_allowance_if: editingEmployee.date_of_actual_benefit_provided_for_pending_travel_allowance_if,
          government_decision_march_31_2023: editingEmployee.government_decision_march_31_2023
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;
      
      await fetchRetirementEmployees();
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const statusCounts = getStatusCounts();
  const monthWiseData = getMonthWiseData();
  const departmentWiseData = getDepartmentWiseData();
  const clerkWiseData = getClerkWiseData();
  const designationWiseData = getDesignationWiseData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('erms.retirementDashboard')}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {userRole === 'clerk' 
                  ? `${t('erms.interactiveClerkView')} - ${userProfile?.name || t('erms.unknownClerk')}`
                  : t('erms.globalAdministrativeView')
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {userRole !== 'clerk' && (
                <select
                  value={selectedClerk}
                  onChange={(e) => setSelectedClerk(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('erms.allClerksGlobalView')}</option>
                  {clerks.map(clerk => (
                    <option key={clerk.user_id} value={clerk.user_id}>
                      {clerk.name}
                    </option>
                  ))}
                </select>
              )}
              <button 
                onClick={fetchAllData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">{t('erms.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalRetirements')}</p>
                <p className="text-3xl font-bold text-gray-900">{statusCounts.total}</p>
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
                <p className="text-3xl font-bold text-orange-600">{statusCounts.processing}</p>
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
                <p className="text-3xl font-bold text-green-600">{statusCounts.completed}</p>
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
                <p className="text-3xl font-bold text-purple-600">{statusCounts.pending}</p>
                <p className="text-xs text-gray-500">{t('erms.awaitingApproval')}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Month-wise Retirement Count Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('erms.monthWiseRetirementCount')}</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={0}>{t('erms.january')}</option>
                <option value={1}>{t('erms.february')}</option>
                <option value={2}>{t('erms.march')}</option>
                <option value={3}>{t('erms.april')}</option>
                <option value={4}>{t('erms.may')}</option>
                <option value={5}>{t('erms.june')}</option>
                <option value={6}>{t('erms.july')}</option>
                <option value={7}>{t('erms.august')}</option>
                <option value={8}>{t('erms.september')}</option>
                <option value={9}>{t('erms.october')}</option>
                <option value={10}>{t('erms.november')}</option>
                <option value={11}>{t('erms.december')}</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {monthWiseData.map((item, index) => (
              <div key={index} className={`flex items-center justify-between ${
                item.fullDate.getMonth() === selectedMonth && item.fullDate.getFullYear() === selectedYear 
                  ? 'bg-blue-50 border border-blue-200 rounded-lg p-2' 
                  : ''
              }`}>
                <div className="flex items-center space-x-3 w-20">
                  <span className={`text-sm font-medium ${
                    item.fullDate.getMonth() === selectedMonth && item.fullDate.getFullYear() === selectedYear 
                      ? 'text-blue-700 font-bold' 
                      : 'text-gray-700'
                  }`}>{item.month}</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-6 relative">
                    <div
                      className={`h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        item.fullDate.getMonth() === selectedMonth && item.fullDate.getFullYear() === selectedYear 
                          ? 'bg-blue-600' 
                          : 'bg-blue-500'
                      }`}
                      style={{
                        width: statusCounts.total > 0 ? `${Math.max((item.count / Math.max(...monthWiseData.map(d => d.count))) * 100, 5)}%` : '0%'
                      }}
                    >
                      {item.count > 0 && item.count}
                    </div>
                  </div>
                </div>
                <div className="w-8 text-right">
                  <span className="text-sm text-gray-500">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {t('erms.showing6MonthsCentered', { 
                month: new Date(0, selectedMonth).toLocaleString('default', { month: 'long' }), 
                year: selectedYear 
              })}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Department-wise Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseRetirementCount')}</h3>
            <div className="space-y-3">
              {departmentWiseData.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: statusCounts.total > 0 ? `${(item.count / statusCounts.total) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {statusCounts.total > 0 ? Math.round((item.count / statusCounts.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">{t('erms.showingTopResults', { count: 10 })}</p>
          </div>

          {/* Designation vs Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.designationVsEmployeeCount')}</h3>
            <div className="space-y-3">
              {designationWiseData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: statusCounts.total > 0 ? `${(item.count / statusCounts.total) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {statusCounts.total > 0 ? Math.round((item.count / statusCounts.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clerk-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.clerkWiseEmployeeCount')}</h3>
            <div className="space-y-3">
              {clerkWiseData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-purple-500"
                        style={{
                          width: statusCounts.total > 0 ? `${(item.count / statusCounts.total) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {statusCounts.total > 0 ? Math.round((item.count / statusCounts.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Retirement Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.retirementProgressTracker')}</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <Download className="h-4 w-4" />
                  <span className="text-sm">{t('common.export')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.department')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.designation')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.progress')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? t('erms.loadingRetirementData') : t('erms.noRetirementRecordsFound')}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const status = getProgressStatus(employee);
                    const progressFields = [
                      employee.date_of_submission,
                      employee.department_submitted,
                      employee.type_of_pension,
                      employee.date_of_pension_case_approval,
                      employee.date_of_actual_benefit_provided_for_group_insurance,
                      employee.date_of_benefit_provided_for_gratuity,
                      employee.date_of_actual_benefit_provided_for_leave_encashment,
                      employee.date_of_actual_benefit_provided_for_medical_allowance_if_applic,
                      employee.date_of_benefit_provided_for_hometown_travel_allowance_if_appli,
                      employee.date_of_actual_benefit_provided_for_pending_travel_allowance_if,
                      employee.government_decision_march_31_2023
                    ];
                    const filledFields = progressFields.filter(field => field && field.trim() !== '').length;
                    const progressPercentage = Math.round((filledFields / progressFields.length) * 100);

                    return (
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
                          {employee.designation || employee.desination_time_of_retirement || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.assigned_clerk_name || t('erms.unassigned')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'completed' ? 'bg-green-100 text-green-800' :
                            status === 'processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                            {status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {t(`erms.${status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  status === 'completed' ? 'bg-green-500' :
                                  status === 'processing' ? 'bg-orange-500' :
                                  'bg-purple-500'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{progressPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditEmployee(employee)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.editRetirementDetails')}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Basic Employee Info (Read-only) */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-800 mb-3">{t('erms.basicEmployeeInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('erms.employeeId')}</label>
                    <input
                      type="text"
                      value={editingEmployee.emp_id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('erms.employeeName')}</label>
                    <input
                      type="text"
                      value={editingEmployee.employee_name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('erms.retirementDate')}</label>
                    <input
                      type="text"
                      value={editingEmployee.retirement_date ? new Date(editingEmployee.retirement_date).toLocaleDateString() : '-'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designationAtRetirement')}</label>
                    <input
                      type="text"
                      value={editingEmployee.desination_time_of_retirement || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, desination_time_of_retirement: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
                    <input
                      type="text"
                      value={editingEmployee.assigned_clerk_name || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, assigned_clerk_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfSubmission')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_submission || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_submission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.departmentSubmitted')}</label>
                    <input
                      type="text"
                      value={editingEmployee.department_submitted || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, department_submitted: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.typeOfPension')}</label>
                    <input
                      type="text"
                      value={editingEmployee.type_of_pension || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, type_of_pension: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfPensionCaseApproval')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_pension_case_approval || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_pension_case_approval: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.groupInsuranceBenefit')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_actual_benefit_provided_for_group_insurance || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_actual_benefit_provided_for_group_insurance: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.gratuityBenefit')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_benefit_provided_for_gratuity || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_benefit_provided_for_gratuity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.leaveEncashmentBenefit')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_actual_benefit_provided_for_leave_encashment || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_actual_benefit_provided_for_leave_encashment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.medicalAllowanceBenefit')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_actual_benefit_provided_for_medical_allowance_if_applic || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_actual_benefit_provided_for_medical_allowance_if_applic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.hometownTravelAllowance')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_benefit_provided_for_hometown_travel_allowance_if_appli || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_benefit_provided_for_hometown_travel_allowance_if_appli: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.pendingTravelAllowance')}</label>
                    <input
                      type="date"
                      value={editingEmployee.date_of_actual_benefit_provided_for_pending_travel_allowance_if || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_actual_benefit_provided_for_pending_travel_allowance_if: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.governmentDecisionMarch2023')}</label>
                    <input
                      type="text"
                      value={editingEmployee.government_decision_march_31_2023 || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, government_decision_march_31_2023: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateEmployee}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};