import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ermsClient } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RetirementAnalyticsDashboardProps {
  user: SupabaseUser;
  onBack: () => void;
}

export const RetirementAnalyticsDashboard: React.FC<RetirementAnalyticsDashboardProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [retirementEmployees, setRetirementEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchRetirementData();
    fetchDepartments();
  }, []);

  const fetchRetirementData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ermsClient
        .from('employee_retirement')
        .select(`
          id,
          emp_id,
          employee_name,
          retirement_date,
          status,
          date_of_submission,
          type_of_pension,
          department,
          date_of_pension_case_approval,
          date_of_actual_benefit_provided_for_group_insurance,
          date_of_benefit_provided_for_gratuity,
          date_of_actual_benefit_provided_for_leave_encashment,
          date_of_actual_benefit_provided_for_medical_allowance_if_applic,
          date_of_benefit_provided_for_hometown_travel_allowance_if_appli,
          date_of_actual_benefit_provided_for_pending_travel_allowance_if
        `)
        .order('retirement_date', { ascending: true });

      if (error) throw error;
      setRetirementEmployees(data || []);
    } catch (error) {
      console.error('Error fetching retirement data:', error);
    } finally {
      setIsLoading(false);
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

  const getProgressStatus = (employee: any) => {
    const progressFields = [
      employee.date_of_pension_case_approval,
      employee.date_of_actual_benefit_provided_for_group_insurance,
      employee.date_of_benefit_provided_for_gratuity,
      employee.date_of_actual_benefit_provided_for_leave_encashment,
      employee.date_of_actual_benefit_provided_for_medical_allowance_if_applic,
      employee.date_of_benefit_provided_for_hometown_travel_allowance_if_appli,
      employee.date_of_actual_benefit_provided_for_pending_travel_allowance_if,
    ];

    const filledFields = progressFields.filter((field) => {
      return field && typeof field === 'string' ? field.trim() !== '' : !!field;
    }).length;

    const totalFields = progressFields.length;

    if (filledFields === 0) return 'pending';
    if (filledFields === totalFields) return 'completed';
    return 'processing';
  };

  const calculateUpcomingRetirements = () => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    return retirementEmployees.filter(emp => {
      if (!emp.retirement_date) return false;
      const retirementDate = new Date(emp.retirement_date);
      const now = new Date();
      return retirementDate >= now && retirementDate <= sixMonthsFromNow;
    }).length;
  };

  const getDepartmentWiseCount = () => {
    const deptCount: { [key: string]: number } = {};

    retirementEmployees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    return Object.entries(deptCount)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getMonthWiseData = () => {
    const monthData = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = targetDate.toLocaleString('default', { month: 'short' });
      const year = targetDate.getFullYear();
      monthData.push({
        month: `${monthName} ${year.toString().slice(-2)}`,
        fullDate: targetDate,
        count: 0
      });
    }

    retirementEmployees.forEach(emp => {
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
      <div className="space-y-4">
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
                className="hover:r-6 transition-all cursor-pointer"
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

          <text
            x={chartWidth / 2}
            y={chartHeight - 5}
            fontSize="12"
            fill="#4b5563"
            textAnchor="middle"
            fontWeight="500"
          >
            Month →
          </text>
        </svg>
      </div>
    );
  };

  const renderPieChart = (data: { label: string; value: number; color: string }[]) => {
    if (data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
        <div className="relative" style={{ width: '280px', height: '280px' }}>
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const radius = 40;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (angle / 360) * circumference;

              const slice = (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={offset}
                  transform={`rotate(${currentAngle} 50 50)`}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );

              currentAngle += angle;
              return slice;
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.value} ({percentage}%)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const statusCounts = {
    total: retirementEmployees.length,
    processing: retirementEmployees.filter(emp => getProgressStatus(emp) === 'processing').length,
    completed: retirementEmployees.filter(emp => getProgressStatus(emp) === 'completed').length,
    pending: retirementEmployees.filter(emp => getProgressStatus(emp) === 'pending').length,
  };

  const upcomingCount = calculateUpcomingRetirements();
  const monthWiseData = getMonthWiseData();
  const departmentWiseData = getDepartmentWiseCount();

  const pieChartData = [
    { label: 'Upcoming Retirements', value: upcomingCount, color: '#f97316' },
    { label: 'Processing', value: statusCounts.processing, color: '#fb923c' },
    { label: 'Completed', value: statusCounts.completed, color: '#10b981' },
    { label: 'Pending', value: statusCounts.pending, color: '#a855f7' },
  ];

  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const retiredInLastYear = retirementEmployees.filter(emp => {
    if (!emp.retirement_date) return false;
    const retDate = new Date(emp.retirement_date);
    return retDate >= oneYearAgo && retDate < now;
  });

  const retrospectiveAvgAge = retiredInLastYear.length > 0
    ? Math.round(retiredInLastYear.reduce((sum, emp) => sum + (emp.age || 0), 0) / retiredInLastYear.length)
    : 0;
  const retrospectiveCompletionRate = retiredInLastYear.length > 0
    ? ((retiredInLastYear.filter(emp => getProgressStatus(emp) === 'completed').length / retiredInLastYear.length) * 100).toFixed(1)
    : '0';
  const retrospectiveAvgProcessingTime = retiredInLastYear.length > 0
    ? Math.round(retiredInLastYear.reduce((sum, emp) => {
        if (!emp.retirement_date || !emp.date_of_submission) return sum;
        const diff = new Date(emp.retirement_date).getTime() - new Date(emp.date_of_submission).getTime();
        return sum + Math.max(0, diff / (1000 * 60 * 60 * 24));
      }, 0) / retiredInLastYear.length)
    : 0;

  const next3Months = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  const next6Months = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
  const next12Months = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());
  const predictiveUpcoming3Months = retirementEmployees.filter(emp => {
    if (!emp.retirement_date) return false;
    const retDate = new Date(emp.retirement_date);
    return retDate >= now && retDate <= next3Months;
  }).length;
  const predictiveUpcoming6Months = retirementEmployees.filter(emp => {
    if (!emp.retirement_date) return false;
    const retDate = new Date(emp.retirement_date);
    return retDate >= now && retDate <= next6Months;
  }).length;
  const predictiveUpcoming12Months = retirementEmployees.filter(emp => {
    if (!emp.retirement_date) return false;
    const retDate = new Date(emp.retirement_date);
    return retDate >= now && retDate <= next12Months;
  }).length;
  const peakMonth = monthWiseData.reduce((peak, month) =>
    month.count > peak.count ? month : peak
  , { month: '', count: 0 });
  const predictiveAtRisk = retirementEmployees.filter(emp => {
    if (!emp.retirement_date) return false;
    const retDate = new Date(emp.retirement_date);
    const monthsUntilRetirement = (retDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsUntilRetirement <= 3 && getProgressStatus(emp) === 'pending';
  }).length;

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
                  Retirement Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Key metrics and insights for retirement planning
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchRetirementData();
                fetchDepartments();
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">{t('erms.refresh')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{retirementEmployees.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Upcoming Retirements</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{upcomingCount}</p>
                <p className="text-xs text-gray-500 mt-1">Next 6 months</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Top Department</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  {departmentWiseData[0]?.department || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {departmentWiseData[0]?.count || 0} employees
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Department-wise Count */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Departments by Retirement Count</h3>
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

        {/* Charts */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Month-wise Retirement Count</h3>
              </div>
              {renderLineChart(monthWiseData)}
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Retirement Status Distribution</h3>
              </div>
              {renderPieChart(pieChartData)}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Retrospective Analysis</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="text-lg font-semibold text-gray-900">Last 12 months</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Retired</p>
                  <p className="text-2xl font-bold text-green-700">{retiredInLastYear.length}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Age</p>
                  <p className="text-2xl font-bold text-amber-700">{retrospectiveAvgAge}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-teal-700">{retrospectiveCompletionRate}%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Processing</p>
                  <p className="text-2xl font-bold text-purple-700">{retrospectiveAvgProcessingTime}d</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Insights:</strong> Over the past year, {retiredInLastYear.length} employees retired at an average age of {retrospectiveAvgAge}.
                  The completion rate was {retrospectiveCompletionRate}% with an average processing time of {retrospectiveAvgProcessingTime} days.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Predictive Analysis</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Next 3 Months</p>
                  <p className="text-2xl font-bold text-orange-700">{predictiveUpcoming3Months}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Next 6 Months</p>
                  <p className="text-2xl font-bold text-blue-700">{predictiveUpcoming6Months}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Next 12 Months</p>
                  <p className="text-2xl font-bold text-green-700">{predictiveUpcoming12Months}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Peak Month Alert</p>
                    <p className="text-xs text-gray-600">
                      {peakMonth.month} will have the highest retirements ({peakMonth.count} employees)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">At-Risk Cases</p>
                    <p className="text-xs text-gray-600">
                      {predictiveAtRisk} employees retiring within 3 months still have pending status
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Forecast:</strong> Expect {predictiveUpcoming3Months} retirements in the next quarter.
                  Plan resources for {peakMonth.month} when peak volume occurs.
                  {predictiveAtRisk > 0 && ` Priority attention needed for ${predictiveAtRisk} at-risk cases.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
