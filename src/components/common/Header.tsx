import React, { useState } from 'react';
import { Menu, RotateCcw, ChevronDown, Check, UserCircle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserRole } from '../../types/inventory';
import { Badge } from './Badge';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, switchRole, resetToDefaultData, activeMenu } = useInventory();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!currentUser) return null;

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Produksi Kopi',
      subtitle: 'Ringkasan total persediaan, aktivitas bulanan, dan pergerakan stok biji kopi'
    },
    masuk: {
      title: 'Bahan Baku Masuk',
      subtitle: 'Pencatatan pasokan biji kopi mentah dari petani & koperasi mitra'
    },
    keluar: {
      title: 'Bahan Baku Keluar',
      subtitle: 'Pengeluaran biji kopi untuk proses roasting dan kemasan produksi'
    },
    retur: {
      title: 'Retur Penjualan',
      subtitle: 'Pencatatan produk kembali, verifikasi fisik, dan persetujuan kelayakan stok'
    },
    stok: {
      title: 'Stok Tersedia',
      subtitle: 'Monitoring inventaris biji kopi, indikator batas minimum, dan kartu mutasi stok'
    },
    pembukuan: {
      title: 'Pembukuan & Laporan',
      subtitle: 'Rekapitulasi otomatis mutasi stok, nilai persediaan, dan cetak dokumen'
    },
    pengguna: {
      title: 'Pengelolaan Pengguna',
      subtitle: 'Pengaturan akun staf operasional, verifikator kualitas, dan manajemen hak akses'
    }
  };

  const currentMeta = titleMap[activeMenu] || titleMap.dashboard;

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'PEMILIK', label: 'Pemilik (Hendra)', desc: 'Akses penuh, persetujuan retur, ubah batas & kelola akun' },
    { role: 'VERIFIKATOR', label: 'Verifikator (Siti)', desc: 'Pemeriksaan fisik, koreksi data, verifikasi mutasi' },
    { role: 'OPERATOR', label: 'Operator (Ahmad)', desc: 'Input bahan masuk, pengeluaran roasting, dan retur' }
  ];

  return (
    <header className="bg-white border-b border-[#D8C7B3]/60 sticky top-0 z-30 px-4 md:px-8 py-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            className="p-2 -ml-2 rounded-lg text-[#49372D] hover:bg-[#F5F1E9] md:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-serif font-bold text-[#302923] tracking-tight leading-tight">
              {currentMeta.title}
            </h1>
            <p className="text-xs text-[#8A796D] hidden sm:block mt-0.5">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F1E9] hover:bg-[#EAE4D8] border border-[#D8C7B3] rounded-xl text-xs font-semibold text-[#49372D] transition-colors cursor-pointer shadow-xs"
              title="Ganti peran untuk menguji hak akses"
            >
              <span className="hidden sm:inline text-[#8A796D] font-normal">Peran Aktif:</span>
              <span className="font-bold">{currentUser.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A796D]" />
            </button>

            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#D8C7B3] py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 border-b border-stone-100">
                    <p className="text-[11px] font-bold text-[#8A796D] uppercase tracking-wider">
                      Uji Matriks Hak Akses
                    </p>
                    <p className="text-[10px] text-[#8A796D]/80">
                      Pilih peran untuk melihat perbedaan antarmuka
                    </p>
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left flex items-start gap-2.5 hover:bg-[#F5F1E9] transition-colors cursor-pointer ${
                        currentUser.role === r.role ? 'bg-[#F5F1E9]/80 font-semibold' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {currentUser.role === r.role ? (
                          <Check className="w-4 h-4 text-[#49372D]" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#D8C7B3]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-[#302923] flex items-center gap-1.5">
                          <span>{r.label}</span>
                          <Badge status={r.role} size="sm" />
                        </div>
                        <div className="text-[11px] text-[#8A796D] leading-tight mt-0.5">
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reset Demo Data Pill */}
          <div className="relative">
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset data demo ke kondisi awal"
              className="p-2 text-[#8A796D] hover:text-[#49372D] hover:bg-[#F5F1E9] border border-transparent hover:border-[#D8C7B3] rounded-xl transition-colors cursor-pointer hidden md:flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px]">Reset Demo</span>
            </button>

            {showResetConfirm && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 z-40"
                  onClick={() => setShowResetConfirm(false)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-[90vw] z-50 border border-[#D8C7B3]">
                  <h3 className="text-base font-bold text-[#49372D]">Reset Data Demo?</h3>
                  <p className="text-xs text-[#8A796D] mt-2 leading-relaxed">
                    Tindakan ini akan mengembalikan data stok, transaksi masuk, keluar, retur, dan pengguna ke data awal pabrik.
                  </p>
                  <div className="flex items-center justify-end gap-2.5 mt-5">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#8A796D] hover:text-[#302923] rounded-lg border border-[#D8C7B3] cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        resetToDefaultData();
                        setShowResetConfirm(false);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-[#49372D] text-white rounded-lg hover:bg-[#3A2B23] cursor-pointer"
                    >
                      Ya, Reset Data
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#D8C7B3]/60">
            <div className="w-8 h-8 rounded-full bg-[#49372D] text-[#F5F1E9] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              <UserCircle className="w-5 h-5 text-[#D8C7B3]" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-[#302923] leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#8A796D] font-medium leading-tight">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
