export type UserRole = 'OPERATOR' | 'VERIFIKATOR' | 'PEMILIK';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarColor?: string;
  createdAt: string;
}

export type CoffeeMaterialType = 'Biji Kopi Robusta' | 'Biji Kopi Arabica' | 'Biji Kopi Excelsa';

export type StockStatus = 'Aman' | 'Menipis' | 'Stok Habis';

export interface CoffeeMaterial {
  id: string;
  name: CoffeeMaterialType;
  unit: string; // 'kg'
  initialStock: number;
  minThreshold: number;
  description: string;
}

export type IncomingStatus = 'Menunggu Verifikasi' | 'Terverifikasi';

export interface IncomingTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  materialId: string;
  materialName: CoffeeMaterialType;
  quantityKg: number;
  supplierName: string;
  pricePerKg?: number;
  totalCost?: number;
  notes?: string;
  status: IncomingStatus;
  createdBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  verifiedBy?: {
    id: string;
    name: string;
    role: UserRole;
    verifiedAt: string;
  };
  createdAt: string;
}

export type OutgoingStatus = 'Menunggu Verifikasi' | 'Terverifikasi';

export interface OutgoingTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  materialId: string;
  materialName: CoffeeMaterialType;
  quantityKg: number;
  purpose: string; // e.g. "Roasting Batch 04 - Espresso Blend"
  notes?: string;
  status: OutgoingStatus;
  createdBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  verifiedBy?: {
    id: string;
    name: string;
    role: UserRole;
    verifiedAt: string;
  };
  createdAt: string;
}

export type ReturnStatus = 'Menunggu Verifikasi' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

export type ReturnCondition = 
  | 'Segel Utuh / Kualitas Baik' 
  | 'Kemasan Rusak / Biji Masih Bagus' 
  | 'Biji Rusak / Terkontaminasi / Cacat';

export interface ReturnTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  materialId: string;
  materialName: CoffeeMaterialType;
  quantityKg: number;
  invoiceOrCustomer: string;
  reason: string;
  condition: ReturnCondition;
  notes?: string;
  status: ReturnStatus;
  isReusableForStock: boolean | null; // Determined by Pemilik upon approval
  ownerNotes?: string;
  createdBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  verifiedBy?: {
    id: string;
    name: string;
    role: UserRole;
    verifiedAt: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    role: UserRole;
    approvedAt: string;
  };
  createdAt: string;
}

export interface StockSummary {
  materialId: string;
  materialName: CoffeeMaterialType;
  unit: string;
  initialStock: number;
  incomingVerifiedKg: number;
  outgoingVerifiedKg: number;
  returnsReusableKg: number;
  currentStock: number;
  minThreshold: number;
  status: StockStatus;
}

export interface StockMovementRecord {
  id: string;
  date: string;
  type: 'Stok Awal' | 'Masuk' | 'Keluar' | 'Retur Layak' | 'Retur Tidak Layak' | 'Koreksi';
  referenceNumber: string;
  description: string;
  inKg: number;
  outKg: number;
  balanceKg: number;
  actor: string;
  status: string;
}

export type AppMenu = 
  | 'dashboard' 
  | 'masuk' 
  | 'keluar' 
  | 'retur' 
  | 'stok' 
  | 'pembukuan' 
  | 'pengguna';
