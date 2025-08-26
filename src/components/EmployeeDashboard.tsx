import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  Calendar,
  UserCheck,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Filter,
  Download
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';

interface EmployeeDashboardProps {
  onBack: () => void;
}

interface Employee {
  emp_id: string;
  employee_name: string;
  date_of_birth: string;
  retirement_date: string; // calculated field
  reason: string;
  assigned_clerk: string | null;
  dept_id: string;
  department_name: string; // from department table
  designation_id: string;
  designation_name: string; // from designations table
  tal_id: string;
  office_id: string;
  office_name: string; // from office_locations table
  date_of_assignment: string | null;
  panchayatrajsevarth_id: string | null;
  ddo_code: string | null;
  Cadre: string;
  date_of_joining: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Department {
  dept_id: string;
  department: string;
}

interface Designation {
  designation_id: string;
  designation: string;
}

interface Taluka {
  tal_id: string;
  name: string;
}

interface Office {
  office_id: string;
  name: string;
}

interface ClerkData {
  user_id: string;
  name: string;
  role_name: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedCadre, setSelectedCadre] = useState('');
  
  // Modal persistence state management
  const getInitialModalState = () => {
    try {
      const savedModalState = localStorage.getItem('erms-employee-modal-state');
      if (savedModalState) {
        const parsed = JSON.parse(savedModalState);
        return {
          showAddModal: parsed.showAddModal || false,
          showEditModal: parsed.showEditModal || false,
          editingEmployee: parsed.editingEmployee || null,
          formData: parsed.formData || {
            emp_id: '',
            employee_name: '',
            date_of_birth: '',
            retirement_date: '',
            reason: '',
            assigned_clerk: '',
            dept_id: '',
            designation_id: '',
            tal_id: '',
            office_id: '',
            panchayatrajsevarth_id: '',
            ddo_code: '',
            Cadre: '',
            date_of_joining: ''
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load modal state from localStorage:', error);
    }
    return {
      showAddModal: false,
      showEditModal: false,
      editingEmployee: null,
      formData: {
        emp_id: '',
        employee_name: '',
        date_of_birth: '',
        retirement_date: '',
        reason: '',
        assigned_clerk: '',
        dept_id: '',
        designation_id: '',
        tal_id: '',
        office_id: '',
        panchayatrajsevarth_id: '',
        ddo_code: '',
        cadre: '',
        date_of_joining: ''
      }
    };
  };

  const initialModalState = getInitialModalState();
  const [showAddModal, setShowAddModal] = useState(initialModalState.showAddModal);
  const [showEditModal, setShowEditModal] = useState(initialModalState.showEditModal);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(initialModalState.editingEmployee);
  const [modalKey, setModalKey] = useState(0); // Force modal re-render
  
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // Function to calculate retirement date based on date of birth and Cadre
  const calculateRetirementDate = (dateOfBirth: string, Cadre: string): string => {
    if (!dateOfBirth || !Cadre) return '';
    
    const birthDate = new Date(dateOfBirth);
    const retirementAge = Cadre.toLowerCase().includes('c') ? 58 : 
                         Cadre.toLowerCase().includes('d') ? 60 : 60; // Default to 60 for D Cadre or others
    
    // Calculate retirement date: birth year + retirement age
    const retirementYear = birthDate.getFullYear() + retirementAge;
    const retirementMonth = birthDate.getMonth(); // Same month as birth
    
    // Get the last day of the retirement month
    const retirementDate = new Date(retirementYear, retirementMonth + 1, 0);
    
    return retirementDate.toISOString().split('T')[0];
  };
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Employee>>(initialModalState.formData);

  // Save modal state to localStorage
  const saveModalState = (modalState: {
    showAddModal: boolean;
    showEditModal: boolean;
    editingEmployee: Employee | null;
    formData: Partial<Employee>;
  }) => {
    try {
      localStorage.setItem('erms-employee-modal-state', JSON.stringify(modalState));
      
      // Broadcast to other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'erms-employee-modal-state',
        newValue: JSON.stringify(modalState),
        storageArea: localStorage
      }));
    } catch (error) {
      console.warn('Failed to save modal state to localStorage:', error);
    }
  };

  // Clear modal state
  const clearModalState = () => {
    try {
      localStorage.removeItem('erms-employee-modal-state');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'erms-employee-modal-state',
        newValue: null,
        storageArea: localStorage
      }));
    } catch (error) {
      console.warn('Failed to clear modal state from localStorage:', error);
    }
  };

  // Storage keys for persistence
  const MODAL_STATE_KEY = 'employee-dashboard-modal-state';
  const FORM_DATA_KEY = 'employee-dashboard-form-data';

  const getInitialFormData = () => {
    return {
      emp_id: '',
      employee_name: '',
      date_of_birth: '',
      retirement_date: '',
      reason: '',
      assigned_clerk: '',
      dept_id: '',
      designation_id: '',
      tal_id: '',
      office_id: '',
      panchayatrajsevarth_id: '',
      ddo_code: '',
      Cadre: '',
      date_of_joining: ''
    };
  };

  useEffect(() => {
    fetchAllData();
    // Enable persistence after initial load
    setTimeout(() => {
      loadPersistedState();
      setPersistenceEnabled(true);
    }, 100);
    
    // Add event listeners for persistence
    const handleVisibilityChange = () => {
      if (!document.hidden && persistenceEnabled) {
        loadPersistedState();
      }
    };
    
    const handleBeforeUnload = () => {
      if (persistenceEnabled && (showAddModal || editingEmployee)) {
        saveCurrentState();
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'erms-employee-modal-state' && persistenceEnabled) {
        loadPersistedState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save current state to localStorage
  const saveCurrentState = () => {
    if (!persistenceEnabled) return;
    
    try {
      const state = {
        showAddModal,
        editingEmployee,
        formData,
        timestamp: Date.now()
      };
      localStorage.setItem('erms-employee-modal-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save modal state:', error);
    }
  };
  
  // Load persisted state from localStorage
  const loadPersistedState = () => {
    try {
      const saved = localStorage.getItem('erms-employee-modal-state');
      if (!saved) return;
      
      const state = JSON.parse(saved);
      const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000; // 24 hours
      
      if (isRecent && (state.showAddModal || state.editingEmployee)) {
        setShowAddModal(state.showAddModal);
        setEditingEmployee(state.editingEmployee);
        setFormData(state.formData || getInitialFormData());
      }
    } catch (error) {
      console.warn('Failed to load modal state:', error);
    }
  };
  
  // Clear persisted state
  const clearPersistedState = () => {
    try {
      localStorage.removeItem('erms-employee-modal-state');
    } catch (error) {
      console.warn('Failed to clear modal state:', error);
    }
  };
  
  // Auto-save state when modal or form data changes
  useEffect(() => {
    if (persistenceEnabled && (showAddModal || editingEmployee)) {
      saveCurrentState();
    }
  }, [showAddModal, editingEmployee, formData, persistenceEnabled]);
  
  // Auto-save form data on input changes
  useEffect(() => {
    if (persistenceEnabled && (showAddModal || editingEmployee)) {
      const timeoutId = setTimeout(() => {
        saveCurrentState();
      }, 500); // Debounce saves
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  // Save form data to localStorage
  const saveFormData = () => {
    if (persistenceEnabled && isInitialized) {
      try {
        const formState = {
          data: formData,
          timestamp: Date.now()
        };
        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formState));
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    }
  };

  // Auto-save form data when it changes
  useEffect(() => {
    if (persistenceEnabled && isInitialized) {
      saveFormData();
    }
  }, [formData, persistenceEnabled, isInitialized]);

  // Handle page visibility and beforeunload events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && persistenceEnabled) {
        saveFormData();
      }
    };

    const handleBeforeUnload = () => {
      if (persistenceEnabled) {
        saveFormData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [persistenceEnabled]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, selectedDepartment, selectedClerk, selectedReason, selectedCadre]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchDepartments(),
        fetchDesignations(),
        fetchTalukas(),
        fetchOffices(),
        fetchClerks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      console.log('🔍 Fetching employees from erms.employee table...');
      const { data, error } = await ermsClient
        .from('employee')
        .select(`
          emp_id,
          employee_name,
          date_of_birth,
          retirement_date,
          reason,
          assigned_clerk,
          dept_id,
          designation_id,
          tal_id,
          office_id,
          Cadre,
          ddo_code,
          panchayatrajsevarth_id,
          date_of_joining,
          created_at,
          updated_at
        `)
        .order('date_of_birth');
      
      if (error) {
        console.error('❌ Error fetching employees:', error);
        throw error;
      }
      
      console.log('✅ Raw employee data from database:', data);
      console.log('📊 Number of employees fetched:', data?.length || 0);
      
      setEmployees(data || []);
      console.log('📋 Employees state updated with:', data?.length || 0, 'records');
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Set empty array on error to prevent undefined state
      setEmployees([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await ermsClient
        .from('department')
        .select('dept_id, department')
        .order('department');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const { data, error } = await ermsClient
        .from('designations')
        .select('designation_id, designation')
        .order('designation');
      
      if (error) throw error;
      setDesignations(data || []);
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  const fetchTalukas = async () => {
    try {
      const { data, error } = await ermsClient
        .from('talukas')
        .select('tal_id, name')
        .order('name');
      
      if (error) throw error;
      setTalukas(data || []);
    } catch (error) {
      console.error('Error fetching talukas:', error);
    }
  };

  const fetchOffices = async () => {
    try {
      const { data, error } = await ermsClient
        .from('office_locations')
        .select('office_id, name')
        .order('name');
      
      if (error) throw error;
      setOffices(data || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
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

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.dept_id === selectedDepartment);
    }

    if (selectedClerk) {
      filtered = filtered.filter(emp => emp.assigned_clerk === selectedClerk);
    }

    if (selectedReason) {
      filtered = filtered.filter(emp => emp.reason === selectedReason);
    }

    setFilteredEmployees(filtered);
  };

  const calculateUpcomingRetirements = () => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    return employees.filter(emp => {
      if (!emp.retirement_date) return false;
      const retirementDate = new Date(emp.retirement_date);
      const today = new Date();
      return retirementDate >= today && retirementDate <= sixMonthsFromNow;
    }).length;
  };

  // Reset form data to initial empty state
  const resetFormData = () => {
    setFormData({
      emp_id: '',
      employee_name: '',
      date_of_birth: '',
      age: '',
      department: '',
      designation: '',
      taluka: '',
      office: '',
      retirement_reason: '',
      assigned_clerk: '',
      panchayatrajsevarth_id: '',
      ddo_code: '',
      cadre: '',
      post_name: '',
      appointing_department: '',
      working_office_name: '',
      date_of_joining: '',
      date_of_service_expiry: '',
      designation_id: ''
    });
  };

  // Handle opening add modal
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    resetFormData();
    setModalKey(prev => prev + 1); // Force fresh modal render
    setShowAddModal(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    resetFormData();
    setModalKey(prev => prev + 1); // Force fresh modal render
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      employee_name: employee.employee_name,
      date_of_birth: employee.date_of_birth,
      retirement_date: employee.retirement_date,
      reason: employee.reason,
      assigned_clerk: employee.assigned_clerk,
      dept_id: employee.dept_id,
      designation_id: employee.designation_id,
      tal_id: employee.tal_id,
      office_id: employee.office_id,
      panchayatrajsevarth_id: employee.panchayatrajsevarth_id,
      ddo_code: employee.ddo_code,
      Cadre: employee.Cadre,
      date_of_joining: employee.date_of_joining
    });
    setShowEditModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!formData.emp_id || !formData.employee_name || !formData.date_of_birth) {
      alert('Employee ID, name, and date of birth are required');
      return;
    }
    if (!String(formData.employee_name || '').trim()) {
      alert('Employee name is required');
      return;
    }

    setIsLoading(true);
    try {
      const employeeData = {
        emp_id: String(formData.emp_id || '').trim() || null,
        employee_name: String(formData.employee_name || '').trim(),
        designation_id: formData.designation_id,
        retirement_date: formData.retirement_date || null,
        reason: String(formData.reason || '').trim() || null,
        assigned_clerk: formData.assigned_clerk || null,
        dept_id: formData.dept_id || null,
        //designation: formData.designation_id,
        tal_id: formData.tal_id,
        office_id: formData.office_id,
        ddo_code: String(formData.ddo_code || '').trim() || null,
        "Cadre": String(formData.Cadre || '').trim() || null,
        //Cadre_id: formData.cadre_id
      };

      if (editingEmployee) {
        const { error } = await ermsClient
          .from('employee')
          .update(employeeData)
          .eq('emp_id', editingEmployee.emp_id);
        if (error) throw error;
        
        // Show success message for update
        alert(t('common.success') + ': Employee updated successfully');
      } else {
        const { error } = await ermsClient
          .from('employee')
          .insert(employeeData);
        if (error) throw error;
        
        // Show success message for creation
        alert(t('common.success') + ': Employee added successfully');
      }
      
      await fetchEmployees();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      
      // Show error message to user
      alert('Error saving employee: ' + (error.message || 'Unknown error occurred'));
    }
  }
}