import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  MapPin,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Save,
  Navigation,
  Clock,
  User,
  Building2,
  FileText,
  Phone,
  Users,
  Home,
  Utensils,
  Heart,
  GraduationCap,
  Scale,
  RotateCcw
  Activity,
  Shield,
  Stethoscope,
  Pill,
  MessageSquare,
  Target,
  Search,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface FIMSNewInspectionProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface Category {
  id: string;
  name: string;
  name_marathi: string;
  description: string | null;
  form_type: string;
  is_active: boolean;
}

interface Inspection {
  id: string;
  inspection_number: string;
  category_id: string;
  inspector_id: string;
  assigned_by: string | null;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  address: string | null;
  planned_date: string | null;
  inspection_date: string | null;
  status: string;
  form_data: any;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_compliant: boolean | null;
  non_compliance_reason: string | null;
  requires_revisit: boolean;
  created_at: string;
  updated_at: string;
}

interface AnganwadiForm {
  anganwadi_name: string;
  anganwadi_number: string;
  supervisor_name: string;
  helper_name: string;
  village_name: string;
  building_condition: string;
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
  total_registered_children: number;
  children_present_today: number;
  children_0_3_years: number;
  children_3_6_years: number;
  hot_meal_served: boolean | null;
  meal_quality: string;
  take_home_ration: boolean | null;
  health_checkup_conducted: boolean | null;
  immunization_updated: boolean | null;
  vitamin_a_given: boolean | null;
  iron_tablets_given: boolean | null;
  general_observations: string;
  recommendations: string;
  action_required: string;
}

interface InspectionPhoto {
  id: string;
  photo_url: string;
  photo_name: string | null;
  description: string | null;
  photo_order: number;
  uploaded_at: string;
}

export const FIMSNewInspection: React.FC<FIMSNewInspectionProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    placeName?: string;
  } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<InspectionPhoto[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Anganwadi form state
  const [anganwadiForm, setAnganwadiForm] = useState<AnganwadiForm>({
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

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedCategory('');
    setLocationName('');
    setAddress('');
    setPlannedDate('');
    setCurrentLocation(null);
    setPhotos([]);
    setUploadedPhotos([]);
    setIsEditMode(false);
    setEditingInspection(null);
    setIsViewMode(false);
    setAnganwadiForm({
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
  };

  const getCurrentLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Get place name using reverse geocoding
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&language=en&pretty=1`
        );
        
        let placeName = '';
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            placeName = data.results[0].formatted;
          }
        }
        
        // Fallback: create a simple place name from coordinates
        if (!placeName) {
          placeName = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }

        setCurrentLocation({
          latitude,
          longitude,
          accuracy,
          placeName
        });

        // Update address field with place name
        setAddress(placeName);
      } catch (geocodeError) {
        console.error('Error getting place name:', geocodeError);
        // Still set location even if geocoding fails
        setCurrentLocation({
          latitude,
          longitude,
          accuracy,
          placeName: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
        setAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get current location. Please check your location permissions.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedPhoto = async (photoId: string) => {
    try {
      // Delete from storage
      const photo = uploadedPhotos.find(p => p.id === photoId);
      if (photo) {
        const fileName = photo.photo_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('field-visit-images')
            .remove([fileName]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('fims_inspection_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Error removing photo: ' + error.message);
    }
  };

  const uploadPhotosToSupabase = async (inspectionId: string): Promise<InspectionPhoto[]> => {
    const uploadedPhotoData: InspectionPhoto[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.name.split('.').pop();
      const fileName = `${inspectionId}_${Date.now()}_${i}.${fileExt}`;

      try {
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('field-visit-images')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('field-visit-images')
          .getPublicUrl(fileName);

        // Save to database
        const { data: photoData, error: photoError } = await supabase
          .from('fims_inspection_photos')
          .insert({
            inspection_id: inspectionId,
            photo_url: urlData.publicUrl,
            photo_name: photo.name,
            description: `Photo ${i + 1}`,
            photo_order: i + 1
          })
          .select()
          .single();

        if (photoError) throw photoError;

        uploadedPhotoData.push(photoData);
      } catch (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
        // Continue with other photos even if one fails
      }
    }

    return uploadedPhotoData;
  };

  const handleCreateInspectionWithForm = async () => {
    if (!selectedCategory || !locationName) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      let inspectionData;
      let inspectionId;

      if (isEditMode && editingInspection) {
        // Update existing inspection
        const { data, error } = await supabase
          .from('fims_inspections')
          .update({
            category_id: selectedCategory,
            location_name: locationName,
            latitude: currentLocation?.latitude,
            longitude: currentLocation?.longitude,
            location_accuracy: currentLocation?.accuracy,
            address: address,
            planned_date: plannedDate || null,
            inspection_date: new Date().toISOString(),
            status: 'submitted',
            form_data: anganwadiForm
          })
          .eq('id', editingInspection.id)
          .select()
          .single();

        if (error) throw error;
        inspectionData = data;
        inspectionId = editingInspection.id;

        // Delete old photos if any new photos are being uploaded
        if (photos.length > 0) {
          // Delete old photos from storage and database
          for (const photo of uploadedPhotos) {
            await removeUploadedPhoto(photo.id);
          }
        }

        // Update anganwadi form
        const { error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .upsert({
            inspection_id: inspectionId,
            ...anganwadiForm
          });

        if (formError) throw formError;
      } else {
        // Create new inspection
        const inspectionNumber = `INS-${Date.now()}`;
        
        const { data, error } = await supabase
          .from('fims_inspections')
          .insert({
            inspection_number: inspectionNumber,
            category_id: selectedCategory,
            inspector_id: user.id,
            location_name: locationName,
            latitude: currentLocation?.latitude,
            longitude: currentLocation?.longitude,
            location_accuracy: currentLocation?.accuracy,
            address: address,
            planned_date: plannedDate || null,
            inspection_date: new Date().toISOString(),
            status: 'submitted',
            form_data: anganwadiForm
          })
          .select()
          .single();

        if (error) throw error;
        inspectionData = data;
        inspectionId = data.id;

        // Create anganwadi form
        const { error: formError } = await supabase
          .from('fims_anganwadi_forms')
          .insert({
            inspection_id: inspectionId,
            ...anganwadiForm
          });

        if (formError) throw formError;
      }

      // Upload photos if any
      if (photos.length > 0) {
        const uploadedPhotoData = await uploadPhotosToSupabase(inspectionId);
        setUploadedPhotos(prev => [...prev, ...uploadedPhotoData]);
      }

      alert(isEditMode ? 'Inspection updated successfully!' : 'Inspection created successfully!');
      onBack();
    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Error saving inspection: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInspectionForEdit = (inspection: Inspection) => {
    setIsEditMode(true);
    setEditingInspection(inspection);
    setSelectedCategory(inspection.category_id);
    setLocationName(inspection.location_name);
    setAddress(inspection.address || '');
    setPlannedDate(inspection.planned_date ? inspection.planned_date.split('T')[0] : '');
    
    if (inspection.latitude && inspection.longitude) {
      setCurrentLocation({
        latitude: inspection.latitude,
        longitude: inspection.longitude,
        accuracy: inspection.location_accuracy || 0,
        placeName: inspection.address || ''
      });
    }

    // Load anganwadi form data
    if (inspection.form_data) {
      setAnganwadiForm(inspection.form_data);
    }

    // Load existing photos
    loadInspectionPhotos(inspection.id);
  };

  const loadInspectionForView = (inspection: Inspection) => {
    setIsViewMode(true);
    loadInspectionForEdit(inspection);
  };

  const loadInspectionPhotos = async (inspectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('fims_inspection_photos')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('photo_order');

      if (error) throw error;
      setUploadedPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const renderBasicDetails = () => {
    const selectedCat = categories.find(c => c.id === selectedCategory);
    const isAnganwadi = selectedCat?.form_type === 'anganwadi';

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('fims.inspectionCategory')}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">{t('fims.selectCategory')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name_marathi} ({category.name})
              </option>
            ))}
          </select>
        </div>

        {isAnganwadi && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  अंगणवाडी नाव (Anganwadi Name)
                </label>
                <input
                  type="text"
                  value={anganwadiForm.anganwadi_name}
                  onChange={(e) => setAnganwadiForm({ ...anganwadiForm, anganwadi_name: e.target.value })}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="अंगणवाडी नाव टाका"
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
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="अंगणवाडी क्रमांक टाका"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पर्यवेक्षक नाव (Supervisor Name)
                </label>
                <input
                  type="text"
                  value={anganwadiForm.supervisor_name}
                  onChange={(e) => setAnganwadiForm({ ...anganwadiForm, supervisor_name: e.target.value })}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="पर्यवेक्षक नाव टाका"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  सहायक नाव (Helper Name)
                </label>
                <input
                  type="text"
                  value={anganwadiForm.helper_name}
                  onChange={(e) => setAnganwadiForm({ ...anganwadiForm, helper_name: e.target.value })}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="सहायक नाव टाका"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  गाव नाव (Village Name)
                </label>
                <input
                  type="text"
                  value={anganwadiForm.village_name}
                  onChange={(e) => setAnganwadiForm({ ...anganwadiForm, village_name: e.target.value })}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="गाव नाव टाका"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('fims.locationName')}
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            placeholder={t('fims.enterLocationName')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('fims.address')}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isViewMode}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            placeholder={t('fims.enterFullAddress')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('fims.plannedDate')}
          </label>
          <input
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>
    );
  };

  const renderLocationCapture = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('fims.locationInformation')}</h3>
        
        {!isViewMode && (
          <button
            onClick={getCurrentLocation}
            disabled={isCapturingLocation}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 mx-auto disabled:opacity-50"
          >
            {isCapturingLocation ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Navigation className="h-5 w-5" />
            )}
            <span>{isCapturingLocation ? 'Getting Location...' : t('fims.getCurrentLocation')}</span>
          </button>
        )}
      </div>

      {currentLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">{t('fims.locationCaptured')}</span>
          </div>
          
          {currentLocation.placeName && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700">Place:</p>
              <p className="text-sm text-gray-600">{currentLocation.placeName}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">{t('fims.latitude')}:</p>
              <p className="text-gray-600">{currentLocation.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t('fims.longitude')}:</p>
              <p className="text-gray-600">{currentLocation.longitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t('fims.accuracy')}:</p>
              <p className="text-gray-600">{currentLocation.accuracy.toFixed(1)}m</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnganwadiForm = () => {
    const selectedCat = categories.find(c => c.id === selectedCategory);
    if (selectedCat?.form_type !== 'anganwadi') {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('fims.documentInspection')}</h3>
          <p className="text-gray-500">{t('fims.comingSoon')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Infrastructure Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            पायाभूत सुविधा (Infrastructure)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                इमारतीची स्थिती (Building Condition)
              </label>
              <select
                value={anganwadiForm.building_condition}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, building_condition: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">स्थिती निवडा</option>
                <option value="excellent">उत्कृष्ट (Excellent)</option>
                <option value="good">चांगली (Good)</option>
                <option value="average">सरासरी (Average)</option>
                <option value="poor">खराब (Poor)</option>
              </select>
            </div>

            {[
              { key: 'room_availability', label: 'खोली उपलब्धता (Room Availability)', icon: Home },
              { key: 'toilet_facility', label: 'शौचालय सुविधा (Toilet Facility)', icon: Home },
              { key: 'drinking_water', label: 'पिण्याचे पाणी (Drinking Water)', icon: Home },
              { key: 'electricity', label: 'वीज (Electricity)', icon: Home },
              { key: 'kitchen_garden', label: 'स्वयंपाकघर बाग (Kitchen Garden)', icon: Home }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === true}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: true })}
                      disabled={isViewMode}
                      className="mr-1 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-green-600">होय</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === false}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: false })}
                      disabled={isViewMode}
                      className="mr-1 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-600">नाही</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Section */}
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <Scale className="h-5 w-5 mr-2" />
            उपकरणे (Equipment)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'weighing_machine', label: 'वजन मशीन (Weighing Machine)', icon: Scale },
              { key: 'height_measuring_scale', label: 'उंची मापण्याचे स्केल (Height Scale)', icon: Activity },
              { key: 'first_aid_kit', label: 'प्राथमिक उपचार किट (First Aid Kit)', icon: Shield },
              { key: 'teaching_materials', label: 'शिकवण्याचे साहित्य (Teaching Materials)', icon: GraduationCap },
              { key: 'toys_available', label: 'खेळणी उपलब्ध (Toys Available)', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === true}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: true })}
                      disabled={isViewMode}
                      className="mr-1 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-green-600">होय</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === false}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: false })}
                      disabled={isViewMode}
                      className="mr-1 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-600">नाही</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Records Section */}
        <div className="bg-orange-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            नोंदी (Records)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'attendance_register', label: 'उपस्थिती नोंदवही (Attendance Register)', icon: FileText },
              { key: 'growth_chart_updated', label: 'वाढ तक्ता अपडेट (Growth Chart Updated)', icon: TrendingUp },
              { key: 'vaccination_records', label: 'लसीकरण नोंदी (Vaccination Records)', icon: Shield },
              { key: 'nutrition_records', label: 'पोषण नोंदी (Nutrition Records)', icon: Utensils }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === true}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: true })}
                      disabled={isViewMode}
                      className="mr-1 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-green-600">होय</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === false}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: false })}
                      disabled={isViewMode}
                      className="mr-1 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-600">नाही</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Children Count Section */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            मुलांची संख्या (Children Count)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                एकूण नोंदणीकृत मुले (Total Registered)
              </label>
              <input
                type="number"
                value={anganwadiForm.total_registered_children}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, total_registered_children: parseInt(e.target.value) || 0 })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                आज उपस्थित मुले (Present Today)
              </label>
              <input
                type="number"
                value={anganwadiForm.children_present_today}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, children_present_today: parseInt(e.target.value) || 0 })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                0-3 वर्षे मुले (0-3 Years)
              </label>
              <input
                type="number"
                value={anganwadiForm.children_0_3_years}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, children_0_3_years: parseInt(e.target.value) || 0 })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3-6 वर्षे मुले (3-6 Years)
              </label>
              <input
                type="number"
                value={anganwadiForm.children_3_6_years}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, children_3_6_years: parseInt(e.target.value) || 0 })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Nutrition Section */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <Utensils className="h-5 w-5 mr-2" />
            पोषण (Nutrition)
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <Utensils className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">गरम जेवण दिले (Hot Meal Served)</span>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hot_meal_served"
                    checked={anganwadiForm.hot_meal_served === true}
                    onChange={() => setAnganwadiForm({ ...anganwadiForm, hot_meal_served: true })}
                    disabled={isViewMode}
                    className="mr-1 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-green-600">होय</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hot_meal_served"
                    checked={anganwadiForm.hot_meal_served === false}
                    onChange={() => setAnganwadiForm({ ...anganwadiForm, hot_meal_served: false })}
                    disabled={isViewMode}
                    className="mr-1 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-600">नाही</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                जेवणाची गुणवत्ता (Meal Quality)
              </label>
              <select
                value={anganwadiForm.meal_quality}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, meal_quality: e.target.value })}
                disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">गुणवत्ता निवडा</option>
                <option value="excellent">उत्कृष्ट (Excellent)</option>
                <option value="good">चांगली (Good)</option>
                <option value="average">सरासरी (Average)</option>
                <option value="poor">खराब (Poor)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <Utensils className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">घरी नेण्याचे धान्य (Take Home Ration)</span>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="take_home_ration"
                    checked={anganwadiForm.take_home_ration === true}
                    onChange={() => setAnganwadiForm({ ...anganwadiForm, take_home_ration: true })}
                    disabled={isViewMode}
                    className="mr-1 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-green-600">होय</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="take_home_ration"
                    checked={anganwadiForm.take_home_ration === false}
                    onChange={() => setAnganwadiForm({ ...anganwadiForm, take_home_ration: false })}
                    disabled={isViewMode}
                    className="mr-1 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-600">नाही</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Health Section */}
        <div className="bg-red-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            आरोग्य (Health)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'health_checkup_conducted', label: 'आरोग्य तपासणी केली (Health Checkup)', icon: Stethoscope },
              { key: 'immunization_updated', label: 'लसीकरण अपडेट (Immunization Updated)', icon: Shield },
              { key: 'vitamin_a_given', label: 'व्हिटामिन A दिले (Vitamin A Given)', icon: Pill },
              { key: 'iron_tablets_given', label: 'लोह गोळ्या दिल्या (Iron Tablets Given)', icon: Pill }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === true}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: true })}
                      disabled={isViewMode}
                      className="mr-1 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-green-600">होय</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={anganwadiForm[key as keyof AnganwadiForm] === false}
                      onChange={() => setAnganwadiForm({ ...anganwadiForm, [key]: false })}
                      disabled={isViewMode}
                      className="mr-1 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-600">नाही</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            टिप्पण्या (Comments)
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                सामान्य निरीक्षणे (General Observations)
              </label>
              <textarea
                value={anganwadiForm.general_observations}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, general_observations: e.target.value })}
                disabled={isViewMode}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="सामान्य निरीक्षणे टाका..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                शिफारसी (Recommendations)
              </label>
              <textarea
                value={anganwadiForm.recommendations}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, recommendations: e.target.value })}
                disabled={isViewMode}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="शिफारसी टाका..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                आवश्यक कृती (Action Required)
              </label>
              <textarea
                value={anganwadiForm.action_required}
                onChange={(e) => setAnganwadiForm({ ...anganwadiForm, action_required: e.target.value })}
                disabled={isViewMode}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="आवश्यक कृती टाका..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPhotoUpload = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">फोटो अपलोड (Photo Upload)</h3>
        
        {!isViewMode && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-400 transition-colors duration-200">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">फोटो निवडा</p>
              <p className="text-sm text-gray-500">Click to select photos or drag and drop</p>
            </label>
          </div>
        )}
      </div>

      {/* Uploaded Photos (from database) */}
      {uploadedPhotos.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">अपलोड केलेले फोटो (Uploaded Photos)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={photo.photo_name || `Photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => {
                    setSelectedPhotoIndex(index);
                    setShowPhotoModal(true);
                  }}
                />
                {!isViewMode && (
                  <button
                    onClick={() => removeUploadedPhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {photo.photo_name || `Photo ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos (not yet uploaded) */}
      {photos.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">नवीन फोटो (New Photos)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`New photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {photo.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const steps = [
    { id: 1, name: 'मूलभूत तपशील', nameEn: 'Basic Details', icon: FileText },
    { id: 2, name: 'स्थान', nameEn: 'Location', icon: MapPin },
    { id: 3, name: 'तपासणी फॉर्म', nameEn: 'Inspection Form', icon: ClipboardList },
    { id: 4, name: 'फोटो', nameEn: 'Photos', icon: Camera }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicDetails();
      case 2:
        return renderLocationCapture();
      case 3:
        return renderAnganwadiForm();
      case 4:
        return renderPhotoUpload();
      default:
        return renderBasicDetails();
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory && locationName;
      case 2:
        return currentLocation !== null;
      case 3:
        return true; // Form can be partially filled
      case 4:
        return true; // Photos are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {isViewMode ? 'तपासणी पहा' : isEditMode ? 'तपासणी संपादित करा' : t('fims.newInspection')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isViewMode ? 'View inspection details' : isEditMode ? 'Edit inspection details' : 'Create a new field inspection'}
                </p>
              </div>
            </div>
            
            {!isViewMode && (
              <button
                onClick={resetForm}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm">Reset Form</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  currentStep >= step.id
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-400">{step.nameEn}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-purple-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.previous')}</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('common.next')}</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            ) : (
              !isViewMode && (
                <button
                  onClick={handleCreateInspectionWithForm}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isLoading ? t('fims.creating') : (isEditMode ? 'Update Inspection' : t('fims.createInspection'))}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && uploadedPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Photo {selectedPhotoIndex + 1} of {uploadedPhotos.length}
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              <img
                src={uploadedPhotos[selectedPhotoIndex]?.photo_url}
                alt={uploadedPhotos[selectedPhotoIndex]?.photo_name || 'Inspection photo'}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {uploadedPhotos[selectedPhotoIndex]?.description}
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
                  onClick={() => setSelectedPhotoIndex(Math.min(uploadedPhotos.length - 1, selectedPhotoIndex + 1))}
                  disabled={selectedPhotoIndex === uploadedPhotos.length - 1}
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