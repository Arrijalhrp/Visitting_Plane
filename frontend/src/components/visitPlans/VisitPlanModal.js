'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Select from 'react-select';
import '../../app/globals.css';


export default function VisitPlanModal({ isOpen, onClose, visitPlan, onSave, customers }) {
  const [formData, setFormData] = useState({
    customerId: '',
    tanggalVisit: '',
    tujuanVisit: '',
    programPembahasan: '',
    revenueTarget: '',
    status: 'PLANNED',
    kategori: ''
  });

  useEffect(() => {
    if (visitPlan) {
      // Format date for input type="date"
      const date = new Date(visitPlan.tanggalVisit);
      const formattedDate = date.toISOString().split('T')[0];
      
      setFormData({
        customerId: visitPlan.customerId || '',
        tanggalVisit: formattedDate,
        tujuanVisit: visitPlan.tujuanVisit || '',
        programPembahasan: visitPlan.programPembahasan || '',
        revenueTarget: visitPlan.revenueTarget || '',
        status: visitPlan.status || 'PLANNED',
        kategori: visitPlan.kategori || ''
      });
    } else {
      setFormData({ 
        customerId: '',
        tanggalVisit: '',
        tujuanVisit: '',
        programPembahasan: '',
        revenueTarget: '',
        status: 'PLANNED',
        kategori: ''
      });
    }
  }, [visitPlan, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const customerOptions = customers.map(cust => ({
  value: cust.id,
  label: cust.namaCustomer,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {visitPlan ? 'Edit Visit Plan' : 'Add New Visit Plan'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} id="visitplan-form">
            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Customer *
              </label>
              <Select
                options={customerOptions}
                value={customerOptions.find(option => option.value === formData.customerId) || null}
                onChange={selected => setFormData({ ...formData, customerId: selected ? selected.value : '' })}
                placeholder="Search or select customer..."
                isClearable
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            
            {/* Kategori Visit */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category (Kategori) *
              </label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Category</option>
                <option value="HUNTING">Hunting</option>
                <option value="FARMING">Farming</option>
              </select>
            </div>

            {/* Tanggal Visit */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Visit Date *
              </label>
              <input
                type="date"
                name="tanggalVisit"
                value={formData.tanggalVisit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tujuan Visit */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Visit Purpose *
              </label>
              <textarea
                name="tujuanVisit"
                value={formData.tujuanVisit}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Describe the purpose of this visit"
              ></textarea>
            </div>

            {/* Program Pembahasan */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Discussion Program *
              </label>
              <textarea
                name="programPembahasan"
                value={formData.programPembahasan}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="What will be discussed"
              ></textarea>
            </div>

            {/* Revenue Target */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Revenue Target (Rp) *
              </label>
              <input
                type="number"
                name="revenueTarget"
                value={formData.revenueTarget}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g., 5000000"
              />
            </div>

            {/* Status (only show on EDIT) */}
            {visitPlan && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Change to "Completed" to create visit report
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="visitplan-form"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {visitPlan ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
