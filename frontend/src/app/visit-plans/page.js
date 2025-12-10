'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import VisitPlanModal from '../../components/visitPlans/VisitPlanModal';
import { Search, Filter, X } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function VisitPlansPage() {
  const [visitPlans, setVisitPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    userId: '',
    startDate: '',
    endDate: '',
    searchCustomer: ''
  });

  const { user } = useAuthStore();

  // State for modal confirmation delete
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    planId: null,
    message: ''
  });

  useEffect(() => {
    fetchVisitPlans();
    fetchCustomers();
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      fetchUsers();
    }
  }, [filters]);

  const fetchVisitPlans = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;

      const response = await api.get('/visit-plans', { params });
      let filteredPlans = response.data.data;

      if (filters.customerId) {
        filteredPlans = filteredPlans.filter(p => p.customerId === filters.customerId);
      }
      if (filters.userId && (user?.role === 'ADMIN' || user?.role === 'MANAGER')) {
        filteredPlans = filteredPlans.filter(p => p.userId === filters.userId);
      }
      if (filters.startDate) {
        filteredPlans = filteredPlans.filter(p => {
          const visitDate = new Date(p.tanggalVisit);
          return visitDate >= new Date(filters.startDate);
        });
      }
      if (filters.endDate) {
        filteredPlans = filteredPlans.filter(p => {
          const visitDate = new Date(p.tanggalVisit);
          return visitDate <= new Date(filters.endDate);
        });
      }
      if (filters.searchCustomer) {
        filteredPlans = filteredPlans.filter(p =>
          p.customer?.namaCustomer?.toLowerCase().includes(filters.searchCustomer.toLowerCase())
        );
      }
      setVisitPlans(filteredPlans);
    } catch (error) {
      toast.error('Failed to fetch visit plans');
      console.error('Failed to fetch visit plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers',{ params: { limit: 2000 } });
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Failed to fetch users:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customerId: '',
      userId: '',
      startDate: '',
      endDate: '',
      searchCustomer: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const canEditVisitPlan = (plan) => {
    if (user?.role === 'ADMIN') return true;
    if (plan.userId !== user?.id) return false;

    const visitDate = new Date(plan.tanggalVisit);
    visitDate.setHours(23, 59, 59, 999);
    const lockDate = new Date(visitDate.getTime() + (48 * 60 * 60 * 1000));
    const now = new Date();

    return now <= lockDate;
  };

  const canDeleteVisitPlan = (plan) => {
    if (user?.role === 'ADMIN') return true;
    return plan.userId === user?.id;
  };

  const getTimeRemaining = (plan) => {
    if (user?.role === 'ADMIN') return null;
    if (plan.userId !== user?.id) return null;

    const visitDate = new Date(plan.tanggalVisit);
    visitDate.setHours(23, 59, 59, 999);
    const lockDate = new Date(visitDate.getTime() + (48 * 60 * 60 * 1000));
    const now = new Date();
    const hoursRemaining = (lockDate - now) / (1000 * 60 * 60);

    if (hoursRemaining <= 0) return 0;
    return Math.floor(hoursRemaining);
  };

  // Show modern confirmation modal for delete
  const showDeleteConfirm = (plan) => {
    if (!canDeleteVisitPlan(plan)) {
      toast.error('You do not have permission to delete this visit plan.');
      return;
    }
    setConfirmDelete({
      show: true,
      planId: plan.id,
      message: `Are you sure you want to delete this visit plan for ${plan.customer?.namaCustomer || '-'}? This action cannot be undone.`
    });
  };

  // Perform deletion after confirmation
  const handleDelete = async () => {
    const id = confirmDelete.planId;
    setConfirmDelete({ show: false, planId: null, message: '' });

    try {
      await api.delete(`/visit-plans/${id}`);
      toast.success('Visit plan deleted successfully!');
      fetchVisitPlans();
    } catch (error) {
      toast.error(`Failed to delete: ${error.response?.data?.message || error.message}`);
      console.error('Error deleting visit plan:', error);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ show: false, planId: null, message: '' });
  };

  const handleAdd = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan) => {
    if (!canEditVisitPlan(plan)) {
      toast.error('You cannot edit this visit plan. Time limit exceeded or insufficient permissions.');
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedPlan) {
        await api.put(`/visit-plans/${selectedPlan.id}`, formData);
      } else {
        await api.post('/visit-plans', formData);
      }

      setIsModalOpen(false);
      fetchVisitPlans();
    } catch (error) {
      toast.error(`Failed to save: ${error.response?.data?.message || error.message}`);
      console.error('Error saving visit plan:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PLANNED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportExcel = () => {
    if (visitPlans.length === 0) {
      toast.error('No data to export');
      return;
    }

    const excelData = visitPlans.map((plan, index) => ({
      'No': index + 1,
      'Customer': plan.customer?.namaCustomer || '-',
      'Sales Person': plan.user?.namaLengkap || '-',
      'Visit Date': formatDate(plan.tanggalVisit),
      'Purpose': plan.tujuanVisit || '-',
      'Program': plan.programPembahasan || '-',
      'Revenue Target': plan.revenueTarget ? parseFloat(plan.revenueTarget) : 0,
      'Status': plan.status
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 40 },
      { wch: 40 },
      { wch: 18 },
      { wch: 12 }
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visit Plans');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Visit_Plans_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Visit Plans" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Visit Plans</h2>
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                disabled={visitPlans.length === 0 || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Visit Plan
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Customer
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type customer name..."
                    value={filters.searchCustomer}
                    onChange={(e) => handleFilterChange('searchCustomer', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="PLANNED">Planned</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  value={filters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Customers</option>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.namaCustomer}</option>
                  ))}
                </select>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Person
                  </label>
                  <select
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Sales</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.namaLengkap}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Sales</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Visit Date</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Purpose</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Revenue Target</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : visitPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      {hasActiveFilters ? 'No visit plans match your filters.' : 'No visit plans found. Click "+ Add Visit Plan" to create one.'}
                    </td>
                  </tr>
                ) : (
                  visitPlans.map((plan) => {
                    const timeRemaining = getTimeRemaining(plan);
                    const canEdit = canEditVisitPlan(plan);
                    const canDelete = canDeleteVisitPlan(plan);

                    return (
                      <tr key={plan.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">{plan.customer?.namaCustomer || '-'}</td>
                        <td className="py-4 px-6">{plan.user?.namaLengkap || '-'}</td>
                        <td className="py-4 px-6">{formatDate(plan.tanggalVisit)}</td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs truncate">{plan.tujuanVisit}</div>
                          {timeRemaining !== null && timeRemaining > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              Edit available for {timeRemaining}h after visit
                            </div>
                          )}
                          {timeRemaining === 0 && user?.role !== 'ADMIN' && plan.userId === user?.id && (
                            <div className="text-xs text-gray-500 mt-1">
                              Edit time expired (48h after visit)
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">{plan.kategori || '-'}</td>
                        <td className="py-4 px-6">{formatCurrency(plan.revenueTarget)}</td>
                        <td className="py-4 px-6">{getStatusBadge(plan.status)}</td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {canEdit ? (
                            <button
                              className="text-blue-600 hover:text-blue-800 mr-3"
                              onClick={() => handleEdit(plan)}
                            >
                              Edit
                            </button>
                          ) : (
                            <span className="text-gray-400 mr-3 cursor-not-allowed" title="Cannot edit">
                              Edit
                            </span>
                          )}

                          {canDelete ? (
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => showDeleteConfirm(plan)}
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-gray-400 cursor-not-allowed" title="Cannot delete">
                              Delete
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <VisitPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        visitPlan={selectedPlan}
        onSave={handleSave}
        customers={customers}
      />

      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <p className="whitespace-pre-line text-gray-800">{confirmDelete.message}</p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
