import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserPermission {
  application_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_admin: boolean;
  role_name: string;
}

export interface PermissionCheck {
  hasAccess: (app: string, permission?: 'read' | 'write' | 'delete' | 'admin') => boolean;
  permissions: UserPermission[];
  userRole: string | null;
  isLoading: boolean;
  error: string | null;
}

export const usePermissions = (user: User | null): PermissionCheck => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Call the database function to get user permissions
        const { data, error: permError } = await supabase
          .rpc('get_user_permissions', { user_uuid: user.id });

        if (permError) {
          throw permError;
        }

        setPermissions(data || []);
        
        // Set the primary role (assuming user has one primary role)
        if (data && data.length > 0) {
          setUserRole(data[0].role_name);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasAccess = (app: string, permission: 'read' | 'write' | 'delete' | 'admin' = 'read'): boolean => {
    const appPermission = permissions.find(p => p.application_name === app);
    if (!appPermission) return false;

    switch (permission) {
      case 'read':
        return appPermission.can_read;
      case 'write':
        return appPermission.can_write;
      case 'delete':
        return appPermission.can_delete;
      case 'admin':
        return appPermission.can_admin;
      default:
        return false;
    }
  };

  return {
    hasAccess,
    permissions,
    userRole,
    isLoading,
    error
  };
};