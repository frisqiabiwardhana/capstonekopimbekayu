import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle, ShieldCheck } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Logo } from '../common/Logo';
import { UserRole } from '../../types/inventory';

export const LoginPage: React.FC = () => {
  const { login } = useInventory();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Harap masukkan username atau email.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(usernameOrEmail, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Login gagal. Periksa kembali username/email Anda.');
      }
    }, 200);
  };

  const handleQuickLogin = (role: UserRole) => {
    const creds: Record<UserRole, { user: string }> = {
      PEMILIK: { user: 'pemilik' },
      VERIFIKATOR: { user: 'verifikator' },
      OPERATOR: { user: 'operator' }
    };
    setUsernameOrEmail(creds[role].user);
    setPassword('password123');
    login(creds[role].user, 'password123');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F5F1E9] px-4 py-8 relative">
      {/* Subtle organic coffee texture background accent */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#8B6B52_0.75px,transparent_0.75px)] [background-size:24px_24px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#49372D]/8 border border-[#D8C7B3]/60 p-8 md:p-10">
          {/* Logo Area */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-3">
              <Logo size="xl" variant="light" iconOnly />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#49372D] tracking-wide mt-1">
              KOPI MBEKAYU
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#8A796D] font-medium mt-1">
              Sistem Monitoring Stok Produksi Kopi
            </p>
            <div className="w-12 h-0.5 bg-[#8B6B52]/40 rounded-full mt-3" />
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#302923] uppercase tracking-wider mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A796D]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={e => {
                    setUsernameOrEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Contoh: pemilik atau hendra@kopimbekayu.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F5F1E9]/60 hover:bg-[#F5F1E9] focus:bg-white text-sm text-[#302923] rounded-xl border border-[#D8C7B3] focus:border-[#49372D] focus:ring-2 focus:ring-[#49372D]/10 outline-none transition duration-150 placeholder:text-[#8A796D]/60"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#302923] uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A796D]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-11 py-2.5 bg-[#F5F1E9]/60 hover:bg-[#F5F1E9] focus:bg-white text-sm text-[#302923] rounded-xl border border-[#D8C7B3] focus:border-[#49372D] focus:ring-2 focus:ring-[#49372D]/10 outline-none transition duration-150 placeholder:text-[#8A796D]/60"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A796D] hover:text-[#49372D] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#49372D] hover:bg-[#3A2B23] active:scale-[0.99] text-[#F5F1E9] font-medium text-sm rounded-xl shadow-md shadow-[#49372D]/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#D8C7B3] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Access Testing Pills */}
          <div className="mt-8 pt-6 border-t border-[#D8C7B3]/40">
            <p className="text-[11px] font-semibold text-[#8A796D] uppercase tracking-wider text-center mb-3">
              Uji Coba Cepat (Pilih Hak Akses Peran)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('PEMILIK')}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-[#49372D] text-[#F5F1E9] hover:bg-[#302923] transition-colors text-center shadow-xs cursor-pointer"
              >
                Pemilik
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('VERIFIKATOR')}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-[#8B6B52] text-white hover:bg-[#6e533e] transition-colors text-center shadow-xs cursor-pointer"
              >
                Verifikator
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('OPERATOR')}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-[#D8C7B3] text-[#302923] hover:bg-[#c9b49c] transition-colors text-center shadow-xs cursor-pointer"
              >
                Operator
              </button>
            </div>
            <p className="text-[11px] text-[#8A796D] text-center mt-2">
              Sistem membatasi hak akses sesuai matriks peran resmi.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#8A796D] mt-6">
          &copy; {new Date().getFullYear()} KOPI MBEKAYU &bull; Sistem Monitoring Produksi
        </p>
      </div>
    </div>
  );
};
