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
    planned_date: new Date().toISOString().split('T')[0], // Default to today's date
    latitude: null as number | null,
    longitude: null as number | null,
    location_accuracy: null as number | null,
    place_name: '' // For reverse geocoding
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
        location_accuracy: editingInspection.location_accuracy,
        place_name: ''
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

  // Reverse geocoding function to get place name from coordinates
  const getPlaceName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY&language=en&pretty=1`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const placeName = result.formatted || result.components?.village || result.components?.town || result.components?.city || 'Unknown location';
        return placeName;
      }
    } catch (error) {
      console.log('Reverse geocoding failed, using coordinates only');
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('fims.geolocationNotSupported', 'Geolocation is not supported by this browser.'));
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const placeName = await getPlaceName(position.coords.latitude, position.coords.longitude);
        setInspectionData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_accuracy: position.coords.accuracy,
          place_name: placeName
        }));
        setLocationPermission('granted');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
        setIsGettingLocation(false);
        alert(t('fims.unableToGetLocation', 'Unable to get location. Please enter location manually.'));
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

    // Check if adding these files would exceed the limit
    if (photos.length + files.length > 5) {
      alert(t('fims.maxPhotosAllowed'));
      return;
    }

    // Check photo limit
    if (photos.length + files.length > 5) {
      alert(t('fims.maxPhotosAllowed', 'Maximum 5 photos allowed. Please remove some photos first.'));
      return;
    }

    setUploadingPhotos(true);
    try {
      const newPhotos: InspectionPhoto[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (photos.length + newPhotos.length >= 5) {
          break; // Stop if we've reached the limit
        }
        
        const file = files[i];
        const fileName = `${user.id}/${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('field-visit-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

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
      alert('Error uploading photos: ' + (error?.message || 'Unknown error occurred'));
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

    // Validate GPS coordinates to prevent numeric overflow
    const latitude = inspectionData.latitude;
    const longitude = inspectionData.longitude;
    const locationAccuracy = inspectionData.location_accuracy;

    if (latitude && (latitude < -90 || latitude > 90)) {
      alert('Invalid latitude value. Must be between -90 and 90.');
      return;
    }

    if (longitude && (longitude < -180 || longitude > 180)) {
      alert('Invalid longitude value. Must be between -180 and 180.');
      return;
    }

    if (locationAccuracy && locationAccuracy > 999999) {
      alert('Location accuracy value is too large. Please try capturing location again.');
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
            latitude: latitude ? Number(latitude.toFixed(8)) : null,
            longitude: longitude ? Number(longitude.toFixed(8)) : null,
            location_accuracy: locationAccuracy ? Number(locationAccuracy.toFixed(2)) : null,
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
            latitude: latitude ? Number(latitude.toFixed(8)) : null,
            longitude: longitude ? Number(longitude.toFixed(8)) : null,
            location_accuracy: locationAccuracy ? Number(locationAccuracy.toFixed(2)) : null,
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
          const { data: photoData, error: photoError } = await supabase
            .from('fims_inspection_photos')
            .insert({
              inspection_id: inspectionId,
              photo_url: photo.photo_url,
              photo_name: photo.photo_name,
              description: photo.description,
              photo_order: photo.photo_order
            })
            .select();
          
          if (photoError) {
            console.error('Photo save error:', photoError);
            throw new Error(`Failed to save photo: ${photoError.message}`);
          }
        }
      }

      onInspectionCreated();
      onBack();
      alert(editingInspection ? 'Inspection updated successfully!' : 'Inspection created successfully!');
      
    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Error saving inspection: ' + (error?.message || 'Unknown error occurred'));
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
      case 0: return t('fims.selectCategory');
      case 1: return t('fims.basicDetails');
      case 2: return t('fims.locationDetails');
      case 3: return t('fims.inspectionDetails');
      case 4: return t('fims.photosSubmit');
      default: return t('fims.inspectionForm');
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('fims.basicInformation')}</h2>
                <p className="text-gray-600">{t('fims.enterBasicDetails')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fims.anganwadiName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.anganwadi_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, anganwadi_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('fims.enterAnganwadiName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fims.anganwadiNumber')}
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.anganwadi_number || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, anganwadi_number: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('fims.enterAnganwadiNumber')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fims.supervisorName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.supervisor_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, supervisor_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('fims.enterSupervisorName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fims.helperName')}
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.helper_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, helper_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('fims.enterHelperName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fims.villageName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={anganwadiForm.village_name || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, village_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('fims.enterVillageName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fims.buildingCondition')}
                  </label>
                  <select
                    value={anganwadiForm.building_condition || ''}
                    onChange={(e) => setAnganwadiForm(prev => ({ ...prev, building_condition: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">{t('fims.selectCondition')}</option>
                    <option value="excellent">{t('fims.excellent')}</option>
                    <option value="good">{t('fims.good')}</option>
                    <option value="average">{t('fims.average')}</option>
                    <option value="poor">{t('fims.poor')}</option>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('fims.locationInformation')}</h2>
                <p className="text-gray-600">{t('fims.provideLocationDetails')}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fims.locationName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inspectionData.location_name}
                      onChange={(e) => setInspectionData(prev => ({ ...prev, location_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('fims.enterLocationName')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fims.plannedDate')}
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
                    {t('fims.fullAddress')}
                  </label>
                  <textarea
                    value={inspectionData.address}
                    onChange={(e) => setInspectionData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('fims.enterCompleteAddress')}
                  />
                </div>

                {/* GPS Location Capture */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">{t('fims.gpsLocationCapture')}</h4>
                    <button
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {isGettingLocation ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      <span>{isGettingLocation ? t('fims.gettingLocation', 'Getting Location...') : t('fims.getCurrentLocation')}</span>
                    </button>
                  </div>

                  {inspectionData.latitude && inspectionData.longitude ? (
                    <div className="space-y-4">
                      {/* Place Name Display */}
                      {inspectionData.place_name && (
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-700 mb-1">{t('fims.detectedLocation', 'Detected Location')}</div>
                          <div className="text-lg font-bold text-blue-900">{inspectionData.place_name}</div>
                        </div>
                      )}
                      
                      {/* GPS Coordinates */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">{t('fims.latitude')}</div>
                        <div className="text-lg font-bold text-blue-900">{inspectionData.latitude.toFixed(6)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">{t('fims.longitude')}</div>
                        <div className="text-lg font-bold text-blue-900">{inspectionData.longitude.toFixed(6)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-700 mb-1">{t('fims.accuracy')}</div>
                        <div className="text-lg font-bold text-blue-900">{Math.round(inspectionData.location_accuracy || 0)}m</div>
                      </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MapPin className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-700">{t('fims.clickToGetLocation')}</p>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('fims.inspectionDetails')}</h2>
                <p className="text-gray-600">{t('fims.completeDetailedChecklist')}</p>
              </div>

              <div className="space-y-8">
                {/* Section A: Infrastructure and Basic Facilities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                    {t('fims.sectionA', 'अ) पायाभूत सुविधा (Infrastructure and Basic Facilities)')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'room_availability', label: t('fims.roomAvailability'), icon: Home },
                      { key: 'toilet_facility', label: t('fims.toiletFacility'), icon: Home },
                      { key: 'drinking_water', label: t('fims.drinkingWater'), icon: Activity },
                      { key: 'electricity', label: t('fims.electricity'), icon: Activity },
                      { key: 'kitchen_garden', label: t('fims.kitchenGarden'), icon: Activity }
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

                {/* Section B: Equipment and Materials */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Scale className="h-5 w-5 text-green-600 mr-2" />
                    {t('fims.sectionB', 'ब) उपकरणे आणि साहित्य (Equipment and Materials)')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'weighing_machine', label: t('fims.weighingMachine'), icon: Scale },
                      { key: 'height_measuring_scale', label: t('fims.heightMeasuringScale'), icon: Scale },
                      { key: 'first_aid_kit', label: t('fims.firstAidKit'), icon: Heart },
                      { key: 'teaching_materials', label: t('fims.teachingMaterials'), icon: FileText },
                      { key: 'toys_available', label: t('fims.toysAvailable'), icon: Users }
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

                {/* Section C: Records and Documentation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClipboardList className="h-5 w-5 text-purple-600 mr-2" />
                    {t('fims.sectionC', 'क) नोंदी आणि दस्तऐवजीकरण (Records and Documentation)')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'attendance_register', label: t('fims.attendanceRegister'), icon: ClipboardList },
                      { key: 'growth_chart_updated', label: t('fims.growthChartUpdated'), icon: TrendingUp },
                      { key: 'vaccination_records', label: t('fims.vaccinationRecords'), icon: Shield },
                      { key: 'nutrition_records', label: t('fims.nutritionRecords'), icon: Utensils }
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
                          {t(item.labelKey)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Children Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Baby className="h-5 w-5 text-green-600 mr-2" />
                    {t('fims.sectionD', 'ड) मुलांची माहिती (Children Information)')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.totalRegistered')}</label>
                      <input
                        type="number"
                        value={anganwadiForm.total_registered_children || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, total_registered_children: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.presentToday')}</label>
                      <input
                        type="number"
                        value={anganwadiForm.children_present_today || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, children_present_today: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.age0to3Years')}</label>
                      <input
                        type="number"
                        value={anganwadiForm.children_0_3_years || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, children_0_3_years: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.age3to6Years')}</label>
                      <input
                        type="number"
                        value={anganwadiForm.children_3_6_years || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, children_3_6_years: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Section E: Nutrition & Health Services */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Utensils className="h-5 w-5 text-orange-600 mr-2" />
                    {t('fims.sectionE', 'इ) पोषण आणि आरोग्य सेवा (Nutrition & Health Services)')}
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
                        <label className="text-sm font-medium text-gray-700">{t('fims.hotMealServed')}</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.mealQuality')}</label>
                        <select
                          value={anganwadiForm.meal_quality || ''}
                          onChange={(e) => setAnganwadiForm(prev => ({ ...prev, meal_quality: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">{t('fims.selectQuality')}</option>
                          <option value="excellent">{t('fims.excellent')}</option>
                          <option value="good">{t('fims.good')}</option>
                          <option value="average">{t('fims.average')}</option>
                          <option value="poor">{t('fims.poor')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: 'take_home_ration', label: t('fims.takeHomeRation'), icon: Utensils },
                        { key: 'health_checkup_conducted', label: t('fims.healthCheckupConducted'), icon: Stethoscope },
                        { key: 'immunization_updated', label: t('fims.immunizationUpdated'), icon: Shield },
                        { key: 'vitamin_a_given', label: t('fims.vitaminAGiven'), icon: Pill },
                        { key: 'iron_tablets_given', label: t('fims.ironTabletsGiven'), icon: Pill }
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
                           <label 
                             className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                             onClick={(e) => {
                               e.preventDefault();
                               const checkbox = e.currentTarget.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement;
                               if (checkbox) {
                                 checkbox.checked = !checkbox.checked;
                                 setAnganwadiForm(prev => ({ 
                                   ...prev, 
                                   [item.key]: checkbox.checked 
                                 }));
                               }
                             }}
                           >
                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                            onClick={(e) => {
                              e.preventDefault();
                              const checkbox = e.currentTarget.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement;
                              if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                setAnganwadiForm(prev => ({ 
                                  ...prev, 
                                  [item.key]: checkbox.checked 
                                }));
                              }
                            }}
                          >
                            {t(item.labelKey)}
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
                    {t('fims.sectionF', 'फ) निरीक्षणे आणि शिफारसी (Observations & Recommendations)')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.generalObservations')}</label>
                      <textarea
                        value={anganwadiForm.general_observations || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, general_observations: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('fims.enterGeneralObservations')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.recommendations')}</label>
                      <textarea
                        value={anganwadiForm.recommendations || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, recommendations: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('fims.enterRecommendations')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('fims.actionRequired')}</label>
                      <textarea
                        value={anganwadiForm.action_required || ''}
                        onChange={(e) => setAnganwadiForm(prev => ({ ...prev, action_required: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('fims.enterActionRequired')}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('fims.photoDocumentation')}</h2>
                <p className="text-gray-600">{t('fims.uploadPhotosToDocument')}</p>
              </div>

              <div className="space-y-6">
                {/* Photo Upload Area */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">{t('fims.uploadInspectionPhotos')}</label>
                    <span className="text-sm text-gray-500">
                      {photos.length}/5 {t('fims.photosUploaded', 'photos uploaded')}
                    </span>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors duration-200 bg-gray-50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                      className="hidden"
                      id="photo-upload"
                      disabled={photos.length >= 5}
                    />
                    <label htmlFor="photo-upload" className={`cursor-pointer ${photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-900 mb-2">{t('fims.uploadPhotos')}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {photos.length >= 5 
                          ? t('fims.maxPhotosReached', 'Maximum 5 photos reached')
                          : t('fims.clickToSelectPhotos')
                        }
                      </p>
                      {photos.length < 5 && (
                        <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                        <Upload className="h-4 w-4 mr-2" />
                        {t('fims.chooseFiles')}
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Photo Preview Grid */}
                {photos.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                      {t('fims.uploadedPhotos')} ({photos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          {photo.file ? (
                            <img
                              src={URL.createObjectURL(photo.file)}
                              alt={photo.photo_name || `Photo ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg mb-3"
                            />
                          ) : (
                            <img
                              src={photo.photo_url}
                              alt={photo.photo_name || `Photo ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg mb-3"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIwMCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2MEw5NSA3MEw4NSA4MEw3NSA3MEw4NSA2MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTUgMTBNMjEgMTJDMjEgMTYuOTcwNiAxNi45NzA2IDIxIDEyIDIxQzcuMDI5NDQgMjEgMyAxNi45NzA2IDMgMTJDMyA3LjAyOTQ0IDcuMDI5NDQgMyAxMiAzQzE2Ljk3MDYgMyAyMSA3LjAyOTQ0IDIxIDEyWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+';
                              }}
                            />
                          )}
                          <input
                            type="text"
                            value={photo.description || ''}
                            onChange={(e) => updatePhotoDescription(index, e.target.value)}
                            placeholder={t('fims.addPhotoDescription')}
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
                    <p className="text-lg font-medium text-gray-700">{t('fims.uploadingPhotos')}</p>
                    <p className="text-sm text-gray-500">{t('fims.pleaseWaitProcessing')}</p>
                  </div>
                )}

                {/* Final Actions */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4">{t('fims.readyToSubmit')}</h4>
                  <p className="text-purple-700 mb-6">
                    {t('fims.reviewInspectionDetails')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleSaveInspection('draft')}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      <span>{t('fims.saveAsDraft')}</span>
                    </button>
                    <button
                      onClick={() => handleSaveInspection('submitted')}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                      <span>{t('fims.submitInspection')}</span>
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
                <span>{t('common.previous')}</span>
              </button>

              {currentStep < 4 && (
                <button
                  onClick={handleNextStep}
                  disabled={!validateCurrentStep()}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{t('common.next')}</span>
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