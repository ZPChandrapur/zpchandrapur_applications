import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Camera,
  MapPin,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  ArrowLeft,
  BarChart3,
  Target,
  UserCheck,
  X,
  Upload,
  Save,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
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
  planned_date: string | null;
  inspection_date: string | null;
  status: 'planned' | 'in_progress' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'reassigned';
  is_compliant: boolean | null;
  created_at: string;
  category?: {
    name: string;
    name_marathi: string;
  };
}

interface Category {
  id: string;
  name: string;
  name_marathi: string;
  form_type: string;
}

export const FIMSDashboard: React.FC<FIMSDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plan' | 'create' | 'drafts' | 'submitted'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  
  // Data states
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  
  // Form states
  const [newInspection, setNewInspection] = useState({
    category_id: '',
    location_name: '',
    planned_date: '',
    address: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterInspections();
  }, [inspections, searchTerm, selectedStatus, activeTab]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchInspections(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching FIMS data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from('fims_inspections')
        .select(`
          *,
          category:fims_categories(name, name_marathi)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInspections(data || []);
    } catch (error) {
      console.error('Error fetching inspections:', error);
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

  const filterInspections = () => {
    let filtered = inspections;

    // Role-based filtering
    if (userRole === 'clerk' || userRole === 'officer') {
      filtered = filtered.filter(inspection => inspection.inspector_id === user.id);
    }

    // Tab-based filtering
    if (activeTab === 'drafts') {
      filtered = filtered.filter(inspection => inspection.status === 'draft');
    } else if (activeTab === 'submitted') {
      filtered = filtered.filter(inspection => ['submitted', 'under_review', 'approved', 'rejected'].includes(inspection.status));
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(inspection => inspection.status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inspection =>
        inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.category?.name_marathi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInspections(filtered);
  };

  const getStatusCounts = () => {
    const total = inspections.length;
    const planned = inspections.filter(i => i.status === 'planned').length;
    const inProgress = inspections.filter(i => i.status === 'in_progress').length;
    const completed = inspections.filter(i => ['submitted', 'approved'].includes(i.status)).length;
    const drafts = inspections.filter(i => i.status === 'draft').length;

    return { total, planned, inProgress, completed, drafts };
  };

  const handleCreateInspection = async () => {
    if (!newInspection.category_id || !newInspection.location_name) {
      alert('कृपया सर्व आवश्यक फील्ड भरा');
      return;
    }

    setIsLoading(true);
    try {
      const inspectionNumber = `FIMS-${Date.now()}`;
      
      const { error } = await supabase
        .from('fims_inspections')
        .insert({
          inspection_number: inspectionNumber,
          category_id: newInspection.category_id,
          inspector_id: user.id,
          location_name: newInspection.location_name,
          planned_date: newInspection.planned_date || null,
          address: newInspection.address,
          status: 'planned'
        });

      if (error) throw error;
      
      await fetchInspections();
      setShowNewInspectionModal(false);
      setNewInspection({
        category_id: '',
        location_name: '',
        planned_date: '',
        address: ''
      });
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('तपासणी तयार करताना त्रुटि आली');
    } finally {
      setIsLoading(false);
    }
  };

  const statusCounts = getStatusCounts();

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">एकूण तपासणी</p>
              <p className="text-3xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">नियोजित</p>
              <p className="text-3xl font-bold text-orange-600">{statusCounts.planned}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">पूर्ण</p>
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
              <p className="text-sm text-gray-600 mb-1">मसुदा</p>
              <p className="text-3xl font-bold text-purple-600">{statusCounts.drafts}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Edit className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">अलीकडील तपासणी</h3>
        </div>
        <div className="p-6">
          {filteredInspections.slice(0, 5).length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">कोणतीही तपासणी सापडली नाही</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInspections.slice(0, 5).map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{inspection.location_name}</h4>
                      <p className="text-sm text-gray-500">{inspection.category?.name_marathi}</p>
                      <p className="text-xs text-gray-400">{inspection.inspection_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      inspection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      inspection.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {inspection.status === 'approved' ? 'मंजूर' :
                       inspection.status === 'submitted' ? 'सबमिट' :
                       inspection.status === 'draft' ? 'मसुदा' :
                       inspection.status === 'planned' ? 'नियोजित' :
                       'प्रलंबित'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {inspection.created_at ? new Date(inspection.created_at).toLocaleDateString('mr-IN') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderInspectionsList = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="तपासणी शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">सर्व स्थिती</option>
            <option value="planned">नियोजित</option>
            <option value="in_progress">सुरू</option>
            <option value="draft">मसुदा</option>
            <option value="submitted">सबमिट</option>
            <option value="approved">मंजूर</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('');
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
            <span>साफ करा</span>
          </button>
        </div>
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'drafts' ? 'मसुदा तपासणी' :
               activeTab === 'submitted' ? 'सबमिट केलेली तपासणी' :
               'सर्व तपासणी'}
            </h3>
            <span className="text-sm text-gray-500">
              {filteredInspections.length} तपासणी
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredInspections.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">कोणतीही तपासणी सापडली नाही</p>
            </div>
          ) : (
            filteredInspections.map((inspection) => (
              <div key={inspection.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Camera className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{inspection.location_name}</h4>
                      <p className="text-sm text-gray-600">{inspection.category?.name_marathi}</p>
                      <p className="text-xs text-gray-500">{inspection.inspection_number}</p>
                      {inspection.planned_date && (
                        <p className="text-xs text-gray-500">
                          नियोजित: {new Date(inspection.planned_date).toLocaleDateString('mr-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                        inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        inspection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        inspection.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inspection.status === 'approved' ? 'मंजूर' :
                         inspection.status === 'submitted' ? 'सबमिट' :
                         inspection.status === 'draft' ? 'मसुदा' :
                         inspection.status === 'planned' ? 'नियोजित' :
                         'प्रलंबित'}
                      </span>
                      {inspection.is_compliant !== null && (
                        <p className={`text-xs mt-1 ${inspection.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                          {inspection.is_compliant ? 'अनुपालन' : 'गैर-अनुपालन'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                      {(inspection.status === 'draft' || inspection.status === 'planned') && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-lg border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="bg-white/20 p-2 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">FIMS</h1>
                <p className="text-xs text-white/80">क्षेत्रीय तपासणी व्यवस्थापन प्रणाली</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchAllData}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">रिफ्रेश</span>
              </button>
              
              {(userRole === 'clerk' || userRole === 'officer' || userRole === 'admin' || userRole === 'super_admin') && (
                <button 
                  onClick={() => setShowNewInspectionModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">नवीन तपासणी</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'डॅशबोर्ड', icon: BarChart3 },
              { id: 'plan', name: 'नियोजित तपासणी', icon: Calendar },
              { id: 'create', name: 'तपासणी अहवाल', icon: FileText },
              { id: 'drafts', name: 'मसुदा', icon: Edit },
              { id: 'submitted', name: 'सबमिट केलेली', icon: CheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {(activeTab === 'plan' || activeTab === 'create' || activeTab === 'drafts' || activeTab === 'submitted') && renderInspectionsList()}
      </div>

      {/* New Inspection Modal */}
      {showNewInspectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">नवीन तपासणी नियोजित करा</h3>
              <button
                onClick={() => setShowNewInspectionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">तपासणी प्रकार</label>
                <select
                  value={newInspection.category_id}
                  onChange={(e) => setNewInspection({ ...newInspection, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">प्रकार निवडा</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name_marathi}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">स्थळाचे नाव</label>
                <input
                  type="text"
                  value={newInspection.location_name}
                  onChange={(e) => setNewInspection({ ...newInspection, location_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="स्थळाचे नाव टाका"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">पत्ता</label>
                <textarea
                  value={newInspection.address}
                  onChange={(e) => setNewInspection({ ...newInspection, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="संपूर्ण पत्ता टाका"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">नियोजित तारीख</label>
                <input
                  type="date"
                  value={newInspection.planned_date}
                  onChange={(e) => setNewInspection({ ...newInspection, planned_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewInspectionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                रद्द करा
              </button>
              <button
                onClick={handleCreateInspection}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? 'तयार करत आहे...' : 'तपासणी तयार करा'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};