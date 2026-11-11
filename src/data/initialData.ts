import {
  CoffeeMaterial,
  IncomingTransaction,
  OutgoingTransaction,
  ReturnTransaction,
  User
} from '../types/inventory';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-pemilik-1',
    username: 'pemilik',
    name: 'Hendra Wijaya',
    email: 'hendra@kopimbekayu.com',
    role: 'PEMILIK',
    isActive: true,
    avatarColor: 'bg-[#49372D]',
    createdAt: '2026-01-01'
  },
  {
    id: 'user-verifikator-1',
    username: 'verifikator',
    name: 'Siti Rahmawaty',
    email: 'siti.verifikasi@kopimbekayu.com',
    role: 'VERIFIKATOR',
    isActive: true,
    avatarColor: 'bg-[#8B6B52]',
    createdAt: '2026-01-05'
  },
  {
    id: 'user-operator-1',
    username: 'operator',
    name: 'Ahmad Fauzi',
    email: 'ahmad.operator@kopimbekayu.com',
    role: 'OPERATOR',
    isActive: true,
    avatarColor: 'bg-[#302923]',
    createdAt: '2026-01-10'
  }
];

export const INITIAL_MATERIALS: CoffeeMaterial[] = [
  {
    id: 'mat-robusta',
    name: 'Biji Kopi Robusta',
    unit: 'kg',
    initialStock: 400,
    minThreshold: 150,
    description: 'Biji Kopi Robusta Dampit & Temanggung Natural Process Grade 1'
  },
  {
    id: 'mat-arabica',
    name: 'Biji Kopi Arabica',
    unit: 'kg',
    initialStock: 250,
    minThreshold: 100,
    description: 'Biji Kopi Arabica Gayo & Ijen Full Washed Grade Specialty'
  },
  {
    id: 'mat-excelsa',
    name: 'Biji Kopi Excelsa',
    unit: 'kg',
    initialStock: 120,
    minThreshold: 50,
    description: 'Biji Kopi Excelsa Wonosalam Natural Fermented Premium'
  }
];

export const INITIAL_INCOMING: IncomingTransaction[] = [
  {
    id: 'inc-001',
    transactionNumber: 'IN-2026-001',
    date: '2026-06-15',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 200,
    supplierName: 'Kelompok Tani Harapan Dampit',
    pricePerKg: 45000,
    totalCost: 9000000,
    notes: 'Kadar air 12%, biji petik merah segar',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-06-16' },
    createdAt: '2026-06-15T09:00:00Z'
  },
  {
    id: 'inc-002',
    transactionNumber: 'IN-2026-002',
    date: '2026-07-20',
    materialId: 'mat-arabica',
    materialName: 'Biji Kopi Arabica',
    quantityKg: 150,
    supplierName: 'Koperasi Kopi Gayo Mandiri',
    pricePerKg: 115000,
    totalCost: 17250000,
    notes: 'Kualitas specialty, aroma floral & citrus',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-07-21' },
    createdAt: '2026-07-20T10:30:00Z'
  },
  {
    id: 'inc-003',
    transactionNumber: 'IN-2026-003',
    date: '2026-08-10',
    materialId: 'mat-excelsa',
    materialName: 'Biji Kopi Excelsa',
    quantityKg: 80,
    supplierName: 'Perkebunan Asri Wonosalam',
    pricePerKg: 65000,
    totalCost: 5200000,
    notes: 'Biji terfermentasi sempurna, aroma nangka khas',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-08-11' },
    createdAt: '2026-08-10T11:15:00Z'
  },
  {
    id: 'inc-004',
    transactionNumber: 'IN-2026-004',
    date: '2026-09-05',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 250,
    supplierName: 'UD Sumber Makmur Temanggung',
    pricePerKg: 46000,
    totalCost: 11500000,
    notes: 'Pengiriman 5 karung rami @ 50 kg',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-09-06' },
    createdAt: '2026-09-05T08:45:00Z'
  },
  {
    id: 'inc-005',
    transactionNumber: 'IN-2026-005',
    date: '2026-10-18',
    materialId: 'mat-arabica',
    materialName: 'Biji Kopi Arabica',
    quantityKg: 100,
    supplierName: 'Petani Kopi Lereng Ijen',
    pricePerKg: 118000,
    totalCost: 11800000,
    notes: 'Grade A, lot kebun ketinggian 1400 mdpl',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-10-19' },
    createdAt: '2026-10-18T14:00:00Z'
  },
  {
    id: 'inc-006',
    transactionNumber: 'IN-2026-006',
    date: '2026-11-08',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 120,
    supplierName: 'Kelompok Tani Harapan Dampit',
    pricePerKg: 47000,
    totalCost: 5640000,
    notes: 'Baru tiba di gudang utama, menunggu pengecekan kadar air fisik',
    status: 'Menunggu Verifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    createdAt: '2026-11-08T09:30:00Z'
  }
];

export const INITIAL_OUTGOING: OutgoingTransaction[] = [
  {
    id: 'out-001',
    transactionNumber: 'OUT-2026-001',
    date: '2026-06-25',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 150,
    purpose: 'Roasting Kopi Bubuk Kemasan 250g Batch #R-101',
    notes: 'Profil sangrai Dark Roast untuk pasar lokal Banyumas',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-06-26' },
    createdAt: '2026-06-25T08:00:00Z'
  },
  {
    id: 'out-002',
    transactionNumber: 'OUT-2026-002',
    date: '2026-07-28',
    materialId: 'mat-arabica',
    materialName: 'Biji Kopi Arabica',
    quantityKg: 90,
    purpose: 'Produksi House Blend Espresso Varian Gold Batch #A-201',
    notes: 'Profil sangrai Medium to Dark Roast',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-07-29' },
    createdAt: '2026-07-28T09:15:00Z'
  },
  {
    id: 'out-003',
    transactionNumber: 'OUT-2026-003',
    date: '2026-08-22',
    materialId: 'mat-excelsa',
    materialName: 'Biji Kopi Excelsa',
    quantityKg: 40,
    purpose: 'Eksperimen Sangrai Cold Brew Blend Batch #E-01',
    notes: 'Pengolahan pesanan khusus Horeca Yogyakarta',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-08-23' },
    createdAt: '2026-08-22T13:40:00Z'
  },
  {
    id: 'out-004',
    transactionNumber: 'OUT-2026-004',
    date: '2026-09-18',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 180,
    purpose: 'Produksi Kopi Drip Bag & Bubuk Halus Batch #R-102',
    notes: 'Standar kehalusan mesh 60 untuk saring tradisional',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-09-19' },
    createdAt: '2026-09-18T10:00:00Z'
  },
  {
    id: 'out-005',
    transactionNumber: 'OUT-2026-005',
    date: '2026-10-25',
    materialId: 'mat-arabica',
    materialName: 'Biji Kopi Arabica',
    quantityKg: 110,
    purpose: 'Kemasan Whole Bean 500g Kedai Kopi Mitra Solo & Semarang',
    notes: 'Single origin roasted bean degassing 24 jam',
    status: 'Terverifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-10-26' },
    createdAt: '2026-10-25T11:20:00Z'
  },
  {
    id: 'out-006',
    transactionNumber: 'OUT-2026-006',
    date: '2026-11-09',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 50,
    purpose: 'Rencana Roasting Batch Mingguan #R-103',
    notes: 'Permintaan bahan baku dari kepala roastery',
    status: 'Menunggu Verifikasi',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    createdAt: '2026-11-09T08:15:00Z'
  }
];

export const INITIAL_RETURNS: ReturnTransaction[] = [
  {
    id: 'ret-001',
    transactionNumber: 'RET-2026-001',
    date: '2026-09-22',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 15,
    invoiceOrCustomer: 'Cafe Kembara Purwokerto (INV-8821)',
    reason: 'Kelebihan order pasokan mingguan akibat penutupan renovasi kedai',
    condition: 'Segel Utuh / Kualitas Baik',
    notes: 'Kondisi kemasan karung aluminium rapat, tidak terpapar lembab',
    status: 'Disetujui',
    isReusableForStock: true, // Approved by owner to return into usable stock
    ownerNotes: 'Diinspeksi langsung: biji bersih, aroma prima, sah masuk stok kembali.',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-09-23' },
    approvedBy: { id: 'user-pemilik-1', name: 'Hendra Wijaya', role: 'PEMILIK', approvedAt: '2026-09-24' },
    createdAt: '2026-09-22T14:10:00Z'
  },
  {
    id: 'ret-002',
    transactionNumber: 'RET-2026-002',
    date: '2026-10-12',
    materialId: 'mat-arabica',
    materialName: 'Biji Kopi Arabica',
    quantityKg: 10,
    invoiceOrCustomer: 'Hotel Grand Serayu (INV-8910)',
    reason: 'Kardus pengiriman kurir robek dan terkena rembesan air hujan saat transit',
    condition: 'Biji Rusak / Terkontaminasi / Cacat',
    notes: 'Kadar air melonjak dan biji beraroma apek',
    status: 'Disetujui',
    isReusableForStock: false, // Approved for bookkeeping return, but NOT reusable -> does NOT enter stock!
    ownerNotes: 'Retur diterima untuk klaim ganti rugi logistik, namun afkir/musnahkan. Tidak boleh masuk stok produksi.',
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-10-13' },
    approvedBy: { id: 'user-pemilik-1', name: 'Hendra Wijaya', role: 'PEMILIK', approvedAt: '2026-10-14' },
    createdAt: '2026-10-12T16:00:00Z'
  },
  {
    id: 'ret-003',
    transactionNumber: 'RET-2026-003',
    date: '2026-11-05',
    materialId: 'mat-excelsa',
    materialName: 'Biji Kopi Excelsa',
    quantityKg: 8,
    invoiceOrCustomer: 'Kedai Seduh Sore Cilacap (INV-9102)',
    reason: 'Salah pengiriman varian saat ekspedisi (pelanggan memesan Robusta)',
    condition: 'Segel Utuh / Kualitas Baik',
    notes: 'Kemasan asli utuh dan belum dibuka oleh pelanggan',
    status: 'Menunggu Persetujuan', // Verifikator has verified, waiting for Owner's decision
    isReusableForStock: null,
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    verifiedBy: { id: 'user-verifikator-1', name: 'Siti Rahmawaty', role: 'VERIFIKATOR', verifiedAt: '2026-11-06' },
    createdAt: '2026-11-05T10:20:00Z'
  },
  {
    id: 'ret-004',
    transactionNumber: 'RET-2026-004',
    date: '2026-11-10',
    materialId: 'mat-robusta',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 12,
    invoiceOrCustomer: 'Kopi Tjap Menara (INV-9150)',
    reason: 'Revisi jumlah kebutuhan produksi mitra',
    condition: 'Kemasan Rusak / Biji Masih Bagus',
    notes: 'Kantung luar sedikit sobek namun plastik pelindung dalam masih rapat',
    status: 'Menunggu Verifikasi', // Newly submitted by Operator
    isReusableForStock: null,
    createdBy: { id: 'user-operator-1', name: 'Ahmad Fauzi', role: 'OPERATOR' },
    createdAt: '2026-11-10T11:45:00Z'
  }
];
