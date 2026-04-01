import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface CustomReportsProps {
  user: SupabaseUser;
  onBack: () => void;
}

export const CustomReports: React.FC<CustomReportsProps> = ({ user, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-100 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-900">
                  कर्मचारी अहवाल
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  आपल्या डेटावरून अहवाल आणि विश्लेषण तयार करा
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-12">
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                नवीन अहवाल डिझाइन केले जाईल
              </h3>
              <p className="text-gray-500">
                या विभागासाठी नवीन टॅब आणि अहवाल नंतर तयार केले जातील
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
