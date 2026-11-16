import React from 'react';
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  transactionNumber: string;
  materialName: string;
  quantityText: string;
  statusLabel: string;
  impactNote?: string;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  transactionNumber,
  materialName,
  quantityText,
  statusLabel,
  impactNote,
  errorMessage,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="delete-modal-title" className="text-base font-bold text-[#302923]">
              {title}
            </h3>
            <p className="text-xs text-[#8A796D]">
              Tindakan ini permanen dan akan memperbarui stok otomatis
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-[#F5F1E9] border border-[#D8C7B3]/70 space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-[#8A796D]">No. Transaksi:</span>
            <span className="font-mono font-bold text-[#302923]">{transactionNumber}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#8A796D]">Jenis Biji Kopi:</span>
            <span className="font-semibold text-[#302923]">{materialName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#8A796D]">Jumlah:</span>
            <span className="font-extrabold text-[#49372D]">{quantityText}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#8A796D]">Status Saat Ini:</span>
            <span className="font-semibold text-[#302923]">{statusLabel}</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            {impactNote ||
              'Apakah Anda yakin ingin menghapus transaksi ini secara permanen? Saldo stok tersedia dan pembukuan akan otomatis dihitung ulang.'}
          </span>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-stone-100 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#8A796D] hover:text-[#302923] rounded-xl border border-[#D8C7B3] cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Transaksi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
