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

interface RetirementProgress {
  id: string;
  emp_id: string;
  employee_name: string;
  age: number | null;
  assigned_clerk: string | null;
  department: string | null;
  designation: string | null;
  status: string | null;
  date_of_birth_verification: string | null;
  date_of_birth_verification_date: string | null;
  date_of_birth_verification_comment: string | null;
  birth_document_submitted: string | null;
  birth_document_submitted_date: string | null;
  birth_document_submitted_comment: string | null;
  medical_certificate: string | null;
  medical_certificate_date: string | null;
  medical_certificate_comment: string | null;
  nomination: string | null;
  nomination_date: string | null;
  nomination_comment: string | null;
  permanent_registration: string | null;
  permanent_registration_date: string | null;
  permanent_registration_comment: string | null;
  computer_exam: string | null;
  computer_exam_date: string | null;
  computer_exam_comment: string | null;
  marathi_hindi_exam_exemption: string | null;
  marathi_hindi_exam_exemption_date: string | null;
  marathi_hindi_exam_exemption_comment: string | null;
  verification_completed: string | null;
  verification_completed_date: string | null;
  verification_completed_comment: string | null;
  undertaking_taken_21_12_2021: string | null;
  undertaking_taken_21_12_2021_date: string | null;
  undertaking_taken_21_12_2021_comment: string | null;
  no_objection_no_inquiry_certificate: string | null;
  no_objection_no_inquiry_certificate_date: string | null;
  no_objection_no_inquiry_certificate_comment: string | null;
  retirement_order: string | null;
  retirement_order_date: string | null;
  retirement_order_comment: string | null;
  overall_comment: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

interface EditingProgress extends RetirementProgress {
  // All fields are already included in RetirementProgress
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
  const [editingProgress, setEditingProgress] = useState<EditingProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'inProgress' | 'pending' | 'completed'>('inProgress');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Data states
  const [retirementProgress, setRetirementProgress] = useState<RetirementProgress[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredProgress, setFilteredProgress] = useState<RetirementProgress[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterProgress();
  }, [retirementProgress, selectedClerk, selectedDepartment, selectedStatus, searchTerm, userRole, userProfile]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when tab changes
  }, [activeTab]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRetirementProgress(),
        fetchClerks()
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
          date_of_birth_verification,
          date_of_birth_verification_date,
          date_of_birth_verification_comment,
          birth_document_submitted,
          birth_document_submitted_date,
          birth_document_submitted_comment,
          medical_certificate,
          medical_certificate_date,
          medical_certificate_comment,
          nomination,
          nomination_date,
          nomination_comment,
          permanent_registration,
          permanent_registration_date,
          permanent_registration_comment,
          computer_exam,
          computer_exam_date,
          computer_exam_comment,
          marathi_hindi_exam_exemption,
          marathi_hindi_exam_exemption_date,
          marathi_hindi_exam_exemption_comment,
          verification_completed,
          verification_completed_date,
          verification_completed_comment,
          undertaking_taken_21_12_2021,
          undertaking_taken_21_12_2021_date,
          undertaking_taken_21_12_2021_comment,
          no_objection_no_inquiry_certificate,
          no_objection_no_inquiry_certificate_date,
          no_objection_no_inquiry_certificate_comment,
          retirement_order,
          retirement_order_date,
          retirement_order_comment,
          overall_comment,
          created_at,
          updated_at
        `)
        .order('age', { ascending: false });
      
      if (error) throw error;
      
      // Update status for each record based on progress and save to database
      const progressWithUpdatedStatus = await Promise.all((data || []).map(async (progress) => {
        const calculatedStatus = getProgressStatus(progress);
        
        // Only update if status has changed
        if (progress.status !== calculatedStatus) {
          try {
            const { error: updateError } = await ermsClient
              .from('retirement_progress')
              .update({ status: calculatedStatus })
              .eq('id', progress.id);
            
            if (updateError) {
              console.error('Error updating status for progress:', progress.emp_id, updateError);
            } else {
              console.log(`Updated status for ${progress.emp_id}: ${calculatedStatus}`);
            }
          } catch (updateError) {
            console.error('Error updating progress status:', updateError);
          }
        }
        
        return { ...progress, status: calculatedStatus };
      }));
      
      setRetirementProgress(progressWithUpdatedStatus);
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

  const filterProgress = () => {
    let filtered = retirementProgress;

    // Role-based filtering
    if (userRole === 'clerk' && userProfile?.name) {
      // Clerk can only see their assigned records
      filtered = filtered.filter(progress => progress.assigned_clerk === userProfile.name);
    }

    // Clerk filter (for non-clerk users)
    if (selectedClerk && userRole !== 'clerk') {
      const selectedClerkName = clerks.find(c => c.user_id === selectedClerk)?.name;
      if (selectedClerkName) {
        filtered = filtered.filter(progress => progress.assigned_clerk === selectedClerkName);
      }
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(progress => progress.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(progress => getProgressStatus(progress) === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(progress => {
        const searchFields = [
          progress.emp_id,
          progress.employee_name,
          progress.department,
          progress.designation,
          progress.assigned_clerk
        ];
        
        return searchFields.some(field => 
          String(field || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredProgress(filtered);
  };

  const getProgressStatus = (progress: RetirementProgress) => {
    const progressFields = [
      progress.date_of_birth_verification,
      progress.birth_document_submitted,
      progress.medical_certificate,
      progress.nomination,
      progress.permanent_registration,
      progress.computer_exam,
      progress.marathi_hindi_exam_exemption,
      progress.verification_completed,
      progress.undertaking_taken_21_12_2021,
      progress.no_objection_no_inquiry_certificate,
      progress.retirement_order
    ];

    const filledFields = progressFields.filter(field => field && field.trim() !== '').length;
    const totalFields = progressFields.length;

    // Check if any field is "नाही (Not Available)" - if so, keep as processing
    const hasNotAvailable = progressFields.some(field => field === 'नाही');
    
    if (filledFields === 0) return 'pending';
    if (filledFields === totalFields && !hasNotAvailable) return 'completed';
    return 'processing';
  };

  const getStatusCounts = () => {
    const total = filteredProgress.length;
    const processing = filteredProgress.filter(progress => getProgressStatus(progress) === 'processing').length;
    const completed = filteredProgress.filter(progress => getProgressStatus(progress) === 'completed').length;
    const pending = filteredProgress.filter(progress => getProgressStatus(progress) === 'pending').length;

    return { total, processing, completed, pending };
  };

  const getTabFilteredProgress = () => {
    if (activeTab === 'completed') {
      return filteredProgress.filter(progress => getProgressStatus(progress) === 'completed');
    } else if (activeTab === 'pending') {
      return filteredProgress.filter(progress => getProgressStatus(progress) === 'pending');
    } else if (activeTab === 'inProgress') {
      return filteredProgress.filter(progress => {
        const status = getProgressStatus(progress);
        return status === 'processing';
      });
    }
    return filteredProgress;
  };

  const handleEditProgress = (progress: RetirementProgress) => {
    setEditingProgress(progress);
    setShowEditModal(true);
  };

  const handleUpdateProgress = async () => {
    if (!editingProgress) return;

    setIsLoading(true);
    try {
      // Calculate the new status based on the updated data
      const newStatus = getProgressStatus(editingProgress);
      
      const { error } = await ermsClient
        .from('retirement_progress')
        .update({
          date_of_birth_verification: editingProgress.date_of_birth_verification,
          date_of_birth_verification_date: editingProgress.date_of_birth_verification_date,
          date_of_birth_verification_comment: editingProgress.date_of_birth_verification_comment,
          birth_document_submitted: editingProgress.birth_document_submitted,
          birth_document_submitted_date: editingProgress.birth_document_submitted_date,
          birth_document_submitted_comment: editingProgress.birth_document_submitted_comment,
          medical_certificate: editingProgress.medical_certificate,
          medical_certificate_date: editingProgress.medical_certificate_date,
          medical_certificate_comment: editingProgress.medical_certificate_comment,
          nomination: editingProgress.nomination,
          nomination_date: editingProgress.nomination_date,
          nomination_comment: editingProgress.nomination_comment,
          permanent_registration: editingProgress.permanent_registration,
          permanent_registration_date: editingProgress.permanent_registration_date,
          permanent_registration_comment: editingProgress.permanent_registration_comment,
          computer_exam: editingProgress.computer_exam,
          computer_exam_date: editingProgress.computer_exam_date,
          computer_exam_comment: editingProgress.computer_exam_comment,
          marathi_hindi_exam_exemption: editingProgress.marathi_hindi_exam_exemption,
          marathi_hindi_exam_exemption_date: editingProgress.marathi_hindi_exam_exemption_date,
          marathi_hindi_exam_exemption_comment: editingProgress.marathi_hindi_exam_exemption_comment,
          verification_completed: editingProgress.verification_completed,
          verification_completed_date: editingProgress.verification_completed_date,
          verification_completed_comment: editingProgress.verification_completed_comment,
          undertaking_taken_21_12_2021: editingProgress.undertaking_taken_21_12_2021,
          undertaking_taken_21_12_2021_date: editingProgress.undertaking_taken_21_12_2021_date,
          undertaking_taken_21_12_2021_comment: editingProgress.undertaking_taken_21_12_2021_comment,
          no_objection_no_inquiry_certificate: editingProgress.no_objection_no_inquiry_certificate,
          no_objection_no_inquiry_certificate_date: editingProgress.no_objection_no_inquiry_certificate_date,
          no_objection_no_inquiry_certificate_comment: editingProgress.no_objection_no_inquiry_certificate_comment,
          retirement_order: editingProgress.retirement_order,
          retirement_order_date: editingProgress.retirement_order_date,
          retirement_order_comment: editingProgress.retirement_order_comment,
          overall_comment: editingProgress.overall_comment,
          status: newStatus
        })
        .eq('id', editingProgress.id);

      if (error) throw error;
      
      await fetchRetirementProgress();
      setShowEditModal(false);
      setEditingProgress(null);
    } catch (error) {
      console.error('Error updating progress:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClerk('');
    setSelectedDepartment('');
    setSelectedStatus('');
  };

  const getStatusSymbol = (status: string | null) => {
    if (!status || status.trim() === '') return <span className="text-gray-400">○</span>;
    
    switch (status) {
      case 'होय':
      case 'उपलब्ध':
      case 'जन्म प्रमाणपत्र':
      case 'पासपोर्ट':
      case 'स्थानांतर प्रमाणपत्र':
      case 'सोडणूक प्रमाणपत्र':
        return <span className="text-green-600 font-bold">✓</span>;
      case 'नाही':
        return <span className="text-red-600 font-bold">✗</span>;
      case 'लागू नाही':
        return <span className="text-blue-600 font-bold">△</span>;
      case 'सूट':
        return <span className="text-purple-600 font-bold">◊</span>;
      case 'इतर':
        return <span className="text-orange-600 font-bold">◈</span>;
      default:
        return <span className="text-orange-500 font-bold">◐</span>;
    }
  };

  const statusCounts = getStatusCounts();
  const tabFilteredProgress = getTabFilteredProgress();
  
  // Pagination logic
  const totalPages = Math.ceil(tabFilteredProgress.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = tabFilteredProgress.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getDepartments = () => {
    const departments = [...new Set(retirementProgress.map(p => p.department).filter(Boolean))];
    return departments.sort();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('retirementTracker.title')}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {userRole === 'clerk' 
                  ? `${t('erms.interactiveClerkView')} - ${userProfile?.name || t('erms.unknownClerk')}`
                  : t('erms.globalAdministrativeView')
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {userRole !== 'clerk' && (
                <select
                  value={selectedClerk}
                  onChange={(e) => setSelectedClerk(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <p className="text-xs text-gray-500">{t('retirementTracker.inProgress')}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('retirementTracker.completed')}</p>
                <p className="text-3xl font-bold text-green-600">{statusCounts.completed}</p>
                <p className="text-xs text-gray-500">{t('retirementTracker.complete')}</p>
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
                <p className="text-xs text-gray-500">{t('erms.awaitingApproval')}</p>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.progressRecords')}</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <Download className="h-4 w-4" />
                  <span className="text-sm">{t('common.export')}</span>
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('retirementTracker.searchEmployees')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('retirementTracker.allDepartments')}</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
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
                <option value="processing">{t('retirementTracker.processing')}</option>
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

              <button
                onClick={clearFilters}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">{t('retirementTracker.clearFilters')}</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('inProgress')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'inProgress'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('retirementTracker.inProgress')} ({statusCounts.processing})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'pending'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('retirementTracker.pending')} ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'completed'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('retirementTracker.completed')} ({statusCounts.completed})
                </button>
              </nav>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {t('retirementTracker.showingRecords', { filtered: tabFilteredProgress.length, total: filteredProgress.length })}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.age')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.assignedClerk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.department')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.designation')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.dateOfBirthVerification')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.birthDocumentSubmitted')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.medicalCertificate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.nomination')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.permanentRegistration')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.computerExam')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.marathiHindiExamExemption')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.verificationCompleted')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.undertakingTaken')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.noObjectionCertificate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.retirementOrder')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? t('retirementTracker.loadingData') : t('retirementTracker.noRecordsFound')}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((progress) => {
                    const status = getProgressStatus(progress);
                    const progressFields = [
                      progress.date_of_birth_verification,
                      progress.birth_document_submitted,
                      progress.medical_certificate,
                      progress.nomination,
                      progress.permanent_registration,
                      progress.computer_exam,
                      progress.marathi_hindi_exam_exemption,
                      progress.verification_completed,
                      progress.undertaking_taken_21_12_2021,
                      progress.no_objection_no_inquiry_certificate,
                      progress.retirement_order
                    ];
                    const filledFields = progressFields.filter(field => field && field.trim() !== '').length;
                    const progressPercentage = Math.round((filledFields / progressFields.length) * 100);

                    return (
                      <tr key={progress.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{progress.employee_name}</div>
                            <div className="text-sm text-gray-500">{progress.emp_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {progress.age || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {progress.assigned_clerk || t('erms.unassigned')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {progress.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {progress.designation || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.date_of_birth_verification)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.birth_document_submitted)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.medical_certificate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.nomination)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.permanent_registration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.computer_exam)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.marathi_hindi_exam_exemption)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.verification_completed)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.undertaking_taken_21_12_2021)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.no_objection_no_inquiry_certificate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(progress.retirement_order)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'completed' ? 'bg-green-100 text-green-800' :
                            status === 'processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                            {status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {t(`retirementTracker.${status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditProgress(progress)}
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
                    start: startIndex + 1, 
                    end: Math.min(endIndex, tabFilteredProgress.length), 
                    total: tabFilteredProgress.length 
                  })}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Progress Modal */}
      {showEditModal && editingProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.employeeId')}</label>
                    <input
                      type="text"
                      value={editingProgress.emp_id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.employeeName')}</label>
                    <input
                      type="text"
                      value={editingProgress.employee_name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.assignedClerk')}</label>
                    <input
                      type="text"
                      value={editingProgress.assigned_clerk || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.department')}</label>
                    <input
                      type="text"
                      value={editingProgress.department || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Fields */}
              <div className="space-y-6">
                {/* Date of Birth Verification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.dateOfBirthVerification')}</label>
                    <select
                      value={editingProgress.date_of_birth_verification || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, date_of_birth_verification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.date_of_birth_verification_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, date_of_birth_verification_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.date_of_birth_verification_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, date_of_birth_verification_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Birth Document Submitted */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.birthDocumentSubmitted')}</label>
                    <select
                      value={editingProgress.birth_document_submitted || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, birth_document_submitted: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="जन्म प्रमाणपत्र">{t('retirementTracker.birthCertificate')}</option>
                      <option value="पासपोर्ट">{t('retirementTracker.passport')}</option>
                      <option value="स्थानांतर प्रमाणपत्र">{t('retirementTracker.transferCertificate')}</option>
                      <option value="सोडणूक प्रमाणपत्र">{t('retirementTracker.leavingCertificate')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.birth_document_submitted_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, birth_document_submitted_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.birth_document_submitted_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, birth_document_submitted_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Medical Certificate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.medicalCertificate')}</label>
                    <select
                      value={editingProgress.medical_certificate || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, medical_certificate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.medical_certificate_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, medical_certificate_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.medical_certificate_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, medical_certificate_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Nomination */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.nomination')}</label>
                    <select
                      value={editingProgress.nomination || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, nomination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.nomination_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, nomination_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.nomination_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, nomination_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Permanent Registration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.permanentRegistration')}</label>
                    <select
                      value={editingProgress.permanent_registration || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, permanent_registration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.permanent_registration_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, permanent_registration_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.permanent_registration_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, permanent_registration_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Computer Exam */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.computerExam')}</label>
                    <select
                      value={editingProgress.computer_exam || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, computer_exam: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                      <option value="सूट">सूट</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.computer_exam_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, computer_exam_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.computer_exam_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, computer_exam_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Marathi Hindi Exam Exemption */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.marathiHindiExamExemption')}</label>
                    <select
                      value={editingProgress.marathi_hindi_exam_exemption || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, marathi_hindi_exam_exemption: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                      <option value="सूट">सूट</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.marathi_hindi_exam_exemption_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, marathi_hindi_exam_exemption_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.marathi_hindi_exam_exemption_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, marathi_hindi_exam_exemption_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Verification Completed */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.verificationCompleted')}</label>
                    <select
                      value={editingProgress.verification_completed || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, verification_completed: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.verification_completed_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, verification_completed_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.verification_completed_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, verification_completed_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Undertaking Taken */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.undertakingTaken')}</label>
                    <select
                      value={editingProgress.undertaking_taken_21_12_2021 || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, undertaking_taken_21_12_2021: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.undertaking_taken_21_12_2021_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, undertaking_taken_21_12_2021_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.undertaking_taken_21_12_2021_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, undertaking_taken_21_12_2021_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* No Objection Certificate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.noObjectionCertificate')}</label>
                    <select
                      value={editingProgress.no_objection_no_inquiry_certificate || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, no_objection_no_inquiry_certificate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.no_objection_no_inquiry_certificate_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, no_objection_no_inquiry_certificate_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.no_objection_no_inquiry_certificate_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, no_objection_no_inquiry_certificate_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Retirement Order */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.retirementOrder')}</label>
                    <select
                      value={editingProgress.retirement_order || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, retirement_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingProgress.retirement_order_date || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, retirement_order_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingProgress.retirement_order_comment || ''}
                      onChange={(e) => setEditingProgress({ ...editingProgress, retirement_order_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Overall Comment */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.overallComment')}</label>
                  <textarea
                    value={editingProgress.overall_comment || ''}
                    onChange={(e) => setEditingProgress({ ...editingProgress, overall_comment: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onClick={handleUpdateProgress}
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