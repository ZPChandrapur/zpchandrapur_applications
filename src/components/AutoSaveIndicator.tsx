import React from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isDirty: boolean;
  isAutoSaving: boolean;
  lastSaved: number;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isDirty,
  isAutoSaving,
  lastSaved,
  className = ''
}) => {
  const { t } = useTranslation();

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return t('common.justNow', 'Just now');
    if (seconds < 3600) return t('common.minutesAgo', '{{minutes}} minutes ago', { minutes: Math.floor(seconds / 60) });
    return t('common.hoursAgo', '{{hours}} hours ago', { hours: Math.floor(seconds / 3600) });
  };

  const getStatusInfo = () => {
    if (isAutoSaving) {
      return {
        icon: Save,
        text: t('common.autoSaving', 'Auto-saving...'),
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    }
    
    if (isDirty) {
      return {
        icon: Clock,
        text: t('common.unsavedChanges', 'Unsaved changes'),
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    }
    
    return {
      icon: CheckCircle,
      text: t('common.savedAt', 'Saved {{time}}', { time: getTimeAgo(lastSaved) }),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  };

  const { icon: Icon, text, color, bgColor } = getStatusInfo();

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${bgColor} ${className}`}>
      <Icon className={`h-4 w-4 ${color} ${isAutoSaving ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${color}`}>{text}</span>
    </div>
  );
};