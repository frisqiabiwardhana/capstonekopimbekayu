import React from 'react';
import { StockStatus, IncomingStatus, OutgoingStatus, ReturnStatus, UserRole } from '../../types/inventory';

type BadgeType = 
  | StockStatus 
  | IncomingStatus 
  | OutgoingStatus 
  | ReturnStatus 
  | UserRole 
  | 'Layak Masuk Stok' 
  | 'Tidak Masuk Stok' 
  | 'Aktif' 
  | 'Nonaktif';

interface BadgeProps {
  status: BadgeType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-semibold' : 'px-3 py-1 text-sm font-semibold';

  const getColorClasses = (val: string) => {
    switch (val) {
      // Stock Statuses
      case 'Aman':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-300/80';
      case 'Menipis':
        return 'bg-amber-50 text-amber-900 border border-amber-300';
      case 'Stok Habis':
        return 'bg-red-50 text-red-800 border border-red-300';

      // Transaction Statuses
      case 'Terverifikasi':
      case 'Disetujui':
      case 'Layak Masuk Stok':
      case 'Aktif':
        return 'bg-[#49372D]/10 text-[#49372D] border border-[#8B6B52]/40';

      case 'Menunggu Verifikasi':
        return 'bg-amber-50 text-amber-900 border border-amber-200';

      case 'Menunggu Persetujuan':
        return 'bg-stone-100 text-stone-800 border border-stone-300';

      case 'Ditolak':
      case 'Tidak Masuk Stok':
      case 'Nonaktif':
        return 'bg-rose-50 text-rose-800 border border-rose-200';

      // Roles
      case 'PEMILIK':
        return 'bg-[#49372D] text-[#F5F1E9] border border-[#302923]';
      case 'VERIFIKATOR':
        return 'bg-[#8B6B52] text-white border border-[#49372D]';
      case 'OPERATOR':
        return 'bg-[#D8C7B3] text-[#302923] border border-[#8B6B52]/50';

      default:
        return 'bg-stone-100 text-stone-700 border border-stone-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${getColorClasses(
        status
      )} transition-colors duration-150 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{status}</span>
    </span>
  );
};
