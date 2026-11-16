import {
  CoffeeMaterial,
  CoffeeMaterialType,
  IncomingTransaction,
  OutgoingTransaction,
  ReturnTransaction,
  StockStatus,
  StockSummary,
  StockMovementRecord,
  UserRole,
  AppMenu
} from '../types/inventory';

/**
 * Computes raw (unclamped) stock balance for a material.
 */
export function calculateRawMaterialStock(
  material: CoffeeMaterial,
  incomingList: IncomingTransaction[],
  outgoingList: OutgoingTransaction[],
  returnsList: ReturnTransaction[]
): {
  initialStock: number;
  verifiedIncoming: number;
  verifiedOutgoing: number;
  reusableReturns: number;
  rawStock: number;
} {
  // 1. Only verified incoming items count
  const verifiedIncoming = incomingList
    .filter(item => item.materialId === material.id && item.status === 'Terverifikasi')
    .reduce((sum, item) => sum + (Number(item.quantityKg) || 0), 0);

  // 2. Only verified outgoing items count
  const verifiedOutgoing = outgoingList
    .filter(item => item.materialId === material.id && item.status === 'Terverifikasi')
    .reduce((sum, item) => sum + (Number(item.quantityKg) || 0), 0);

  // 3. Only approved returns that are marked as reusable AND not damaged/unusable count
  const reusableReturns = returnsList
    .filter(
      item =>
        item.materialId === material.id &&
        item.status === 'Disetujui' &&
        item.isReusableForStock === true &&
        item.condition !== 'Biji Rusak / Terkontaminasi / Cacat'
    )
    .reduce((sum, item) => sum + (Number(item.quantityKg) || 0), 0);

  const initialStock = Number(material.initialStock) || 0;
  const rawStock = Number((initialStock + verifiedIncoming - verifiedOutgoing + reusableReturns).toFixed(2));

  return {
    initialStock,
    verifiedIncoming: Number(verifiedIncoming.toFixed(2)),
    verifiedOutgoing: Number(verifiedOutgoing.toFixed(2)),
    reusableReturns: Number(reusableReturns.toFixed(2)),
    rawStock
  };
}

/**
 * Calculates current stock according to formula:
 * Stok Akhir = Stok Awal + Bahan Baku Masuk Terverifikasi - Bahan Baku Keluar Terverifikasi + Retur Disetujui yang Layak Digunakan.
 */
export function calculateMaterialStock(
  material: CoffeeMaterial,
  incomingList: IncomingTransaction[],
  outgoingList: OutgoingTransaction[],
  returnsList: ReturnTransaction[]
): StockSummary {
  const {
    initialStock,
    verifiedIncoming,
    verifiedOutgoing,
    reusableReturns,
    rawStock
  } = calculateRawMaterialStock(material, incomingList, outgoingList, returnsList);

  const currentStock = Math.max(0, rawStock);
  const status = determineStockStatus(currentStock, material.minThreshold);

  return {
    materialId: material.id,
    materialName: material.name,
    unit: material.unit,
    initialStock,
    incomingVerifiedKg: verifiedIncoming,
    outgoingVerifiedKg: verifiedOutgoing,
    returnsReusableKg: reusableReturns,
    currentStock,
    minThreshold: material.minThreshold,
    status
  };
}

/**
 * Validates that no material drops below 0 kg after a proposed transaction edit or deletion.
 */
export function validateInventoryIntegrity(
  materials: CoffeeMaterial[],
  incomingList: IncomingTransaction[],
  outgoingList: OutgoingTransaction[],
  returnsList: ReturnTransaction[]
): { valid: boolean; message?: string; failingMaterial?: CoffeeMaterialType; resultingStock?: number } {
  for (const mat of materials) {
    const { rawStock } = calculateRawMaterialStock(mat, incomingList, outgoingList, returnsList);
    if (rawStock < 0) {
      return {
        valid: false,
        failingMaterial: mat.name,
        resultingStock: rawStock,
        message: `Operasi dibatalkan: Perubahan ini akan membuat stok ${mat.name} menjadi negatif (${rawStock} kg) karena sudah digunakan pada transaksi keluar.`
      };
    }
  }
  return { valid: true };
}

/**
 * Determines status of coffee bean stock.
 * - 'Stok Habis' if currentStock <= 0
 * - 'Menipis' if currentStock <= minThreshold
 * - 'Aman' otherwise
 */
export function determineStockStatus(currentStock: number, minThreshold: number): StockStatus {
  if (currentStock <= 0) {
    return 'Stok Habis';
  }
  if (currentStock <= minThreshold) {
    return 'Menipis';
  }
  return 'Aman';
}

/**
 * Validates whether an outgoing transaction can be fulfilled.
 * Prevents outgoing quantities from exceeding available stock and prevents negative inventory.
 */
export function canFulfillOutgoing(currentStock: number, requestedKg: number): {
  allowed: boolean;
  message?: string;
} {
  const req = Number(requestedKg) || 0;
  if (req <= 0) {
    return {
      allowed: false,
      message: 'Jumlah bahan baku keluar harus lebih besar dari 0 kg.'
    };
  }

  if (req > currentStock) {
    return {
      allowed: false,
      message: `Jumlah keluar (${req} kg) melebihi stok yang tersedia (${currentStock} kg). Sistem mencegah stok negatif.`
    };
  }

  return { allowed: true };
}

/**
 * Role-Based Access Control matrix verification
 */
export function checkPermission(
  role: UserRole,
  menu: AppMenu,
  action: 'view' | 'input' | 'edit' | 'delete' | 'verify' | 'approve' | 'edit_threshold' | 'export_print' | 'manage_users'
): boolean {
  switch (menu) {
    case 'dashboard':
      if (action === 'view') return true;
      if (action === 'edit_threshold') return role === 'PEMILIK';
      return false;

    case 'masuk':
      if (action === 'view') return true; // all can view
      if (action === 'input') return role === 'OPERATOR';
      if (action === 'edit' || action === 'delete') return role === 'PEMILIK' || role === 'OPERATOR';
      if (action === 'verify') return role === 'VERIFIKATOR';
      return false;

    case 'keluar':
      if (action === 'view') return true;
      if (action === 'input') return role === 'OPERATOR';
      if (action === 'edit' || action === 'delete') return role === 'PEMILIK' || role === 'OPERATOR';
      if (action === 'verify') return role === 'VERIFIKATOR';
      return false;

    case 'retur':
      if (action === 'view') return true;
      if (action === 'input') return role === 'OPERATOR';
      if (action === 'edit' || action === 'delete') return role === 'PEMILIK' || role === 'OPERATOR';
      if (action === 'verify') return role === 'VERIFIKATOR';
      if (action === 'approve') return role === 'PEMILIK';
      return false;

    case 'stok':
      if (action === 'view') return true;
      if (action === 'edit_threshold') return role === 'PEMILIK';
      return false;

    case 'pembukuan':
      if (role === 'OPERATOR') return false; // Tidak Ada Akses
      if (role === 'VERIFIKATOR') return action === 'view';
      if (role === 'PEMILIK') return action === 'view' || action === 'export_print';
      return false;

    case 'pengguna':
      if (role === 'PEMILIK') return true;
      return false; // Operator & Verifikator: Tidak Ada Akses

    default:
      return false;
  }
}

/**
 * Returns available menus for a given role
 */
export function getAuthorizedMenus(role: UserRole): { id: AppMenu; label: string }[] {
  const all: { id: AppMenu; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'masuk', label: 'Bahan Baku Masuk' },
    { id: 'keluar', label: 'Bahan Baku Keluar' },
    { id: 'retur', label: 'Retur Penjualan' },
    { id: 'stok', label: 'Stok Tersedia' },
    { id: 'pembukuan', label: 'Pembukuan' },
    { id: 'pengguna', label: 'Pengelolaan Pengguna' },
  ];

  return all.filter(item => {
    if (item.id === 'pembukuan' && role === 'OPERATOR') return false;
    if (item.id === 'pengguna' && role !== 'PEMILIK') return false;
    return true;
  });
}

/**
 * Generates an audit trail of stock card movements for a specific material
 */
export function generateStockCardMovements(
  material: CoffeeMaterial,
  incomingList: IncomingTransaction[],
  outgoingList: OutgoingTransaction[],
  returnsList: ReturnTransaction[]
): StockMovementRecord[] {
  const records: StockMovementRecord[] = [];

  // Initial stock baseline
  let runningBalance = Number(material.initialStock) || 0;
  records.push({
    id: `init-${material.id}`,
    date: '2026-01-01',
    type: 'Stok Awal',
    referenceNumber: 'SALDO-AWAL',
    description: `Saldo awal periode untuk ${material.name}`,
    inKg: runningBalance,
    outKg: 0,
    balanceKg: runningBalance,
    actor: 'Sistem',
    status: 'Terverifikasi'
  });

  // Collect all verified events
  interface EventItem {
    id: string;
    date: string;
    createdAt: string;
    type: 'Masuk' | 'Keluar' | 'Retur Layak' | 'Retur Tidak Layak';
    ref: string;
    desc: string;
    inKg: number;
    outKg: number;
    actor: string;
    affectsStock: boolean;
  }

  const events: EventItem[] = [];

  incomingList
    .filter(i => i.materialId === material.id && i.status === 'Terverifikasi')
    .forEach(i => {
      events.push({
        id: i.id,
        date: i.date,
        createdAt: i.createdAt,
        type: 'Masuk',
        ref: i.transactionNumber,
        desc: `Pemasok: ${i.supplierName}${i.notes ? ` (${i.notes})` : ''}`,
        inKg: i.quantityKg,
        outKg: 0,
        actor: i.verifiedBy?.name || 'Verifikator',
        affectsStock: true
      });
    });

  outgoingList
    .filter(o => o.materialId === material.id && o.status === 'Terverifikasi')
    .forEach(o => {
      events.push({
        id: o.id,
        date: o.date,
        createdAt: o.createdAt,
        type: 'Keluar',
        ref: o.transactionNumber,
        desc: `Tujuan: ${o.purpose}${o.notes ? ` (${o.notes})` : ''}`,
        inKg: 0,
        outKg: o.quantityKg,
        actor: o.verifiedBy?.name || 'Verifikator',
        affectsStock: true
      });
    });

  returnsList
    .filter(r => r.materialId === material.id && r.status === 'Disetujui')
    .forEach(r => {
      const isReusable =
        r.isReusableForStock === true &&
        r.condition !== 'Biji Rusak / Terkontaminasi / Cacat';
      events.push({
        id: r.id,
        date: r.date,
        createdAt: r.createdAt,
        type: isReusable ? 'Retur Layak' : 'Retur Tidak Layak',
        ref: r.transactionNumber,
        desc: `Retur: ${r.reason} (${r.condition}) ${isReusable ? '[Masuk Stok]' : '[Non-Stok / Pemusnahan]'}`,
        inKg: isReusable ? r.quantityKg : 0,
        outKg: 0,
        actor: r.approvedBy?.name || 'Pemilik',
        affectsStock: isReusable
      });
    });

  // Sort chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Accumulate running balance
  for (const ev of events) {
    if (ev.affectsStock) {
      runningBalance = Math.max(0, runningBalance + ev.inKg - ev.outKg);
    }
    records.push({
      id: ev.id,
      date: ev.date,
      type: ev.type,
      referenceNumber: ev.ref,
      description: ev.desc,
      inKg: ev.inKg,
      outKg: ev.outKg,
      balanceKg: Number(runningBalance.toFixed(2)),
      actor: ev.actor,
      status: 'Terverifikasi / Disetujui'
    });
  }

  return records;
}

/**
 * Format helpers for currency and numbers
 */
export function formatKg(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(val);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}
