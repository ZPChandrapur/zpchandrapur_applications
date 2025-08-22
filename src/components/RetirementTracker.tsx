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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementTrackerProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface RetirementProgressRecord {
  id: string;
  emp_id: string;
  employee_name: string;
  retirement_date: string | null;
  assigned_clerk: string | null;
  department: string | null;
  age: number | null;
  birth_certificate: string | null;
  birth_doc_submitted: string | null;
  medical_certificate: string | null;
  nomination: string | null;
  permanent_registration: string | null;
  computer_exam: string | null;
  language_exam: string | null;
  post_service_exam: string | null;
  verification: string | null;
  date_of_birth_verification: string | null;
  computer_exam_passed: string | null;
  marathi_hindi_exam_exemption: string | null;
  verification_completed: string | null;
  undertaking_taken: string | null;
  no_objection_certificate: string | null;
  retirement_order: string | null;
  overall_comment: string | null;
  last_updated: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
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
  const [editingRecord, setEditingRecord] = useState<RetirementProgressRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Data states
  const [progressRecords, setProgressRecords] = useState<RetirementProgressRecord[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RetirementProgressRecord[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRecords();
    setCurrentPage(1); // Reset to first page when filters change
  }, [progressRecords, selectedClerk, selectedDepartment, selectedStatus, searchTerm, userRole, userProfile]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchProgressRecords(),
        fetchClerks(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching retirement tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgressRecords = async () => {
    try {
      const { data, error } = await ermsClient
        .from('retirement_progress')
        .select(`
          id,
          emp_id,
          employee_name,
          retirement_date,
          assigned_clerk,
          department,
          age,
          birth_certificate,
          birth_doc_submitted,
          medical_certificate,
          nomination,
          permanent_registration,
          computer_exam,
          language_exam,
          post_service_exam,
          verification,
          date_of_birth_verification,
          computer_exam_passed,
          marathi_hindi_exam_exemption,
          verification_completed,
          undertaking_taken,
          no_objection_certificate,
          retirement_order,
          overall_comment,
          last_updated,
          created_at,
          updated_at
        `)
        .order('employee_name');
      
      if (error) throw error;
      
      setProgressRecords(data || []);
    } catch (error) {
      console.error('Error fetching progress records:', error);
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
      const uniqueDepartments = [...new Set(progressRecords.map(record => record.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterRecords = () => {
    let filtered = progressRecords;

    // Role-based filtering
    if (userRole === 'clerk' && userProfile?.name) {
      filtered = filtered.filter(record => record.assigned_clerk === userProfile.name);
    }

    // Clerk filter (for non-clerk users)
    if (selectedClerk && userRole !== 'clerk') {
      const selectedClerkName = clerks.find(c => c.user_id === selectedClerk)?.name;
      if (selectedClerkName) {
        filtered = filtered.filter(record => record.assigned_clerk === selectedClerkName);
      }
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(record => record.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const getProgressStatus = (record: RetirementProgressRecord) => {
    const progressFields = [
      record.birth_certificate,
      record.medical_certificate,
      record.nomination,
      record.permanent_registration,
      record.computer_exam,
      record.language_exam,
      record.verification,
      record.retirement_order
    ];

    const filledFields = progressFields.filter(field => field && field.trim() !== '').length;
    const totalFields = progressFields.length;

    if (filledFields === 0) return 'pending';
    if (filledFields === totalFields) return 'completed';
    return 'processing';
  };

  const getStatusCounts = () => {
    const total = filteredRecords.length;
    const processing = filteredRecords.filter(record => getProgressStatus(record) === 'processing').length;
    const completed = filteredRecords.filter(record => getProgressStatus(record) === 'completed').length;
    const pending = filteredRecords.filter(record => getProgressStatus(record) === 'pending').length;

    return { total, processing, completed, pending };
  };

  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredRecords.length / recordsPerPage);
  };

  const handleEditRecord = (record: RetirementProgressRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('retirement_progress')
        .update({
          birth_certificate: editingRecord.birth_certificate,
          birth_doc_submitted: editingRecord.birth_doc_submitted,
          medical_certificate: editingRecord.medical_certificate,
          nomination: editingRecord.nomination,
          permanent_registration: editingRecord.permanent_registration,
          computer_exam: editingRecord.computer_exam,
          language_exam: editingRecord.language_exam,
          post_service_exam: editingRecord.post_service_exam,
          verification: editingRecord.verification,
          date_of_birth_verification: editingRecord.date_of_birth_verification,
          computer_exam_passed: editingRecord.computer_exam_passed,
          marathi_hindi_exam_exemption: editingRecord.marathi_hindi_exam_exemption,
          verification_completed: editingRecord.verification_completed,
          undertaking_taken: editingRecord.undertaking_taken,
          no_objection_certificate: editingRecord.no_objection_certificate,
          retirement_order: editingRecord.retirement_order,
          overall_comment: editingRecord.overall_comment,
          last_updated: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) throw error;
      
      await fetchProgressRecords();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
    setSelectedStatus('');
  };

  const statusCounts = getStatusCounts();
  const paginatedRecords = getPaginatedRecords();
  const totalPages = getTotalPages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('retirementTracker.title')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {t('retirementTracker.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchAllData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
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
                <p className="text-sm text-gray-600 mb-1">{t('retirementTracker.totalCases')}</p>
                <p className="text-3xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('retirementTracker.processing')}</p>
                <p className="text-3xl font-bold text-orange-600">{statusCounts.processing}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('retirementTracker.completed')}</p>
                <p className="text-3xl font-bold text-green-600">{statusCounts.completed}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('retirementTracker.pending')}</p>
                <p className="text-3xl font-bold text-purple-600">{statusCounts.pending}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.progressRecords')}</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200">
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
                  placeholder={t('retirementTracker.searchEmployees')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('retirementTracker.allDepartments')}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('retirementTracker.allStatus')}</option>
                <option value="pending">{t('retirementTracker.pending')}</option>
                <option value="processing">{t('retirementTracker.processing')}</option>
                <option value="completed">{t('retirementTracker.completed')}</option>
              </select>

              {userRole !== 'clerk' && (
                <select
                  value={selectedClerk}
                  onChange={(e) => setSelectedClerk(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">{t('retirementTracker.allClerks')}</option>
                  {clerks.map(clerk => (
                    <option key={clerk.user_id} value={clerk.user_id}>
                      {clerk.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={clearFilters}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">{t('retirementTracker.clearFilters')}</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-500">
              {t('retirementTracker.showingRecords', { filtered: filteredRecords.length, total: progressRecords.length })}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">विभाग</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.age')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">नियुक्त लिपिक</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">जन्म दाखला</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">वैद्यकीय प्रमाणपत्र</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">नामांकन</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">कायमस्वरूपी नोंदणी</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">संगणक परीक्षा</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">भाषा परीक्षा</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">पडताळणी</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">सेवानिवृत्ती आदेश</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? t('retirementTracker.loadingData') : t('retirementTracker.noRecordsFound')}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => {
                    const status = getProgressStatus(record);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                            <div className="text-sm text-gray-500">{record.emp_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.age || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.assigned_clerk || t('erms.unassigned')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.birth_certificate ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.medical_certificate ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.nomination ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.permanent_registration ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.computer_exam ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.language_exam ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.verification ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 text-lg">
                            {record.retirement_order ? '✓' : '○'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditRecord(record)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {t('retirementTracker.showingPage', {
                    start: (currentPage - 1) * recordsPerPage + 1,
                    end: Math.min(currentPage * recordsPerPage, filteredRecords.length),
                    total: filteredRecords.length
                  })}
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
                            ? 'bg-purple-500 text-white border-purple-500'
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

        {/* Edit Modal - Placeholder for now */}
        {showEditModal && editingRecord && (
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
                        value={editingRecord.emp_id}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.employeeName')}</label>
                      <input
                        type="text"
                        value={editingRecord.employee_name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.assignedClerk')}</label>
                      <input
                        type="text"
                        value={editingRecord.assigned_clerk || t('erms.unassigned')}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Progress Fields - Placeholder */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">{t('retirementTracker.progressFields')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Birth Certificate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">जन्म दाखला</label>
                      <select
                        value={editingRecord.birth_certificate || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, birth_certificate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">{t('retirementTracker.selectStatus')}</option>
                        <option value="आहे">आहे</option>
                        <option value="नाही">नाही</option>
                        <option value="लागू नाही">लागू नाही</option>
                      </select>
                    </div>

                    {/* Medical Certificate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">वैद्यकीय प्रमाणपत्र</label>
                      <select
                        value={editingRecord.medical_certificate || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, medical_certificate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">{t('retirementTracker.selectStatus')}</option>
                        <option value="आहे">आहे</option>
                        <option value="नाही">नाही</option>
                        <option value="लागू नाही">लागू नाही</option>
                      </select>
                    </div>

                    {/* Add more fields as needed */}
                  </div>
                  
                  {/* Overall Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.overallComment')}</label>
                    <textarea
                      value={editingRecord.overall_comment || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, overall_comment: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('retirementTracker.enterOverallComment')}
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
                  onClick={handleUpdateRecord}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? t('common.saving') : t('common.update')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};