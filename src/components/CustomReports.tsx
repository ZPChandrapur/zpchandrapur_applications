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
  XCircle,
  Download,
  Filter
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ermsClient } from '../lib/supabase';
import * as XLSX from 'xlsx';

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
  retirement_progress_pending: number;
  retirement_progress_in_progress: number;
  retirement_progress_completed: number;
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
  retirement_progress_pending: number;
  retirement_progress_in_progress: number;
  retirement_progress_completed: number;
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
  retirement_progress_status: string;
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

  const [officeFilter, setOfficeFilter] = useState<string>('');
  const [clerkFilter, setClerkFilter] = useState<string>('');

  const [allData, setAllData] = useState<any[]>([]);

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

      setAllData(data || []);

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
            status_completed: 0,
            retirement_progress_pending: 0,
            retirement_progress_in_progress: 0,
            retirement_progress_completed: 0
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

        if (row.retirement_progress_status === 'pending') office.retirement_progress_pending++;
        if (row.retirement_progress_status === 'in_progress') office.retirement_progress_in_progress++;
        if (row.retirement_progress_status === 'completed') office.retirement_progress_completed++;
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

  const fetchClerkDetails = (officeName: string) => {
    setIsLoading(true);
    try {
      const filteredData = allData.filter(row => row.current_office_name === officeName);

      const clerkMap = new Map<string, any>();

      filteredData.forEach((row: any) => {
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
            status_completed: 0,
            retirement_progress_pending: 0,
            retirement_progress_in_progress: 0,
            retirement_progress_completed: 0
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

        if (row.retirement_progress_status === 'pending') clerk.retirement_progress_pending++;
        if (row.retirement_progress_status === 'in_progress') clerk.retirement_progress_in_progress++;
        if (row.retirement_progress_status === 'completed') clerk.retirement_progress_completed++;
      });

      const details: ClerkDetail[] = Array.from(clerkMap.values());
      details.sort((a, b) => b.total_employees - a.total_employees);
      setClerkDetails(details);
      setDrillDownLevel('clerk');
      setSelectedOffice(officeName);
      setClerkFilter('');
    } catch (error) {
      console.error('Error fetching clerk details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeDetails = (officeName: string, clerkId: string) => {
    setIsLoading(true);
    try {
      let filteredData = allData.filter(row => row.current_office_name === officeName);

      if (clerkId !== 'unassigned') {
        filteredData = filteredData.filter(row => row.assigned_clerk === clerkId);
      } else {
        filteredData = filteredData.filter(row => !row.assigned_clerk);
      }

      const employees: EmployeeDetail[] = filteredData.map((row: any) => ({
        emp_id: row.emp_id,
        employee_name: row.employee_name,
        shalarth_sevarthid: row.shalarth_sevarthid,
        department: row.department || '-',
        designation: row.designation || '-',
        retirement_date: row.retirement_date,
        pay_commission_status: row.pay_commission_status || 'pending',
        group_insurance_status: row.group_insurance_status || 'pending',
        status: row.status || 'pending',
        retirement_progress_status: row.retirement_progress_status || 'pending'
      }));

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
      setOfficeFilter('');
    }
  };

  const handleOfficeFilterChange = (officeName: string) => {
    setOfficeFilter(officeName);
    if (officeName) {
      fetchClerkDetails(officeName);
    }
  };

  const handleClerkFilterChange = (clerkId: string) => {
    setClerkFilter(clerkId);
    if (clerkId) {
      fetchEmployeeDetails(selectedOffice, clerkId);
    }
  };

  const exportToExcel = () => {
    let worksheetData: any[] = [];
    let fileName = '';

    if (drillDownLevel === 'office') {
      fileName = 'कार्यालयनिहाय_अहवाल.xlsx';

      worksheetData = [
        ['कार्यालयनिहाय सारांश अहवाल'],
        [],
        [
          'कार्यालय नाव',
          'एकूण लिपिक',
          'एकूण कर्मचारी',
          'वेतन आयोग (प्रलंबित)',
          'वेतन आयोग (पूर्ण)',
          'गट विमा (प्रलंबित)',
          'गट विमा (पूर्ण)',
          'स्थिती (प्रलंबित)',
          'स्थिती (प्रक्रियेत)',
          'स्थिती (पूर्ण)',
          'सेवानिवृत्ती प्रगती (प्रलंबित)',
          'सेवानिवृत्ती प्रगती (प्रक्रियेत)',
          'सेवानिवृत्ती प्रगती (पूर्ण)'
        ]
      ];

      officeSummaries.forEach(office => {
        worksheetData.push([
          office.office_name,
          office.total_clerks,
          office.total_employees,
          office.pay_commission_pending,
          office.pay_commission_completed,
          office.group_insurance_pending,
          office.group_insurance_completed,
          office.status_pending,
          office.status_processing,
          office.status_completed,
          office.retirement_progress_pending,
          office.retirement_progress_in_progress,
          office.retirement_progress_completed
        ]);
      });
    } else if (drillDownLevel === 'clerk') {
      fileName = `लिपिकनिहाय_अहवाल_${selectedOffice}.xlsx`;

      worksheetData = [
        [`लिपिकनिहाय अहवाल - ${selectedOffice}`],
        [],
        [
          'लिपिक नाव',
          'एकूण कर्मचारी',
          'वेतन आयोग (प्रलंबित)',
          'वेतन आयोग (पूर्ण)',
          'गट विमा (प्रलंबित)',
          'गट विमा (पूर्ण)',
          'स्थिती (प्रलंबित)',
          'स्थिती (प्रक्रियेत)',
          'स्थिती (पूर्ण)',
          'सेवानिवृत्ती प्रगती (प्रलंबित)',
          'सेवानिवृत्ती प्रगती (प्रक्रियेत)',
          'सेवानिवृत्ती प्रगती (पूर्ण)'
        ]
      ];

      clerkDetails.forEach(clerk => {
        worksheetData.push([
          clerk.clerk_name,
          clerk.total_employees,
          clerk.pay_commission_pending,
          clerk.pay_commission_completed,
          clerk.group_insurance_pending,
          clerk.group_insurance_completed,
          clerk.status_pending,
          clerk.status_processing,
          clerk.status_completed,
          clerk.retirement_progress_pending,
          clerk.retirement_progress_in_progress,
          clerk.retirement_progress_completed
        ]);
      });
    } else if (drillDownLevel === 'employee') {
      const clerkName = clerkDetails.find(c => c.clerk_id === selectedClerk)?.clerk_name || 'Unknown';
      fileName = `कर्मचारी_अहवाल_${clerkName}.xlsx`;

      worksheetData = [
        [`कर्मचारी अहवाल - ${selectedOffice} - ${clerkName}`],
        [],
        [
          'कर्मचारी क्र.',
          'नाव',
          'शालार्थ/सेवार्थ आयडी',
          'विभाग',
          'पदनाम',
          'सेवानिवृत्ती तारीख',
          'वेतन आयोग',
          'गट विमा',
          'स्थिती',
          'सेवानिवृत्ती प्रगती'
        ]
      ];

      employeeDetails.forEach(employee => {
        worksheetData.push([
          employee.emp_id,
          employee.employee_name,
          employee.shalarth_sevarthid || '-',
          employee.department,
          employee.designation,
          new Date(employee.retirement_date).toLocaleDateString('en-GB'),
          employee.pay_commission_status,
          employee.group_insurance_status,
          employee.status,
          employee.retirement_progress_status
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    ws['!cols'] = [];
    for (let i = 0; i <= range.e.c; i++) {
      ws['!cols'].push({ wch: 20 });
    }

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        if (R === 0) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "0D9488" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else if (R === 2) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "14B8A6" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        } else if (R > 2) {
          const cellValue = ws[cellAddress].v;
          let fillColor = "FFFFFF";

          if (typeof cellValue === 'string') {
            if (cellValue === 'pending' || cellValue === 'प्रलंबित') {
              fillColor = "FEF3C7";
            } else if (cellValue === 'processing' || cellValue === 'in_progress' || cellValue === 'प्रक्रियेत') {
              fillColor = "DBEAFE";
            } else if (cellValue === 'completed' || cellValue === 'पूर्ण') {
              fillColor = "D1FAE5";
            }
          }

          ws[cellAddress].s = {
            fill: { fgColor: { rgb: fillColor } },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } }
            }
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'अहवाल');

    XLSX.writeFile(wb, fileName);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
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

  const filteredOfficeSummaries = officeFilter
    ? officeSummaries.filter(office => office.office_name === officeFilter)
    : officeSummaries;

  const filteredClerkDetails = clerkFilter
    ? clerkDetails.filter(clerk => clerk.clerk_id === clerkFilter)
    : clerkDetails;

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
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-all duration-200 shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Excel डाउनलोड</span>
              </button>
              <button
                onClick={fetchOfficeSummaries}
                className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">रिफ्रेश करा</span>
              </button>
            </div>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-teal-600" />
                    <label className="text-sm font-medium text-gray-700">कार्यालय निवडा:</label>
                    <select
                      value={officeFilter}
                      onChange={(e) => handleOfficeFilterChange(e.target.value)}
                      className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">सर्व कार्यालये</option>
                      {officeSummaries.map((office, index) => (
                        <option key={index} value={office.office_name}>
                          {office.office_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    <span>कार्यालयनिहाय सारांश</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-6">
                    {filteredOfficeSummaries.map((office, index) => (
                      <div
                        key={index}
                        onClick={() => fetchClerkDetails(office.office_name)}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-400 cursor-pointer transition-all duration-200 bg-white"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-teal-100 p-3 rounded-lg">
                              <Building2 className="h-7 w-7 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{office.office_name}</h3>
                          </div>
                          <ChevronRight className="h-6 w-6 text-gray-400" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="text-3xl font-bold text-blue-900">{office.total_clerks}</div>
                            <div className="text-sm text-blue-700 mt-2 font-medium">एकूण लिपिक</div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="text-3xl font-bold text-purple-900">{office.total_employees}</div>
                            <div className="text-sm text-purple-700 mt-2 font-medium">एकूण कर्मचारी</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                            <div className="flex items-baseline space-x-1">
                              <div className="text-2xl font-bold text-orange-900">{office.pay_commission_pending}</div>
                              <div className="text-lg text-orange-600 font-semibold">/ {office.pay_commission_completed}</div>
                            </div>
                            <div className="text-sm text-orange-700 mt-2 font-medium">वेतन आयोग (प्रलंबित/पूर्ण)</div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-baseline space-x-1">
                              <div className="text-2xl font-bold text-emerald-900">{office.group_insurance_pending}</div>
                              <div className="text-lg text-emerald-600 font-semibold">/ {office.group_insurance_completed}</div>
                            </div>
                            <div className="text-sm text-emerald-700 mt-2 font-medium">गट विमा (प्रलंबित/पूर्ण)</div>
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-lg font-bold text-amber-900">{office.status_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-lg font-bold text-sky-900">{office.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-lg font-bold text-green-900">{office.status_completed}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mt-2 font-medium border-t border-amber-200 pt-2">स्थिती</div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-lg font-bold text-amber-900">{office.retirement_progress_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-lg font-bold text-sky-900">{office.retirement_progress_in_progress}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-lg font-bold text-green-900">{office.retirement_progress_completed}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mt-2 font-medium border-t border-teal-200 pt-2">सेवानिवृत्ती प्रगती</div>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-teal-600" />
                    <label className="text-sm font-medium text-gray-700">लिपिक निवडा:</label>
                    <select
                      value={clerkFilter}
                      onChange={(e) => handleClerkFilterChange(e.target.value)}
                      className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">सर्व लिपिक</option>
                      {clerkDetails.map((clerk, index) => (
                        <option key={index} value={clerk.clerk_id}>
                          {clerk.clerk_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-teal-600" />
                    <span>लिपिकनिहाय तपशील - {selectedOffice}</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-6">
                    {filteredClerkDetails.map((clerk, index) => (
                      <div
                        key={index}
                        onClick={() => fetchEmployeeDetails(selectedOffice, clerk.clerk_id)}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-400 cursor-pointer transition-all duration-200 bg-white"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-teal-100 p-3 rounded-lg">
                              <Users className="h-7 w-7 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{clerk.clerk_name}</h3>
                          </div>
                          <ChevronRight className="h-6 w-6 text-gray-400" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="text-3xl font-bold text-purple-900">{clerk.total_employees}</div>
                            <div className="text-sm text-purple-700 mt-2 font-medium">एकूण कर्मचारी</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                            <div className="flex items-baseline space-x-1">
                              <div className="text-2xl font-bold text-orange-900">{clerk.pay_commission_pending}</div>
                              <div className="text-lg text-orange-600 font-semibold">/ {clerk.pay_commission_completed}</div>
                            </div>
                            <div className="text-sm text-orange-700 mt-2 font-medium">वेतन आयोग (प्रलंबित/पूर्ण)</div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-baseline space-x-1">
                              <div className="text-2xl font-bold text-emerald-900">{clerk.group_insurance_pending}</div>
                              <div className="text-lg text-emerald-600 font-semibold">/ {clerk.group_insurance_completed}</div>
                            </div>
                            <div className="text-sm text-emerald-700 mt-2 font-medium">गट विमा (प्रलंबित/पूर्ण)</div>
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-lg font-bold text-amber-900">{clerk.status_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-lg font-bold text-sky-900">{clerk.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-lg font-bold text-green-900">{clerk.status_completed}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mt-2 font-medium border-t border-amber-200 pt-2">स्थिती</div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-lg font-bold text-amber-900">{clerk.retirement_progress_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-lg font-bold text-sky-900">{clerk.retirement_progress_in_progress}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-lg font-bold text-green-900">{clerk.retirement_progress_completed}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mt-2 font-medium border-t border-teal-200 pt-2">सेवानिवृत्ती प्रगती</div>
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
                        <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">सेवानिवृत्ती प्रगती</th>
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
                          <td className="px-4 py-3 text-sm">{getStatusBadge(employee.retirement_progress_status)}</td>
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
