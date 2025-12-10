'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import UserModal from '../../components/users/userModal';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not ADMIN
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [currentUser, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedUser) {
        // Update
        await api.put(`/users/${selectedUser.id}`, formData);
      } else {
        // Create
        await api.post('/users', formData);
      }
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Failed to save: ${error.response?.data?.message || error.message}`);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      USER: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[role]}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading or redirect
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header title="User Management" />
        
        <main className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add User
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Username</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Full Name</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Manager</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No users found. Click "+ Add User" to create one.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium">{user.username}</td>
                      <td className="py-4 px-6">{user.namaLengkap}</td>
                      <td className="py-4 px-6">{user.email}</td>
                      <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                      <td className="py-4 px-6">
                        {user.manager ? user.manager.namaLengkap : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button 
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        {user.id !== currentUser.id && (
                          <button 
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSave}
        managers={users}
      />
    </div>
  );
}
