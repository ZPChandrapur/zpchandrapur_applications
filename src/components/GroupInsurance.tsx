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
  year_1990_comment: string | null;
  year_2003_comment: string | null;
  year_2010_comment: string | null;
  year_2020_comment: string | null;
  year_1990_date: string | null;
  year_2003_date: string | null;
  year_2010_date: string | null;
  year_2020_date: string | null;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

export const GroupInsurance: React.FC<GroupInsuranceProps> = ({ user }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GroupInsuranceRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'inProgress' | 'pending' | 'completed'>('inProgress');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Data states
  const [groupInsuranceRecords, setGroupInsuranceRecords] = useState<GroupInsuranceRecord[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<GroupInsuranceRecord[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRecords();
    setCurrentPage(1); // Reset to first page when filters change
  }, [groupInsuranceRecords, selectedClerk, selectedDepartment, selectedStatus, searchTerm, userRole, userProfile]);

  // New useEffect for tab switch reset
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // New useEffect for clamping currentPage
  useEffect(() => {
    const totalPages = getTotalPages();
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage > totalPages && totalPages === 0) {
      setCurrentPage(1);
    }
  }, [filteredRecords, activeTab]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchGroupInsuranceRecords(),
        fetchClerks(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching group insurance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupInsuranceRecords = async () => {
    try {
      const { data, error } = await ermsClient
        .from('group_insurance')
        .select(`
          id,
          emp_id,
          employee_name,
          retirement_date,
          assigned_clerk,
          department,
          age,
          year_1990,
          year_2003,
          year_2010,
          year_2020,
          overall_comments,
          last_updated,
          created_at,
          updated_at,
          year_1990_comment,
          year_2003_comment,
          year_2010_comment,
          year_2020_comment,
          year_1990_date,
          year_2003_date,
          year_2010_date,
          year_2020_date
        `)
        .order('employee_name');
      
      if (error) throw error;
      
      setGroupInsuranceRecords(data || []);
    } catch (error) {
      console.error('Error fetching group insurance records:', error);
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
      const uniqueDepartments = [...new Set(groupInsuranceRecords.map(record => record.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterRecords = () => {
    let filtered = groupInsuranceRecords;

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

  const getProgressStatus = (record: GroupInsuranceRecord) => {
    const progressFields = [
      record.year_1990,
      record.year_2003,
      record.year_2010,
      record.year_2020
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

  const getTabFilteredRecords = () => {
    if (activeTab === 'completed') {
      return filteredRecords.filter(record => getProgressStatus(record) === 'completed');
    } else if (activeTab === 'pending') {
      return filteredRecords.filter(record => getProgressStatus(record) === 'pending');
    } else if (activeTab === 'inProgress') {
      return filteredRecords.filter(record => getProgressStatus(record) === 'processing');
    }
    return filteredRecords;
  };

  const getPaginatedRecords = () => {
    const tabRecords = getTabFilteredRecords();
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return tabRecords.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const tabRecords = getTabFilteredRecords();
    return Math.ceil(tabRecords.length / recordsPerPage);
  };

  const handleEditRecord = (record: GroupInsuranceRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    setIsLoading(true);
    try {
      const newStatus = getProgressStatus(editingRecord);
      
      const { error } = await ermsClient
        .from('group_insurance')
        .update({
          year_1990: editingRecord.year_1990,
          year_2003: editingRecord.year_2003,
          year_2010: editingRecord.year_2010,
          year_2020: editingRecord.year_2020,
          overall_comments: editingRecord.overall_comments,
          year_1990_comment: editingRecord.year_1990_comment,
          year_2003_comment: editingRecord.year_2003_comment,
          year_2010_comment: editingRecord.year_2010_comment,
          year_2020_comment: editingRecord.year_2020_comment,
          year_1990_date: editingRecord.year_1990_date,
          year_2003_date: editingRecord.year_2003_date,
          year_2010_date: editingRecord.year_2010_date,
          year_2020_date: editingRecord.year_2020_date,
          last_updated: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) throw error;
      
      await fetchGroupInsuranceRecords();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
      alert(t('common.error') + ': ' + (error as Error).message);
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

  // Helper for pagination buttons
  const renderPageButtons = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => {
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
      });
    }

    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    const buttons = [];

    // First page
    buttons.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`px-3 py-1 text-sm border rounded-md ${
          currentPage === 1
            ? 'bg-blue-500 text-white border-blue-500'
            : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        1
      </button>
    );

    // Ellipsis if needed
    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis1" className="px-3 py-1 text-sm text-gray-500">...</span>
      );
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 text-sm border rounded-md ${
            currentPage === i
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Ellipsis if needed
    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis2" className="px-3 py-1 text-sm text-gray-500">...</span>
      );
    }

    // Last page
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-3 py-1 text-sm border rounded-md ${
            currentPage === totalPages
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

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
            <div className="text-sm text-gray-600">{t('retirementTracker.completed')}</
