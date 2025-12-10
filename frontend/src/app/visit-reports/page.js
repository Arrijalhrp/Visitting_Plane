"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import VisitReportModal from "../../components/visitReports/VisitReportModal";
import { Search, Filter, X } from "lucide-react";
import api from "../../lib/api";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

export default function VisitReportsPage() {
  const [reports, setReports] = useState([]);
  const [visitPlans, setVisitPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    statusRealisasi: "",
    hasilVisit: "",
    kategori: "",
    customerId: "",
    userId: "",
    startDate: "",
    endDate: "",
    searchCustomer: "",
  });

  const { user } = useAuthStore();

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    reportId: null,
  });

  useEffect(() => {
    fetchReports();
    fetchVisitPlans();
    fetchCustomers();
    if (user?.role === "ADMIN" || user?.role === "MANAGER") {
      fetchUsers();
    }
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.statusRealisasi)
        params.statusRealisasi = filters.statusRealisasi;
      if (filters.hasilVisit) params.hasilVisit = filters.hasilVisit;

      const response = await api.get("/visit-reports", { params });
      let filteredReports = response.data.data;

      if (filters.kategori) {
        filteredReports = filteredReports.filter(
          (r) => r.kategori === filters.kategori
        );
      }
      if (filters.customerId) {
        filteredReports = filteredReports.filter(
          (r) => r.visitPlan?.customerId === filters.customerId
        );
      }
      if (
        filters.userId &&
        (user?.role === "ADMIN" || user?.role === "MANAGER")
      ) {
        filteredReports = filteredReports.filter(
          (r) => r.visitPlan?.userId === filters.userId
        );
      }
      if (filters.startDate) {
        filteredReports = filteredReports.filter((r) => {
          const visitDate = new Date(r.visitPlan?.tanggalVisit);
          return visitDate >= new Date(filters.startDate);
        });
      }
      if (filters.endDate) {
        filteredReports = filteredReports.filter((r) => {
          const visitDate = new Date(r.visitPlan?.tanggalVisit);
          return visitDate <= new Date(filters.endDate);
        });
      }
      if (filters.searchCustomer) {
        filteredReports = filteredReports.filter((r) =>
          r.visitPlan?.customer?.namaCustomer
            ?.toLowerCase()
            .includes(filters.searchCustomer.toLowerCase())
        );
      }
      setReports(filteredReports);
    } catch (error) {
      toast.error("Failed to fetch reports");
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitPlans = async () => {
    try {
      const response = await api.get("/visit-plans");
      const filteredPlans = response.data.data.filter(
        (plan) => plan.status === "COMPLETED" || plan.status === "PLANNED"
      );
      setVisitPlans(filteredPlans);
    } catch (error) {
      toast.error("Failed to fetch visit plans");
      console.error("Failed to fetch visit plans:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch customers");
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Failed to fetch users:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      statusRealisasi: "",
      hasilVisit: "",
      kategori: "",
      customerId: "",
      userId: "",
      startDate: "",
      endDate: "",
      searchCustomer: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const canEditReport = (report) => {
    if (user?.role === "ADMIN") return true;
    return report.visitPlan?.userId === user?.id;
  };

  const canDeleteReport = (report) => {
    return user?.role === "ADMIN";
  };

  const showDeleteConfirm = (report) => {
    if (!canDeleteReport(report)) {
      toast.error("You do not have permission to delete this report.");
      return;
    }
    setConfirmDelete({
      show: true,
      reportId: report.id,
    });
  };

  const handleDelete = async () => {
    const id = confirmDelete.reportId;
    setConfirmDelete({ show: false, reportId: null });

    try {
      await api.delete(`/visit-reports/${id}`);
      toast.success("Report deleted successfully!");
      fetchReports();
      fetchVisitPlans();
    } catch (error) {
      toast.error(
        `Failed to delete: ${error.response?.data?.message || error.message}`
      );
      console.error("Error deleting report:", error);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ show: false, reportId: null });
  };

  const handleAdd = () => {
    setSelectedReport(null);
    setIsModalOpen(true);
  };

  const handleEdit = (report) => {
    if (!canEditReport(report)) {
      toast.error("You do not have permission to edit this report.");
      return;
    }
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedReport) {
        await api.put(`/visit-reports/${selectedReport.id}`, formData);
      } else {
        await api.post("/visit-reports", formData);
      }

      setIsModalOpen(false);
      fetchReports();
      fetchVisitPlans();
    } catch (error) {
      toast.error(
        `Failed to save: ${error.response?.data?.message || error.message}`
      );
      console.error("Error saving report:", error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      TEREALISASI: "bg-green-100 text-green-800",
      TIDAK_TEREALISASI: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getKategoriBadge = (kategori) => {
    if (!kategori) return "-";
    const styles = {
      HUNTING: "bg-red-100 text-red-800",
      FARMING: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[kategori]}`}
      >
        {kategori}
      </span>
    );
  };

  const getResultBadge = (result) => {
    if (!result) return "-";
    const styles = {
      DEAL: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      REJECT: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[result]}`}
      >
        {result}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleExportExcel = () => {
    if (reports.length === 0) {
      toast.error("No data to export");
      return;
    }
    const excelData = reports.map((report, index) => ({
      No: index + 1,
      Customer: report.visitPlan?.customer?.namaCustomer || "-",
      Category: report.kategori || "-",
      "Sales Person": report.visitPlan?.user?.namaLengkap || "-",
      "Visit Date": formatDate(report.visitPlan?.tanggalVisit),
      Status: report.statusRealisasi.replace("_", " "),
      Result: report.hasilVisit || "-",
      "PIC Follow Up": report.pic || "-",
      "CP PIC": report.cpPic || "-",
      "Revenue Actual": report.revenueActual
        ? parseFloat(report.revenueActual)
        : 0,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visit Reports");
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Visit_Reports_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Visit Reports" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Visit Reports</h2>
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                disabled={reports.length === 0 || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export to Excel
              </button>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Report
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
                    onChange={(e) =>
                      handleFilterChange("searchCustomer", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.kategori}
                  onChange={(e) =>
                    handleFilterChange("kategori", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="HUNTING">Hunting</option>
                  <option value="FARMING">Farming</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.statusRealisasi}
                  onChange={(e) =>
                    handleFilterChange("statusRealisasi", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="TEREALISASI">Terealisasi</option>
                  <option value="TIDAK_TEREALISASI">Tidak Terealisasi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                   Result
                </label>
                <select
                  value={filters.hasilVisit}
                  onChange={(e) =>
                    handleFilterChange("hasilVisit", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Results</option>
                  <option value="DEAL">Deal</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  value={filters.customerId}
                  onChange={(e) =>
                    handleFilterChange("customerId", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Customers</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.namaCustomer}
                    </option>
                  ))}
                </select>
              </div>
              {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Person
                  </label>
                  <select
                    value={filters.userId}
                    onChange={(e) =>
                      handleFilterChange("userId", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Sales</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.namaLengkap}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {reports.length}
                  </span>{" "}
                  reports
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Customer
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Category
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    PIC Follow Up
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    CP PIC
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Sales
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Visit Date
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Visit Result
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                    Revenue Actual
                  </th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-gray-500">
                      {hasActiveFilters
                        ? "No reports match your filters."
                        : 'No reports found. Click "+ Add Report" to create one.'}
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const canEdit = canEditReport(report);
                    const canDelete = canDeleteReport(report);

                    return (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">
                          {report.visitPlan?.customer?.namaCustomer || "-"}
                        </td>
                        <td className="py-4 px-6">
                          {getKategoriBadge(report.kategori)}
                        </td>
                        <td className="py-4 px-6">{report.pic || "-"}</td>
                        <td className="py-4 px-6">{report.cpPic || "-"}</td>
                        <td className="py-4 px-6">
                          {report.visitPlan?.user?.namaLengkap || "-"}
                        </td>
                        <td className="py-4 px-6">
                          {formatDate(report.visitPlan?.tanggalVisit)}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(report.statusRealisasi)}
                        </td>
                        <td className="py-4 px-6">
                          {getResultBadge(report.hasilVisit)}
                        </td>
                        <td className="py-4 px-6">
                          {formatCurrency(report.revenueActual)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {canEdit ? (
                            <button
                              className="text-blue-600 hover:text-blue-800 mr-3"
                              onClick={() => handleEdit(report)}
                            >
                              Edit
                            </button>
                          ) : (
                            <span
                              className="text-gray-400 mr-3 cursor-not-allowed"
                              title="Cannot edit"
                            >
                              Edit
                            </span>
                          )}
                          {canDelete ? (
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => showDeleteConfirm(report)}
                            >
                              Delete
                            </button>
                          ) : (
                            <span
                              className="text-gray-400 cursor-not-allowed"
                              title="Admin only"
                            >
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

        <VisitReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={selectedReport}
        onSave={handleSave}
        visitPlans={visitPlans}
      />

        {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <p className="whitespace-pre-line text-gray-800">
              Are you sure you want to delete this report? This action cannot be
              undone.
            </p>
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
