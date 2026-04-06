import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Building2,
  Users,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Layers,
  FileText
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ermsClient } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface GADReportsProps {
  user: SupabaseUser;
  onBack: () => void;
}

interface GroupSummary {
  group_name: string;
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
  emp_id: string;
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

const GAD_OFFICE_GROUPS: Record<string, string[]> = {
  'पंचायत समिती बल्लारपुर': [
    'पंचायत समिती, बल्लारपूर',
    'ग्रामीण पाणी पुरवठा उपविभाग, बल्लारपुर',
    'तालुका आरोग्य अधिकारी पी.एस. बल्लारपूर',
    'प्राथमिक आरोग्य केंद्र, कळमना',
    'प्राथमिक आरोग्य केंद्र, विसापूर',
    'प्राथमिक आरोग्य केंद्र, कोठारी',
    'प्राथमिक आरोग्य केंद्र, मानोरा',
    'सीडीपीओ बल्लारपूर (टी)',
  ],
  'पंचायत समिती मुल': [
    'पंचायत समिती, मूल',
    'सीडीपीओ मूल (आर)',
    'झेड. पी. वर्क्स, सब डिव्हिजन, मूल',
    'उप विभाग, मुलं',
    'तालुका आरोग्य अधिकारी पी.एस. मुल',
    'प्राथमिक आरोग्य केंद्र, मारोडा',
    'प्राथमिक आरोग्य केंद्र, बेंबळ',
    'प्राथमिक आरोग्य केंद्र, राजोली',
    'प्राथमिक आरोग्य केंद्र, चिरोली',
  ],
  'पंचायत समिती,  चंद्रपुर': [
    'पंचायत समिती,चंद्रपूर',
    'सीडीपीओ चंद्रपूर (टी)',
    'झेड. पी. वर्क्स, उपविभाग, चंद्रपूर',
    'उप विभाग, चंद्रपूर',
    'प्राथमिक आरोग्य केंद्र, चिचपल्ली',
    'प्राथमिक आरोग्य केंद्र, घुग्गुस',
    'प्राथमिक आरोग्य केंद्र, दुर्गापूर',
  ],
  'पंचायत समिती,  चिमुर': [
    'पंचायत समिती, चिमूर',
    'सीडीपीओ चिमूर (टी)',
    'झेड. पी. वर्क्स सब डिव्हिजन, चिमूर',
    'उप विभाग, चिमूर',
    'तालुका आरोग्य अधिकारी पी.एस. चिमूर',
    'प्राथमिक आरोग्य केंद्र, खडसांगी',
    'प्राथमिक आरोग्य केंद्र, मासाळ',
    'प्राथमिक आरोग्य केंद्र, भिसी',
    'प्राथमिक आरोग्य केंद्र, जांभूळघाट',
    'प्राथमिक आरोग्य केंद्र, नेरी',
    'प्राथमिक आरोग्य केंद्र, शंकरपूर',
    'प्राथमिक आरोग्य केंद्र, सावरी',
  ],
  'पंचायत समिती, सिंदेवाही': [
    'पंचायत समिती, सिंदेवाही',
    'सीडीपीओ सिंदेवाही (नि)',
    'उप विभाग, सिंदेवाही',
    'तालुका आरोग्य अधिकारी पी.एस. सिंदेवाही',
    'प्राथमिक आरोग्य केंद्र, वासेरा',
    'प्राथमिक आरोग्य केंद्र, गुंजेवाही',
    'प्राथमिक आरोग्य केंद्र, नवरगाव',
    'प्राथमिक आरोग्य केंद्र, मोहाडी नळेश्वर',
  ],
  'पंचायत समिती, सावली': [
    'पंचायत समिती, सावली',
    'सीडीपीओ साओली (नि.)',
    'उप विभाग, सावली',
    'तालुका आरोग्य अधिकारी पी.एस. सावली',
    'प्राथमिक आरोग्य केंद्र, पाथरी',
    'प्राथमिक आरोग्य केंद्र, लोंढोली',
    'प्राथमिक आरोग्य केंद्र, व्याहाड बुज.',
    'प्राथमिक आरोग्य केंद्र, अंतरगाव',
    'प्राथमिक आरोग्य केंद्र, बोथली',
    'प्राथमिक आरोग्य केंद्र, जिबगाव',
  ],
  'पंचायत समिती, राजुरा': [
    'पंचायत समिती, राजुरा',
    'सीडीपीओ राजुरा (टी)',
    'झेड. पी. वर्क्स, सब डिव्हिजन, राजुरा',
    'उप विभाग, राजूरा',
    'तालुका आरोग्य अधिकारी पी.एस. राजुरा',
    'प्राथमिक आरोग्य केंद्र, देवाडा',
    'प्राथमिक आरोग्य केंद्र, कढोली',
    'प्राथमिक आरोग्य केंद्र, चिंचोली',
    'प्राथमिक आरोग्य केंद्र, विरुर स्टेशन',
  ],
  'पंचायत समिती, गोंडपिपरी': [
    'पंचायत समिती, गोंडपिपरी',
    'सीडीपीओ गोंडपिंपरी (टी)',
    'उप विभाग, गोंडपिपरी',
    'तालुका आरोग्य अधिकारी पी.एस. गोंडपिपरी',
    'प्राथमिक आरोग्य केंद्र, तोहोगाव',
    'प्राथमिक आरोग्य केंद्र, भंगाराम तळोधी',
    'प्राथमिक आरोग्य केंद्र, ढाबा',
  ],
  'पंचायत समिती, भद्रावती ': [
    'पंचायत समिती, भद्रावती',
    'सीडीपीओ भद्रावती (नि)',
    'उप विभाग, भद्रावती',
    'तालुका आरोग्य कार्यालय पी.एस. भद्रावती',
    'प्राथमिक आरोग्य केंद्र, घोडपेठ',
    'प्राथमिक आरोग्य केंद्र, मुधोली',
    'प्राथमिक आरोग्य केंद्र, माजरी',
    'प्राथमिक आरोग्य केंद्र, चंदनखेडा',
    'प्राथमिक आरोग्य केंद्र, डोंगरगाव',
  ],
  'पंचायत समिती, ब्रम्हपुरी': [
    'पंचायत समिती, ब्रम्हपुरी',
    'सीडीपीओ ब्रह्मपुरी (टी)',
    'जिल्हा परिषद लघु पाटबंधारे, उपविभाग ब्रम्हपुरी',
    'उप विभाग, ब्रम्हपुरी',
    'तालुका आरोग्य अधिकारी पी.एस. ब्रम्हपुरी',
    'प्राथमिक आरोग्य केंद्र, ननोरी',
    'प्राथमिक आरोग्य केंद्र, मेंडकी',
    'प्राथमिक आरोग्य केंद्र, गांगलवाडी',
    'प्राथमिक आरोग्य केंद्र, मुडझा',
    'प्राथमिक आरोग्य केंद्र, चौगन',
    'प्राथमिक आरोग्य केंद्र, अरहेर नवरगाव',
  ],
  'पंचायत समिती, जिवती': [
    'पंचायत समिती, जिवती',
    'सीडीपीओ जिवती (टी)',
    'उप विभाग, जिवती',
    'प्राथमिक आरोग्य केंद्र, पाटण',
    'प्राथमिक आरोग्य केंद्र, शेणगाव',
    'प्राथमिक आरोग्य केंद्र, जिवती',
  ],
  'पंचायत समिती, कोरपना': [
    'पंचायत समिती, कोरपना',
    'सीडीपीओ कोरपाना (टी)',
    'झेड.पी. वर्क्स उपविभाग, जिवती H.O. कोरपना',
    'उप विभाग, कोरपना',
    'तालुका आरोग्य अधिकारी पी.एस. कोरपना',
    'प्राथमिक आरोग्य केंद्र, नारंडा',
    'प्राथमिक आरोग्य केंद्र, विरूर गाडेगाव',
    'प्राथमिक आरोग्य केंद्र, मांडवा',
    'प्राथमिक आरोग्य केंद्र, नांदा फाटा',
  ],
  'पंचायत समिती, वरोरा': [
    'पंचायत समिती, वरोरा',
    'सीडीपीओ वरोरा (आर)',
    'झेड. पी. वर्क्स, सब डिव्हिजन, वरोरा',
    'उप विभाग, वरोरा',
    'तालुका आरोग्य कार्यालय पी.एस. वरोरा',
    'प्राथमिक आरोग्य केंद्र, नागरी',
    'प्राथमिक आरोग्य केंद्र, मधेली',
    'प्राथमिक आरोग्य केंद्र, कोसरसर',
    'प्राथमिक आरोग्य केंद्र, शेगाव',
  ],
  'पंचायत समिती, पोंभुर्णा': [
    'पंचायत समिती, पोंभुर्णा',
    'सीडीपीओ पोंभुर्ना (टी)',
    'उप विभाग, पोंभुर्णा',
    'तालुका आरोग्य अधिकारी पी.एस. पोभुर्णा',
    'प्राथमिक आरोग्य केंद्र, नवेगाव मोरे',
  ],
  'पंचायत समिती, नागभिड ': [
    'पंचायत समिती, नागभीड',
    'सीडीपीओ नागभीड (आर)',
    'जिल्हा परिषद लघु पाटबंधारे, उपविभाग नागभीड',
    'उप विभाग, नागभिड',
    'तालुका आरोग्य अधिकारी पी.एस. नागभीड',
    'प्राथमिक आरोग्य केंद्र, तळोधी',
    'प्राथमिक आरोग्य केंद्र, नवेगाव पांडव',
    'प्राथमिक आरोग्य केंद्र, मौशी',
    'प्राथमिक आरोग्य केंद्र, वाढोना',
    'प्राथमिक आरोग्य केंद्र, बाळापूर',
  ],
};

const GADReports: React.FC<GADReportsProps> = ({ user, onBack }) => {
  const [allData, setAllData] = useState<any[]>([]);
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([]);
  const [officeSummaries, setOfficeSummaries] = useState<OfficeSummary[]>([]);
  const [clerkDetails, setClerkDetails] = useState<ClerkDetail[]>([]);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetail[]>([]);

  const [drillDownLevel, setDrillDownLevel] = useState<'group' | 'office' | 'clerk' | 'employee'>('group');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedClerk, setSelectedClerk] = useState<string>('');

  // Normalize strings by removing extra spaces and trimming
  const normalizeString = (str: string): string => {
    return str.replace(/\s+/g, ' ').trim();
  };

  const [vibhagFilter, setVibhagFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (allData.length > 0) {
      calculateGroupSummaries();
    }
  }, [allData, vibhagFilter, groupFilter]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement_consolidated_view')
        .select('*');

      if (error) throw error;

      setAllData(data || []);

      const uniqueDepts = Array.from(new Set(
        (data || [])
          .map((row: any) => row.department)
          .filter((dept: string) => dept && dept.trim() !== '')
      )).sort();

      setDepartments(uniqueDepts as string[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGroupSummaries = () => {
    const summaries: GroupSummary[] = [];

    let groupsToProcess = Object.keys(GAD_OFFICE_GROUPS);

    if (groupFilter) {
      groupsToProcess = groupsToProcess.filter(g => g === groupFilter);
    }

    groupsToProcess.forEach(groupName => {
      const officeNames = GAD_OFFICE_GROUPS[groupName];
      const normalizedOfficeNames = officeNames.map(normalizeString);
      let groupData = allData.filter(row =>
        normalizedOfficeNames.includes(normalizeString(row.current_office_name || ''))
      );

      if (vibhagFilter) {
        groupData = groupData.filter(row => row.department === vibhagFilter);
      }

      const officeSet = new Set<string>();
      const clerkSet = new Set<string>();

      const summary: GroupSummary = {
        group_name: groupName,
        total_offices: 0,
        total_clerks: 0,
        total_employees: groupData.length,
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

      groupData.forEach((row: any) => {
        if (row.current_office_name) officeSet.add(row.current_office_name);
        if (row.assigned_clerk) clerkSet.add(row.assigned_clerk);

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

      if (summary.total_employees > 0) {
        summaries.push(summary);
      }
    });

    summaries.sort((a, b) => b.total_employees - a.total_employees);
    setGroupSummaries(summaries);
  };

  const fetchOfficeDetails = (groupName: string) => {
    setIsLoading(true);
    try {
      const officeNames = GAD_OFFICE_GROUPS[groupName];
      const normalizedOfficeNames = officeNames.map(normalizeString);
      let filteredData = allData.filter(row =>
        normalizedOfficeNames.includes(normalizeString(row.current_office_name || ''))
      );

      if (vibhagFilter) {
        filteredData = filteredData.filter(row => row.department === vibhagFilter);
      }

      const officeMap = new Map<string, any>();

      filteredData.forEach((row: any) => {
        const officeName = row.current_office_name;

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
        if (row.assigned_clerk) office.clerks.add(row.assigned_clerk);
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
      setDrillDownLevel('office');
      setSelectedGroup(groupName);
    } catch (error) {
      console.error('Error fetching office details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClerkDetails = (officeName: string) => {
    setIsLoading(true);
    try {
      let filteredData = allData.filter(row =>
        normalizeString(row.current_office_name || '') === normalizeString(officeName)
      );

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
    } catch (error) {
      console.error('Error fetching clerk details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeDetails = (clerkId: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching employee details for clerk:', clerkId);
      console.log('Selected office:', selectedOffice);
      console.log('Total data rows:', allData.length);

      let filteredData = allData.filter(row =>
        normalizeString(row.current_office_name || '') === normalizeString(selectedOffice)
      );
      console.log('After office filter:', filteredData.length);

      if (vibhagFilter) {
        filteredData = filteredData.filter(row => row.department === vibhagFilter);
        console.log('After department filter:', filteredData.length);
      }

      if (clerkId !== 'unassigned') {
        filteredData = filteredData.filter(row => row.assigned_clerk === clerkId);
      } else {
        filteredData = filteredData.filter(row => !row.assigned_clerk);
      }

      console.log('After clerk filter:', filteredData.length);

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
      console.log('Final employees:', employees.length);
      setEmployeeDetails(employees);
      setDrillDownLevel('employee');
      setSelectedClerk(clerkId);
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (drillDownLevel === 'employee') {
      setDrillDownLevel('clerk');
      setEmployeeDetails([]);
    } else if (drillDownLevel === 'clerk') {
      setDrillDownLevel('office');
      setClerkDetails([]);
    } else if (drillDownLevel === 'office') {
      setDrillDownLevel('group');
      setOfficeSummaries([]);
    } else {
      onBack();
    }
  };

  const exportToExcel = () => {
    let worksheetData: any[] = [];
    let fileName = 'GAD_अहवाल.xlsx';

    if (drillDownLevel === 'group') {
      fileName = 'GAD_गट_अहवाल.xlsx';
      worksheetData = [['कर्मचारी अहवाल - GAD - गट सारांश']];

      if (vibhagFilter) {
        worksheetData.push([`विभाग फिल्टर: ${vibhagFilter}`]);
      }

      worksheetData.push([]);
      worksheetData.push([
        'गट नाव',
        'एकूण कार्यालये',
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

      groupSummaries.forEach(group => {
        worksheetData.push([
          group.group_name,
          group.total_offices,
          group.total_clerks,
          group.total_employees,
          group.pay_commission_pending,
          group.pay_commission_completed,
          group.group_insurance_pending,
          group.group_insurance_completed,
          group.status_pending,
          group.status_processing,
          group.status_completed,
          group.retirement_progress_pending,
          group.retirement_progress_in_progress,
          group.retirement_progress_completed
        ]);
      });
    } else if (drillDownLevel === 'office') {
      fileName = `GAD_कार्यालय_अहवाल_${selectedGroup}.xlsx`;
      worksheetData = [[`कार्यालय अहवाल - ${selectedGroup}`]];

      if (vibhagFilter) {
        worksheetData.push([`विभाग फिल्टर: ${vibhagFilter}`]);
      }

      worksheetData.push([]);
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
      const clerkName = clerkDetails.find(c => c.clerk_id === selectedClerk)?.clerk_name || 'Unknown';
      fileName = `GAD_लिपिक_अहवाल_${selectedOffice}.xlsx`;

      worksheetData = [[`लिपिक अहवाल - ${selectedOffice}`]];

      if (vibhagFilter) {
        worksheetData.push([`विभाग फिल्टर: ${vibhagFilter}`]);
      }

      worksheetData.push([]);
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
      fileName = `GAD_कर्मचारी_अहवाल_${clerkName}.xlsx`;

      worksheetData = [[`कर्मचारी अहवाल - ${selectedOffice} - ${clerkName}`]];

      if (vibhagFilter) {
        worksheetData.push([`विभाग फिल्टर: ${vibhagFilter}`]);
      }

      worksheetData.push([]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-100 p-2 rounded-lg">
                <Layers className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-900">
                  कर्मचारी अहवाल - GAD
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  गटनिहाय, कार्यालयनिहाय, लिपिकनिहाय आणि कर्मचारी तपशील
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
                onClick={fetchAllData}
                className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">रिफ्रेश करा</span>
              </button>
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">मागे</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4 flex-wrap gap-2">
            <Filter className="h-5 w-5 text-indigo-600" />

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">गट निवडा:</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-4 py-2 border-2 border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">सर्व गट</option>
                {Object.keys(GAD_OFFICE_GROUPS).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">विभाग निवडा:</label>
              <select
                value={vibhagFilter}
                onChange={(e) => setVibhagFilter(e.target.value)}
                className="px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">सर्व विभाग</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {(vibhagFilter || groupFilter) && (
              <button
                onClick={() => {
                  setVibhagFilter('');
                  setGroupFilter('');
                }}
                className="px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
              >
                फिल्टर काढा
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
        ) : (
          <>
            {drillDownLevel === 'group' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-teal-600" />
                    <span>गटनिहाय सारांश</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-6">
                    {groupSummaries.map((group, index) => (
                      <div
                        key={index}
                        onClick={() => fetchOfficeDetails(group.group_name)}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-400 cursor-pointer transition-all duration-200 bg-white"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-teal-100 p-3 rounded-lg">
                              <Layers className="h-7 w-7 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{group.group_name}</h3>
                          </div>
                          <ChevronRight className="h-6 w-6 text-gray-400" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="text-sm text-blue-700 mb-2 font-medium">एकूण कार्यालये</div>
                            <div className="text-3xl font-bold text-blue-900">{group.total_offices}</div>
                          </div>

                          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                            <div className="text-sm text-cyan-700 mb-2 font-medium">एकूण लिपिक</div>
                            <div className="text-3xl font-bold text-cyan-900">{group.total_clerks}</div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="text-sm text-purple-700 mb-2 font-medium">एकूण कर्मचारी</div>
                            <div className="text-3xl font-bold text-purple-900">{group.total_employees}</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                            <div className="text-sm text-orange-700 mb-2 font-medium pb-2 border-b border-orange-200">वेतन आयोग</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{group.pay_commission_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-blue-900">{group.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{group.pay_commission_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="text-sm text-emerald-700 mb-2 font-medium pb-2 border-b border-emerald-200">गट विमा</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{group.group_insurance_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-blue-900">{group.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{group.group_insurance_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                            <div className="text-sm text-gray-700 mb-2 font-medium pb-2 border-b border-teal-200">सेवानिवृत्ती प्रगती</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{group.retirement_progress_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-blue-900">{group.retirement_progress_in_progress}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{group.retirement_progress_completed}</span>
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

            {drillDownLevel === 'office' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-teal-600" />
                      <span>{selectedGroup} - कार्यालयनिहाय सारांश</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {officeSummaries.map((office, index) => (
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

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                            <div className="text-sm text-cyan-700 mb-2 font-medium">एकूण लिपिक</div>
                            <div className="text-3xl font-bold text-cyan-900">{office.total_clerks}</div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="text-sm text-purple-700 mb-2 font-medium">एकूण कर्मचारी</div>
                            <div className="text-3xl font-bold text-purple-900">{office.total_employees}</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                            <div className="text-sm text-orange-700 mb-2 font-medium pb-2 border-b border-orange-200">वेतन आयोग</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{office.pay_commission_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-blue-900">{office.status_processing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-700">पूर्ण</span>
                                <span className="text-xl font-bold text-green-900">{office.pay_commission_completed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="text-sm text-emerald-700 mb-2 font-medium pb-2 border-b border-emerald-200">गट विमा</div>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700">प्रलंबित</span>
                                <span className="text-xl font-bold text-amber-900">{office.group_insurance_pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-blue-900">{office.status_processing}</span>
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
                                <span className="text-xs text-blue-700">प्रक्रियेत</span>
                                <span className="text-xl font-bold text-blue-900">{office.retirement_progress_in_progress}</span>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-teal-600" />
                    <span>{selectedOffice} - लिपिकनिहाय सारांश</span>
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-teal-50 border-b-2 border-teal-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-teal-900">लिपिक नाव</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">एकूण कर्मचारी</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">वेतन आयोग</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">गट विमा</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">सेवानिवृत्ती प्रगती</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">कृती</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {clerkDetails.map((clerk, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{clerk.clerk_name}</td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">{clerk.total_employees}</td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="flex flex-col space-y-1">
                                <span className="text-amber-700">प्रलंबित: {clerk.pay_commission_pending}</span>
                                <span className="text-blue-700">प्रक्रियेत: {clerk.status_processing}</span>
                                <span className="text-green-700">पूर्ण: {clerk.pay_commission_completed}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="flex flex-col space-y-1">
                                <span className="text-amber-700">प्रलंबित: {clerk.group_insurance_pending}</span>
                                <span className="text-blue-700">प्रक्रियेत: {clerk.status_processing}</span>
                                <span className="text-green-700">पूर्ण: {clerk.group_insurance_completed}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="flex flex-col space-y-1">
                                <span className="text-amber-700">प्रलंबित: {clerk.retirement_progress_pending}</span>
                                <span className="text-blue-700">प्रक्रियेत: {clerk.retirement_progress_in_progress}</span>
                                <span className="text-green-700">पूर्ण: {clerk.retirement_progress_completed}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => fetchEmployeeDetails(clerk.clerk_id)}
                                className="px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                              >
                                तपशील पहा
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {drillDownLevel === 'employee' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span>कर्मचारी तपशील</span>
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-teal-50 border-b-2 border-teal-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-teal-900">कर्मचारी क्र.</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-teal-900">नाव</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-teal-900">विभाग</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-teal-900">पदनाम</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-teal-900">सेवानिवृत्ती तारीख</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">वेतन आयोग</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">गट विमा</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-teal-900">सेवानिवृत्ती प्रगती</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employeeDetails.map((employee, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{employee.emp_id}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.employee_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{employee.department}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{employee.designation}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {new Date(employee.retirement_date).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-4 py-3 text-center">{getStatusBadge(employee.pay_commission_status)}</td>
                            <td className="px-4 py-3 text-center">{getStatusBadge(employee.group_insurance_status)}</td>
                            <td className="px-4 py-3 text-center">{getStatusBadge(employee.retirement_progress_status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default GADReports;
