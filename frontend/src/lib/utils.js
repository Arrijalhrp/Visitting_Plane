import { format } from "date-fns";

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date, formatStr = "dd MMM yyyy") => {
  if (!date) return "-";
  return format(new Date(date), formatStr);
};

export const getStatusColor = (status) => {
  const colors = {
    PLANNED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    AKTIF: "bg-green-100 text-green-800",
    TIDAK_AKTIF: "bg-gray-100 text-gray-800",
    TEREALISASI: "bg-green-100 text-green-800",
    TIDAK_TEREALISASI: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getRoleColor = (role) => {
  const colors = {
    ADMIN: "bg-purple-100 text-purple-800",
    MANAGER: "bg-blue-100 text-blue-800",
    USER: "bg-gray-100 text-gray-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
};

export const truncate = (str, length = 50) => {
  if (!str) return "-";
  return str.length > length ? str.substring(0, length) + "..." : str;
};
