import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  CheckCircle,
  XCircle,
  Edit3,
  Search,
  Filter,
  AlertCircle,
  Check,
  ShieldCheck,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { ReturnCondition, ReturnTransaction } from '../../types/inventory';
import { formatDateIndo, formatKg } from '../../utils/inventoryRules';

export const ReturnsView: React.FC = () => {
  const {
    currentUser,
    materials,
    returnsList,
    addReturn,
    updateReturn,
    deleteReturn,
    verifyReturn,
    approveReturn,
    rejectReturn
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form Modal State (Operator Input)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    materialId: materials[0]?.id || '',
    quantityKg: '',
    date: new Date().toISOString().split('T')[0],
    invoiceOrCustomer: '',
    reason: '',
    condition: 'Segel Utuh / Kualitas Baik' as ReturnCondition,
    notes: ''
  });
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Correction Modal State (Verifikator)
  const [editingItem, setEditingItem] = useState<ReturnTransaction | null>(null);
  const [correctionData, setCorrectionData] = useState({
    quantityKg: 0,
    invoiceOrCustomer: '',
    reason: '',
    condition: 'Segel Utuh / Kualitas Baik' as ReturnCondition,
    notes: ''
  });
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Full Edit Modal State (Operator & Pemilik across all statuses)
  const [txToEdit, setTxToEdit] = useState<ReturnTransaction | null>(null);
  const [txEditData, setTxEditData] = useState({
    materialId: '',
    quantityKg: '',
    date: '',
    invoiceOrCustomer: '',
    reason: '',
    condition: 'Segel Utuh / Kualitas Baik' as ReturnCondition,
    notes: '',
    isReusableForStock: false
  });
  const [txEditError, setTxEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [txToDelete, setTxToDelete] = useState<ReturnTransaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Page-level feedback banner
  const [pageFeedback, setPageFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Owner Review Modal State (Pemilik Approval)
  const [reviewItem, setReviewItem] = useState<ReturnTransaction | null>(null);
  const [isReusableDecision, setIsReusableDecision] = useState<boolean>(true);
  const [ownerNotes, setOwnerNotes] = useState('');

  const isOperator = currentUser?.role === 'OPERATOR';
  const isVerifikator = currentUser?.role === 'VERIFIKATOR';
  const isOwner = currentUser?.role === 'PEMILIK';
  const canManageTransactions = isOperator || isOwner;

  // Filtered List
  const filteredList = returnsList.filter(item => {
    const matchesSearch =
      item.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoiceOrCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMaterial = selectedMaterial === 'all' || item.materialId === selectedMaterial;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesMaterial && matchesStatus;
  });

  // Handle Submit New Return (Operator)
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
      setFormFeedback({ type: 'error', message: 'Jumlah retur harus berupa angka lebih besar dari 0 kg.' });
      return;
    }

    if (!formData.invoiceOrCustomer.trim() || !formData.reason.trim()) {
      setFormFeedback({ type: 'error', message: 'No. Nota / Pelanggan dan Alasan Retur wajib diisi.' });
      return;
    }

    const res = addReturn({
      date: formData.date,
      materialId: targetMaterial.id,
      materialName: targetMaterial.name,
      quantityKg: qty,
      invoiceOrCustomer: formData.invoiceOrCustomer.trim(),
      reason: formData.reason.trim(),
      condition: formData.condition,
      notes: formData.notes.trim()
    });

    if (res.success) {
      setFormFeedback({ type: 'success', message: res.message || 'Berhasil mencatat retur penjualan!' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormFeedback(null);
        setFormData({
          materialId: materials[0]?.id || '',
          quantityKg: '',
          date: new Date().toISOString().split('T')[0],
          invoiceOrCustomer: '',
          reason: '',
          condition: 'Segel Utuh / Kualitas Baik',
          notes: ''
        });
      }, 1000);
    } else {
      setFormFeedback({ type: 'error', message: res.message || 'Gagal menyimpan transaksi retur.' });
    }
  };

  // Open Correction Modal (Verifikator)
  const handleOpenCorrection = (item: ReturnTransaction) => {
    setEditingItem(item);
    setCorrectionError(null);
    setCorrectionData({
      quantityKg: item.quantityKg,
      invoiceOrCustomer: item.invoiceOrCustomer,
      reason: item.reason,
      condition: item.condition,
      notes: item.notes || ''
    });
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setCorrectionError(null);

    const res = updateReturn(editingItem.id, {
      quantityKg: correctionData.quantityKg,
      invoiceOrCustomer: correctionData.invoiceOrCustomer,
      reason: correctionData.reason,
      condition: correctionData.condition,
      notes: correctionData.notes
    });

    if (res.success) {
      setEditingItem(null);
      setPageFeedback({ type: 'success', message: res.message || 'Koreksi retur berhasil disimpan.' });
    } else {
      setCorrectionError(res.message || 'Gagal menyimpan koreksi retur.');
    }
  };

  // Open Full Edit Modal (Operator & Pemilik)
  const handleOpenEditTx = (item: ReturnTransaction) => {
    setTxToEdit(item);
    setTxEditError(null);
    setTxEditData({
      materialId: item.materialId,
      quantityKg: String(item.quantityKg),
      date: item.date,
      invoiceOrCustomer: item.invoiceOrCustomer,
      reason: item.reason,
      condition: item.condition,
      notes: item.notes || '',
      isReusableForStock: Boolean(item.isReusableForStock)
    });
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit) return;
    setTxEditError(null);

    const qty = parseFloat(txEditData.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setTxEditError('Jumlah retur harus lebih besar dari 0 kg.');
      return;
    }

    if (!txEditData.invoiceOrCustomer.trim() || !txEditData.reason.trim()) {
      setTxEditError('No. Nota / Pelanggan dan Alasan Retur wajib diisi.');
      return;
    }

    const payload: Partial<ReturnTransaction> = {
      materialId: txEditData.materialId,
      quantityKg: qty,
      date: txEditData.date,
      invoiceOrCustomer: txEditData.invoiceOrCustomer.trim(),
      reason: txEditData.reason.trim(),
      condition: txEditData.condition,
      notes: txEditData.notes.trim()
    };

    if (isOwner && txToEdit.status === 'Disetujui') {
      payload.isReusableForStock =
        txEditData.condition === 'Biji Rusak / Terkontaminasi / Cacat'
          ? false
          : txEditData.isReusableForStock;
    }

    const res = updateReturn(txToEdit.id, payload);

    if (res.success) {
      setTxToEdit(null);
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi retur berhasil diperbarui.' });
    } else {
      setTxEditError(res.message || 'Gagal memperbarui transaksi retur.');
    }
  };

  // Open & Confirm Delete Modal (Operator & Pemilik)
  const handleOpenDeleteTx = (item: ReturnTransaction) => {
    setTxToDelete(item);
    setDeleteError(null);
  };

  const handleConfirmDeleteTx = () => {
    if (!txToDelete) return;
    const res = deleteReturn(txToDelete.id);
    if (res.success) {
      setTxToDelete(null);
      setDeleteError(null);
      setPageFeedback({ type: 'success', message: res.message || 'Transaksi retur berhasil dihapus.' });
    } else {
      setDeleteError(res.message || 'Gagal menghapus transaksi retur.');
    }
  };

  // Handle Verify by Verifikator
  const handleVerify = (id: string) => {
    const res = verifyReturn(id);
    if (res.success) {
      setPageFeedback({ type: 'success', message: res.message || 'Pemeriksaan retur berhasil diverifikasi.' });
    } else if (res.message) {
      setPageFeedback({ type: 'error', message: res.message });
    }
  };

  // Open Owner Review
  const handleOpenReview = (item: ReturnTransaction) => {
    setReviewItem(item);
    // Auto suggest reusable based on physical condition
    const looksGood = item.condition !== 'Biji Rusak / Terkontaminasi / Cacat';
    setIsReusableDecision(looksGood);
    setOwnerNotes(
      looksGood
        ? 'Biji kopi diinspeksi dalam kondisi layak pakai. Disetujui masuk stok resmi.'
        : 'Biji rusak / cacat rasa. Tidak layak masuk stok produksi, dialokasikan untuk pemusnahan/afkir.'
    );
  };

  const handleApprove = () => {
    if (!reviewItem) return;
    const res = approveReturn(reviewItem.id, isReusableDecision, ownerNotes);
    setReviewItem(null);
    if (res.message) {
      setPageFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    }
  };

  const handleReject = () => {
    if (!reviewItem) return;
    const res = rejectReturn(reviewItem.id, ownerNotes);
    setReviewItem(null);
    if (res.message) {
      setPageFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#302923] text-[#F5F1E9] flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#302923]">
              Retur Penjualan & Kelayakan Stok
            </h2>
          </div>
          <p className="text-xs text-[#8A796D] mt-1">
            Alur verifikasi 2 tahap: Operator mencatat &rarr; Verifikator cek fisik &rarr; Pemilik memutuskan kelayakan masuk stok.
          </p>
        </div>

        {/* Action Button: Operator Input */}
        {isOperator && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#49372D] hover:bg-[#3A2B23] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Retur Penjualan</span>
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
            placeholder="Cari nomor retur, pelanggan, atau alasan..."
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
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-[#D8C7B3]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] text-[#302923] border-b border-[#D8C7B3]/60">
              <tr>
                <th className="py-3.5 px-2 font-bold whitespace-nowrap">No. Retur</th>
                <th className="py-3.5 px-2 font-bold whitespace-nowrap">Tanggal</th>
                <th className="py-3.5 px-2 font-bold">Jenis Kopi</th>
                <th className="py-3.5 px-2 font-bold text-right whitespace-nowrap">Jumlah</th>
                <th className="py-3.5 px-2 font-bold">Pelanggan / Alasan</th>
                <th className="py-3.5 px-2 font-bold">Kondisi Fisik</th>
                <th className="py-3.5 px-2 font-bold text-center">Status</th>
                <th className="py-3.5 px-2 font-bold text-center">Dampak Stok</th>
                <th className="py-3.5 px-2 font-bold text-right whitespace-nowrap">Aksi Alur Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8A796D]">
                    Tidak ada data transaksi retur penjualan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-[#F5F1E9]/30 transition-colors">
                    <td className="py-3.5 px-2 font-mono font-semibold text-[#302923] whitespace-nowrap">
                      {item.transactionNumber}
                    </td>
                    <td className="py-3.5 px-2 text-[#8A796D] whitespace-nowrap">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="py-3.5 px-2 font-medium text-[#302923]">
                      {item.materialName}
                    </td>
                    <td className="py-3.5 px-2 text-right font-bold text-[#302923] whitespace-nowrap">
                      {formatKg(item.quantityKg)} kg
                    </td>
                    <td className="py-3.5 px-2 max-w-[140px]">
                      <div className="font-semibold text-[#302923] truncate" title={item.invoiceOrCustomer}>
                        {item.invoiceOrCustomer}
                      </div>
                      <div className="text-[11px] text-[#8A796D] truncate" title={item.reason}>
                        {item.reason}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 max-w-[125px]">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold leading-snug ${
                          item.condition === 'Segel Utuh / Kualitas Baik'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.condition === 'Kemasan Rusak / Biji Masih Bagus'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {item.status === 'Disetujui' ? (
                        item.isReusableForStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 leading-tight">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>+{formatKg(item.quantityKg)} kg Stok</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                            Afkir (Non-Stok)
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-[#8A796D] whitespace-nowrap">Belum disetujui</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Step 1: Menunggu Verifikasi (Verifikator actions) */}
                        {item.status === 'Menunggu Verifikasi' && (
                          isVerifikator ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenCorrection(item)}
                                className="px-2 py-1 text-[11px] font-semibold text-[#8B6B52] bg-[#8B6B52]/10 hover:bg-[#8B6B52]/20 rounded-lg cursor-pointer"
                              >
                                Koreksi
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerify(item.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#8B6B52] hover:bg-[#6e533e] rounded-lg cursor-pointer"
                              >
                                Verifikasi Fisik
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8A796D] italic leading-tight text-right">
                              Menunggu<br />Verifikator
                            </span>
                          )
                        )}

                        {/* Step 2: Menunggu Persetujuan (Pemilik actions) */}
                        {item.status === 'Menunggu Persetujuan' && (
                          isOwner ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReview(item)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#F5F1E9] bg-[#49372D] hover:bg-[#302923] rounded-lg cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Keputusan Pemilik</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-medium leading-tight text-right">
                              Menunggu<br />Pemilik
                            </span>
                          )
                        )}

                        {/* Final Status */}
                        {(item.status === 'Disetujui' || item.status === 'Ditolak') && (
                          <div className="text-[11px] text-[#8A796D] leading-tight text-right">
                            <div className="font-medium text-[#302923]">{item.approvedBy?.name || 'Pemilik'}</div>
                            <div className="text-[10px]">{formatDateIndo(item.approvedBy?.approvedAt || '')}</div>
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

      {/* Modal: Operator Input Retur */}
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
              <div className="w-10 h-10 rounded-xl bg-[#302923] text-[#F5F1E9] flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Catat Retur Penjualan Baru
                </h3>
                <p className="text-xs text-[#8A796D]">
                  Input pengembalian produk atau biji kopi dari pembeli/kedai
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
                  Jenis Biji Kopi / Produk yang Diretur *
                </label>
                <select
                  value={formData.materialId}
                  onChange={e => setFormData({ ...formData, materialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Jumlah Retur (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Contoh: 10"
                    value={formData.quantityKg}
                    onChange={e => setFormData({ ...formData, quantityKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Tanggal Retur *
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
                  Nomor Nota / Nama Pelanggan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kedai Kopi Senja (Nota #INV-9201)"
                  value={formData.invoiceOrCustomer}
                  onChange={e => setFormData({ ...formData, invoiceOrCustomer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Kondisi Produk *
                </label>
                <select
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value as ReturnCondition })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  <option value="Segel Utuh / Kualitas Baik">Segel Utuh / Kualitas Baik</option>
                  <option value="Kemasan Rusak / Biji Masih Bagus">Kemasan Rusak / Biji Masih Bagus</option>
                  <option value="Biji Rusak / Terkontaminasi / Cacat">Biji Rusak / Terkontaminasi / Cacat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Alasan Retur *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelebihan stok kedai mitra, atau salah varian kemasan"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
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
                  placeholder="Keterangan tambahan kemasan, nomor resi pengiriman retur, dll"
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

      {/* Modal: Verifikator Correction */}
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
                  Koreksi Informasi Retur
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
                  Jumlah (kg)
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
                  Kondisi Produk
                </label>
                <select
                  value={correctionData.condition}
                  onChange={e => setCorrectionData({ ...correctionData, condition: e.target.value as ReturnCondition })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  <option value="Segel Utuh / Kualitas Baik">Segel Utuh / Kualitas Baik</option>
                  <option value="Kemasan Rusak / Biji Masih Bagus">Kemasan Rusak / Biji Masih Bagus</option>
                  <option value="Biji Rusak / Terkontaminasi / Cacat">Biji Rusak / Terkontaminasi / Cacat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Alasan Retur
                </label>
                <input
                  type="text"
                  value={correctionData.reason}
                  onChange={e => setCorrectionData({ ...correctionData, reason: e.target.value })}
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

      {/* Modal: Pemilik Approval & Stock Reusability Decision */}
      {reviewItem && isOwner && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setReviewItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="w-10 h-10 rounded-xl bg-[#49372D] text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Keputusan Persetujuan & Kelayakan Stok
                </h3>
                <p className="text-xs text-[#8A796D]">
                  Wewenang Khusus Pemilik Pabrik Kopi Mbekayu
                </p>
              </div>
            </div>

            {/* Summary of the return */}
            <div className="mt-4 p-4 rounded-2xl bg-[#F5F1E9] border border-[#D8C7B3]/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A796D]">No. Transaksi Retur:</span>
                <span className="font-mono font-bold text-[#302923]">{reviewItem.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A796D]">Jenis Bahan:</span>
                <span className="font-semibold text-[#302923]">{reviewItem.materialName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A796D]">Jumlah Dikembalikan:</span>
                <span className="font-extrabold text-[#49372D] text-sm">{formatKg(reviewItem.quantityKg)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A796D]">Pelanggan / Nota:</span>
                <span className="font-medium text-[#302923]">{reviewItem.invoiceOrCustomer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8A796D]">Kondisi Fisik:</span>
                <span className="font-semibold text-[#302923]">{reviewItem.condition}</span>
              </div>
              <div className="pt-2 border-t border-[#D8C7B3]/40">
                <span className="text-[#8A796D] block">Alasan Retur:</span>
                <p className="text-[#302923] italic mt-0.5">&ldquo;{reviewItem.reason}&rdquo;</p>
              </div>
            </div>

            {/* Decision: Reusable for stock? */}
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider">
                Kelayakan Masuk Stok Tersedia *
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsReusableDecision(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isReusableDecision
                      ? 'border-[#49372D] bg-[#49372D]/5 ring-2 ring-[#49372D]/20'
                      : 'border-[#D8C7B3] hover:bg-[#F5F1E9]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isReusableDecision ? 'border-[#49372D] bg-[#49372D]' : 'border-[#8A796D]'
                      }`}
                    >
                      {isReusableDecision && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs font-bold text-[#302923]">Layak Masuk Stok</span>
                  </div>
                  <p className="text-[11px] text-[#8A796D]">
                    Stok resmi otomatis bertambah sebesar +{formatKg(reviewItem.quantityKg)} kg.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReusableDecision(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    !isReusableDecision
                      ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-200'
                      : 'border-[#D8C7B3] hover:bg-[#F5F1E9]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        !isReusableDecision ? 'border-rose-600 bg-rose-600' : 'border-[#8A796D]'
                      }`}
                    >
                      {!isReusableDecision && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs font-bold text-rose-800">Tidak Layak (Afkir)</span>
                  </div>
                  <p className="text-[11px] text-[#8A796D]">
                    Tercatat di pembukuan retur, tetapi TIDAK menambah stok gudang.
                  </p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1 mt-3">
                  Instruksi / Catatan Pemilik
                </label>
                <textarea
                  rows={2}
                  value={ownerNotes}
                  onChange={e => setOwnerNotes(e.target.value)}
                  placeholder="Catatan inspeksi atau disposisi bahan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-5 border-t border-stone-100 mt-5">
              <button
                type="button"
                onClick={handleReject}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Retur</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#8A796D] hover:text-[#302923] rounded-xl border border-[#D8C7B3] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 text-xs font-semibold bg-[#49372D] text-white hover:bg-[#3A2B23] rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Setujui Retur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Return Transaction (Operator & Pemilik across all statuses) */}
      {txToEdit && canManageTransactions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setTxToEdit(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-return-title"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#302923] text-[#F5F1E9] flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-return-title" className="text-base font-bold text-[#302923]">
                    Edit Transaksi Retur Penjualan
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
                  Jenis Biji Kopi / Produk *
                </label>
                <select
                  value={txEditData.materialId}
                  onChange={e => setTxEditData({ ...txEditData, materialId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Jumlah Retur (kg) *
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
                    Tanggal Retur *
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
                  Nomor Nota / Nama Pelanggan *
                </label>
                <input
                  type="text"
                  value={txEditData.invoiceOrCustomer}
                  onChange={e => setTxEditData({ ...txEditData, invoiceOrCustomer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Kondisi Produk *
                </label>
                <select
                  value={txEditData.condition}
                  onChange={e => {
                    const nextCond = e.target.value as ReturnCondition;
                    setTxEditData({
                      ...txEditData,
                      condition: nextCond,
                      isReusableForStock:
                        nextCond === 'Biji Rusak / Terkontaminasi / Cacat'
                          ? false
                          : txEditData.isReusableForStock
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  <option value="Segel Utuh / Kualitas Baik">Segel Utuh / Kualitas Baik</option>
                  <option value="Kemasan Rusak / Biji Masih Bagus">Kemasan Rusak / Biji Masih Bagus</option>
                  <option value="Biji Rusak / Terkontaminasi / Cacat">Biji Rusak / Terkontaminasi / Cacat</option>
                </select>
              </div>

              {isOwner && txToEdit.status === 'Disetujui' && (
                <div>
                  <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                    Kelayakan Masuk Stok
                  </label>
                  <select
                    value={txEditData.isReusableForStock ? 'yes' : 'no'}
                    disabled={txEditData.condition === 'Biji Rusak / Terkontaminasi / Cacat'}
                    onChange={e =>
                      setTxEditData({ ...txEditData, isReusableForStock: e.target.value === 'yes' })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D] disabled:bg-stone-100"
                  >
                    <option value="yes">Layak Masuk Stok (+ menambah stok resmi)</option>
                    <option value="no">Tidak Layak / Afkir (tidak menambah stok)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Alasan Retur *
                </label>
                <input
                  type="text"
                  value={txEditData.reason}
                  onChange={e => setTxEditData({ ...txEditData, reason: e.target.value })}
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
        title="Hapus Transaksi Retur Penjualan"
        transactionNumber={txToDelete?.transactionNumber || ''}
        materialName={txToDelete?.materialName || ''}
        quantityText={txToDelete ? `${formatKg(txToDelete.quantityKg)} kg` : ''}
        statusLabel={txToDelete?.status || ''}
        impactNote={
          txToDelete?.status === 'Disetujui' && txToDelete?.isReusableForStock
            ? 'Retur ini berstatus Disetujui & Layak Masuk Stok. Menghapusnya akan mengurangi saldo stok sebesar jumlah retur ini.'
            : 'Transaksi retur ini akan dihapus permanen dari riwayat pembukuan tanpa mengurangi saldo stok aktif.'
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
