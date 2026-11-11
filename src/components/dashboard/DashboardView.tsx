import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  AlertTriangle,
  Sliders,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { formatKg, formatDateIndo } from '../../utils/inventoryRules';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    stockSummaries,
    totalStockKg,
    totalIncomingVerifiedKg,
    totalOutgoingVerifiedKg,
    totalReturnsReusableKg,
    incomingList,
    outgoingList,
    returnsList,
    setActiveMenu,
    updateMinThreshold
  } = useInventory();

  // Threshold edit modal state (for Pemilik)
  const [editingMaterial, setEditingMaterial] = useState<{ id: string; name: string; current: number } | null>(null);
  const [thresholdInput, setThresholdInput] = useState<number>(0);
  const [thresholdMessage, setThresholdMessage] = useState('');

  // 1. Calculate Monthly Activity (current month based on latest transaction dates)
  const currentMonthActivity = useMemo(() => {
    // Current month is November 2026 (or dynamic from now)
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth(); // 0-indexed

    const isThisMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    };

    const inThisMonth = incomingList
      .filter(i => isThisMonth(i.date) && i.status === 'Terverifikasi')
      .reduce((sum, i) => sum + i.quantityKg, 0);

    const outThisMonth = outgoingList
      .filter(o => isThisMonth(o.date) && o.status === 'Terverifikasi')
      .reduce((sum, o) => sum + o.quantityKg, 0);

    const retThisMonth = returnsList
      .filter(r => isThisMonth(r.date) && r.status === 'Disetujui' && r.isReusableForStock === true)
      .reduce((sum, r) => sum + r.quantityKg, 0);

    return {
      incomingKg: Number(inThisMonth.toFixed(2)),
      outgoingKg: Number(outThisMonth.toFixed(2)),
      returnsKg: Number(retThisMonth.toFixed(2))
    };
  }, [incomingList, outgoingList, returnsList]);

  // 2. Calculate 6-Month Movement Chart Data
  const sixMonthChartData = useMemo(() => {
    // Generate array for last 6 months up to current
    const months: { key: string; label: string; incoming: number; outgoing: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      // Sum incoming
      const incTotal = incomingList
        .filter(item => {
          const itemDate = new Date(item.date);
          return (
            itemDate.getFullYear() === year &&
            itemDate.getMonth() === month &&
            item.status === 'Terverifikasi'
          );
        })
        .reduce((sum, item) => sum + item.quantityKg, 0);

      // Sum outgoing
      const outTotal = outgoingList
        .filter(item => {
          const itemDate = new Date(item.date);
          return (
            itemDate.getFullYear() === year &&
            itemDate.getMonth() === month &&
            item.status === 'Terverifikasi'
          );
        })
        .reduce((sum, item) => sum + item.quantityKg, 0);

      months.push({
        key,
        label,
        incoming: Number(incTotal.toFixed(1)),
        outgoing: Number(outTotal.toFixed(1))
      });
    }

    return months;
  }, [incomingList, outgoingList]);

  // Max value for chart scaling
  const maxChartValue = useMemo(() => {
    let max = 100;
    sixMonthChartData.forEach(d => {
      if (d.incoming > max) max = d.incoming;
      if (d.outgoing > max) max = d.outgoing;
    });
    return Math.ceil(max * 1.15); // Add headroom
  }, [sixMonthChartData]);

  // 3. Combined Recent Transactions (latest 6)
  const recentTransactions = useMemo(() => {
    interface TxItem {
      id: string;
      date: string;
      type: 'Masuk' | 'Keluar' | 'Retur';
      ref: string;
      material: string;
      qty: number;
      status: string;
      notes: string;
    }

    const all: TxItem[] = [];

    incomingList.forEach(i => {
      all.push({
        id: i.id,
        date: i.date,
        type: 'Masuk',
        ref: i.transactionNumber,
        material: i.materialName,
        qty: i.quantityKg,
        status: i.status,
        notes: `Pemasok: ${i.supplierName}`
      });
    });

    outgoingList.forEach(o => {
      all.push({
        id: o.id,
        date: o.date,
        type: 'Keluar',
        ref: o.transactionNumber,
        material: o.materialName,
        qty: o.quantityKg,
        status: o.status,
        notes: o.purpose
      });
    });

    returnsList.forEach(r => {
      all.push({
        id: r.id,
        date: r.date,
        type: 'Retur',
        ref: r.transactionNumber,
        material: r.materialName,
        qty: r.quantityKg,
        status: r.status,
        notes: r.reason
      });
    });

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, 6);
  }, [incomingList, outgoingList, returnsList]);

  // Open threshold editor
  const handleOpenEditThreshold = (mat: { materialId: string; materialName: string; minThreshold: number }) => {
    setEditingMaterial({
      id: mat.materialId,
      name: mat.materialName,
      current: mat.minThreshold
    });
    setThresholdInput(mat.minThreshold);
    setThresholdMessage('');
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    const res = updateMinThreshold(editingMaterial.id, thresholdInput);
    if (res.success) {
      setEditingMaterial(null);
    } else {
      setThresholdMessage(res.message || 'Gagal menyimpan perubahan.');
    }
  };

  const isOwner = currentUser?.role === 'PEMILIK';
  const isOperator = currentUser?.role === 'OPERATOR';

  return (
    <div className="space-y-6">
      {/* SECTION A: Total Inventory Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#302923] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#8B6B52]" />
            <span>Total Persediaan Gudang Produksi</span>
          </h2>
          <span className="text-xs text-[#8A796D] bg-white px-2.5 py-1 rounded-lg border border-[#D8C7B3]/50">
            Kalkulasi Real-Time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Combined Stock */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs hover:border-[#8B6B52]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider">
                Total Stok Siap Pakai
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#49372D] text-[#F5F1E9] flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[#302923] tracking-tight">
                {formatKg(totalStockKg)}
              </span>
              <span className="text-sm font-semibold text-[#8A796D]">kg</span>
            </div>
            <p className="text-xs text-[#8A796D] mt-2 flex items-center gap-1">
              <span>Akumulasi dari 3 varietas biji</span>
            </p>
          </div>

          {/* 2. Total Incoming Verified */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs hover:border-[#8B6B52]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider">
                Total Bahan Masuk
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#8B6B52]/15 text-[#49372D] flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[#302923] tracking-tight">
                {formatKg(totalIncomingVerifiedKg)}
              </span>
              <span className="text-sm font-semibold text-[#8A796D]">kg</span>
            </div>
            <p className="text-xs text-[#8A796D] mt-2">
              Hanya pasokan terverifikasi
            </p>
          </div>

          {/* 3. Total Outgoing Verified */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs hover:border-[#8B6B52]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider">
                Total Bahan Keluar
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#8B6B52]/15 text-[#8B6B52] flex items-center justify-center">
                <ArrowUpFromLine className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[#302923] tracking-tight">
                {formatKg(totalOutgoingVerifiedKg)}
              </span>
              <span className="text-sm font-semibold text-[#8A796D]">kg</span>
            </div>
            <p className="text-xs text-[#8A796D] mt-2">
              Bahan terpakai untuk roasting
            </p>
          </div>

          {/* 4. Total Approved Returns */}
          <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs hover:border-[#8B6B52]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider">
                Retur Masuk Stok
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#D8C7B3]/40 text-[#49372D] flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[#302923] tracking-tight">
                {formatKg(totalReturnsReusableKg)}
              </span>
              <span className="text-sm font-semibold text-[#8A796D]">kg</span>
            </div>
            <p className="text-xs text-[#8A796D] mt-2">
              Disetujui layak oleh Pemilik
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B: Individual Stock Cards (Robusta, Arabica, Excelsa) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#302923] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8B6B52]" />
            <span>Kartu Stok per Jenis Biji Kopi</span>
          </h2>
          {isOwner && (
            <span className="text-xs font-medium text-[#49372D] bg-[#D8C7B3]/30 px-3 py-1 rounded-lg border border-[#8B6B52]/30 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Pemilik dapat menyesuaikan batas minimum</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stockSummaries.map(summary => {
            const isMenipis = summary.status === 'Menipis';
            const isHabis = summary.status === 'Stok Habis';

            return (
              <div
                key={summary.materialId}
                className={`bg-white rounded-2xl p-6 border transition-all shadow-xs relative overflow-hidden ${
                  isHabis
                    ? 'border-red-300 ring-2 ring-red-100'
                    : isMenipis
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-[#D8C7B3]/70 hover:border-[#8B6B52]'
                }`}
              >
                {/* Top Accent bar based on status */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isHabis ? 'bg-red-500' : isMenipis ? 'bg-amber-500' : 'bg-[#49372D]'
                  }`}
                />

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#302923]">
                      {summary.materialName}
                    </h3>
                    <p className="text-xs text-[#8A796D] mt-0.5">
                      Satuan: {summary.unit}
                    </p>
                  </div>
                  <Badge status={summary.status} />
                </div>

                {/* Main Stock Figure */}
                <div className="my-4 p-4 rounded-xl bg-[#F5F1E9]/60 border border-[#D8C7B3]/40">
                  <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider block">
                    Stok Tersedia Saat Ini
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-black text-[#49372D]">
                      {formatKg(summary.currentStock)}
                    </span>
                    <span className="text-sm font-bold text-[#8A796D]">kg</span>
                  </div>

                  {/* Progress bar relative to minimum threshold */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-[#8A796D] mb-1">
                      <span>Batas Minimum: <strong>{formatKg(summary.minThreshold)} kg</strong></span>
                      <span>
                        {Math.round((summary.currentStock / Math.max(1, summary.minThreshold * 2)) * 100)}% Rasio Cadangan
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHabis ? 'bg-red-500' : isMenipis ? 'bg-amber-500' : 'bg-[#49372D]'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(5, (summary.currentStock / Math.max(1, summary.minThreshold * 2)) * 100)
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub details */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#D8C7B3]/40">
                  <div>
                    <span className="text-[#8A796D] block">Masuk (Terverifikasi):</span>
                    <span className="font-semibold text-[#302923]">+{formatKg(summary.incomingVerifiedKg)} kg</span>
                  </div>
                  <div>
                    <span className="text-[#8A796D] block">Keluar (Terverifikasi):</span>
                    <span className="font-semibold text-[#302923]">-{formatKg(summary.outgoingVerifiedKg)} kg</span>
                  </div>
                </div>

                {/* Action for Pemilik */}
                {isOwner && (
                  <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                    <button
                      onClick={() => handleOpenEditThreshold(summary)}
                      className="text-xs font-semibold text-[#49372D] hover:text-[#8B6B52] flex items-center gap-1.5 p-1 rounded cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Atur Batas Minimum</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION C & D: Monthly Activity & 6-Month Inventory Movement Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION C: Monthly Activity Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8C7B3]/40">
              <h3 className="text-sm font-bold text-[#302923] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8B6B52]" />
                <span>Aktivitas Bulan Ini</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#8B6B52] bg-[#F5F1E9] px-2 py-0.5 rounded-md">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-4 mt-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E9]/50 border border-[#D8C7B3]/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8A796D] block">Bahan Baku Masuk</span>
                    <span className="text-sm font-bold text-[#302923]">
                      +{formatKg(currentMonthActivity.incomingKg)} kg
                    </span>
                  </div>
                </div>
                <Badge status="Terverifikasi" size="sm" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E9]/50 border border-[#D8C7B3]/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                    <ArrowUpFromLine className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8A796D] block">Bahan Baku Keluar</span>
                    <span className="text-sm font-bold text-[#302923]">
                      -{formatKg(currentMonthActivity.outgoingKg)} kg
                    </span>
                  </div>
                </div>
                <Badge status="Terverifikasi" size="sm" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F1E9]/50 border border-[#D8C7B3]/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-200 text-[#49372D] flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8A796D] block">Retur Layak Digunakan</span>
                    <span className="text-sm font-bold text-[#302923]">
                      +{formatKg(currentMonthActivity.returnsKg)} kg
                    </span>
                  </div>
                </div>
                <Badge status="Disetujui" size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#D8C7B3]/40">
            <p className="text-[11px] text-[#8A796D] leading-relaxed">
              Seluruh penyesuaian stok hanya terjadi setelah verifikasi resmi dilakukan oleh staf terkait.
            </p>
          </div>
        </div>

        {/* SECTION D: Inventory Movement Chart (Last 6 Months) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D8C7B3]/40">
              <div>
                <h3 className="text-sm font-bold text-[#302923] flex items-center gap-2">
                  <span>Grafik Pergerakan Stok 6 Bulan Terakhir</span>
                </h3>
                <p className="text-xs text-[#8A796D] mt-0.5">
                  Perbandingan total bahan baku masuk vs keluar (kg)
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#49372D]" />
                  <span className="text-[#302923] font-medium">Bahan Masuk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#8B6B52]" />
                  <span className="text-[#302923] font-medium">Bahan Keluar</span>
                </div>
              </div>
            </div>

            {/* Custom Responsive SVG / HTML Bar Chart */}
            <div className="mt-6 pt-4">
              <div className="h-56 flex items-end justify-between gap-3 px-2">
                {sixMonthChartData.map(item => {
                  const inHeight = Math.max(8, (item.incoming / maxChartValue) * 100);
                  const outHeight = Math.max(8, (item.outgoing / maxChartValue) * 100);

                  return (
                    <div key={item.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-44 relative">
                        {/* Hover tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#302923] text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none whitespace-nowrap z-20 shadow-md">
                          Masuk: {item.incoming} kg | Keluar: {item.outgoing} kg
                        </div>

                        {/* Incoming bar */}
                        <div
                          style={{ height: `${inHeight}%` }}
                          className="w-1/2 max-w-[28px] bg-[#49372D] hover:bg-[#3A2B23] rounded-t-md transition-all duration-300 relative group-hover:brightness-110 flex items-start justify-center"
                        >
                          {item.incoming > 0 && (
                            <span className="text-[9px] font-bold text-[#F5F1E9] mt-1 hidden sm:block">
                              {item.incoming}
                            </span>
                          )}
                        </div>

                        {/* Outgoing bar */}
                        <div
                          style={{ height: `${outHeight}%` }}
                          className="w-1/2 max-w-[28px] bg-[#8B6B52] hover:bg-[#6e533e] rounded-t-md transition-all duration-300 relative group-hover:brightness-110 flex items-start justify-center"
                        >
                          {item.outgoing > 0 && (
                            <span className="text-[9px] font-bold text-white mt-1 hidden sm:block">
                              {item.outgoing}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Month label */}
                      <span className="text-[11px] font-semibold text-[#8A796D] mt-2 block">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-[#8A796D] flex justify-between items-center">
            <span>Skala maksimum: {maxChartValue} kg</span>
            <span>Data bersumber dari mutasi terverifikasi</span>
          </div>
        </div>
      </div>

      {/* SECTION E & F: Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION E: Recent Transactions (Latest 6) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#D8C7B3]/60 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8C7B3]/40">
            <div>
              <h3 className="text-sm font-bold text-[#302923]">
                Transaksi Terkini
              </h3>
              <p className="text-xs text-[#8A796D] mt-0.5">
                Mutasi bahan baku dan retur terbaru yang tercatat
              </p>
            </div>
            <button
              onClick={() => setActiveMenu('stok')}
              className="text-xs font-semibold text-[#49372D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Kartu Stok</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 overflow-x-auto">
            <table className="w-full text-left text-xs mt-2">
              <thead>
                <tr className="text-[#8A796D] uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5 pr-2">Tanggal</th>
                  <th className="py-2.5 px-2">No. Referensi</th>
                  <th className="py-2.5 px-2">Jenis Bahan</th>
                  <th className="py-2.5 px-2">Tipe</th>
                  <th className="py-2.5 px-2 text-right">Jumlah</th>
                  <th className="py-2.5 pl-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#F5F1E9]/40 transition-colors">
                    <td className="py-3 pr-2 text-[#8A796D] whitespace-nowrap">
                      {formatDateIndo(tx.date)}
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold text-[#302923]">
                      {tx.ref}
                    </td>
                    <td className="py-3 px-2 font-medium text-[#302923]">
                      {tx.material}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'Masuk'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'Keluar'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-200 text-[#49372D]'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-[#302923] whitespace-nowrap">
                      {tx.type === 'Keluar' ? '-' : '+'}
                      {formatKg(tx.qty)} kg
                    </td>
                    <td className="py-3 pl-2 text-center">
                      <Badge status={tx.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION F: Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#302923] pb-3 border-b border-[#D8C7B3]/40">
              Aksi Cepat
            </h3>
            <p className="text-xs text-[#8A796D] mt-2 mb-4">
              Pintasan cepat untuk proses pencatatan dan monitoring stok harian.
            </p>

            <div className="space-y-3">
              {/* 1. Input Bahan Baku Masuk (Operator only or View) */}
              <button
                onClick={() => setActiveMenu('masuk')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#D8C7B3]/70 hover:border-[#49372D] hover:bg-[#F5F1E9]/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#49372D] text-white flex items-center justify-center shrink-0">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#302923] block group-hover:text-[#49372D]">
                      {isOperator ? 'Input Bahan Baku Masuk' : 'Bahan Baku Masuk'}
                    </span>
                    <span className="text-[11px] text-[#8A796D]">
                      {isOperator ? 'Catat pasokan baru petani' : 'Lihat & verifikasi pasokan'}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A796D] group-hover:text-[#49372D] transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* 2. Input Bahan Baku Keluar */}
              <button
                onClick={() => setActiveMenu('keluar')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#D8C7B3]/70 hover:border-[#49372D] hover:bg-[#F5F1E9]/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8B6B52] text-white flex items-center justify-center shrink-0">
                    <ArrowUpFromLine className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#302923] block group-hover:text-[#49372D]">
                      {isOperator ? 'Input Bahan Baku Keluar' : 'Bahan Baku Keluar'}
                    </span>
                    <span className="text-[11px] text-[#8A796D]">
                      {isOperator ? 'Catat penggunaan roasting' : 'Lihat & verifikasi pengeluaran'}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A796D] group-hover:text-[#49372D] transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* 3. Input Retur Penjualan */}
              <button
                onClick={() => setActiveMenu('retur')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#D8C7B3]/70 hover:border-[#49372D] hover:bg-[#F5F1E9]/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#302923] text-[#F5F1E9] flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#302923] block group-hover:text-[#49372D]">
                      {isOperator ? 'Input Retur Penjualan' : isOwner ? 'Persetujuan Retur' : 'Retur Penjualan'}
                    </span>
                    <span className="text-[11px] text-[#8A796D]">
                      {isOwner ? 'Review & setujui masuk stok' : 'Pemeriksaan kondisi biji retur'}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A796D] group-hover:text-[#49372D] transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* 4. View Stok Tersedia */}
              <button
                onClick={() => setActiveMenu('stok')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#D8C7B3]/70 hover:border-[#49372D] hover:bg-[#F5F1E9]/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D8C7B3] text-[#49372D] flex items-center justify-center shrink-0">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#302923] block group-hover:text-[#49372D]">
                      View Stok Tersedia
                    </span>
                    <span className="text-[11px] text-[#8A796D]">
                      Tabel detail & audit mutasi stok
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8A796D] group-hover:text-[#49372D] transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <span className="text-[11px] text-[#8A796D]">
              Masuk sebagai: <strong>{currentUser?.role}</strong> ({currentUser?.name})
            </span>
          </div>
        </div>
      </div>

      {/* Modal: Edit Minimum Stock Threshold (Pemilik Only) */}
      {editingMaterial && isOwner && (
        <>
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
                    {editingMaterial.name}
                  </p>
                </div>
              </div>

              {thresholdMessage && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  {thresholdMessage}
                </div>
              )}

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
                  <p className="text-[11px] text-[#8A796D] mt-1.5">
                    Jika stok bahan berada di bawah atau sama dengan angka ini, sistem akan otomatis menetapkan status <strong>Menipis</strong>.
                  </p>
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
                    Simpan Batas Minimum
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
