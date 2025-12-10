'use client';

import { useEffect, useState } from 'react';
import Select from 'react-select';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import StatsCard from '../../components/common/StatsCard';
import { Users, CalendarCheck, FileText, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
  });
  const [users, setUsers] = useState([]);
  const { user } = useAuthStore();

  // Fetch user list for filter (only admin/manager)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users', { params: { role: 'USER' } });
        setUsers(res.data.data);
      } catch (e) {
        setUsers([]);
      }
    };
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      fetchUsers();
    }
  }, [user]);

  // Fetch dashboard summary with filter
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/summary', {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            filterUserId: filters.userId,
          },
        });
        setStats(response.data.data.summary);
        setRecentVisits(response.data.data.recentVisits || []);
      } catch (error) {
        setStats(null);
        setRecentVisits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [filters]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Dashboard" />

        <main className="p-8">
          {/* FILTER PANEL */}
          <div className="flex flex-wrap items-end gap-6 mb-6 bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={filters.startDate}
                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">End Date</label>
              <input
                type="date"
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                value={filters.endDate}
                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <div className="min-w-[220px]">
                <label className="block text-sm text-gray-700 font-medium mb-1">Sales Person</label>
                <Select
                  placeholder="All Users"
                  isClearable
                  options={users.map(u => ({ value: u.id, label: u.namaLengkap }))}
                  value={users.length ? users.map(u => ({ value: u.id, label: u.namaLengkap })).find(opt => opt.value === filters.userId) : null}
                  onChange={selected => setFilters(f => ({ ...f, userId: selected ? selected.value : '' }))}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            )}
            <button
              className="mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={() => setFilters({ startDate: '', endDate: '', userId: '' })}
            >
              Reset Filters
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading dashboard data...</div>
            </div>
          ) : (
            <>
              {/* Stats Cards Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatsCard title="Total New Customers" value={stats?.totalCustomers || 0} icon={Users} color="blue" />
                <StatsCard title="Total Visit Plans" value={stats?.totalVisitPlans || 0} icon={CalendarCheck} color="green" />
                <StatsCard title="Completed Visits" value={stats?.completedVisits || 0} icon={FileText} color="purple" />
                <StatsCard title="Revenue Achievement" value={`${stats?.revenueAchievement || 0}%`} icon={TrendingUp} color="orange" />
              </div>
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Target vs Actual */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Target Revenue</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(stats?.totalRevenueTarget || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Actual Revenue</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(stats?.totalRevenueActual || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats?.revenueAchievement || 0}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Achievement Rate</span>
                        <span className={`text-lg font-bold ${
                          parseFloat(stats?.revenueAchievement || 0) >= 100
                            ? 'text-green-600'
                            : parseFloat(stats?.revenueAchievement || 0) >= 75
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {stats?.revenueAchievement || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Category Performance (Hunting vs Farming) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                  <div className="space-y-4">
                    {/* Hunting */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">Hunting</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {stats?.huntingCount || 0} visits
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                        <span>Revenue</span>
                        <span className="font-medium">{formatCurrency(stats?.huntingRevenue || 0)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${((stats?.huntingRevenue || 0) / (stats?.totalRevenueActual || 1)) * 100}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                    {/* Farming */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">Farming</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {stats?.farmingCount || 0} visits
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                        <span>Revenue</span>
                        <span className="font-medium">{formatCurrency(stats?.farmingRevenue || 0)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${((stats?.farmingRevenue || 0) / (stats?.totalRevenueActual || 1)) * 100}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                    {/* Summary */}
                    <div className="pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Total Reports</p>
                          <p className="text-xl font-bold text-gray-900">
                            {(stats?.huntingCount || 0) + (stats?.farmingCount || 0)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency((stats?.huntingRevenue || 0) + (stats?.farmingRevenue || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Additional Info Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visit Status Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Planned</span>
                      </div>
                      <span className="font-semibold text-blue-600">{stats?.plannedVisits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Completed</span>
                      </div>
                      <span className="font-semibold text-green-600">{stats?.completedVisits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Cancelled</span>
                      </div>
                      <span className="font-semibold text-red-600">{stats?.cancelledVisits || 0}</span>
                    </div>
                  </div>
                </div>
                {/* Recent Activities */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Visit Plans</h3>
                  {recentVisits.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
                  ) : (
                    <div className="space-y-3">
                      {recentVisits.map((visit) => (
                        <div key={visit.id} className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {visit.customer?.namaCustomer || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {visit.user?.namaLengkap || 'N/A'} • {formatDate(visit.tanggalVisit)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            visit.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : visit.status === 'PLANNED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {visit.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
