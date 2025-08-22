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
  Search
} from 'lucide-react';
import { RetirementTracker } from './RetirementTracker';
import { PayCommission } from './PayCommission';
import { GroupInsurance } from './GroupInsurance';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
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
  date_of_submission: string | null;
  type_of_pension: string | null;
  designation: string | null;
  department_submitted: string | null;
  date_of_pension_case_approval: string | null;
  group_insurance_benefit: string | null;
  gratuity_benefit: string | null;
  leave_encashment_benefit: string | null;
  medical_allowance_benefit: string | null;
  hometown_travel_allowance: string | null;
  pending_travel_allowance: string | null;
  government_decision_march_2023: string | null;
  government_decision_compliance: string | null;
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
  const [activeTab, setActiveTab] = useState<'progress' | 'payCommission' | 'groupInsurance'>('progress');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RetirementRecord | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
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
          date_of_submission,
          type_of_pension,
          designation,
          department_submitted,
          date_of_pension_case_approval,
          group_insurance_benefit,
          gratuity_benefit,
          leave_encashment_benefit,
          medical_allowance_benefit,
          hometown_travel_allowance,
          pending_travel_allowance,
          government_decision_march_2023,
          government_decision_compliance,
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

  const getMonthWiseData = () => {
    const monthData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(selectedYear, selectedMonth - 2 + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const count = retirementRecords.filter(record => {
        if (!record.retirement_date) return false;
        const recordDate = new Date(record.retirement_date);
        const recordKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        return recordKey === monthKey;
      }).length;
      
      return {
        month: date.toLocaleDateString('mr-IN', { month: 'long' }),
        count
      };
    });
    
    return monthData;
  };

  const getDepartmentWiseData = () => {
    const deptCounts = departments.map(dept => ({
      department: dept,
      count: retirementRecords.filter(record => record.department === dept).length
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    
    return deptCounts;
  };

  const getDesignationWiseData = () => {
    const designationCounts = retirementRecords.reduce((acc, record) => {
      const designation = record.designation || 'Unknown';
      acc[designation] = (acc[designation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(designationCounts)
      .map(([designation, count]) => ({ designation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
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
          date_of_submission: editingRecord.date_of_submission,
          type_of_pension: editingRecord.type_of_pension,
          designation: editingRecord.designation,
          department_submitted: editingRecord.department_submitted,
          date_of_pension_case_approval: editingRecord.date_of_pension_case_approval,
          group_insurance_benefit: editingRecord.group_insurance_benefit,
          gratuity_benefit: editingRecord.gratuity_benefit,
          leave_encashment_benefit: editingRecord.leave_encashment_benefit,
          medical_allowance_benefit: editingRecord.medical_allowance_benefit,
          hometown_travel_allowance: editingRecord.hometown_travel_allowance,
          pending_travel_allowance: editingRecord.pending_travel_allowance,
          government_decision_march_2023: editingRecord.government_decision_march_2023,
          government_decision_compliance: editingRecord.government_decision_compliance
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
  const monthWiseData = getMonthWiseData();
  const departmentWiseData = getDepartmentWiseData();
  const designationWiseData = getDesignationWiseData();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return <RetirementTracker user={user} />;
      case 'payCommission':
        return <PayCommission user={user} />;
      case 'groupInsurance':
        return <GroupInsurance user={user} />;
      default:
        return <RetirementTracker user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.totalRetirements')}</p>
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
              <p className="text-sm text-gray-600 mb-1">{t('erms.processing')}</p>
              <p className="text-3xl font-bold text-orange-600">{statusCounts.processing}</p>
              <p className="text-xs text-gray-500">{t('erms.withSubmissionData')}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.completed')}</p>
              <p className="text-3xl font-bold text-green-600">{statusCounts.completed}</p>
              <p className="text-xs text-gray-500">{t('erms.pensionApproved')}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.pending')}</p>
              <p className="text-3xl font-bold text-purple-600">{statusCounts.pending}</p>
              <p className="text-xs text-gray-500">{t('erms.awaitingApproval')}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month-wise Retirement Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('erms.monthWiseRetirementCount')}</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2024, i, 1).toLocaleDateString('mr-IN', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {monthWiseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.max((item.count / Math.max(...monthWiseData.map(d => d.count), 1)) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            {t('erms.showing6MonthsCentered', { 
              month: new Date(selectedYear, selectedMonth, 1).toLocaleDateString('mr-IN', { month: 'long' }),
              year: selectedYear
            })}
          </p>
        </div>

        {/* Department-wise Retirement Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseRetirementCount')}</h3>
          <div className="space-y-3">
            {departmentWiseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-3">
                  {t(`erms.departments.${item.department}`, item.department)}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.max((item.count / Math.max(...departmentWiseData.map(d => d.count), 1)) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">{t('erms.showingTopResults', { count: 10 })}</p>
        </div>
      </div>

      {/* Designation vs Employee Count */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.designationVsEmployeeCount')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designationWiseData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-3">
                {item.designation}
              </span>
              <span className="text-sm font-bold text-blue-600">{item.count}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">{t('erms.showingTopResults', { count: 10 })}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
              <TrendingUp className="h-4 w-4" />
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
              <BarChart3 className="h-4 w-4" />
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
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};