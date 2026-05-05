import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  AlertCircle,
  CheckCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserRole {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role_id: string;
  role_name: string;
  application?: string;
  created_at?: string;
  updated_at?: string;
}

interface Role {
  id: string;
  name: string;
  application?: string;
}

interface Application {
  id: string;
  name: string;
}

interface UserManagementProps {
  user: SupabaseUser;
  onClose?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ user, onClose }) => {
  const { userRole } = usePermissions(user);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [pagePerApp, setPagePerApp] = useState<Record<string, number>>({ 'all': 1 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAccess, setHasAccess] = useState(false);
  const [usersPerPage, setUsersPerPage] = useState(15);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    // Check if user has permission to access user management
    const allowedRoles = ['developer', 'super_admin', 'admin'];
    if (userRole && allowedRoles.includes(userRole.toLowerCase())) {
      setHasAccess(true);
      initializeData();
    } else if (userRole) {
      setHasAccess(false);
      setError('You do not have permission to access User Management. Only developers and super admins can access this feature.');
    }
  }, [userRole]);

  const initializeData = async () => {
    // Fetch roles first to build the app list, then fetch users
    await fetchRoles();
    await fetchUsers();
  };

  const fetchRoles = async () => {
    try {
      const { data, error: err } = await supabase
        .from('roles')
        .select('id, name, application')
        .neq('name', 'developer')
        .order('name', { ascending: true });

      if (err) throw err;
      setRoles(data || []);

      // Extract unique applications from roles
      const uniqueApps = Array.from(
        new Set(
          data
            ?.filter((role: any) => role.application)
            .map((role: any) => role.application) || []
        )
      );

      // Convert to Application objects and sort
      const appObjects = uniqueApps
        .sort()
        .map((app: string) => ({ id: app, name: app }));
      setApplications(appObjects);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to fetch roles');
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error: err } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          name,
          role_id,
          roles!inner(id, name, application),
          created_at,
          updated_at
        `)
        .not('roles.name', 'eq', 'developer')
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Fetch emails from auth.users
      const userEmails: Record<string, string> = {};
      try {
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authUsers) {
          authUsers.forEach((authUser) => {
            userEmails[authUser.id] = authUser.email || '';
          });
        }
      } catch (emailError) {
        console.error('Could not fetch emails:', emailError);
      }

      const formattedUsers = data?.map((user: any) => ({
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: userEmails[user.user_id] || '',
        role_id: user.role_id,
        role_name: user.roles?.name || '',
        application: user.roles?.application || '',
        created_at: user.created_at,
        updated_at: user.updated_at,
      })) || [];

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMsg = error?.message || error?.status || 'Failed to fetch users';
      setError(`Failed to fetch users: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.role_id) {
      setError('Role is required');
      return false;
    }

    if (!editingUser) {
      // Adding new user
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // ============================================================
      // STEP 1: Create user in Supabase Auth
      // ============================================================
      console.log('Step 1: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          throw new Error('This email is already registered. Please use a different email.');
        }
        throw new Error(`Auth creation failed: ${authError.message}`);
      }

      if (!authData.user?.id) {
        throw new Error('Auth user created but no user ID returned');
      }

      console.log('✓ Auth user created:', authData.user.id);

      // ============================================================
      // STEP 2: Add user to user_roles table with role
      // ============================================================
      console.log('Step 2: Adding user to user_roles table...');
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: authData.user.id,
            name: formData.name,
            role_id: formData.role_id,
          },
        ])
        .select();

      if (roleError) {
        console.error('Role insertion error:', roleError);
        throw new Error(`Failed to add user role: ${roleError.message}`);
      }

      if (!roleData || roleData.length === 0) {
        throw new Error('Role record not created');
      }

      console.log('✓ User role added:', roleData[0].id);

      // ============================================================
      // SUCCESS
      // ============================================================
      setSuccess(`User "${formData.name}" has been created successfully!`);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role_id: '' });
      refreshUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      setError(error.message || 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm() || !editingUser) return;

    try {
      setIsLoading(true);

      // Update user_roles table (email is stored in auth.users, not here)
      const { error: err } = await supabase
        .from('user_roles')
        .update({
          name: formData.name,
          role_id: formData.role_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (err) throw err;

      // Note: Email update in auth would require admin access
      // For now, we only update the user_roles table
      
      setSuccess(`User "${formData.name}" has been updated successfully!`);
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role_id: '' });
      refreshUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete: UserRole) => {
    if (!window.confirm(`Are you sure you want to delete user "${userToDelete.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);

      // Delete from user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userToDelete.id);

      if (roleError) throw roleError;

      // Note: Auth user deletion would require admin access
      // The user can manually delete the auth user from Supabase dashboard if needed
      
      setSuccess(`User "${userToDelete.name}" has been deleted successfully!`);
      refreshUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (userToEdit: UserRole) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: '', // Email cannot be edited here, it's managed in Authentication
      password: '',
      confirmPassword: '',
      role_id: userToEdit.role_id,
    });
    setShowEditModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword.trim()) {
      setError('Password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!resetPasswordUser) return;

    try {
      setIsLoading(true);

      // Update password using Supabase admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        resetPasswordUser.user_id,
        { password: newPassword }
      );

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(`Password for "${resetPasswordUser.name}" has been reset successfully!`);
      setShowResetPasswordModal(false);
      setResetPasswordUser(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResetPassword = (userToReset: UserRole) => {
    setResetPasswordUser(userToReset);
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    setShowResetPasswordModal(true);
  };

  const handleAppTabChange = (appId: string) => {
    setSelectedApp(appId);
    setSelectedRole('all');
    setSearchTerm('');
    // Restore the page for this app or default to 1
    const savedPage = pagePerApp[appId] || 1;
    setCurrentPage(savedPage);
  };

  const updatePageForApp = (page: number) => {
    setCurrentPage(page);
    setPagePerApp(prev => ({ ...prev, [selectedApp]: page }));
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowResetPasswordModal(false);
    setEditingUser(null);
    setResetPasswordUser(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', role_id: '' });
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
  };

  // Filter and paginate users
  const filteredUsers = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedApp === 'all' || u.application?.toLowerCase() === selectedApp.toLowerCase()) &&
      (selectedRole === 'all' || u.role_id === selectedRole)
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  if (!hasAccess) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock className="h-8 w-8 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Access Denied</h3>
            <p className="text-red-700">User Management is only available for Developers and Super Admins.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Application Tabs */}
      {applications && applications.length > 0 ? (
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleAppTabChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedApp === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Applications ({filteredUsers.length})
            </button>
            {applications.map((app) => {
              const count = users.filter((u) =>
                u.application?.toLowerCase() === app.id.toLowerCase()
              ).length;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppTabChange(app.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    selectedApp === app.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {app.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">No applications assigned to users yet. Application filter will appear once applications are added.</p>
        </div>
      )}

      {/* Search and Add Button */}
      <div className="flex gap-4 mb-6 flex-col sm:flex-row items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Items Per Page Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Users per page:</label>
          <select
            value={usersPerPage}
            onChange={(e) => {
              setUsersPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 justify-center whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      {isLoading && !users.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Application</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((userRecord, index) => (
                  <tr
                    key={userRecord.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 truncate">{userRecord.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate">{userRecord.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate">
                        {userRecord.role_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {userRecord.application ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {userRecord.application}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {userRecord.created_at ? new Date(userRecord.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleOpenEdit(userRecord)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenResetPassword(userRecord)}
                          className="p-1.5 text-orange-600 hover:bg-orange-100 rounded transition"
                          title="Reset password"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userRecord)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => updatePageForApp(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => updatePageForApp(page)}
                    className={`px-3 py-1 rounded-lg transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => updatePageForApp(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Add New User</h3>
              <button onClick={handleCloseModals} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Edit User</h3>
              <button onClick={handleCloseModals} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500">Email and password are managed in Authentication settings</p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
              <button onClick={handleCloseModals} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Resetting password for: <span className="font-semibold text-blue-600">{resetPasswordUser.name}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
