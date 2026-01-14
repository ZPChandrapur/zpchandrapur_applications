import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  Award,
  Download,
  FileText
} from 'lucide-react';
import { ermsClient, supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

interface RetirementAnalyticsDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

export const RetirementAnalyticsDashboard: React.FC<RetirementAnalyticsDashboardProps> = ({ user, onBack }) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [retirementEmployees, setRetirementEmployees] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clerks, setClerks] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [retirementProgress, setRetirementProgress] = useState<any[]>([]);

  const isMarathi = i18n.language === 'mr';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRetirementData(),
        fetchAllEmployees(),
        fetchDepartments(),
        fetchClerks(),
        fetchOfficers(),
        fetchRetirementProgress()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRetirementData = async () => {
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement')
        .select('*')
        .order('retirement_date', { ascending: true });

      if (error) throw error;
      setRetirementEmployees(data || []);
    } catch (error) {
      console.error('Error fetching retirement data:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data, error } = await ermsClient
        .from('employee')
        .select('*');

      if (error) throw error;
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await ermsClient
        .from('department')
        .select('dept_id, department')
        .order('department');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchClerks = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          name,
          roles!inner(name)
        `)
        .eq('roles.name', 'clerk')
        .not('name', 'is', null);

      if (error) throw error;

      const clerksData = data?.map(clerk => ({
        user_id: clerk.user_id,
        name: clerk.name,
        role_name: clerk.roles?.name || 'clerk'
      })) || [];

      setClerks(clerksData);
    } catch (error) {
      console.error('Error fetching clerks:', error);
    }
  };

  const fetchOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          name,
          roles!inner(name)
        `)
        .eq('roles.name', 'officer')
        .not('name', 'is', null);

      if (error) throw error;

      const officersData = data?.map(officer => ({
        user_id: officer.user_id,
        name: officer.name,
        role_name: officer.roles?.name || 'officer'
      })) || [];

      setOfficers(officersData);
    } catch (error) {
      console.error('Error fetching officers:', error);
    }
  };

  const fetchRetirementProgress = async () => {
    try {
      const { data, error } = await ermsClient
        .from('retirement_progress')
        .select('*');

      if (error) throw error;
      setRetirementProgress(data || []);
    } catch (error) {
      console.error('Error fetching retirement progress:', error);
    }
  };

  const getProgressStatus = (empId: string) => {
    const progress = retirementProgress.find(p => p.emp_id === empId);
    if (!progress) return 'pending';

    const progressFields = [
      progress.date_of_birth_verification,
      progress.birth_certificate_doc_submitted,
      progress.medical_certificate,
      progress.nomination,
      progress.permanent_registration,
      progress.post_service_exam,
      progress.computer_exam_passed,
      progress.marathi_hindi_exam_exemption,
      progress.verification_completed,
      progress.has_undertaking_been_taken_on_21_12_2021,
      progress.no_objection_no_inquiry_certificate,
      progress.retirement_order
    ];

    const filledFields = progressFields.filter(f => f && f !== 'Pending').length;
    const totalFields = progressFields.length;

    if (filledFields === 0) return 'pending';
    if (filledFields === totalFields) return 'completed';
    return 'in_progress';
  };

  const calculateUpcomingRetirements = () => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    return allEmployees.filter(emp => {
      if (!emp.retirement_date) return false;
      const retirementDate = new Date(emp.retirement_date);
      const now = new Date();
      return retirementDate >= now && retirementDate <= sixMonthsFromNow;
    }).length;
  };

  const getStatusCounts = () => {
    const employeesWithRetirement = allEmployees.filter(emp => emp.retirement_date);

    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    employeesWithRetirement.forEach(emp => {
      const status = getProgressStatus(emp.emp_id);
      if (status === 'completed') completed++;
      else if (status === 'in_progress') inProgress++;
      else pending++;
    });

    return { completed, inProgress, pending };
  };

  const getDepartmentWiseCount = () => {
    const deptCount: { [key: string]: number } = {};

    allEmployees.forEach(emp => {
      const dept = departments.find(d => d.dept_id === emp.dept_id);
      const deptName = dept?.department || 'Unknown';
      deptCount[deptName] = (deptCount[deptName] || 0) + 1;
    });

    return Object.entries(deptCount)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getTopPerformingClerks = () => {
    const clerkPerformance: { [key: string]: { name: string; completed: number; inProgress: number; total: number } } = {};

    allEmployees.forEach(emp => {
      if (!emp.assigned_clerk) return;

      const status = getProgressStatus(emp.emp_id);
      if (!clerkPerformance[emp.assigned_clerk]) {
        const clerk = clerks.find(c => c.user_id === emp.assigned_clerk);
        clerkPerformance[emp.assigned_clerk] = {
          name: clerk?.name || 'Unknown',
          completed: 0,
          inProgress: 0,
          total: 0
        };
      }

      clerkPerformance[emp.assigned_clerk].total++;
      if (status === 'completed') clerkPerformance[emp.assigned_clerk].completed++;
      else if (status === 'in_progress') clerkPerformance[emp.assigned_clerk].inProgress++;
    });

    return Object.values(clerkPerformance)
      .map(clerk => ({
        ...clerk,
        completionRate: clerk.total > 0 ? (clerk.completed / clerk.total) * 100 : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);
  };

  const getTopPerformingOfficers = () => {
    const officerPerformance: { [key: string]: { name: string; completed: number; inProgress: number; total: number } } = {};

    allEmployees.forEach(emp => {
      if (!emp.officer_assigned) return;

      const status = getProgressStatus(emp.emp_id);
      if (!officerPerformance[emp.officer_assigned]) {
        const officer = officers.find(o => o.user_id === emp.officer_assigned);
        officerPerformance[emp.officer_assigned] = {
          name: officer?.name || 'Unknown',
          completed: 0,
          inProgress: 0,
          total: 0
        };
      }

      officerPerformance[emp.officer_assigned].total++;
      if (status === 'completed') officerPerformance[emp.officer_assigned].completed++;
      else if (status === 'in_progress') officerPerformance[emp.officer_assigned].inProgress++;
    });

    return Object.values(officerPerformance)
      .map(officer => ({
        ...officer,
        completionRate: officer.total > 0 ? (officer.completed / officer.total) * 100 : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);
  };

  const getMonthWiseData = () => {
    const monthData = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = targetDate.toLocaleString(isMarathi ? 'mr-IN' : 'en-US', { month: 'short' });
      const year = targetDate.getFullYear();
      monthData.push({
        month: `${monthName} ${year.toString().slice(-2)}`,
        fullDate: targetDate,
        count: 0
      });
    }

    allEmployees.forEach(emp => {
      if (emp.retirement_date) {
        const retirementDate = new Date(emp.retirement_date);
        const monthIndex = monthData.findIndex(m =>
          m.fullDate.getMonth() === retirementDate.getMonth() &&
          m.fullDate.getFullYear() === retirementDate.getFullYear()
        );
        if (monthIndex !== -1) {
          monthData[monthIndex].count++;
        }
      }
    });

    return monthData;
  };

  const getWeeklyDataUpdateMatrix = () => {
    const weeklyData: { [key: string]: { clerk: string; updates: number; lastUpdate: Date | null } } = {};

    allEmployees.forEach(emp => {
      if (!emp.assigned_clerk) return;

      const clerk = clerks.find(c => c.user_id === emp.assigned_clerk);
      const clerkName = clerk?.name || 'Unknown';
      const lastUpdate = emp.updated_at ? new Date(emp.updated_at) : null;

      if (!weeklyData[emp.assigned_clerk]) {
        weeklyData[emp.assigned_clerk] = {
          clerk: clerkName,
          updates: 0,
          lastUpdate: null
        };
      }

      if (lastUpdate) {
        const weeksDiff = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (weeksDiff === 0) {
          weeklyData[emp.assigned_clerk].updates++;
        }
        if (!weeklyData[emp.assigned_clerk].lastUpdate || lastUpdate > weeklyData[emp.assigned_clerk].lastUpdate) {
          weeklyData[emp.assigned_clerk].lastUpdate = lastUpdate;
        }
      }
    });

    return Object.values(weeklyData);
  };

  const downloadWeeklyMatrix = () => {
    const weeklyData = getWeeklyDataUpdateMatrix();
    const ws = XLSX.utils.json_to_sheet(weeklyData.map(item => ({
      [isMarathi ? 'लिपिक' : 'Clerk']: item.clerk,
      [isMarathi ? 'या आठवड्यात अपडेट' : 'Updates This Week']: item.updates,
      [isMarathi ? 'शेवटचे अपडेट' : 'Last Update']: item.lastUpdate ? item.lastUpdate.toLocaleDateString() : 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Data Update');
    XLSX.writeFile(wb, 'weekly_data_update_matrix.xlsx');
  };

  const renderLineChart = (data: any[]) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(item => item.count), 10);
    const chartHeight = 280;
    const chartWidth = 800;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const points = data.map((item, index) => {
      const x = padding.left + (index / (data.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - (item.count / maxValue) * innerHeight;
      return { x, y, count: item.count, month: item.month };
    });

    const pathD = points.map((point, i) =>
      `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map(i => {
          const y = padding.top + (i / 4) * innerHeight;
          const value = Math.round(maxValue * (1 - i / 4));
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text x={padding.left - 10} y={y + 4} fontSize="10" fill="#6b7280" textAnchor="end">
                {value}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#lineGradient)" />

        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={point.y - 12}
              fontSize="11"
              fill="#374151"
              textAnchor="middle"
              fontWeight="600"
            >
              {point.count}
            </text>
          </g>
        ))}

        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={chartHeight - padding.bottom + 15}
            fontSize="9"
            fill="#6b7280"
            textAnchor="middle"
            transform={`rotate(-45 ${point.x} ${chartHeight - padding.bottom + 15})`}
          >
            {point.month}
          </text>
        ))}
      </svg>
    );
  };

  const statusCounts = getStatusCounts();
  const upcomingCount = calculateUpcomingRetirements();
  const monthWiseData = getMonthWiseData();
  const departmentWiseData = getDepartmentWiseCount();
  const topClerks = getTopPerformingClerks();
  const topOfficers = getTopPerformingOfficers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isMarathi ? 'डॅशबोर्ड' : 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isMarathi ? 'सेवानिवृत्ती विश्लेषण आणि मुख्य मेट्रिक्स' : 'Retirement analytics and key metrics'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">{isMarathi ? 'रिफ्रेश' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md border-2 border-blue-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-semibold">
                  {isMarathi ? 'एकूण सेवानिवृत्ती' : 'Total Employees'}
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{allEmployees.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border-2 border-orange-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-semibold">
                  {isMarathi ? 'आगामी सेवानिवृत्ती' : 'Upcoming Retirements'}
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{upcomingCount}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {isMarathi ? 'पुढील 6 महिने' : 'Next 6 months'}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border-2 border-yellow-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-semibold">
                  {isMarathi ? 'प्रक्रिया' : 'In Progress'}
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{statusCounts.inProgress}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {isMarathi ? 'प्रलंबित प्रकरण' : 'Active cases'}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border-2 border-green-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-semibold">
                  {isMarathi ? 'पूर्ण' : 'Completed'}
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statusCounts.completed}</p>
                <p className="text-xs text-green-600 mt-1">
                  {isMarathi ? 'प्रकरण बंद' : 'Cases closed'}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border-2 border-purple-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-semibold">
                  {isMarathi ? 'प्रलंबित' : 'Pending'}
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{statusCounts.pending}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {isMarathi ? 'प्रारंभ नाही' : 'Not started'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Month-wise Chart */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isMarathi ? 'महिनानुसार सेवानिवृत्ती संख्या' : 'Month-wise Retirement Count'}
              </h3>
            </div>
            {renderLineChart(monthWiseData)}
          </div>
        </div>

        {/* Department-wise Count */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isMarathi ? 'शीर्ष 5 विभाग' : 'Top 5 Departments by Employee Count'}
            </h3>
            <div className="space-y-3">
              {departmentWiseData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{dept.department}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{dept.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Analysis Section */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Clerks */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isMarathi ? 'शीर्ष 10 लिपिक' : 'Top 10 Performing Clerks'}
              </h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topClerks.map((clerk, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-amber-600">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{clerk.name}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{clerk.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>{isMarathi ? 'एकूण' : 'Total'}: {clerk.total}</span>
                    <span className="text-green-600">{isMarathi ? 'पूर्ण' : 'Completed'}: {clerk.completed}</span>
                    <span className="text-yellow-600">{isMarathi ? 'प्रगतीपथावर' : 'In Progress'}: {clerk.inProgress}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${clerk.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Officers */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isMarathi ? 'शीर्ष 10 अधिकारी' : 'Top 10 Performing Officers'}
              </h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topOfficers.map((officer, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-blue-600">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{officer.name}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{officer.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>{isMarathi ? 'एकूण' : 'Total'}: {officer.total}</span>
                    <span className="text-green-600">{isMarathi ? 'पूर्ण' : 'Completed'}: {officer.completed}</span>
                    <span className="text-yellow-600">{isMarathi ? 'प्रगतीपथावर' : 'In Progress'}: {officer.inProgress}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${officer.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Data Update Matrix */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isMarathi ? 'साप्ताहिक डेटा अपडेट मॅट्रिक्स' : 'Weekly Data Update Matrix'}
              </h3>
              <button
                onClick={downloadWeeklyMatrix}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">{isMarathi ? 'डाउनलोड' : 'Download'}</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      {isMarathi ? 'लिपिक' : 'Clerk'}
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      {isMarathi ? 'या आठवड्यात अपडेट' : 'Updates This Week'}
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      {isMarathi ? 'शेवटचे अपडेट' : 'Last Update'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getWeeklyDataUpdateMatrix().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{item.clerk}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{item.updates}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                        {item.lastUpdate ? item.lastUpdate.toLocaleDateString(isMarathi ? 'mr-IN' : 'en-US') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
