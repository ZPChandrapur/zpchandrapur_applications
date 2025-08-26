import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// ... your icon imports
import { ermsClient, supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';

export const EmployeeDashboard = ({ onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClerk, setSelectedClerk] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedCadre, setSelectedCadre] = useState('');

  // Modal state: always default to closed on dashboard load
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [offices, setOffices] = useState([]);
  const [clerks, setClerks] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Form state
  const getInitialFormData = () => ({
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
  });
  const [formData, setFormData] = useState(getInitialFormData());

  // Persistence: only form data (not modal open state)
  const FORM_DATA_KEY = 'employee-dashboard-form-data';

  // Function to calculate retirement date based on date of birth and Cadre
  const calculateRetirementDate = (dateOfBirth, Cadre) => {
    if (!dateOfBirth || !Cadre) return '';
    const birthDate = new Date(dateOfBirth);
    const retirementAge = Cadre.toLowerCase().includes('c') ? 58 :
                         Cadre.toLowerCase().includes('d') ? 60 : 60;
    const retirementYear = birthDate.getFullYear() + retirementAge;
    const retirementMonth = birthDate.getMonth();
    const retirementDate = new Date(retirementYear, retirementMonth + 1, 0);
    return retirementDate.toISOString().split('T')[0];
  };

  // On first load, fetch all data and try restoring form data only
  useEffect(() => {
    fetchAllData();
    // Restore only form data (not modal visibility!) if present
    const saved = localStorage.getItem(FORM_DATA_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Restore only if less than 24 hours old, and only values (no modal visibility)
        const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent && state.data) setFormData(state.data);
      } catch (error) {
        console.warn('Failed to load saved form data:', error);
      }
    }
  }, []);

  // Save form data to persistence when changed (if a modal is open)
  useEffect(() => {
    if (showAddModal || showEditModal) {
      try {
        const formState = { data: formData, timestamp: Date.now() };
        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formState));
      } catch (err) {
        console.warn('Failed to save form data:', err);
      }
    }
  }, [formData, showAddModal, showEditModal]);

  // Data fetchers: same as original
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
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
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
      setDepartments([]);
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
      setDesignations([]);
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
      setTalukas([]);
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
      setOffices([]);
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
      setClerks([]);
    }
  };

  // Employee Filtering (same logic)
  useEffect(() => {
    let filtered = employees;
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        (emp.emp_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [employees, searchTerm, selectedDepartment, selectedClerk, selectedReason, selectedCadre]);

  // KPI helpers
  const assignedCount = employees.filter(emp => emp.assigned_clerk).length;
  const unassignedCount = employees.length - assignedCount;
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
  const upcomingRetirements = calculateUpcomingRetirements();

  // Modal & CRUD handlers
  const clearPersistedFormData = () => {
    localStorage.removeItem(FORM_DATA_KEY);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData(getInitialFormData());
    setShowAddModal(true);
  };

  const handleEditEmployee = (employee) => {
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
        tal_id: formData.tal_id,
        office_id: formData.office_id,
        ddo_code: String(formData.ddo_code || '').trim() || null,
        "Cadre": String(formData.Cadre || '').trim() || null
      };
      if (editingEmployee) {
        const { error } = await ermsClient
          .from('employee')
          .update(employeeData)
          .eq('emp_id', editingEmployee.emp_id);
        if (error) throw error;
        alert(t('common.success') + ': Employee updated successfully');
      } else {
        const { error } = await ermsClient
          .from('employee')
          .insert(employeeData);
        if (error) throw error;
        alert(t('common.success') + ': Employee added successfully');
      }
      await fetchEmployees();
      clearPersistedFormData();
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData(getInitialFormData());
      setEditingEmployee(null);
    } catch (error) {
      let errorMessage = t('common.error');
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Employee ID already exists. Please use a different ID.';
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Please select valid department, designation, taluka, and office.';
      } else {
        errorMessage += ': ' + error.message;
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const confirmMessage = `${t('common.deleteConfirm')}\n\nEmployee: ${employee.employee_name}\nID: ${employee.emp_id}`;
    if (!confirm(confirmMessage)) return;
    setIsLoading(true);
    try {
      const { error } = await ermsClient
        .from('employee')
        .delete()
        .eq('emp_id', employee.emp_id);
      if (error) throw error;
      alert(t('common.success') + ': Employee deleted successfully');
      await fetchEmployees();
      clearPersistedFormData();
    } catch (error) {
      let errorMessage = t('common.error');
      if (error.message.includes('foreign key')) {
        errorMessage = 'Cannot delete employee. This employee has related records in the system.';
      } else {
        errorMessage += ': ' + error.message;
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedClerk('');
    setSelectedReason('');
  };

  // ... keep your full JSX from your UI code,
  // just replace the modal visibility (showAddModal, showEditModal) logic as above

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header, KPI Cards, Filters, Table etc. */}
      {/* ... your unmodified JSX ... */}

      {/* Add Employee Modal */}
      {showAddModal && (
        // ... your modal JSX (with formData, isLoading etc.)
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        // ... your modal JSX (with formData, isLoading etc.)
      )}
    </div>
  );
};
