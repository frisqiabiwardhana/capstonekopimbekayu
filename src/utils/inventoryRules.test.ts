import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMaterialStock,
  determineStockStatus,
  canFulfillOutgoing,
  checkPermission,
  getAuthorizedMenus,
  validateInventoryIntegrity
} from './inventoryRules';
import { CoffeeMaterial, IncomingTransaction, OutgoingTransaction, ReturnTransaction } from '../types/inventory';

const mockMaterial: CoffeeMaterial = {
  id: 'robusta-1',
  name: 'Biji Kopi Robusta',
  unit: 'kg',
  initialStock: 100,
  minThreshold: 30,
  description: 'Robusta Dampit Grade 1'
};

test('stock calculation: accounts only for verified incoming, verified outgoing, and reusable approved returns', () => {
  const incoming: IncomingTransaction[] = [
    {
      id: 'in-1',
      transactionNumber: 'IN-001',
      date: '2026-02-01',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 50,
      supplierName: 'Petani Dampit',
      status: 'Terverifikasi',
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-01T08:00:00Z'
    },
    {
      id: 'in-2',
      transactionNumber: 'IN-002',
      date: '2026-02-02',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 100,
      supplierName: 'Koperasi Jawa',
      status: 'Menunggu Verifikasi', // Unverified! Must NOT count
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-02T08:00:00Z'
    }
  ];

  const outgoing: OutgoingTransaction[] = [
    {
      id: 'out-1',
      transactionNumber: 'OUT-001',
      date: '2026-02-03',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 30,
      purpose: 'Produksi Batch #1',
      status: 'Terverifikasi',
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-03T08:00:00Z'
    },
    {
      id: 'out-2',
      transactionNumber: 'OUT-002',
      date: '2026-02-04',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 40,
      purpose: 'Draft Roasting',
      status: 'Menunggu Verifikasi', // Unverified! Must NOT count
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-04T08:00:00Z'
    }
  ];

  const returns: ReturnTransaction[] = [
    {
      id: 'ret-1',
      transactionNumber: 'RET-001',
      date: '2026-02-05',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 10,
      invoiceOrCustomer: 'Cafe Senja',
      reason: 'Kelebihan order',
      condition: 'Segel Utuh / Kualitas Baik',
      status: 'Disetujui',
      isReusableForStock: true, // Approved AND reusable -> Must count
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-05T08:00:00Z'
    },
    {
      id: 'ret-2',
      transactionNumber: 'RET-002',
      date: '2026-02-06',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 5,
      invoiceOrCustomer: 'Kedai Kopi Kita',
      reason: 'Biji berjamur',
      condition: 'Biji Rusak / Terkontaminasi / Cacat',
      status: 'Disetujui',
      isReusableForStock: false, // Approved BUT damaged/not reusable -> Must NOT count to stock
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-06T08:00:00Z'
    },
    {
      id: 'ret-3',
      transactionNumber: 'RET-003',
      date: '2026-02-07',
      materialId: 'robusta-1',
      materialName: 'Biji Kopi Robusta',
      quantityKg: 15,
      invoiceOrCustomer: 'Resto Rasa',
      reason: 'Salah varian',
      condition: 'Segel Utuh / Kualitas Baik',
      status: 'Menunggu Persetujuan', // Not yet approved -> Must NOT count
      isReusableForStock: null,
      createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
      createdAt: '2026-02-07T08:00:00Z'
    }
  ];

  const summary = calculateMaterialStock(mockMaterial, incoming, outgoing, returns);

  // Expected:
  // initial (100) + verified incoming (50) - verified outgoing (30) + reusable return (10) = 130
  assert.equal(summary.initialStock, 100);
  assert.equal(summary.incomingVerifiedKg, 50);
  assert.equal(summary.outgoingVerifiedKg, 30);
  assert.equal(summary.returnsReusableKg, 10);
  assert.equal(summary.currentStock, 130);
  assert.equal(summary.status, 'Aman');
});

test('determineStockStatus identifies Aman, Menipis, and Stok Habis', () => {
  assert.equal(determineStockStatus(50, 30), 'Aman');
  assert.equal(determineStockStatus(30, 30), 'Menipis');
  assert.equal(determineStockStatus(15, 30), 'Menipis');
  assert.equal(determineStockStatus(0, 30), 'Stok Habis');
  assert.equal(determineStockStatus(-5, 30), 'Stok Habis');
});

test('canFulfillOutgoing blocks requests that exceed stock or are invalid', () => {
  assert.equal(canFulfillOutgoing(50, 20).allowed, true);
  assert.equal(canFulfillOutgoing(50, 50).allowed, true);
  
  // Exceeding available stock
  const over = canFulfillOutgoing(50, 50.1);
  assert.equal(over.allowed, false);
  assert.match(over.message || '', /melebihi stok/i);

  // 0 or negative quantity
  assert.equal(canFulfillOutgoing(50, 0).allowed, false);
  assert.equal(canFulfillOutgoing(50, -10).allowed, false);
});

test('checkPermission enforces the exact matrix for Operator, Verifikator, Pemilik', () => {
  // Operator
  assert.equal(checkPermission('OPERATOR', 'dashboard', 'view'), true);
  assert.equal(checkPermission('OPERATOR', 'dashboard', 'edit_threshold'), false);
  assert.equal(checkPermission('OPERATOR', 'masuk', 'input'), true);
  assert.equal(checkPermission('OPERATOR', 'masuk', 'verify'), false);
  assert.equal(checkPermission('OPERATOR', 'keluar', 'input'), true);
  assert.equal(checkPermission('OPERATOR', 'keluar', 'verify'), false);
  assert.equal(checkPermission('OPERATOR', 'retur', 'input'), true);
  assert.equal(checkPermission('OPERATOR', 'retur', 'verify'), false);
  assert.equal(checkPermission('OPERATOR', 'retur', 'approve'), false);
  assert.equal(checkPermission('OPERATOR', 'pembukuan', 'view'), false);
  assert.equal(checkPermission('OPERATOR', 'pengguna', 'manage_users'), false);

  // Verifikator
  assert.equal(checkPermission('VERIFIKATOR', 'masuk', 'view'), true);
  assert.equal(checkPermission('VERIFIKATOR', 'masuk', 'input'), false);
  assert.equal(checkPermission('VERIFIKATOR', 'masuk', 'verify'), true);
  assert.equal(checkPermission('VERIFIKATOR', 'keluar', 'verify'), true);
  assert.equal(checkPermission('VERIFIKATOR', 'retur', 'verify'), true);
  assert.equal(checkPermission('VERIFIKATOR', 'retur', 'approve'), false); // Only Pemilik can approve
  assert.equal(checkPermission('VERIFIKATOR', 'pembukuan', 'view'), true);
  assert.equal(checkPermission('VERIFIKATOR', 'pembukuan', 'export_print'), false);
  assert.equal(checkPermission('VERIFIKATOR', 'pengguna', 'manage_users'), false);

  // Pemilik
  assert.equal(checkPermission('PEMILIK', 'dashboard', 'edit_threshold'), true);
  assert.equal(checkPermission('PEMILIK', 'masuk', 'input'), false); // Operator inputs
  assert.equal(checkPermission('PEMILIK', 'retur', 'approve'), true);
  assert.equal(checkPermission('PEMILIK', 'pembukuan', 'export_print'), true);
  assert.equal(checkPermission('PEMILIK', 'pengguna', 'manage_users'), true);
});

test('getAuthorizedMenus hides unauthorized navigation items per role', () => {
  const operatorMenus = getAuthorizedMenus('OPERATOR').map(m => m.id);
  assert.ok(!operatorMenus.includes('pembukuan'));
  assert.ok(!operatorMenus.includes('pengguna'));

  const verifikatorMenus = getAuthorizedMenus('VERIFIKATOR').map(m => m.id);
  assert.ok(verifikatorMenus.includes('pembukuan'));
  assert.ok(!verifikatorMenus.includes('pengguna'));

  const pemilikMenus = getAuthorizedMenus('PEMILIK').map(m => m.id);
  assert.ok(pemilikMenus.includes('pembukuan'));
  assert.ok(pemilikMenus.includes('pengguna'));
});

test('checkPermission grants edit and delete on transactions to Operator and Pemilik only, not Verifikator', () => {
  for (const menu of ['masuk', 'keluar', 'retur'] as const) {
    assert.equal(checkPermission('OPERATOR', menu, 'edit'), true);
    assert.equal(checkPermission('OPERATOR', menu, 'delete'), true);
    assert.equal(checkPermission('PEMILIK', menu, 'edit'), true);
    assert.equal(checkPermission('PEMILIK', menu, 'delete'), true);
    assert.equal(checkPermission('VERIFIKATOR', menu, 'edit'), false);
    assert.equal(checkPermission('VERIFIKATOR', menu, 'delete'), false);
    assert.equal(checkPermission('VERIFIKATOR', menu, 'verify'), true);
  }
});

test('damaged returns never add to stock even if isReusableForStock flag is true', () => {
  const damagedReturn: ReturnTransaction = {
    id: 'ret-damaged',
    transactionNumber: 'RET-999',
    date: '2026-02-08',
    materialId: 'robusta-1',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 25,
    invoiceOrCustomer: 'Kedai Uji',
    reason: 'Terkontaminasi lembab',
    condition: 'Biji Rusak / Terkontaminasi / Cacat',
    status: 'Disetujui',
    isReusableForStock: true,
    createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
    createdAt: '2026-02-08T08:00:00Z'
  };

  const summary = calculateMaterialStock(mockMaterial, [], [], [damagedReturn]);
  assert.equal(summary.returnsReusableKg, 0);
  assert.equal(summary.currentStock, 100);
});

test('validateInventoryIntegrity prevents edits or deletions that produce negative stock', () => {
  const materialNoInitial: CoffeeMaterial = { ...mockMaterial, initialStock: 0 };
  const verifiedIn: IncomingTransaction = {
    id: 'in-v1',
    transactionNumber: 'IN-100',
    date: '2026-02-01',
    materialId: 'robusta-1',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 100,
    supplierName: 'Petani A',
    status: 'Terverifikasi',
    createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
    createdAt: '2026-02-01T08:00:00Z'
  };
  const verifiedOut: OutgoingTransaction = {
    id: 'out-v1',
    transactionNumber: 'OUT-100',
    date: '2026-02-02',
    materialId: 'robusta-1',
    materialName: 'Biji Kopi Robusta',
    quantityKg: 90,
    purpose: 'Batch 1',
    status: 'Terverifikasi',
    createdBy: { id: 'u1', name: 'Budi', role: 'OPERATOR' },
    createdAt: '2026-02-02T08:00:00Z'
  };

  // Valid baseline: 100 - 90 = 10 kg
  assert.equal(
    validateInventoryIntegrity([materialNoInitial], [verifiedIn], [verifiedOut], []).valid,
    true
  );

  // Deleting verified incoming would yield -90 kg -> blocked
  const delCheck = validateInventoryIntegrity([materialNoInitial], [], [verifiedOut], []);
  assert.equal(delCheck.valid, false);
  assert.equal(delCheck.resultingStock, -90);

  // Reducing incoming from 100 to 80 yields -10 kg -> blocked
  const reducedIn = [{ ...verifiedIn, quantityKg: 80 }];
  const editInCheck = validateInventoryIntegrity([materialNoInitial], reducedIn, [verifiedOut], []);
  assert.equal(editInCheck.valid, false);
  assert.equal(editInCheck.resultingStock, -10);

  // Increasing outgoing from 90 to 105 yields -5 kg -> blocked
  const increasedOut = [{ ...verifiedOut, quantityKg: 105 }];
  const editOutCheck = validateInventoryIntegrity([materialNoInitial], [verifiedIn], increasedOut, []);
  assert.equal(editOutCheck.valid, false);
  assert.equal(editOutCheck.resultingStock, -5);
});

