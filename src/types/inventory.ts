import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  UserRole,
  CoffeeMaterial,
  IncomingTransaction,
  OutgoingTransaction,
  ReturnTransaction,
  StockSummary,
  AppMenu
} from '../types/inventory';
import {
  INITIAL_USERS,
  INITIAL_MATERIALS,
  INITIAL_INCOMING,
  INITIAL_OUTGOING,
  INITIAL_RETURNS
} from '../data/initialData';
import {
  calculateMaterialStock,
  canFulfillOutgoing,
  checkPermission
} from '../utils/inventoryRules';

interface InventoryContextType {
  currentUser: User | null;
  users: User[];
  materials: CoffeeMaterial[];
  incomingList: IncomingTransaction[];
  outgoingList: OutgoingTransaction[];
  returnsList: ReturnTransaction[];
  activeMenu: AppMenu;
  setActiveMenu: (menu: AppMenu) => void;
  stockSummaries: StockSummary[];
  totalStockKg: number;
  totalIncomingVerifiedKg: number;
  totalOutgoingVerifiedKg: number;
  totalReturnsReusableKg: number;
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  // Transactions
  addIncoming: (data: Omit<IncomingTransaction, 'id' | 'transactionNumber' | 'status' | 'createdBy' | 'createdAt'>) => { success: boolean; message?: string };
  updateIncoming: (id: string, data: Partial<IncomingTransaction>) => { success: boolean; message?: string };
  verifyIncoming: (id: string) => { success: boolean; message?: string };
  addOutgoing: (data: Omit<OutgoingTransaction, 'id' | 'transactionNumber' | 'status' | 'createdBy' | 'createdAt'>) => { success: boolean; message?: string };
  updateOutgoing: (id: string, data: Partial<OutgoingTransaction>) => { success: boolean; message?: string };
  verifyOutgoing: (id: string) => { success: boolean; message?: string };
  addReturn: (data: Omit<ReturnTransaction, 'id' | 'transactionNumber' | 'status' | 'isReusableForStock' | 'createdBy' | 'createdAt'>) => { success: boolean; message?: string };
  updateReturn: (id: string, data: Partial<ReturnTransaction>) => { success: boolean; message?: string };
  verifyReturn: (id: string) => { success: boolean; message?: string };
  approveReturn: (id: string, isReusableForStock: boolean, ownerNotes?: string) => { success: boolean; message?: string };
  rejectReturn: (id: string, ownerNotes?: string) => { success: boolean; message?: string };
  // Configuration
  updateMinThreshold: (materialId: string, newThreshold: number) => { success: boolean; message?: string };
  // User Management
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateUser: (id: string, userData: Partial<User>) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => { success: boolean; message?: string };
  resetToDefaultData: () => void;
}

const STORAGE_KEY = 'kopi_mbekayu_inventory_v1';

// Password bersama untuk seluruh akun pada mode simulasi.
const DEMO_PASSWORD = 'admin123';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_current_user`);

      if (!saved) return null;

      const parsedUser = JSON.parse(saved) as User;

      const validUser = users.find(
        user => user.id === parsedUser.id && user.isActive
      );

      return validUser || null;
    } catch {
      return null;
    }
  });

  const [materials, setMaterials] = useState<CoffeeMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_materials`);
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [incomingList, setIncomingList] = useState<IncomingTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_incoming`);
      return saved ? JSON.parse(saved) : INITIAL_INCOMING;
    } catch {
      return INITIAL_INCOMING;
    }
  });

  const [outgoingList, setOutgoingList] = useState<OutgoingTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_outgoing`);
      return saved ? JSON.parse(saved) : INITIAL_OUTGOING;
    } catch {
      return INITIAL_OUTGOING;
    }
  });

  const [returnsList, setReturnsList] = useState<ReturnTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_returns`);
      return saved ? JSON.parse(saved) : INITIAL_RETURNS;
    } catch {
      return INITIAL_RETURNS;
    }
  });

  const [activeMenu, setActiveMenu] = useState<AppMenu>('dashboard');

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY}_current_user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_current_user`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_materials`, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_incoming`, JSON.stringify(incomingList));
  }, [incomingList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_outgoing`, JSON.stringify(outgoingList));
  }, [outgoingList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_returns`, JSON.stringify(returnsList));
  }, [returnsList]);

  const stockSummaries = useMemo(() => {
    return materials.map(mat => calculateMaterialStock(mat, incomingList, outgoingList, returnsList));
  }, [materials, incomingList, outgoingList, returnsList]);

  const totalStockKg = useMemo(() => {
    return Number(stockSummaries.reduce((sum, s) => sum + s.currentStock, 0).toFixed(2));
  }, [stockSummaries]);

  const totalIncomingVerifiedKg = useMemo(() => {
    return Number(stockSummaries.reduce((sum, s) => sum + s.incomingVerifiedKg, 0).toFixed(2));
  }, [stockSummaries]);

  const totalOutgoingVerifiedKg = useMemo(() => {
    return Number(stockSummaries.reduce((sum, s) => sum + s.outgoingVerifiedKg, 0).toFixed(2));
  }, [stockSummaries]);

  const totalReturnsReusableKg = useMemo(() => {
    return Number(stockSummaries.reduce((sum, s) => sum + s.returnsReusableKg, 0).toFixed(2));
  }, [stockSummaries]);

  const login = (usernameOrEmail: string, password?: string) => {
    const trimmed = usernameOrEmail.trim().toLowerCase();

    if (!trimmed || !password) {
      return {
        success: false,
        message: 'Username/email dan password wajib diisi.'
      };
    }

    const found = users.find(
      u =>
        u.username.toLowerCase() === trimmed ||
        u.email.toLowerCase() === trimmed
    );

    if (!found) {
      return {
        success: false,
        message: 'Username atau email tidak terdaftar.'
      };
    }

    if (!found.isActive) {
      return {
        success: false,
        message: 'Akun ini dinonaktifkan oleh Pemilik. Silakan hubungi manajemen.'
      };
    }

    if (password !== DEMO_PASSWORD) {
      return {
        success: false,
        message: 'Password yang Anda masukkan salah.'
      };
    }

    setCurrentUser(found);
    setActiveMenu('dashboard');

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveMenu('dashboard');
  };

  const switchRole = (role: UserRole) => {
    const targetUser = users.find(u => u.role === role && u.isActive) || users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      if (!checkPermission(role, activeMenu, 'view')) {
        setActiveMenu('dashboard');
      }
    }
  };
    // Incoming Transactions
  const addIncoming = (data: Omit<IncomingTransaction, 'id' | 'transactionNumber' | 'status' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'masuk', 'input')) {
      return { success: false, message: 'Hanya peran OPERATOR yang berhak menginput Bahan Baku Masuk.' };
    }

    if (!data.materialId || !data.quantityKg || data.quantityKg <= 0 || !data.supplierName) {
      return { success: false, message: 'Mohon lengkapi jenis bahan baku, jumlah (kg) > 0, dan nama pemasok.' };
    }

    const seq = incomingList.length + 1;
    const year = new Date().getFullYear();
    const newTx: IncomingTransaction = {
      ...data,
      id: `inc-${Date.now()}`,
      transactionNumber: `IN-${year}-${String(seq).padStart(3, '0')}`,
      status: 'Menunggu Verifikasi',
      totalCost: data.pricePerKg ? data.pricePerKg * data.quantityKg : undefined,
      createdBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      },
      createdAt: new Date().toISOString()
    };

    setIncomingList(prev => [newTx, ...prev]);
    return { success: true, message: `Bahan baku masuk ${newTx.transactionNumber} berhasil dicatat. Menunggu verifikasi.` };
  };

  const updateIncoming = (id: string, updatedData: Partial<IncomingTransaction>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'VERIFIKATOR') {
      return { success: false, message: 'Hanya peran VERIFIKATOR yang berwenang melakukan koreksi data.' };
    }

    setIncomingList(prev =>
      prev.map(item => {
        if (item.id === id) {
          const qty = updatedData.quantityKg !== undefined ? updatedData.quantityKg : item.quantityKg;
          const price = updatedData.pricePerKg !== undefined ? updatedData.pricePerKg : item.pricePerKg;
          return {
            ...item,
            ...updatedData,
            totalCost: price && qty ? price * qty : item.totalCost
          };
        }
        return item;
      })
    );
    return { success: true, message: 'Koreksi data bahan baku masuk berhasil disimpan.' };
  };

  const verifyIncoming = (id: string) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'masuk', 'verify')) {
      return { success: false, message: 'Hanya peran VERIFIKATOR yang berwenang memverifikasi transaksi masuk.' };
    }

    setIncomingList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Terverifikasi',
            verifiedBy: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              verifiedAt: new Date().toISOString().split('T')[0]
            }
          };
        }
        return item;
      })
    );
    return { success: true, message: 'Bahan baku masuk berhasil diverifikasi! Stok resmi bertambah.' };
  };

  // Outgoing Transactions
  const addOutgoing = (data: Omit<OutgoingTransaction, 'id' | 'transactionNumber' | 'status' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'keluar', 'input')) {
      return { success: false, message: 'Hanya peran OPERATOR yang berhak menginput Bahan Baku Keluar.' };
    }

    const materialSummary = stockSummaries.find(s => s.materialId === data.materialId);
    const availableStock = materialSummary ? materialSummary.currentStock : 0;

    const validation = canFulfillOutgoing(availableStock, data.quantityKg);
    if (!validation.allowed) {
      return { success: false, message: validation.message };
    }

    if (!data.purpose || data.purpose.trim() === '') {
      return { success: false, message: 'Mohon isi deskripsi atau tujuan produksi.' };
    }

    const seq = outgoingList.length + 1;
    const year = new Date().getFullYear();
    const newTx: OutgoingTransaction = {
      ...data,
      id: `out-${Date.now()}`,
      transactionNumber: `OUT-${year}-${String(seq).padStart(3, '0')}`,
      status: 'Menunggu Verifikasi',
      createdBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      },
      createdAt: new Date().toISOString()
    };

    setOutgoingList(prev => [newTx, ...prev]);
    return { success: true, message: `Bahan baku keluar ${newTx.transactionNumber} berhasil dicatat. Menunggu verifikasi.` };
  };

  const updateOutgoing = (id: string, updatedData: Partial<OutgoingTransaction>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'VERIFIKATOR') {
      return { success: false, message: 'Hanya peran VERIFIKATOR yang berwenang melakukan koreksi data keluar.' };
    }

    setOutgoingList(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updatedData } : item))
    );
    return { success: true, message: 'Koreksi data bahan baku keluar berhasil disimpan.' };
  };

  const verifyOutgoing = (id: string) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'keluar', 'verify')) {
      return { success: false, message: 'Hanya peran VERIFIKATOR yang berwenang memverifikasi pengeluaran.' };
    }

    const tx = outgoingList.find(i => i.id === id);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan.' };

    const materialSummary = stockSummaries.find(s => s.materialId === tx.materialId);
    const availableStock = materialSummary ? materialSummary.currentStock : 0;

    if (tx.quantityKg > availableStock) {
      return {
        success: false,
        message: `Gagal verifikasi: Jumlah keluar (${tx.quantityKg} kg) melebihi stok yang saat ini ada (${availableStock} kg).`
      };
    }

    setOutgoingList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Terverifikasi',
            verifiedBy: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              verifiedAt: new Date().toISOString().split('T')[0]
            }
          };
        }
        return item;
      })
    );
    return { success: true, message: 'Pengeluaran bahan baku berhasil diverifikasi! Stok resmi berkurang.' };
  };
    // Returns
  const addReturn = (data: Omit<ReturnTransaction, 'id' | 'transactionNumber' | 'status' | 'isReusableForStock' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'retur', 'input')) {
      return { success: false, message: 'Hanya peran OPERATOR yang berhak menginput data Retur Penjualan.' };
    }

    if (!data.materialId || !data.quantityKg || data.quantityKg <= 0 || !data.invoiceOrCustomer || !data.reason) {
      return { success: false, message: 'Mohon lengkapi jenis produk, jumlah (kg) > 0, info nota/pelanggan, dan alasan retur.' };
    }

    const seq = returnsList.length + 1;
    const year = new Date().getFullYear();
    const newTx: ReturnTransaction = {
      ...data,
      id: `ret-${Date.now()}`,
      transactionNumber: `RET-${year}-${String(seq).padStart(3, '0')}`,
      status: 'Menunggu Verifikasi',
      isReusableForStock: null,
      createdBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      },
      createdAt: new Date().toISOString()
    };

    setReturnsList(prev => [newTx, ...prev]);
    return { success: true, message: `Retur penjualan ${newTx.transactionNumber} berhasil dicatat. Menunggu verifikasi fisik.` };
  };

  const updateReturn = (id: string, updatedData: Partial<ReturnTransaction>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'VERIFIKATOR') {
      return { success: false, message: 'Hanya peran VERIFIKATOR yang berwenang mengoreksi informasi retur.' };
    }

    setReturnsList(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updatedData } : item))
    );
    return { success: true, message: 'Informasi retur penjualan berhasil diperbarui.' };
  };

  const verifyReturn = (id: string) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'retur', 'verify')) {
      return { success: false, message: 'Hanya peran VERIFIKATOR yang berwenang memverifikasi data retur.' };
    }

    setReturnsList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Menunggu Persetujuan',
            verifiedBy: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              verifiedAt: new Date().toISOString().split('T')[0]
            }
          };
        }
        return item;
      })
    );
    return { success: true, message: 'Pemeriksaan retur selesai. Kini menunggu keputusan dan persetujuan Pemilik.' };
  };

  const approveReturn = (id: string, isReusableForStock: boolean, ownerNotes?: string) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'retur', 'approve')) {
      return { success: false, message: 'Hanya PEMILIK yang berwenang menyetujui retur dan menentukan kelayakan stok.' };
    }

    setReturnsList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Disetujui',
            isReusableForStock,
            ownerNotes: ownerNotes || '',
            approvedBy: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              approvedAt: new Date().toISOString().split('T')[0]
            }
          };
        }
        return item;
      })
    );

    const stockMsg = isReusableForStock
      ? 'Retur disetujui & dinyatakan LAYAK. Stok resmi otomatis bertambah.'
      : 'Retur disetujui namun TIDAK LAYAK masuk stok (tercatat untuk pembukuan/afkir). Stok tidak berubah.';

    return { success: true, message: stockMsg };
  };

  const rejectReturn = (id: string, ownerNotes?: string) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (!checkPermission(currentUser.role, 'retur', 'approve')) {
      return { success: false, message: 'Hanya PEMILIK yang berwenang menolak retur.' };
    }

    setReturnsList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Ditolak',
            isReusableForStock: false,
            ownerNotes: ownerNotes || 'Ditolak oleh Pemilik.',
            approvedBy: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              approvedAt: new Date().toISOString().split('T')[0]
            }
          };
        }
        return item;
      })
    );
    return { success: true, message: 'Transaksi retur penjualan ditolak.' };
  };

  // Material Threshold Configuration (Pemilik only)
  const updateMinThreshold = (materialId: string, newThreshold: number) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'PEMILIK') {
      return { success: false, message: 'Hanya PEMILIK yang berwenang mengubah batas minimum stok.' };
    }

    if (newThreshold < 0) {
      return { success: false, message: 'Batas minimum tidak boleh negatif.' };
    }

    setMaterials(prev =>
      prev.map(m => (m.id === materialId ? { ...m, minThreshold: newThreshold } : m))
    );
    return { success: true, message: 'Batas minimum stok berhasil diperbarui.' };
  };

  // User Management (Pemilik only)
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'PEMILIK') {
      return { success: false, message: 'Hanya PEMILIK yang berwenang menambah akun pengguna.' };
    }

    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, message: 'Username sudah digunakan.' };
    }

    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, message: 'Email sudah digunakan.' };
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true, message: 'Pengguna baru berhasil ditambahkan.' };
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'PEMILIK') {
      return { success: false, message: 'Hanya PEMILIK yang berwenang mengubah data pengguna.' };
    }

    if (userData.username && users.some(u => u.id !== id && u.username.toLowerCase() === userData.username!.toLowerCase())) {
      return { success: false, message: 'Username sudah digunakan oleh pengguna lain.' };
    }

    if (userData.email && users.some(u => u.id !== id && u.email.toLowerCase() === userData.email!.toLowerCase())) {
      return { success: false, message: 'Email sudah digunakan oleh pengguna lain.' };
    }

    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, ...userData } : u))
    );

    if (currentUser.id === id && userData.name) {
      setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
    }

    return { success: true, message: 'Data pengguna berhasil diperbarui.' };
  };
    const toggleUserStatus = (id: string) => {
    if (!currentUser) return { success: false, message: 'Harap masuk terlebih dahulu.' };
    if (currentUser.role !== 'PEMILIK') {
      return { success: false, message: 'Hanya PEMILIK yang berwenang mengubah status akun.' };
    }

    if (currentUser.id === id) {
      return { success: false, message: 'Anda tidak dapat menonaktifkan akun sendiri yang sedang aktif.' };
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const nextState = !u.isActive;
          return { ...u, isActive: nextState };
        }
        return u;
      })
    );
    return { success: true, message: 'Status keaktifan akun berhasil diubah.' };
  };

  const resetToDefaultData = () => {
    setMaterials(INITIAL_MATERIALS);
    setIncomingList(INITIAL_INCOMING);
    setOutgoingList(INITIAL_OUTGOING);
    setReturnsList(INITIAL_RETURNS);
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setActiveMenu('dashboard');

    // Hapus hanya sesi aktif. Data default akan disimpan kembali oleh useEffect.
    localStorage.removeItem(`${STORAGE_KEY}_current_user`);
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        users,
        materials,
        incomingList,
        outgoingList,
        returnsList,
        activeMenu,
        setActiveMenu,
        stockSummaries,
        totalStockKg,
        totalIncomingVerifiedKg,
        totalOutgoingVerifiedKg,
        totalReturnsReusableKg,
        login,
        logout,
        switchRole,
        addIncoming,
        updateIncoming,
        verifyIncoming,
        addOutgoing,
        updateOutgoing,
        verifyOutgoing,
        addReturn,
        updateReturn,
        verifyReturn,
        approveReturn,
        rejectReturn,
        updateMinThreshold,
        addUser,
        updateUser,
        toggleUserStatus,
        resetToDefaultData
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
