'use client';

import { useState } from 'react';
// GANTI inipun import-nya, gunakan instance dari lib/api.js!
import api from '../../lib/api'; // pastikan path sesuai struktur mu

export default function ImportCustomersModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
5
  if (!isOpen) return null;

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert('Please select a file');
    console.log('DEBUG selected file:', file);
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
     // Debug: Cek formData
    for (const pair of formData.entries()) {
      console.log(`[DEBUG FormData] ${pair[0]}:`, pair[1]);
    }

    try {
      // PENTING: Jangan set headers Content-Type manual!
      const res = await api.post('/import/import-customers', formData);
      setResult(res.data);
    } catch (error) {
      setResult({ success: false, message: error.response?.data?.message || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Import Customers from Excel</h2>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={loading} />
        <div className="mt-4 flex justify-end gap-4">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={handleUpload} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {result && (
          <div className="mt-4 max-h-40 overflow-auto text-sm">
            {result.success ? (
              <>
                <p>Inserted rows: {result.inserted}</p>
                <ul className="list-disc pl-6">
                  {result.errors.length === 0 ? (
                    <li>No errors</li>
                  ) : (
                    result.errors.map((err, idx) => (
                      <li key={idx}>Row {err.row}: {err.message}</li>
                    ))
                  )}
                </ul>
              </>
            ) : (
              <p className="text-red-600">Error: {result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
