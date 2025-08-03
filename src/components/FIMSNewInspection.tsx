import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  Save,
  Send,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  X,
  Plus,
  Trash2,
  Eye,
  Edit,
  Target,
  Activity,
  Shield,
  Stethoscope,
  Pill,
  Heart,
  Scale,
  RotateCcw,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Building2,
  UserCheck,
  Home,
  Utensils,
  Baby,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FIMSNewInspectionProps {
  user: SupabaseUser;
  onBack: () => void;
  categories: Category[];
  onInspectionCreated: () => void;
  editingInspection?: Inspection | null;
}

interface Category {
  id: string;
  name: string;
  name_marathi: string;
  description: string;
  form_type: string;
  is_active: boolean;
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
  fims_anganwadi_forms?: AnganwadiForm[];
}

interface AnganwadiForm {
  id: string;
  inspection_id: string;
  anganwadi_name: string | null;
  anganwadi_number: string | null;
  supervisor_name: string | null;
  helper_name: string | null;
  village_name: string | null;
  building_condition: string | null;
  room_availability: boolean | null;
  toilet_facility: boolean | null;
  drinking_water: boolean | null;
  electricity: boolean | null;
  kitchen_garden: boolean | null;
  weighing_machine: boolean | null;
  height_measuring_scale: boolean | null;
  first_aid_kit: boolean | null;
  teaching_materials: boolean | null;
  toys_available: boolean | null;
  attendance_register: boolean | null;
  growth_chart_updated: boolean | null;
  vaccination_records: boolean | null;
  nutrition_records: boolean | null;
  total_registered_children: number | null;
  children_present_today: number | null;
  children_0_3_years: number | null;
  children_3_6_years: number | null;
  hot_meal_served: boolean | null;
  meal_quality: string | null;
  take_home_ration: boolean | null;
  health_checkup_conducted: boolean | null;
  immunization_updated: boolean | null;
  vitamin_a_given: boolean | null;
  iron_tablets_given: boolean | null;
  general_observations: string | null;
  recommendations: string | null;
  action_required: string | null;
}

interface InspectionPhoto {
  id?: string;
  photo_url: string;
  photo_name: string | null;
  description: string | null;
  photo_order: number;
  file?: File;
}

export const FIMSNewInspection: React.FC<FIMSNewInspectionProps> = ({ 
  user, 
  onBack, 
  categories, 
  onInspectionCreated,
  editingInspection 
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(editingInspection ? 1 : 0); // 0 = category, 1-4 = form steps
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  // Form states
  const [inspectionData, setInspectionData] = useState({
    location_name: '',
    address: '',
    planned_date: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location_accuracy: null as number | null
  });

  const [anganwadiForm, setAnganwadiForm] = useState<Partial<AnganwadiForm>>({
    anganwadi_name: '',
    anganwadi_number: '',
    supervisor_name: '',
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

  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (editingInspection) {
      // Find the category
      const category = categories.find(c => c.id === editingInspection.category_id);
      setSelectedCategory(category || null);
      
      // Set inspection data
      setInspectionData({
        location_name: editingInspection.location_name,
        address: editingInspection.address || '',
        planned_date: editingInspection.planned_date ? editingInspection.planned_date.split('T')[0] : '',
        latitude: editingInspection.latitude,
        longitude: editingInspection.longitude,
        location_accuracy: editingInspection.location_accuracy
      });

      // Set anganwadi form data if available
      if (editingInspection.fims_anganwadi_forms && editingInspection.fims_anganwadi_forms.length > 0) {
        const formData = editingInspection.fims_anganwadi_forms[0];
        setAnganwadiForm(formData);
      }

      // Load existing photos
      loadExistingPhotos(editingInspection.id);
    }
  }, [editingInspection, categories]);

  const loadExistingPhotos = async (inspectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('photo_order');

      if (error) throw error;
      
      const existingPhotos = data?.map(photo => ({
        id: photo.id,
        photo_url: photo.photo_url,
        photo_name: photo.photo_name,
        description: photo.description,
        photo_order: photo.photo_order
      })) || [];
      
      setPhotos(existingPhotos);
    } catch (error) {
      console.error('Error loading existing photos:', error);
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
        setInspectionData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_accuracy: position.coords.accuracy
        }));
        setLocationPermission('granted');
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
        setIsLoading(false);
        alert('Unable to get location. Please enter location manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCurrentStep(1);
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const newPhotos: InspectionPhoto[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${i}_${file.name}`;
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('field-visit-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('field-visit-images')
          .getPublicUrl(fileName);

        newPhotos.push({
          photo_url: urlData.publicUrl,
          photo_name: file.name,
          description: '',
          photo_order: photos.length + i + 1,
          file
        });
      }

      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error uploading photos: ' + error.message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, description } : photo
    ));
  };

  const generateInspectionNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `FIMS-${year}${month}${day}-${time}`;
  };

  const handleSaveInspection = async (status: 'draft' | 'submitted') => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    if (!inspectionData.location_name.trim()) {
      alert('Please enter location name');
      return;
    }

    setIsLoading(true);
    try {
      let inspectionId = editingInspection?.id;
      
      if (editingInspection) {
        // Update existing inspection
        const { error: updateError } = await supabase
          .from('fims_inspections')
          .update({
            location_name: inspectionData.location_name,
            address: inspectionData.address,
            planned_date: inspectionData.planned_date || null,
            latitude: inspectionData.latitude,
            longitude: inspectionData.longitude,
            location_accuracy: inspectionData.location_accuracy,
            status,
            inspection_date: status === 'submitted' ? new Date().toISOString() : null
          })
          .eq('id', editingInspection.id);

        if (updateError) throw updateError;
      } else {
        // Create new inspection
        const inspectionNumber = generateInspectionNumber();
        
        const { data: newInspection, error: inspectionError } = await supabase
          .from('fims_inspections')
          .insert({
            inspection_number: inspectionNumber,
            category_id: selectedCategory.id,
            inspector_id: user.id,
            location_name: inspectionData.location_name,
            address: inspectionData.address,
            planned_date: inspectionData.planned_date || null,
            latitude: inspectionData.latitude,
            longitude: inspectionData.longitude,
            location_accuracy: inspectionData.location_accuracy,
            status,
            inspection_date: status === 'submitted' ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (inspectionError) throw inspectionError;
        inspectionId = newInspection.id;
      }

      // Save anganwadi form if category is anganwadi
      if (selectedCategory.form_type === 'anganwadi' && inspectionId) {
        if (editingInspection?.fims_anganwadi_forms && editingInspection.fims_anganwadi_forms.length > 0) {
          // Update existing form
          const { error: formError } = await supabase
            .from('fims_anganwadi_forms')
            .update(anganwadiForm)
            .eq('inspection_id', inspectionId);
          
          if (formError) throw formError;
        } else {
          // Create new form
          const { error: formError } = await supabase
            .from('fims_anganwadi_forms')
            .insert({
              inspection_id: inspectionId,
              ...anganwadiForm
            });
          
          if (formError) throw formError;
        }
      }

      // Save photos
      for (const photo of photos) {
        if (!photo.id) { // Only save new photos
          const { error: photoError } = await supabase
            .from('fims_inspection_photos')
            .insert({
              inspection_id: inspectionId,
              photo_url: photo.photo_url,
              photo_name: photo.photo_name,
              description: photo.description,
              photo_order: photo.photo_order
            });
          
          if (photoError) throw photoError;
        }
      }

      onInspectionCreated();
      onBack();
      alert(editingInspection ? 'Inspection updated successfully!' : 'Inspection created successfully!');
      
    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Error saving inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Basic Details
        return anganwadiForm.anganwadi_name && anganwadiForm.supervisor_name && anganwadiForm.village_name;
      case 2: // Location Details
        return inspectionData.location_name.trim() !== '';
      case 3: // Inspection Details
        return true; // Optional fields
      case 4: // Photos
        return true; // Optional
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      alert('Please fill in all required fields before proceeding.');
      return;
    }
    setCurrentStep(prev => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(editingInspection ? 1 : 0, prev - 1));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Select Category';
      case 1: return 'Basic Details';
      case 2: return 'Location Details';
      case 3: return 'Inspection Details';
      case 4: return 'Photos & Submit';
      default: return 'Inspection Form';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 0: return FileText;
      case 1: return Building2;
      case 2: return MapPin;
      case 3: return ClipboardList;
      case 4: return Camera;
      default: return FileText;
    }
  };

  // Step 0: Category Selection (only for new inspections)
  if (currentStep === 0 && !editingInspection) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('fims.newInspection')}</h1>
                <p className="text-sm text-gray-500 mt-1">Select inspection category to begin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('fims.inspectionCategory')}</h2>
              <p className="text-lg text-gray-600">Choose the type of inspection you want to conduct</p>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Categories Available</h3>
                <p className="text-gray-500">Please contact your administrator to set up inspection categories.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-300 group"
                  >
                    {/* Category Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-full group-hover:from-purple-600 group-hover:to-indigo-700 transition-all duration-300">
                        {category.form_type === 'anganwadi' ? (
                          <Users className="h-12 w-12 text-white" />
                        ) : (
                          <FileText className="h-12 w-12 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Category Info */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-300">
                        {category.name_marathi}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{category.name}</p>
                      
                      {category.description && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      {/* Form Type Badge */}
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          category.form_type === 'anganwadi' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {category.form_type === 'anganwadi' ? 'Anganwadi Center' : 'Document Inspection'}
                        </span>
                      </div>
                    </div>

                    {/* Hover Arrow */}
                    <div className="flex justify-center mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <ChevronRight className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Multi-step form for Anganwadi inspection
  const StepIcon = getStepIcon();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => editingInspection ? onBack() : (currentStep === 1 ? setCurrentStep(0) : handlePrevStep())}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="bg-purple-100 p-2 rounded-lg">
                <StepIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {editingInspection ? 'Edit Inspection' : t('fims.newInspection')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {getStepTitle()} {selectedCategory && `- ${selectedCategory.name_marathi}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 4</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: 'Basic Details', icon: Building2 },
              { step: 2, title: 'Location', icon: MapPin },
              { step: 3, title: 'Inspection', icon: ClipboardList },
              { step: 4, title: 'Photos', icon: Camera }
            ].map((item) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  currentStep >= item.step
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {currentStep > item.step ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= item.step ? 'text-purple-600' : 'text-gray-400'
                }`}>
                  {item.title}
                </span>
                {item.step < 4 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > item.step ? 'bg-purple-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600">Enter the basic details of the Anganwadi center</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anganwadi Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.anganwadi_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, anganwadi_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter anganwadi name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anganwadi Number
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.anganwadi_number || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, anganwadi_number: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter anganwadi number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.supervisor_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, supervisor_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter supervisor name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Helper Name
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.helper_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, helper_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter helper name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.village_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, village_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter village name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Condition
                  </label>
                  <select
                    value={anganwadiForm.building_condition || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, building_condition: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select condition</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location Details */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Information</h2>
                <p className="text-gray-600">Provide location details and capture GPS coordinates</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inspectionData.location_name}
                      onChange={(e) => setInspectionData(prev => ({ ...prev, location_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter location name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planned Date
                    </label>
                    <input
                      type="date"
                      value={inspectionData.planned_date}
                      onChange={(e) => setInspectionData(prev => ({ ...prev, planned_date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    value={inspectionData.address}
                    onChange={(e) => setInspectionData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter complete address"
                  />
                </div>

                {/* GPS Location Capture */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">GPS Location Capture</h4>
                    <button
                      onClick={getCurrentLocation}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Get Current Location</span>
                    </button>
                  </div>

                  {inspectionData.latitude && inspectionData.longitude ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">Latitude</div>
                        <div className="text-lg font-bold text-blue-900">{inspectionData.latitude.toFixed(6)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">Longitude</div>
                        <div className="text-lg font-bold text-blue-900">{inspectionData.longitude.toFixed(6)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">Accuracy</div>
                        <div className="text-lg font-bold text-blue-900">{Math.round(inspectionData.location_accuracy || 0)}m</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MapPin className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-700">Click "Get Current Location" to capture GPS coordinates</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Inspection Details */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspection Details</h2>
                <p className="text-gray-600">Complete the detailed inspection checklist</p>
              </div>

              <div className="space-y-8">
                {/* Facilities Checklist */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="h-5 w-5 text-blue-600 mr-2" />
                    Facilities Available
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'room_availability', label: 'Room Availability', icon: Home },
                      { key: 'toilet_facility', label: 'Toilet Facility', icon: Home },
                      { key: 'drinking_water', label: 'Drinking Water', icon: Activity },
                      { key: 'electricity', label: 'Electricity', icon: Activity },
                      { key: 'kitchen_garden', label: 'Kitchen Garden', icon: Activity },
                      { key: 'weighing_machine', label: 'Weighing Machine', icon: Scale },
                      { key: 'height_measuring_scale', label: 'Height Measuring Scale', icon: Scale },
                      { key: 'first_aid_kit', label: 'First Aid Kit', icon: Heart },
                      { key: 'teaching_materials', label: 'Teaching Materials', icon: FileText },
                      { key: 'toys_available', label: 'Toys Available', icon: Users },
                      { key: 'attendance_register', label: 'Attendance Register', icon: ClipboardList },
                      { key: 'growth_chart_updated', label: 'Growth Chart Updated', icon: TrendingUp },
                      { key: 'vaccination_records', label: 'Vaccination Records', icon: Shield },
                      { key: 'nutrition_records', label: 'Nutrition Records', icon: Utensils }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={anganwadiForm[item.key as keyof AnganwadiForm] === true}
                          onChange={(e) => setAnganwadiForm(prev => ({ 
                            ...prev, 
                            [item.key]: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <item.icon className="h-4 w-4 text-gray-600" />
                        <label className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Children Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Baby className="h-5 w-5 text-green-600 mr-2" />
                    Children Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Registered</label>
                      <input
                        type="number"
                        value={anganwadiForm.total_registered_children || 0}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, total_registered_children: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Present Today</label>
                      <input
                        type="number"
                        value={anganwadiForm.children_present_today || 0}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, children_present_today: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age 0-3 Years</label>
                      <input
                        type="number"
                        value={anganwadiForm.children_0_3_years || 0}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, children_0_3_years: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age 3-6 Years</label>
                      <input
                        type="number"
                        value={anganwadiForm.children_3_6_years || 0}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, children_3_6_years: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Nutrition & Health */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Utensils className="h-5 w-5 text-orange-600 mr-2" />
                    Nutrition & Health Services
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={anganwadiForm.hot_meal_served === true}
                          onChange={(e) => setAnganwadiForm(prev => ({ ...prev, hot_meal_served: e.target.checked }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <Utensils className="h-4 w-4 text-orange-600" />
                        <label className="text-sm font-medium text-gray-700">Hot Meal Served</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meal Quality</label>
                        <select
                          value={anganwadiForm.meal_quality || ''}
                          onChange={(e) => setAnganwadiForm(prev => ({ ...prev, meal_quality: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select quality</option>
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="average">Average</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: 'take_home_ration', label: 'Take Home Ration', icon: Utensils },
                        { key: 'health_checkup_conducted', label: 'Health Checkup Conducted', icon: Stethoscope },
                        { key: 'immunization_updated', label: 'Immunization Updated', icon: Shield },
                        { key: 'vitamin_a_given', label: 'Vitamin A Given', icon: Pill },
                        { key: 'iron_tablets_given', label: 'Iron Tablets Given', icon: Pill }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <input
                            type="checkbox"
                            checked={anganwadiForm[item.key as keyof AnganwadiForm] === true}
                            onChange={(e) => setAnganwadiForm(prev => ({ 
                              ...prev, 
                              [item.key]: e.target.checked 
                            }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                          />
                          <item.icon className="h-4 w-4 text-gray-600" />
                          <label className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    Observations & Recommendations
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">General Observations</label>
                      <textarea
                        value={anganwadiForm.general_observations || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, general_observations: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter general observations about the anganwadi center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                      <textarea
                        value={anganwadiForm.recommendations || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, recommendations: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter recommendations for improvement"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Required</label>
                      <textarea
                        value={anganwadiForm.action_required || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, action_required: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter specific actions that need to be taken"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos & Submit */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                  <Camera className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Photo Documentation</h2>
                <p className="text-gray-600">Upload photos to document your inspection findings</p>
              </div>

              <div className="space-y-6">
                {/* Photo Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Upload Inspection Photos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors duration-200 bg-gray-50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-900 mb-2">Upload Photos</p>
                      <p className="text-sm text-gray-500 mb-4">Click to select photos or drag and drop</p>
                      <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </div>
                    </label>
                  </div>
                </div>

                {/* Photo Preview Grid */}
                {photos.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                      Uploaded Photos ({photos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <img
                            src={photo.photo_url}
                            alt={photo.photo_name || `Photo ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                          <input
                            type="text"
                            value={photo.description || ''}
                            onChange={(e) => updatePhotoDescription(index, e.target.value)}
                            placeholder="Add photo description"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadingPhotos && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Uploading photos...</p>
                    <p className="text-sm text-gray-500">Please wait while we process your images</p>
                  </div>
                )}

                {/* Final Actions */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4">Ready to Submit?</h4>
                  <p className="text-purple-700 mb-6">
                    Review your inspection details and choose to save as draft or submit for review.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleSaveInspection('draft')}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      <span>Save as Draft</span>
                    </button>
                    <button
                      onClick={() => handleSaveInspection('submitted')}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                      <span>Submit Inspection</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep > 0 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrevStep}
                className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              {currentStep < 4 && (
                <button
                  onClick={handleNextStep}
                  disabled={!validateCurrentStep()}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};