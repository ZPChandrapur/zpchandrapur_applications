import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Calendar,
  UserCheck,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Eye,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  GraduationCap,
  Building2
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  taluka: string;
  office: string;
  retirement_date: string;
  retirement_reason: string;
  assigned_clerk: string;
  date_of_assignment: string;
  panchayatrajsevarth_id?: string;
  ddo_code?: string;
  cadre?: string;
  post_name?: string;
  appointing_department?: string;
  working_office_name?: string;
  date_of_joining?: string;
  date_of_service_expiry?: string;
  created_at?: string;
  updated_at?: string;
}

interface EducationEmployee {
  id: string;
  emp_id: string;
  employee_name: string;
  date_of_birth: string;
  age: number;
  department: string;
  designation: string;
  taluka: string;
  office: string;
  retirement_date: string;
  retirement_reason: string;
  assigned_clerk: string;
  date_of_assignment: string;
  // Education-specific fields
  school_name?: string;
  school_code?: string;
  subject_taught?: string;
  qualification?: string;
  experience_years?: number;
  teacher_id?: string;
  class_assigned?: string;
  medium_of_instruction?: string;
  training_completed?: string;
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

interface Office {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'addEmployee'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [addFormType, setAddFormType] = useState<'general' | 'education'>('general');
  const recordsPerPage = 20;

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // Form states for general employee
  const [generalFormData, setGeneralFormData] = useState({
    emp_id: '',
    employee_name: '',
    date_of_birth: '',
    age: '',
    department: '',
    designation: '',
    taluka: '',
    office: '',
    retirement_date: '',
    retirement_reason: '',
    assigned_clerk: '',
    panchayatrajsevarth_id: '',
    ddo_code: '',
    cadre: '',
    post_name: '',
    appointing_department: '',
    working_office_name: '',
    date_of_joining: '',
    date_of_service_expiry: ''
  });

  // Form states for education employee
  const [educationFormData, setEducationFormData] = useState({
    emp_id: '',
    employee_name: '',
    date_of_birth: '',
    age: '',
    department: 'शिक्षण विभाग', // Default to Education Department
    designation: '',
    taluka: '',
    office: '',
    retirement_date: '',
    retirement_reason: '',
    assigned_clerk: '',
    school_name: '',
    school_code: '',
    subject_taught: '',
    qualification: '',
    experience_years: '',
    teacher_id: '',
    class_assigned: '',
    medium_of_instruction: '',
    training_completed: ''
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
        fetchOffices(),
        fetchClerks()
      ]);
    } catch (error) {
      console.error('Error fetching employee data:', error);
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

  const fetchOffices = async () => {
    try {
      const { data, error } = await ermsClient
        .from('office_locations')
        .select('office_id, name')
        .order('name');
      
      if (error) throw error;
      setOffices(data || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
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
      filtered = filtered.filter(emp => emp.retirement_reason === selectedReason);
    }

    setFilteredEmployees(filtered);
  };

  const handleAddGeneralEmployee = async () => {
    if (!generalFormData.emp_id || !generalFormData.employee_name) {
      alert(t('erms.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .insert({
          emp_id: generalFormData.emp_id,
          employee_name: generalFormData.employee_name,
          date_of_birth: generalFormData.date_of_birth || null,
          age: generalFormData.age ? parseInt(generalFormData.age) : null,
          department: generalFormData.department || null,
          designation: generalFormData.designation || null,
          taluka: generalFormData.taluka || null,
          office: generalFormData.office || null,
          retirement_date: generalFormData.retirement_date || null,
          retirement_reason: generalFormData.retirement_reason || null,
          assigned_clerk: generalFormData.assigned_clerk || null,
          panchayatrajsevarth_id: generalFormData.panchayatrajsevarth_id || null,
          ddo_code: generalFormData.ddo_code || null,
          cadre: generalFormData.cadre || null,
          post_name: generalFormData.post_name || null,
          appointing_department: generalFormData.appointing_department || null,
          working_office_name: generalFormData.working_office_name || null,
          date_of_joining: generalFormData.date_of_joining || null,
          date_of_service_expiry: generalFormData.date_of_service_expiry || null
        });

      if (error) throw error;

      await fetchEmployees();
      setGeneralFormData({
        emp_id: '',
        employee_name: '',
        date_of_birth: '',
        age: '',
        department: '',
        designation: '',
        taluka: '',
        office: '',
        retirement_date: '',
        retirement_reason: '',
        assigned_clerk: '',
        panchayatrajsevarth_id: '',
        ddo_code: '',
        cadre: '',
        post_name: '',
        appointing_department: '',
        working_office_name: '',
        date_of_joining: '',
        date_of_service_expiry: ''
      });
      alert('Employee added successfully!');
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEducationEmployee = async () => {
    if (!educationFormData.emp_id || !educationFormData.employee_name) {
      alert(t('erms.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      // First add to general employee table
      const { error: employeeError } = await ermsClient
        .from('employee')
        .insert({
          emp_id: educationFormData.emp_id,
          employee_name: educationFormData.employee_name,
          date_of_birth: educationFormData.date_of_birth || null,
          age: educationFormData.age ? parseInt(educationFormData.age) : null,
          department: educationFormData.department,
          designation: educationFormData.designation || null,
          taluka: educationFormData.taluka || null,
          office: educationFormData.office || null,
          retirement_date: educationFormData.retirement_date || null,
          retirement_reason: educationFormData.retirement_reason || null,
          assigned_clerk: educationFormData.assigned_clerk || null
        });

      if (employeeError) throw employeeError;

      // Then add education-specific data (you might need to create this table)
      // For now, we'll just add to the main employee table with additional fields
      
      await fetchEmployees();
      setEducationFormData({
        emp_id: '',
        employee_name: '',
        date_of_birth: '',
        age: '',
        department: 'शिक्षण विभाग',
        designation: '',
        taluka: '',
        office: '',
        retirement_date: '',
        retirement_reason: '',
        assigned_clerk: '',
        school_name: '',
        school_code: '',
        subject_taught: '',
        qualification: '',
        experience_years: '',
        teacher_id: '',
        class_assigned: '',
        medium_of_instruction: '',
        training_completed: ''
      });
      alert('Education employee added successfully!');
    } catch (error) {
      console.error('Error adding education employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .update({
          employee_name: editingEmployee.employee_name,
          date_of_birth: editingEmployee.date_of_birth,
          age: editingEmployee.age,
          department: editingEmployee.department,
          designation: editingEmployee.designation,
          taluka: editingEmployee.taluka,
          office: editingEmployee.office,
          retirement_date: editingEmployee.retirement_date,
          retirement_reason: editingEmployee.retirement_reason,
          assigned_clerk: editingEmployee.assigned_clerk
        })
        .eq('emp_id', editingEmployee.emp_id);

      if (error) throw error;

      await fetchEmployees();
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error updating employee:', error);
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

  const getPaginatedEmployees = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredEmployees.length / recordsPerPage);
  };

  const getEmployeeStats = () => {
    const total = employees.length;
    const upcomingRetirements = employees.filter(emp => {
      if (!emp.retirement_date) return false;
      const retirementDate = new Date(emp.retirement_date);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return retirementDate <= sixMonthsFromNow && retirementDate >= new Date();
    }).length;
    
    const assigned = employees.filter(emp => emp.assigned_clerk).length;
    const unassigned = total - assigned;

    return { total, upcomingRetirements, assigned, unassigned };
  };

  const stats = getEmployeeStats();
  const paginatedEmployees = getPaginatedEmployees();
  const totalPages = getTotalPages();

  const tabs = [
    {
      id: 'overview' as const,
      name: 'Overview',
      nameMarathi: 'विहंगावलोकन',
      icon: BarChart3,
      color: 'text-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      id: 'employees' as const,
      name: 'Employee Records',
      nameMarathi: 'कर्मचारी रेकॉर्ड',
      icon: Users,
      color: 'text-green-600',
      borderColor: 'border-green-500'
    },
    {
      id: 'addEmployee' as const,
      name: 'Add Employee',
      nameMarathi: 'कर्मचारी जोडा',
      icon: UserPlus,
      color: 'text-purple-600',
      borderColor: 'border-purple-500'
    }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.totalEmployees')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-3xl font-bold text-orange-600">{stats.upcomingRetirements}</p>
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
              <p className="text-3xl font-bold text-green-600">{stats.assigned}</p>
              <p className="text-xs text-gray-500">Assigned</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Unassigned</p>
              <p className="text-3xl font-bold text-red-600">{stats.unassigned}</p>
              <p className="text-xs text-gray-500">Need Assignment</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseEmployeeCount')}</h3>
          <div className="text-center py-8 text-gray-500">
            Chart visualization coming soon...
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.assignedVsUnassignedEmployees')}</h3>
          <div className="text-center py-8 text-gray-500">
            Chart visualization coming soon...
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployeesTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            <option value="वयोमर्यादा">वयोमर्यादा</option>
            <option value="स्वैच्छिक">स्वैच्छिक</option>
            <option value="वैद्यकीय">वैद्यकीय</option>
          </select>

          <button
            onClick={clearFilters}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
            <span className="text-sm">{t('erms.clearFilters')}</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('erms.showingEmployees', { filtered: filteredEmployees.length, total: employees.length })}
          </p>
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchAllData}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">{t('erms.refresh')}</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
              <Download className="h-4 w-4" />
              <span className="text-sm">{t('common.export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    {isLoading ? t('common.loading') : 'No employees found'}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr key={employee.emp_id} className="hover:bg-gray-50">
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
                      {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
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
  );

  const renderAddEmployeeTab = () => (
    <div className="space-y-6">
      {/* Form Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setAddFormType('general')}
            className={`p-4 border-2 rounded-lg transition-all duration-200 ${
              addFormType === 'general'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Building2 className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm font-medium">General Employee</div>
            <div className="text-xs text-gray-500 mt-1">For all departments except Education</div>
          </button>
          
          <button
            onClick={() => setAddFormType('education')}
            className={`p-4 border-2 rounded-lg transition-all duration-200 ${
              addFormType === 'education'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <GraduationCap className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm font-medium">Education Employee</div>
            <div className="text-xs text-gray-500 mt-1">For Education Department with additional fields</div>
          </button>
        </div>
      </div>

      {/* General Employee Form */}
      {addFormType === 'general' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add General Employee</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeId')}</label>
              <input
                type="text"
                value={generalFormData.emp_id}
                onChange={(e) => setGeneralFormData({ ...generalFormData, emp_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterEmployeeId')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeName')}</label>
              <input
                type="text"
                value={generalFormData.employee_name}
                onChange={(e) => setGeneralFormData({ ...generalFormData, employee_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterEmployeeName')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfBirth')}</label>
              <input
                type="date"
                value={generalFormData.date_of_birth}
                onChange={(e) => setGeneralFormData({ ...generalFormData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.age')}</label>
              <input
                type="number"
                value={generalFormData.age}
                onChange={(e) => setGeneralFormData({ ...generalFormData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterAge')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.department')}</label>
              <select
                value={generalFormData.department}
                onChange={(e) => setGeneralFormData({ ...generalFormData, department: e.target.value })}
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
                value={generalFormData.designation}
                onChange={(e) => setGeneralFormData({ ...generalFormData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.selectDesignation')}</option>
                {designations.map(designation => (
                  <option key={designation.designation_id} value={designation.designation}>{designation.designation}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.taluka')}</label>
              <select
                value={generalFormData.taluka}
                onChange={(e) => setGeneralFormData({ ...generalFormData, taluka: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.selectTaluka')}</option>
                {talukas.map(taluka => (
                  <option key={taluka.tal_id} value={taluka.name}>{taluka.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.office')}</label>
              <select
                value={generalFormData.office}
                onChange={(e) => setGeneralFormData({ ...generalFormData, office: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.selectOffice')}</option>
                {offices.map(office => (
                  <option key={office.office_id} value={office.name}>{office.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
              <select
                value={generalFormData.assigned_clerk}
                onChange={(e) => setGeneralFormData({ ...generalFormData, assigned_clerk: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.selectClerk')}</option>
                {clerks.map(clerk => (
                  <option key={clerk.user_id} value={clerk.name}>{clerk.name}</option>
                ))}
              </select>
            </div>

            {/* Additional fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.panchayatrajsevarthId')}</label>
              <input
                type="text"
                value={generalFormData.panchayatrajsevarth_id}
                onChange={(e) => setGeneralFormData({ ...generalFormData, panchayatrajsevarth_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.ddoCode')}</label>
              <input
                type="text"
                value={generalFormData.ddo_code}
                onChange={(e) => setGeneralFormData({ ...generalFormData, ddo_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.cadre')}</label>
              <input
                type="text"
                value={generalFormData.cadre}
                onChange={(e) => setGeneralFormData({ ...generalFormData, cadre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAddGeneralEmployee}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? t('common.saving') : 'Add General Employee'}
            </button>
          </div>
        </div>
      )}

      {/* Education Employee Form */}
      {addFormType === 'education' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add Education Employee</h3>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeId')}</label>
                  <input
                    type="text"
                    value={educationFormData.emp_id}
                    onChange={(e) => setEducationFormData({ ...educationFormData, emp_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeId')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeName')}</label>
                  <input
                    type="text"
                    value={educationFormData.employee_name}
                    onChange={(e) => setEducationFormData({ ...educationFormData, employee_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfBirth')}</label>
                  <input
                    type="date"
                    value={educationFormData.date_of_birth}
                    onChange={(e) => setEducationFormData({ ...educationFormData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.age')}</label>
                  <input
                    type="number"
                    value={educationFormData.age}
                    onChange={(e) => setEducationFormData({ ...educationFormData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('erms.enterAge')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.department')}</label>
                  <input
                    type="text"
                    value={educationFormData.department}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designation')}</label>
                  <select
                    value={educationFormData.designation}
                    onChange={(e) => setEducationFormData({ ...educationFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDesignation')}</option>
                    {designations.map(designation => (
                      <option key={designation.designation_id} value={designation.designation}>{designation.designation}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Education-Specific Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-4">Education-Specific Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                  <input
                    type="text"
                    value={educationFormData.school_name}
                    onChange={(e) => setEducationFormData({ ...educationFormData, school_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
                  <input
                    type="text"
                    value={educationFormData.school_code}
                    onChange={(e) => setEducationFormData({ ...educationFormData, school_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter school code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher ID</label>
                  <input
                    type="text"
                    value={educationFormData.teacher_id}
                    onChange={(e) => setEducationFormData({ ...educationFormData, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter teacher ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Taught</label>
                  <input
                    type="text"
                    value={educationFormData.subject_taught}
                    onChange={(e) => setEducationFormData({ ...educationFormData, subject_taught: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter subject taught"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                  <input
                    type="text"
                    value={educationFormData.qualification}
                    onChange={(e) => setEducationFormData({ ...educationFormData, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter qualification"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                  <input
                    type="number"
                    value={educationFormData.experience_years}
                    onChange={(e) => setEducationFormData({ ...educationFormData, experience_years: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter years of experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Assigned</label>
                  <input
                    type="text"
                    value={educationFormData.class_assigned}
                    onChange={(e) => setEducationFormData({ ...educationFormData, class_assigned: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter class assigned"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medium of Instruction</label>
                  <select
                    value={educationFormData.medium_of_instruction}
                    onChange={(e) => setEducationFormData({ ...educationFormData, medium_of_instruction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select medium</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Training Completed</label>
                  <input
                    type="text"
                    value={educationFormData.training_completed}
                    onChange={(e) => setEducationFormData({ ...educationFormData, training_completed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter training details"
                  />
                </div>
              </div>
            </div>

            {/* Administrative Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-4">Administrative Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.taluka')}</label>
                  <select
                    value={educationFormData.taluka}
                    onChange={(e) => setEducationFormData({ ...educationFormData, taluka: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectTaluka')}</option>
                    {talukas.map(taluka => (
                      <option key={taluka.tal_id} value={taluka.name}>{taluka.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.office')}</label>
                  <select
                    value={educationFormData.office}
                    onChange={(e) => setEducationFormData({ ...educationFormData, office: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectOffice')}</option>
                    {offices.map(office => (
                      <option key={office.office_id} value={office.name}>{office.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
                  <select
                    value={educationFormData.assigned_clerk}
                    onChange={(e) => setEducationFormData({ ...educationFormData, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectClerk')}</option>
                    {clerks.map(clerk => (
                      <option key={clerk.user_id} value={clerk.name}>{clerk.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAddEducationEmployee}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? t('common.saving') : 'Add Education Employee'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
          </div>
        </div>
      </div>

      <div className="p-6">
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
                      ? `${tab.borderColor} ${tab.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.nameMarathi}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'employees' && renderEmployeesTab()}
            {activeTab === 'addEmployee' && renderAddEmployeeTab()}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeId')}</label>
                  <input
                    type="text"
                    value={editingEmployee.emp_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeName')}</label>
                  <input
                    type="text"
                    value={editingEmployee.employee_name}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, employee_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfBirth')}</label>
                  <input
                    type="date"
                    value={editingEmployee.date_of_birth ? editingEmployee.date_of_birth.split('T')[0] : ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.age')}</label>
                  <input
                    type="number"
                    value={editingEmployee.age}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, age: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.department')}</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDepartment')}</option>
                    {departments.map(dept => (
                      <option key={dept.dept_id} value={dept.department}>{dept.department}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
                  <select
                    value={editingEmployee.assigned_clerk}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectClerk')}</option>
                    {clerks.map(clerk => (
                      <option key={clerk.user_id} value={clerk.name}>{clerk.name}</option>
                    ))}
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