import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileText,
  Send,
  RotateCcw,
  CheckCircle,
  Clock,
  User as UserIcon,
  Calendar,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface FileTrackingProps {
  isOpen: boolean;
  onClose: () => void;
  retirementId: string;
  employeeName: string;
  currentUser: User;
  userRole: string | null;
}

interface FileTracking {
  id: string;
  retirement_id: string;
  assigned_to_user_id: string;
  assigned_by_user_id: string;
  assigned_at: string;
  current_level: string;
  status: string;
  comments: string | null;
  days_held: number;
  assigned_to_name?: string;
  assigned_by_name?: string;
}

interface FileHistory {
  id: string;
  retirement_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  from_level: string | null;
  to_level: string | null;
  action: string;
  comments: string | null;
  created_at: string;
  from_user_name?: string;
  to_user_name?: string;
}

interface UserOption {
  user_id: string;
  name: string;
  role_name: string;
}

export const FileTracking: React.FC<FileTrackingProps> = ({
  isOpen,
  onClose,
  retirementId,
  employeeName,
  currentUser,
  userRole
}) => {
  const { t } = useTranslation();
  const [currentTracking, setCurrentTracking] = useState<FileTracking | null>(null);
  const [fileHistory, setFileHistory] = useState<FileHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMode, setActionMode] = useState<'view' | 'forward' | 'revert'>('view');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [comments, setComments] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);

  const isAssignedToCurrentUser = currentTracking?.assigned_to_user_id === currentUser.id;

  useEffect(() => {
    if (isOpen) {
      loadFileTracking();
      loadFileHistory();
    }
  }, [isOpen, retirementId]);

  const loadFileTracking = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('retirement_file_tracking')
        .select('*')
        .eq('retirement_id', retirementId)
        .eq('status', 'assigned')
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const { data: assignedToUser } = await supabase
          .from('user_roles')
          .select('name')
          .eq('user_id', data.assigned_to_user_id)
          .maybeSingle();

        const { data: assignedByUser } = await supabase
          .from('user_roles')
          .select('name')
          .eq('user_id', data.assigned_by_user_id)
          .maybeSingle();

        setCurrentTracking({
          ...data,
          assigned_to_name: assignedToUser?.name || 'Unknown',
          assigned_by_name: assignedByUser?.name || 'Unknown'
        });
      } else {
        setCurrentTracking(null);
      }
    } catch (err) {
      console.error('Error loading file tracking:', err);
      setError('Failed to load file tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileHistory = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('retirement_file_history')
        .select('*')
        .eq('retirement_id', retirementId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const historyWithNames = await Promise.all(
        (data || []).map(async (item) => {
          let fromUserName = 'System';
          let toUserName = 'Unknown';

          if (item.from_user_id) {
            const { data: fromUser } = await supabase
              .from('user_roles')
              .select('name')
              .eq('user_id', item.from_user_id)
              .maybeSingle();
            fromUserName = fromUser?.name || 'Unknown';
          }

          if (item.to_user_id) {
            const { data: toUser } = await supabase
              .from('user_roles')
              .select('name')
              .eq('user_id', item.to_user_id)
              .maybeSingle();
            toUserName = toUser?.name || 'Unknown';
          }

          return {
            ...item,
            from_user_name: fromUserName,
            to_user_name: toUserName
          };
        })
      );

      setFileHistory(historyWithNames);
    } catch (err) {
      console.error('Error loading file history:', err);
    }
  };

  const loadAvailableUsers = async (targetLevel: string) => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', targetLevel)
        .maybeSingle();

      if (rolesError) throw rolesError;
      if (!rolesData) {
        setError(`Role '${targetLevel}' not found`);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('user_id, name')
        .eq('role_id', rolesData.id);

      if (fetchError) throw fetchError;

      const users = (data || []).map(item => ({
        user_id: item.user_id,
        name: item.name,
        role_name: targetLevel
      }));

      setAvailableUsers(users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load available users');
    }
  };

  const getNextLevel = (currentLevel: string): string => {
    const hierarchy = ['clerk', 'officer', 'admin', 'superadmin'];
    const currentIndex = hierarchy.indexOf(currentLevel);
    return currentIndex < hierarchy.length - 1 ? hierarchy[currentIndex + 1] : currentLevel;
  };

  const getPreviousLevel = (currentLevel: string): string => {
    const hierarchy = ['clerk', 'officer', 'admin', 'superadmin'];
    const currentIndex = hierarchy.indexOf(currentLevel);
    return currentIndex > 0 ? hierarchy[currentIndex - 1] : currentLevel;
  };

  const handleForward = () => {
    if (!currentTracking) return;
    const nextLevel = getNextLevel(currentTracking.current_level);
    setActionMode('forward');
    loadAvailableUsers(nextLevel);
  };

  const handleRevert = () => {
    if (!currentTracking) return;
    const prevLevel = getPreviousLevel(currentTracking.current_level);
    setActionMode('revert');
    loadAvailableUsers(prevLevel);
  };

  const handleSubmitAction = async () => {
    if (!selectedUser || !currentTracking) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const targetLevel = actionMode === 'forward'
        ? getNextLevel(currentTracking.current_level)
        : getPreviousLevel(currentTracking.current_level);

      await supabase
        .from('retirement_file_tracking')
        .update({ status: actionMode === 'forward' ? 'completed' : 'reverted' })
        .eq('id', currentTracking.id);

      const { error: insertTrackingError } = await supabase
        .from('retirement_file_tracking')
        .insert({
          retirement_id: retirementId,
          assigned_to_user_id: selectedUser,
          assigned_by_user_id: currentUser.id,
          current_level: targetLevel,
          status: 'assigned',
          comments: comments || null
        });

      if (insertTrackingError) throw insertTrackingError;

      const { error: insertHistoryError } = await supabase
        .from('retirement_file_history')
        .insert({
          retirement_id: retirementId,
          from_user_id: currentUser.id,
          to_user_id: selectedUser,
          from_level: currentTracking.current_level,
          to_level: targetLevel,
          action: actionMode === 'forward' ? 'forwarded' : 'reverted',
          comments: comments || null
        });

      if (insertHistoryError) throw insertHistoryError;

      setComments('');
      setSelectedUser('');
      setActionMode('view');
      await loadFileTracking();
      await loadFileHistory();
    } catch (err) {
      console.error('Error submitting action:', err);
      setError('Failed to process file action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTracking = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      loadAvailableUsers('clerk');
      setActionMode('forward');
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError('Failed to start file tracking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialAssignment = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { error: insertTrackingError } = await supabase
        .from('retirement_file_tracking')
        .insert({
          retirement_id: retirementId,
          assigned_to_user_id: selectedUser,
          assigned_by_user_id: currentUser.id,
          current_level: 'clerk',
          status: 'assigned',
          comments: comments || null
        });

      if (insertTrackingError) throw insertTrackingError;

      const { error: insertHistoryError } = await supabase
        .from('retirement_file_history')
        .insert({
          retirement_id: retirementId,
          from_user_id: currentUser.id,
          to_user_id: selectedUser,
          from_level: null,
          to_level: 'clerk',
          action: 'assigned',
          comments: comments || null
        });

      if (insertHistoryError) throw insertHistoryError;

      setComments('');
      setSelectedUser('');
      setActionMode('view');
      await loadFileTracking();
      await loadFileHistory();
    } catch (err) {
      console.error('Error assigning file:', err);
      setError('Failed to assign file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'clerk': return 'bg-blue-100 text-blue-800';
      case 'officer': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'superadmin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'forwarded': return <ArrowRight className="h-4 w-4" />;
      case 'reverted': return <ArrowLeft className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'assigned': return <Send className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">File Tracking</h3>
              <p className="text-sm text-gray-600">{employeeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !currentTracking && actionMode === 'view' ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Active File Tracking</h4>
              <p className="text-gray-600 mb-6">This file has not been assigned for tracking yet.</p>
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <button
                  onClick={handleStartTracking}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Start File Tracking
                </button>
              )}
            </div>
          ) : actionMode === 'view' && currentTracking ? (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <UserIcon className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Assigned To</p>
                      <p className="font-semibold text-gray-900">{currentTracking.assigned_to_name}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getLevelBadgeColor(currentTracking.current_level)}`}>
                        {currentTracking.current_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Assigned On</p>
                      <p className="font-semibold text-gray-900">{formatDate(currentTracking.assigned_at)}</p>
                      <p className="text-sm text-orange-600 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {currentTracking.days_held} days held
                      </p>
                    </div>
                  </div>
                  {currentTracking.comments && (
                    <div className="md:col-span-2 flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Comments</p>
                        <p className="text-gray-900">{currentTracking.comments}</p>
                      </div>
                    </div>
                  )}
                </div>

                {isAssignedToCurrentUser && (
                  <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleForward}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Forward to Next Level</span>
                    </button>
                    {currentTracking.current_level !== 'clerk' && (
                      <button
                        onClick={handleRevert}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Revert to Previous Level</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <History className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">File Movement History</h4>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {fileHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No history available</p>
                  ) : (
                    fileHistory.map((history) => (
                      <div key={history.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-1">
                              {getActionIcon(history.action)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">{history.from_user_name}</span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-gray-900">{history.to_user_name}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                {history.from_level && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(history.from_level)}`}>
                                    {history.from_level}
                                  </span>
                                )}
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                {history.to_level && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(history.to_level)}`}>
                                    {history.to_level}
                                  </span>
                                )}
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-600 capitalize">{history.action}</span>
                              </div>
                              {history.comments && (
                                <p className="text-sm text-gray-600 mt-2">{history.comments}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 ml-4">{formatDate(history.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentTracking ? (actionMode === 'forward' ? 'Forward File' : 'Revert File') : 'Assign File'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select {currentTracking ? (actionMode === 'forward' ? getNextLevel(currentTracking.current_level) : getPreviousLevel(currentTracking.current_level)) : 'Clerk'}
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a user</option>
                      {availableUsers.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.name} ({user.role_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any comments or instructions..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setActionMode('view');
                    setSelectedUser('');
                    setComments('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={currentTracking ? handleSubmitAction : handleInitialAssignment}
                  disabled={!selectedUser || isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : currentTracking ? (actionMode === 'forward' ? 'Forward File' : 'Revert File') : 'Assign File'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
