import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  FileSpreadsheet,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { CoffeeMaterial, StockMovementRecord, StockSummary } from '../../types/inventory';
import {
  generateStockCardMovements,
  formatKg,
  formatDateIndo
} from '../../utils/inventoryRules';

export const StockView: React.FC = () => {
  const {
    currentUser,
    materials,
    stockSummaries,
    incomingList,
    outgoingList,
    returnsList,
    updateMinThreshold
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Stock Card Modal (Buku Mutasi Stok)
  const [selectedMaterialForCard, setSelectedMaterialForCard] = useState<CoffeeMaterial | null>(null);

  // Threshold edit modal (Pemilik only)
  const [editingMaterial, setEditingMaterial] = useState<StockSummary | null>(null);
  const [thresholdInput, setThresholdInput] = useState<number>(0);

  const isOwner = currentUser?.role === 'PEMILIK';

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return stockSummaries.filter(item => {
      const matchesSearch = item.materialName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stockSummaries, searchTerm, statusFilter]);

  // Movements for the selected material's stock card
  const stockCardMovements = useMemo(() => {
    if (!selectedMaterialForCard) return [];
    return generateStockCardMovements(
      selectedMaterialForCard,
      incomingList,
      outgoingList,
      returnsList
    );
  }, [selectedMaterialForCard, incomingList, outgoingList, returnsList]);

  // Open threshold editor
  const handleOpenEditThreshold = (item: StockSummary) => {
    setEditingMaterial(item);
    setThresholdInput(item.minThreshold);
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    updateMinThreshold(editingMaterial.materialId, thresholdInput);
    setEditingMaterial(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#49372D] text-[#F5F1E9] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#302923]">
              Monitoring Stok Bahan Baku Tersedia
            </h2>
          </div>
          <p className="text-xs text-[#8A796D] mt-1">
            Status ketersediaan real-time seluruh varietas biji kopi siap produksi di gudang.
          </p>
        </div>

        {/* Formula note pill */}
        <div className="p-3 bg-[#F5F1E9] rounded-xl border border-[#D8C7B3]/70 text-[11px] text-[#302923] max-w-md">
          <span className="font-bold text-[#49372D] block mb-0.5">Rumus Perhitungan Resmi:</span>
          <span className="font-mono text-[10px] text-[#8A796D]">
            Stok Akhir = Stok Awal + Masuk Terverifikasi - Keluar Terverifikasi + Retur Layak Disetujui
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A796D] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari jenis biji kopi..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F1E9]/50 focus:bg-white text-xs text-[#302923] rounded-xl border border-[#D8C7B3] focus:border-[#49372D] outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8A796D]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E9]/50 text-xs text-[#302923] rounded-xl border border-[#D8C7B3] outline-none cursor-pointer"
          >
            <option value="all">Semua Status Stok</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis</option>
            <option value="Stok Habis">Stok Habis</option>
          </select>
        </div>
      </div>

      {/* Stock Table matching Section 9 exact specification:
          | No | Jenis Bahan Baku | Stok Tersedia | Satuan | Batas Minimum | Status |
      */}
      <div className="bg-white rounded-2xl border border-[#D8C7B3]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] text-[#302923] border-b border-[#D8C7B3]/60">
              <tr>
                <th className="py-3.5 px-4 font-bold text-center w-12">No</th>
                <th className="py-3.5 px-4 font-bold">Jenis Bahan Baku</th>
                <th className="py-3.5 px-4 font-bold text-right">Stok Tersedia</th>
                <th className="py-3.5 px-4 font-bold text-center">Satuan</th>
                <th className="py-3.5 px-4 font-bold text-right">Batas Minimum</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Riwayat Mutasi & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8A796D]">
                    Tidak ada jenis bahan baku yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((summary, index) => {
                  const rawMat = materials.find(m => m.id === summary.materialId);

                  return (
                    <tr key={summary.materialId} className="hover:bg-[#F5F1E9]/30 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-[#8A796D]">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-[#302923]">
                          {summary.materialName}
                        </div>
                        <div className="text-[11px] text-[#8A796D]">
                          Saldo Awal: {formatKg(summary.initialStock)} kg &bull; Masuk: +{formatKg(summary.incomingVerifiedKg)} kg &bull; Keluar: -{formatKg(summary.outgoingVerifiedKg)} kg
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-base font-black text-[#49372D]">
                          {formatKg(summary.currentStock)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-[#8A796D]">
                        {summary.unit}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[#302923]">
                        {formatKg(summary.minThreshold)} kg
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge status={summary.status} />
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Stock Card Button */}
                          <button
                            onClick={() => rawMat && setSelectedMaterialForCard(rawMat)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#49372D] bg-[#F5F1E9] hover:bg-[#D8C7B3]/40 border border-[#D8C7B3] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <History className="w-3.5 h-3.5 text-[#8B6B52]" />
                            <span>Buku Mutasi Stok</span>
                          </button>

                          {/* Owner adjust threshold */}
                          {isOwner && (
                            <button
                              onClick={() => handleOpenEditThreshold(summary)}
                              title="Ubah Batas Minimum"
                              className="p-1.5 text-[#8A796D] hover:text-[#49372D] hover:bg-stone-100 rounded-lg cursor-pointer"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Buku Mutasi Stok / Detailed Stock Movement History */}
      {selectedMaterialForCard && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedMaterialForCard(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D8C7B3]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#49372D] text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#302923]">
                    Kartu Stok & Audit Mutasi Bahan
                  </h3>
                  <p className="text-xs text-[#8A796D]">
                    {selectedMaterialForCard.name} &bull; Seluruh Riwayat Terlacak & Terverifikasi
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMaterialForCard(null)}
                className="p-1.5 rounded-lg text-[#8A796D] hover:text-[#302923] hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Movement table */}
            <div className="mt-5 overflow-x-auto max-h-[60vh] divide-y divide-stone-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F1E9] text-[#302923] sticky top-0 z-10 border-b border-[#D8C7B3]/60">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">Tanggal</th>
                    <th className="py-2.5 px-3 font-bold">Jenis Mutasi</th>
                    <th className="py-2.5 px-3 font-bold">No. Bukti / Ref</th>
                    <th className="py-2.5 px-3 font-bold">Keterangan / Tujuan</th>
                    <th className="py-2.5 px-3 font-bold text-right text-emerald-800">Masuk (kg)</th>
                    <th className="py-2.5 px-3 font-bold text-right text-amber-900">Keluar (kg)</th>
                    <th className="py-2.5 px-3 font-bold text-right text-[#49372D]">Saldo (kg)</th>
                    <th className="py-2.5 px-3 font-bold">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stockCardMovements.map(record => (
                    <tr key={record.id} className="hover:bg-[#F5F1E9]/40 transition-colors">
                      <td className="py-3 px-3 text-[#8A796D] whitespace-nowrap">
                        {formatDateIndo(record.date)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            record.type === 'Masuk'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.type === 'Keluar'
                              ? 'bg-amber-100 text-amber-900'
                              : record.type === 'Retur Layak'
                              ? 'bg-stone-200 text-[#49372D]'
                              : record.type === 'Retur Tidak Layak'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-[#302923]'
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-[#302923] whitespace-nowrap">
                        {record.referenceNumber}
                      </td>
                      <td className="py-3 px-3 text-[#302923] max-w-[220px]">
                        {record.description}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {record.inKg > 0 ? `+${formatKg(record.inKg)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-800 whitespace-nowrap">
                        {record.outKg > 0 ? `-${formatKg(record.outKg)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#49372D] whitespace-nowrap">
                        {formatKg(record.balanceKg)} kg
                      </td>
                      <td className="py-3 px-3 text-[#8A796D] whitespace-nowrap">
                        {record.actor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-5">
              <span className="text-[11px] text-[#8A796D]">
                Data kartu stok terverifikasi otomatis sesuai mutasi fisik resmi.
              </span>
              <button
                onClick={() => setSelectedMaterialForCard(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#49372D] text-white hover:bg-[#3A2B23] rounded-xl cursor-pointer"
              >
                Tutup Kartu Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pemilik edit threshold */}
      {editingMaterial && isOwner && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingMaterial(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D8C7B3] animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="w-10 h-10 rounded-xl bg-[#49372D] text-white flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Atur Batas Minimum Stok
                </h3>
                <p className="text-xs text-[#8A796D]">
                  {editingMaterial.materialName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveThreshold} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1.5">
                  Batas Minimum Baru (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={thresholdInput}
                    onChange={e => setThresholdInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D8C7B3] text-sm text-[#302923] focus:border-[#49372D] focus:ring-2 focus:ring-[#49372D]/10 outline-none"
                    required
                  />
                  <span className="absolute right-4 top-2.5 text-xs text-[#8A796D] font-semibold">
                    kg
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
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
    </div>
  );
};
