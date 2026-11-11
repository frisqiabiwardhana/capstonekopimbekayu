import React from 'react';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Boxes,
  BookOpenCheck,
  Users,
  LogOut,
  Coffee
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { AppMenu } from '../../types/inventory';
import { Logo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeMenu, setActiveMenu, logout } = useInventory();
  if (!currentUser) return null;

  const role = currentUser.role;

  // Build menu list based strictly on permissions
  const menuItems: { id: AppMenu; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan Stok & Aktivitas'
    },
    {
      id: 'masuk',
      label: 'Bahan Baku Masuk',
      icon: ArrowDownToLine,
      description: role === 'OPERATOR' ? 'Input Pengiriman Biji Kopi' : 'Pemeriksaan & Verifikasi'
    },
    {
      id: 'keluar',
      label: 'Bahan Baku Keluar',
      icon: ArrowUpFromLine,
      description: role === 'OPERATOR' ? 'Input Kebutuhan Produksi' : 'Pemeriksaan & Verifikasi'
    },
    {
      id: 'retur',
      label: 'Retur Penjualan',
      icon: RotateCcw,
      description: role === 'PEMILIK' ? 'Persetujuan Kelayakan' : role === 'OPERATOR' ? 'Input Produk Kembali' : 'Verifikasi Fisik'
    },
    {
      id: 'stok',
      label: 'Stok Tersedia',
      icon: Boxes,
      description: 'Monitoring & Kartu Stok'
    }
  ];

  // Pembukuan: Operator (Tidak Ada Akses), Verifikator (Lihat), Pemilik (Lihat, Ekspor & Cetak)
  if (role === 'VERIFIKATOR' || role === 'PEMILIK') {
    menuItems.push({
      id: 'pembukuan',
      label: 'Pembukuan',
      icon: BookOpenCheck,
      description: role === 'PEMILIK' ? 'Laporan, Ekspor & Cetak' : 'Laporan Rekapitulasi'
    });
  }

  // Pengelolaan Pengguna: Only Pemilik
  if (role === 'PEMILIK') {
    menuItems.push({
      id: 'pengguna',
      label: 'Pengelolaan Pengguna',
      icon: Users,
      description: 'Kelola Akun & Akses Peran'
    });
  }

  const handleSelect = (id: AppMenu) => {
    setActiveMenu(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container with Dark Espresso Palette */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#49372D] text-[#F5F1E9] flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } border-r border-[#302923]`}
      >
        {/* Brand header */}
        <div className="p-6 border-b border-[#8B6B52]/30 flex items-center justify-between">
          <Logo variant="sidebar" size="md" />
        </div>

        {/* User Role Banner */}
        <div className="px-6 py-3.5 bg-[#3A2B23]/70 border-b border-[#8B6B52]/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#8B6B52] text-[#F5F1E9] flex items-center justify-center font-bold text-xs uppercase">
              {currentUser.name.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#D8C7B3] uppercase tracking-wider font-medium">
                Peran: {role}
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Status Online" />
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#D8C7B3]/70 uppercase tracking-widest">
            Menu Navigasi
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#8B6B52] text-white font-semibold shadow-sm'
                    : 'text-[#D8C7B3] hover:text-white hover:bg-[#3A2B23]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#D8C7B3]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-[#F5F1E9]/80' : 'text-[#8A796D]'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Coffee Production Footer Badge & Logout */}
        <div className="p-4 border-t border-[#8B6B52]/30 space-y-3 bg-[#3A2B23]/40">
          <div className="p-3 bg-[#3A2B23] rounded-xl border border-[#8B6B52]/20 flex items-center gap-3">
            <Coffee className="w-5 h-5 text-[#D8C7B3] shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-white">Produksi Kopi Mbekayu</p>
              <p className="text-[10px] text-[#D8C7B3]/80">3 Varietas Biji Terpantau</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D8C7B3] hover:text-white hover:bg-[#302923] border border-[#8B6B52]/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
};
