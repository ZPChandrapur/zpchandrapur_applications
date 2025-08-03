import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Camera,
  BarChart3,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FIMSNewInspection } from './FIMSNewInspection';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface FIMSDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface Inspection {
  id: string;
  inspection_number: string;
  category_id: string;
  inspector_id: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  address: string | null;
  planned_date: string | null;
  inspection_date: string | null;
  status: string;
  form_data: any;
  is_compliant: boolean | null;
  requires_revisit: boolean;
  created_at: string;
  updated_at: string;
  anganwadi_forms?: any;
  photos?: InspectionPhoto[];
}

interface Category {
  id: string;
  name: string;
  name_marathi: string;
  description: string;
  form_type: string;
  is_active: boolean;
}

interface InspectionPhoto {
  id: string;
  photo_url: string;
  photo_name: string | null;
  description: string | null;
  photo_order: number;
  uploaded_at: string;
}

export const FIMSDashboard: React.FC<FIMSDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [viewingPhotos, setViewingPhotos] = useState<InspectionPhoto[]>([]);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);

  const handleNewInspection = () => {
    setEditingInspection(null);
    setActiveTab('newInspection');
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchInspections(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInspections = async () => {
    try {
      console.log('🔍 Fetching inspections...');
      
      const { data, error } = await supabase
        .from('fims_inspections')
        .select(`
          *,
          fims_categories(name, name_marathi),
          fims_anganwadi_forms(*),
          fims_inspection_photos(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Inspections fetched successfully:', data?.length || 0);
      setInspections(data || []);
    } catch (error) {
      console.error('❌ Error in fetchInspections:', error);
      
      // Provide user-friendly error message
      if (error.message.includes('Failed to fetch')) {
        alert('Network connection error. Please check your internet connection and try again.');
      } else if (error.message.includes('JWT')) {
        alert('Session expired. Please sign in again.');
      } else {
        alert(`Error loading inspections: ${error.message}`);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('fims_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    if (!confirm('Are you sure you want to delete this inspection?')) return;

    try {
      setIsLoading(true);
      
      // First delete related photos from storage
      const { data: photos } = await supabase
        .from('fims_inspection_photos')
        .select('photo_url')
        .eq('inspection_id', inspectionId);

      if (photos && photos.length > 0) {
        const photoUrls = photos.map(p => p.photo_url.split('/').pop()).filter(Boolean);
        if (photoUrls.length > 0) {
          await supabase.storage
            .from('field-visit-images')
            .remove(photoUrls);
        }
      }

      // Delete photos from database
      await supabase
        .from('fims_inspection_photos')
        .delete()
        .eq('inspection_id', inspectionId);

      // Delete anganwadi form if exists
      await supabase
        .from('fims_anganwadi_forms')
        .delete()
        .eq('inspection_id', inspectionId);

      // Delete the inspection
      const { error } = await supabase
        .from('fims_inspections')
        .delete()
        .eq('id', inspectionId);
      
      if (error) throw error;
      
      await fetchInspections();
      alert('Inspection deleted successfully');
      
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert('Error deleting inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInspection = async (inspectionId: string) => {
    try {
      const { error } = await supabase
        .from('fims_inspections')
        .update({ status: 'approved' })
        .eq('id', inspectionId);
      
      if (error) throw error;
      
      await fetchInspections();
      alert('Inspection marked as completed');
    } catch (error) {
      console.error('Error completing inspection:', error);
      alert('Error completing inspection: ' + error.message);
    }
  };

  const handleRevisitInspection = async (inspectionId: string) => {
    try {
      const { error } = await supabase
        .from('fims_inspections')
        .update({ 
          status: 'in_progress',
          requires_revisit: true 
        })
        .eq('id', inspectionId);
      
      if (error) throw error;
      
      await fetchInspections();
      alert('Inspection sent for revisit');
    } catch (error) {
      console.error('Error sending for revisit:', error);
      alert('Error sending for revisit: ' + error.message);
    }
  };

  const handleViewInspectionPhotos = async (inspection: Inspection) => {
    try {
      const { data, error } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspection.id)
        .order('photo_order');

      if (error) throw error;
      
      setViewingPhotos(data || []);
      setSelectedPhotoIndex(0);
      setShowPhotoModal(true);
    } catch (error) {
      console.error('Error loading photos:', error);
      alert('Error loading photos: ' + error.message);
    }
  };

  const getFilteredInspections = () => {
    return inspections.filter(inspection => {
      const matchesSearch = searchTerm === '' || 
        inspection.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || inspection.category_id === selectedCategory;
      const matchesStatus = selectedStatus === '' || inspection.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const getStatusCounts = () => {
    const total = inspections.length;
    const pending = inspections.filter(i => ['planned', 'in_progress', 'draft'].includes(i.status)).length;
    const completed = inspections.filter(i => i.status === 'approved').length;
    const submitted = inspections.filter(i => i.status === 'submitted').length;
    
    return { total, pending, completed, submitted };
  };

  const getCompletionRate = () => {
    const { total, completed } = getStatusCounts();
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('fims.totalInspections')}</p>
              <p className="text-3xl font-bold text-gray-900">{getStatusCounts().total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('fims.pending')}</p>
              <p className="text-3xl font-bold text-orange-600">{getStatusCounts().pending}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('fims.completed')}</p>
              <p className="text-3xl font-bold text-green-600">{getStatusCounts().completed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('fims.successRate')}</p>
              <p className="text-3xl font-bold text-purple-600">{getCompletionRate()}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('fims.recentInspections')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.inspectionNumber')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inspections.slice(0, 5).map((inspection) => {
                const category = categories.find(c => c.id === inspection.category_id);
                return (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inspection.inspection_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.location_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category?.name_marathi || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      inspection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      inspection.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setActiveTab('newInspection');
                        // Pass inspection data to the new inspection component for viewing
                        // This will be handled by the FIMSNewInspection component
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="View Inspection"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInspections = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('fims.inspectionsList')}</h3>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveTab('newInspection')}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>{t('fims.newInspection')}</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('fims.searchInspections')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">{t('fims.allCategories')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name_marathi}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">{t('fims.allStatuses')}</option>
            <option value="planned">{t('fims.planned')}</option>
            <option value="in_progress">{t('fims.inProgress')}</option>
            <option value="draft">{t('fims.draft')}</option>
            <option value="submitted">{t('fims.submitted')}</option>
            <option value="approved">{t('fims.approved')}</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.inspectionNumber')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.locationAccuracy')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fims.actions')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complete/Revisit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredInspections().length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {t('fims.noInspectionsFound')}
                  </td>
                </tr>
              ) : (
                getFilteredInspections().map((inspection) => {
                  const category = categories.find(c => c.id === inspection.category_id);
                  return (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inspection.inspection_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{inspection.location_name}</div>
                          {inspection.address && (
                            <div className="text-xs text-gray-500">{inspection.address}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category?.name_marathi || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                          inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          inspection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          inspection.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inspection.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : 
                         inspection.planned_date ? new Date(inspection.planned_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inspection.location_accuracy ? `${Math.round(inspection.location_accuracy)}m` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setActiveTab('newInspection');
                              // This will be handled by passing the inspection to FIMSNewInspection
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Inspection"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingInspection(inspection);
                              setActiveTab('newInspection');
                            }}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Edit Inspection"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInspection(inspection.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Inspection"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewInspectionPhotos(inspection)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="View Photos"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCompleteInspection(inspection.id)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
                            title="Complete"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleRevisitInspection(inspection.id)}
                            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded"
                            title="Revisit"
                          >
                            Revisit
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
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('fims.analyticsComingSoon')}</h3>
        <p className="text-gray-500">{t('fims.detailedAnalyticsAndReports')}</p>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('fims.reportsComingSoon')}</h3>
        <p className="text-gray-500">{t('fims.generateAndDownloadReports')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">FIMS</h1>
              <p className="text-sm text-gray-500">Field Inspection Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500 hover:bg-purple-600 p-2 rounded-lg transition-colors duration-200">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-medium ${
                    activeTab === 'dashboard' ? 'text-purple-900' : 'text-gray-900'
                  }`}>
                    {t('fims.dashboard')}
                  </h3>
                  <p className={`text-sm ${
                    activeTab === 'dashboard' ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    Overview and Statistics
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('inspections')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                activeTab === 'inspections'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg transition-colors duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-medium ${
                    activeTab === 'inspections' ? 'text-purple-900' : 'text-gray-900'
                  }`}>
                    {t('fims.inspections')}
                  </h3>
                  <p className={`text-sm ${
                    activeTab === 'inspections' ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    View and manage inspections
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('newInspection')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                activeTab === 'newInspection'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition-colors duration-200">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-medium ${
                    activeTab === 'newInspection' ? 'text-purple-900' : 'text-gray-900'
                  }`}>
                    {t('fims.newInspection')}
                  </h3>
                  <p className={`text-sm ${
                    activeTab === 'newInspection' ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    Create new inspection
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500 hover:bg-orange-600 p-2 rounded-lg transition-colors duration-200">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-medium ${
                    activeTab === 'analytics' ? 'text-purple-900' : 'text-gray-900'
                  }`}>
                    {t('fims.analytics')}
                  </h3>
                  <p className={`text-sm ${
                    activeTab === 'analytics' ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    View analytics and reports
                  </p>
                </div>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-w-0">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inspections' && renderInspections()}
        {activeTab === 'newInspection' && (
          <FIMSNewInspection 
            user={user} 
            onBack={() => setActiveTab('dashboard')}
            categories={categories}
            onInspectionCreated={fetchInspections}
          />
        )}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && viewingPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Photo {selectedPhotoIndex + 1} of {viewingPhotos.length}
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <img
                src={viewingPhotos[selectedPhotoIndex]?.photo_url}
                alt={viewingPhotos[selectedPhotoIndex]?.photo_name || 'Inspection photo'}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {viewingPhotos[selectedPhotoIndex]?.description}
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4 mt-4">
                <button
                  onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                  disabled={selectedPhotoIndex === 0}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setSelectedPhotoIndex(Math.min(viewingPhotos.length - 1, selectedPhotoIndex + 1))}
                  disabled={selectedPhotoIndex === viewingPhotos.length - 1}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};