import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  Download,
  Printer,
  Calendar,
  Lock,
  Layers,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Boxes,
  FileText
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { formatKg, formatRupiah, formatDateIndo } from '../../utils/inventoryRules';

export const BookkeepingView: React.FC = () => {
  const {
    currentUser,
    materials,
    incomingList,
    outgoingList,
    returnsList,
    stockSummaries,
    totalStockKg
  } = useInventory();

  // Period filter
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const role = currentUser?.role;
  const canExportAndPrint = role === 'PEMILIK';

  // Guard: If Operator somehow arrives here, show access denied
  if (role === 'OPERATOR') {
    return (
      <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-[#D8C7B3] shadow-sm">
        <div className="w-14 h-14 bg-rose-50 text-rose-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[#302923]">Akses Dibatasi</h3>
        <p className="text-xs text-[#8A796D] mt-2 leading-relaxed">
          Sesuai matriks otorisasi Kopi Mbekayu, peran <strong>OPERATOR</strong> tidak memiliki hak akses ke menu Pembukuan & Laporan Keuangan Persediaan.
        </p>
      </div>
    );
  }

  // Filter transactions by period
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const yMatches = selectedYear === 'all' || d.getFullYear().toString() === selectedYear;
    const mMatches = selectedMonth === 'all' || (d.getMonth() + 1).toString() === selectedMonth;
    return yMatches && mMatches;
  };

  const periodIncoming = incomingList.filter(i => filterByDate(i.date) && i.status === 'Terverifikasi');
  const periodOutgoing = outgoingList.filter(o => filterByDate(o.date) && o.status === 'Terverifikasi');
  const periodReturns = returnsList.filter(r => filterByDate(r.date) && r.status === 'Disetujui');

  // Ledger calculation per material
  const materialLedger = useMemo(() => {
    return materials.map(mat => {
      const inc = periodIncoming.filter(i => i.materialId === mat.id);
      const out = periodOutgoing.filter(o => o.materialId === mat.id);
      const ret = periodReturns.filter(r => r.materialId === mat.id);

      const incKg = inc.reduce((s, i) => s + i.quantityKg, 0);
      const incCost = inc.reduce((s, i) => s + (i.totalCost || (i.pricePerKg ? i.pricePerKg * i.quantityKg : 0)), 0);

      const outKg = out.reduce((s, o) => s + o.quantityKg, 0);

      const retReusableKg = ret.filter(r => r.isReusableForStock === true).reduce((s, r) => s + r.quantityKg, 0);
      const retScrapKg = ret.filter(r => r.isReusableForStock === false).reduce((s, r) => s + r.quantityKg, 0);

      // Average cost per kg estimate
      const avgPricePerKg = incCost > 0 && incKg > 0 ? incCost / incKg : (mat.id === 'mat-arabica' ? 115000 : mat.id === 'mat-robusta' ? 45000 : 65000);
      const outEstimatedCost = outKg * avgPricePerKg;

      const currentSummary = stockSummaries.find(s => s.materialId === mat.id);
      const currentStock = currentSummary ? currentSummary.currentStock : 0;
      const valuation = currentStock * avgPricePerKg;

      return {
        materialId: mat.id,
        materialName: mat.name,
        unit: mat.unit,
        initialStock: mat.initialStock,
        incomingKg: Number(incKg.toFixed(2)),
        incomingCost: incCost,
        outgoingKg: Number(outKg.toFixed(2)),
        outgoingCost: outEstimatedCost,
        retReusableKg: Number(retReusableKg.toFixed(2)),
        retScrapKg: Number(retScrapKg.toFixed(2)),
        currentStock,
        valuation,
        avgPricePerKg
      };
    });
  }, [materials, periodIncoming, periodOutgoing, periodReturns, stockSummaries]);

  // Overall totals
  const totalValuation = materialLedger.reduce((sum, item) => sum + item.valuation, 0);
  const totalIncomingCost = materialLedger.reduce((sum, item) => sum + item.incomingCost, 0);

  // Export CSV
  const handleExportCSV = () => {
    if (!canExportAndPrint) return;

    const headers = [
      'Jenis Bahan Baku',
      'Satuan',
      'Stok Awal (kg)',
      'Masuk Terverifikasi (kg)',
      'Nilai Pembelian (IDR)',
      'Keluar Terverifikasi (kg)',
      'Retur Layak Masuk Stok (kg)',
      'Retur Afkir/Rusak (kg)',
      'Stok Akhir (kg)',
      'Estimasi Nilai Persediaan (IDR)'
    ];

    const rows = materialLedger.map(m => [
      `"${m.materialName}"`,
      m.unit,
      m.initialStock,
      m.incomingKg,
      m.incomingCost,
      m.outgoingKg,
      m.retReusableKg,
      m.retScrapKg,
      m.currentStock,
      m.valuation
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pembukuan_Stok_Kopi_Mbekayu_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!canExportAndPrint) return;
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#49372D] text-white flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#302923]">
              Pembukuan Persediaan & Valuasi Stok
            </h2>
          </div>
          <p className="text-xs text-[#8A796D] mt-1">
            Rekapitulasi otomatis mutasi bahan baku kopi dan estimasi nilai persediaan.
          </p>
        </div>

        {/* Action Buttons for Pemilik */}
        {canExportAndPrint && (
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#49372D] bg-[#F5F1E9] hover:bg-[#D8C7B3]/50 border border-[#D8C7B3] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#49372D] hover:bg-[#3A2B23] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Period Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-[#8B6B52]" />
          <span className="text-xs font-bold text-[#302923]">Periode Pembukuan:</span>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F1E9]/60 text-xs text-[#302923] rounded-xl border border-[#D8C7B3] outline-none cursor-pointer"
          >
            <option value="2026">Tahun 2026</option>
            <option value="all">Semua Tahun</option>
          </select>

          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F1E9]/60 text-xs text-[#302923] rounded-xl border border-[#D8C7B3] outline-none cursor-pointer"
          >
            <option value="all">Semua Bulan (Sepanjang Tahun)</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>

        <div className="text-xs text-[#8A796D]">
          Hak Akses: <strong>{role === 'PEMILIK' ? 'Lihat, Ekspor & Cetak' : 'Lihat'}</strong>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs">
          <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider block">
            Total Nilai Persediaan Biji Kopi
          </span>
          <div className="mt-2 text-2xl font-extrabold text-[#49372D]">
            {formatRupiah(totalValuation)}
          </div>
          <p className="text-[11px] text-[#8A796D] mt-1">
            Berdasarkan harga perolehan &amp; stok tersedia
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs">
          <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider block">
            Total Pembelian Bahan Masuk Periode
          </span>
          <div className="mt-2 text-2xl font-extrabold text-[#302923]">
            {formatRupiah(totalIncomingCost)}
          </div>
          <p className="text-[11px] text-[#8A796D] mt-1">
            Total pengadaan terverifikasi pada periode terpilih
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs">
          <span className="text-xs font-semibold text-[#8A796D] uppercase tracking-wider block">
            Total Fisik Stok Siap Pakai
          </span>
          <div className="mt-2 text-2xl font-extrabold text-[#8B6B52]">
            {formatKg(totalStockKg)} kg
          </div>
          <p className="text-[11px] text-[#8A796D] mt-1">
            3 varietas biji kopi utama
          </p>
        </div>
      </div>

      {/* Detailed Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#D8C7B3]/60 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F5F1E9] border-b border-[#D8C7B3]/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#302923] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8B6B52]" />
            <span>Tabel Buku Besar Persediaan Bahan Baku (Inventory Ledger)</span>
          </h3>
          <span className="text-[11px] text-[#8A796D]">
            Otomatis sinkron dengan verifikasi gudang
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#302923] border-b border-[#D8C7B3]/40">
              <tr>
                <th className="py-3 px-4 font-bold">Jenis Bahan Baku</th>
                <th className="py-3 px-3 font-bold text-right">Saldo Awal</th>
                <th className="py-3 px-3 font-bold text-right text-emerald-800">Masuk (kg)</th>
                <th className="py-3 px-3 font-bold text-right text-amber-900">Keluar (kg)</th>
                <th className="py-3 px-3 font-bold text-right text-[#49372D]">Retur Layak (kg)</th>
                <th className="py-3 px-3 font-bold text-right text-rose-800">Retur Afkir (kg)</th>
                <th className="py-3 px-3 font-bold text-right text-[#49372D]">Stok Akhir (kg)</th>
                <th className="py-3 px-4 font-bold text-right">Valuasi Persediaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {materialLedger.map(row => (
                <tr key={row.materialId} className="hover:bg-[#F5F1E9]/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#302923]">
                    {row.materialName}
                    <div className="text-[10px] text-[#8A796D] font-normal">
                      Estimasi HPP: {formatRupiah(row.avgPricePerKg)}/kg
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-[#8A796D]">
                    {formatKg(row.initialStock)} kg
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                    +{formatKg(row.incomingKg)} kg
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-amber-800">
                    -{formatKg(row.outgoingKg)} kg
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-[#49372D]">
                    +{formatKg(row.retReusableKg)} kg
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-700 font-medium">
                    {formatKg(row.retScrapKg)} kg
                  </td>
                  <td className="py-3.5 px-3 text-right font-black text-[#49372D] text-sm">
                    {formatKg(row.currentStock)} kg
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#302923]">
                    {formatRupiah(row.valuation)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F5F1E9] font-bold text-xs text-[#302923] border-t-2 border-[#D8C7B3]">
              <tr>
                <td className="py-3.5 px-4">TOTAL PERSEDIAAN</td>
                <td className="py-3.5 px-3 text-right">
                  {formatKg(materialLedger.reduce((s, r) => s + r.initialStock, 0))} kg
                </td>
                <td className="py-3.5 px-3 text-right text-emerald-800">
                  +{formatKg(materialLedger.reduce((s, r) => s + r.incomingKg, 0))} kg
                </td>
                <td className="py-3.5 px-3 text-right text-amber-900">
                  -{formatKg(materialLedger.reduce((s, r) => s + r.outgoingKg, 0))} kg
                </td>
                <td className="py-3.5 px-3 text-right text-[#49372D]">
                  +{formatKg(materialLedger.reduce((s, r) => s + r.retReusableKg, 0))} kg
                </td>
                <td className="py-3.5 px-3 text-right text-rose-800">
                  {formatKg(materialLedger.reduce((s, r) => s + r.retScrapKg, 0))} kg
                </td>
                <td className="py-3.5 px-3 text-right text-sm font-black text-[#49372D]">
                  {formatKg(totalStockKg)} kg
                </td>
                <td className="py-3.5 px-4 text-right font-black text-[#49372D]">
                  {formatRupiah(totalValuation)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
