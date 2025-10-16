'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import StatsCard from '../../components/common/StatsCard';
import { Users, CalendarCheck, FileText, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth & check authentication
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setStats(response.data.data.summary);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header title="Dashboard" />
        
        <main className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Customers"
                  value={stats?.totalCustomers || 0}
                  icon={Users}
                  color="blue"
                />
                <StatsCard
                  title="Total Visit Plans"
                  value={stats?.totalVisitPlans || 0}
                  icon={CalendarCheck}
                  color="green"
                />
                <StatsCard
                  title="Completed Visits"
                  value={stats?.completedVisits || 0}
                  icon={FileText}
                  color="purple"
                />
                <StatsCard
                  title="Revenue Achievement"
                  value={`${stats?.revenueAchievement || 0}%`}
                  icon={TrendingUp}
                  color="orange"
                />
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visit Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Planned</span>
                      <span className="font-semibold text-blue-600">{stats?.plannedVisits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-green-600">{stats?.completedVisits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cancelled</span>
                      <span className="font-semibold text-red-600">{stats?.cancelledVisits || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Revenue Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Target</span>
                      <span className="font-semibold">
                        Rp {((stats?.totalRevenueTarget || 0) / 1000000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Actual</span>
                      <span className="font-semibold text-green-600">
                        Rp {((stats?.totalRevenueActual || 0) / 1000000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Achievement</span>
                      <span className="font-semibold text-blue-600">
                        {stats?.revenueAchievement || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
