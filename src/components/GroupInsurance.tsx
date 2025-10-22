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

interface GroupInsuranceProps {
  user: SupabaseUser;
}

interface GroupInsuranceRecord {
  id: string;
  emp_id: string;
  employee_name: string;
  retirement_date: string | null;
  assigned_clerk: string | null;
  department: string | null;
  age: number | null;
  year_1990: string | null;
  year_2003: string | null;
  year_2010: string | null;
  year_2020: string | null;
  overall_comments: string | null;
  last_updated: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

const GroupInsurance: React.FC<GroupInsuranceProps> = ({ user }) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions(user);

  // State declarations
  const [loading, setLoading] = useState(true);
  const [groupInsuranceRecords, setGroupInsuranceRecords] = useState<GroupInsuranceRecord[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<GroupInsuranceRecord[]>([]);
  const [selectedClerk, setSelectedClerk] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GroupInsuranceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // LocalStorage persistence keys (universal pattern: change prefix for other pages)
  const STORAGE_KEYS = {
    currentPage: 'groupInsurance-currentPage',
    activeTab: 'groupInsurance-activeTab',
  };

  // Load persisted state on mount
  useEffect(() => {
    const savedPage = localStorage.getItem(STORAGE_KEYS.currentPage);
    if (savedPage) {
      setCurrentPage(parseInt(savedPage, 10) || 1);
    }
    const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);
    if (savedTab && ['all', 'in_progress', 'pending', 'completed'].includes(savedTab)) {
      setActiveTab(savedTab as 'all' | 'in_progress' | 'pending' | 'completed');
    }
  }, []);

  // Save currentPage to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentPage, currentPage.toString());
  }, [currentPage]);

  // Save activeTab to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab]);

  // Fetch all initial data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [recordsRes, clerksRes] = await Promise.all([
        ermsClient.from('group_insurance').select('*').order('employee_name'),
        supabase.from('user_roles').select('id, full_name, email, role').eq('role', 'clerk')
      ]);
      const records = recordsRes.data || [];
      const clerksData = clerksRes.data || [];
      setGroupInsuranceRecords(records);
      setClerks(clerksData);

      const uniqueDepts = [...new Set(records.map(r => r.department).filter(Boolean))].sort();
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter records based on selections
  const filterRecords = useCallback(() => {
    let filtered = [...groupInsuranceRecords];

    // Role-based filtering for clerks
    if (hasPermission('clerk')) {
      filtered = filtered.filter(record => record.assigned_clerk === user.email);
    }

    // Clerk filter
    if (selectedClerk) {
      filtered = filtered.filter(record => record.assigned_clerk === selectedClerk);
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(record => record.department === selectedDepartment);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.employee_name.toLowerCase().includes(term) ||
        record.emp_id.includes(term) ||
        record.department?.toLowerCase().includes(term)
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page on filter change (existing behavior)
  }, [groupInsuranceRecords, selectedClerk, selectedDepartment, searchTerm, hasPermission, user.email]);

  // Progress status helper
  const getProgressStatus = useCallback((record: GroupInsuranceRecord) => {
    const years = [record.year_1990, record.year_2003, record.year_2010, record.year_2020];
    const filledCount = years.filter(year => year && year !== 'नाही' && year !== 'No').length;
    if (filledCount === 0) return 'pending';
    if (filledCount === 4) return 'completed';
    return 'in_progress';
  }, []);

  // Get status counts
  const getStatusCounts = useCallback(() => {
    const counts = { all: 0, pending: 0, in_progress: 0, completed: 0 };
    filteredRecords.forEach(record => {
      const status = getProgressStatus(record);
      counts[status]++;
      counts.all++;
    });
    return counts;
  }, [filteredRecords, getProgressStatus]);

  // Get records for active tab
  const getTabFilteredRecords = useCallback(() => {
    if (activeTab === 'all') return filteredRecords;
    return filteredRecords.filter(record => getProgressStatus(record) === activeTab);
  }, [filteredRecords, activeTab, getProgressStatus]);

  // Pagination helpers
  const PAGE_SIZE = 20;
  const getPaginatedRecords = useCallback(() => {
    const tabRecords = getTabFilteredRecords();
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return tabRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [getTabFilteredRecords, currentPage]);

  const getTotalPages = useCallback(() => {
    const tabRecords = getTabFilteredRecords();
    return Math.ceil(tabRecords.length / PAGE_SIZE);
  }, [getTabFilteredRecords]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= getTotalPages()) {
      setCurrentPage(page);
    }
  };

  // Effects
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [filterRecords]);

  // Status filter effect (resets page if needed, existing)
  useEffect(() => {
    if (statusFilter !== 'all') {
      const statusRecords = filteredRecords.filter(r => getProgressStatus(r) === statusFilter);
      if (currentPage > Math.ceil(statusRecords.length / PAGE_SIZE)) {
        setCurrentPage(1);
      }
    }
  }, [statusFilter, filteredRecords, getProgressStatus, currentPage]);

  // Clear filters
  const clearFilters = () => {
    setSelectedClerk('');
    setSelectedDepartment('');
    setSearchTerm('');
    setStatusFilter('all');
    setActiveTab('all');
  };

  // Open edit modal
  const openEditModal = (record: GroupInsuranceRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  // Save record
  const saveRecord = async (updatedData: Partial<GroupInsuranceRecord>) => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      const { error } = await ermsClient
        .from('group_insurance')
        .update({ ...updatedData, last_updated: new Date().toISOString() })
        .eq('id', editingRecord.id);
      if (error) throw error;
      await fetchAllData(); // Refresh data
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error saving record:', error);
    } finally {
      setSaving(false);
    }
  };

  const { all, pending, in_progress, completed } = getStatusCounts();
  const paginatedRecords = getPaginatedRecords();
  const totalPages = getTotalPages();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('total_cases')}</p>
              <p className="text-2xl font-bold text-gray-900">{all}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('in_progress')}</p>
              <p className="text-2xl font-bold text-gray-900">{in_progress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('pending')}</p>
              <p className="text-2xl font-bold text-gray-900">{pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('completed')}</p>
              <p className="text-2xl font-bold text-gray-900">{completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('progress_overview')}</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" 
              style={{ width: `${(completed / Math.max(1, all)) * 100}%` }}
            ></div>
          </div>
          <span className="ml-4 text-sm font-medium">{Math.round((completed / Math.max(1, all)) * 100)}% {t('completed')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{in_progress}</p>
            <p className="text-sm text-gray-600">{t('in_progress')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{pending}</p>
            <p className="text-sm text-gray-600">{t('pending')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completed}</p>
            <p className="text-sm text-gray-600">{t('completed')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{all}</p>
            <p className="text-sm text-gray-600">{t('total')}</p>
          </div>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_employee')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('department')}</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('all_departments')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          {hasPermission('admin') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('assigned_clerk')}</label>
              <select
                value={selectedClerk}
                onChange={(e) => setSelectedClerk(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('all_clerks')}</option>
                {clerks.map(clerk => (
                  <option key={clerk.id} value={clerk.email}>{clerk.full_name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('all_statuses')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="in_progress">{t('in_progress')}</option>
              <option value="completed">{t('completed')}</option>
            </select>
          </div>
        </div>
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('clear_filters')}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all' as const, label: t('all'), count: all },
              { key: 'in_progress' as const, label: t('in_progress'), count: in_progress },
              { key: 'pending' as const, label: t('pending'), count: pending },
              { key: 'completed' as const, label: t('completed'), count: completed }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-200 rounded-full px-2 py-0.5 text-xs font-bold">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('employee_id')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('employee_name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('department')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('retirement_date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('age')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('assigned_clerk')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                1990
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2003
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2010
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2020
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRecords.map((record) => {
              const status = getProgressStatus(record);
              return (
                <tr key={record.id} className={status === 'completed' ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.emp_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.retirement_date ? new Date(record.retirement_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.age || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.assigned_clerk || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <CheckCircle className={`h-5 w-5 ${record.year_1990 && record.year_1990 !== 'नाही' ? 'text-green-500' : 'text-gray-300'}`} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <CheckCircle className={`h-5 w-5 ${record.year_2003 && record.year_2003 !== 'नाही' ? 'text-green-500' : 'text-gray-300'}`} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <CheckCircle className={`h-5 w-5 ${record.year_2010 && record.year_2010 !== 'नाही' ? 'text-green-500' : 'text-gray-300'}`} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <CheckCircle className={`h-5 w-5 ${record.year_2020 && record.year_2020 !== 'नाही' ? 'text-green-500' : 'text-gray-300'}`} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedRecords.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                  {t('no_records_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-1" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, getTabFilteredRecords().length)}</span> of{' '}
                <span className="font-medium">{getTabFilteredRecords().length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage + i - 3;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('edit_record')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input type="text" value={editingRecord.emp_id} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('employee_name')}</label>
                  <input type="text" value={editingRecord.employee_name} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('department')}</label>
                  <input type="text" value={editingRecord.department || ''} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirement_date')}</label>
                  <input type="date" value={editingRecord.retirement_date ? new Date(editingRecord.retirement_date).toISOString().split('T')[0] : ''} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1990</label>
                  <select
                    value={editingRecord.year_1990 || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year_1990: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="आहे">आहे</option>
                    <option value="नाही">नाही</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2003</label>
                  <select
                    value={editingRecord.year_2003 || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year_2003: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="आहे">आहे</option>
                    <option value="नाही">नाही</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2010</label>
                  <select
                    value={editingRecord.year_2010 || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year_2010: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="आहे">आहे</option>
                    <option value="नाही">नाही</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2020</label>
                  <select
                    value={editingRecord.year_2020 || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year_2020: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="आहे">आहे</option>
                    <option value="नाही">नाही</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('overall_comments')}</label>
                <textarea
                  value={editingRecord.overall_comments || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, overall_comments: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder={t('add_comments')}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowEditModal(false); setEditingRecord(null); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => saveRecord(editingRecord)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInsurance;