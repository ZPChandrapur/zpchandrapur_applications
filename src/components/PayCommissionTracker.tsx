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

interface PayCommissionTrackerProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface PayCommission {
  id: string;
  emp_id: string;
  employee_name: string;
  age: number | null;
  assigned_clerk: string | null;
  department: string | null;
  designation: string | null;
  status: string | null;
  fourth_pay_commission: string | null;
  fourth_pay_commission_date: string | null;
  fourth_pay_commission_comment: string | null;
  fifth_pay_commission: string | null;
  fifth_pay_commission_date: string | null;
  fifth_pay_commission_comment: string | null;
  sixth_pay_commission: string | null;
  sixth_pay_commission_date: string | null;
  sixth_pay_commission_comment: string | null;
  seventh_pay_commission: string | null;
  seventh_pay_commission_date: string | null;
  seventh_pay_commission_comment: string | null;
  overall_comment: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

interface EditingPayCommission extends PayCommission {
  // All fields are already included in PayCommission
}

export const PayCommissionTracker: React.FC<PayCommissionTrackerProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayCommission, setEditingPayCommission] = useState<EditingPayCommission | null>(null);
  const [activeTab, setActiveTab] = useState<'inProgress' | 'pending' | 'completed'>('inProgress');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  
  // Data states
  const [payCommissions, setPayCommissions] = useState<PayCommission[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredPayCommissions, setFilteredPayCommissions] = useState<PayCommission[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterPayCommissions();
  }, [payCommissions, selectedClerk, selectedDepartment, selectedStatus, searchTerm, userRole, userProfile]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when tab changes
  }, [activeTab]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPayCommissions(),
        fetchClerks()
      ]);
    } catch (error) {
      console.error('Error fetching pay commission tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayCommissions = async () => {
    try {
      const { data, error } = await ermsClient
        .from('pay_commission')
        .select(`
          id,
          emp_id,
          employee_name,
          age,
          assigned_clerk,
          department,
          designation,
          status,
          fourth_pay_commission,
          fourth_pay_commission_date,
          fourth_pay_commission_comment,
          fifth_pay_commission,
          fifth_pay_commission_date,
          fifth_pay_commission_comment,
          sixth_pay_commission,
          sixth_pay_commission_date,
          sixth_pay_commission_comment,
          seventh_pay_commission,
          seventh_pay_commission_date,
          seventh_pay_commission_comment,
          overall_comment,
          created_at,
          updated_at
        `)
        .order('age', { ascending: false });
      
      if (error) throw error;
      
      // Update status for each record based on progress and save to database
      const payCommissionsWithUpdatedStatus = await Promise.all((data || []).map(async (payCommission) => {
        const calculatedStatus = getPayCommissionStatus(payCommission);
        
        // Only update if status has changed
        if (payCommission.status !== calculatedStatus) {
          try {
            const { error: updateError } = await ermsClient
              .from('pay_commission')
              .update({ status: calculatedStatus })
              .eq('id', payCommission.id);
            
            if (updateError) {
              console.error('Error updating status for pay commission:', payCommission.emp_id, updateError);
            } else {
              console.log(`Updated status for ${payCommission.emp_id}: ${calculatedStatus}`);
            }
          } catch (updateError) {
            console.error('Error updating pay commission status:', updateError);
          }
        }
        
        return { ...payCommission, status: calculatedStatus };
      }));
      
      setPayCommissions(payCommissionsWithUpdatedStatus);
    } catch (error) {
      console.error('Error fetching pay commissions:', error);
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

  const filterPayCommissions = () => {
    let filtered = payCommissions;

    // Role-based filtering
    if (userRole === 'clerk' && userProfile?.name) {
      // Clerk can only see their assigned records
      filtered = filtered.filter(payCommission => payCommission.assigned_clerk === userProfile.name);
    }

    // Clerk filter (for non-clerk users)
    if (selectedClerk && userRole !== 'clerk') {
      const selectedClerkName = clerks.find(c => c.user_id === selectedClerk)?.name;
      if (selectedClerkName) {
        filtered = filtered.filter(payCommission => payCommission.assigned_clerk === selectedClerkName);
      }
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(payCommission => payCommission.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(payCommission => getPayCommissionStatus(payCommission) === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payCommission => {
        const searchFields = [
          payCommission.emp_id,
          payCommission.employee_name,
          payCommission.department,
          payCommission.designation,
          payCommission.assigned_clerk
        ];
        
        return searchFields.some(field => 
          String(field || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredPayCommissions(filtered);
  };

  const getPayCommissionStatus = (payCommission: PayCommission) => {
    const payCommissionFields = [
      payCommission.fourth_pay_commission,
      payCommission.fifth_pay_commission,
      payCommission.sixth_pay_commission,
      payCommission.seventh_pay_commission
    ];

    const filledFields = payCommissionFields.filter(field => field && field.trim() !== '').length;
    const totalFields = payCommissionFields.length;

    // Check if any field is "नाही (Not Available)" - if so, keep as processing
    const hasNotAvailable = payCommissionFields.some(field => field === 'नाही');
    
    if (filledFields === 0) return 'pending';
    if (filledFields === totalFields && !hasNotAvailable) return 'completed';
    return 'processing';
  };

  const getStatusCounts = () => {
    const total = filteredPayCommissions.length;
    const processing = filteredPayCommissions.filter(payCommission => getPayCommissionStatus(payCommission) === 'processing').length;
    const completed = filteredPayCommissions.filter(payCommission => getPayCommissionStatus(payCommission) === 'completed').length;
    const pending = filteredPayCommissions.filter(payCommission => getPayCommissionStatus(payCommission) === 'pending').length;

    return { total, processing, completed, pending };
  };

  const getTabFilteredPayCommissions = () => {
    if (activeTab === 'completed') {
      return filteredPayCommissions.filter(payCommission => getPayCommissionStatus(payCommission) === 'completed');
    } else if (activeTab === 'pending') {
      return filteredPayCommissions.filter(payCommission => getPayCommissionStatus(payCommission) === 'pending');
    } else if (activeTab === 'inProgress') {
      return filteredPayCommissions.filter(payCommission => {
        const status = getPayCommissionStatus(payCommission);
        return status === 'processing';
      });
    }
    return filteredPayCommissions;
  };

  const handleEditPayCommission = (payCommission: PayCommission) => {
    setEditingPayCommission(payCommission);
    setShowEditModal(true);
  };

  const handleUpdatePayCommission = async () => {
    if (!editingPayCommission) return;

    setIsLoading(true);
    try {
      // Calculate the new status based on the updated data
      const newStatus = getPayCommissionStatus(editingPayCommission);
      
      const { error } = await ermsClient
        .from('pay_commission')
        .update({
          fourth_pay_commission: editingPayCommission.fourth_pay_commission,
          fourth_pay_commission_date: editingPayCommission.fourth_pay_commission_date,
          fourth_pay_commission_comment: editingPayCommission.fourth_pay_commission_comment,
          fifth_pay_commission: editingPayCommission.fifth_pay_commission,
          fifth_pay_commission_date: editingPayCommission.fifth_pay_commission_date,
          fifth_pay_commission_comment: editingPayCommission.fifth_pay_commission_comment,
          sixth_pay_commission: editingPayCommission.sixth_pay_commission,
          sixth_pay_commission_date: editingPayCommission.sixth_pay_commission_date,
          sixth_pay_commission_comment: editingPayCommission.sixth_pay_commission_comment,
          seventh_pay_commission: editingPayCommission.seventh_pay_commission,
          seventh_pay_commission_date: editingPayCommission.seventh_pay_commission_date,
          seventh_pay_commission_comment: editingPayCommission.seventh_pay_commission_comment,
          overall_comment: editingPayCommission.overall_comment,
          status: newStatus
        })
        .eq('id', editingPayCommission.id);

      if (error) throw error;
      
      await fetchPayCommissions();
      setShowEditModal(false);
      setEditingPayCommission(null);
    } catch (error) {
      console.error('Error updating pay commission:', error);
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
      case 'उपलब्ध':
        return <span className="text-green-600 font-bold">✓</span>;
      case 'नाही':
        return <span className="text-red-600 font-bold">✗</span>;
      case 'लागू नाही':
        return <span className="text-blue-600 font-bold">△</span>;
      default:
        return <span className="text-orange-500 font-bold">◐</span>;
    }
  };

  const statusCounts = getStatusCounts();
  const tabFilteredPayCommissions = getTabFilteredPayCommissions();
  
  // Pagination logic
  const totalPages = Math.ceil(tabFilteredPayCommissions.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = tabFilteredPayCommissions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getDepartments = () => {
    const departments = [...new Set(payCommissions.map(p => p.department).filter(Boolean))];
    return departments.sort();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('retirementTracker.payCommission')}</h1>
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

        {/* Pay Commission Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.payCommission')} Records</h3>
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
                {t('retirementTracker.showingRecords', { filtered: tabFilteredPayCommissions.length, total: filteredPayCommissions.length })}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.fourthPayCommission')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.fifthPayCommission')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.sixthPayCommission')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.seventhPayCommission')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('retirementTracker.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      {isLoading ? t('retirementTracker.loadingData') : t('retirementTracker.noRecordsFound')}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((payCommission) => {
                    const status = getPayCommissionStatus(payCommission);
                    const payCommissionFields = [
                      payCommission.fourth_pay_commission,
                      payCommission.fifth_pay_commission,
                      payCommission.sixth_pay_commission,
                      payCommission.seventh_pay_commission
                    ];
                    const filledFields = payCommissionFields.filter(field => field && field.trim() !== '').length;
                    const progressPercentage = Math.round((filledFields / payCommissionFields.length) * 100);

                    return (
                      <tr key={payCommission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payCommission.employee_name}</div>
                            <div className="text-sm text-gray-500">{payCommission.emp_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payCommission.age || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payCommission.assigned_clerk || t('erms.unassigned')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payCommission.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payCommission.designation || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(payCommission.fourth_pay_commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(payCommission.fifth_pay_commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(payCommission.sixth_pay_commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusSymbol(payCommission.seventh_pay_commission)}
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
                              onClick={() => handleEditPayCommission(payCommission)}
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
                    end: Math.min(endIndex, tabFilteredPayCommissions.length), 
                    total: tabFilteredPayCommissions.length 
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

      {/* Edit Pay Commission Modal */}
      {showEditModal && editingPayCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('retirementTracker.editPayCommissionDetails')}</h3>
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
                      value={editingPayCommission.emp_id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.employeeName')}</label>
                    <input
                      type="text"
                      value={editingPayCommission.employee_name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.assignedClerk')}</label>
                    <input
                      type="text"
                      value={editingPayCommission.assigned_clerk || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('retirementTracker.department')}</label>
                    <input
                      type="text"
                      value={editingPayCommission.department || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pay Commission Fields */}
              <div className="space-y-6">
                {/* Fourth Pay Commission */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.fourthPayCommission')}</label>
                    <select
                      value={editingPayCommission.fourth_pay_commission || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, fourth_pay_commission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="उपलब्ध">उपलब्ध</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingPayCommission.fourth_pay_commission_date || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, fourth_pay_commission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingPayCommission.fourth_pay_commission_comment || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, fourth_pay_commission_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Fifth Pay Commission */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.fifthPayCommission')}</label>
                    <select
                      value={editingPayCommission.fifth_pay_commission || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, fifth_pay_commission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="उपलब्ध">उपलब्ध</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingPayCommission.fifth_pay_commission_date || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, fifth_pay_commission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingPayCommission.fifth_pay_commission_comment || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, fifth_pay_commission_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sixth Pay Commission */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.sixthPayCommission')}</label>
                    <select
                      value={editingPayCommission.sixth_pay_commission || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, sixth_pay_commission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="उपलब्ध">उपलब्ध</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingPayCommission.sixth_pay_commission_date || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, sixth_pay_commission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingPayCommission.sixth_pay_commission_comment || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, sixth_pay_commission_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Seventh Pay Commission */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.seventhPayCommission')}</label>
                    <select
                      value={editingPayCommission.seventh_pay_commission || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, seventh_pay_commission: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('retirementTracker.selectStatus')}</option>
                      <option value="उपलब्ध">उपलब्ध</option>
                      <option value="नाही">नाही</option>
                      <option value="लागू नाही">लागू नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={editingPayCommission.seventh_pay_commission_date || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, seventh_pay_commission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <input
                      type="text"
                      value={editingPayCommission.seventh_pay_commission_comment || ''}
                      onChange={(e) => setEditingPayCommission({ ...editingPayCommission, seventh_pay_commission_comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Overall Comment */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('retirementTracker.overallComment')}</label>
                  <textarea
                    value={editingPayCommission.overall_comment || ''}
                    onChange={(e) => setEditingPayCommission({ ...editingPayCommission, overall_comment: e.target.value })}
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
                onClick={handleUpdatePayCommission}
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