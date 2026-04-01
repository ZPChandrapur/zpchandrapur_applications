import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Building2,
  Users,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ermsClient } from '../lib/supabase';

interface CustomReportsProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface OfficeSummary {
  office_name: string;
  total_clerks: number;
  total_employees: number;
  pay_commission_pending: number;
  pay_commission_completed: number;
  group_insurance_pending: number;
  group_insurance_completed: number;
  status_pending: number;
  status_processing: number;
  status_completed: number;
}

interface ClerkDetail {
  clerk_name: string;
  clerk_id: string;
  total_employees: number;
  pay_commission_pending: number;
  pay_commission_completed: number;
  group_insurance_pending: number;
  group_insurance_completed: number;
  status_pending: number;
  status_processing: number;
  status_completed: number;
}

interface EmployeeDetail {
  emp_id: number;
  employee_name: string;
  shalarth_sevarthid: string;
  department: string;
  designation: string;
  retirement_date: string;
  pay_commission_status: string;
  group_insurance_status: string;
  status: string;
}

type DrillDownLevel = 'office' | 'clerk' | 'employee';

export const CustomReports: React.FC<CustomReportsProps> = ({ user, onBack }) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [drillDownLevel, setDrillDownLevel] = useState<DrillDownLevel>('office');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedClerk, setSelectedClerk] = useState<string>('');

  const [officeSummaries, setOfficeSummaries] = useState<OfficeSummary[]>([]);
  const [clerkDetails, setClerkDetails] = useState<ClerkDetail[]>([]);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetail[]>([]);

  useEffect(() => {
    fetchOfficeSummaries();
  }, []);

  const fetchOfficeSummaries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement_consolidated_view')
        .select('*');

      if (error) throw error;

      const officeMap = new Map<string, any>();

      data?.forEach((row: any) => {
        const officeName = row.current_office_name || 'कार्यालय नियुक्त नाही';

        if (!officeMap.has(officeName)) {
          officeMap.set(officeName, {
            office_name: officeName,
            clerks: new Set(),
            total_employees: 0,
            pay_commission_pending: 0,
            pay_commission_completed: 0,
            group_insurance_pending: 0,
            group_insurance_completed: 0,
            status_pending: 0,
            status_processing: 0,
            status_completed: 0
          });
        }

        const office = officeMap.get(officeName);

        if (row.assigned_clerk) {
          office.clerks.add(row.assigned_clerk);
        }

        office.total_employees++;

        if (row.pay_commission_status === 'pending') office.pay_commission_pending++;
        if (row.pay_commission_status === 'completed') office.pay_commission_completed++;

        if (row.group_insurance_status === 'pending') office.group_insurance_pending++;
        if (row.group_insurance_status === 'completed') office.group_insurance_completed++;

        if (row.status === 'pending') office.status_pending++;
        if (row.status === 'processing') office.status_processing++;
        if (row.status === 'completed') office.status_completed++;
      });

      const summaries: OfficeSummary[] = Array.from(officeMap.values()).map(office => ({
        ...office,
        total_clerks: office.clerks.size
      }));

      summaries.sort((a, b) => b.total_employees - a.total_employees);
      setOfficeSummaries(summaries);
    } catch (error) {
      console.error('Error fetching office summaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClerkDetails = async (officeName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement_consolidated_view')
        .select('*')
        .eq('current_office_name', officeName);

      if (error) throw error;

      const clerkMap = new Map<string, any>();

      data?.forEach((row: any) => {
        const clerkId = row.assigned_clerk || 'unassigned';
        const clerkName = row.assigned_clerk_name || 'नियुक्त नाही';

        if (!clerkMap.has(clerkId)) {
          clerkMap.set(clerkId, {
            clerk_id: clerkId,
            clerk_name: clerkName,
            total_employees: 0,
            pay_commission_pending: 0,
            pay_commission_completed: 0,
            group_insurance_pending: 0,
            group_insurance_completed: 0,
            status_pending: 0,
            status_processing: 0,
            status_completed: 0
          });
        }

        const clerk = clerkMap.get(clerkId);
        clerk.total_employees++;

        if (row.pay_commission_status === 'pending') clerk.pay_commission_pending++;
        if (row.pay_commission_status === 'completed') clerk.pay_commission_completed++;

        if (row.group_insurance_status === 'pending') clerk.group_insurance_pending++;
        if (row.group_insurance_status === 'completed') clerk.group_insurance_completed++;

        if (row.status === 'pending') clerk.status_pending++;
        if (row.status === 'processing') clerk.status_processing++;
        if (row.status === 'completed') clerk.status_completed++;
      });

      const details: ClerkDetail[] = Array.from(clerkMap.values());
      details.sort((a, b) => b.total_employees - a.total_employees);
      setClerkDetails(details);
      setDrillDownLevel('clerk');
      setSelectedOffice(officeName);
    } catch (error) {
      console.error('Error fetching clerk details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeDetails = async (officeName: string, clerkId: string) => {
    setIsLoading(true);
    try {
      let query = ermsClient
        .from('employee_retirement_consolidated_view')
        .select('*')
        .eq('current_office_name', officeName);

      if (clerkId !== 'unassigned') {
        query = query.eq('assigned_clerk', clerkId);
      } else {
        query = query.is('assigned_clerk', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const employees: EmployeeDetail[] = data?.map((row: any) => ({
        emp_id: row.emp_id,
        employee_name: row.employee_name,
        shalarth_sevarthid: row.shalarth_sevarthid,
        department: row.department || '-',
        designation: row.designation || '-',
        retirement_date: row.retirement_date,
        pay_commission_status: row.pay_commission_status || 'pending',
        group_insurance_status: row.group_insurance_status || 'pending',
        status: row.status || 'pending'
      })) || [];

      employees.sort((a, b) => new Date(a.retirement_date).getTime() - new Date(b.retirement_date).getTime());
      setEmployeeDetails(employees);
      setDrillDownLevel('employee');
      setSelectedClerk(clerkId);
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (drillDownLevel === 'employee') {
      setDrillDownLevel('clerk');
      setSelectedClerk('');
    } else if (drillDownLevel === 'clerk') {
      setDrillDownLevel('office');
      setSelectedOffice('');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        <span>{status}</span>
      </span>
    );
  };

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
                  कार्यालयनिहाय, लिपिकनिहाय आणि कर्मचारी तपशील
                </p>
              </div>
            </div>
            <button
              onClick={fetchOfficeSummaries}
              className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">रिफ्रेश करा</span>
            </button>
          </div>

          {drillDownLevel !== 'office' && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
              <button
                onClick={handleBackNavigation}
                className="flex items-center space-x-1 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>मागे जा</span>
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium">{selectedOffice}</span>
              {drillDownLevel === 'employee' && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium">
                    {clerkDetails.find(c => c.clerk_id === selectedClerk)?.clerk_name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-teal-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">डेटा लोड होत आहे...</p>
            </div>
          </div>
        ) : (
          <>
            {drillDownLevel === 'office' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    <span>कार्यालयनिहाय सारांश</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {officeSummaries.map((office, index) => (
                      <div
                        key={index}
                        onClick={() => fetchClerkDetails(office.office_name)}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-teal-300 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-6 w-6 text-teal-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{office.office_name}</h3>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-900">{office.total_clerks}</div>
                            <div className="text-xs text-blue-600 mt-1">एकूण लिपिक</div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-900">{office.total_employees}</div>
                            <div className="text-xs text-purple-600 mt-1">एकूण कर्मचारी</div>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="flex items-baseline space-x-2">
                              <div className="text-2xl font-bold text-orange-900">{office.pay_commission_pending}</div>
                              <div className="text-sm text-orange-600">/ {office.pay_commission_completed}</div>
                            </div>
                            <div className="text-xs text-orange-600 mt-1">वेतन आयोग (प्रलंबित/पूर्ण)</div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-baseline space-x-2">
                              <div className="text-2xl font-bold text-green-900">{office.group_insurance_pending}</div>
                              <div className="text-sm text-green-600">/ {office.group_insurance_completed}</div>
                            </div>
                            <div className="text-xs text-green-600 mt-1">गट विमा (प्रलंबित/पूर्ण)</div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">स्थिती:</span>
                              <span className="font-medium text-yellow-600">{office.status_pending} प्रलंबित</span>
                              <span className="text-gray-400">|</span>
                              <span className="font-medium text-blue-600">{office.status_processing} प्रक्रियेत</span>
                              <span className="text-gray-400">|</span>
                              <span className="font-medium text-green-600">{office.status_completed} पूर्ण</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {drillDownLevel === 'clerk' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-teal-600" />
                    <span>लिपिकनिहाय तपशील - {selectedOffice}</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {clerkDetails.map((clerk, index) => (
                      <div
                        key={index}
                        onClick={() => fetchEmployeeDetails(selectedOffice, clerk.clerk_id)}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-teal-300 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Users className="h-6 w-6 text-teal-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{clerk.clerk_name}</h3>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-900">{clerk.total_employees}</div>
                            <div className="text-xs text-purple-600 mt-1">एकूण कर्मचारी</div>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="flex items-baseline space-x-2">
                              <div className="text-2xl font-bold text-orange-900">{clerk.pay_commission_pending}</div>
                              <div className="text-sm text-orange-600">/ {clerk.pay_commission_completed}</div>
                            </div>
                            <div className="text-xs text-orange-600 mt-1">वेतन आयोग</div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-baseline space-x-2">
                              <div className="text-2xl font-bold text-green-900">{clerk.group_insurance_pending}</div>
                              <div className="text-sm text-green-600">/ {clerk.group_insurance_completed}</div>
                            </div>
                            <div className="text-xs text-green-600 mt-1">गट विमा</div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>प्रलंबित: <span className="font-semibold text-yellow-600">{clerk.status_pending}</span></div>
                              <div>प्रक्रियेत: <span className="font-semibold text-blue-600">{clerk.status_processing}</span></div>
                              <div>पूर्ण: <span className="font-semibold text-green-600">{clerk.status_completed}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {drillDownLevel === 'employee' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span>कर्मचारी तपशील</span>
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-teal-50">
                      <tr>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">कर्मचारी क्र.</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">नाव</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">शालार्थ/सेवार्थ आयडी</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">विभाग</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">पदनाम</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">सेवानिवृत्ती तारीख</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">वेतन आयोग</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">गट विमा</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeDetails.map((employee, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{employee.emp_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{employee.employee_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{employee.shalarth_sevarthid || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{employee.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{employee.designation}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(employee.retirement_date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(employee.pay_commission_status)}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(employee.group_insurance_status)}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(employee.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">एकूण कर्मचारी:</span> {employeeDetails.length}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
