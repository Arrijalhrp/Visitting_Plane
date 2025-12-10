"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import CustomerModal from "../../components/customers/CustomerModal";
import ImportCustomersModal from "../../components/customers/ImportCustomersModal";
import api from "../../lib/api";
import useAuthStore from "../../store/authStore";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Jika belum ada, install lucide-react

export default function CustomersPage({}) {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("asc");
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    customerId: null,
    message: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm, order]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = { search: searchTerm, page, order };
      const response = await api.get("/customers", { params });
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const showDeleteConfirm = async (id) => {
    try {
      const visitPlansResponse = await api.get("/visit-plans");
      const customerVisitPlans = visitPlansResponse.data.data.filter(
        (vp) => vp.customerId === id
      );
      const visitPlansCount = customerVisitPlans.length;

      let reportsCount = 0;
      if (visitPlansCount > 0) {
        const reportsResponse = await api.get("/visit-reports");
        const visitPlanIds = customerVisitPlans.map((vp) => vp.id);
        reportsCount = reportsResponse.data.data.filter((r) =>
          visitPlanIds.includes(r.visitPlanId)
        ).length;
      }

      let message = "";
      if (visitPlansCount > 0 || reportsCount > 0) {
        message = `⚠️ WARNING: This customer has related data that will be DELETED:\n\n`;
        if (visitPlansCount > 0) {
          message += `• ${visitPlansCount} Visit Plan(s)\n`;
        }
        if (reportsCount > 0) {
          message += `• ${reportsCount} Visit Report(s)\n`;
        }
        message += `\nThis action CANNOT be undone!\n\nAre you sure you want to delete this customer and all related data?`;
      } else {
        message = "Are you sure you want to delete this customer?";
      }

      setConfirmDelete({ show: true, customerId: id, message });
    } catch (error) {
      toast.error("Failed to prepare delete confirmation");
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete.customerId;
    setConfirmDelete({ show: false, customerId: null, message: "" });

    try {
      const response = await api.delete(`/customers/${id}`);

      if (response.data.deletedCounts) {
        const { visitPlans, reports } = response.data.deletedCounts;
        if (visitPlans > 0 || reports > 0) {
          toast.success(
            `Customer deleted! (${visitPlans} plans, ${reports} reports removed)`,
            { duration: 4000 }
          );
        } else {
          toast.success("Customer deleted successfully!");
        }
      } else {
        toast.success("Customer deleted successfully!");
      }

      fetchCustomers();
    } catch (error) {
      toast.error(
        `Failed to delete: ${error.response?.data?.message || error.message}`
      );
      console.error("Error deleting customer:", error);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ show: false, customerId: null, message: "" });
  };

  const handleSave = async (formData) => {
    try {
      if (selectedCustomer) {
        await api.put(`/customers/${selectedCustomer.id}`, formData);
        toast.success("Customer updated successfully!");
      } else {
        await api.post("/customers", formData);
        toast.success("Customer created successfully!");
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(
        `Failed to save: ${error.response?.data?.message || error.message}`
      );
      console.error("Error saving customer:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Header title="Customers" />

        <main className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers</h2>

          <div className="mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchCustomers();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customer by name..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
              <div className="flex gap-4 items-center mb-2">
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  style={{ minWidth: 120 }} // Agar lebar tidak terlalu kecil
                >
                  <option value="asc">Sort: A - Z</option>
                  <option value="desc">Sort: Z - A</option>
                </select>
              </div>

              {user?.role === "ADMIN" && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  type="button"
                >
                  Import Customers Excel
                </button>
              )}
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                + Add Customer
              </button>
            </form>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                Searching for:{" "}
                <span className="font-semibold">"{searchTerm}"</span>
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    NIP
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    Customer Name
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    Phone
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    Email
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    Address
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    PIC Name
                  </th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Searching...</span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      {searchTerm
                        ? `No customers found matching "${searchTerm}"`
                        : 'No customers found. Click "+ Add Customer" to create one.'}
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr key={cust.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6 whitespace-nowrap">
                        {cust.nipNas || "-"}
                      </td>
                      <td className="py-4 px-6 font-medium whitespace-nowrap">
                        {cust.namaCustomer || "-"}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {cust.telepon || "-"}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {cust.email || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="max-w-xs truncate" title={cust.alamat}>
                          {cust.alamat || "-"}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {cust.picName || "-"}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          onClick={() => handleEdit(cust)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => showDeleteConfirm(cust.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center mt-6 gap-2 select-none">
            <button
              onClick={() => setPage((page) => Math.max(1, page - 1))}
              disabled={page === 1}
              className={`flex items-center px-3 py-2 rounded-md font-medium transition
      ${
        page === 1
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-blue-600 text-white border border-gray-300 hover:bg-blue-50 hover:text-blue-700"
      }`}
              aria-label="Previous Page"
            >
              <ChevronLeft size={18} className="mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-700 px-2">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((page) => Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`flex items-center px-3 py-2 rounded-md font-medium transition
      ${
        page === totalPages
          ? "bg-gray-600 text-gray cursor-not-allowed"
          : "bg-blue-600 text-white border border-gray-300 hover:bg-blue-50 hover:text-blue-700"
      }`}
              aria-label="Next Page"
            >
              Next
              <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        </main>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleSave}
      />

      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <p className="whitespace-pre-line text-gray-800">
              {confirmDelete.message}
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

      {isImportModalOpen && (
        <ImportCustomersModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
}
