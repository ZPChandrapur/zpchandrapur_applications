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
import XLSX from 'xlsx-js-style';

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

interface VibhagSummary {
  total_offices: number;
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
  const [selectedOfficeSummary, setSelectedOfficeSummary] = useState<OfficeSummary | null>(null);

  const [officeFilter, setOfficeFilter] = useState<string>('');
  const [clerkFilter, setClerkFilter] = useState<string>('');
  const [vibhagFilter, setVibhagFilter] = useState<string>('');

  const [allData, setAllData] = useState<any[]>([]);
  const [availableVibhags, setAvailableVibhags] = useState<string[]>([]);
  const [vibhagSummary, setVibhagSummary] = useState<VibhagSummary | null>(null);

  useEffect(() => {
    fetchOfficeSummaries();
  }, []);

  useEffect(() => {
    if (vibhagFilter && allData.length > 0) {
      calculateVibhagSummary();
    } else {
      setVibhagSummary(null);
    }
  }, [vibhagFilter, allData]);

  const fetchOfficeSummaries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement_consolidated_view')
        .select('*');

      if (error) throw error;

      setAllData(data || []);

      const vibhagSet = new Set<string>();
      data?.forEach((row: any) => {
        if (row.department) {
          vibhagSet.add(row.department);
        }
      });
      setAvailableVibhags(Array.from(vibhagSet).sort());

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

  const calculateVibhagSummary = () => {
    if (!vibhagFilter) return;

    const vibhagData = allData.filter(row => row.department === vibhagFilter);

    const officeSet = new Set<string>();
    const clerkSet = new Set<string>();

    const summary: VibhagSummary = {
      total_offices: 0,
      total_clerks: 0,
      total_employees: vibhagData.length,
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
    };

    vibhagData.forEach((row: any) => {
      if (row.current_office_name) {
        officeSet.add(row.current_office_name);
      }
      if (row.assigned_clerk) {
        clerkSet.add(row.assigned_clerk);
      }

      if (row.pay_commission_status === 'pending') summary.pay_commission_pending++;
      if (row.pay_commission_status === 'completed') summary.pay_commission_completed++;

      if (row.group_insurance_status === 'pending') summary.group_insurance_pending++;
      if (row.group_insurance_status === 'completed') summary.group_insurance_completed++;

      if (row.status === 'pending') summary.status_pending++;
      if (row.status === 'processing') summary.status_processing++;
      if (row.status === 'completed') summary.status_completed++;

      if (row.retirement_progress_status === 'pending') summary.retirement_progress_pending++;
      if (row.retirement_progress_status === 'in_progress') summary.retirement_progress_in_progress++;
      if (row.retirement_progress_status === 'completed') summary.retirement_progress_completed++;
    });

    summary.total_offices = officeSet.size;
    summary.total_clerks = clerkSet.size;

    setVibhagSummary(summary);
  };

  const fetchClerkDetails = (officeName: string) => {
    setIsLoading(true);
    try {
      let filteredData = allData.filter(row => row.current_office_name === officeName);

      if (vibhagFilter) {
        filteredData = filteredData.filter(row => row.department === vibhagFilter);
      }

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

      const officeSum = officeSummaries.find(o => o.office_name === officeName);
      setSelectedOfficeSummary(officeSum || null);
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

      if (vibhagFilter) {
        filteredData = filteredData.filter(row => row.department === vibhagFilter);
      }

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

  const handleVibhagFilterChange = (vibhag: string) => {
    setVibhagFilter(vibhag);

    if (drillDownLevel === 'clerk' && selectedOffice) {
      setTimeout(() => {
        fetchClerkDetails(selectedOffice);
      }, 0);
    } else if (drillDownLevel === 'employee' && selectedOffice && selectedClerk) {
      setTimeout(() => {
        fetchEmployeeDetails(selectedOffice, selectedClerk);
      }, 0);
    }
  };

  const exportToExcel = () => {
    let worksheetData: any[] = [];
    let fileName = '';
    let headerRow = 0;
    let summaryEndRow = 0;

    if (drillDownLevel === 'office') {
      const dataToExport = filteredOfficeSummaries;

      if (vibhagFilter) {
        fileName = `विभागनिहाय_अहवाल_${vibhagFilter}.xlsx`;
        worksheetData = [
          ['विभागनिहाय सारांश अहवाल'],
          [`विभाग: ${vibhagFilter}`],
          []
        ];

        if (vibhagSummary) {
          worksheetData.push(
            ['सारांश'],
            ['एकूण कार्यालये', vibhagSummary.total_offices],
            ['एकूण लिपिक', vibhagSummary.total_clerks],
            ['एकूण कर्मचारी', vibhagSummary.total_employees],
            [],
            ['वेतन आयोग'],
            ['प्रलंबित', vibhagSummary.pay_commission_pending],
            ['प्रक्रियेत', vibhagSummary.status_processing],
            ['पूर्ण', vibhagSummary.pay_commission_completed],
            [],
            ['गट विमा'],
            ['प्रलंबित', vibhagSummary.group_insurance_pending],
            ['प्रक्रियेत', vibhagSummary.status_processing],
            ['पूर्ण', vibhagSummary.group_insurance_completed],
            []
          );
        }
        summaryEndRow = worksheetData.length;
      } else {
        fileName = 'कार्यालयनिहाय_अहवाल.xlsx';
        worksheetData = [
          ['कार्यालयनिहाय सारांश अहवाल'],
          []
        ];
        summaryEndRow = 2;
      }

      headerRow = worksheetData.length;
      worksheetData.push([
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
      ]);

      dataToExport.forEach(office => {
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
        [`लिपिकनिहाय अहवाल - ${selectedOffice}`]
      ];

      if (vibhagFilter) {
        worksheetData.push([`विभाग फिल्टर: ${vibhagFilter}`]);
      }

      worksheetData.push([]);
      headerRow = worksheetData.length;

      worksheetData.push([
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
      ]);

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
        [`कर्मचारी अहवाल - ${selectedOffice} - ${clerkName}`]
      ];

      if (vibhagFilter) {
        worksheetData.push([`विभाग फिल्टर: ${vibhagFilter}`]);
      }

      worksheetData.push([]);
      headerRow = worksheetData.length;

      worksheetData.push([
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
      ]);

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
            font: { bold: true, sz: 16, color: { rgb: "1E40AF" } },
            fill: { fgColor: { rgb: "DBEAFE" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "medium", color: { rgb: "3B82F6" } },
              bottom: { style: "medium", color: { rgb: "3B82F6" } },
              left: { style: "medium", color: { rgb: "3B82F6" } },
              right: { style: "medium", color: { rgb: "3B82F6" } }
            }
          };
        } else if (R === 1 && vibhagFilter) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 12, color: { rgb: "5B21B6" } },
            fill: { fgColor: { rgb: "EDE9FE" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "8B5CF6" } },
              bottom: { style: "thin", color: { rgb: "8B5CF6" } },
              left: { style: "thin", color: { rgb: "8B5CF6" } },
              right: { style: "thin", color: { rgb: "8B5CF6" } }
            }
          };
        } else if (summaryEndRow > 0 && R > 2 && R < summaryEndRow) {
          const cellValue = ws[cellAddress].v;
          const isLabel = C === 0;
          const isHeaderLabel = ['सारांश', 'वेतन आयोग', 'गट विमा'].includes(cellValue);

          if (isHeaderLabel) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "059669" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "059669" } },
                bottom: { style: "medium", color: { rgb: "059669" } },
                left: { style: "medium", color: { rgb: "059669" } },
                right: { style: "medium", color: { rgb: "059669" } }
              }
            };
          } else if (isLabel) {
            const labelColors: any = {
              'एकूण कार्यालये': { bg: 'DBEAFE', fg: '1E40AF', border: '3B82F6' },
              'एकूण लिपिक': { bg: 'D1FAE5', fg: '065F46', border: '10B981' },
              'एकूण कर्मचारी': { bg: 'E9D5FF', fg: '5B21B6', border: '8B5CF6' },
              'प्रलंबित': { bg: 'FEF3C7', fg: '78350F', border: 'F59E0B' },
              'प्रक्रियेत': { bg: 'DBEAFE', fg: '1E3A8A', border: '3B82F6' },
              'पूर्ण': { bg: 'D1FAE5', fg: '065F46', border: '10B981' }
            };
            const colors = labelColors[cellValue] || { bg: 'F3F4F6', fg: '374151', border: '9CA3AF' };

            ws[cellAddress].s = {
              font: { bold: true, sz: 10, color: { rgb: colors.fg } },
              fill: { fgColor: { rgb: colors.bg } },
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: colors.border } },
                bottom: { style: "thin", color: { rgb: colors.border } },
                left: { style: "thin", color: { rgb: colors.border } },
                right: { style: "thin", color: { rgb: colors.border } }
              }
            };
          } else {
            ws[cellAddress].s = {
              font: { bold: true, sz: 12, color: { rgb: "1F2937" } },
              fill: { fgColor: { rgb: "F9FAFB" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "D1D5DB" } },
                bottom: { style: "thin", color: { rgb: "D1D5DB" } },
                left: { style: "thin", color: { rgb: "D1D5DB" } },
                right: { style: "thin", color: { rgb: "D1D5DB" } }
              }
            };
          }
        } else if (R === headerRow) {
          const columnColors = [
            'DBEAFE', 'D1FAE5', 'E9D5FF', 'FED7AA', 'FED7AA',
            'D1FAE5', 'D1FAE5', 'FEF3C7', 'DBEAFE', 'D1FAE5',
            'FEF3C7', 'DBEAFE', 'D1FAE5'
          ];

          ws[cellAddress].s = {
            font: { bold: true, sz: 11, color: { rgb: "1F2937" } },
            fill: { fgColor: { rgb: columnColors[C] || 'E5E7EB' } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "medium", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "9CA3AF" } },
              right: { style: "thin", color: { rgb: "9CA3AF" } }
            }
          };
        } else if (R > headerRow) {
          const cellValue = ws[cellAddress].v;
          let fillColor = "FFFFFF";
          let fontColor = "1F2937";

          if (typeof cellValue === 'string') {
            if (cellValue === 'pending' || cellValue === 'प्रलंबित') {
              fillColor = "FEF3C7";
              fontColor = "78350F";
            } else if (cellValue === 'processing' || cellValue === 'in_progress' || cellValue === 'प्रक्रियेत') {
              fillColor = "DBEAFE";
              fontColor = "1E3A8A";
            } else if (cellValue === 'completed' || cellValue === 'पूर्ण') {
              fillColor = "D1FAE5";
              fontColor = "065F46";
            }
          } else if (typeof cellValue === 'number' && C > 0) {
            if (R % 2 === 0) {
              fillColor = "F9FAFB";
            }
          }

          ws[cellAddress].s = {
            font: { sz: 10, color: { rgb: fontColor } },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { horizontal: C === 0 ? "left" : "center", vertical: "center" },
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

    if (summaryEndRow > 0) {
      ws['!rows'] = ws['!rows'] || [];
      for (let i = 0; i < summaryEndRow; i++) {
        ws['!rows'][i] = { hpt: 20 };
      }
      ws['!rows'][0] = { hpt: 25 };
      ws['!rows'][headerRow] = { hpt: 30 };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'अहवाल');

    XLSX.writeFile(wb, fileName, { cellStyles: true });
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

  const getFilteredOfficeSummaries = () => {
    let dataToProcess = allData;

    if (vibhagFilter) {
      dataToProcess = dataToProcess.filter(row => row.department === vibhagFilter);
    }

    const officeMap = new Map<string, any>();

    dataToProcess.forEach((row: any) => {
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

    return officeFilter
      ? summaries.filter(office => office.office_name === officeFilter)
      : summaries;
  };

  const filteredOfficeSummaries = getFilteredOfficeSummaries();

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Filter className="h-5 w-5 text-teal-600" />
                      <label className="text-sm font-medium text-gray-700">विभाग निवडा:</label>
                      <select
                        value={vibhagFilter}
                        onChange={(e) => handleVibhagFilterChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">सर्व विभाग</option>
                        {availableVibhags.map((vibhag, index) => (
                          <option key={index} value={vibhag}>
                            {vibhag}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Filter className="h-5 w-5 text-teal-600" />
                      <label className="text-sm font-medium text-gray-700">कार्यालय निवडा:</label>
                      <select
                        value={officeFilter}
                        onChange={(e) => handleOfficeFilterChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                </div>

                {vibhagFilter && vibhagSummary && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-3 rounded-lg">
                          <Filter className="h-7 w-7 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-indigo-900">{vibhagFilter}</h3>
                          <p className="text-sm text-indigo-600">विभागनिहाय सारांश</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVibhagFilterChange('')}
                        className="px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
                      >
                        फिल्टर काढा
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                        <div className="text-sm text-blue-700 mb-2 font-medium">एकूण कार्यालये</div>
                        <div className="text-3xl font-bold text-blue-900">{vibhagSummary.total_offices}</div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border-2 border-cyan-200 shadow-sm">
                        <div className="text-sm text-cyan-700 mb-2 font-medium">एकूण लिपिक</div>
                        <div className="text-3xl font-bold text-cyan-900">{vibhagSummary.total_clerks}</div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                        <div className="text-sm text-purple-700 mb-2 font-medium">एकूण कर्मचारी</div>
                        <div className="text-3xl font-bold text-purple-900">{vibhagSummary.total_employees}</div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm">
                        <div className="text-sm text-orange-700 mb-2 font-medium pb-2 border-b-2 border-orange-200">वेतन आयोग</div>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-700">प्रलंबित</span>
                            <span className="text-xl font-bold text-amber-900">{vibhagSummary.pay_commission_pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-sky-700">प्रक्रियेत</span>
                            <span className="text-xl font-bold text-sky-900">{vibhagSummary.status_processing}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-700">पूर्ण</span>
                            <span className="text-xl font-bold text-green-900">{vibhagSummary.pay_commission_completed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border-2 border-emerald-200 shadow-sm">
                        <div className="text-sm text-emerald-700 mb-2 font-medium pb-2 border-b-2 border-emerald-200">गट विमा</div>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-700">प्रलंबित</span>
                            <span className="text-xl font-bold text-amber-900">{vibhagSummary.group_insurance_pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-sky-700">प्रक्रियेत</span>
                            <span className="text-xl font-bold text-sky-900">{vibhagSummary.status_processing}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-700">पूर्ण</span>
                            <span className="text-xl font-bold text-green-900">{vibhagSummary.group_insurance_completed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="text-sm text-blue-700 mb-2 font-medium">एकूण लिपिक</div>
                            <div className="text-3xl font-bold text-blue-900">{office.total_clerks}</div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="text-sm text-purple-700 mb-2 font-medium">एकूण कर्मचारी</div>
                            <div className="text-3xl font-bold text-purple-900">{office.total_employees}</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                            <div className="text-sm text-orange-700 mb-2 font-medium pb-2 border-b border-orange-200">वेतन आयोग </div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{office.pay_commission_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-sky-900">{office.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{office.pay_commission_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="text-sm text-emerald-700 mb-2 font-medium pb-2 border-b border-emerald-200">गट विमा </div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{office.group_insurance_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-sky-900">{office.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{office.group_insurance_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                            <div className="text-sm text-gray-700 mb-2 font-medium pb-2 border-b border-teal-200">सेवानिवृत्ती प्रगती</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{office.retirement_progress_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-sky-900">{office.retirement_progress_in_progress}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{office.retirement_progress_completed}</span>
                              </div>
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
                {selectedOfficeSummary && (
                  <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-teal-100 p-3 rounded-lg">
                          <Building2 className="h-7 w-7 text-teal-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedOfficeSummary.office_name}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-sm text-blue-700 mb-2 font-medium">एकूण लिपिक</div>
                        <div className="text-3xl font-bold text-blue-900">{selectedOfficeSummary.total_clerks}</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="text-sm text-purple-700 mb-2 font-medium">एकूण कर्मचारी</div>
                        <div className="text-3xl font-bold text-purple-900">{selectedOfficeSummary.total_employees}</div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="text-sm text-orange-700 mb-2 font-medium pb-2 border-b border-orange-200">वेतन आयोग </div>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-700">प्रलंबित</span>
                            <span className="text-xl font-bold text-amber-900">{selectedOfficeSummary.pay_commission_pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-sky-700">प्रक्रियेत</span>
                            <span className="text-xl font-bold text-sky-900">{selectedOfficeSummary.status_processing}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-700">पूर्ण</span>
                            <span className="text-xl font-bold text-green-900">{selectedOfficeSummary.pay_commission_completed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                        <div className="text-sm text-emerald-700 mb-2 font-medium pb-2 border-b border-emerald-200">गट विमा </div>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-700">प्रलंबित</span>
                            <span className="text-xl font-bold text-amber-900">{selectedOfficeSummary.group_insurance_pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-sky-700">प्रक्रियेत</span>
                            <span className="text-xl font-bold text-sky-900">{selectedOfficeSummary.status_processing}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-700">पूर्ण</span>
                            <span className="text-xl font-bold text-green-900">{selectedOfficeSummary.group_insurance_completed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                        <div className="text-sm text-gray-700 mb-2 font-medium pb-2 border-b border-teal-200">सेवानिवृत्ती प्रगती</div>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-700">प्रलंबित</span>
                            <span className="text-xl font-bold text-amber-900">{selectedOfficeSummary.retirement_progress_pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-sky-700">प्रक्रियेत</span>
                            <span className="text-xl font-bold text-sky-900">{selectedOfficeSummary.retirement_progress_in_progress}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-700">पूर्ण</span>
                            <span className="text-xl font-bold text-green-900">{selectedOfficeSummary.retirement_progress_completed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Filter className="h-5 w-5 text-teal-600" />
                      <label className="text-sm font-medium text-gray-700">विभाग निवडा:</label>
                      <select
                        value={vibhagFilter}
                        onChange={(e) => handleVibhagFilterChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">सर्व विभाग</option>
                        {availableVibhags.map((vibhag, index) => (
                          <option key={index} value={vibhag}>
                            {vibhag}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Filter className="h-5 w-5 text-teal-600" />
                      <label className="text-sm font-medium text-gray-700">लिपिक निवडा:</label>
                      <select
                        value={clerkFilter}
                        onChange={(e) => handleClerkFilterChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="text-sm text-purple-700 mb-2 font-medium">एकूण कर्मचारी</div>
                            <div className="text-3xl font-bold text-purple-900">{clerk.total_employees}</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                            <div className="text-sm text-orange-700 mb-2 font-medium pb-2 border-b border-orange-200">वेतन आयोग </div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{clerk.pay_commission_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-sky-900">{clerk.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{clerk.pay_commission_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="text-sm text-emerald-700 mb-2 font-medium pb-2 border-b border-emerald-200">गट विमा </div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{clerk.group_insurance_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-sky-900">{clerk.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{clerk.group_insurance_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                            <div className="text-sm text-gray-700 mb-2 font-medium pb-2 border-b border-teal-200">सेवानिवृत्ती प्रगती</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{clerk.retirement_progress_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sky-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-sky-900">{clerk.retirement_progress_in_progress}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{clerk.retirement_progress_completed}</span>
                              </div>
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
