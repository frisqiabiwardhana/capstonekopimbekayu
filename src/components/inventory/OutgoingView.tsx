import React, { useState } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  CheckCircle,
  Edit3,
  Search,
  Filter,
  AlertCircle,
  Check,
  Flame,
  Info,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { OutgoingTransaction } from '../../types/inventory';
import { formatDateIndo, formatKg } from '../../utils/inventoryRules';

export const OutgoingView: React.FC = () => {
  const {
    currentUser,
    materials,
    stockSummaries,
    outgoingList,
    addOutgoing,
    updateOutgoing,
    deleteOutgoing,
    verifyOutgoing
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form Modal State (for Operator Input)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    materialId: materials[0]?.id || '',
    quantityKg: '',
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    notes: ''
  });
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Correction Modal State (for Verifikator)
  const [editingItem, setEditingItem] = useState<OutgoingTransaction | null>(null);
  const [correctionData, setCorrectionData] = useState({
    quantityKg: 0,
    purpose: '',
    notes: ''
  });
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Full Edit Modal State (for Operator & Pemilik across all statuses)
  const [txToEdit, setTxToEdit] = useState<OutgoingTransaction | null>(null);
  const [txEditData, setTxEditData] = useState({
    materialId: '',
    quantityKg: '',
    date: '',
    purpose: '',
    notes: ''
  });
  const [txEditError, setTxEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [txToDelete, setTxToDelete] = useState<OutgoingTransaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Page-level feedback banner
  const [pageFeedback, setPageFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const isOperator = currentUser?.role === 'OPERATOR';
  const isVerifikator = currentUser?.role === 'VERIFIKATOR';
  const isOwner = currentUser?.role === 'PEMILIK';
  const canManageTransactions = isOperator || isOwner;

  // Available stock of selected material in modal
  const selectedMaterialStock = stockSummaries.find(s => s.materialId === formData.materialId);

  // Filtered list
  const filteredList = outgoingList.filter(item => {
    const matchesSearch =
      item.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMaterial = selectedMaterial === 'all' || item.materialId === selectedMaterial;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesMaterial && matchesStatus;
  });

  // Handle Submit New Outgoing (Operator)
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const targetMaterial = materials.find(m => m.id === formData.materialId);
    if (!targetMaterial) {
      setFormFeedback({ type: 'error', message: 'Pilih jenis bahan baku yang valid.' });
      return;
    }

    const qty = parseFloat(formData.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setFormFeedback({ type: 'error', message: 'Jumlah bahan keluar harus berupa angka lebih besar dari 0 kg.' });
      return;
    }

    if (!formData.purpose.trim()) {
      setFormFeedback({ type: 'error', message: 'Deskripsi / tujuan produksi wajib diisi.' });
      return;
    }

    const res = addOutgoing({
      date: formData.date,
      materialId: targetMaterial.id,
      materialName: targetMaterial.name,
      quantityKg: qty,
      purpose: formData.purpose.trim(),
      notes: formData.notes.trim()
    });

    if (res.success) {
      setFormFeedback({ type: 'success', message: res.message || 'Berhasil mencatat pengeluaran bahan baku!' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormFeedback(null);
        setFormData({
          materialId: materials[0]?.id || '',
          quantityKg: '',
          date: new Date().toISOString().split('T')[0],
          purpose: '',
          notes: ''
        });
      }, 1000);
    } else {
      setFormFeedback({ type: 'error', message: res.message || 'Gagal menyimpan transaksi.' });
    }
  };

  // Open Correction Modal (Verifikator)
  const handleOpenCorrection = (item: OutgoingTransaction) => {
    setEditingItem(item);
    setCorrectionError(null);
    setCorrectionData({
      quantityKg: item.quantityKg,
      purpose: item.purpose,
      notes: item.notes || ''
    });
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setCorrectionError(null);

    const res = updateOutgoing(editingItem.id, {
      quantityKg: correctionData.quantityKg,
      purpose: correctionData.purpose,
      notes: correctionData.notes
    });

    if (res.success) {
      setEditingItem(null);
      setPageFeedback({ type: 'success', message: res.message || 'Koreksi data keluar berhasil disimpan.' });
    } else {
      setCorrectionError(res.message || 'Gagal menyimpan koreksi.');
    }
  };

  // Open Full Edit Modal (Operator & Pemilik)
  const handleOpenEditTx = (item: OutgoingTransaction) => {
    setTxToEdit(item);
    setTxEditError(null);
    setTxEditData({
      materialId: item.materialId,
      quantityKg: String(item.quantityKg),
      date: item.date,
      purpose: item.purpose,
      notes: item.notes || ''
    });
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit) return;
    setTxEditError(null);

    const qty = parseFloat(txEditData.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setTxEditError('Jumlah bahan keluar harus lebih besar dari 0 kg.');
      return;
    }

    if (!txEditData.purpose.trim()) {
      setTxEditError('Deskripsi / tujuan produksi wajib diisi.');
      return;
    }

    const res = updateOutgoing(txToEdit.id, {
      materialId: txEditData.materialId,
      quantityKg: qty,
      date: txEditData.date,
      purpose: txEditData.purpose.trim(),
      notes: txEditData.notes.trim()
    });

    if (res.success) {
      setTxToEdit(null);
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi keluar berhasil diperbarui.' });
    } else {
      setTxEditError(res.message || 'Gagal memperbarui transaksi keluar.');
    }
  };

  // Open & Confirm Delete Modal (Operator & Pemilik)
  const handleOpenDeleteTx = (item: OutgoingTransaction) => {
    setTxToDelete(item);
    setDeleteError(null);
  };

  const handleConfirmDeleteTx = () => {
    if (!txToDelete) return;
    const res = deleteOutgoing(txToDelete.id);
    if (res.success) {
      setTxToDelete(null);
      setDeleteError(null);
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi keluar berhasil dihapus.' });
    } else {
      setDeleteError(res.message || 'Gagal menghapus transaksi.');
    }
  };

  // Handle Verify (Verifikator)
  const handleVerify = (id: string) => {
    const res = verifyOutgoing(id);
    if (res.success) {
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi keluar berhasil diverifikasi.' });
    } else if (res.message) {
      setPageFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8B6B52] text-white flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#302923]">
              Bahan Baku Keluar (Kebutuhan Produksi & Roasting)
            </h2>
          </div>
          <p className="text-xs text-[#8A796D] mt-1">
            Penggunaan biji kopi untuk roasting dan pengemasan. Sistem memvalidasi ketersediaan stok untuk mencegah stok negatif.
          </p>
        </div>

        {/* Action Button: Operator Input */}
        {isOperator && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#49372D] hover:bg-[#3A2B23] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Bahan Baku Keluar</span>
          </button>
        )}
      </div>

      {/* Page Feedback Banner */}
      {pageFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 border ${
            pageFeedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {pageFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{pageFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageFeedback(null)}
            aria-label="Tutup notifikasi"
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A796D] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nomor transaksi, tujuan produksi, atau catatan..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F1E9]/50 focus:bg-white text-xs text-[#302923] rounded-xl border border-[#D8C7B3] focus:border-[#49372D] outline-none"
          />
        </div>

        {/* Material Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8A796D]" />
          <select
            value={selectedMaterial}
            onChange={e => setSelectedMaterial(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E9]/50 text-xs text-[#302923] rounded-xl border border-[#D8C7B3] outline-none cursor-pointer"
          >
            <option value="all">Semua Jenis Kopi</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E9]/50 text-xs text-[#302923] rounded-xl border border-[#D8C7B3] outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
          </select>
        </div>
      </div>

      {/* Outgoing Table */}
      <div className="bg-white rounded-2xl border border-[#D8C7B3]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] text-[#302923] border-b border-[#D8C7B3]/60">
              <tr>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap">No. Transaksi</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap">Tanggal</th>
                <th className="py-3.5 px-2.5 font-bold">Jenis Biji Kopi</th>
                <th className="py-3.5 px-2.5 font-bold text-right whitespace-nowrap">Jumlah Keluar</th>
                <th className="py-3.5 px-2.5 font-bold">Tujuan / Batch Produksi</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap">Dicatat Oleh</th>
                <th className="py-3.5 px-2.5 font-bold text-center">Status</th>
                <th className="py-3.5 px-2.5 font-bold text-right whitespace-nowrap">Aksi & Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8A796D]">
                    Tidak ada data transaksi pengeluaran bahan baku yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-[#F5F1E9]/30 transition-colors">
                    <td className="py-3.5 px-2.5 font-mono font-semibold text-[#8B6B52] whitespace-nowrap">
                      {item.transactionNumber}
                    </td>
                    <td className="py-3.5 px-2.5 text-[#8A796D] whitespace-nowrap">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="py-3.5 px-2.5 font-medium text-[#302923] whitespace-nowrap">
                      {item.materialName}
                    </td>
                    <td className="py-3.5 px-2.5 text-right font-extrabold text-[#8B6B52] whitespace-nowrap">
                      -{formatKg(item.quantityKg)} kg
                    </td>
                    <td className="py-3.5 px-2.5 max-w-[175px]">
                      <div className="font-semibold text-[#302923] flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#8B6B52] shrink-0" />
                        <span className="truncate" title={item.purpose}>{item.purpose}</span>
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-[#8A796D] mt-0.5 truncate" title={item.notes}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-2.5 text-[#8A796D] whitespace-nowrap">
                      {item.createdBy.name}
                    </td>
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'Menunggu Verifikasi' ? (
                          isVerifikator ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Verifikator can correct */}
                              <button
                                type="button"
                                onClick={() => handleOpenCorrection(item)}
                                title="Koreksi Data"
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#8B6B52] bg-[#8B6B52]/10 hover:bg-[#8B6B52]/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Koreksi</span>
                              </button>

                              {/* Verifikator can verify */}
                              <button
                                type="button"
                                onClick={() => handleVerify(item.id)}
                                title="Verifikasi Mutasi Keluar"
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#49372D] hover:bg-[#3A2B23] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Verifikasi</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8A796D] italic">
                              Menunggu Verifikator
                            </span>
                          )
                        ) : (
                          <div className="text-[11px] text-emerald-800 leading-tight text-right">
                            <div>Diverifikasi oleh:</div>
                            <div className="font-semibold">{item.verifiedBy?.name || 'Verifikator'}</div>
                          </div>
                        )}

                        {canManageTransactions && (
                          <div className="flex items-center gap-1 pl-2 border-l border-[#D8C7B3]/60">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTx(item)}
                              title={`Edit ${item.transactionNumber}`}
                              aria-label={`Edit ${item.transactionNumber}`}
                              className="p-1.5 text-[#8B6B52] hover:text-[#49372D] hover:bg-[#F5F1E9] rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteTx(item)}
                              title={`Hapus ${item.transactionNumber}`}
                              aria-label={`Hapus ${item.transactionNumber}`}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Outgoing Transaction (Operator only) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="w-10 h-10 rounded-xl bg-[#8B6B52] text-white flex items-center justify-center">
                <ArrowUpFromLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Catat Pengeluaran Bahan Baku
                </h3>
                <p className="text-xs text-[#8A796D]">
                  Input biji kopi yang digunakan untuk proses roasting / kemasan
                </p>
              </div>
            </div>

            {/* Current Stock Banner */}
            {selectedMaterialStock && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#F5F1E9] border border-[#D8C7B3] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#8B6B52]" />
                  <span className="text-xs text-[#302923] font-medium">
                    Stok Tersedia Saat Ini:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#49372D]">
                    {formatKg(selectedMaterialStock.currentStock)} kg
                  </span>
                  <Badge status={selectedMaterialStock.status} size="sm" />
                </div>
              </div>
            )}

            {formFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  formFeedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {formFeedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 shrink-0" />
                )}
                <span>{formFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Pilih Biji Kopi yang Digunakan *
                </label>
                <select
                  value={formData.materialId}
                  onChange={e => setFormData({ ...formData, materialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  {materials.map(m => {
                    const st = stockSummaries.find(s => s.materialId === m.id);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} — (Tersedia: {formatKg(st?.currentStock || 0)} kg)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Jumlah Keluar (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={selectedMaterialStock ? selectedMaterialStock.currentStock : undefined}
                    placeholder="Contoh: 50"
                    value={formData.quantityKg}
                    onChange={e => setFormData({ ...formData, quantityKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                    required
                  />
                  {selectedMaterialStock && parseFloat(formData.quantityKg) > selectedMaterialStock.currentStock && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      Jumlah melebihi stok yang ada!
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Tujuan / Deskripsi Produksi *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Roasting Batch #42 - Dark Roast Banyumas"
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sangrai profil espresso blend, susut roasting diperkirakan 15%"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#8A796D] hover:text-[#302923] rounded-xl border border-[#D8C7B3] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(
                    selectedMaterialStock && parseFloat(formData.quantityKg) > selectedMaterialStock.currentStock
                  )}
                  className="px-4 py-2 text-xs font-semibold bg-[#49372D] text-white hover:bg-[#3A2B23] disabled:opacity-50 rounded-xl cursor-pointer shadow-xs"
                >
                  Kirim untuk Diverifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Correction (Verifikator only) */}
      {editingItem && isVerifikator && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="w-10 h-10 rounded-xl bg-[#8B6B52] text-white flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Koreksi Data Bahan Baku Keluar
                </h3>
                <p className="text-xs text-[#8A796D]">
                  {editingItem.transactionNumber} &bull; {editingItem.materialName}
                </p>
              </div>
            </div>

            {correctionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCorrection} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Jumlah Keluar (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={correctionData.quantityKg}
                  onChange={e => setCorrectionData({ ...correctionData, quantityKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Tujuan / Deskripsi Produksi
                </label>
                <input
                  type="text"
                  value={correctionData.purpose}
                  onChange={e => setCorrectionData({ ...correctionData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Catatan Koreksi Verifikator
                </label>
                <textarea
                  rows={2}
                  value={correctionData.notes}
                  onChange={e => setCorrectionData({ ...correctionData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#8A796D] hover:text-[#302923] rounded-xl border border-[#D8C7B3] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#8B6B52] text-white hover:bg-[#6e533e] rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Outgoing Transaction (Operator & Pemilik across all statuses) */}
      {txToEdit && canManageTransactions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setTxToEdit(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-outgoing-title"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8B6B52] text-white flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-outgoing-title" className="text-base font-bold text-[#302923]">
                    Edit Transaksi Bahan Baku Keluar
                  </h3>
                  <p className="text-xs text-[#8A796D]">
                    {txToEdit.transactionNumber} &bull; Status: {txToEdit.status}
                  </p>
                </div>
              </div>
              <Badge status={txToEdit.status} size="sm" />
            </div>

            {(() => {
              const targetSummary = stockSummaries.find(s => s.materialId === txEditData.materialId);
              const currentAvailable = targetSummary ? targetSummary.currentStock : 0;
              const effectiveMax =
                txToEdit.status === 'Terverifikasi' && txToEdit.materialId === txEditData.materialId
                  ? Number((currentAvailable + txToEdit.quantityKg).toFixed(2))
                  : currentAvailable;

              return (
                <div className="mt-4 p-3.5 rounded-xl bg-[#F5F1E9] border border-[#D8C7B3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#8B6B52]" />
                    <span className="text-xs text-[#302923] font-medium">
                      Batas Maksimal Tersedia:
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-[#49372D]">
                    {formatKg(effectiveMax)} kg
                  </span>
                </div>
              );
            })()}

            {txEditError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{txEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditTx} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Jenis Biji Kopi *
                </label>
                <select
                  value={txEditData.materialId}
                  onChange={e => setTxEditData({ ...txEditData, materialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  {materials.map(m => {
                    const st = stockSummaries.find(s => s.materialId === m.id);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} — (Stok saat ini: {formatKg(st?.currentStock || 0)} kg)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Jumlah Keluar (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={txEditData.quantityKg}
                    onChange={e => setTxEditData({ ...txEditData, quantityKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    value={txEditData.date}
                    onChange={e => setTxEditData({ ...txEditData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Tujuan / Deskripsi Produksi *
                </label>
                <input
                  type="text"
                  value={txEditData.purpose}
                  onChange={e => setTxEditData({ ...txEditData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={txEditData.notes}
                  onChange={e => setTxEditData({ ...txEditData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setTxToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#8A796D] hover:text-[#302923] rounded-xl border border-[#D8C7B3] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#49372D] text-white hover:bg-[#3A2B23] rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={Boolean(txToDelete)}
        title="Hapus Transaksi Bahan Baku Keluar"
        transactionNumber={txToDelete?.transactionNumber || ''}
        materialName={txToDelete?.materialName || ''}
        quantityText={txToDelete ? `-${formatKg(txToDelete.quantityKg)} kg` : ''}
        statusLabel={txToDelete?.status || ''}
        impactNote={
          txToDelete?.status === 'Terverifikasi'
            ? 'Transaksi keluar ini sudah Terverifikasi. Menghapusnya akan mengembalikan jumlah tersebut ke saldo stok tersedia.'
            : 'Transaksi keluar ini masih menunggu verifikasi dan akan dihapus permanen dari riwayat.'
        }
        errorMessage={deleteError}
        onConfirm={handleConfirmDeleteTx}
        onCancel={() => {
          setTxToDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
};
