import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Calendar, 
  Building2, 
  UserCheck, 
  RefreshCw,
  Plus,
  Search,
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  X
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';

interface Clerk {
  user_id: string;
  name: string;
  role_name: string;
}

interface EmployeeDashboardProps {
  onBack?: () => void;
}

interface Employee {
  emp_id: string;
  emp_name: string;
  date_of_birth?: string;
  age?: number;
  dept_id: string;
  department_name?: string;
  office_id?: string;
  office_name?: string;
  designation: string;
  designation_id?: string;
  designation_name?: string;
  tal_id?: string;
  taluka_name?: string;
  retirement_date: string;
  reason?: string;
  assigned_clerk: string;
  assigned_clerk_name?: string;
  date_of_assignment?: string;
}

interface Department {
  dept_id: string;
  department: string;
}

interface Designation {
  designation_id: string;
  designation: string;
}

interface Taluka {
  tal_id: string;
  name: string;
}

interface OfficeLocation {
  office_id: string;
  name: string;
}

interface NewEmployee {
  emp_id: string;
  emp_name: string;
  date_of_birth: string;
  dept_id: string;
  designation_id: string;
  tal_id: string;
  office_id: string;
  retirement_date: string;
  assigned_clerk: string;
  reason: string;
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
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedClerk, setSelectedClerk] = useState('All Clerks');
  const [selectedReason, setSelectedReason] = useState('All Reasons');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    emp_id: '',
    emp_name: '',
    date_of_birth: '',
    dept_id: '',
    designation_id: '',
    tal_id: '',
    office_id: '',
    retirement_date: '',
    assigned_clerk: '',
    reason: 'नियत वयोमान'
  });

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Department name translation helper
  const translateDepartmentName = (deptName: string) => {
    const key = `erms.departments.${deptName}`;
    const translated = t(key);
    return translated !== key ? translated : deptName;
  };
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update KPI data whenever clerks change
  useEffect(() => {
    if (clerks.length > 0) {
      setKpiData(prev => ({
        ...prev,
        totalClerks: clerks.length
      }));
    }
  }, [clerks]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching Employee Dashboard Data...');
      
      let finalClerks: Clerk[] = [];
      
      // First, get the clerk role ID to avoid RLS recursion issues
      console.log('👥 Fetching clerk role ID...');
      const { data: clerkRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'clerk')
        .single();
      
      if (roleError) {
        console.error('❌ Role fetch error:', roleError);
        // Fallback: assume clerk role_id is 5 (common default)
        console.log('🔄 Using fallback clerk role_id = 5');
        const { data: clerksData, error: clerksError } = await supabase
          .from('user_roles')
          .select('user_id, name, role_id')
          .eq('role_id', 5);
          
        if (clerksError) {
          console.error('❌ Fallback clerks fetch error:', clerksError);
          setClerks([]);
        } else {
          const formattedClerks = clerksData?.map(clerk => ({
            user_id: clerk.user_id,
            name: clerk.name || 'Unknown',
            role_name: 'clerk'
          })) || [];
          finalClerks = formattedClerks;
          setClerks(formattedClerks);
          console.log('✅ Clerks fetched (fallback):', formattedClerks.length);
        }
      } else {
        // Now fetch clerks using the role_id to avoid recursion
        console.log('👥 Fetching clerks with role_id:', clerkRole.id);
        const { data: clerksData, error: clerksError } = await supabase
          .from('user_roles')
          .select('user_id, name, role_id')
          .eq('role_id', clerkRole.id);
          
        if (clerksError) {
          console.error('❌ Clerks fetch error:', clerksError);
          setClerks([]);
        } else {
          const formattedClerks = clerksData?.map(clerk => ({
            user_id: clerk.user_id,
            name: clerk.name || 'Unknown',
            role_name: 'clerk'
          })) || [];
          finalClerks = formattedClerks;
          setClerks(formattedClerks);
          console.log('✅ Clerks fetched:', formattedClerks.length);
        }
      }
      
      // Fetch employees
      console.log('📊 Fetching employees with joins from erms.employee...');
      const { data: employeesData, error: empError } = await ermsClient
        .from('employee')
        .select(`
          emp_id,
          employee_name,
          date_of_birth,
          dept_id,
          office_id,
          designation,
          designation_id,
          tal_id,
          retirement_date,
          reason,
          assigned_clerk,
          date_of_assignment,
          department:dept_id(dept_id, department),
          designations:designation_id(designation_id, designation),
          talukas:tal_id(tal_id, name),
          office_locations:office_id(office_id, name)
        `);
      
      if (empError) {
        console.error('❌ Employee fetch error:', empError);
        throw empError;
      }
      console.log('✅ Employees fetched:', employeesData?.length || 0);

      // Fetch departments
      console.log('🏢 Fetching departments from erms.department...');
      const { data: departmentsData, error: deptError } = await ermsClient
        .from('department')
        .select('*');
      
      if (deptError) {
        console.error('❌ Department fetch error:', deptError);
        throw deptError;
      }
      console.log('✅ Departments fetched:', departmentsData?.length || 0);

      // Fetch designations
      console.log('📋 Fetching designations from erms.designations...');
      const { data: designationsData, error: desigError } = await ermsClient
        .from('designations')
        .select('*');
      
      if (desigError) {
        console.error('❌ Designations fetch error:', desigError);
        throw desigError;
      }
      console.log('✅ Designations fetched:', designationsData?.length || 0);

      // Fetch talukas
      console.log('🗺️ Fetching talukas from erms.talukas...');
      const { data: talukasData, error: talError } = await ermsClient
        .from('talukas')
        .select('*');
      
      if (talError) {
        console.error('❌ Talukas fetch error:', talError);
        throw talError;
      }
      console.log('✅ Talukas fetched:', talukasData?.length || 0);

      // Fetch office locations
      console.log('🏢 Fetching office locations from erms.office_locations...');
      const { data: officesData, error: offError } = await ermsClient
        .from('office_locations')
        .select('*');
      
      if (offError) {
        console.error('❌ Office locations fetch error:', offError);
        throw offError;
      }
      console.log('✅ Office locations fetched:', officesData?.length || 0);

      setEmployees(employeesData || []);
      setDepartments(departmentsData || []);
      setDesignations(designationsData || []);
      setTalukas(talukasData || []);
      setOfficeLocations(officesData || []);
      
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

      console.log('📈 KPI Calculations:', {
        totalEmployees,
        upcomingRetirements,
        assignedEmployees,
        unassignedEmployees,
        totalClerks: finalClerks.length
      });
      setKpiData({
        totalEmployees,
        upcomingRetirements,
        departments: departmentsData?.length || 0,
        totalClerks: finalClerks.length,
        assignedEmployees,
        unassignedEmployees
      });

      // Calculate chart data
      calculateChartData(employeesData || [], departmentsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set some default data to show the UI structure
      setKpiData({
        totalEmployees: 0,
        upcomingRetirements: 0,
        departments: 0,
        totalClerks: 0,
        assignedEmployees: 0,
        unassignedEmployees: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChartData = (employeesData: Employee[], departmentsData: Department[]) => {
    console.log('📊 Calculating chart data...');
    
    // Department-wise count
    const deptCounts = departmentsData.map((dept, index) => {
      const count = employeesData.filter(emp => emp.dept_id === dept.dept_id).length;
      const percentage = employeesData.length > 0 ? Math.round((count / employeesData.length) * 100) : 0;
      return {
        name: translateDepartmentName(dept.department || dept.dept_id),
        count,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.count - a.count);

    // Get unique clerks from employee data
    const clerkCounts = new Map();
    employeesData.forEach(emp => {
      if (emp.assigned_clerk) {
        // Find clerk name by user_id
        const clerk = clerks.find(c => c.user_id === emp.assigned_clerk);
        const clerkName = clerk ? clerk.name : emp.assigned_clerk;
        clerkCounts.set(clerkName, (clerkCounts.get(clerkName) || 0) + 1);
      }
    });
    
    const clerkWiseCount = [
      ...Array.from(clerkCounts.entries()).map(([clerk, count], index) => {
        const maxCount = Math.max(...clerkCounts.values());
        const percentage = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
        return {
          name: clerk,
          count,
          percentage,
          color: colors[index % colors.length]
        };
      }).sort((a, b) => b.count - a.count)
    ];

    // Retirement reasons
    const reasonCounts = new Map();
    employeesData.forEach(emp => {
      if (emp.reason) {
        reasonCounts.set(emp.reason, (reasonCounts.get(emp.reason) || 0) + 1);
      }
    });
    
    const retirementReasons = Array.from(reasonCounts.entries()).map(([reason, count], index) => {
      const maxCount = Math.max(...reasonCounts.values());
      const percentage = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
      return {
        reason,
        count,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.count - a.count);

    console.log('📊 Chart data calculated:', {
      deptCounts: deptCounts.length,
      clerkWiseCount: clerkWiseCount.length,
      retirementReasons: retirementReasons.length
    });
    setChartData({
      departmentWiseCount: deptCounts,
      clerkWiseCount,
      assignedVsUnassigned: {
        assigned: employeesData.filter(emp => emp.assigned_clerk).length,
        unassigned: employeesData.filter(emp => !emp.assigned_clerk).length
      },
      retirementReasons
    });
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.emp_id || !newEmployee.emp_name || !newEmployee.dept_id || !newEmployee.date_of_birth) {
      alert(t('erms.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .insert({
          emp_id: newEmployee.emp_id,
          emp_name: newEmployee.emp_name,
          date_of_birth: newEmployee.date_of_birth,
          dept_id: newEmployee.dept_id,
          designation_id: newEmployee.designation_id,
          tal_id: newEmployee.tal_id,
          office_id: newEmployee.office_id,
          retirement_date: newEmployee.retirement_date || null,
          assigned_clerk: newEmployee.assigned_clerk || null,
          reason: newEmployee.reason || null
        });

      if (error) throw error;

      // Reset form and close modal
      setNewEmployee({
        emp_id: '',
        emp_name: '',
        date_of_birth: '',
        dept_id: '',
        designation_id: '',
        tal_id: '',
        office_id: '',
        retirement_date: '',
        assigned_clerk: '',
        reason: 'नियत वयोमान'
      });
      setShowAddModal(false);
      
      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee({
      emp_id: employee.emp_id,
      emp_name: employee.emp_name,
      date_of_birth: employee.date_of_birth || '',
      dept_id: employee.dept_id,
      designation_id: employee.designation_id || '',
      tal_id: employee.tal_id || '',
      office_id: employee.office_id || '',
      retirement_date: employee.retirement_date || '',
      assigned_clerk: employee.assigned_clerk || '',
      reason: employee.reason || 'नियत वयोमान'
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!newEmployee.emp_id || !newEmployee.emp_name || !newEmployee.dept_id || !newEmployee.date_of_birth) {
      alert(t('erms.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .update({
          emp_name: newEmployee.emp_name,
          date_of_birth: newEmployee.date_of_birth,
          dept_id: newEmployee.dept_id,
          designation_id: newEmployee.designation_id,
          tal_id: newEmployee.tal_id,
          office_id: newEmployee.office_id,
          retirement_date: newEmployee.retirement_date || null,
          assigned_clerk: newEmployee.assigned_clerk || null,
          reason: newEmployee.reason || null
        })
        .eq('emp_id', editingEmployee?.emp_id);

      if (error) throw error;

      // Reset form and close modal
      setNewEmployee({
        emp_id: '',
        emp_name: '',
        date_of_birth: '',
        dept_id: '',
        designation_id: '',
        tal_id: '',
        office_id: '',
        retirement_date: '',
        assigned_clerk: '',
        reason: 'नियत वयोमान'
      });
      setShowEditModal(false);
      setEditingEmployee(null);
      
      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error updating employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.emp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === t('erms.allDepartments') || emp.dept_id === selectedDepartment;
    const matchesClerk = selectedClerk === t('erms.allClerks') || emp.assigned_clerk === selectedClerk;
    const matchesReason = selectedReason === t('erms.allReasons') || emp.reason === selectedReason;
    
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
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('erms.employeeDashboardTitle')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('erms.employeeDashboardSubtitle')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchDashboardData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">{t('erms.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalEmployees')}</p>
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
                <p className="text-sm text-gray-600 mb-1">{t('erms.upcomingRetirements')}</p>
                <p className="text-2xl font-bold text-orange-600">{kpiData.upcomingRetirements}</p>
                <p className="text-xs text-gray-500">{t('erms.nextSixMonths')}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalDepartments')}</p>
                <p className="text-2xl font-bold text-green-600">{kpiData.departments}</p>
                <p className="text-xs text-gray-500">{t('erms.activeDepartments')}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalClerks')}</p>
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
                <p className="text-sm text-gray-600 mb-1">{t('erms.assignedUnassigned')}</p>
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
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.departmentWiseEmployeeCount')}</h3>
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
              <p className="text-xs text-gray-500 mt-2">{t('erms.showingTopResults', { count: 10 })}</p>
            </div>
          </div>

          {/* Clerk-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.clerkWiseEmployeeCount')}</h3>
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
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.assignedVsUnassignedEmployees')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600">{t('erms.assigned')}</div>
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
                <div className="w-20 text-sm text-gray-600">{t('erms.unassigned')}</div>
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
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.employeeRetirementCountByReason')}</h3>
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
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.employeeRecords')}</h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">{t('erms.addEmployee')}</span>
              </button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>{t('erms.allDepartments')}</option>
                {departments.map(dept => (
                  <option key={dept.dept_id} value={dept.dept_id}>{translateDepartmentName(dept.department)}</option>
                ))}
              </select>
              
              <select
                value={selectedClerk}
                onChange={(e) => setSelectedClerk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>{t('erms.allClerks')}</option>
                {clerks.map(clerk => (
                  <option key={clerk.user_id} value={clerk.user_id}>
                    {clerk.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>{t('erms.allReasons')}</option>
                <option value="नियत वयोमान">नियत वयोमान</option>
                <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                <option value="स्वेच्छा सेवा निवृत्ती">स्वेच्छा सेवा निवृत्ती</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('erms.showingEmployees', { filtered: filteredEmployees.length, total: employees.length })}
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment(t('erms.allDepartments'));
                  setSelectedClerk(t('erms.allClerks'));
                  setSelectedReason(t('erms.allReasons'));
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('erms.clearFilters')}
              </button>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employeeId')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employeeName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.dateOfBirth')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.age')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.departmentName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.officeName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.designationName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.talukaName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementReason')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerkName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.dateOfAssignment')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.emp_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.emp_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.emp_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.date_of_birth ? calculateAge(employee.date_of_birth) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department?.department || employee.dept_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.office_locations?.name || employee.office_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.designations?.designation || employee.designation || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.talukas?.name || employee.tal_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.assigned_clerk ? 
                        (clerks.find(c => c.user_id === employee.assigned_clerk)?.name || employee.assigned_clerk) : 
                        <span className="text-gray-400 italic">{t('erms.unassigned')}</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.date_of_assignment ? new Date(employee.date_of_assignment).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.addEmployee')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.employeeName')}
                  </label>
                  <input
                    type="text"
                    value={newEmployee.emp_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emp_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeName')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={newEmployee.date_of_birth}
                    onChange={(e) => setNewEmployee({ ...newEmployee, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterDateOfBirth')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.department')}
                  </label>
                  <select
                    value={newEmployee.dept_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, dept_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDepartment')}</option>
                    {departments.map(dept => (
                      <option key={dept.dept_id} value={dept.dept_id}>
                        {translateDepartmentName(dept.department)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.designation')}
                  </label>
                  <select
                    value={newEmployee.designation_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDesignation')}</option>
                    {designations.map(desig => (
                      <option key={desig.designation_id} value={desig.designation_id}>
                        {desig.designation}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.taluka')}
                  </label>
                  <select
                    value={newEmployee.tal_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, tal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectTaluka')}</option>
                    {talukas.map(taluka => (
                      <option key={taluka.tal_id} value={taluka.tal_id}>
                        {taluka.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.office')}
                  </label>
                  <select
                    value={newEmployee.office_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, office_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectOffice')}</option>
                    {officeLocations.map(office => (
                      <option key={office.office_id} value={office.office_id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.retirementDate')}
                  </label>
                  <input
                    type="date"
                    value={newEmployee.retirement_date}
                    onChange={(e) => setNewEmployee({ ...newEmployee, retirement_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.assignedClerk')}
                  </label>
                  <select
                    value={newEmployee.assigned_clerk}
                    onChange={(e) => setNewEmployee({ ...newEmployee, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectClerk')}</option>
                    {clerks.map(clerk => (
                      <option key={clerk.user_id} value={clerk.user_id}>{clerk.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.retirementReason')}
                  </label>
                  <select
                    value={newEmployee.reason}
                    onChange={(e) => setNewEmployee({ ...newEmployee, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectReason')}</option>
                    <option value="नियत वयोमान">नियत वयोमान</option>
                    <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                    <option value="स्वेच्छा सेवा निवृत्ती">स्वेच्छा सेवा निवृत्ती</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('erms.adding') : t('erms.addEmployee')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.editEmployee')}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.employeeId')}
                  </label>
                  <input
                    type="text"
                    value={newEmployee.emp_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.employeeName')}
                  </label>
                  <input
                    type="text"
                    value={newEmployee.emp_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emp_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeName')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={newEmployee.date_of_birth}
                    onChange={(e) => setNewEmployee({ ...newEmployee, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.department')}
                  </label>
                  <select
                    value={newEmployee.dept_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, dept_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDepartment')}</option>
                    {departments.map(dept => (
                      <option key={dept.dept_id} value={dept.dept_id}>
                        {translateDepartmentName(dept.department)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.designation')}
                  </label>
                  <select
                    value={newEmployee.designation_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDesignation')}</option>
                    {designations.map(desig => (
                      <option key={desig.designation_id} value={desig.designation_id}>
                        {desig.designation}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.taluka')}
                  </label>
                  <select
                    value={newEmployee.tal_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, tal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectTaluka')}</option>
                    {talukas.map(taluka => (
                      <option key={taluka.tal_id} value={taluka.tal_id}>
                        {taluka.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.office')}
                  </label>
                  <select
                    value={newEmployee.office_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, office_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectOffice')}</option>
                    {officeLocations.map(office => (
                      <option key={office.office_id} value={office.office_id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.retirementDate')}
                  </label>
                  <input
                    type="date"
                    value={newEmployee.retirement_date}
                    onChange={(e) => setNewEmployee({ ...newEmployee, retirement_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.assignedClerk')}
                  </label>
                  <select
                    value={newEmployee.assigned_clerk}
                    onChange={(e) => setNewEmployee({ ...newEmployee, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectClerk')}</option>
                    {clerks.map(clerk => (
                      <option key={clerk.user_id} value={clerk.user_id}>{clerk.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.retirementReason')}
                  </label>
                  <select
                    value={newEmployee.reason}
                    onChange={(e) => setNewEmployee({ ...newEmployee, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectReason')}</option>
                    <option value="नियत वयोमान">नियत वयोमान</option>
                    <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                    <option value="स्वेच्छा सेवा निवृत्ती">स्वेच्छा सेवा निवृत्ती</option>
                  </select>
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
                {isLoading ? t('erms.updating') : t('erms.updateEmployee')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};