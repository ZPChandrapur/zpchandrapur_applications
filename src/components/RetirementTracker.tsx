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
  User,
  X,
  Search,
  ChevronDown
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementTrackerProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface RetirementProgress {
  id: string;
  emp_id: string;
  employee_name: string;
  age: number | null;
  assigned_clerk: string | null;
  department: string | null;
  designation: string | null;
  status: string | null;
  birth_certificate: string | null;
  birth_doc_submitted: string | null;
  medical_certificate: string | null;
  nomination: string | null;
  permanent_registration: string | null;
  computer_exam: string | null;
  language_exam: string | null;
  post_service_exam: string | null;
  verification: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

interface Department {
  dept_id: string;
  department: string;
}

export const RetirementTracker: React.FC<RetirementTrackerProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<RetirementProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'payCommission' | 'groupInsurance'>('progress');
  
  // Data states
  const [retirementProgress, setRetirementProgress] = useState<RetirementProgress[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<RetirementProgress[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [retirementProgress, selectedClerk, selectedDepartment, selectedStatus, searchTerm, userRole, userProfile]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRetirementProgress(),
        fetchClerks(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching retirement tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRetirementProgress = async () => {
    try {
      const { data, error } = await ermsClient
        .from('retirement_progress')
        .select(`
          id,
          emp_id,
          employee_name,
          age,
          assigned_clerk,
          department,
          designation,
          status,
          birth_certificate,
          birth_doc_submitted,
          medical_certificate,
          nomination,
          permanent_registration,
          computer_exam,
          language_exam,
          post_service_exam,
          verification,
          created_at,
          updated_at
        `)
        .order('age', { ascending: false });
      
      if (error) throw error;
      
      // Update status for each employee based on progress and save to database
      const employeesWithUpdatedStatus = await Promise.all((data || []).map(async (employee) => {
        const calculatedStatus = getProgressStatus(employee);
        
        // Only update if status has changed
        if (employee.status !== calculatedStatus) {
          try {
            const { error: updateError } = await ermsClient
              .from('retirement_progress')
              .update({ status: calculatedStatus })
              .eq('id', employee.id);
            
            if (updateError) {
              console.error('Error updating status for employee:', employee.emp_id, updateError);
            } else {
              console.log(`Updated status for ${employee.emp_id}: ${calculatedStatus}`);
            }
          } catch (updateError) {
            console.error('Error updating employee status:', updateError);
          }
        }
        
        return { ...employee, status: calculatedStatus };
      }));
      
      setRetirementProgress(employeesWithUpdatedStatus);
    } catch (error) {
      console.error('Error fetching retirement progress:', error);
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

  const filterEmployees = () => {
    let filtered = retirementProgress;

    // Role-based filtering
    if (userRole === 'clerk' && userProfile?.name) {
      // Clerk can only see their assigned employees
      filtered = filtered.filter(emp => emp.assigned_clerk === userProfile.name);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Clerk filter (for non-clerk users)
    if (selectedClerk && userRole !== 'clerk') {
      const selectedClerkName = clerks.find(c => c.user_id === selectedClerk)?.name;
      if (selectedClerkName) {
        filtered = filtered.filter(emp => emp.assigned_clerk === selectedClerkName);
      }
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(emp => getProgressStatus(emp) === selectedStatus);
    }

    setFilteredEmployees(filtered);
  };

  const getProgressStatus = (employee: RetirementProgress) => {
    const progressFields = [
      employee.birth_certificate,
      employee.birth_doc_submitted,
      employee.medical_certificate,
      employee.nomination,
      employee.permanent_registration,
      employee.computer_exam,
      employee.language_exam,
      employee.post_service_exam,
      employee.verification
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

  const handleEditEmployee = (employee: RetirementProgress) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsLoading(true);
    try {
      // Calculate the new status based on the updated data
      const newStatus = getProgressStatus(editingEmployee);
      
      const { error } = await ermsClient
        .from('retirement_progress')
        .update({
          assigned_clerk: editingEmployee.assigned_clerk,
          department: editingEmployee.department,
          designation: editingEmployee.designation,
          status: newStatus,
          birth_certificate: editingEmployee.birth_certificate,
          birth_doc_submitted: editingEmployee.birth_doc_submitted,
          medical_certificate: editingEmployee.medical_certificate,
          nomination: editingEmployee.nomination,
          permanent_registration: editingEmployee.permanent_registration,
          computer_exam: editingEmployee.computer_exam,
          language_exam: editingEmployee.language_exam,
          post_service_exam: editingEmployee.post_service_exam,
          verification: editingEmployee.verification
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;
      
      await fetchRetirementProgress();
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status || status === 'pending') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-orange-500" />;
  };

  const getFieldIcon = (field: string | null) => {
    if (!field || field.trim() === '') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClerk('');
    setSelectedDepartment('');
    setSelectedStatus('');
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('retirementTracker.title')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('retirementTracker.subtitle')}</p>
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
                onClick={() => setActiveTab('progress')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>{t('retirementTracker.retirementProgress')}</span>
              </button>
              <button
                onClick={() => setActiveTab('payCommission')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'payCommission'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>{t('retirementTracker.payCommission')}</span>
              </button>
              <button
                onClick={() => setActiveTab('groupInsurance')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'groupInsurance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>{t('retirementTracker.groupInsurance')}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.processOverview')}</h3>
            <span className="text-sm text-gray-500">{statusCounts.completed > 0 ? Math.round((statusCounts.completed / statusCounts.total) * 100) : 0}% {t('retirementTracker.complete')}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
              style={{ width: statusCounts.total > 0 ? `${(statusCounts.completed / statusCounts.total) * 100}%` : '0%' }}
            />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
              <div className="text-sm text-gray-600">{t('retirementTracker.totalCases')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
              <div className="text-sm text-gray-600">{t('retirementTracker.completed')}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.processing}</div>
              <div className="text-sm text-gray-600">{t('retirementTracker.inProgress')}</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statusCounts.pending}</div>
              <div className="text-sm text-gray-600">{t('retirementTracker.pending')}</div>
            </div>
          </div>
        </div>

        {/* Filters and Records */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.progressRecords')}</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm">{t('retirementTracker.clearFilters')}</span>
                </button>
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
                  placeholder={t('retirementTracker.searchEmployees')}
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
                <option value="">{t('retirementTracker.allDepartments')}</option>
                {departments.map(dept => (
                  <option key={dept.dept_id} value={dept.department}>
                    {dept.department}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('retirementTracker.allStatus')}</option>
                <option value="pending">{t('retirementTracker.pending')}</option>
                <option value="processing">{t('retirementTracker.inProgress')}</option>
                <option value="completed">{t('retirementTracker.completed')}</option>
              </select>

              {userRole !== 'clerk' && (
                <select
                  value={selectedClerk}
                  onChange={(e) => setSelectedClerk(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('retirementTracker.allClerks')}</option>
                  {clerks.map(clerk => (
                    <option key={clerk.user_id} value={clerk.user_id}>
                      {clerk.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {t('retirementTracker.showingRecords', { filtered: filteredEmployees.length, total: retirementProgress.length })}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.birthCertificate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.birthDocSubmitted')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.medicalCertificate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.nomination')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.permanentRegistration')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.computerExam')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.languageExam')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.postServiceExam')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.verification')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? t('retirementTracker.loadingData') : t('retirementTracker.noRecordsFound')}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const status = getProgressStatus(employee);
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                            <div className="text-sm text-gray-500">{employee.emp_id}</div>
                            <div className="text-xs text-gray-400">{t('retirementTracker.age')}: {employee.age || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'completed' ? 'bg-green-100 text-green-800' :
                            status === 'processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getStatusIcon(status)}
                            <span className="ml-1">{t(`retirementTracker.${status}`)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.birth_certificate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.birth_doc_submitted)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.medical_certificate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.nomination)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.permanent_registration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.computer_exam)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.language_exam)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.post_service_exam)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getFieldIcon(employee.verification)}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.editProgressDetails')}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Basic Employee Info (Read-only) */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-800 mb-3">{t('retirementTracker.basicEmployeeInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.employeeId')}</label>
                    <input
                      type="text"
                      value={editingEmployee.emp_id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.employeeName')}</label>
                    <input
                      type="text"
                      value={editingEmployee.employee_name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.age')}</label>
                    <input
                      type="text"
                      value={editingEmployee.age || '-'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.assignedClerk')}</label>
                    <input
                      type="text"
                      value={editingEmployee.assigned_clerk || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, assigned_clerk: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.department')}</label>
                    <input
                      type="text"
                      value={editingEmployee.department || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.designation')}</label>
                    <input
                      type="text"
                      value={editingEmployee.designation || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.birthCertificate')}</label>
                    <input
                      type="text"
                      value={editingEmployee.birth_certificate || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, birth_certificate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.birthDocSubmitted')}</label>
                    <input
                      type="text"
                      value={editingEmployee.birth_doc_submitted || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, birth_doc_submitted: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.medicalCertificate')}</label>
                    <input
                      type="text"
                      value={editingEmployee.medical_certificate || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, medical_certificate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.nomination')}</label>
                    <input
                      type="text"
                      value={editingEmployee.nomination || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, nomination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.permanentRegistration')}</label>
                    <input
                      type="text"
                      value={editingEmployee.permanent_registration || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, permanent_registration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.computerExam')}</label>
                    <input
                      type="text"
                      value={editingEmployee.computer_exam || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, computer_exam: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.languageExam')}</label>
                    <input
                      type="text"
                      value={editingEmployee.language_exam || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, language_exam: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.postServiceExam')}</label>
                    <input
                      type="text"
                      value={editingEmployee.post_service_exam || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, post_service_exam: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.verification')}</label>
                    <input
                      type="text"
                      value={editingEmployee.verification || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, verification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onClick={handleUpdateEmployee}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};