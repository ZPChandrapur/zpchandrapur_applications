import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Building2,
  UserCheck,
  Calendar,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { ermsClient } from '../lib/supabase';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  id: string;
  emp_id: string;
  employee_name: string;
  date_of_birth: string | null;
  retirement_date: string | null;
  reason: string | null;
  assigned_clerk: string | null;
  dept_id: string | null;
  office_id: string | null;
  age: number | null;
  department: string | null;
  designation: string | null;
  taluka: string | null;
  office_name: string | null;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [clerks, setClerks] = useState<string[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, selectedDepartment, selectedClerk]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ermsClient
        .from('employee')
        .select('*')
        .order('employee_name');
      
      if (error) throw error;
      
      const employeeData = data || [];
      setEmployees(employeeData);
      
      // Extract unique departments and clerks
      const uniqueDepartments = [...new Set(employeeData.map(emp => emp.department).filter(Boolean))];
      const uniqueClerks = [...new Set(employeeData.map(emp => emp.assigned_clerk).filter(Boolean))];
      
      setDepartments(uniqueDepartments);
      setClerks(uniqueClerks);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    if (selectedClerk) {
      filtered = filtered.filter(emp => emp.assigned_clerk === selectedClerk);
    }

    setFilteredEmployees(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
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

  const getAssignedCount = () => {
    return employees.filter(emp => emp.assigned_clerk).length;
  };

  const getUnassignedCount = () => {
    return employees.filter(emp => !emp.assigned_clerk).length;
  };

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
                onClick={fetchEmployees}
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
                <p className="text-sm text-gray-600 mb-1">{t('erms.assigned')}</p>
                <p className="text-3xl font-bold text-green-600">{getAssignedCount()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('erms.unassigned')}</p>
                <p className="text-3xl font-bold text-red-600">{getUnassignedCount()}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-red-600" />
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <option key={dept} value={dept}>{dept}</option>
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

              <button
                onClick={clearFilters}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">{t('erms.clearFilters')}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.department')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.age')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.retirementDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.assignedClerk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('erms.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || selectedDepartment || selectedClerk 
                        ? t('erms.noDepartmentsFound') 
                        : t('erms.addFirstDepartment')
                      }
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
                          <button className="text-green-600 hover:text-green-900 p-1 rounded">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1 rounded">
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

          <div className="px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {t('erms.showingEmployees', { 
                filtered: filteredEmployees.length, 
                total: employees.length 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};