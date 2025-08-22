import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Calendar,
  UserCheck,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  emp_id: string;
  employee_name: string;
  date_of_birth: string | null;
  dept_id: string;
  designation_id: string;
  office_id: string;
  retirement_date: string | null;
  reason: string;
  assigned_clerk: string;
  date_of_assignment: string | null;
  panchayatraj_sevarth_id: string | null;
  ddo_code: string | null;
  cadre: string;
  post_name?: string;
  appointing_department?: string;
  working_office_name?: string;
  date_of_joining?: string;
  date_of_service_expiry?: string;
  created_at?: string;
  updated_at?: string;
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

interface Clerk {
  user_id: string;
  name: string;
  role_name: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);

  // Form state for new/edit employee
  const [newEmployee, setNewEmployee] = useState<Employee>({
    emp_id: '',
    employee_name: '',
    date_of_birth: '',
    dept_id: '',
    designation_id: '',
    office_id: '',
    retirement_date: '',
    reason: '',
    assigned_clerk: '',
    date_of_assignment: '',
    panchayatraj_sevarth_id: '',
    ddo_code: '',
    cadre: '',
    post_name: '',
    appointing_department: '',
    working_office_name: '',
    date_of_joining: '',
    date_of_service_expiry: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchDepartments(),
        fetchDesignations(),
        fetchTalukas(),
        fetchOfficeLocations(),
        fetchClerks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await ermsClient
        .from('employee')
        .select('*')
        .order('employee_name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await ermsClient
        .from('department')
        .select('dept_id, department')
        .order('department');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const { data, error } = await ermsClient
        .from('designations')
        .select('designation_id, designation')
        .order('designation');
      
      if (error) throw error;
      setDesignations(data || []);
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  const fetchTalukas = async () => {
    try {
      const { data, error } = await ermsClient
        .from('talukas')
        .select('tal_id, name')
        .order('name');
      
      if (error) throw error;
      setTalukas(data || []);
    } catch (error) {
      console.error('Error fetching talukas:', error);
    }
  };

  const fetchOfficeLocations = async () => {
    try {
      const { data, error } = await ermsClient
        .from('office_locations')
        .select('office_id, name')
        .order('name');
      
      if (error) throw error;
      setOfficeLocations(data || []);
    } catch (error) {
      console.error('Error fetching office locations:', error);
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
        role_name: clerk.roles?.name || 'Unknown'
      })) || [];
      
      setClerks(clerksData);
    } catch (error) {
      console.error('Error fetching clerks:', error);
    }
  };

  const translateDepartmentName = (departmentName: string) => {
    const translations = t('erms.departments', { returnObjects: true }) as Record<string, string>;
    return translations[departmentName] || departmentName;
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.emp_id || !newEmployee.employee_name || !newEmployee.cadre) {
      alert('Please fill in Employee ID, Employee Name, and Cadre (required fields)');
      return;
    }

    setIsLoading(true);
    try {
      // Transform empty strings to null for date fields
      const employeeData = {
        ...newEmployee,
        date_of_birth: newEmployee.date_of_birth === '' ? null : newEmployee.date_of_birth,
        retirement_date: newEmployee.retirement_date === '' ? null : newEmployee.retirement_date,
        date_of_assignment: newEmployee.date_of_assignment === '' ? null : newEmployee.date_of_assignment
      };

      const { error } = await ermsClient
        .from('employee')
        .insert([employeeData]);

      if (error) throw error;
      
      await fetchEmployees();
      setShowAddModal(false);
      setNewEmployee({
        emp_id: '',
        employee_name: '',
        date_of_birth: '',
        dept_id: '',
        designation_id: '',
        office_id: '',
        retirement_date: '',
        reason: '',
        assigned_clerk: '',
        date_of_assignment: '',
        panchayatraj_sevarth_id: '',
        ddo_code: '',
        cadre: ''
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee(employee);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!newEmployee.emp_id || !newEmployee.employee_name || !newEmployee.cadre) {
      alert('Please fill in Employee ID, Employee Name, and Cadre (required fields)');
      return;
    }

   // Validate date of birth if provided
   if (newEmployee.date_of_birth) {
     const birthDate = new Date(newEmployee.date_of_birth);
     const minDate = new Date('1900-01-01');
     const maxDate = new Date();
     
     if (birthDate < minDate || birthDate > maxDate) {
       alert('Please enter a valid date of birth between 1900 and today.');
       return;
     }
   }
    setIsLoading(true);
    try {
      // Transform empty strings to null for date fields
      const employeeData = {
        ...newEmployee,
        date_of_birth: newEmployee.date_of_birth === '' ? null : newEmployee.date_of_birth,
        retirement_date: newEmployee.retirement_date === '' ? null : newEmployee.retirement_date,
        date_of_assignment: newEmployee.date_of_assignment === '' ? null : newEmployee.date_of_assignment
      };

      const { error } = await ermsClient
        .from('employee')
        .update(employeeData)
        .eq('emp_id', newEmployee.emp_id);

      if (error) throw error;
      
      await fetchEmployees();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!confirm(t('common.deleteConfirm'))) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .delete()
        .eq('emp_id', empId);

      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      const searchFields = [
        employee.emp_id,
        employee.employee_name,
        departments.find(d => d.dept_id === employee.dept_id)?.department,
        officeLocations.find(o => o.office_id === employee.office_id)?.name,
        employee.reason
      ];

      const matchesSearch = searchTerm === '' || searchFields.some(field => {
        if (field === null || field === undefined) return false;
        return String(field).toLowerCase().includes(searchTerm.toLowerCase());
      });

      const matchesDepartment = selectedDepartment === '' || employee.dept_id === selectedDepartment;
      const matchesClerk = selectedClerk === '' || employee.assigned_clerk === selectedClerk;
      const matchesReason = selectedReason === '' || employee.reason === selectedReason;

      return matchesSearch && matchesDepartment && matchesClerk && matchesReason;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
    setSelectedReason('');
  };

  const getKPIData = () => {
    const totalEmployees = employees.length;
    const upcomingRetirements = employees.filter(emp => {
      if (!emp.retirement_date) return false;
      const retirementDate = new Date(emp.retirement_date);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return retirementDate <= sixMonthsFromNow && retirementDate >= new Date();
    }).length;

    const assignedEmployees = employees.filter(emp => emp.assigned_clerk).length;
    const unassignedEmployees = totalEmployees - assignedEmployees;

    return {
      totalEmployees,
      upcomingRetirements,
      assignedEmployees,
      unassignedEmployees
    };
  };

  const getDepartmentWiseData = () => {
    const departmentCounts = departments.map(dept => {
      const count = employees.filter(emp => emp.dept_id === dept.dept_id).length;
      return {
        name: dept.department, // Keep original Marathi names
        count,
        percentage: employees.length > 0 ? Math.round((count / employees.length) * 100) : 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

    return departmentCounts.slice(0, 10); // Top 10
  };

  const getClerkWiseData = () => {
    // Add "Unassigned" as a special case
    const unassignedCount = employees.filter(emp => !emp.assigned_clerk || emp.assigned_clerk === '').length;
    
    const clerkCounts = [
      {
        name: 'अनियुक्त', // Unassigned in Marathi
        count: unassignedCount,
        percentage: employees.length > 0 ? Math.round((unassignedCount / employees.length) * 100) : 0,
        color: '#ef4444' // Red color for unassigned
      },
      ...clerks.map(clerk => {
      const count = employees.filter(emp => emp.assigned_clerk === clerk.user_id).length;
      return {
        name: `${clerk.name} (${clerk.role_name})`,
        count,
        percentage: employees.length > 0 ? Math.round((count / employees.length) * 100) : 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    })].filter(item => item.count > 0).sort((a, b) => b.count - a.count);

    return clerkCounts.slice(0, 10); // Top 10
  };

  const getRetirementReasonData = () => {
    const reasons = ['नियत वयोमान', 'मृत्यू झाल्याने', 'स्वेच्छा सेवा निवृत्ती'];
    const reasonCounts = reasons.map(reason => {
      const count = employees.filter(emp => emp.reason === reason).length;
      return {
        name: reason,
        count,
        percentage: employees.length > 0 ? Math.round((count / employees.length) * 100) : 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    }).filter(item => item.count > 0);

    return reasonCounts;
  };

  const kpiData = getKPIData();
  const departmentWiseData = getDepartmentWiseData();
  const clerkWiseData = getClerkWiseData();
  const retirementReasonData = getRetirementReasonData();
  const filteredEmployees = getFilteredEmployees();

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
                onClick={fetchAllData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">{t('erms.refresh')}</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">{t('erms.addEmployee')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalEmployees')}</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalEmployees}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.upcomingRetirements')}</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.upcomingRetirements}</p>
                <p className="text-xs text-gray-500">{t('erms.nextSixMonths')}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.assignedUnassigned')}</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.assignedEmployees}/{kpiData.unassignedEmployees}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalDepartments')}</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                <p className="text-xs text-gray-500">{t('erms.activeDepartments')}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Department-wise Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseEmployeeCount')}</h3>
            <div className="space-y-3">
              {departmentWiseData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: item.percentage + '%',
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {departmentWiseData.length > 5 && (
              <p className="text-xs text-gray-500 mt-3">{t('erms.showingTopResults', { count: 5 })}</p>
            )}
          </div>

          {/* Clerk-wise Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.clerkWiseEmployeeCount')}</h3>
            <div className="space-y-3">
              {clerkWiseData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: item.percentage + '%',
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned vs Unassigned */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.assignedVsUnassignedEmployees')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{t('erms.assigned')}</span>
                    <span className="text-sm text-gray-500">{kpiData.assignedEmployees}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{
                        width: kpiData.totalEmployees > 0 ? (kpiData.assignedEmployees / kpiData.totalEmployees * 100) + '%' : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{t('erms.unassigned')}</span>
                    <span className="text-sm text-gray-500">{kpiData.unassignedEmployees}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{
                        width: kpiData.totalEmployees > 0 ? (kpiData.unassignedEmployees / kpiData.totalEmployees * 100) + '%' : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retirement Reasons Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.employeeRetirementCountByReason')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {retirementReasonData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-sm text-gray-500">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: item.percentage + '%',
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.department}
                  </option>
                ))}
              </select>

              <select
                value={selectedClerk}
                onChange={(e) => setSelectedClerk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.allClerks')}</option>
                <option value="unassigned">अनियुक्त (Unassigned)</option>
                {clerks.map(clerk => (
                  <option key={clerk.user_id} value={clerk.user_id}>
                    {clerk.name} ({clerk.role_name})
                  </option>
                ))}
              </select>

              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.allReasons')}</option>
                <option value="नियत वयोमान">नियत वयोमान</option>
                <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                <option value="स्वेच्छा सेवा निवृत्ती">स्वेच्छा सेवा निवृत्ती</option>
              </select>

              <button
                onClick={clearFilters}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">{t('erms.clearFilters')}</span>
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {t('erms.showingEmployees', { filtered: filteredEmployees.length, total: employees.length })}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employeeName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panchayatraj Sevarth ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DDO Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No employees found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.emp_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.emp_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.employee_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.cadre || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.panchayatraj_sevarth_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.ddo_code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.assigned_clerk ? 
                          clerks.find(c => c.user_id === employee.assigned_clerk)?.name || t('erms.unassigned') 
                          : t('erms.unassigned')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.emp_id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
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
                    {t('erms.employeeId')}
                  </label>
                  <input
                    type="text"
                    value={newEmployee.emp_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emp_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeId')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.employeeName')}
                  </label>
                  <input
                    type="text"
                    value={newEmployee.employee_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employee_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeName')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cadre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.cadre}
                    onChange={(e) => setNewEmployee({ ...newEmployee, cadre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter cadre"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Panchayatraj Sevarth ID
                  </label>
                  <input
                    type="text"
                    value={newEmployee.panchayatraj_sevarth_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, panchayatraj_sevarth_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Panchayatraj Sevarth ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DDO Code
                  </label>
                  <input
                    type="text"
                    value={newEmployee.ddo_code}
                    onChange={(e) => setNewEmployee({ ...newEmployee, ddo_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter DDO Code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.dateOfBirth')}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={newEmployee.date_of_birth}
                      onChange={(e) => setNewEmployee({ ...newEmployee, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1900-01-01"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <div className="text-xs text-gray-500">
                      Or type manually: DD-MM-YYYY (e.g., 06-02-1962)
                    </div>
                    <input
                      type="text"
                      placeholder="DD-MM-YYYY (e.g., 06-02-1962)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      onChange={(e) => {
                        const value = e.target.value;
                        // Convert DD-MM-YYYY to YYYY-MM-DD for date input
                        if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
                          const [day, month, year] = value.split('-');
                          const isoDate = `${year}-${month}-${day}`;
                          setNewEmployee({ ...newEmployee, date_of_birth: isoDate });
                        }
                      }}
                    />
                  </div>
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
                        {dept.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.designation')} (Optional)
                  </label>
                  <select
                    value={newEmployee.designation_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDesignation')}</option>
                    {designations.map(designation => (
                      <option key={designation.designation_id} value={designation.designation_id}>
                        {designation.designation}
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
                    {t('erms.assignedClerk')}
                  </label>
                  <select
                    value={newEmployee.assigned_clerk}
                    onChange={(e) => setNewEmployee({ ...newEmployee, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectClerk')}</option>
                    <option value="">अनियुक्त (Unassigned)</option>
                    {clerks.map(clerk => (
                      <option key={clerk.user_id} value={clerk.user_id}>
                        {clerk.name} ({clerk.role_name})
                      </option>
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
                    value={newEmployee.employee_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employee_name: e.target.value })}
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
                        {dept.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.designation')} (Optional)
                  </label>
                  <select
                    value={newEmployee.designation_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDesignation')}</option>
                    {designations.map(designation => (
                      <option key={designation.designation_id} value={designation.designation_id}>
                        {designation.designation}
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
                    {t('erms.assignedClerk')}
                  </label>
                  <select
                    value={newEmployee.assigned_clerk}
                    onChange={(e) => setNewEmployee({ ...newEmployee, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectClerk')}</option>
                    <option value="">अनियुक्त (Unassigned)</option>
                    {clerks.map(clerk => (
                      <option key={clerk.user_id} value={clerk.user_id}>
                        {clerk.name} ({clerk.role_name})
                      </option>
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