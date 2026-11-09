/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role =
  | 'superadmin'
  | 'admin'
  | 'gerente'
  | 'vendedor'
  | 'cajero'
  | 'tecnico'
  | 'contador'
  | 'inventarista';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string;
  active: boolean;
  avatarInitials: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  isMain: boolean;
}

export type MetalType =
  | 'ORO_24K'
  | 'ORO_18K_NACIONAL'
  | 'ORO_18K_ITALIANO'
  | 'ORO_14K'
  | 'ORO_10K'
  | 'PLATA_925'
  | 'PLATINO_950';

export interface MetalPriceConfig {
  code: MetalType;
  name: string;
  fineness: number; // e.g. 0.750 for 18K, 0.585 for 14K, 0.925 for Plata, 0.999 for 24K
  karatText: string;
  buyPriceGramCOP: number; // Precio compra chatarra / retal
  sellPriceGramCOP: number; // Precio venta metal elaborado base
  lastUpdated: string;
  source: string;
}

export type JewelCategory =
  | 'Anillos'
  | 'Cadenas'
  | 'Pulseras'
  | 'Aretes'
  | 'Dijes'
  | 'Gargantillas'
  | 'Relojes de Lujo'
  | 'Lingotes y Monedas'
  | 'Gemas Certificadas';

export interface Gemstone {
  id: string;
  type: 'Diamante Natural' | 'Esmeralda Colombiana' | 'Rubí' | 'Zafiro' | 'Circón' | 'Perla' | 'Tanzanita' | 'Otro';
  carats: number;
  quantity: number;
  cut: 'Brillante Redondo' | 'Corte Esmeralda' | 'Princesa' | 'Oval' | 'Pera' | 'Marquesa' | 'Cojín';
  color: string; // D, E, F, G, H, Verde Muzo Intenso, etc.
  clarity: string; // FL, IF, VVS1, VVS2, VS1, VS2, SI1, Calidad Gema
  certificateOrg?: 'GIA' | 'IGI' | 'CDTEC Colombia' | 'HRD' | 'Laboratorio Joyeri';
  certificateNumber?: string;
  estimatedValueCOP?: number;
}

export type ProductStatus =
  | 'DISPONIBLE'
  | 'RESERVADO'
  | 'EN_TALLER'
  | 'CONSIGNADO'
  | 'VENDIDO';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  reference: string;
  name: string;
  description: string;
  category: JewelCategory;
  metalType: MetalType;
  metalColor: 'Amarillo' | 'Blanco' | 'Rosa' | 'Bicolor' | 'Tricolor' | 'Plata' | 'Platino';
  fineness: number; // 0.750, etc.
  
  // Weights (grams)
  grossWeightGrams: number;
  stoneWeightCarats: number;
  stoneWeightGrams: number; // carats * 0.2
  otherComponentsWeightGrams: number;
  netMetalWeightGrams: number; // gross - stoneGrams - components
  fineMetalContentGrams: number; // netMetalWeightGrams * fineness
  
  ringSize?: string;
  lengthCm?: number;
  dimensions?: string;
  
  stones: Gemstone[];
  
  // Commercial
  costPriceCOP: number;
  additionalCostsCOP: number;
  totalCostCOP: number;
  salePriceCOP: number;
  minAllowedPriceCOP: number;
  vatRate: number; // 0.19
  
  // Inventory Control
  branchId: string;
  locationInStore: string; // e.g. "Vitrina Central A-1"
  status: ProductStatus;
  
  isConsignment: boolean;
  consignmentOwner?: string;
  consignmentCommissionRate?: number;
  
  serialNumber?: string;
  batchNumber?: string;
  imageUrl?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productSku: string;
  productName: string;
  type: 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE' | 'VENTA' | 'DEVOLUCION';
  quantity: number;
  fromBranchId?: string;
  toBranchId?: string;
  reason: string;
  userId: string;
  userName: string;
}

export interface Customer {
  id: string;
  docType: 'CC' | 'NIT' | 'CE' | 'Pasaporte';
  docNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  segment: 'VIP' | 'Frecuente' | 'Ocasional';
  anniversaryDate?: string;
  birthday?: string;
  preferredMetal?: string;
  notes?: string;
  totalPurchasesCOP: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  nit: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  category: 'Fundición y Metales' | 'Piedras Preciosas y Esmeraldas' | 'Hechura y Orfebrería' | 'Herramientas e Insumos';
  balancePendingCOP: number;
}

export interface SaleItem {
  productId: string;
  sku: string;
  name: string;
  category: JewelCategory;
  metalType: MetalType;
  metalColor: string;
  netMetalWeightGrams: number;
  fineMetalContentGrams: number;
  unitPriceCOP: number;
  discountCOP: number;
  finalPriceCOP: number;
  quantity: number;
  imageUrl?: string;
}

export type PaymentMethod =
  | 'EFECTIVO'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'TRANSFERENCIA_BANCOLOMBIA'
  | 'NEQUI_DAVIPLATA'
  | 'ANTICIPO_APARTADO';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amountCOP: number;
  referenceNumber?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string; // e.g. 'FAC-2026-0045'
  branchId: string;
  customerId: string;
  customerName: string;
  customerDoc: string;
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  subtotalCOP: number;
  discountTotalCOP: number;
  vatCOP: number;
  totalCOP: number;
  payments: PaymentRecord[];
  status: 'PAGADA' | 'ANULADA' | 'DEVUELTA_PARCIAL' | 'DEVUELTA_TOTAL';
  accountingEntryId: string;
  warrantyCode: string;
  notes?: string;
  returnedTotalCOP?: number;
  returnedVatCOP?: number;
  createdAt: string;
}

export interface SaleReturnItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  refundBaseCOP: number;
  refundVatCOP: number;
  refundTotalCOP: number;
  costCOP: number;
}

export interface SaleReturn {
  id: string;
  creditNoteNumber: string;
  saleId: string;
  invoiceNumber: string;
  branchId: string;
  customerId: string;
  customerName: string;
  customerDoc: string;
  items: SaleReturnItem[];
  subtotalCOP: number;
  vatCOP: number;
  totalCOP: number;
  costCOP: number;
  reason: string;
  refundMethod: PaymentMethod;
  accountingEntryId: string;
  createdBy: string;
  createdAt: string;
}

export type LayawayStatus =
  | 'ACTIVO'
  | 'PARCIAL'
  | 'PAGADO'
  | 'ENTREGADO'
  | 'VENCIDO'
  | 'CANCELADO';

export interface LayawayInstallment {
  id: string;
  date: string;
  amountCOP: number;
  method: PaymentMethod;
  receiptNumber: string;
  cashierName: string;
}

export interface Layaway {
  id: string;
  code: string; // 'SEP-2026-0012'
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerDoc: string;
  productId: string;
  productSku: string;
  productName: string;
  totalAmountCOP: number;
  initialDepositCOP: number;
  balanceCOP: number;
  dueDate: string;
  installments: LayawayInstallment[];
  status: LayawayStatus;
  sellerName: string;
  saleId?: string;
  invoiceNumber?: string;
  deliveredAt?: string;
  createdAt: string;
}

export type RepairStatus =
  | 'RECIBIDO'
  | 'EN_DIAGNOSTICO'
  | 'EN_PROCESO'
  | 'CONTROL_CALIDAD'
  | 'LISTO_ENTREGA'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface RepairPayment {
  id: string;
  date: string;
  amountCOP: number;
  method: PaymentMethod;
  receiptNumber: string;
  cashierName: string;
  notes?: string;
}

export interface RepairOrder {
  id: string;
  orderNumber: string; // 'REP-2026-0078'
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  
  // Customer Piece Custody
  itemDescription: string;
  declaredMetal: string;
  initialWeightGrams: number;
  finalWeightGrams?: number;
  previousDefects: string;
  serviceType:
    | 'Ajuste de Talla'
    | 'Engaste y Reposición de Gema'
    | 'Pulido y Baño de Rodio'
    | 'Soldadura Láser'
    | 'Hechura Personalizada'
    | 'Mantenimiento y Ajuste Broche';
  diagnosticDetails: string;
  technicianName: string;
  
  partsCostCOP: number;
  laborCostCOP: number;
  quotedPriceCOP: number;
  vatRate: number;
  advancePaymentCOP: number;
  advancePaymentMethod: PaymentMethod;
  payments: RepairPayment[];
  balanceCOP: number;
  
  promiseDate: string;
  deliveredDate?: string;
  status: RepairStatus;
  createdAt: string;
}

export interface ManufacturingMaterial {
  material: string;
  fineness: number;
  weightGrams: number;
}

export interface ManufacturingOrder {
  id: string;
  code: string; // 'FAB-2026-0014'
  branchId: string;
  designName: string;
  jewelType: JewelCategory;
  artisanName: string;
  workshopName: string;
  
  materialsDelivered: ManufacturingMaterial[];
  stonesAssigned: { stoneType: string; quantity: number; carats: number }[];
  
  expectedWeightGrams: number;
  finishedProductWeightGrams: number;
  scrapAllowedPercent: number; // e.g. 5%
  scrapReturnedGrams: number;
  netWeightDifferenceGrams: number;
  
  laborCostCOP: number;
  materialCostCOP: number;
  totalCostCOP: number;
  
  status: 'EN_TALLER' | 'CONCILIADA' | 'INGRESADA_INVENTARIO';
  generatedProductSku?: string;
  createdAt: string;
}

export interface CashShift {
  id: string;
  shiftNumber: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  initialCashCOP: number;
  
  // Real time aggregates
  cashSalesCOP: number;
  cardSalesCOP: number;
  transferSalesCOP: number;
  layawayCashCOP: number;
  repairCashCOP: number;
  repairCardCOP: number;
  repairTransferCOP: number;
  cashExpensesCOP: number;
  cashRefundsCOP: number;
  
  expectedCashCOP: number;
  actualCountedCashCOP?: number;
  differenceCOP?: number;
  differenceReason?: string;
  notes?: string;
  status: 'ABIERTA' | 'CERRADA';
}

export interface Expense {
  id: string;
  voucherNumber: string;
  branchId: string;
  category: 'Arriendo' | 'Servicios Públicos' | 'Seguridad y Bóvedas' | 'Insumos de Taller' | 'Publicidad y Mercadeo' | 'Honorarios' | 'Gastos Menores';
  description: string;
  amountCOP: number;
  beneficiary: string;
  paymentMethod: PaymentMethod;
  registeredBy: string;
  date: string;
}

export interface JournalRow {
  accountCode: string;
  accountName: string;
  debitCOP: number;
  creditCOP: number;
}

export interface AccountingEntry {
  id: string;
  voucherNumber: string; // 'CC-2026-0156'
  date: string;
  concept: string;
  sourceModule: 'VENTAS' | 'COMPRAS' | 'CAJA' | 'REPARACION' | 'NOMINA' | 'AJUSTE_INVENTARIO' | 'GASTOS' | 'DEVOLUCION';
  rows: JournalRow[];
  totalDebitCOP: number;
  totalCreditCOP: number;
  isBalanced: boolean;
  createdBy: string;
}

export interface Employee {
  id: string;
  docNumber: string;
  name: string;
  roleTitle: string;
  branchId: string;
  baseSalaryCOP: number;
  commissionRatePercent: number; // e.g. 2.5%
  salesCurrentMonthCOP: number;
  commissionEarnedCOP: number;
  active: boolean;
}

export interface WarrantyRecord {
  id: string;
  warrantyCode: string;
  invoiceNumber: string;
  customerName: string;
  customerDoc: string;
  productSku: string;
  productName: string;
  validityMonths: number;
  startDate: string;
  endDate: string;
  coverageSummary: string;
  status: 'VIGENTE' | 'RECLAMADA' | 'VENCIDA' | 'ANULADA';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
}

// DAILY RECONCILIATION (CUADRE DIARIO DE INVENTARIO Y CAJA)

export interface GoldInventorySnapshot {
  metalType: MetalType;
  pieces: number;
  grossWeightGrams: number;
  netMetalWeightGrams: number;
  fineMetalContentGrams: number;
}

export interface StoneInventorySnapshot {
  stoneType: string;
  quantity: number;
  carats: number;
}

export interface DailyReconciliationGoldLine extends GoldInventorySnapshot {
  countedPieces: number;
  countedGrossWeightGrams: number;
  piecesDifference: number;
  grossWeightDifferenceGrams: number;
  matches: boolean;
}

export interface DailyReconciliationStoneLine extends StoneInventorySnapshot {
  countedQuantity: number;
  countedCarats: number;
  quantityDifference: number;
  caratsDifference: number;
  matches: boolean;
}

export interface DailyReconciliation {
  id: string;
  date: string;
  branchId: string;
  branchName: string;
  responsibleUserId: string;
  responsibleUserName: string;
  shiftId?: string;
  shiftNumber?: string;
  shiftStatus?: CashShift['status'];
  goldLines: DailyReconciliationGoldLine[];
  expectedGoldPieces: number;
  countedGoldPieces: number;
  expectedGoldGrossGrams: number;
  countedGoldGrossGrams: number;
  expectedGoldNetGrams: number;
  expectedGoldFineGrams: number;
  stoneLines: DailyReconciliationStoneLine[];
  expectedStoneQuantity: number;
  countedStoneQuantity: number;
  expectedStoneCarats: number;
  countedStoneCarats: number;
  expectedCashCOP: number;
  countedCashCOP: number;
  cashDifferenceCOP: number;
  inventoryMatches: boolean;
  cashMatches: boolean;
  status: 'CUADRADO' | 'DIFERENCIA';
  notes?: string;
  createdAt: string;
}
