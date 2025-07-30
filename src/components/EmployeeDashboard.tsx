import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Calendar, 
  Building2, 
  UserCheck, 
  UserX,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { ermsClient } from '../lib/supabase';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  emp_id: string;
  emp_name: string;
  dept_id: string;
  designation: string;
  age: number;
  retirement_date: string;
  assigned_clerk: string;
  reason?: string;
}

interface Department {
  dept_id: string;
  dept_name: string;
}

interface KPIData {
  totalEmployees: number;
  upcomingRetirements: number;
  departments: number;
  totalClerks: number;
  assignedEmployees: number;
  unassignedEmployees: number;
}

interface ChartData {
  departmentWiseCount: { name: string; count: number; percentage: number; color: string }[];
  clerkWiseCount: { name: string; count: number; percentage: number; color: string }[];
  assignedVsUnassigned: { assigned: number; unassigned: number };
  retirementReasons: { reason: string; count: number; percentage: number; color: string }[];
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [kpiData, setKpiData] = useState<KPIData>({
    totalEmployees: 0,
    upcomingRetirements: 0,
    departments: 0,
    totalClerks: 0,
    assignedEmployees: 0,
    unassignedEmployees: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    departmentWiseCount: [],
    clerkWiseCount: [],
    assignedVsUnassigned: { assigned: 0, unassigned: 0 },
    retirementReasons: []
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedClerk, setSelectedClerk] = useState('All Clerks');
  const [selectedReason, setSelectedReason] = useState('All Reasons');

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch employees
      const { data: employeesData, error: empError } = await ermsClient
        .from('employee')
        .select('*');
      
      if (empError) throw empError;

      // Fetch departments
      const { data: departmentsData, error: deptError } = await ermsClient
        .from('department')
        .select('*');
      
      if (deptError) throw deptError;

      setEmployees(employeesData || []);
      setDepartments(departmentsData || []);

      // Calculate KPIs
      const totalEmployees = employeesData?.length || 0;
      const upcomingRetirements = employeesData?.filter(emp => {
        if (!emp.retirement_date) return false;
        const retirementDate = new Date(emp.retirement_date);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return retirementDate <= sixMonthsFromNow;
      }).length || 0;

      const assignedEmployees = employeesData?.filter(emp => emp.assigned_clerk).length || 0;
      const unassignedEmployees = totalEmployees - assignedEmployees;

      setKpiData({
        totalEmployees,
        upcomingRetirements,
        departments: departmentsData?.length || 0,
        totalClerks: 16, // Mock data as per image
        assignedEmployees,
        unassignedEmployees
      });

      // Calculate chart data
      calculateChartData(employeesData || [], departmentsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChartData = (employeesData: Employee[], departmentsData: Department[]) => {
    // Department-wise count
    const deptCounts = departmentsData.map((dept, index) => {
      const count = employeesData.filter(emp => emp.dept_id === dept.dept_id).length;
      const percentage = employeesData.length > 0 ? Math.round((count / employeesData.length) * 100) : 0;
      return {
        name: dept.dept_name,
        count,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.count - a.count);

    // Mock clerk-wise data (as per image)
    const clerkWiseCount = [
      { name: 'pr@chandrapur', count: 8, percentage: 100, color: colors[0] },
      { name: 'pr@chandrapur', count: 7, percentage: 88, color: colors[1] },
      { name: 'pr@chandrapur', count: 5, percentage: 63, color: colors[2] },
      { name: 'pr@mul', count: 5, percentage: 63, color: colors[3] },
      { name: 'pr@ballarshah', count: 4, percentage: 50, color: colors[4] },
      { name: 'health@chandrapur', count: 3, percentage: 38, color: colors[5] },
      { name: 'pr@chimur', count: 3, percentage: 38, color: colors[6] },
      { name: 'pr@warora', count: 3, percentage: 38, color: colors[7] },
      { name: 'pr@chandrapur', count: 3, percentage: 38, color: colors[8] },
      { name: 'pr@chandrapur', count: 3, percentage: 38, color: colors[9] }
    ];

    // Retirement reasons
    const retirementReasons = [
      { reason: 'Superannuation', count: 12, percentage: 100, color: colors[0] },
      { reason: 'Voluntary Retirement', count: 1, percentage: 8, color: colors[1] },
      { reason: 'Death', count: 0, percentage: 0, color: colors[2] }
    ];

    setChartData({
      departmentWiseCount: deptCounts,
      clerkWiseCount,
      assignedVsUnassigned: {
        assigned: kpiData.assignedEmployees,
        unassigned: kpiData.unassignedEmployees
      },
      retirementReasons
    });
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.emp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || emp.dept_id === selectedDepartment;
    const matchesClerk = selectedClerk === 'All Clerks' || emp.assigned_clerk === selectedClerk;
    const matchesReason = selectedReason === 'All Reasons' || emp.reason === selectedReason;
    
    return matchesSearch && matchesDepartment && matchesClerk && matchesReason;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Employee Dashboard</h1>
                <p className="text-sm text-gray-500">Comprehensive employee management and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Employee</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalEmployees}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming Retirements</p>
                <p className="text-2xl font-bold text-orange-600">{kpiData.upcomingRetirements}</p>
                <p className="text-xs text-gray-500">Next 6 months</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Departments</p>
                <p className="text-2xl font-bold text-green-600">{kpiData.departments}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Clerks</p>
                <p className="text-2xl font-bold text-purple-600">{kpiData.totalClerks}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned/Unassigned</p>
                <p className="text-2xl font-bold text-indigo-600">{kpiData.assignedEmployees}/{kpiData.unassignedEmployees}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Department-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Department-wise Employee Count</h3>
            </div>
            <div className="space-y-3">
              {chartData.departmentWiseCount.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-32 text-sm text-gray-600 truncate">{item.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-12 text-right">{item.percentage}%</div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">Showing top 10 results</p>
            </div>
          </div>

          {/* Clerk-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clerk-wise Employee Count</h3>
            </div>
            <div className="space-y-3">
              {chartData.clerkWiseCount.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-32 text-sm text-gray-600 truncate">{item.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-12 text-right">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned vs Unassigned */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Assigned vs Unassigned Employees</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600">Assigned</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ 
                      width: `${kpiData.totalEmployees > 0 ? (kpiData.assignedEmployees / kpiData.totalEmployees) * 100 : 0}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-900 w-12 text-right">
                  {kpiData.totalEmployees > 0 ? Math.round((kpiData.assignedEmployees / kpiData.totalEmployees) * 100) : 0}%
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600">Unassigned</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ 
                      width: `${kpiData.totalEmployees > 0 ? (kpiData.unassignedEmployees / kpiData.totalEmployees) * 100 : 0}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-900 w-12 text-right">
                  {kpiData.totalEmployees > 0 ? Math.round((kpiData.unassignedEmployees / kpiData.totalEmployees) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Employee Retirement Count by Reason */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Employee Retirement Count by Reason</h3>
            </div>
            <div className="space-y-3">
              {chartData.retirementReasons.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-32 text-sm text-gray-600">{item.reason}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-12 text-right">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Employee Records</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Clear Filters
              </button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Departments</option>
                {departments.map(dept => (
                  <option key={dept.dept_id} value={dept.dept_id}>{dept.dept_name}</option>
                ))}
              </select>
              
              <select
                value={selectedClerk}
                onChange={(e) => setSelectedClerk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Clerks</option>
                <option>pr@chandrapur</option>
                <option>pr@mul</option>
                <option>pr@ballarshah</option>
                <option>health@chandrapur</option>
              </select>
              
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Reasons</option>
                <option>Retirement Due to Death</option>
                <option>Retirement Due to Prescribed Age</option>
                <option>Voluntary Retirement</option>
              </select>
            </div>
            
            <p className="text-sm text-gray-500">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirement Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Clerk</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.emp_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.emp_name}</div>
                        <div className="text-sm text-gray-500">{employee.emp_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {departments.find(d => d.dept_id === employee.dept_id)?.dept_name || employee.dept_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.age}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.assigned_clerk || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};