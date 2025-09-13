import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Calendar,
  UserCheck,
  UserX,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  X,
  Building2,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { ermsClient } from '../lib/supabase';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  id: string;
  emp_id: string;
  employee_name: string;
  date_of_birth: string;
  age: number;
  retirement_date: string;
  reason: string;
  assigned_clerk: string | null;
  dept_id: string;
  designation_id: string;
  tal_id: string;
  office_id: string;
  department?: string;
  designation?: string;
  taluka?: string;
  office?: string;
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

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'employees' | 'addEmployee'>('employees');
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [clerks, setClerks] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<'general' | 'education'>('general');
  
  // Form state
  const [formData, setFormData] = useState({
    emp_id: '',
    panchayatrajsevarth_id: '',
    employee_name: '',
    ddo_code: '',
    date_of_birth: '',
    cadre: '',
    age: '',
    post_name: '',
    retirement_date: '',
    date_of_joining: '',
    date_of_service_expiry: '',
    appointing_department: '',
    working_office_name: '',
    reason: '',
    assigned_clerk: '',
    dept_id: '',
    designation_id: '',
    tal_id: '',
    office_id: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterEmployees();
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
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await ermsClient
        .from('employee')
        .select(`
          *,
          department:department!inner(department),
          designations:designations!inner(designation),
          talukas:talukas!inner(name),
          office_locations:office_locations!inner(name)
        `)
        .order('employee_name');
      
      if (error) throw error;
      
      const employeesWithJoins = data?.map(emp => ({
        ...emp,
        department: emp.department?.department,
        designation: emp.designations?.designation,
        taluka: emp.talukas?.name,
        office: emp.office_locations?.name
      })) || [];
      
      setEmployees(employeesWithJoins);
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
      const uniqueClerks = [...new Set(employees.map(emp => emp.assigned_clerk).filter(Boolean))];
      setClerks(uniqueClerks);
    } catch (error) {
      console.error('Error fetching clerks:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.dept_id === selectedDepartment);
    }

    if (selectedClerk) {
      filtered = filtered.filter(emp => emp.assigned_clerk === selectedClerk);
    }

    if (selectedReason) {
      filtered = filtered.filter(emp => emp.reason === selectedReason);
    }

    setFilteredEmployees(filtered);
  };

  const handleAddEmployee = async () => {
    if (!formData.emp_id || !formData.employee_name || !formData.date_of_birth) {
      alert(t('erms.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .insert({
          emp_id: formData.emp_id,
          panchayatrajsevarth_id: formData.panchayatrajsevarth_id || null,
          employee_name: formData.employee_name,
          ddo_code: formData.ddo_code || null,
          date_of_birth: formData.date_of_birth,
          cadre: formData.cadre || null,
          age: parseInt(formData.age) || null,
          post_name: formData.post_name || null,
          retirement_date: formData.retirement_date || null,
          date_of_joining: formData.date_of_joining || null,
          date_of_service_expiry: formData.date_of_service_expiry || null,
          appointing_department: formData.appointing_department || null,
          working_office_name: formData.working_office_name || null,
          reason: formData.reason || null,
          assigned_clerk: formData.assigned_clerk || null,
          dept_id: formData.dept_id || null,
          designation_id: formData.designation_id || null,
          tal_id: formData.tal_id || null,
          office_id: formData.office_id || null
        });

      if (error) throw error;
      
      await fetchEmployees();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      panchayatrajsevarth_id: employee.panchayatrajsevarth_id || '',
      employee_name: employee.employee_name,
      ddo_code: employee.ddo_code || '',
      date_of_birth: employee.date_of_birth.split('T')[0],
      cadre: employee.cadre || '',
      age: employee.age.toString(),
      post_name: employee.post_name || '',
      retirement_date: employee.retirement_date ? employee.retirement_date.split('T')[0] : '',
      date_of_joining: employee.date_of_joining ? employee.date_of_joining.split('T')[0] : '',
      date_of_service_expiry: employee.date_of_service_expiry ? employee.date_of_service_expiry.split('T')[0] : '',
      appointing_department: employee.appointing_department || '',
      working_office_name: employee.working_office_name || '',
      reason: employee.reason || '',
      assigned_clerk: employee.assigned_clerk || '',
      dept_id: employee.dept_id || '',
      designation_id: employee.designation_id || '',
      tal_id: employee.tal_id || '',
      office_id: employee.office_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .update({
          panchayatrajsevarth_id: formData.panchayatrajsevarth_id || null,
          employee_name: formData.employee_name,
          ddo_code: formData.ddo_code || null,
          date_of_birth: formData.date_of_birth,
          cadre: formData.cadre || null,
          age: parseInt(formData.age) || null,
          post_name: formData.post_name || null,
          retirement_date: formData.retirement_date || null,
          date_of_joining: formData.date_of_joining || null,
          date_of_service_expiry: formData.date_of_service_expiry || null,
          appointing_department: formData.appointing_department || null,
          working_office_name: formData.working_office_name || null,
          reason: formData.reason || null,
          assigned_clerk: formData.assigned_clerk || null,
          dept_id: formData.dept_id || null,
          designation_id: formData.designation_id || null,
          tal_id: formData.tal_id || null,
          office_id: formData.office_id || null
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;
      
      await fetchEmployees();
      setShowEditModal(false);
      setEditingEmployee(null);
      resetForm();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      emp_id: '',
      panchayatrajsevarth_id: '',
      employee_name: '',
      ddo_code: '',
      date_of_birth: '',
      cadre: '',
      age: '',
      post_name: '',
      retirement_date: '',
      date_of_joining: '',
      date_of_service_expiry: '',
      appointing_department: '',
      working_office_name: '',
      reason: '',
      assigned_clerk: '',
      dept_id: '',
      designation_id: '',
      tal_id: '',
      office_id: ''
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
    setSelectedReason('');
  };

  const getKPIData = () => {
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

  const kpiData = getKPIData();

  const renderEmployeesTab = () => (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.totalEmployees')}</p>
              <p className="text-3xl font-bold text-gray-900">{kpiData.total}</p>
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
              <p className="text-3xl font-bold text-orange-600">{kpiData.upcomingRetirements}</p>
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
              <p className="text-3xl font-bold text-green-600">{kpiData.assigned}</p>
              <p className="text-xs text-gray-500">{t('erms.assigned')}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.assignedUnassigned')}</p>
              <p className="text-3xl font-bold text-red-600">{kpiData.unassigned}</p>
              <p className="text-xs text-gray-500">{t('erms.unassigned')}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <UserX className="h-8 w-8 text-red-600" />
            </div>
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
                <option key={dept.dept_id} value={dept.dept_id}>{dept.department}</option>
              ))}
            </select>

            <select
              value={selectedClerk}
              onChange={(e) => setSelectedClerk(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('erms.allClerks')}</option>
              {clerks.map(clerk => (
                <option key={clerk} value={clerk}>{clerk}</option>
              ))}
            </select>

            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('erms.allReasons')}</option>
              <option value="retirement">Retirement</option>
              <option value="resignation">Resignation</option>
              <option value="transfer">Transfer</option>
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
            {t('erms.showingEmployees', { filtered: filteredEmployees.length, total: employees.length })}
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
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {isLoading ? t('common.loading') : 'No employees found'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
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
                      {employee.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.retirement_date ? new Date(employee.retirement_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.assigned_clerk || t('erms.unassigned')}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderAddEmployeeTab = () => (
    <div className="space-y-6">
      {/* Form Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedFormType('general')}
            className={`p-6 border-2 rounded-lg transition-all duration-200 ${
              selectedFormType === 'general'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Building2 className="h-8 w-8 mx-auto mb-2" />
            <div className="text-lg font-medium">🏢 General Employee</div>
            <div className="text-sm mt-1">For all departments except Education</div>
          </button>
          
          <button
            onClick={() => setSelectedFormType('education')}
            className={`p-6 border-2 rounded-lg transition-all duration-200 ${
              selectedFormType === 'education'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <ClipboardList className="h-8 w-8 mx-auto mb-2" />
            <div className="text-lg font-medium">🎓 Education Employee</div>
            <div className="text-sm mt-1">Specialized form for Education Department</div>
          </button>
        </div>
      </div>

      {/* Add Employee Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {selectedFormType === 'education' ? '🎓 Add Education Employee' : '🏢 Add General Employee'}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.employeeIdInternal')}</label>
              <input
                type="text"
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterEmployeeId')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.panchayatrajsevarthId')}</label>
              <input
                type="text"
                value={formData.panchayatrajsevarth_id || ''}
                onChange={(e) => setFormData({ ...formData, panchayatrajsevarth_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter PANCHAYATRAJSEVARTH ID"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.ddoCode')}</label>
              <input
                type="text"
                value={formData.ddo_code || ''}
                onChange={(e) => setFormData({ ...formData, ddo_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter DDO CODE"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.cadre')}</label>
              <select
                value={formData.cadre || ''}
                onChange={(e) => setFormData({ ...formData, cadre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Cadre</option>
                <option value="Class I">Class I</option>
                <option value="Class II">Class II</option>
                <option value="Class III">Class III</option>
                <option value="Class IV">Class IV</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.age')} (Auto-calculated)</label>
              <input
                type="number"
                value={formData.age}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                placeholder={t('erms.enterAge')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.postName')}</label>
              <input
                type="text"
                value={formData.post_name || ''}
                onChange={(e) => setFormData({ ...formData, post_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterPostName')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.department')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.appointingDepartment')}</label>
              <input
                type="text"
                value={formData.appointing_department || ''}
                onChange={(e) => setFormData({ ...formData, appointing_department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterAppointingDepartment')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designation')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.workingOfficeName')}</label>
              <input
                type="text"
                value={formData.working_office_name || ''}
                onChange={(e) => setFormData({ ...formData, working_office_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('erms.enterWorkingOfficeName')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.taluka')}</label>
              <select
                value={formData.tal_id}
                onChange={(e) => setFormData({ ...formData, tal_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.selectTaluka')}</option>
                {talukas.map(taluka => (
                  <option key={taluka.tal_id} value={taluka.tal_id}>{taluka.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfJoining')}</label>
              <input
                type="date"
                value={formData.date_of_joining || ''}
                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.office')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.dateOfServiceExpiry')}</label>
              <input
                type="date"
                value={formData.date_of_service_expiry || ''}
                onChange={(e) => setFormData({ ...formData, date_of_service_expiry: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.retirementReason')}</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('erms.selectReason')}</option>
                <option value="retirement">Retirement</option>
                <option value="resignation">Resignation</option>
                <option value="transfer">Transfer</option>
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
                  <option key={clerk} value={clerk}>{clerk}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={resetForm}
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
            <div className="flex items-center space-x-3">
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
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Employees</span>
              </button>
              <button
                onClick={() => setActiveTab('addEmployee')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'addEmployee'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>{t('erms.addEmployee')}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'employees' && renderEmployeesTab()}
          {activeTab === 'addEmployee' && renderAddEmployeeTab()}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designation')}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.taluka')}</label>
                  <select
                    value={formData.tal_id}
                    onChange={(e) => setFormData({ ...formData, tal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectTaluka')}</option>
                    {talukas.map(taluka => (
                      <option key={taluka.tal_id} value={taluka.tal_id}>{taluka.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.office')}</label>
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
                    <option value="retirement">Retirement</option>
                    <option value="resignation">Resignation</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
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
                onClick={handleAddEmployee}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('erms.adding') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    value={formData.emp_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.designation')}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.taluka')}</label>
                  <select
                    value={formData.tal_id}
                    onChange={(e) => setFormData({ ...formData, tal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('erms.selectTaluka')}</option>
                    {talukas.map(taluka => (
                      <option key={taluka.tal_id} value={taluka.tal_id}>{taluka.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.office')}</label>
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
                    <option value="retirement">Retirement</option>
                    <option value="resignation">Resignation</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.assignedClerk')}</label>
                  <input
                    type="text"
                    value={formData.assigned_clerk}
                    onChange={(e) => setFormData({ ...formData, assigned_clerk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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