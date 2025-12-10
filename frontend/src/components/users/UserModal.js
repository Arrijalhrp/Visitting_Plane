'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function UserModal({ isOpen, onClose, user, onSave, managers }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    namaLengkap: '',
    email: '',
    role: 'USER',
    managerId: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '', // Password always empty on edit
        namaLengkap: user.namaLengkap || '',
        email: user.email || '',
        role: user.role || 'USER',
        managerId: user.managerId || ''
      });
    } else {
      setFormData({
        username: '',
        password: '',
        namaLengkap: '',
        email: '',
        role: 'USER',
        managerId: ''
      });
    }
  }, [user, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.namaLengkap || !formData.email || !formData.role) {
      alert('Please fill all required fields');
      return;
    }

    // Password required for new user
    if (!user && !formData.password) {
      alert('Password is required for new user');
      return;
    }

    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!!user} // Disable on edit
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {user ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required={!user}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="namaLengkap"
              value={formData.namaLengkap}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="USER">User (Sales)</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Manager (only for USER & MANAGER roles) */}
          {(formData.role === 'USER' || formData.role === 'MANAGER') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Manager
              </label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Manager</option>
                {managers.filter(m => m.role === 'MANAGER' || m.role === 'ADMIN').map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.namaLengkap} ({manager.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
