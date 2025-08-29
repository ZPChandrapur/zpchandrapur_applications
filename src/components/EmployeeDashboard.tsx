import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Calendar,
  Building2,
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  id: string;
  emp_id: string;
  employee_name: string;
  date_of_birth: string;
  age: number;
  department: string;
  designation: string;
  retirement_date: string;
  reason: string;
  assigned_clerk: string;
  dept_id: string;
  office_id: string;
  panchayatrajsevarth_id: string;
  ddo_code: string;
  cadre: string;
  post_name: string;
  appointing_department: string;
  working_office_name: string;
  date_of_joining: string;
  date_of_service_expiry: string;
  created_at: string;
  updated_at: string;
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

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Form data
  const [formData, setFormData] = useState({
    emp_id: '',
    employee_name: '',
    date_of_birth: '',
    age: '',
    department: '',
    designation: '',
    retirement_date: '',
    reason: '',
    assigned_clerk: '',
    dept_id: '',
    office_id: '',
    panchayatrajsevarth_id: '',
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

  useEffect(() => {
    filterEmployees();
    setCurrentPage(1);
  }, [employees, searchTerm, selectedDepartment, selectedClerk, selectedReason]);

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
        role_name: clerk.roles?.name || 'clerk'
      })) || [];
      
      setClerks(clerksData);
    } catch (error) {
      console.error('Error fetching clerks:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    if (selectedClerk) {
      filtered = filtered.filter(emp => emp.assigned_clerk === selectedClerk);
    }

    if (selectedReason) {
      filtered = filtered.filter(emp => emp.reason === selectedReason);
    }

    setFilteredEmployees(filtered);
  };

  const getPaginatedEmployees = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredEmployees.length / recordsPerPage);
  };

  const handleAddEmployee = () => {
    setFormData({
      emp_id: '',
      employee_name: '',
      date_of_birth: '',
      age: '',
      department: '',
      designation: '',
      retirement_date: '',
      reason: '',
      assigned_clerk: '',
      dept_id: '',
      office_id: '',
      panchayatrajsevarth_id: '',
      ddo_code: '',
      cadre: '',
      post_name: '',
      appointing_department: '',
      working_office_name: '',
      date_of_joining: '',
      date_of_service_expiry: ''
    });
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setFormData({
      emp_id: employee.emp_id,
      employee_name: employee.employee_name,
      date_of_birth: employee.date_of_birth || '',
      age: employee.age?.toString() || '',
      department: employee.department || '',
      designation: employee.designation || '',
      retirement_date: employee.retirement_date || '',
      reason: employee.reason || '',
      assigned_clerk: employee.assigned_clerk || '',
      dept_id: employee.dept_id || '',
      office_id: employee.office_id || '',
      panchayatrajsevarth_id: employee.panchayatrajsevarth_id || '',
      ddo_code: employee.ddo_code || '',
      cadre: employee.cadre || '',
      post_name: employee.post_name || '',
      appointing_department: employee.appointing_department || '',
      working_office_name: employee.working_office_name || '',
      date_of_joining: employee.date_of_joining || '',
      date_of_service_expiry: employee.date_of_service_expiry || ''
    });
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!formData.emp_id || !formData.employee_name) {
      alert(t('common.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const employeeData = {
        emp_id: formData.emp_id,
        employee_name: formData.employee_name,
        date_of_birth: formData.date_of_birth || null,
        age: formData.age ? parseInt(formData.age) : null,
        department: formData.department || null,
        designation: formData.designation || null,
        retirement_date: formData.retirement_date || null,
        reason: formData.reason || null,
        assigned_clerk: formData.assigned_clerk || null,
        dept_id: formData.dept_id || null,
        office_id: formData.office_id || null,
        panchayatrajsevarth_id: formData.panchayatrajsevarth_id || null,
        ddo_code: formData.ddo_code || null,
        cadre: formData.cadre || null,
        post_name: formData.post_name || null,
        appointing_department: formData.appointing_department || null,
        working_office_name: formData.working_office_name || null,
        date_of_joining: formData.date_of_joining || null,
        date_of_service_expiry: formData.date_of_service_expiry || null
      };

      if (editingEmployee) {
        const { error } = await ermsClient
          .from('employee')
          .update(employeeData)
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
      } else {
        const { error } = await ermsClient
          .from('employee')
          .insert(employeeData);
        
        if (error) throw error;
      }

      await fetchEmployees();
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(t('common.deleteConfirm'))) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
    setSelectedReason('');
  };

  const getUpcomingRetirements = () => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    return employees.filter(emp => {
      if (!emp.retirement_date) return false;
      const retirementDate = new Date(emp.retirement_date);
      return retirementDate <= sixMonthsFromNow && retirementDate >= new Date();
    }).length;
  };

  const getAssignedVsUnassigned = () => {
    const assigned = employees.filter(emp => emp.assigned_clerk).length;
    const unassigned = employees.length - assigned;
    return { assigned, unassigned };
  };

  const getDepartmentStats = () => {
    const stats = departments.map(dept => {
      const count = employees.filter(emp => emp.department === dept.department).length;
      return { name: dept.department, count };
    }).sort((a, b) => b.count - a.count);
    
    return stats.slice(0, 10);
  };

  const getClerkStats = () => {
    const clerkCounts = new Map();
    
    employees.forEach(emp => {
      if (emp.assigned_clerk) {
        clerkCounts.set(emp.assigned_clerk, (clerkCounts.get(emp.assigned_clerk) || 0) + 1);
      }
    });

    return Array.from(clerkCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getRetirementReasonStats = () => {
    const reasonCounts = new Map();
    
    employees.forEach(emp => {
      if (emp.reason) {
        reasonCounts.set(emp.reason, (reasonCounts.get(emp.reason) || 0) + 1);
      }
    });

    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  };

  const assignmentStats = getAssignedVsUnassigned();
  const departmentStats = getDepartmentStats();
  const clerkStats = getClerkStats();
  const retirementReasonStats = getRetirementReasonStats();
  const paginatedEmployees = getPaginatedEmployees();
  const totalPages = getTotalPages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('erms.employeeDashboardTitle')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {t('erms.employeeDashboardSubtitle')}
                </p>
              </div>
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
                onClick={handleAddEmployee}
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalEmployees')}</p>
                <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.upcomingRetirements')}</p>
                <p className="text-3xl font-bold text-orange-600">{getUpcomingRetirements()}</p>
                <p className="text-xs text-gray-500">{t('erms.nextSixMonths')}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.assignedUnassigned')}</p>
                <p className="text-3xl font-bold text-green-600">{assignmentStats.assigned}</p>
                <p className="text-xs text-gray-500">{assignmentStats.unassigned} unassigned</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalDepartments')}</p>
                <p className="text-3xl font-bold text-purple-600">{departments.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Department-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              {t('erms.departmentWiseEmployeeCount')}
            </h3>
            <div className="space-y-3">
              {departmentStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-700 truncate">{stat.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clerk-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              {t('erms.clerkWiseEmployeeCount')}
            </h3>
            <div className="space-y-3">
              {clerkStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700 truncate">{stat.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned vs Unassigned */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCheck className="h-5 w-5 text-purple-600 mr-2" />
              {t('erms.assignedVsUnassignedEmployees')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-700">{t('erms.assigned')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{assignmentStats.assigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-700">{t('erms.unassigned')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{assignmentStats.unassigned}</span>
              </div>
            </div>
          </div>

          {/* Retirement Reason Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-orange-600 mr-2" />
              {t('erms.employeeRetirementCountByReason')}
            </h3>
            <div className="space-y-3">
              {retirementReasonStats.slice(0, 5).map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm text-gray-700 truncate">{stat.reason}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stat.count}</span>
                </div>
              ))}
              {retirementReasonStats.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  {t('erms.showingTopResults', { count: 5 })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Employee Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.employeeRecords')}</h3>
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
                  <option key={dept.dept_id} value={dept.department}>{dept.department}</option>
                ))}
              </select>

              <select
                value={selectedClerk}
                onChange={(e) => setSelectedClerk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.allClerks')}</option>
                {clerks.map(clerk => (
                  <option key={clerk.user_id} value={clerk.name}>{clerk.name}</option>
                ))}
              </select>

              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.allReasons')}</option>
                <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                <option value="नियत वयोमान">नियत वयोमान</option>
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

            <p className="text-sm text-gray-500">
              {t('erms.showingEmployees', { 
                filtered: filteredEmployees.length, 
                total: employees.length 
              })}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.department')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.designation')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.age')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? 'Loading employees...' : 'No employees found'}
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
                        {employee.designation || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.age || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.retirement_date || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.assigned_clerk || t('erms.unassigned')}
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
                          <button 
                            onClick={() => handleDeleteEmployee(employee)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * recordsPerPage + 1}-{Math.min(currentPage * recordsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
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
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.addEmployee')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-800">{t('erms.basicEmployeeInfo')}</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeId')}</label>
                    <input
                      type="text"
                      value={formData.emp_id}
                      onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('erms.enterEmployeeId')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeName')}</label>
                    <input
                      type="text"
                      value={formData.employee_name}
                      onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('erms.enterEmployeeName')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfBirth')}</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.age')}</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('erms.enterAge')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.department')}</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectDepartment')}</option>
                      {departments.map(dept => (
                        <option key={dept.dept_id} value={dept.department}>{dept.department}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designation')}</label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectDesignation')}</option>
                      {designations.map(designation => (
                        <option key={designation.designation_id} value={designation.designation}>{designation.designation}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-800">Additional Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.retirementDate')}</label>
                    <input
                      type="date"
                      value={formData.retirement_date}
                      onChange={(e) => setFormData({ ...formData, retirement_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.retirementReason')}</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectReason')}</option>
                      <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                      <option value="नियत वयोमान">नियत वयोमान</option>
                      <option value="स्वेच्छा सेवा निवृत्ती">स्वेच्छा सेवा निवृत्ती</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
                    <select
                      value={formData.assigned_clerk}
                      onChange={(e) => setFormData({ ...formData, assigned_clerk: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectClerk')}</option>
                      {clerks.map(clerk => (
                        <option key={clerk.user_id} value={clerk.name}>{clerk.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfJoining')}</label>
                    <input
                      type="date"
                      value={formData.date_of_joining}
                      onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfServiceExpiry')}</label>
                    <input
                      type="date"
                      value={formData.date_of_service_expiry}
                      onChange={(e) => setFormData({ ...formData, date_of_service_expiry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.postName')}</label>
                    <input
                      type="text"
                      value={formData.post_name}
                      onChange={(e) => setFormData({ ...formData, post_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('erms.enterPostName')}
                    />
                  </div>
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
                onClick={handleSaveEmployee}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('erms.editEmployee')}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-800">{t('erms.basicEmployeeInfo')}</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeId')}</label>
                    <input
                      type="text"
                      value={formData.emp_id}
                      onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeName')}</label>
                    <input
                      type="text"
                      value={formData.employee_name}
                      onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfBirth')}</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.retirementDate')}</label>
                    <input
                      type="date"
                      value={formData.retirement_date}
                      onChange={(e) => setFormData({ ...formData, retirement_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfJoining')}</label>
                    <input
                      type="date"
                      value={formData.date_of_joining}
                      onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfServiceExpiry')}</label>
                    <input
                      type="date"
                      value={formData.date_of_service_expiry}
                      onChange={(e) => setFormData({ ...formData, date_of_service_expiry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-800">Additional Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.age')}</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.department')}</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectDepartment')}</option>
                      {departments.map(dept => (
                        <option key={dept.dept_id} value={dept.department}>{dept.department}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designation')}</label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectDesignation')}</option>
                      {designations.map(designation => (
                        <option key={designation.designation_id} value={designation.designation}>{designation.designation}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.retirementReason')}</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectReason')}</option>
                      <option value="मृत्यू झाल्याने">मृत्यू झाल्याने</option>
                      <option value="नियत वयोमान">नियत वयोमान</option>
                      <option value="स्वेच्छा सेवा निवृत्ती">स्वेच्छा सेवा निवृत्ती</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
                    <select
                      value={formData.assigned_clerk}
                      onChange={(e) => setFormData({ ...formData, assigned_clerk: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('erms.selectClerk')}</option>
                      {clerks.map(clerk => (
                        <option key={clerk.user_id} value={clerk.name}>{clerk.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.postName')}</label>
                    <input
                      type="text"
                      value={formData.post_name}
                      onChange={(e) => setFormData({ ...formData, post_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('erms.enterPostName')}
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
                onClick={handleSaveEmployee}
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