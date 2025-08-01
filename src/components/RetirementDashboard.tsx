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
  User
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
  desination_time_of_retirement: string;
  assigned_clerk_name: string;
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

export const RetirementDashboard: React.FC<RetirementDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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
        .select('*')
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
    const monthData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      count: 0
    }));

    filteredEmployees.forEach(emp => {
      if (emp.retirement_date) {
        const retirementMonth = new Date(emp.retirement_date).getMonth();
        monthData[retirementMonth].count++;
      }
    });

    return monthData;
  };

  const getDepartmentWiseData = () => {
    const deptCounts: { [key: string]: number } = {};
    
    filteredEmployees.forEach(emp => {
      const dept = emp.department_submitted || 'Not Assigned';
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

  const statusCounts = getStatusCounts();
  const monthWiseData = getMonthWiseData();
  const departmentWiseData = getDepartmentWiseData();
  const clerkWiseData = getClerkWiseData();

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
                  ? `Interactive Clerk View - ${userProfile?.name || 'Unknown Clerk'}`
                  : 'Global Administrative View'
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
                  <option value="">All Clerks (Global View)</option>
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
                <span className="text-sm font-medium">Refresh</span>
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
                <p className="text-sm text-gray-600 mb-1">Total Retirements</p>
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
                <p className="text-sm text-gray-600 mb-1">Processing</p>
                <p className="text-3xl font-bold text-orange-600">{statusCounts.processing}</p>
                <p className="text-xs text-gray-500">With submission data</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{statusCounts.completed}</p>
                <p className="text-xs text-gray-500">Pension approved</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-purple-600">{statusCounts.pending}</p>
                <p className="text-xs text-gray-500">Awaiting approval</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Month-wise Retirement Count</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {monthWiseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 w-20">
                  <span className="text-sm font-medium text-gray-700">{item.month} 25</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
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
              Showing 6 months centered around {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
            </p>
            <p className="text-xs text-gray-500">
              Data extracted from actual_retirement_data in employee_retirement table
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Department-wise Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Retirement Count</h3>
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
            <p className="text-xs text-gray-500 mt-3">Showing top 10 results</p>
          </div>

          {/* Designation vs Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Designation vs Employee Count</h3>
            <div className="space-y-3">
              {filteredEmployees.slice(0, 10).map((emp, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{emp.desination_time_of_retirement}</span>
                      <span className="text-sm text-gray-500">1</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">100%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clerk-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clerk-wise Employee Count</h3>
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
              <h3 className="text-lg font-semibold text-gray-900">Retirement Progress Tracker</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <Download className="h-4 w-4" />
                  <span className="text-sm">Export</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirement Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Clerk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? 'Loading retirement data...' : 'No retirement records found.'}
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
                          {employee.desination_time_of_retirement}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.assigned_clerk_name || 'Unassigned'}
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
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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
                            <button className="text-green-600 hover:text-green-900 p-1 rounded">
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
    </div>
  );
};