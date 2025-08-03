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
  ArrowRight,
  Trash2
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
    planned_date: new Date().toISOString().split('T')[0],
    latitude: null as number | null,
    longitude: null as number | null,
    location_accuracy: null as number | null
  });

  // Anganwadi form state
  const [anganwadiForm, setAnganwadiForm] = useState({
    // Basic Details
    anganwadi_name: '',
    anganwadi_number: '',
    supervisor_name: userProfile?.name || user.email?.split('@')[0] || '',
    helper_name: '',
    village_name: '',
    // Infrastructure
    building_condition: '',
    room_availability: null as boolean | null,
    toilet_facility: null as boolean | null,
    drinking_water: null as boolean | null,
    electricity: null as boolean | null,
    kitchen_garden: null as boolean | null,
    
    // Equipment
    weighing_machine: null as boolean | null,
    height_measuring_scale: null as boolean | null,
    first_aid_kit: null as boolean | null,
    teaching_materials: null as boolean | null,
    toys_available: null as boolean | null,
    
    // Records
    attendance_register: null as boolean | null,
    growth_chart_updated: null as boolean | null,
    vaccination_records: null as boolean | null,
    nutrition_records: null as boolean | null,
    
    // Children Count
    total_registered_children: 0,
    children_present_today: 0,
    children_0_3_years: 0,
    children_3_6_years: 0,
    
    // Nutrition
    hot_meal_served: null as boolean | null,
    meal_quality: '',
    take_home_ration: null as boolean | null,
    
    // Health
    health_checkup_conducted: null as boolean | null,
    immunization_updated: null as boolean | null,
    vitamin_a_given: null as boolean | null,
    iron_tablets_given: null as boolean | null,
    
    // Observations
    general_observations: '',
    recommendations: '',
    action_required: ''
  });

  // Photo upload state
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([]);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{file: File, description: string}[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedInspectionForCompletion, setSelectedInspectionForCompletion] = useState<any>(null);
  const [completionAction, setCompletionAction] = useState<'complete' | 'revisit'>('complete');
  const [revisitAssignee, setRevisitAssignee] = useState('');
  const [revisitUsers, setRevisitUsers] = useState<any[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedInspectionPhotos, setSelectedInspectionPhotos] = useState<any[]>([]);

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

  useEffect(() => {
    fetchInspections();
    fetchCategories();
    fetchUsers();
  }, []);

  // Update supervisor name when user profile changes
  useEffect(() => {
    if (userProfile?.name || user.email) {
      setAnganwadiForm(prev => ({
        ...prev,
        supervisor_name: userProfile?.name || user.email?.split('@')[0] || ''
      }));
    }
  }, [userProfile, user]);

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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          name,
          roles!inner(name)
        `)
        .in('roles.name', ['inspector', 'officer', 'admin'])
        .not('name', 'is', null);
      
      if (error) throw error;
      setRevisitUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        setNewInspection(prev => ({
          ...prev,
          latitude,
          longitude,
          location_accuracy: accuracy ? Math.min(accuracy, 999.99) : null
        }));
        
        // Get place name using reverse geocoding
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&limit=1`
          );
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const placeName = data.results[0].formatted;
            setNewInspection(prev => ({
              ...prev,
              address: placeName
            }));
          }
        } catch (error) {
          console.log('Could not fetch place name:', error);
        }
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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setNewInspection({
      category_id: '',
      location_name: '',
      address: '',
      planned_date: new Date().toISOString().split('T')[0],
      latitude: null,
      longitude: null,
      location_accuracy: null
    });
    setAnganwadiForm({
      anganwadi_name: '',
      anganwadi_number: '',
      supervisor_name: userProfile?.name || user.email?.split('@')[0] || '',
      helper_name: '',
      village_name: '',
      building_condition: '',
      room_availability: null,
      toilet_facility: null,
      drinking_water: null,
      electricity: null,
      kitchen_garden: null,
      weighing_machine: null,
      height_measuring_scale: null,
      first_aid_kit: null,
      teaching_materials: null,
      toys_available: null,
      attendance_register: null,
      growth_chart_updated: null,
      vaccination_records: null,
      nutrition_records: null,
      total_registered_children: 0,
      children_present_today: 0,
      children_0_3_years: 0,
      children_3_6_years: 0,
      hot_meal_served: null,
      meal_quality: '',
      take_home_ration: null,
      health_checkup_conducted: null,
      immunization_updated: null,
      vitamin_a_given: null,
      iron_tablets_given: null,
      general_observations: '',
      recommendations: '',
      action_required: ''
    });
    setPhotos([]);
    setPhotoDescriptions([]);
    setSelectedPhotos([]);
    setCurrentStep(1);
    setSelectedCategoryForForm(null);
    setCurrentLocation(null);
  };

  const handleEditInspection = async (inspection: any) => {
    try {
      setIsLoading(true);
      console.log('Editing inspection:', inspection.id);
      
      // Fetch the complete inspection data including anganwadi form if it exists
      let anganwadiFormData = null;
      if (inspection.category_id) {
        const { data: formData, error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .select('*')
          .eq('inspection_id', inspection.id)
          .single();
        
        if (!formError && formData) {
          anganwadiFormData = formData;
        } else {
          console.error('Error fetching anganwadi form:', formError);
          // Don't return here, anganwadi form might not exist yet
        }
      }
      
      // Set the form data for editing
      setNewInspection({
        category_id: inspection.category_id || '',
        location_name: inspection.location_name || '',
        address: inspection.address || '',
        planned_date: inspection.planned_date || '',
        latitude: inspection.latitude || null,
        longitude: inspection.longitude || null,
        location_accuracy: inspection.location_accuracy || null
      });
      
      // Set anganwadi form data if exists
      if (anganwadiFormData) {
        setAnganwadiForm({
          anganwadi_name: anganwadiFormData.anganwadi_name || '',
          anganwadi_number: anganwadiFormData.anganwadi_number || '',
          supervisor_name: anganwadiFormData.supervisor_name || userProfile?.name || '',
          helper_name: anganwadiFormData.helper_name || '',
          village_name: anganwadiFormData.village_name || '',
          building_condition: anganwadiFormData.building_condition || '',
          room_availability: anganwadiFormData.room_availability || false,
          toilet_facility: anganwadiFormData.toilet_facility || false,
          drinking_water: anganwadiFormData.drinking_water || false,
          electricity: anganwadiFormData.electricity || false,
          kitchen_garden: anganwadiFormData.kitchen_garden || false,
          weighing_machine: anganwadiFormData.weighing_machine || false,
          height_measuring_scale: anganwadiFormData.height_measuring_scale || false,
          first_aid_kit: anganwadiFormData.first_aid_kit || false,
          teaching_materials: anganwadiFormData.teaching_materials || false,
          toys_available: anganwadiFormData.toys_available || false,
          attendance_register: anganwadiFormData.attendance_register || false,
          growth_chart_updated: anganwadiFormData.growth_chart_updated || false,
          vaccination_records: anganwadiFormData.vaccination_records || false,
          nutrition_records: anganwadiFormData.nutrition_records || false,
          total_registered_children: anganwadiFormData.total_registered_children || 0,
          children_present_today: anganwadiFormData.children_present_today || 0,
          children_0_3_years: anganwadiFormData.children_0_3_years || 0,
          children_3_6_years: anganwadiFormData.children_3_6_years || 0,
          hot_meal_served: anganwadiFormData.hot_meal_served || false,
          meal_quality: anganwadiFormData.meal_quality || '',
          take_home_ration: anganwadiFormData.take_home_ration || false,
          health_checkup_conducted: anganwadiFormData.health_checkup_conducted || false,
          immunization_updated: anganwadiFormData.immunization_updated || false,
          vitamin_a_given: anganwadiFormData.vitamin_a_given || false,
          iron_tablets_given: anganwadiFormData.iron_tablets_given || false,
          general_observations: anganwadiFormData.general_observations || '',
          recommendations: anganwadiFormData.recommendations || '',
          action_required: anganwadiFormData.action_required || ''
        });
      }
      
      // Fetch existing photos
      const { data: photosData, error: photosError } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspection.id)
        .order('photo_order');
      
      if (!photosError && photosData) {
        setSelectedPhotos(photosData.map(photo => ({
          file: null, // We don't have the original file
          preview: photo.photo_url,
          description: photo.description || '',
          name: photo.photo_name || '',
          uploaded: true,
          id: photo.id
        })));
      } else {
        console.error('Error fetching photos:', photosError);
        // Don't return here, photos might not exist yet
      }
      
      setEditingInspection(inspection);
      setIsEditMode(true);
      setCurrentStep(1);
      setActiveTab('new');
      
      console.log('Edit mode set successfully');
    } catch (error) {
      console.error('Error loading inspection for editing:', error);
      alert('Error loading inspection data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInspection = async (inspection: any) => {
    try {
      setIsLoading(true);
      console.log('Viewing inspection:', inspection.id);
      
      // Fetch the complete inspection data including anganwadi form if it exists
      let anganwadiFormData = null;
      if (inspection.category_id) {
        const { data: formData, error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .select('*')
          .eq('inspection_id', inspection.id)
          .single();
        
        if (!formError && formData) {
          anganwadiFormData = formData;
        } else {
          console.error('Error fetching anganwadi form:', formError);
          // Don't return here, anganwadi form might not exist yet
        }
      }
      
      // Set the form data for viewing
      setNewInspection({
        category_id: inspection.category_id || '',
        location_name: inspection.location_name || '',
        address: inspection.address || '',
        planned_date: inspection.planned_date || '',
        latitude: inspection.latitude || null,
        longitude: inspection.longitude || null,
        location_accuracy: inspection.location_accuracy || null
      });
      
      // Set anganwadi form data if exists
      if (anganwadiFormData) {
        setAnganwadiForm({
          anganwadi_name: anganwadiFormData.anganwadi_name || '',
          anganwadi_number: anganwadiFormData.anganwadi_number || '',
          supervisor_name: anganwadiFormData.supervisor_name || userProfile?.name || '',
          helper_name: anganwadiFormData.helper_name || '',
          village_name: anganwadiFormData.village_name || '',
          building_condition: anganwadiFormData.building_condition || '',
          room_availability: anganwadiFormData.room_availability || false,
          toilet_facility: anganwadiFormData.toilet_facility || false,
          drinking_water: anganwadiFormData.drinking_water || false,
          electricity: anganwadiFormData.electricity || false,
          kitchen_garden: anganwadiFormData.kitchen_garden || false,
          weighing_machine: anganwadiFormData.weighing_machine || false,
          height_measuring_scale: anganwadiFormData.height_measuring_scale || false,
          first_aid_kit: anganwadiFormData.first_aid_kit || false,
          teaching_materials: anganwadiFormData.teaching_materials || false,
          toys_available: anganwadiFormData.toys_available || false,
          attendance_register: anganwadiFormData.attendance_register || false,
          growth_chart_updated: anganwadiFormData.growth_chart_updated || false,
          vaccination_records: anganwadiFormData.vaccination_records || false,
          nutrition_records: anganwadiFormData.nutrition_records || false,
          total_registered_children: anganwadiFormData.total_registered_children || 0,
          children_present_today: anganwadiFormData.children_present_today || 0,
          children_0_3_years: anganwadiFormData.children_0_3_years || 0,
          children_3_6_years: anganwadiFormData.children_3_6_years || 0,
          hot_meal_served: anganwadiFormData.hot_meal_served || false,
          meal_quality: anganwadiFormData.meal_quality || '',
          take_home_ration: anganwadiFormData.take_home_ration || false,
          health_checkup_conducted: anganwadiFormData.health_checkup_conducted || false,
          immunization_updated: anganwadiFormData.immunization_updated || false,
          vitamin_a_given: anganwadiFormData.vitamin_a_given || false,
          iron_tablets_given: anganwadiFormData.iron_tablets_given || false,
          general_observations: anganwadiFormData.general_observations || '',
          recommendations: anganwadiFormData.recommendations || '',
          action_required: anganwadiFormData.action_required || ''
        });
      }
      
      // Fetch existing photos
      const { data: photosData, error: photosError } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspection.id)
        .order('photo_order');
      
      if (!photosError && photosData) {
        setSelectedPhotos(photosData.map(photo => ({
          file: null, // We don't have the original file
          preview: photo.photo_url,
          description: photo.description || '',
          name: photo.photo_name || '',
          uploaded: true,
          id: photo.id
        })));
      } else {
        console.error('Error fetching photos:', photosError);
        // Don't return here, photos might not exist yet
      }
      
      setViewingInspection(inspection);
      setIsViewMode(true);
      setCurrentStep(1);
      setActiveTab('new');
      
      console.log('View mode set successfully');
    } catch (error) {
      console.error('Error loading inspection for viewing:', error);
      alert('Error loading inspection data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInspection = async (inspection: any) => {
    if (!confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // First delete related photos from storage and database
      const { data: photos } = await supabase
        .from('fims_inspection_photos')
        .select('photo_url')
        .eq('inspection_id', inspection.id);

      if (photos && photos.length > 0) {
        // Delete photos from storage
        const photoUrls = photos.map(p => p.photo_url.split('/').pop()).filter(Boolean);
        if (photoUrls.length > 0) {
          await supabase.storage
            .from('field-visit-images')
            .remove(photoUrls);
        }

        // Delete photo records
        await supabase
          .from('fims_inspection_photos')
          .delete()
          .eq('inspection_id', inspection.id);
      }

      // Delete anganwadi form if exists
      await supabase
        .from('fims_anganwadi_forms')
        .delete()
        .eq('inspection_id', inspection.id);

      // Delete the inspection
      const { error } = await supabase
        .from('fims_inspections')
        .delete()
        .eq('id', inspection.id);
      
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

  const handleInspectionCompletion = (inspection: any, action: 'complete' | 'revisit') => {
    setSelectedInspectionForCompletion(inspection);
    setCompletionAction(action);
    setRevisitAssignee('');
    setShowCompletionModal(true);
  };

  const handleSubmitCompletion = async () => {
    if (!selectedInspectionForCompletion) return;
    
    if (completionAction === 'revisit' && !revisitAssignee) {
      alert('Please select who should revisit this inspection');
      return;
    }

    try {
      setIsLoading(true);
      
      const updateData: any = {
        status: completionAction === 'complete' ? 'approved' : 'reassigned',
        requires_revisit: completionAction === 'revisit'
      };
      
      if (completionAction === 'revisit') {
        updateData.inspector_id = revisitAssignee;
      }
      
      const { error } = await supabase
        .from('fims_inspections')
        .update(updateData)
        .eq('id', selectedInspectionForCompletion.id);
      
      if (error) throw error;
      
      await fetchInspections();
      setShowCompletionModal(false);
      setSelectedInspectionForCompletion(null);
      
      alert(completionAction === 'complete' 
        ? 'Inspection marked as completed' 
        : 'Inspection sent for revisit'
      );
      
    } catch (error) {
      console.error('Error updating inspection:', error);
      alert('Error updating inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhotosToSupabase = async (photos: File[], inspectionId: string) => {
    const uploadedPhotos = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.name.split('.').pop();
      const fileName = `${inspectionId}_${Date.now()}_${i}.${fileExt}`;
      
      try {
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('field-visit-images')
          .upload(fileName, photo);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('field-visit-images')
          .getPublicUrl(fileName);

        // Save photo record to database
        const { error: dbError } = await supabase
          .from('fims_inspection_photos')
          .insert({
            inspection_id: inspectionId,
            photo_url: publicUrl,
            photo_name: photo.name,
            description: `Photo ${i + 1}`,
            photo_order: i + 1
          });

        if (dbError) {
          console.error('Error saving photo record:', dbError);
          continue;
        }

        uploadedPhotos.push({
          url: publicUrl,
          name: photo.name,
          order: i + 1
        });
      } catch (error) {
        console.error('Error processing photo:', error);
      }
    }
    
    return uploadedPhotos;
  };

  const handleCreateInspectionWithForm = async (submitStatus: 'draft' | 'submitted' = 'draft') => {
    if (!selectedCategoryForForm) return;

    setIsCreating(true);
    try {
      const inspectionData = {
        ...newInspection,
        inspection_number: isEditMode ? editingInspection.inspection_number : generateInspectionNumber(),
        inspector_id: isEditMode ? editingInspection.inspector_id : user.id,
        assigned_by: isEditMode ? editingInspection.assigned_by : user.id,
        status: submitStatus,
        inspection_date: new Date().toISOString()
      };

      let inspectionResult;
      if (isEditMode) {
        // Update existing inspection
        const { data, error: inspectionError } = await supabase
          .from('fims_inspections')
          .update(inspectionData)
          .eq('id', editingInspection.id)
          .select()
          .single();
        
        if (inspectionError) throw inspectionError;
        inspectionResult = data;
      } else {
        // Create new inspection
        const { data, error: inspectionError } = await supabase
          .from('fims_inspections')
          .insert([inspectionData])
          .select()
          .single();
        
        if (inspectionError) throw inspectionError;
        inspectionResult = data;
      }

      // If it's an anganwadi inspection, save the form data
      if (selectedCategoryForForm.form_type === 'anganwadi') {
        const anganwadiData = {
          inspection_id: inspectionResult.id,
          anganwadi_name: anganwadiForm.anganwadi_name,
          anganwadi_number: anganwadiForm.anganwadi_number,
          supervisor_name: anganwadiForm.supervisor_name,
          helper_name: anganwadiForm.helper_name,
          village_name: anganwadiForm.village_name,
          building_condition: anganwadiForm.building_condition,
          room_availability: anganwadiForm.room_availability,
          toilet_facility: anganwadiForm.toilet_facility,
          drinking_water: anganwadiForm.drinking_water,
          electricity: anganwadiForm.electricity,
          kitchen_garden: anganwadiForm.kitchen_garden,
          weighing_machine: anganwadiForm.weighing_machine,
          height_measuring_scale: anganwadiForm.height_measuring_scale,
          first_aid_kit: anganwadiForm.first_aid_kit,
          teaching_materials: anganwadiForm.teaching_materials,
          toys_available: anganwadiForm.toys_available,
          attendance_register: anganwadiForm.attendance_register,
          growth_chart_updated: anganwadiForm.growth_chart_updated,
          vaccination_records: anganwadiForm.vaccination_records,
          nutrition_records: anganwadiForm.nutrition_records,
          total_registered_children: anganwadiForm.total_registered_children,
          children_present_today: anganwadiForm.children_present_today,
          children_0_3_years: anganwadiForm.children_0_3_years,
          children_3_6_years: anganwadiForm.children_3_6_years,
          hot_meal_served: anganwadiForm.hot_meal_served,
          meal_quality: anganwadiForm.meal_quality,
          take_home_ration: anganwadiForm.take_home_ration,
          health_checkup_conducted: anganwadiForm.health_checkup_conducted,
          immunization_updated: anganwadiForm.immunization_updated,
          vitamin_a_given: anganwadiForm.vitamin_a_given,
          iron_tablets_given: anganwadiForm.iron_tablets_given,
          general_observations: anganwadiForm.general_observations,
          recommendations: anganwadiForm.recommendations,
          action_required: anganwadiForm.action_required
        };

        if (isEditMode) {
          // Update existing anganwadi form
          const { error: anganwadiError } = await supabase
            .from('fims_anganwadi_forms')
            .update(anganwadiData)
            .eq('inspection_id', editingInspection.id);
          
          if (anganwadiError) throw anganwadiError;
        } else {
          // Create new anganwadi form
          const { error: anganwadiError } = await supabase
            .from('fims_anganwadi_forms')
            .insert([anganwadiData]);
          
          if (anganwadiError) throw anganwadiError;
        }
      }

      // Upload photos if any
      if (selectedPhotos.length > 0) {
        if (isEditMode) {
          // Delete existing photos first
          const { data: existingPhotos } = await supabase
            .from('fims_inspection_photos')
            .select('photo_url')
            .eq('inspection_id', editingInspection.id);

          if (existingPhotos && existingPhotos.length > 0) {
            const photoUrls = existingPhotos.map(p => p.photo_url.split('/').pop()).filter(Boolean);
            if (photoUrls.length > 0) {
              await supabase.storage
                .from('field-visit-images')
                .remove(photoUrls);
            }

            await supabase
              .from('fims_inspection_photos')
              .delete()
              .eq('inspection_id', editingInspection.id);
          }

          // Upload new photos
          await uploadPhotosToSupabase(selectedPhotos, editingInspection.id);
        } else {
          await uploadPhotosToSupabase(selectedPhotos, inspectionResult.id);
        }
      }

      await fetchData();
      resetForm();
      setEditingInspection(null);
      setIsEditMode(false);
      setIsViewMode(false);
      
      if (submitStatus === 'submitted') {
        alert(t('fims.inspectionSubmittedSuccessfully', isEditMode ? 'Inspection updated and submitted successfully!' : 'Inspection submitted successfully!'));
      } else {
        alert(t('fims.inspectionSavedAsDraft', isEditMode ? 'Inspection updated successfully!' : 'Inspection saved as draft!'));
      }
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newPhotos = files.map(file => ({ file, description: '' }));
    setSelectedPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoDescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotoDescriptions(prev => prev.map((desc, i) => i === index ? description : desc));
  };

  const handleSubmitInspection = () => {
    setShowSubmitConfirmation(true);
  };

  const confirmSubmitInspection = () => {
    setShowSubmitConfirmation(false);
    handleCreateInspectionWithForm('submitted');
  };

  const handleCreateInspection = () => {
    // Reset all form data for new inspection
    setNewInspection({
      category_id: '',
      location_name: '',
      address: '',
      planned_date: new Date().toISOString().split('T')[0],
      latitude: null,
      longitude: null,
      location_accuracy: null
    });
    
    setAnganwadiForm({
      anganwadi_name: '',
      anganwadi_number: '',
      supervisor_name: userProfile?.name || user.email?.split('@')[0] || '',
      helper_name: '',
      village_name: '',
      building_condition: '',
      room_availability: null,
      toilet_facility: null,
      drinking_water: null,
      electricity: null,
      kitchen_garden: null,
      weighing_machine: null,
      height_measuring_scale: null,
      first_aid_kit: null,
      teaching_materials: null,
      toys_available: null,
      attendance_register: null,
      growth_chart_updated: null,
      vaccination_records: null,
      nutrition_records: null,
      total_registered_children: 0,
      children_present_today: 0,
      children_0_3_years: 0,
      children_3_6_years: 0,
      hot_meal_served: null,
      meal_quality: '',
      take_home_ration: null,
      health_checkup_conducted: null,
      immunization_updated: null,
      vitamin_a_given: null,
      iron_tablets_given: null,
      general_observations: '',
      recommendations: '',
      action_required: ''
    });
    
    setSelectedPhotos([]);
    setCurrentStep(1);
    setIsEditMode(false);
    setIsViewMode(false);
    setEditingInspection(null);
    setActiveTab('new');
  };

  const handleViewPhotos = async (inspection: Inspection) => {
    try {
      setIsLoading(true);
      const { data: photos, error } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspection.id)
        .order('photo_order');

      if (error) {
        console.error('Error fetching photos:', error);
        alert('Error loading photos: ' + error.message);
        return;
      }

      setSelectedInspectionPhotos(photos || []);
      setShowPhotoModal(true);
    } catch (error) {
      console.error('Error in handleViewPhotos:', error);
      alert('Error loading photos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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

  const renderCategoryGrid = () => (
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
  );

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fims.locationInformation', 'Location Information')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.locationName')}
              </label>
              <input
                type="text"
                value={newInspection.location_name}
                onChange={(e) => setNewInspection({ ...newInspection, location_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('fims.enterLocationName')}
                required
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.address')}
              </label>
              <textarea
                value={newInspection.address}
                onChange={(e) => setNewInspection({ ...newInspection, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('fims.enterFullAddress')}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fims.plannedDate')}
              </label>
              <input
                type="date"
                value={newInspection.planned_date}
                onChange={(e) => setNewInspection({ ...newInspection, planned_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isViewMode}
              />
            </div>

            {/* Basic Details for Anganwadi */}
            {selectedCategoryForForm?.form_type === 'anganwadi' && (
              <>
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">मूलभूत तपशील (Basic Details)</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    अंगणवाडी केंद्राचे नाव (Anganwadi Centre Name)
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.anganwadi_name}
                    onChange={(e) => setAnganwadiForm({ ...anganwadiForm, anganwadi_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="अंगणवाडी केंद्राचे नाव टाका"
                    disabled={isViewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    अंगणवाडी क्रमांक (Anganwadi Number)
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.anganwadi_number}
                    onChange={(e) => setAnganwadiForm({ ...anganwadiForm, anganwadi_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="अंगणवाडी क्रमांक टाका"
                    disabled={isViewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    पर्यवेक्षकाचे नाव (Supervisor Name)
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.supervisor_name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    placeholder="पर्यवेक्षकाचे नाव"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">स्वयंचलितपणे भरले गेले (Auto-filled)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    मदतनीसाचे नाव (Helper Name)
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.helper_name}
                    onChange={(e) => setAnganwadiForm({ ...anganwadiForm, helper_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="मदतनीसाचे नाव टाका"
                    disabled={isViewMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    गावाचे नाव (Village Name)
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.village_name}
                    onChange={(e) => setAnganwadiForm({ ...anganwadiForm, village_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="गावाचे नाव टाका"
                    disabled={isViewMode}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );
    } else if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fims.captureLocation', 'Capture Location')}
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 text-blue-800 mb-2">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">स्थान कॅप्चर करा (Capture Location)</span>
            </div>
            <p className="text-sm text-blue-700">
              तपासणीसाठी अचूक स्थान मिळवण्यासाठी खालील बटणावर क्लिक करा.
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={getCurrentLocation}
              disabled={isLoading || isViewMode}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              <span>सध्याचे स्थान मिळवा (Get Current Location)</span>
            </button>
          </div>
          
          {currentLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 mb-3">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">स्थान यशस्वीरित्या कॅप्चर केले (Location Captured Successfully)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                <div>
                  <span className="font-medium">अक्षांश (Latitude):</span>
                  <br />
                  {currentLocation.lat.toFixed(6)}
                </div>
                <div>
                  <span className="font-medium">रेखांश (Longitude):</span>
                  <br />
                  {currentLocation.lng.toFixed(6)}
                </div>
                <div>
                  <span className="font-medium">अचूकता (Accuracy):</span>
                  <br />
                  {Math.round(currentLocation.accuracy)}m
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCategoryForForm?.form_type === 'anganwadi' ? 'अंगणवाडी केंद्र माहिती आणि तपासणी' : 'Inspection Details'}
          </h3>
          
          {selectedCategoryForForm?.form_type === 'anganwadi' && (
            <div className="space-y-6">
              {/* Infrastructure */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">पायाभूत सुविधा (Infrastructure)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      इमारतीची स्थिती (Building Condition)
                    </label>
                    <select
                      value={anganwadiForm.building_condition}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, building_condition: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isViewMode}
                    >
                      <option value="">निवडा (Select)</option>
                      <option value="excellent">उत्कृष्ट (Excellent)</option>
                      <option value="good">चांगली (Good)</option>
                      <option value="average">सरासरी (Average)</option>
                      <option value="poor">खराब (Poor)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'room_availability', label: 'खोली उपलब्धता (Room Availability)' },
                      { key: 'toilet_facility', label: 'शौचालय सुविधा (Toilet Facility)' },
                      { key: 'drinking_water', label: 'पिण्याचे पाणी (Drinking Water)' },
                      { key: 'electricity', label: 'वीज (Electricity)' },
                      { key: 'kitchen_garden', label: 'स्वयंपाकघर बाग (Kitchen Garden)' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={item.key}
                              value="true"
                              checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === true}
                              onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: true})}
                              className="text-green-600 focus:ring-green-500"
                              disabled={isViewMode}
                            />
                            <span className="ml-1 text-xs text-green-600">होय</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={item.key}
                              value="false"
                              checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === false}
                              onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: false})}
                              className="text-red-600 focus:ring-red-500"
                              disabled={isViewMode}
                            />
                            <span className="ml-1 text-xs text-red-600">नाही</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">उपकरणे (Equipment)</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'weighing_machine', label: 'वजन मशीन (Weighing Machine)' },
                    { key: 'height_measuring_scale', label: 'उंची मापण्याचे साधन (Height Measuring Scale)' },
                    { key: 'first_aid_kit', label: 'प्राथमिक उपचार पेटी (First Aid Kit)' },
                    { key: 'teaching_materials', label: 'शिकवण्याचे साहित्य (Teaching Materials)' },
                    { key: 'toys_available', label: 'खेळणी उपलब्ध (Toys Available)' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value="true"
                            checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === true}
                            onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: true})}
                            className="text-green-600 focus:ring-green-500"
                            disabled={isViewMode}
                          />
                          <span className="ml-1 text-xs text-green-600">होय</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value="false"
                            checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === false}
                            onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: false})}
                            className="text-red-600 focus:ring-red-500"
                            disabled={isViewMode}
                          />
                          <span className="ml-1 text-xs text-red-600">नाही</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Records Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">नोंदी (Records)</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'attendance_register', label: 'उपस्थिती नोंदवही (Attendance Register)' },
                    { key: 'growth_chart_updated', label: 'वाढ तक्ता अपडेट (Growth Chart Updated)' },
                    { key: 'vaccination_records', label: 'लसीकरण नोंदी (Vaccination Records)' },
                    { key: 'nutrition_records', label: 'पोषण नोंदी (Nutrition Records)' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value="true"
                            checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === true}
                            onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: true})}
                            className="text-green-600 focus:ring-green-500"
                            disabled={isViewMode}
                          />
                          <span className="ml-1 text-xs text-green-600">होय</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value="false"
                            checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === false}
                            onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: false})}
                            className="text-red-600 focus:ring-red-500"
                            disabled={isViewMode}
                          />
                          <span className="ml-1 text-xs text-red-600">नाही</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Children Count Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">मुलांची संख्या (Children Count)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      एकूण नोंदणीकृत (Total Registered)
                    </label>
                    <input
                      type="number"
                      value={anganwadiForm.total_registered_children}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, total_registered_children: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      disabled={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      आज उपस्थित (Present Today)
                    </label>
                    <input
                      type="number"
                      value={anganwadiForm.children_present_today}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, children_present_today: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      disabled={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      0-3 वर्षे (0-3 Years)
                    </label>
                    <input
                      type="number"
                      value={anganwadiForm.children_0_3_years}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, children_0_3_years: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      disabled={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3-6 वर्षे (3-6 Years)
                    </label>
                    <input
                      type="number"
                      value={anganwadiForm.children_3_6_years}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, children_3_6_years: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>

              {/* Nutrition Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">पोषण (Nutrition)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {[
                      { key: 'hot_meal_served', label: 'गरम जेवण दिले (Hot Meal Served)' },
                      { key: 'take_home_ration', label: 'घरी नेण्याचे धान्य (Take Home Ration)' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={item.key}
                              value="true"
                              checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === true}
                              onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: true})}
                              className="text-green-600 focus:ring-green-500"
                              disabled={isViewMode}
                            />
                            <span className="ml-1 text-xs text-green-600">होय</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={item.key}
                              value="false"
                              checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === false}
                              onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: false})}
                              className="text-red-600 focus:ring-red-500"
                              disabled={isViewMode}
                            />
                            <span className="ml-1 text-xs text-red-600">नाही</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      जेवणाची गुणवत्ता (Meal Quality)
                    </label>
                    <select
                      value={anganwadiForm.meal_quality}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, meal_quality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isViewMode}
                    >
                      <option value="">निवडा (Select)</option>
                      <option value="excellent">उत्कृष्ट (Excellent)</option>
                      <option value="good">चांगली (Good)</option>
                      <option value="average">सरासरी (Average)</option>
                      <option value="poor">खराब (Poor)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Health Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">आरोग्य (Health)</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'health_checkup_conducted', label: 'आरोग्य तपासणी केली (Health Checkup Conducted)' },
                    { key: 'immunization_updated', label: 'लसीकरण अपडेट (Immunization Updated)' },
                    { key: 'vitamin_a_given', label: 'व्हिटामिन ए दिले (Vitamin A Given)' },
                    { key: 'iron_tablets_given', label: 'लोह गोळ्या दिल्या (Iron Tablets Given)' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value="true"
                            checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === true}
                            onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: true})}
                            className="text-green-600 focus:ring-green-500"
                            disabled={isViewMode}
                          />
                          <span className="ml-1 text-xs text-green-600">होय</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value="false"
                            checked={anganwadiForm[item.key as keyof typeof anganwadiForm] === false}
                            onChange={() => setAnganwadiForm({...anganwadiForm, [item.key]: false})}
                            className="text-red-600 focus:ring-red-500"
                            disabled={isViewMode}
                          />
                          <span className="ml-1 text-xs text-red-600">नाही</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">निरीक्षणे आणि शिफारसी (Observations & Recommendations)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      सामान्य निरीक्षणे (General Observations)
                    </label>
                    <textarea
                      value={anganwadiForm.general_observations}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, general_observations: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="सामान्य निरीक्षणे टाका..."
                      disabled={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      शिफारसी (Recommendations)
                    </label>
                    <textarea
                      value={anganwadiForm.recommendations}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, recommendations: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="शिफारसी टाका..."
                      disabled={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      आवश्यक कृती (Action Required)
                    </label>
                    <textarea
                      value={anganwadiForm.action_required}
                      onChange={(e) => setAnganwadiForm({...anganwadiForm, action_required: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="आवश्यक कृती टाका..."
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (currentStep === 4) {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">फोटो अपलोड करा (Upload Photos)</h4>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={isViewMode}
              />
              {!isViewMode && (
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Camera className="h-12 w-12 text-gray-400" />
                  <span className="text-lg font-medium text-gray-700">फोटो निवडा (Select Photos)</span>
                  <span className="text-sm text-gray-500">एकाधिक फोटो निवडू शकता (You can select multiple photos)</span>
                </label>
              )}
            </div>

            {/* Selected Photos */}
            {selectedPhotos.length > 0 && (
              <div className="mt-6">
                <h5 className="text-md font-semibold text-gray-900 mb-3">निवडलेले फोटो ({selectedPhotos.length})</h5>
                <div className="space-y-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                      <Camera className="h-8 w-8 text-purple-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{photo.file?.name || photo.name || `Photo ${index + 1}`}</div>
                        <div className="text-sm text-gray-500">{photo.file ? (photo.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Uploaded'}</div>
                        <input
                          type="text"
                          value={photo.description}
                          onChange={(e) => {
                            const updatedPhotos = [...selectedPhotos];
                            updatedPhotos[index].description = e.target.value;
                            setSelectedPhotos(updatedPhotos);
                          }}
                          className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                          placeholder="फोटोचे वर्णन (Photo description)"
                          disabled={isViewMode}
                        />
                      </div>
                      {!isViewMode && (
                        <button
                          onClick={() => {
                            const updatedPhotos = selectedPhotos.filter((_, i) => i !== index);
                            setSelectedPhotos(updatedPhotos);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const renderNewInspectionForm = () => (
    <div className="space-y-6">
      {!selectedCategoryForForm ? (
        renderCategoryGrid()
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className="ml-2 text-sm">
                  {step === 1 ? 'स्थान' : step === 2 ? 'GPS' : step === 3 ? 'तपासणी' : 'फोटो'}
                </div>
                {step < 4 && <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>}
              </div>
            ))}
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              पायरी {currentStep}/4 - {selectedCategoryForForm?.name_marathi}
            </h3>
          </div>
          
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || isViewMode}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>मागे (Back)</span>
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && (!newInspection.location_name || !newInspection.address)) ||
                  (currentStep === 2 && (!newInspection.latitude || !newInspection.longitude)) ||
                  isViewMode
                }
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>पुढे (Next)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              !isViewMode && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleCreateInspectionWithForm('draft')}
                    disabled={isCreating}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isEditMode ? 'अपडेट करा (Update)' : 'जतन करा (Save)'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleCreateInspectionWithForm('draft')}
                    disabled={isCreating}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{isEditMode ? 'मसुदा म्हणून जतन करा (Save as Draft)' : 'संपादित करा (Edit)'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowSubmitConfirmation(true)}
                    disabled={isCreating}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isEditMode ? 'अपडेट आणि सबमिट करा (Update & Submit)' : 'सबमिट करा (Submit)'}</span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Submit Confirmation Modal */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">तपासणी सबमिट करा (Submit Inspection)</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                आपल्याला खात्री आहे की आपण ही तपासणी सबमिट करू इच्छिता? सबमिट केल्यानंतर ती पुनरावलोकनासाठी पाठवली जाईल.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {isEditMode 
                  ? 'तुम्हाला खात्री आहे की तुम्ही ही तपासणी अपडेट आणि सबमिट करू इच्छिता?'
                  : 'Are you sure you want to submit this inspection? Once submitted, it will be sent for review.'
                }
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowSubmitConfirmation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  onClick={() => {
                    setShowSubmitConfirmation(false);
                    handleCreateInspectionWithForm('submitted');
                  }}
                  disabled={isCreating}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {isCreating ? 'सबमिट करत आहे...' : (isEditMode ? 'Yes, Update & Submit' : 'सबमिट करा (Submit)')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewInspection(inspection)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
                      title="View Inspection"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complete</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
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
                          onClick={() => handleDeleteInspection(inspection)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewPhotos(inspection)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded"
                        title="View Photos"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleInspectionCompletion(inspection, 'complete')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
                          title="Complete"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleInspectionCompletion(inspection, 'revisit')}
                          className="px-2 py-1 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded"
                          title="Revisit"
                        >
                          Revisit
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

  const renderNewInspection = () => renderNewInspectionForm();

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

      {/* Photo View Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Inspection Photos</h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {selectedInspectionPhotos.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No photos available for this inspection</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedInspectionPhotos.map((photo, index) => (
                    <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={photo.photo_name || `Photo ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900">{photo.photo_name}</p>
                        <p className="text-xs text-gray-500">{photo.description}</p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(photo.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedInspectionForCompletion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {completionAction === 'complete' ? 'Complete Inspection' : 'Send for Revisit'}
              </h3>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Inspection: <span className="font-medium">{selectedInspectionForCompletion.inspection_number}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Location: <span className="font-medium">{selectedInspectionForCompletion.location_name}</span>
                </p>
              </div>
              
              {completionAction === 'revisit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to:
                  </label>
                  <select
                    value={revisitAssignee}
                    onChange={(e) => setRevisitAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select user for revisit</option>
                    {revisitUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.roles?.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {completionAction === 'complete' 
                    ? 'This will mark the inspection as completed and approved.'
                    : 'This will send the inspection back for revisit to the selected user.'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCompletion}
                disabled={isLoading || (completionAction === 'revisit' && !revisitAssignee)}
                className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                  completionAction === 'complete' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isLoading ? 'Processing...' : (completionAction === 'complete' ? 'Complete' : 'Send for Revisit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};