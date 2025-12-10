'use client';

import { useState, useEffect } from 'react';

export default function CustomerModal({ isOpen, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({
    namaCustomer: '',
    nipNas:'',
    alamat: '',
    telepon: '',
    email: '',
    picName: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        namaCustomer: customer.namaCustomer || '',
        nipNas: customer.nipNas || '',
        alamat: customer.alamat || '',
        telepon: customer.telepon || '',
        email: customer.email || '',
        picName: customer.picName || '',
      });
    } else {
      setFormData({ 
        namaCustomer: '', 
        nipNas: '',
        alamat: '', 
        telepon: '', 
        email: '', 
        picName: '' 
      });
    }
    setErrorMessage(''); // Reset error message tiap kali modal dibuka
  }, [customer, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(''); // Reset error message tiap input berubah
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();  // Tutup modal jika sukses
    } catch (error) {
      // Tangani error duplikat NIP NAS
      if (error.response?.status === 409 && error.response?.data?.message.includes('NIP NAS')) {
        setErrorMessage('NIP NAS sudah ada, mohon gunakan yang berbeda.');
      } else {
        setErrorMessage('Terjadi kesalahan saat menyimpan data.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} id="customer-form">
            {/* Nama Customer */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Customer Name *</label>
              <input
                type="text"
                name="namaCustomer"
                value={formData.namaCustomer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter customer name"
              />
            </div>

            {/* NIP NAS */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">NIP NAS *</label>
              <input
                type="text"
                name="nipNas"
                value={formData.nipNas}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter NIP NAS"
              />
            </div>

            {/* Alamat */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Address *</label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter address"
              ></textarea>
            </div>

            {/* Telepon */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Phone *</label>
              <input
                type="text"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter email address"
              />
            </div>

            {/* PIC Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">PIC Name</label>
              <input
                type="text"
                name="picName"
                value={formData.picName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter PIC name"
              />
            </div>
            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-600 mb-4 text-sm font-semibold">{errorMessage}</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="customer-form"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {customer ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
