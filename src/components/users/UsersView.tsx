import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Power,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { User, UserRole } from '../../types/inventory';
import { formatDateIndo } from '../../utils/inventoryRules';

export const UsersView: React.FC = () => {
  const { currentUser, users, addUser, updateUser, toggleUserStatus } = useInventory();

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    username: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  }>({
    username: '',
    name: '',
    email: '',
    role: 'OPERATOR',
    isActive: true
  });

  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const isOwner = currentUser?.role === 'PEMILIK';

  // Guard: If not Pemilik, block access
  if (!isOwner) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-[#D8C7B3] shadow-sm">
        <div className="w-14 h-14 bg-rose-50 text-rose-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[#302923]">Akses Ditolak</h3>
        <p className="text-xs text-[#8A796D] mt-2 leading-relaxed">
          Menu Pengelolaan Pengguna hanya dapat diakses oleh peran <strong>PEMILIK</strong>. Tidak ada pendaftaran mandiri (public registration).
        </p>
      </div>
    );
  }

  // Handle Create User
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = addUser({
      username: formData.username.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      isActive: formData.isActive
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Akun pengguna berhasil ditambahkan!' });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFeedback(null);
        setFormData({
          username: '',
          name: '',
          email: '',
          role: 'OPERATOR',
          isActive: true
        });
      }, 1000);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Gagal membuat akun.' });
    }
  };

  // Handle Edit User
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive
    });
    setFeedback(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = updateUser(editingUser.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      isActive: formData.isActive
    });

    if (res.success) {
      setEditingUser(null);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui akun.' });
    }
  };

  // Toggle active
  const handleToggle = (id: string) => {
    const res = toggleUserStatus(id);
    if (!res.success && res.message) {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D8C7B3]/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#49372D] text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#302923]">
              Pengelolaan Akun & Hak Akses Pengguna
            </h2>
          </div>
          <p className="text-xs text-[#8A796D] mt-1">
            Wewenang penuh Pemilik untuk mendaftarkan akun staf, mengubah peran, dan mengontrol status aktif.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setFeedback(null);
            setFormData({
              username: '',
              name: '',
              email: '',
              role: 'OPERATOR',
              isActive: true
            });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#49372D] hover:bg-[#3A2B23] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#D8C7B3]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] text-[#302923] border-b border-[#D8C7B3]/60">
              <tr>
                <th className="py-3.5 px-4 font-bold">Pengguna</th>
                <th className="py-3.5 px-4 font-bold">Username</th>
                <th className="py-3.5 px-4 font-bold">Email</th>
                <th className="py-3.5 px-4 font-bold text-center">Peran</th>
                <th className="py-3.5 px-4 font-bold text-center">Status Akun</th>
                <th className="py-3.5 px-4 font-bold">Dibuat Pada</th>
                <th className="py-3.5 px-4 font-bold text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#F5F1E9]/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.avatarColor || 'bg-[#8B6B52]'} text-white font-bold flex items-center justify-center text-xs`}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#302923]">{u.name}</div>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] text-emerald-700 font-semibold">(Akun Anda Saat Ini)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#49372D]">
                    @{u.username}
                  </td>
                  <td className="py-3.5 px-4 text-[#8A796D]">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge status={u.role} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge status={u.isActive ? 'Aktif' : 'Nonaktif'} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-[#8A796D] whitespace-nowrap">
                    {formatDateIndo(u.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="Edit Informasi Akun"
                        className="p-1.5 text-[#8A796D] hover:text-[#49372D] hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Deactivate/Activate button */}
                      <button
                        onClick={() => handleToggle(u.id)}
                        disabled={currentUser?.id === u.id}
                        title={u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          currentUser?.id === u.id
                            ? 'opacity-30 cursor-not-allowed text-stone-400'
                            : u.isActive
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="w-10 h-10 rounded-xl bg-[#49372D] text-white flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Tambah Akun Pengguna Baru
                </h3>
                <p className="text-xs text-[#8A796D]">
                  Daftarkan staf operasional atau verifikator
                </p>
              </div>
            </div>

            {feedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: budi_operator"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  placeholder="budi@kopimbekayu.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Peran Otorisasi (Role) *
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  <option value="OPERATOR">OPERATOR — Input data masuk, keluar, retur</option>
                  <option value="VERIFIKATOR">VERIFIKATOR — Cek fisik, koreksi & verifikasi mutasi</option>
                  <option value="PEMILIK">PEMILIK — Akses penuh, setujui retur & pembukuan</option>
                </select>
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
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Pengguna */}
      {editingUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D8C7B3] my-8 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#D8C7B3]/50">
              <div className="w-10 h-10 rounded-xl bg-[#8B6B52] text-white flex items-center justify-center">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#302923]">
                  Edit Akun Pengguna
                </h3>
                <p className="text-xs text-[#8A796D]">
                  @{editingUser.username}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302923] uppercase tracking-wider mb-1">
                  Peran Otorisasi (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C7B3] text-xs text-[#302923] outline-none focus:border-[#49372D]"
                  required
                >
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VERIFIKATOR">VERIFIKATOR</option>
                  <option value="PEMILIK">PEMILIK</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
