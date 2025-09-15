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
  department: string; // from department table
  designation_id: string;
  designation: string; // from designations table
  tal_id: string;
  office_id: string;
  name: string; // from office_locations table
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'addEmployee'>('dashboard');
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
        Cadre: '',
        date_of_joining: ''
      }
    };
  };

  const initialModalState = getInitialModalState();
  const [showAddModal, setShowAddModal] = useState(initialModalState.showAddModal);
  const [showEditModal, setShowEditModal] = useState(initialModalState.showEditModal);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(initialModalState.editingEmployee);
  
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [clerks, setClerks] = useState<ClerkData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // Function to calculate retirement date based on date of birth and Cadre
  const calculateRetirementDate = (dateOfBirth: string, Cadre: string) => {
    if (!dateOfBirth) return null;
    if (!Cadre) return null;
    
    const birthDate = new Date(dateOfBirth);
    
    // Determine retirement age based on cadre
    let retirementAge = 60; // default
    if (Cadre.toLowerCase() === 'c') {
      retirementAge = 58;
    } else if (Cadre.toLowerCase() === 'd') {
      retirementAge = 60;
    }
    
    // Add retirement age to birth year
    const retirementDate = new Date(birthDate);
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge);
    
    // Set to last day of that month
    retirementDate.setMonth(retirementDate.getMonth() + 1, 0);
    
     // Format date to YYYY-MM-DD
    const year = retirementDate.getFullYear();
    const month = (retirementDate.getMonth() + 1).toString().padStart(2, '0');
    const day = retirementDate.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    emp_id: '',
    employee_name: '',
    date_of_birth: '',
    age: '',
    retirement_date: '',
    reason: '',
    assigned_clerk: '',
    department: '',
    designation: '',
    taluka: '',
    office: '',
    panchayatrajsevarth_id: '',
    ddo_code: '',
    cadre: '',
    date_of_joining: ''
  });

  // Calculate age when date of birth changes
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age: age.toString() }));
      
      // Calculate retirement date based on cadre
      const retirementDate = calculateRetirementDate(formData.date_of_birth, formData.cadre);
    }
  }
  )
}