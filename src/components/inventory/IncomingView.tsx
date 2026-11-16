import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Plus,
  CheckCircle,
  Edit3,
  Search,
  Filter,
  AlertCircle,
  Check,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { IncomingTransaction } from '../../types/inventory';
import { formatDateIndo, formatKg, formatRupiah } from '../../utils/inventoryRules';

export const IncomingView: React.FC = () => {
  const {
    currentUser,
    materials,
    incomingList,
    addIncoming,
    updateIncoming,
    deleteIncoming,
    verifyIncoming
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
    supplierName: '',
    pricePerKg: '',
    notes: ''
  });
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Correction Modal State (for Verifikator)
  const [editingItem, setEditingItem] = useState<IncomingTransaction | null>(null);
  const [correctionData, setCorrectionData] = useState({
    quantityKg: 0,
    supplierName: '',
    pricePerKg: 0,
    notes: ''
  });
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Full Edit Modal State (for Operator & Pemilik across all statuses)
  const [txToEdit, setTxToEdit] = useState<IncomingTransaction | null>(null);
  const [txEditData, setTxEditData] = useState({
    materialId: '',
    quantityKg: '',
    date: '',
    supplierName: '',
    pricePerKg: '',
    notes: ''
  });
  const [txEditError, setTxEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State (for Operator & Pemilik)
  const [txToDelete, setTxToDelete] = useState<IncomingTransaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Page-level feedback banner
  const [pageFeedback, setPageFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const isOperator = currentUser?.role === 'OPERATOR';
  const isVerifikator = currentUser?.role === 'VERIFIKATOR';
  const isOwner = currentUser?.role === 'PEMILIK';
  const canManageTransactions = isOperator || isOwner;

  // Filtered List
  const filteredList = incomingList.filter(item => {
    const matchesSearch =
      item.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMaterial = selectedMaterial === 'all' || item.materialId === selectedMaterial;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesMaterial && matchesStatus;
  });

  // Handle Submit New Incoming (Operator)
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
      setFormFeedback({ type: 'error', message: 'Jumlah bahan masuk harus berupa angka lebih besar dari 0 kg.' });
      return;
    }

    if (!formData.supplierName.trim()) {
      setFormFeedback({ type: 'error', message: 'Nama pemasok atau kelompok tani wajib diisi.' });
      return;
    }

    const price = formData.pricePerKg ? parseFloat(formData.pricePerKg) : undefined;

    const res = addIncoming({
      date: formData.date,
      materialId: targetMaterial.id,
      materialName: targetMaterial.name,
      quantityKg: qty,
      supplierName: formData.supplierName.trim(),
      pricePerKg: price,
      notes: formData.notes.trim()
    });

    if (res.success) {
      setFormFeedback({ type: 'success', message: res.message || 'Berhasil mencatat transaksi masuk!' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormFeedback(null);
        setFormData({
          materialId: materials[0]?.id || '',
          quantityKg: '',
          date: new Date().toISOString().split('T')[0],
          supplierName: '',
          pricePerKg: '',
          notes: ''
        });
      }, 1000);
    } else {
      setFormFeedback({ type: 'error', message: res.message || 'Gagal menyimpan transaksi.' });
    }
  };

  // Open Correction Modal (Verifikator)
  const handleOpenCorrection = (item: IncomingTransaction) => {
    setEditingItem(item);
    setCorrectionError(null);
    setCorrectionData({
      quantityKg: item.quantityKg,
      supplierName: item.supplierName,
      pricePerKg: item.pricePerKg || 0,
      notes: item.notes || ''
    });
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setCorrectionError(null);

    const res = updateIncoming(editingItem.id, {
      quantityKg: correctionData.quantityKg,
      supplierName: correctionData.supplierName,
      pricePerKg: correctionData.pricePerKg > 0 ? correctionData.pricePerKg : undefined,
      notes: correctionData.notes
    });

    if (res.success) {
      setEditingItem(null);
      setPageFeedback({ type: 'success', message: res.message || 'Koreksi data berhasil disimpan.' });
    } else {
      setCorrectionError(res.message || 'Gagal menyimpan koreksi.');
    }
  };

  // Open Full Edit Modal (Operator & Pemilik)
  const handleOpenEditTx = (item: IncomingTransaction) => {
    setTxToEdit(item);
    setTxEditError(null);
    setTxEditData({
      materialId: item.materialId,
      quantityKg: String(item.quantityKg),
      date: item.date,
      supplierName: item.supplierName,
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : '',
      notes: item.notes || ''
    });
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit) return;
    setTxEditError(null);

    const qty = parseFloat(txEditData.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setTxEditError('Jumlah bahan masuk harus lebih besar dari 0 kg.');
      return;
    }

    if (!txEditData.supplierName.trim()) {
      setTxEditError('Nama pemasok wajib diisi.');
      return;
    }

    const parsedPrice = txEditData.pricePerKg.trim() !== '' ? parseFloat(txEditData.pricePerKg) : undefined;
    if (parsedPrice !== undefined && (isNaN(parsedPrice) || parsedPrice < 0)) {
      setTxEditError('Harga beli per kg tidak valid.');
      return;
    }

    const res = updateIncoming(txToEdit.id, {
      materialId: txEditData.materialId,
      quantityKg: qty,
      date: txEditData.date,
      supplierName: txEditData.supplierName.trim(),
      pricePerKg: parsedPrice && parsedPrice > 0 ? parsedPrice : undefined,
      notes: txEditData.notes.trim()
    });

    if (res.success) {
      setTxToEdit(null);
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi berhasil diperbarui.' });
    } else {
      setTxEditError(res.message || 'Gagal memperbarui transaksi.');
    }
  };

  // Open & Confirm Delete Modal (Operator & Pemilik)
  const handleOpenDeleteTx = (item: IncomingTransaction) => {
    setTxToDelete(item);
    setDeleteError(null);
  };

  const handleConfirmDeleteTx = () => {
    if (!txToDelete) return;
    const res = deleteIncoming(txToDelete.id);
    if (res.success) {
      setTxToDelete(null);
      setDeleteError(null);
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi berhasil dihapus.' });
    } else {
      setDeleteError(res.message || 'Gagal menghapus transaksi.');
    }
  };

  // Handle Verify (Verifikator)
  const handleVerify = (id: string) => {
    const res = verifyIncoming(id);
    if (res.success) {
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi berhasil diverifikasi.' });
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
            <div className="w-8 h-8 rounded-lg bg-[#49372D] text-white flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#302923]">
              Bahan Baku Masuk (Penerimaan Biji Kopi)
            </h2>
          </div>
          <p className="text-xs text-[#8A796D] mt-1">
            Pencatatan pasokan masuk biji kopi mentah. Hanya data berstatus <strong>Terverifikasi</strong> yang menambah stok resmi.
          </p>
        </div>

        {/* Action Button: Operator Input */}
        {isOperator && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#49372D] hover:bg-[#3A2B23] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Bahan Baku Masuk</span>
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
            placeholder="Cari nomor transaksi, nama pemasok, atau catatan..."
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

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#D8C7B3]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] text-[#302923] border-b border-[#D8C7B3]/60">
              <tr>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap">No. Transaksi</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap">Tanggal</th>
                <th className="py-3.5 px-2.5 font-bold">Jenis Biji Kopi</th>
                <th className="py-3.5 px-2.5 font-bold text-right whitespace-nowrap">Jumlah (kg)</th>
                <th className="py-3.5 px-2.5 font-bold">Pemasok / Mitra</th>
                <th className="py-3.5 px-2.5 font-bold text-right whitespace-nowrap">Harga / Total</th>
                <th className="py-3.5 px-2.5 font-bold text-center">Status</th>
                <th className="py-3.5 px-2.5 font-bold text-right whitespace-nowrap">Aksi & Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8A796D]">
                    Tidak ada data transaksi bahan baku masuk yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-[#F5F1E9]/30 transition-colors">
                    <td className="py-3.5 px-2.5 font-mono font-semibold text-[#49372D] whitespace-nowrap">
                      {item.transactionNumber}
                    </td>
                    <td className="py-3.5 px-2.5 text-[#8A796D] whitespace-nowrap">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="py-3.5 px-2.5 font-medium text-[#302923] whitespace-nowrap">
                      {item.materialName}
                    </td>
                    <td className="py-3.5 px-2.5 text-right font-extrabold text-[#302923] whitespace-nowrap">
                      +{formatKg(item.quantityKg)} kg
                    </td>
                    <td className="py-3.5 px-2.5 max-w-[160px]">
                      <div className="font-semibold text-[#302923] truncate">{item.supplierName}</div>
                      {item.notes && (
                        <div className="text-[11px] text-[#8A796D] truncate" title={item.notes}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                      {item.pricePerKg ? (
                        <>
                          <div className="font-medium text-[#302923]">
                            {formatRupiah(item.pricePerKg)}/kg
                          </div>
                          <div className="text-[11px] text-[#8A796D]">
                            Total: {formatRupiah(item.totalCost || item.pricePerKg * item.quantityKg)}
                          </div>
                        </>
                      ) : (
                        <span className="text-[#8A796D]">-</span>
                      )}
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
                                title="Verifikasi Mutasi Masuk"
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

      {/* Modal: Add Incoming Transaction (Operator only) */}
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
              <div className="w-10 h-10 rounded-xl bg-[#49372D] text-white flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Catat Bahan Baku Masuk
                </h3>
                <p className="text-xs text-[#8A796D]">
                  Input data pasokan biji kopi mentah dari pemasok
                </p>
              </div>
            </div>

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
                  Jenis Bahan Baku (Biji Kopi) *
                </label>
                <select
                  value={formData.materialId}
                  onChange={e => setFormData({ ...formData, materialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Satuan: {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Jumlah Masuk (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Contoh: 150"
                    value={formData.quantityKg}
                    onChange={e => setFormData({ ...formData, quantityKg: e.target.value })}
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
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Nama Pemasok / Petani Mitra *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelompok Tani Dampit Malang"
                  value={formData.supplierName}
                  onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Harga Beli per kg (IDR - Opsional)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="Contoh: 45000"
                  value={formData.pricePerKg}
                  onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Catatan Mutu / Kondisi Fisik
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Biji petik merah, kadar air 12.5%, bersih dari serpihan batu"
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
                  className="px-4 py-2 text-xs font-semibold bg-[#49372D] text-white hover:bg-[#3A2B23] rounded-xl cursor-pointer shadow-xs"
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
                  Koreksi Data Bahan Baku Masuk
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
                  Jumlah Masuk (kg)
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
                  Nama Pemasok
                </label>
                <input
                  type="text"
                  value={correctionData.supplierName}
                  onChange={e => setCorrectionData({ ...correctionData, supplierName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Harga Beli per kg (IDR)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={correctionData.pricePerKg}
                  onChange={e => setCorrectionData({ ...correctionData, pricePerKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
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

      {/* Modal: Edit Transaction (Operator & Pemilik across all statuses) */}
      {txToEdit && canManageTransactions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setTxToEdit(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-incoming-title"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#49372D] text-white flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-incoming-title" className="text-base font-bold text-[#302923]">
                    Edit Transaksi Bahan Baku Masuk
                  </h3>
                  <p className="text-xs text-[#8A796D]">
                    {txToEdit.transactionNumber} &bull; Status: {txToEdit.status}
                  </p>
                </div>
              </div>
              <Badge status={txToEdit.status} size="sm" />
            </div>

            {txEditError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{txEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditTx} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Jenis Bahan Baku (Biji Kopi) *
                </label>
                <select
                  value={txEditData.materialId}
                  onChange={e => setTxEditData({ ...txEditData, materialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Satuan: {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Jumlah Masuk (kg) *
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
                  Nama Pemasok / Petani Mitra *
                </label>
                <input
                  type="text"
                  value={txEditData.supplierName}
                  onChange={e => setTxEditData({ ...txEditData, supplierName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Harga Beli per kg (IDR - Opsional)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="Kosongkan jika tidak ada"
                  value={txEditData.pricePerKg}
                  onChange={e => setTxEditData({ ...txEditData, pricePerKg: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Catatan Mutu / Kondisi Fisik
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
        title="Hapus Transaksi Bahan Baku Masuk"
        transactionNumber={txToDelete?.transactionNumber || ''}
        materialName={txToDelete?.materialName || ''}
        quantityText={txToDelete ? `+${formatKg(txToDelete.quantityKg)} kg` : ''}
        statusLabel={txToDelete?.status || ''}
        impactNote={
          txToDelete?.status === 'Terverifikasi'
            ? 'Transaksi ini sudah Terverifikasi. Menghapusnya akan mengurangi saldo stok tersedia. Sistem akan memblokir penghapusan jika membuat stok menjadi negatif.'
            : 'Transaksi ini masih menunggu verifikasi dan akan dihapus permanen dari riwayat.'
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
