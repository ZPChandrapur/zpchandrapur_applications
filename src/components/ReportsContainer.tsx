import React, { useState } from 'react';
import { BarChart3, Layers } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CustomReports } from './CustomReports';
import GADReports from './GADReports';

interface ReportsContainerProps {
  user: SupabaseUser;
  onBack: () => void;
}

type ReportTab = 'custom' | 'gad';

const ReportsContainer: React.FC<ReportsContainerProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('gad');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'custom'
                  ? 'border-teal-600 text-teal-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>कर्मचारी अहवाल</span>
            </button>

            <button
              onClick={() => setActiveTab('gad')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'gad'
                  ? 'border-teal-600 text-teal-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Layers className="h-5 w-5" />
              <span>कर्मचारी अहवाल - GAD</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: activeTab === 'custom' ? 'block' : 'none' }}>
          <CustomReports user={user} onBack={onBack} />
        </div>
        <div style={{ display: activeTab === 'gad' ? 'block' : 'none' }}>
          <GADReports user={user} onBack={onBack} />
        </div>
      </div>
    </div>
  );
};

export default ReportsContainer;
