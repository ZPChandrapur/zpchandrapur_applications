import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Building2,
  Calendar,
  UserCheck,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Eye,
  X,
  ChevronDown,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { ermsClient } from '../lib/supabase';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  emp_id: string;
  employee_name: string;
  date_of_birth: string | null;
  age: number | null;
  retirement_date: string | null;
  reason: string | null;
  assigned_clerk: string | null;
  dept_id: string | null;
  designation_id: string | null;
  office_id: string | null;
  cadre: string | null;
  post_name: string | null;
  appointing_department: string | null;
  working_office_name: string | null;
  date_of_joining: string | null;
  date_of_service_expiry: string | null;
  panchayatrajsevarth_id: string | null;
  ddo_code: string | null;
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

interface Office {
  office_id: string;
  name: string;
}

interface Clerk {
  user_id: string;
  name: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [clerks, setClerks] = useState<Clerk[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  
  // Modal states - Initialize as false
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    emp_id: '',
    employee_name: '',
    date_of_birth: '',
    age: '',
    retirement_date: '',
    reason: '',
    assigned_clerk: '',
    dept_id: '',
    designation_id: '',
    office_id: '',
    cadre: '',
    post_name: '',
    appointing_department: '',
    working_office_name: '',
    date_of_joining: '',
    date_of_service_expiry: '',
    panchayatrajsevarth_id: '',
    ddo_code: ''
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
        fetchOffices(),
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
      // This would need to be implemented based on your user management system
      setClerks([]);
    } catch (error) {
      console.error('Error fetching clerks:', error);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({
      emp_id: '',
      employee_name: '',
      date_of_birth: '',
      age: '',
      retirement_date: '',
      reason: '',
      assigned_clerk: '',
      dept_id: '',
      designation_id: '',
      office_id: '',
      cadre: '',
      post_name: '',
      appointing_department: '',
      working_office_name: '',
      date_of_joining: '',
      date_of_service_expiry: '',
      panchayatrajsevarth_id: '',
      ddo_code: ''
    });
    setShowAddModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      employee_name: employee.employee_name,
      date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      age: employee.age?.toString() || '',
      retirement_date: employee.retirement_date ? employee.retirement_date.split('T')[0] : '',
      reason: employee.reason || '',
      assigned_clerk: employee.assigned_clerk || '',
      dept_id: employee.dept_id || '',
      designation_id: employee.designation_id || '',
      office_id: employee.office_id || '',
      cadre: employee.cadre || '',
      post_name: employee.post_name || '',
      appointing_department: employee.appointing_department || '',
      working_office_name: employee.working_office_name || '',
      date_of_joining: employee.date_of_joining ? employee.date_of_joining.split('T')[0] : '',
      date_of_service_expiry: employee.date_of_service_expiry ? employee.date_of_service_expiry.split('T')[0] : '',
      panchayatrajsevarth_id: employee.panchayatrajsevarth_id || '',
      ddo_code: employee.ddo_code || ''
    });
    setShowAddModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!formData.panchayatrajsevarth_id || !formData.employee_name) {
      alert(t('common.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const employeeData = {
        emp_id: formData.panchayatrajsevarth_id,
        employee_name: formData.employee_name,
        date_of_birth: formData.date_of_birth || null,
        age: formData.age ? parseInt(formData.age) : null,
        retirement_date: formData.retirement_date || null,
        reason: formData.reason || null,
        assigned_clerk: formData.assigned_clerk || null,
        dept_id: formData.dept_id || null,
        designation_id: formData.designation_id || null,
        office_id: formData.office_id || null,
        cadre: formData.cadre || null,
        post_name: formData.post_name || null,
        appointing_department: formData.appointing_department || null,
        working_office_name: formData.working_office_name || null,
        date_of_joining: formData.date_of_joining || null,
        date_of_service_expiry: formData.date_of_service_expiry || null,
        panchayatrajsevarth_id: formData.panchayatrajsevarth_id || null,
        ddo_code: formData.ddo_code || null
      };

      if (editingEmployee) {
        const { error } = await ermsClient
          .from('employee')
          .update(employeeData)
          .eq('emp_id', editingEmployee.emp_id);
        if (error) throw error;
      } else {
        const { error } = await ermsClient
          .from('employee')
          .insert(employeeData);
        if (error) throw error;
      }
      
      // Only close modal and reset form on successful save
      await fetchEmployees();
      setShowAddModal(false);
      setEditingEmployee(null);
      setFormData({
        panchayatrajsevarth_id: '',
        employee_name: '',
        date_of_birth: '',
        age: '',
        retirement_date: '',
        reason: '',
        assigned_clerk: '',
        dept_id: '',
        designation_id: '',
        office_id: '',
        cadre: '',
        post_name: '',
        appointing_department: '',
        working_office_name: '',
        date_of_joining: '',
        date_of_service_expiry: '',
        emp_id: '',
        ddo_code: ''
      });
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(t('common.error') + ': ' + error.message);
      // Don't close modal on error - let user fix the issue
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

  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      const matchesSearch = !searchTerm || 
        employee.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !selectedDepartment || employee.dept_id === selectedDepartment;
      const matchesClerk = !selectedClerk || employee.assigned_clerk === selectedClerk;
      const matchesReason = !selectedReason || employee.reason === selectedReason;
      
      return matchesSearch && matchesDepartment && matchesClerk && matchesReason;
    });
  };

  const filteredEmployees = getFilteredEmployees();

  // Statistics calculations
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

  // Department-wise distribution
  const departmentStats = departments.map(dept => ({
    name: dept.department,
    count: employees.filter(emp => emp.dept_id === dept.dept_id).length
  })).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count);

  // Clerk-wise distribution
  const clerkStats = employees.reduce((acc, emp) => {
    const clerk = emp.assigned_clerk || t('erms.unassigned');
    acc[clerk] = (acc[clerk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const clerkStatsArray = Object.entries(clerkStats).map(([clerk, count]) => ({
    name: clerk,
    count
  })).sort((a, b) => b.count - a.count);

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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalEmployees')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
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
                <p className="text-2xl font-bold text-orange-600">{upcomingRetirements}</p>
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
                <p className="text-sm text-gray-600 mb-1">{t('erms.assignedUnassigned')}</p>
                <p className="text-2xl font-bold text-green-600">{assignedEmployees}/{unassignedEmployees}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.totalDepartments')}</p>
                <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Department-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseEmployeeCount')}</h3>
            <div className="space-y-3">
              {departmentStats.slice(0, 8).map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-700 truncate">{stat.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(stat.count / Math.max(...departmentStats.map(s => s.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clerk-wise Employee Count */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.clerkWiseEmployeeCount')}</h3>
            <div className="space-y-3">
              {clerkStatsArray.slice(0, 8).map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700 truncate">{stat.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(stat.count / Math.max(...clerkStatsArray.map(s => s.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{stat.count}</span>
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
                  <option key={dept.dept_id} value={dept.dept_id}>{dept.department}</option>
                ))}
              </select>

              <select
                value={selectedClerk}
                onChange={(e) => setSelectedClerk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.allClerks')}</option>
                {Array.from(new Set(employees.map(emp => emp.assigned_clerk).filter(Boolean))).map(clerk => (
                  <option key={clerk} value={clerk}>{clerk}</option>
                ))}
              </select>

              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.allReasons')}</option>
                {Array.from(new Set(employees.map(emp => emp.reason).filter(Boolean))).map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employeeIdInternal')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.age')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">संवर्ग</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">पदाचे नाव</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">नियुक्ती करणारा विभाग</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">कार्यरत कार्यालयाचे नाव</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? t('common.loading') : t('erms.showingEmployees', { filtered: 0, total: 0 })}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.emp_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.emp_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                          <div className="text-sm text-gray-500">{employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.age || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.cadre || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {designations.find((d) => d.designation_id === employee.designation_id)?.designation || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {departments.find((d) => d.dept_id === employee.dept_id)?.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {offices.find((o) => o.office_id === employee.office_id)?.name || '-'}
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

          <div className="px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {t('erms.showingEmployees', { filtered: filteredEmployees.length, total: employees.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEmployee ? t('erms.editEmployee') : t('erms.addEmployee')}
              </h3>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.panchayatrajsevarthId')} *
                  </label>
                  <input
                    type="text"
                    value={formData.panchayatrajsevarth_id}
                    onChange={(e) => setFormData({ ...formData, panchayatrajsevarth_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterEmployeeId')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.employeeName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
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
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.age')} *
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterAge')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.dateOfServiceExpiry')} (Auto-calculated)
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_service_expiry}
                    onChange={(e) => setFormData({ ...formData, date_of_service_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.retirementReason')}
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectReason')}</option>
                    <option value="वयोमर्यादा">वयोमर्यादा</option>
                    <option value="स्वैच्छिक">स्वैच्छिक</option>
                    <option value="वैद्यकीय">वैद्यकीय</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.department')}
                  </label>
                  <select
                    value={formData.dept_id}
                    onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDepartment')}</option>
                    {departments.map(dept => (
                      <option key={dept.dept_id} value={dept.dept_id}>{dept.department}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.designation')}
                  </label>
                  <select
                    value={formData.designation_id}
                    onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectDesignation')}</option>
                    {designations.map(designation => (
                      <option key={designation.designation_id} value={designation.designation_id}>{designation.designation}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.office')}
                  </label>
                  <select
                    value={formData.office_id}
                    onChange={(e) => setFormData({ ...formData, office_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectOffice')}</option>
                    {offices.map(office => (
                      <option key={office.office_id} value={office.office_id}>{office.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.cadre')}
                  </label>
                  <input
                    type="text"
                    value={formData.cadre}
                    onChange={(e) => setFormData({ ...formData, cadre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter cadre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.postName')}
                  </label>
                  <input
                    type="text"
                    value={formData.post_name}
                    onChange={(e) => setFormData({ ...formData, post_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterPostName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.appointingDepartment')}
                  </label>
                  <input
                    type="text"
                    value={formData.appointing_department}
                    onChange={(e) => setFormData({ ...formData, appointing_department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterAppointingDepartment')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.workingOfficeName')}
                  </label>
                  <input
                    type="text"
                    value={formData.working_office_name}
                    onChange={(e) => setFormData({ ...formData, working_office_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterWorkingOfficeName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.dateOfJoining')}
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.ddoCode')}
                  </label>
                  <input
                    type="text"
                    value={formData.ddo_code}
                    onChange={(e) => setFormData({ ...formData, ddo_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter DDO code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('erms.assignedClerk')}
                  </label>
                  <input
                    type="text"
                    value={formData.assigned_clerk}
                    onChange={(e) => setFormData({ ...formData, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('erms.enterClerkName')}
                  />
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
                {isLoading ? t('common.saving') : (editingEmployee ? t('erms.updateEmployee') : t('erms.addEmployee'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};