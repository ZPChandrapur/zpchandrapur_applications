import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2,
  Users,
  MapPin,
  ClipboardList,
  UserCheck,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { ermsClient } from '../lib/supabase';

interface OrganizationSetupProps {
  onBack: () => void;
}

interface Department {
  id: string;
  department: string;
  created_at?: string;
  updated_at?: string;
}

interface Taluka {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  address?: string;
  taluka_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Designation {
  id: string;
  designation: string;
  created_at?: string;
  updated_at?: string;
}

export const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('departments');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [clerks, setClerks] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    taluka_id: ''
  });

  const tabs = [
    {
      id: 'departments',
      name: t('erms.departments'),
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      id: 'designations',
      name: t('erms.designations'),
      icon: ClipboardList,
      color: 'bg-green-500'
    },
    {
      id: 'talukas',
      name: t('erms.talukas'),
      icon: MapPin,
      color: 'bg-orange-500'
    },
    {
      id: 'offices',
      name: t('erms.offices'),
      icon: Building2,
      color: 'bg-teal-500'
    }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDepartments(),
        fetchTalukas(),
        fetchOfficeLocations(),
        fetchDesignations()
      ]);
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      console.log('📋 Fetching designations...');
      const { data, error } = await ermsClient
        .from('designation')
        .select('*')
        .order('designation');
      
      if (error) throw error;
      console.log('✅ Designations fetched:', data?.length || 0);
      setDesignations(data || []);
    } catch (error) {
      console.error('❌ Error fetching designations:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log('🏢 Fetching departments...');
      const { data, error } = await ermsClient
        .from('department')
        .select('*')
        .order('department');
      
      if (error) throw error;
      console.log('✅ Departments fetched:', data?.length || 0);
      setDepartments(data || []);
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
    }
  };

  const fetchTalukas = async () => {
    try {
      console.log('🗺️ Fetching talukas...');
      const { data, error } = await ermsClient
        .from('talukas')
        .select('*')
        .order('name');
      
      if (error) throw error;
      console.log('✅ Talukas fetched:', data?.length || 0);
      setTalukas(data || []);
    } catch (error) {
      console.error('❌ Error fetching talukas:', error);
    }
  };

  const fetchOfficeLocations = async () => {
    try {
      console.log('🏢 Fetching office locations...');
      const { data, error } = await ermsClient
        .from('office_locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      console.log('✅ Office locations fetched:', data?.length || 0);
      setOfficeLocations(data || []);
    } catch (error) {
      console.error('❌ Error fetching office locations:', error);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    
    // Generate next ID based on existing data
    let nextId = '';
    if (activeTab === 'departments') {
      const maxId = Math.max(...departments.map(d => parseInt(d.id) || 0), 0);
      nextId = (maxId + 1).toString();
    } else if (activeTab === 'talukas') {
      const maxId = Math.max(...talukas.map(t => parseInt(t.id) || 0), 0);
      nextId = (maxId + 1).toString();
    } else if (activeTab === 'offices') {
      const maxId = Math.max(...officeLocations.map(o => parseInt(o.id) || 0), 0);
      nextId = (maxId + 1).toString();
    } else if (activeTab === 'designations') {
      const maxId = Math.max(...designations.map(d => parseInt(d.id) || 0), 0);
      nextId = (maxId + 1).toString();
    }
    
    setFormData({ id: nextId, name: '', address: '', taluka_id: '' });
    setShowAddModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'departments') {
      setFormData({ id: item.id, name: item.department, address: '', taluka_id: '' });
    } else if (activeTab === 'designations') {
      setFormData({ id: item.id, name: item.designation, address: '', taluka_id: '' });
    } else if (activeTab === 'talukas') {
      setFormData({ id: item.id, name: item.name, address: '', taluka_id: '' });
    } else if (activeTab === 'offices') {
      setFormData({ id: item.id, name: item.name, address: item.address || '', taluka_id: item.taluka_id || '' });
    }
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(t('common.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'departments') {
        if (editingItem) {
          const { error } = await ermsClient
            .from('department')
            .update({ department: formData.name })
            .eq('id', formData.id);
          if (error) throw error;
        } else {
          const { error } = await ermsClient
            .from('department')
            .insert({ id: formData.id, department: formData.name });
          if (error) throw error;
        }
        await fetchDepartments();
      } else if (activeTab === 'designations') {
        if (editingItem) {
          const { error } = await ermsClient
            .from('designation')
            .update({ designation: formData.name })
            .eq('id', formData.id);
          if (error) throw error;
        } else {
          const { error } = await ermsClient
            .from('designation')
            .insert({ id: formData.id, designation: formData.name });
          if (error) throw error;
        }
        await fetchDesignations();
      } else if (activeTab === 'talukas') {
        if (editingItem) {
          const { error } = await ermsClient
            .from('talukas')
            .update({ name: formData.name })
            .eq('id', formData.id);
          if (error) throw error;
        } else {
          const { error } = await ermsClient
            .from('talukas')
            .insert({ id: formData.id, name: formData.name });
          if (error) throw error;
        }
        await fetchTalukas();
      } else if (activeTab === 'offices') {
        if (editingItem) {
          const { error } = await ermsClient
            .from('office_locations')
            .update({ 
              name: formData.name,
              address: formData.address,
              taluka_id: formData.taluka_id || null
            })
            .eq('id', formData.id);
          if (error) throw error;
        } else {
          const { error } = await ermsClient
            .from('office_locations')
            .insert({ 
              id: formData.id,
              name: formData.name,
              address: formData.address,
              taluka_id: formData.taluka_id || null
            });
          if (error) throw error;
        }
        await fetchOfficeLocations();
      }
      
      setShowAddModal(false);
      setFormData({ id: '', name: '', address: '', taluka_id: '' });
    } catch (error) {
      console.error('Error saving:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(t('common.deleteConfirm'))) return;

    setIsLoading(true);
    try {
      if (activeTab === 'departments') {
        const { error } = await ermsClient
          .from('department')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        await fetchDepartments();
      } else if (activeTab === 'designations') {
        const { error } = await ermsClient
          .from('designation')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        await fetchDesignations();
      } else if (activeTab === 'talukas') {
        const { error } = await ermsClient
          .from('talukas')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        await fetchTalukas();
      } else if (activeTab === 'offices') {
        const { error } = await ermsClient
          .from('office_locations')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        await fetchOfficeLocations();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    let data: any[] = [];
    if (activeTab === 'departments') data = departments;
    else if (activeTab === 'designations') data = designations;
    else if (activeTab === 'talukas') data = talukas;
    else if (activeTab === 'offices') data = officeLocations;

    return data.filter(item => {
      const searchFields = activeTab === 'departments' 
        ? [item.id, item.department]
        : activeTab === 'designations'
        ? [item.id, item.designation]
        : activeTab === 'talukas'
        ? [item.id, item.name]
        : [item.id, item.name, item.address];
      
      return searchFields.some(field => 
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const kpiData = [
    {
      title: t('erms.totalDepartments'),
      value: departments.length.toString(),
      subtitle: t('erms.activeDepartments'),
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
      iconBg: 'bg-blue-500'
    },
    {
      title: t('erms.totalDesignations'),
      value: designations.length.toString(),
      subtitle: t('erms.jobPositions'),
      icon: ClipboardList,
      color: 'bg-green-100 text-green-600',
      iconBg: 'bg-green-500'
    },
    {
      title: t('erms.totalTalukas'),
      value: talukas.length.toString(),
      subtitle: t('erms.administrativeUnits'),
      icon: MapPin,
      color: 'bg-orange-100 text-orange-600',
      iconBg: 'bg-orange-500'
    },
    {
      title: t('erms.totalOfficeLocations'),
      value: officeLocations.length.toString(),
      subtitle: t('erms.workLocations'),
      icon: Building2,
      color: 'bg-teal-100 text-teal-600',
      iconBg: 'bg-teal-500'
    }
  ];

  const renderTabContent = () => {
    if (activeTab === 'designations') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('erms.designations')}
            </h3>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">
                Add Designation
              </span>
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">
              Designation management interface will be implemented here.
            </p>
          </div>
        </div>
      );
    }

    const filteredData = getFilteredData();
    const tabConfig = {
      departments: { 
        title: t('erms.departmentManagement'), 
        addText: t('erms.addDepartment'),
        color: 'bg-blue-600 hover:bg-blue-700',
        columns: ['ID', 'Name', 'Created Date', 'Actions']
      },
      talukas: { 
        title: t('erms.talukas'), 
        addText: 'Add Taluka',
        color: 'bg-orange-600 hover:bg-orange-700',
        columns: ['ID', 'Name', 'Created Date', 'Actions']
      },
      offices: { 
        title: t('erms.officeLocations'), 
        addText: 'Add Office',
        color: 'bg-teal-600 hover:bg-teal-700',
        columns: ['ID', 'Name', 'Address', 'Taluka', 'Actions']
      }
    };

    const config = tabConfig[activeTab as keyof typeof tabConfig];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{config.title}</h3>
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchAllData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button 
              onClick={handleAdd}
              className={`flex items-center space-x-2 px-4 py-2 ${config.color} text-white rounded-lg transition-all duration-200`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">{config.addText}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              {t('erms.showingRecords', { filtered: filteredData.length, total: getFilteredData().length })}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? t('erms.noDepartmentsFound') : t('erms.addFirstDepartment')}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activeTab === 'departments' ? item.department : item.name}
                      </td>
                      {activeTab === 'offices' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.address || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {talukas.find(t => t.id === item.taluka_id)?.name || '-'}
                          </td>
                        </>
                      )}
                      {activeTab !== 'offices' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('erms.organizationSetup')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('erms.organizationSetupDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                </div>
                <div className={`${kpi.iconBg} p-3 rounded-lg`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? t('common.edit') : t('common.add')} {
                  activeTab === 'departments' ? t('erms.department') :
                  activeTab === 'designations' ? t('erms.designation') :
                  activeTab === 'talukas' ? t('erms.taluka') :
                  activeTab === 'offices' ? t('erms.office') : ''
                }
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'departments' ? t('erms.departmentId') : 
                   activeTab === 'designations' ? t('erms.designationId') :
                   activeTab === 'talukas' ? t('erms.talukaId') : 
                   activeTab === 'offices' ? t('erms.officeId') : t('common.id')}
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enter') + ' ' + (
                    activeTab === 'departments' ? t('erms.departmentId') : 
                    activeTab === 'designations' ? t('erms.designationId') :
                    activeTab === 'talukas' ? t('erms.talukaId') : 
                    activeTab === 'offices' ? t('erms.officeId') : t('common.id')
                  )}
                  disabled={!!editingItem}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'departments' ? t('erms.departmentName') : 
                   activeTab === 'designations' ? t('erms.designationName') :
                   activeTab === 'talukas' ? t('erms.talukaName') : 
                   activeTab === 'offices' ? t('erms.officeName') : t('common.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.enter') + ' ' + (
                    activeTab === 'departments' ? t('erms.departmentName') : 
                    activeTab === 'designations' ? t('erms.designationName') :
                    activeTab === 'talukas' ? t('erms.talukaName') : 
                    activeTab === 'offices' ? t('erms.officeName') : t('common.name')
                  )}
                />
              </div>

              {activeTab === 'offices' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.address')}</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('common.enter') + ' ' + t('common.address')}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('erms.taluka')}</label>
                    <select
                      value={formData.taluka_id}
                      onChange={(e) => setFormData({ ...formData, taluka_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('common.select') + ' ' + t('erms.taluka')}</option>
                      {talukas.map(taluka => (
                        <option key={taluka.id} value={taluka.id}>
                          {taluka.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : (editingItem ? t('common.update') : t('common.add'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};