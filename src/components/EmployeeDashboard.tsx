import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  X,
  Users,
  ArrowLeft
} from 'lucide-react';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
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

interface Clerk {
  user_id: string;
  name: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [officeLocations, setOfficeLocations] = useState<Office[]>([]);
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [newEmployee, setNewEmployee] = useState<Employee>({
    emp_id: '',
    emp_name: '',
    date_of_birth: '',
    dept_id: '',
    designation_id: '',
    tal_id: '',
    office_id: '',
    retirement_date: '',
    assigned_clerk: '',
    reason: ''
  });

  // Load initial data
  useEffect(() => {
    // Add your data loading logic here
    loadEmployees();
    loadDepartments();
    loadDesignations();
    loadTalukas();
    loadOfficeLocations();
    loadClerks();
  }, []);

  const loadEmployees = async () => {
    // Add your API call to load employees
  };

  const loadDepartments = async () => {
    // Add your API call to load departments
  };

  const loadDesignations = async () => {
    // Add your API call to load designations
  };

  const loadTalukas = async () => {
    // Add your API call to load talukas
  };

  const loadOfficeLocations = async () => {
    // Add your API call to load office locations
  };

  const loadClerks = async () => {
    // Add your API call to load clerks
  };

  const handleAddEmployee = async () => {
    setIsLoading(true);
    try {
      // Add your API call to add employee
      setShowAddModal(false);
      loadEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error adding employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    setIsLoading(true);
    try {
      // Add your API call to update employee
      setShowEditModal(false);
      loadEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const translateDepartmentName = (department: string) => {
    // Add your translation logic here
    return department;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('common.back')}</span>
          </button>
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('erms.employeeDashboard')}</h1>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>{t('erms.addEmployee')}</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder={t('erms.searchEmployees')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <Filter className="h-5 w-5" />
          <span>{t('common.filter')}</span>
        </button>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('erms.employeeList')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('erms.employeeId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('erms.employeeName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('erms.department')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('erms.designation')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('erms.retirementDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.emp_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.emp_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.emp_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Add department name lookup here */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Add designation name lookup here */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.retirement_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setNewEmployee(employee);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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