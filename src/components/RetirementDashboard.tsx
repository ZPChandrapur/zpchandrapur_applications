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
import { PayCommission } from './PayCommission';
import { GroupInsurance } from './GroupInsurance';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface RetirementRecord {
  id: string;
  emp_id: string;
  employee_name: string;
  retirement_date: string | null;
  assigned_clerk: string | null;
  department: string | null;
  age: number | null;
  status: string | null;
  retirement_progress_status: string | null;
  pay_commission_status: string | null;
  group_insurance_status: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

export const RetirementDashboard: React.FC<RetirementDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RetirementRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'retirementProgress' | 'payCommission' | 'groupInsurance'>('retirementProgress');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Data states
  const [retirementRecords, setRetirementRecords] = useState<RetirementRecord[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RetirementRecord[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRecords();
    setCurrentPage(1); // Reset to first page when filters change
  }, [retirementRecords, selectedClerk, selectedDepartment, selectedStatus, searchTerm, userRole, userProfile]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRetirementRecords(),
        fetchClerks(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching retirement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRetirementRecords = async () => {
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement')
        .select(`
          id,
          emp_id,
          employee_name,
          retirement_date,
          assigned_clerk,
          department,
          age,
          status,
          retirement_progress_status,
          pay_commission_status,
          group_insurance_status,
          created_at,
          updated_at
        `)
        .order('employee_name');
      
      if (error) throw error;
      
      setRetirementRecords(data || []);
    } catch (error) {
      console.error('Error fetching retirement records:', error);
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
      const uniqueDepartments = [...new Set(retirementRecords.map(record => record.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterRecords = () => {
    let filtered = retirementRecords;

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

  const getStatusCounts = () => {
    const total = filteredRecords.length;
    const processing = filteredRecords.filter(record => record.status === 'processing').length;
    const completed = filteredRecords.filter(record => record.status === 'completed').length;
    const pending = filteredRecords.filter(record => record.status === 'pending').length;

    return { total, processing, completed, pending };
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredRecords.length / recordsPerPage);
  };

  const handleEditRecord = (record: RetirementRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;

    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee_retirement')
        .update({
          status: editingRecord.status,
          retirement_progress_status: editingRecord.retirement_progress_status,
          pay_commission_status: editingRecord.pay_commission_status,
          group_insurance_status: editingRecord.group_insurance_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) throw error;
      
      await fetchRetirementRecords();
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

  // Render different tabs
  if (activeTab === 'payCommission') {
    return <PayCommission user={user} />;
  }

  if (activeTab === 'groupInsurance') {
    return <GroupInsurance user={user} />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Process Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.processOverview')}</h3>
          <span className="text-sm text-gray-500">
            {statusCounts.total > 0 ? Math.round((statusCounts.completed / statusCounts.total) * 100) : 0}% {t('retirementTracker.complete')}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-300"
            style={{
              width: statusCounts.total > 0 ? `${(statusCounts.completed / statusCounts.total) * 100}%` : '0%'
            }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
            <div className="text-sm text-gray-600">{t('retirementTracker.totalCases')}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">{t('retirementTracker.completed')}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.processing}</div>
            <div className="text-sm text-gray-600">{t('retirementTracker.inProgress')}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600">{t('retirementTracker.pending')}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('retirementProgress')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'retirementProgress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('retirementTracker.retirementProgress')}
            </button>
            <button
              onClick={() => setActiveTab('payCommission')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'payCommission'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('retirementTracker.payCommission')}
            </button>
            <button
              onClick={() => setActiveTab('groupInsurance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'groupInsurance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('retirementTracker.groupInsurance')}
            </button>
          </nav>
        </div>

        {/* Retirement Progress Tracker Table */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.progressRecords')}</h3>
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
                <option key={dept} value={dept}>{dept}</option>
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

            <button
              onClick={clearFilters}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <X className="h-4 w-4" />
              <span className="text-sm">{t('retirementTracker.clearFilters')}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.employee')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.department')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirement Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.age')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.assignedClerk')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirement Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {isLoading ? t('retirementTracker.loadingData') : t('retirementTracker.noRecordsFound')}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
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
                      {record.retirement_date ? new Date(record.retirement_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.age || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.assigned_clerk || t('erms.unassigned')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.retirement_progress_status)}`}>
                        {record.retirement_progress_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.pay_commission_status)}`}>
                        {record.pay_commission_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.group_insurance_status)}`}>
                        {record.group_insurance_status || 'pending'}
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

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Retirement Details</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.age')}</label>
                    <input
                      type="text"
                      value={editingRecord.age || '-'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retirement Progress Status</label>
                    <select
                      value={editingRecord.retirement_progress_status || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, retirement_progress_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pay Commission Status</label>
                    <select
                      value={editingRecord.pay_commission_status || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, pay_commission_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Insurance Status</label>
                    <select
                      value={editingRecord.group_insurance_status || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, group_insurance_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
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
                onClick={handleUpdateRecord}
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