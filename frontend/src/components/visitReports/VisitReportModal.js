'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function VisitReportModal({ isOpen, onClose, report, onSave, visitPlans }) {
  const [formData, setFormData] = useState({
    visitPlanId: '',
    statusRealisasi: 'TEREALISASI',
    hasilVisit: '',
    kategori: '',
    revenueActual: '',
    pic: '',
    cpPic: '',
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);

  useEffect(() => {
    if (report) {
      setFormData({
        visitPlanId: report.visitPlanId || '',
        statusRealisasi: report.statusRealisasi || 'TEREALISASI',
        hasilVisit: report.hasilVisit || '',
        kategori: report.kategori || '',
        revenueActual: report.revenueActual || '',
        pic: report.pic || '',
        cpPic: report.cpPic || '',
      });
    } else {
      setFormData({
        visitPlanId: '',
        statusRealisasi: 'TEREALISASI',
        hasilVisit: '',
        kategori: '',
        revenueActual: '',
        pic: '',
        cpPic: '',
      });
    }
  }, [report, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.visitPlanId) {
      alert('Please select a visit plan');
      return;
    }
    if (!formData.pic) {
      alert('Please select PIC Follow Up');
      return;
    }
    if (!formData.cpPic) {
      alert('Please enter CP PIC');
      return;
    }
    const selectedPlan = visitPlans.find((p) => p.id === formData.visitPlanId);
    if (selectedPlan?.status === 'PLANNED') {
      setPendingSaveData(formData);
      setShowConfirm(true);
    } else {
      onSave(formData);
    }
  };

  const handleConfirmYes = () => {
    setShowConfirm(false);
    onSave({ ...pendingSaveData, updateVisitPlanStatus: true });
  };

  if (!isOpen) return null;

  const availablePlans = visitPlans.filter((plan) => {
    if (report) {
      return plan.id === report.visitPlanId;
    } else {
      const alreadyHasReport = !!plan.report;
      return (plan.status === 'COMPLETED' || plan.status === 'PLANNED') && !alreadyHasReport;
    }
  });

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold">{report ? 'Edit Visit Report' : 'Add New Visit Report'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} id="report-form">
              {/* 1. Visit Plan Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Visit Plan *</label>
                <select
                  name="visitPlanId"
                  value={formData.visitPlanId}
                  onChange={handleChange}
                  required
                  disabled={!!report}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Visit Plan</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.customer?.namaCustomer} - {new Date(plan.tanggalVisit).toLocaleDateString('id-ID')}
                    </option>
                  ))}
                </select>
                {!!report && <p className="text-xs text-gray-500 mt-1">Visit plan cannot be changed</p>}
                {!report && availablePlans.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No completed visit plans available. Complete a visit plan first.</p>
                )}
              </div>

              {/* 2. Category */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Category *</label>
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

              {/* 3. Realization Status */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Realization Status *</label>
                <select
                  name="statusRealisasi"
                  value={formData.statusRealisasi}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="TEREALISASI">Terealisasi</option>
                  <option value="TIDAK_TEREALISASI">Tidak Terealisasi</option>
                </select>
              </div>

              {/* 4. Visit Result (TEXT INPUT) */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Visit Result</label>
                <input
                  type="text"
                  name="hasilVisit"
                  value={formData.hasilVisit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Deal, Pending, Reject"
                />
              </div>

              {/* 5. PIC Follow Up (DROPDOWN) */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">PIC Follow Up *</label>
                <select
                  name="pic"
                  value={formData.pic}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select PIC Follow Up</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OFFICER">Officer</option>
                  <option value="SALES_ENGINEER">Sales Engineer</option>
                  <option value="SUPPORT_TIM">Support Tim</option>
                </select>
              </div>

              {/* 6. CP PIC */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">CP PIC *</label>
                <input
                  type="text"
                  name="cpPic"
                  value={formData.cpPic}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter CP PIC phone number"
                />
              </div>

              {/* 7. Actual Revenue */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Actual Revenue (Rp)</label>
                <input
                  type="number"
                  name="revenueActual"
                  value={formData.revenueActual}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 5000000"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="report-form"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!report && availablePlans.length === 0}
            >
              {report ? 'Update' : 'Create'}
            </button>
          </div>

          {/* Modal Konfirmasi */}
          {showConfirm && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white rounded p-6 max-w-xs w-full space-y-4 shadow-lg border text-center">
                <p>
                  Status visit plan masih <strong>PLANNED</strong>.<br />
                  Buat laporan visit dan sekaligus ubah status menjadi <strong>COMPLETED</strong>?
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmYes}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Ya, lanjutkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
