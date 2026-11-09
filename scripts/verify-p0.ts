const storageMap: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => (key in storageMap ? storageMap[key] : null),
  setItem: (key: string, value: string) => {
    storageMap[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storageMap[key];
  },
};

import {
  getExpectedGoldLines,
  getExpectedStoneLines,
} from '../src/utils/dailyReconciliation';
import { calculateProfitAndLoss } from '../src/utils/financials';
import { erpDb } from '../src/services/store';
import { Product } from '../src/types';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`PASS: ${msg}`);
  } else {
    failed++;
    console.error(`FAIL: ${msg}`);
  }
}

erpDb.resetToDefaultSeed();
let state = erpDb.getState();

// --- 1. Reserved product cannot be sold in POS ---
const reservedProduct = state.products.find((p) => p.status === 'RESERVADO');
assert(!!reservedProduct, 'Seed contains a RESERVADO product');
let threwReserved = false;
try {
  erpDb.executeSale({
    customerId: state.customers[0].id,
    productIds: [reservedProduct!.id],
    discounts: {},
    payments: [{ method: 'EFECTIVO', amountCOP: reservedProduct!.salePriceCOP }],
  });
} catch {
  threwReserved = true;
}
assert(threwReserved, 'POS blocks selling RESERVADO products');

// --- 2. Sale workflow ---
const beforeSales = state.sales.length;
const saleProduct = state.products.find(
  (p) => p.status === 'DISPONIBLE' && p.id !== reservedProduct!.id
) as Product;
const cashSale = erpDb.executeSale({
  customerId: state.customers[0].id,
  productIds: [saleProduct.id],
  discounts: {},
  payments: [{ method: 'EFECTIVO', amountCOP: saleProduct.salePriceCOP }],
});
assert(state.sales.length === beforeSales + 1, 'Sale created');
assert(cashSale.status === 'PAGADA', 'Sale is PAGADA');
assert(
  [
    ...state.saleReturns,
    ...state.stockMovements.filter((m) => m.productId === saleProduct.id && m.type === 'VENTA'),
  ].length > 0 &&
    state.stockMovements.some((m) => m.productId === saleProduct.id && m.type === 'VENTA'),
  'Stock movement VENTA recorded'
);
assert(saleProduct.status === 'VENDIDO', 'Product marked VENDIDO after POS sale');
const saleEntry = state.accountingEntries.find(
  (e) => e.voucherNumber === cashSale.accountingEntryId
);
assert(!!saleEntry, 'Accounting entry generated');
assert(saleEntry!.isBalanced, 'Accounting entry balanced');

// --- 3. Return workflow (cash refund) ---
const expectedCashBeforeReturn = erpDb.getState().currentCashShift!.expectedCashCOP;
const ret = erpDb.registerSaleReturn({
  saleId: cashSale.id,
  productIds: [saleProduct.id],
  reason: 'Arrepentimiento cliente',
  refundMethod: 'EFECTIVO',
});
state = erpDb.getState();
assert(ret.creditNoteNumber.startsWith('NC-2026'), 'Credit note number generated');
assert(state.saleReturns.length === 1, 'SaleRegister stored');
assert(cashSale.status === 'DEVUELTA_TOTAL', 'Sale status DEVUELTA_TOTAL');
assert(
  saleProduct.status === 'DISPONIBLE',
  'Returned product back to DISPONIBLE'
);
assert(
  state.stockMovements.some((m) => m.productId === saleProduct.id && m.type === 'DEVOLUCION'),
  'DEVOLUCION movement recorded'
);
const warranty = state.warranties.find((w) => w.invoiceNumber === cashSale.invoiceNumber);
assert(!!warranty && warranty.status === 'ANULADA', 'Warranty ANULADA after return');
assert(
  erpDb.getState().currentCashShift!.cashRefundsCOP === ret.totalCOP,
  'Cash refund reduces expected cash'
);
assert(
  erpDb
    .getState()
    .accountingEntries.some(
      (e) =>
        e.sourceModule === 'DEVOLUCION' &&
        e.voucherNumber === ret.accountingEntryId &&
        e.isBalanced
    ),
  'DEVOLUCION accounting entry balanced'
);
assert(expectedCashBeforeReturn - ret.totalCOP === erpDb.getState().currentCashShift!.expectedCashCOP, 'Expected cash reduced by refund');

// Financial sanity: net revenue = sale base - return base
const pnl = calculateProfitAndLoss({
  sales: state.sales,
  returns: state.saleReturns,
  products: state.products,
  employees: state.employees,
  expenses: state.expenses,
});
assert(
  pnl.netRevenueCOP <= state.sales.reduce((a, s) => a + s.subtotalCOP, 0),
  'P&L net revenue accounts for returns'
);
assert(pnl.commissionsCOP >= 0, 'Commissions computed');

// --- 4. Void sale workflow ---
const voidProduct = state.products.find(
  (p) => p.status === 'DISPONIBLE'
) as Product;
const cardSale = erpDb.executeSale({
  customerId: state.customers[1].id,
  productIds: [voidProduct.id],
  discounts: {},
  payments: [{ method: 'TARJETA_DEBITO', amountCOP: voidProduct.salePriceCOP }],
});
erpDb.voidSale(cardSale.id, 'Error de caja anulación', 'TARJETA_DEBITO');
state = erpDb.getState();
assert(cardSale.status === 'ANULADA', 'voidSale sets ANULADA');
assert(
  voidProduct.status === 'DISPONIBLE',
  'Voided product restored to stock'
);

// --- 5. Repair lifecycle ---
const repairCustomer = state.customers[0];
const repair = erpDb.createRepairOrder({
  customerId: repairCustomer.id,
  itemDescription: 'Anillo dinámico cliente',
  declaredMetal: 'Oro 18K Amarillo',
  initialWeightGrams: 4,
  previousDefects: 'Ninguno',
  serviceType: 'Ajuste de Talla',
  diagnosticDetails: 'N/A',
  partsCostCOP: 0,
  laborCostCOP: 200000,
  advancePaymentCOP: 200000,
  advancePaymentMethod: 'EFECTIVO',
  promiseDate: '2026-04-01',
});
assert(repair.balanceCOP === 0, 'Repair balance covers advance');
assert(repair.payments.length === 1, 'Advance recorded as payment');

// advancing without balance should be allowed
erpDb.updateRepairStatus(repair.id, 'EN_DIAGNOSTICO');
erpDb.updateRepairStatus(repair.id, 'EN_PROCESO');
erpDb.updateRepairStatus(repair.id, 'CONTROL_CALIDAD');
erpDb.updateRepairStatus(repair.id, 'LISTO_ENTREGA');

// unpaid delivery must throw
const unpaidRepair = erpDb.createRepairOrder({
  customerId: repairCustomer.id,
  itemDescription: 'Cadena cliente',
  declaredMetal: 'Oro 18K',
  initialWeightGrams: 3,
  previousDefects: 'Ninguno',
  serviceType: 'Pulido y Baño de Rodio',
  diagnosticDetails: 'N/A',
  partsCostCOP: 0,
  laborCostCOP: 150000,
  advancePaymentCOP: 0,
  advancePaymentMethod: 'EFECTIVO',
  promiseDate: '2026-04-02',
});
let unpaidThrow = false;
try {
  erpDb.updateRepairStatus(unpaidRepair.id, 'ENTREGADO', 3);
} catch {
  unpaidThrow = true;
}
assert(unpaidThrow, 'Delivery blocked with unpaid balance');

erpDb.addRepairPayment(unpaidRepair.id, 150000, 'EFECTIVO');
erpDb.updateRepairStatus(unpaidRepair.id, 'ENTREGADO', 2.98);
state = erpDb.getState();
const paidDelivered = state.repairs.find((r) => r.id === unpaidRepair.id)!;
assert(paidDelivered.status === 'ENTREGADO', 'Repair delivered after full payment');
assert(paidDelivered.balanceCOP === 0, 'Repair balance zero at delivery');
assert(paidDelivered.finalWeightGrams === 2.98, 'Final weight recorded');

// --- 6. Layaway lifecycle as sale ---
const layawayProduct = state.products.find(
  (p) => p.status === 'DISPONIBLE'
) as Product;
const layTotal = layawayProduct.salePriceCOP;
const lay = erpDb.createLayaway({
  customerId: state.customers[0].id,
  productId: layawayProduct.id,
  initialDepositCOP: Math.round(layTotal * 0.3),
  paymentMethod: 'EFECTIVO',
  dueDate: '2026-05-01',
});
assert(layawayProduct.status === 'RESERVADO', 'Layaway reserves product');
let earlyDeliverThrow = false;
try {
  erpDb.deliverLayaway(lay.id);
} catch {
  earlyDeliverThrow = true;
}
assert(earlyDeliverThrow, 'Delivery blocked while balance > 0');
erpDb.addLayawayPayment(lay.id, layTotal - Math.round(layTotal * 0.3), 'EFECTIVO');
const layFresh = (erpDb.getState().layaways.find((l) => l.id === lay.id))!;
const laySale = erpDb.deliverLayaway(layFresh.id);
state = erpDb.getState();
assert(layFresh.status === 'ENTREGADO', 'Layaway delivered');
assert(!!layFresh.saleId && !!laySale.invoiceNumber, 'Layaway linked to sale');
assert(layawayProduct.status === 'VENDIDO', 'Product sold on delivery');
assert(
  state.warranties.some((w) => w.invoiceNumber === laySale.invoiceNumber),
  'Warranty generated for layaway sale'
);
assert(
  state.stockMovements.some(
    (m) => m.productId === layawayProduct.id && m.type === 'VENTA' && m.reason.includes(lay.code)
  ),
  'Layaway sale stock movement'
);
let doubleDeliverThrow = false;
try {
  erpDb.deliverLayaway(layFresh.id);
} catch {
  doubleDeliverThrow = true;
}
assert(doubleDeliverThrow, 'Double delivery rejected');

// --- 7. Master data persistence ---
erpDb.createCustomer({
  docType: 'CC',
  docNumber: '1101998877',
  name: 'Cliente Verificación P0',
  email: 'p0@example.com',
  phone: '3000000000',
  address: 'Bogotá',
  city: 'Bogotá',
  segment: 'Ocasional',
});
state = erpDb.getState();
const persistedRaw = storageMap['joyeri_erp_db_v1'];
assert(
  typeof persistedRaw === 'string' && persistedRaw.includes('Cliente Verificación P0'),
  'Customer creation persisted to storage'
);
const persisted = erpDb.getState();
assert(
  persisted.customers.some((c) => c.name === 'Cliente Verificación P0'),
  'Persisted customer visible in state'
);

// --- 8. Unified daily close ---
const activeBranch = erpDb.getActiveBranch();
const expectedGold = getExpectedGoldLines(state.products, activeBranch.id);
const expectedStones = getExpectedStoneLines(state.products, activeBranch.id);
const countedGold: Record<string, { pieces: number; grossGrams: number }> = {};
expectedGold.forEach((line) => {
  countedGold[line.metalType] = { pieces: line.pieces, grossGrams: line.grossWeightGrams };
});
const countedStones: Record<string, { quantity: number; carats: number }> = {};
expectedStones.forEach((line) => {
  countedStones[line.stoneType] = { quantity: line.quantity, carats: line.carats };
});
const shift = erpDb.getState().currentCashShift!;
const rec = erpDb.registerDailyReconciliation({
  countedGold,
  countedStones,
  countedCashCOP: shift.expectedCashCOP,
  notes: 'Cierre P0',
});
state = erpDb.getState();
assert(rec.status === 'CUADRADO', 'Daily reconciliation CUADRADO');
assert(state.currentCashShift!.status === 'CERRADA', 'Shift closed by daily close');
assert(
  state.cashShiftsHistory.some((s) => s.id === shift.id),
  'Closed shift pushed to history'
);
assert(
  state.currentCashShift!.actualCountedCashCOP === shift.expectedCashCOP,
  'Counted cash recorded on shift'
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
