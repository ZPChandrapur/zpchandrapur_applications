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
import { PayCommission } from './PayCommission';
import { GroupInsurance } from './GroupInsurance';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

export const RetirementDashboard: React.FC<RetirementDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [activeTab, setActiveTab] = useState<'overview' | 'payCommission' | 'groupInsurance'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states for overview
  const [retirementStats, setRetirementStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    pending: 0
  });

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchRetirementStats();
    }
  }, [activeTab]);

  const fetchRetirementStats = async () => {
    setIsLoading(true);
    try {
      // Fetch retirement statistics from the database
      const { data, error } = await ermsClient
        .from('employee_retirement')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        processing: data?.filter(item => item.status === 'processing').length || 0,
        completed: data?.filter(item => item.status === 'completed').length || 0,
        pending: data?.filter(item => item.status === 'pending').length || 0
      };
      
      setRetirementStats(stats);
    } catch (error) {
      console.error('Error fetching retirement stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('erms.totalRetirements')}</p>
              <p className="text-3xl font-bold text-gray-900">{retirementStats.total}</p>
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
              <p className="text-3xl font-bold text-orange-600">{retirementStats.processing}</p>
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
              <p className="text-3xl font-bold text-green-600">{retirementStats.completed}</p>
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
              <p className="text-3xl font-bold text-purple-600">{retirementStats.pending}</p>
              <p className="text-xs text-gray-500">{t('erms.awaitingApproval')}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.monthWiseRetirementCount')}</h3>
          <div className="text-center py-8 text-gray-500">
            {t('erms.showing6MonthsCentered', { month: t('erms.january'), year: '2024' })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('erms.departmentWiseRetirementCount')}</h3>
          <div className="text-center py-8 text-gray-500">
            विभागनिहाय सेवानिवृत्ती आकडेवारी येथे दिसेल
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('erms.retirementDashboard')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {t('erms.retirementDashboardDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchRetirementStats}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
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
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>विहंगावलोकन</span>
              </button>
              <button
                onClick={() => setActiveTab('payCommission')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'payCommission'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>वेतन आयोग</span>
              </button>
              <button
                onClick={() => setActiveTab('groupInsurance')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'groupInsurance'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>गट विमा</span>
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'payCommission' && <PayCommission user={user} />}
            {activeTab === 'groupInsurance' && <GroupInsurance user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};