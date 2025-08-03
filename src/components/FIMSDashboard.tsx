import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Camera,
  MapPin,
  Plus,
  FileText,
  BarChart3,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  ArrowLeft,
  Navigation,
  Upload,
  Save,
  Send,
  X,
  Star,
  Target,
  TrendingUp,
  ArrowRight
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
  location_accuracy: number | null;
  address: string | null;
  planned_date: string | null;
  inspection_date: string | null;
  status: string;
  form_data: any;
  is_compliant: boolean | null;
  requires_revisit: boolean;
  created_at: string;
  category?: {
    name: string;
    name_marathi: string;
    form_type: string;
  };
  inspector?: {
    name: string;
    role_name: string;
  };
}

interface Category {
  id: string;
  name: string;
  name_marathi: string;
  description: string;
  form_type: string;
  is_active: boolean;
}

export const FIMSDashboard: React.FC<FIMSDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userRole, userProfile } = usePermissions(user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'new' | 'analytics'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState<Category | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [anganwadiFormData, setAnganwadiFormData] = useState({
    anganwadi_name: '',
    anganwadi_number: '',
    supervisor_name: '',
    helper_name: '',
    village_name: '',
    building_condition: '',
    room_availability: false,
    toilet_facility: false,
    drinking_water: false,
    electricity: false,
    kitchen_garden: false,
    weighing_machine: false,
    height_measuring_scale: false,
    first_aid_kit: false,
    teaching_materials: false,
    toys_available: false,
    attendance_register: false,
    growth_chart_updated: false,
    vaccination_records: false,
    nutrition_records: false,
    total_registered_children: 0,
    children_present_today: 0,
    children_0_3_years: 0,
    children_3_6_years: 0,
    hot_meal_served: false,
    meal_quality: '',
    take_home_ration: false,
    health_checkup_conducted: false,
    immunization_updated: false,
    vitamin_a_given: false,
    iron_tablets_given: false,
    general_observations: '',
    recommendations: '',
    action_required: ''
  });

  // New inspection form state
  const [newInspection, setNewInspection] = useState({
    category_id: '',
    location_name: '',
    address: '',
    planned_date: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location_accuracy: null as number | null
  });

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      // First, fetch inspections with category data
      let inspectionsQuery = supabase
        .from('fims_inspections')
        .select(`
          *,
          category:fims_categories(name, name_marathi, form_type)
        `)
        .order('created_at', { ascending: false });

      // Filter by user role
      if (userRole === 'clerk' || userRole === 'officer') {
        inspectionsQuery = inspectionsQuery.eq('inspector_id', user.id);
      }

      const { data: inspectionsData, error: inspectionsError } = await inspectionsQuery;
      
      if (inspectionsError) throw inspectionsError;

      // Get unique inspector IDs
      const inspectorIds = [...new Set(inspectionsData?.map(i => i.inspector_id).filter(Boolean))];
      
      // Fetch inspector information separately
      const { data: inspectorsData, error: inspectorsError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          name,
          roles(name)
        `)
        .in('user_id', inspectorIds);
      
      if (inspectorsError) throw inspectorsError;

      // Create a map of inspector data for quick lookup
      const inspectorMap = new Map();
      inspectorsData?.forEach(inspector => {
        inspectorMap.set(inspector.user_id, {
          name: inspector.name,
          role_name: inspector.roles?.name || 'Unknown'
        });
      });
      
      // Merge inspector data with inspections
      const transformedData = inspectionsData?.map(inspection => ({
        ...inspection,
        inspector: inspectorMap.get(inspection.inspector_id) || null
      })) || [];
      
      setInspections(transformedData);
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        setNewInspection(prev => ({
          ...prev,
          latitude,
          longitude,
          location_accuracy: accuracy ? Math.min(accuracy, 999.99) : null
        }));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get current location. Please enable location services.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const generateInspectionNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FIMS-${year}${month}${day}-${random}`;
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategoryForForm(category);
    setCurrentStep(1);
    setNewInspection(prev => ({
      ...prev,
      category_id: category.id
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateInspectionWithForm = async () => {
    if (!newInspection.category_id || !newInspection.location_name) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const inspectionData = {
        ...newInspection,
        inspection_number: generateInspectionNumber(),
        inspector_id: user.id,
        assigned_by: user.id,
        status: 'planned',
        inspection_date: new Date().toISOString()
      };

      const { data: inspectionResult, error: inspectionError } = await supabase
        .from('fims_inspections')
        .insert([inspectionData])
        .select()
        .single();

      if (inspectionError) throw inspectionError;

      // If it's an anganwadi inspection, save the form data
      if (selectedCategoryForForm?.form_type === 'anganwadi') {
        const { error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .insert([{
            inspection_id: inspectionResult.id,
            ...anganwadiFormData
          }]);

        if (formError) throw formError;
      }
      
      await fetchInspections();
      
      // Reset form
      setSelectedCategoryForForm(null);
      setCurrentStep(1);
      setNewInspection({
        category_id: '',
        location_name: '',
        address: '',
        planned_date: '',
        latitude: null,
        longitude: null,
        location_accuracy: null
      });
      setAnganwadiFormData({
        anganwadi_name: '',
        anganwadi_number: '',
        supervisor_name: '',
        helper_name: '',
        village_name: '',
        building_condition: '',
        room_availability: false,
        toilet_facility: false,
        drinking_water: false,
        electricity: false,
        kitchen_garden: false,
        weighing_machine: false,
        height_measuring_scale: false,
        first_aid_kit: false,
        teaching_materials: false,
        toys_available: false,
        attendance_register: false,
        growth_chart_updated: false,
        vaccination_records: false,
        nutrition_records: false,
        total_registered_children: 0,
        children_present_today: 0,
        children_0_3_years: 0,
        children_3_6_years: 0,
        hot_meal_served: false,
        meal_quality: '',
        take_home_ration: false,
        health_checkup_conducted: false,
        immunization_updated: false,
        vitamin_a_given: false,
        iron_tablets_given: false,
        general_observations: '',
        recommendations: '',
        action_required: ''
      });
      setCurrentLocation(null);
      setActiveTab('inspections');
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Error creating inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInspection = async () => {
    if (!newInspection.category_id || !newInspection.location_name) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const inspectionData = {
        ...newInspection,
        inspection_number: generateInspectionNumber(),
        inspector_id: user.id,
        assigned_by: user.id,
        status: 'planned'
      };

      const { error } = await supabase
        .from('fims_inspections')
        .insert([inspectionData]);

      if (error) throw error;
      
      await fetchInspections();
      setNewInspection({
        category_id: '',
        location_name: '',
        address: '',
        planned_date: '',
        latitude: null,
        longitude: null,
        location_accuracy: null
      });
      setCurrentLocation(null);
      setActiveTab('inspections');
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Error creating inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInspection = (inspection: Inspection) => {
    // TODO: Implement view functionality
    alert(`View inspection: ${inspection.inspection_number}`);
  };

  const handleEditInspection = (inspection: Inspection) => {
    // TODO: Implement edit functionality
    alert(`Edit inspection: ${inspection.inspection_number}`);
  };

  const handlePhotoInspection = (inspection: Inspection) => {
    // TODO: Implement photo functionality
    alert(`Photo management for inspection: ${inspection.inspection_number}`);
  };

  const getStatusCounts = () => {
    const total = inspections.length;
    const planned = inspections.filter(i => i.status === 'planned').length;
    const inProgress = inspections.filter(i => i.status === 'in_progress').length;
    const draft = inspections.filter(i => i.status === 'draft').length;
    const submitted = inspections.filter(i => i.status === 'submitted').length;
    const completed = inspections.filter(i => i.status === 'approved').length;
    const pending = planned + inProgress + draft;

    return { total, planned, inProgress, draft, submitted, completed, pending };
  };

  const getFilteredInspections = () => {
    return inspections.filter(inspection => {
      const matchesSearch = searchTerm === '' || 
        inspection.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || inspection.category_id === selectedCategory;
      const matchesStatus = statusFilter === '' || inspection.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const statusCounts = getStatusCounts();
  const filteredInspections = getFilteredInspections();

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">कुल तपासणी / Total Inspections</p>
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
              <p className="text-sm text-gray-600 mb-1">प्रलंबित / Pending</p>
              <p className="text-3xl font-bold text-orange-600">{statusCounts.pending}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">पूर्ण / Completed</p>
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
              <p className="text-sm text-gray-600 mb-1">यशाचा दर / Success Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {statusCounts.total > 0 ? Math.round((statusCounts.completed / statusCounts.total) * 100) : 0}%
              </p>
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
          <h3 className="text-lg font-semibold text-gray-900">अलीकडील तपासणी / Recent Inspections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">तपासणी क्रमांक</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">स्थान</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">श्रेणी</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">तपासणीकर्ता</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">स्थिती</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">तारीख</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">क्रिया</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInspections.slice(0, 5).map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inspection.inspection_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.location_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.category?.name_marathi || inspection.category?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{inspection.inspector?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{inspection.inspector?.role_name || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewInspection(inspection)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditInspection(inspection)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handlePhotoInspection(inspection)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="तपासणी शोधा / Search inspections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">सर्व श्रेणी / All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name_marathi}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">सर्व स्थिती / All Status</option>
            <option value="planned">नियोजित / Planned</option>
            <option value="in_progress">प्रगतीत / In Progress</option>
            <option value="draft">मसुदा / Draft</option>
            <option value="submitted">सबमिट केले / Submitted</option>
            <option value="approved">मंजूर / Approved</option>
          </select>
        </div>
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">तपासणी यादी / Inspections List</h3>
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchData}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">रिफ्रेश / Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                <Download className="h-4 w-4" />
                <span className="text-sm">निर्यात / Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">तपासणी क्रमांक</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">स्थान</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">श्रेणी</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">तपासणीकर्ता</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">स्थिती</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">तारीख</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">स्थान अचूकता</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">क्रिया</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    कोणतीही तपासणी सापडली नाही / No inspections found
                  </td>
                </tr>
              ) : (
                filteredInspections.map((inspection) => (
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
                      {inspection.category?.name_marathi || inspection.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{inspection.inspector?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{inspection.inspector?.role_name || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                        inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        inspection.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                        inspection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
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
                          onClick={() => handleViewInspection(inspection)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditInspection(inspection)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handlePhotoInspection(inspection)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNewInspection = () => (
    <div className="space-y-6">
      {!selectedCategoryForForm ? (
        // Category Selection Grid
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">तपासणी श्रेणी निवडा / Select Inspection Category</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg transition-colors duration-200">
                    {category.form_type === 'anganwadi' ? (
                      <Users className="h-6 w-6 text-purple-600" />
                    ) : (
                      <FileText className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{category.name_marathi}</h4>
                    <p className="text-sm text-gray-600">{category.name}</p>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.form_type === 'anganwadi' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {category.form_type === 'anganwadi' ? 'अंगणवाडी तपासणी' : 'दस्तऐवज तपासणी'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Step-by-Step Form
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Progress Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedCategoryForForm(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCategoryForForm.name_marathi}</h3>
                  <p className="text-sm text-gray-500">{selectedCategoryForForm.name}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                पायरी {currentStep} / 3
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className="ml-2 text-sm">
                    {step === 1 && 'मूलभूत माहिती'}
                    {step === 2 && 'स्थान माहिती'}
                    {step === 3 && 'तपासणी फॉर्म'}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 ml-4 ${
                      step < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 mb-4">मूलभूत माहिती / Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    स्थानाचे नाव / Location Name *
                  </label>
                  <input
                    type="text"
                    value={newInspection.location_name}
                    onChange={(e) => setNewInspection({ ...newInspection, location_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="स्थानाचे नाव टाका / Enter location name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    पत्ता / Address
                  </label>
                  <textarea
                    value={newInspection.address}
                    onChange={(e) => setNewInspection({ ...newInspection, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="संपूर्ण पत्ता टाका / Enter full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    तपासणी तारीख / Inspection Date
                  </label>
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">आजची तारीख आपोआप निवडली आहे / Today's date is automatically selected</p>
                </div>
              </div>
            )}

            {/* Step 2: Location Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 mb-4">स्थान माहिती / Location Information</h4>
                
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    तपासणीसाठी अचूक स्थान मिळवा / Get accurate location for inspection
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    <span>सध्याचे स्थान मिळवा / Get Current Location</span>
                  </button>
                </div>

                {currentLocation ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-800 mb-3">
                      <MapPin className="h-5 w-5" />
                      <span className="font-medium">स्थान यशस्वीरित्या मिळाले / Location Successfully Captured</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                      <div>
                        <span className="font-medium">अक्षांश / Latitude:</span>
                        <br />
                        {currentLocation.lat.toFixed(6)}
                      </div>
                      <div>
                        <span className="font-medium">रेखांश / Longitude:</span>
                        <br />
                        {currentLocation.lng.toFixed(6)}
                      </div>
                      <div>
                        <span className="font-medium">अचूकता / Accuracy:</span>
                        <br />
                        {Math.round(currentLocation.accuracy)}m
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">स्थान आवश्यक आहे / Location Required</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-2">
                      कृपया तपासणी सुरू करण्यापूर्वी आपले स्थान मिळवा / Please capture your location before starting the inspection
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Inspection Form */}
            {currentStep === 3 && selectedCategoryForForm?.form_type === 'anganwadi' && (
              <div className="space-y-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">अंगणवाडी तपासणी फॉर्म / Anganwadi Inspection Form</h4>
                
                {/* Basic Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">मूलभूत तपशील / Basic Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        अंगणवाडीचे नाव / Anganwadi Name
                      </label>
                      <input
                        type="text"
                        value={anganwadiFormData.anganwadi_name}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, anganwadi_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="अंगणवाडीचे नाव टाका"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        अंगणवाडी क्रमांक / Anganwadi Number
                      </label>
                      <input
                        type="text"
                        value={anganwadiFormData.anganwadi_number}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, anganwadi_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="अंगणवाडी क्रमांक टाका"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        पर्यवेक्षकाचे नाव / Supervisor Name
                      </label>
                      <input
                        type="text"
                        value={anganwadiFormData.supervisor_name}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, supervisor_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="पर्यवेक्षकाचे नाव टाका"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        सहाय्यकाचे नाव / Helper Name
                      </label>
                      <input
                        type="text"
                        value={anganwadiFormData.helper_name}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, helper_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="सहाय्यकाचे नाव टाका"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        गावाचे नाव / Village Name
                      </label>
                      <input
                        type="text"
                        value={anganwadiFormData.village_name}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, village_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="गावाचे नाव टाका"
                      />
                    </div>
                  </div>
                </div>

                {/* Infrastructure */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">पायाभूत सुविधा / Infrastructure</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        इमारतीची स्थिती / Building Condition
                      </label>
                      <select
                        value={anganwadiFormData.building_condition}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, building_condition: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">निवडा / Select</option>
                        <option value="excellent">उत्कृष्ट / Excellent</option>
                        <option value="good">चांगली / Good</option>
                        <option value="average">सरासरी / Average</option>
                        <option value="poor">खराब / Poor</option>
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { key: 'room_availability', label: 'खोली उपलब्धता / Room Availability' },
                        { key: 'toilet_facility', label: 'शौचालय सुविधा / Toilet Facility' },
                        { key: 'drinking_water', label: 'पिण्याचे पाणी / Drinking Water' },
                        { key: 'electricity', label: 'वीज / Electricity' },
                        { key: 'kitchen_garden', label: 'स्वयंपाकघर बाग / Kitchen Garden' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={anganwadiFormData[item.key as keyof typeof anganwadiFormData] as boolean}
                            onChange={(e) => setAnganwadiFormData({ 
                              ...anganwadiFormData, 
                              [item.key]: e.target.checked 
                            })}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">उपकरणे / Equipment</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'weighing_machine', label: 'वजन मशीन / Weighing Machine' },
                      { key: 'height_measuring_scale', label: 'उंची मापण्याचे साधन / Height Measuring Scale' },
                      { key: 'first_aid_kit', label: 'प्राथमिक उपचार पेटी / First Aid Kit' },
                      { key: 'teaching_materials', label: 'शिकवण्याचे साहित्य / Teaching Materials' },
                      { key: 'toys_available', label: 'खेळणी उपलब्ध / Toys Available' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={anganwadiFormData[item.key as keyof typeof anganwadiFormData] as boolean}
                          onChange={(e) => setAnganwadiFormData({ 
                            ...anganwadiFormData, 
                            [item.key]: e.target.checked 
                          })}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Records */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">नोंदी / Records</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'attendance_register', label: 'उपस्थिती नोंदवही / Attendance Register' },
                      { key: 'growth_chart_updated', label: 'वाढ तक्ता अपडेट / Growth Chart Updated' },
                      { key: 'vaccination_records', label: 'लसीकरण नोंदी / Vaccination Records' },
                      { key: 'nutrition_records', label: 'पोषण नोंदी / Nutrition Records' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={anganwadiFormData[item.key as keyof typeof anganwadiFormData] as boolean}
                          onChange={(e) => setAnganwadiFormData({ 
                            ...anganwadiFormData, 
                            [item.key]: e.target.checked 
                          })}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Children Count */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">मुलांची संख्या / Children Count</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        एकूण नोंदणीकृत मुले / Total Registered
                      </label>
                      <input
                        type="number"
                        value={anganwadiFormData.total_registered_children}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, total_registered_children: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        आज उपस्थित / Present Today
                      </label>
                      <input
                        type="number"
                        value={anganwadiFormData.children_present_today}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, children_present_today: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        0-3 वर्षे / 0-3 Years
                      </label>
                      <input
                        type="number"
                        value={anganwadiFormData.children_0_3_years}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, children_0_3_years: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        3-6 वर्षे / 3-6 Years
                      </label>
                      <input
                        type="number"
                        value={anganwadiFormData.children_3_6_years}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, children_3_6_years: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Nutrition */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">पोषण / Nutrition</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {[
                        { key: 'hot_meal_served', label: 'गरम जेवण दिले / Hot Meal Served' },
                        { key: 'take_home_ration', label: 'घरी नेण्याचे धान्य / Take Home Ration' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={anganwadiFormData[item.key as keyof typeof anganwadiFormData] as boolean}
                            onChange={(e) => setAnganwadiFormData({ 
                              ...anganwadiFormData, 
                              [item.key]: e.target.checked 
                            })}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        जेवणाची गुणवत्ता / Meal Quality
                      </label>
                      <select
                        value={anganwadiFormData.meal_quality}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, meal_quality: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">निवडा / Select</option>
                        <option value="excellent">उत्कृष्ट / Excellent</option>
                        <option value="good">चांगली / Good</option>
                        <option value="average">सरासरी / Average</option>
                        <option value="poor">खराब / Poor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Health */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">आरोग्य / Health</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'health_checkup_conducted', label: 'आरोग्य तपासणी केली / Health Checkup Conducted' },
                      { key: 'immunization_updated', label: 'लसीकरण अपडेट / Immunization Updated' },
                      { key: 'vitamin_a_given', label: 'व्हिटामिन ए दिले / Vitamin A Given' },
                      { key: 'iron_tablets_given', label: 'लोह गोळ्या दिल्या / Iron Tablets Given' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={anganwadiFormData[item.key as keyof typeof anganwadiFormData] as boolean}
                          onChange={(e) => setAnganwadiFormData({ 
                            ...anganwadiFormData, 
                            [item.key]: e.target.checked 
                          })}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Observations */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">निरीक्षणे आणि शिफारसी / Observations & Recommendations</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        सामान्य निरीक्षणे / General Observations
                      </label>
                      <textarea
                        value={anganwadiFormData.general_observations}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, general_observations: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="सामान्य निरीक्षणे टाका..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        शिफारसी / Recommendations
                      </label>
                      <textarea
                        value={anganwadiFormData.recommendations}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, recommendations: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="शिफारसी टाका..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        आवश्यक कृती / Action Required
                      </label>
                      <textarea
                        value={anganwadiFormData.action_required}
                        onChange={(e) => setAnganwadiFormData({ ...anganwadiFormData, action_required: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="आवश्यक कृती टाका..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={currentStep === 1 ? () => setSelectedCategoryForForm(null) : handlePreviousStep}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{currentStep === 1 ? 'मागे / Back' : 'मागील / Previous'}</span>
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={
                    (currentStep === 1 && !newInspection.location_name) ||
                    (currentStep === 2 && !currentLocation)
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <span>पुढे / Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreateInspectionWithForm}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isLoading ? 'जतन करत आहे...' : 'तपासणी जतन करा / Save Inspection'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">विश्लेषण आणि अहवाल / Analytics & Reports</h3>
        <div className="text-center py-8">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">विश्लेषण लवकरच येत आहे</h4>
          <p className="text-gray-500">Analytics and detailed reports coming soon...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
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
              <p className="text-sm text-gray-500">क्षेत्रीय तपासणी व्यवस्थापन</p>
            </div>
          </div>
          {isMobile && (
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">Mobile App</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                activeTab === 'dashboard'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500 hover:bg-purple-600 p-2 rounded-lg transition-colors duration-200">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium transition-colors duration-200 ${
                    activeTab === 'dashboard' ? 'text-purple-900' : 'text-gray-900 group-hover:text-gray-700'
                  }`}>
                    डॅशबोर्ड / Dashboard
                  </h3>
                  <p className={`text-sm mt-1 transition-colors duration-200 ${
                    activeTab === 'dashboard' ? 'text-purple-700' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    मुख्य आकडेवारी आणि विहंगावलोकन
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('inspections')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                activeTab === 'inspections'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg transition-colors duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium transition-colors duration-200 ${
                    activeTab === 'inspections' ? 'text-purple-900' : 'text-gray-900 group-hover:text-gray-700'
                  }`}>
                    तपासणी / Inspections
                  </h3>
                  <p className={`text-sm mt-1 transition-colors duration-200 ${
                    activeTab === 'inspections' ? 'text-purple-700' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    सर्व तपासणी रेकॉर्ड पहा आणि व्यवस्थापित करा
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('new')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                activeTab === 'new'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition-colors duration-200">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium transition-colors duration-200 ${
                    activeTab === 'new' ? 'text-purple-900' : 'text-gray-900 group-hover:text-gray-700'
                  }`}>
                    नवीन तपासणी / New Inspection
                  </h3>
                  <p className={`text-sm mt-1 transition-colors duration-200 ${
                    activeTab === 'new' ? 'text-purple-700' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    नवीन साइट तपासणी नियोजित करा
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                activeTab === 'analytics'
                  ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-orange-500 hover:bg-orange-600 p-2 rounded-lg transition-colors duration-200">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium transition-colors duration-200 ${
                    activeTab === 'analytics' ? 'text-purple-900' : 'text-gray-900 group-hover:text-gray-700'
                  }`}>
                    अहवाल / Analytics
                  </h3>
                  <p className={`text-sm mt-1 transition-colors duration-200 ${
                    activeTab === 'analytics' ? 'text-purple-700' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    विश्लेषण आणि अहवाल पहा
                  </p>
                </div>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-lg border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  FIMS - क्षेत्रीय तपासणी व्यवस्थापन प्रणाली
                </h1>
                <p className="text-xs text-white/80">
                  Field Inspection Management System
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {isMobile && (
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-white" />
                    <span className="text-sm text-white font-medium">Mobile App</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'inspections' && renderInspections()}
          {activeTab === 'new' && renderNewInspection()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};