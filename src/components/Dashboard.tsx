import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard } from './PermissionGuard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  LogOut, 
  Users, 
  FileText, 
  MapPin, 
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Menu,
  X,
  Smartphone,
  Monitor,
  User,
  ChevronDown,
  Shield,
  Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

type ActiveSystem = 'overview' | 'erms' | 'estimate' | 'inspection' | 'pesa';

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [activeSystem, setActiveSystem] = useState<ActiveSystem>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { hasAccess, userRole, isLoading } = usePermissions(user);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  const systems = [
    {
      id: 'erms' as const,
      name: 'ERMS',
      fullName: 'Employee Retirement Management System',
      icon: Users,
      color: 'blue',
      platform: 'web',
      description: 'Manage employee retirement data and track employees retiring in the next 6 months',
      stats: { total: 45, upcoming: 12, processed: 33 }
    },
    {
      id: 'estimate' as const,
      name: 'E-Estimate',
      fullName: 'Electronic Estimation System',
      icon: FileText,
      color: 'green',
      platform: 'mobile',
      description: 'Create, manage, and track project estimates with multi-step workflow and MD completion',
      stats: { draft: 8, pending: 15, approved: 23 }
    },
    {
      id: 'inspection' as const,
      name: 'FIMS',
      fullName: 'Field Inspection Management System',
      icon: MapPin,
      color: 'orange',
      platform: 'mobile',
      description: 'Conduct field visits, upload photos, and manage inspection forms with transparency',
      stats: { thisMonth: 28, pending: 5, completed: 23 }
    },
    {
      id: 'pesa' as const,
      name: 'PESA 5%',
      fullName: 'PESA 5% Fund Management System',
      icon: DollarSign,
      color: 'purple',
      platform: 'web',
      description: 'Track and manage PESA fund utilization across four components with compliance monitoring',
      stats: { allocated: '₹2.5Cr', utilized: '₹1.8Cr', villages: 45 }
    }
  ].filter(system => hasAccess(system.id, 'read'));

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-white hover:bg-blue-600',
      green: 'bg-green-500 text-white hover:bg-green-600',
      orange: 'bg-orange-500 text-white hover:bg-orange-600',
      purple: 'bg-purple-500 text-white hover:bg-purple-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'mobile' ? Smartphone : Monitor;
  };
  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-4 sm:p-6 text-white">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Welcome to ZP Chandrapur
          {userRole && (
            <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
              {userRole.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </h2>
        <p className="text-blue-100 text-sm sm:text-base">Integrated Applications System Dashboard</p>
      </div>

      {/* System Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {systems.map((system) => {
          const Icon = system.icon;
          const PlatformIcon = getPlatformIcon(system.platform);
          const canWrite = hasAccess(system.id, 'write');
          const canAdmin = hasAccess(system.id, 'admin');
          
          return (
            <div
              key={system.id}
              className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 touch-manipulation ${
                canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
              onClick={() => setActiveSystem(system.id)}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getColorClasses(system.color)}`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{system.name}</h3>
                        <div className="flex items-center space-x-1">
                          <PlatformIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          <span className="text-xs text-gray-400 capitalize">{system.platform}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 leading-tight">{system.fullName}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
                
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{system.description}</p>
                
                {/* Permission indicators */}
                <div className="flex items-center space-x-2 mb-3">
                  {hasAccess(system.id, 'read') && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Read
                    </span>
                  )}
                  {hasAccess(system.id, 'write') && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Write
                    </span>
                  )}
                  {hasAccess(system.id, 'admin') && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </div>
                
                {/* System-specific stats */}
                <div className="flex justify-between text-xs sm:text-sm flex-wrap gap-2">
                  {system.id === 'erms' && (
                    <>
                      <span className="text-gray-500">Total: <strong>{system.stats.total}</strong></span>
                      <span className="text-orange-600">Upcoming: <strong>{system.stats.upcoming}</strong></span>
                      <span className="text-green-600">Processed: <strong>{system.stats.processed}</strong></span>
                    </>
                  )}
                  {system.id === 'estimate' && (
                    <>
                      <span className="text-gray-500">Draft: <strong>{system.stats.draft}</strong></span>
                      <span className="text-orange-600">Pending: <strong>{system.stats.pending}</strong></span>
                      <span className="text-green-600">Approved: <strong>{system.stats.approved}</strong></span>
                    </>
                  )}
                  {system.id === 'inspection' && (
                    <>
                      <span className="text-blue-600">This Month: <strong>{system.stats.thisMonth}</strong></span>
                      <span className="text-orange-600">Pending: <strong>{system.stats.pending}</strong></span>
                      <span className="text-green-600">Completed: <strong>{system.stats.completed}</strong></span>
                    </>
                  )}
                  {system.id === 'pesa' && (
                    <>
                      <span className="text-blue-600">Allocated: <strong>{system.stats.allocated}</strong></span>
                      <span className="text-green-600">Utilized: <strong>{system.stats.utilized}</strong></span>
                      <span className="text-gray-600">Villages: <strong>{system.stats.villages}</strong></span>
                    </>
                  )}
                </div>
                
                {/* Mobile App Badge */}
                {system.platform === 'mobile' && (
                  <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📱 Mobile App
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {hasAccess('estimate', 'write') && (
            <button className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-center">New Estimate</span>
            </button>
          )}
          {hasAccess('inspection', 'write') && (
            <button className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-center">Field Visit</span>
            </button>
          )}
          {hasAccess('erms', 'read') && (
            <button className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-center">Employee Data</span>
            </button>
          )}
          {hasAccess('pesa', 'read') && (
            <button className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-center">Fund Tracking</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderERMS = () => (
    <PermissionGuard user={user} application="erms" permission="read">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Retirement Management System</h2>
          <p className="text-gray-600 text-sm sm:text-base">Track and manage employee retirement data</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {hasAccess('erms', 'write') && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base">
              <Plus className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Add Employee</span>
            </button>
          )}
          <button className="border border-gray-300 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base">
            <Download className="h-4 w-4 sm:h-4 sm:w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Employees</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">1,245</p>
            </div>
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Retiring in 6 Months</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">45</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Processed This Month</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">12</p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Pending Actions</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">8</p>
            </div>
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg border">
        <div className="p-3 sm:p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold">Employees Retiring Soon</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                />
              </div>
              <button className="border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-center">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Employee ID</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Name</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900 hidden sm:table-cell">Department</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Retirement Date</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Status</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">EMP00{i}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">Employee Name {i}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">Department {i}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">2024-0{i + 6}-15</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );

  const renderEstimate = () => (
    <PermissionGuard user={user} application="estimate" permission="read">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Electronic Estimation System</h2>
          <p className="text-gray-600 text-sm sm:text-base">Create, manage, and track project estimates with workflow</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {hasAccess('estimate', 'write') && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base">
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">New Estimate</span>
            </button>
          )}
          <button className="border border-gray-300 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
            Templates
          </button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Estimate Workflow</h3>
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
          {[
            { step: 1, name: 'Basic Info', status: 'completed' },
            { step: 2, name: 'Work Details', status: 'completed' },
            { step: 3, name: 'Materials', status: 'current' },
            { step: 4, name: 'Labor', status: 'pending' },
            { step: 5, name: 'Review', status: 'pending' },
            { step: 6, name: 'Submit', status: 'pending' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
                item.status === 'completed' ? 'bg-green-600 text-white' :
                item.status === 'current' ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {item.status === 'completed' ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : item.step}
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{item.name}</span>
              {index < 5 && <div className="w-4 sm:w-8 h-px bg-gray-300 mx-2 sm:mx-4 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Estimates List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-lg border">
            <div className="p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Recent Estimates</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { id: 'EST001', name: 'Road Construction Project', status: 'Draft', amount: '₹5,00,000', date: '2024-01-15' },
                { id: 'EST002', name: 'School Building Renovation', status: 'Pending Approval', amount: '₹3,50,000', date: '2024-01-14' },
                { id: 'EST003', name: 'Water Supply System', status: 'Approved', amount: '₹7,25,000', date: '2024-01-13' },
                { id: 'EST004', name: 'Community Center', status: 'In Progress', amount: '₹4,80,000', date: '2024-01-12' }
              ].map((estimate) => (
                <div key={estimate.id} className="p-3 sm:p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">{estimate.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">ID: {estimate.id}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Created: {estimate.date}</p>
                    </div>
                    <div className="flex sm:flex-col sm:text-right items-center sm:items-end space-x-3 sm:space-x-0 sm:space-y-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{estimate.amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        estimate.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        estimate.status === 'Pending Approval' ? 'bg-orange-100 text-orange-800' :
                        estimate.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {estimate.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">Edit</button>
                    <button className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium">View PDF</button>
                    <button className="text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-medium">Duplicate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Total Estimates</span>
                <span className="font-semibold text-sm">46</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Draft</span>
                <span className="font-semibold text-gray-600 text-sm">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Pending</span>
                <span className="font-semibold text-orange-600 text-sm">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Approved</span>
                <span className="font-semibold text-green-600 text-sm">23</span>
              </div>
            </div>
          </div>

          {/* MD Completion */}
          <div className="bg-white rounded-lg border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">MD Completion</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Track actual work completion against estimates</p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm sm:text-base">
              View MD Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );

  const renderInspection = () => (
    <PermissionGuard user={user} application="inspection" permission="read">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Field Inspection Management System</h2>
          <p className="text-gray-600 text-sm sm:text-base">Conduct field visits and manage inspection transparency</p>
          <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            📱 Mobile App Available
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {hasAccess('inspection', 'write') && (
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base">
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">New Inspection</span>
            </button>
          )}
          <button className="border border-gray-300 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
            Monthly Report
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">This Month</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">28</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Completed</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">23</p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">5</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Target Achievement</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">92%</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Inspection List */}
      <div className="bg-white rounded-lg border">
        <div className="p-3 sm:p-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold">Recent Inspections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { id: 'INS001', location: 'Village Chandrapur', inspector: 'John Doe', date: '2024-01-15', status: 'Completed', photos: 8 },
            { id: 'INS002', location: 'Wardha Road Project', inspector: 'Jane Smith', date: '2024-01-14', status: 'In Progress', photos: 5 },
            { id: 'INS003', location: 'School Building Site', inspector: 'Mike Johnson', date: '2024-01-13', status: 'Completed', photos: 12 },
            { id: 'INS004', location: 'Water Tank Construction', inspector: 'Sarah Wilson', date: '2024-01-12', status: 'Pending Review', photos: 6 }
          ].map((inspection) => (
            <div key={inspection.id} className="p-3 sm:p-4 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-gray-900">{inspection.location}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Inspector: {inspection.inspector}</p>
                  <p className="text-xs sm:text-sm text-gray-500">Date: {inspection.date}</p>
                  <p className="text-xs sm:text-sm text-gray-500">Photos: {inspection.photos}</p>
                </div>
                <div className="flex sm:justify-end">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    inspection.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    inspection.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {inspection.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">View Details</button>
                <button className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium">View Photos</button>
                <button className="text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-medium">Download Report</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </PermissionGuard>
  );

  const renderPESA = () => (
    <PermissionGuard user={user} application="pesa" permission="read">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">PESA 5% Fund Management System</h2>
          <p className="text-gray-600 text-sm sm:text-base">Track and manage PESA fund utilization with compliance monitoring</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {hasAccess('pesa', 'write') && (
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base">
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">Add Transaction</span>
            </button>
          )}
          <button className="border border-gray-300 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
            Compliance Report
          </button>
        </div>
      </div>

      {/* Fund Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Allocated</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">₹2.5Cr</p>
            </div>
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Utilized</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">₹1.8Cr</p>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Remaining</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">₹70L</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Villages</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">45</p>
            </div>
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Component-wise Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Component-wise Utilization</h3>
          <div className="space-y-4">
            {[
              { name: 'Infrastructure', allocated: 40, used: 35, limit: 40 },
              { name: 'Social Development', allocated: 30, used: 28, limit: 30 },
              { name: 'Economic Development', allocated: 20, used: 18, limit: 25 },
              { name: 'Administrative', allocated: 10, used: 8, limit: 15 }
            ].map((component) => (
              <div key={component.name}>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="font-medium">{component.name}</span>
                  <span>{component.used}% / {component.limit}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      component.used > component.limit ? 'bg-red-600' : 
                      component.used > component.limit * 0.8 ? 'bg-orange-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${(component.used / component.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Compliance Issues</h3>
          <div className="space-y-3">
            {[
              { village: 'Chandrapur', issue: 'Infrastructure exceeding 40% limit', severity: 'high' },
              { village: 'Wardha', issue: 'Missing Village Development Plan', severity: 'medium' },
              { village: 'Nagpur', issue: 'Transaction after committee term', severity: 'high' },
              { village: 'Amravati', issue: 'Gram Sabha approval pending', severity: 'low' }
            ].map((issue, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${
                  issue.severity === 'high' ? 'text-red-600' :
                  issue.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                }`} />
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-900">{issue.village}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{issue.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border">
        <div className="p-3 sm:p-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Village</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900 hidden sm:table-cell">Component</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Amount</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900 hidden sm:table-cell">Date</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Status</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { village: 'Chandrapur', component: 'Infrastructure', amount: '₹2,50,000', date: '2024-01-15', status: 'Approved' },
                { village: 'Wardha', component: 'Social Development', amount: '₹1,80,000', date: '2024-01-14', status: 'Pending' },
                { village: 'Nagpur', component: 'Economic Development', amount: '₹3,20,000', date: '2024-01-13', status: 'Under Review' },
                { village: 'Amravati', component: 'Administrative', amount: '₹95,000', date: '2024-01-12', status: 'Approved' }
              ].map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{transaction.village}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{transaction.component}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{transaction.amount}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{transaction.date}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );

  const renderContent = () => {
    switch (activeSystem) {
      case 'erms':
        return renderERMS();
      case 'estimate':
        return renderEstimate();
      case 'inspection':
        return renderInspection();
      case 'pesa':
        return renderPESA();
      default:
        return renderOverview();
    }
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setActiveSystem('overview')}
                className="text-base sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
              >
                ZP Chandrapur - Integrated Applications System
              </button>
              {activeSystem !== 'overview' && (
                <span className="text-gray-400 text-sm sm:text-base hidden sm:inline">
                  / {systems.find(s => s.id === activeSystem)?.name}
                </span>
              )}
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative user-profile-dropdown">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-md hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2">
                  {/* Language Switcher */}
                  <LanguageSwitcher />
                  
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.email?.split('@')[0]}</p>
                    {userRole && (
                      <p className="text-xs text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.email?.split('@')[0] || 'User'}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        {userRole && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {userRole.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System Access Details */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">System Access</h4>
                    <div className="space-y-3">
                      {systems.map((system) => {
                        const Icon = system.icon;
                        const permissions = [];
                        if (hasAccess(system.id, 'read')) permissions.push('Read');
                        if (hasAccess(system.id, 'write')) permissions.push('Write');
                        if (hasAccess(system.id, 'delete')) permissions.push('Delete');
                        if (hasAccess(system.id, 'admin')) permissions.push('Admin');
                        
                        return (
                          <div key={system.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-1.5 rounded ${getColorClasses(system.color)}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{system.name}</p>
                                <div className="flex items-center space-x-1">
                                  {system.platform === 'mobile' && (
                                    <Smartphone className="h-3 w-3 text-gray-400" />
                                  )}
                                  {system.platform === 'web' && (
                                    <Monitor className="h-3 w-3 text-gray-400" />
                                  )}
                                  <span className="text-xs text-gray-500 capitalize">{system.platform}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {permissions.map((permission) => (
                                <span
                                  key={permission}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    permission === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                    permission === 'Delete' ? 'bg-red-100 text-red-800' :
                                    permission === 'Write' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>User ID:</strong> {user.id.slice(0, 8)}...</p>
                      <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <div className="p-4 border-t">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t bg-white">
            <div className="px-3 py-2 space-y-1">
              <button
                onClick={() => {
                  setActiveSystem('overview');
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeSystem === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              {systems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => {
                    setActiveSystem(system.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeSystem === system.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{system.name}</span>
                    <div className="flex items-center space-x-1">
                      {system.platform === 'mobile' && (
                        <Smartphone className="h-3 w-3 text-gray-400" />
                      )}
                      {hasAccess(system.id, 'admin') && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Admin</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Navigation */}
      {activeSystem !== 'overview' && (
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveSystem('overview')}
                className="py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
              >
                Overview
              </button>
              {systems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => setActiveSystem(system.id)}
                  className={`py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeSystem === system.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{system.name}</span>
                    <div className="flex items-center space-x-1">
                      {system.platform === 'mobile' && (
                        <Smartphone className="h-3 w-3" />
                      )}
                      {hasAccess(system.id, 'admin') && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">A</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {renderContent()}
      </main>
    </div>
  );
};