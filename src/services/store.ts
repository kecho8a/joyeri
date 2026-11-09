/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Branch,
  MetalPriceConfig,
  Product,
  ProductStatus,
  Customer,
  Supplier,
  Sale,
  SaleReturn,
  SaleReturnItem,
  Layaway,
  RepairOrder,
  RepairPayment,
  ManufacturingOrder,
  CashShift,
  Expense,
  AccountingEntry,
  StockMovement,
  WarrantyRecord,
  AuditLogItem,
  Employee,
  PaymentRecord,
  DailyReconciliation,
  DailyReconciliationGoldLine,
  DailyReconciliationStoneLine,
  Purchase,
  PurchaseItem,
  RawMaterial,
} from '../types';
import {
  calculateNetMetalWeight,
  calculateFineMetalWeight,
  METAL_DEFINITIONS,
} from '../utils/jewelryCalculations';
import {
  getExpectedMetalLines,
  getExpectedStoneLines,
  RECONCILIATION_CARATS_TOLERANCE,
  RECONCILIATION_GRAMS_TOLERANCE,
  round3,
} from '../utils/dailyReconciliation';
import { getDefaultJewelryImage } from '../utils/jewelryImages';

// Initial Seed Data
const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'SED-01',
    code: 'BOG-ANDINO',
    name: 'Sede Principal Centro Andino',
    city: 'Bogotá D.C.',
    address: 'Cra. 11 # 82-71 Local 214',
    phone: '+57 (601) 610-8940',
    managerName: 'Carlos Mendoza',
    isMain: true,
  },
  {
    id: 'SED-02',
    code: 'MED-TESORO',
    name: 'Sede Parque Comercial El Tesoro',
    city: 'Medellín',
    address: 'Cra. 25A # 1A Sur 45 Local 308',
    phone: '+57 (604) 321-4450',
    managerName: 'Valentina Restrepo',
    isMain: false,
  },
  {
    id: 'SED-03',
    code: 'BOG-CENTRO',
    name: 'Sede Joyeros de la Candelaria',
    city: 'Bogotá D.C.',
    address: 'Calle 12 # 6-34 Pasaje Real',
    phone: '+57 (601) 283-1120',
    managerName: 'Hernando Rojas',
    isMain: false,
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'USR-01',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@joyeri.co',
    role: 'superadmin',
    branchId: 'SED-01',
    active: true,
    avatarInitials: 'CM',
  },
  {
    id: 'USR-02',
    name: 'Diana Marcela Morales',
    email: 'diana.morales@joyeri.co',
    role: 'vendedor',
    branchId: 'SED-01',
    active: true,
    avatarInitials: 'DM',
  },
  {
    id: 'USR-03',
    name: 'Maestro Jorge Beltrán',
    email: 'taller.beltran@joyeri.co',
    role: 'tecnico',
    branchId: 'SED-01',
    active: true,
    avatarInitials: 'JB',
  },
  {
    id: 'USR-04',
    name: 'Beatriz Eugenia Gómez',
    email: 'contabilidad@joyeri.co',
    role: 'contador',
    branchId: 'SED-01',
    active: true,
    avatarInitials: 'BG',
  },
];

const INITIAL_METAL_PRICES: MetalPriceConfig[] = [
  {
    code: 'ORO_24K',
    name: 'Oro Puro 24K (999.9)',
    fineness: 0.999,
    karatText: '24K',
    buyPriceGramCOP: 382000,
    sellPriceGramCOP: 425000,
    lastUpdated: new Date().toISOString(),
    source: 'Banco de la República / Fix Internacional',
  },
  {
    code: 'ORO_18K_NACIONAL',
    name: 'Oro 18K Amarillo Nacional',
    fineness: 0.750,
    karatText: '18K (750)',
    buyPriceGramCOP: 278000,
    sellPriceGramCOP: 330000,
    lastUpdated: new Date().toISOString(),
    source: 'Mercado Local de Joyeros Bogotá',
  },
  {
    code: 'ORO_18K_ITALIANO',
    name: 'Oro 18K Blanco & Italiano',
    fineness: 0.750,
    karatText: '18K (750)',
    buyPriceGramCOP: 286000,
    sellPriceGramCOP: 358000,
    lastUpdated: new Date().toISOString(),
    source: 'Importación Oficial Vicenza / Bogotá',
  },
  {
    code: 'ORO_14K',
    name: 'Oro 14K (585)',
    fineness: 0.585,
    karatText: '14K',
    buyPriceGramCOP: 215000,
    sellPriceGramCOP: 260000,
    lastUpdated: new Date().toISOString(),
    source: 'Mercado Mayorista',
  },
  {
    code: 'ORO_10K',
    name: 'Oro 10K (417)',
    fineness: 0.417,
    karatText: '10K',
    buyPriceGramCOP: 148000,
    sellPriceGramCOP: 185000,
    lastUpdated: new Date().toISOString(),
    source: 'Mercado Mayorista',
  },
  {
    code: 'PLATA_925',
    name: 'Plata Esterlina Ley 925',
    fineness: 0.925,
    karatText: '925',
    buyPriceGramCOP: 4200,
    sellPriceGramCOP: 8200,
    lastUpdated: new Date().toISOString(),
    source: 'Refinería Nacional de Plata',
  },
  {
    code: 'PLATINO_950',
    name: 'Platino Puro 950',
    fineness: 0.950,
    karatText: 'PT950',
    buyPriceGramCOP: 152000,
    sellPriceGramCOP: 235000,
    lastUpdated: new Date().toISOString(),
    source: 'Bolsa de Metales Preciosos',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CLI-01',
    docType: 'CC',
    docNumber: '52.894.210',
    name: 'María Camila Restrepo',
    email: 'mcrestrepo@gmail.com',
    phone: '315 889 4521',
    address: 'Calle 93 # 12-45 Apto 502',
    city: 'Bogotá D.C.',
    segment: 'VIP',
    anniversaryDate: '2026-10-14',
    birthday: '1988-04-18',
    preferredMetal: 'Oro Blanco 18K y Esmeraldas',
    notes: 'Coleccionista de gemas colombianas. Prefiere talla corte esmeralda.',
    totalPurchasesCOP: 38500000,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'CLI-02',
    docType: 'CC',
    docNumber: '79.432.889',
    name: 'Alejandro Gómez Valencia',
    email: 'agomez.valencia@empresa.com',
    phone: '300 452 9811',
    address: 'Cra. 43A # 18 Sur 60',
    city: 'Medellín',
    segment: 'VIP',
    anniversaryDate: '2026-12-05',
    birthday: '1982-08-22',
    preferredMetal: 'Oro 18K Amarillo y Relojería de Alta Gama',
    notes: 'Cliente de anillos de compromiso y relojería suiza.',
    totalPurchasesCOP: 24600000,
    createdAt: '2026-02-10T11:30:00Z',
  },
  {
    id: 'CLI-03',
    docType: 'CC',
    docNumber: '1.018.445.672',
    name: 'Sofía Helena Pardo',
    email: 'sofia.pardo@outlook.com',
    phone: '312 770 1433',
    address: 'Cra. 7 # 127-10',
    city: 'Bogotá D.C.',
    segment: 'Frecuente',
    birthday: '1995-11-03',
    preferredMetal: 'Oro Rosa 18K y Plata 925',
    notes: 'Interesada en pulseras tennis y aretes de diamantes.',
    totalPurchasesCOP: 12400000,
    createdAt: '2026-03-01T15:20:00Z',
  },
  {
    id: 'CLI-04',
    docType: 'NIT',
    docNumber: '901.442.871-3',
    name: 'Corporación Inversiones Andinas SAS',
    email: 'contacto@inversionesandinas.co',
    phone: '601 744 3200',
    address: 'Av. Chile # 7-65 Piso 9',
    city: 'Bogotá D.C.',
    segment: 'VIP',
    notes: 'Compra de lingotes de oro de inversión 24K para reserva patrimonial.',
    totalPurchasesCOP: 94000000,
    createdAt: '2026-01-05T09:00:00Z',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'PRV-01',
    nit: '900.412.331-1',
    companyName: 'Fundición & Refinería Andina de Metales SAS',
    contactName: 'Ing. Rodrigo Santamaría',
    phone: '601 345 8890',
    email: 'ventas@refineriaandina.com',
    city: 'Bogotá D.C.',
    category: 'Fundición y Metales',
    balancePendingCOP: 0,
  },
  {
    id: 'PRV-02',
    nit: '830.124.981-4',
    companyName: 'Consorcio Esmeraldas de Muzo & Chivor Ltda',
    contactName: 'Guillermo Cárdenas',
    phone: '310 882 1455',
    email: 'gemas@esmeraldasmuzo.co',
    city: 'Bogotá D.C.',
    category: 'Piedras Preciosas y Esmeraldas',
    balancePendingCOP: 8500000,
  },
  {
    id: 'PRV-03',
    nit: '19.345.892-2',
    companyName: 'Taller de Alta Orfebrería Maestro Morales',
    contactName: 'Maestro Álvaro Morales',
    phone: '316 432 0910',
    email: 'taller.morales@gmail.com',
    city: 'Bogotá D.C.',
    category: 'Hechura y Orfebrería',
    balancePendingCOP: 2200000,
  },
  {
    id: 'PRV-04',
    nit: '900.781.452-3',
    companyName: 'Insumos Joyeros de Colombia SAS',
    contactName: 'Andrea Lucía Pardo',
    phone: '601 412 7788',
    email: 'compras@insumosjoyeros.co',
    city: 'Bogotá D.C.',
    category: 'Herramientas e Insumos',
    balancePendingCOP: 0,
  },
];

const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'MAT-01',
    name: 'Granalla de Oro 18K Nacional',
    category: 'Materia Prima',
    unit: 'g',
    quantity: 45.5,
    unitCostCOP: 285000,
    minStock: 20,
    branchId: 'SED-01',
    updatedAt: '2026-03-06T09:00:00Z',
  },
  {
    id: 'MAT-02',
    name: 'Granalla de Plata Esterlina 925',
    category: 'Materia Prima',
    unit: 'g',
    quantity: 320,
    unitCostCOP: 4600,
    minStock: 150,
    branchId: 'SED-01',
    updatedAt: '2026-03-06T09:00:00Z',
  },
  {
    id: 'MAT-03',
    name: 'Esmeralda Muzo Nacional',
    category: 'Piedra Preciosa',
    unit: 'ct',
    quantity: 2.4,
    unitCostCOP: 4200000,
    minStock: 1,
    branchId: 'SED-01',
    updatedAt: '2026-03-06T09:00:00Z',
  },
  {
    id: 'MAT-04',
    name: 'Diamantes Brillantes 0.01 ct',
    category: 'Piedra Preciosa',
    unit: 'ct',
    quantity: 3.2,
    unitCostCOP: 3500000,
    minStock: 1,
    branchId: 'SED-01',
    updatedAt: '2026-03-06T09:00:00Z',
  },
  {
    id: 'MAT-05',
    name: 'Pasta de Pulir Dialux',
    category: 'Insumo de Taller',
    unit: 'unidad',
    quantity: 6,
    unitCostCOP: 38000,
    minStock: 3,
    branchId: 'SED-01',
    updatedAt: '2026-03-06T09:00:00Z',
  },
  {
    id: 'MAT-06',
    name: 'Brocas de Precisión para Joyería',
    category: 'Insumo de Taller',
    unit: 'unidad',
    quantity: 12,
    unitCostCOP: 12000,
    minStock: 10,
    branchId: 'SED-01',
    updatedAt: '2026-03-06T09:00:00Z',
  },
];

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'PUR-01',
    invoiceNumber: 'FC-PRV-2026-0031',
    supplierId: 'PRV-01',
    supplierName: 'Fundición & Refinería Andina de Metales SAS',
    branchId: 'SED-01',
    date: '2026-03-06',
    paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA',
    items: [
      {
        id: 'PIT-01',
        description: 'Granalla de Oro 18K Nacional',
        category: 'Materia Prima',
        quantity: 30,
        unit: 'g',
        unitCostCOP: 285000,
        totalCostCOP: 8550000,
      },
    ],
    totalCOP: 8550000,
    status: 'PAGADA',
    notes: 'Compra de materia prima para órdenes de hechura del mes.',
    accountingEntryId: 'CC-COM-2026-0031',
    createdBy: 'Carlos Mendoza',
    createdAt: '2026-03-06T09:10:00Z',
  },
  {
    id: 'PUR-02',
    invoiceNumber: 'FC-PRV-2026-0032',
    supplierId: 'PRV-02',
    supplierName: 'Consorcio Esmeraldas de Muzo & Chivor Ltda',
    branchId: 'SED-01',
    date: '2026-03-07',
    paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA',
    items: [
      {
        id: 'PIT-02',
        description: 'Esmeralda Muzo Nacional',
        category: 'Piedra Preciosa',
        quantity: 1.5,
        unit: 'ct',
        unitCostCOP: 4200000,
        totalCostCOP: 6300000,
      },
    ],
    totalCOP: 6300000,
    status: 'PENDIENTE',
    notes: 'Saldo pendiente con el proveedor de gemas.',
    accountingEntryId: 'CC-COM-2026-0032',
    createdBy: 'Carlos Mendoza',
    createdAt: '2026-03-07T11:30:00Z',
  },
  {
    id: 'PUR-03',
    invoiceNumber: 'FC-PRV-2026-0033',
    supplierId: 'PRV-04',
    supplierName: 'Insumos Joyeros de Colombia SAS',
    branchId: 'SED-01',
    date: '2026-03-08',
    paymentMethod: 'EFECTIVO',
    items: [
      {
        id: 'PIT-03',
        description: 'Pasta de Pulir Dialux',
        category: 'Insumo de Taller',
        quantity: 4,
        unit: 'unidad',
        unitCostCOP: 38000,
        totalCostCOP: 152000,
      },
      {
        id: 'PIT-04',
        description: 'Brocas de Precisión para Joyería',
        category: 'Insumo de Taller',
        quantity: 10,
        unit: 'unidad',
        unitCostCOP: 12000,
        totalCostCOP: 120000,
      },
    ],
    totalCOP: 272000,
    status: 'PAGADA',
    notes: 'Reposición de insumos de taller.',
    accountingEntryId: 'CC-COM-2026-0033',
    createdBy: 'Carlos Mendoza',
    createdAt: '2026-03-08T08:50:00Z',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    sku: 'ANI-ORO18-ESM-01',
    barcode: '770999000101',
    reference: 'REF-ESM-MUZO-18K',
    name: 'Anillo de Compromiso con Esmeralda Muzo 1.85 ct y Brillantes',
    description: 'Anillo de alta joyería elaborado a mano en oro amarillo de 18K (Ley 0.750). Centro con Esmeralda Colombiana de Muzo certificada de 1.85 quilates verde intenso, rodeada por halo de 14 diamantes naturales corte brillante.',
    category: 'Anillos',
    metalType: 'ORO_18K_NACIONAL',
    metalColor: 'Amarillo',
    fineness: 0.750,
    grossWeightGrams: 6.85,
    stoneWeightCarats: 2.35, // 1.85 esm + 0.50 diamantes
    stoneWeightGrams: 0.47, // 2.35 * 0.20
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 6.38,
    fineMetalContentGrams: 4.785, // 6.38 * 0.750
    ringSize: '6.5 US',
    stones: [
      {
        id: 'GEM-01',
        type: 'Esmeralda Colombiana',
        carats: 1.85,
        quantity: 1,
        cut: 'Corte Esmeralda',
        color: 'Verde Muzo Profundo',
        clarity: 'Calidad Gema Muy Fina',
        certificateOrg: 'CDTEC Colombia',
        certificateNumber: 'CDTEC-2026-8841',
        estimatedValueCOP: 9500000,
      },
      {
        id: 'GEM-02',
        type: 'Diamante Natural',
        carats: 0.50,
        quantity: 14,
        cut: 'Brillante Redondo',
        color: 'F',
        clarity: 'VS1',
        estimatedValueCOP: 2200000,
      },
    ],
    costPriceCOP: 11200000,
    additionalCostsCOP: 450000, // Engaste maestro y certificación
    totalCostCOP: 11650000,
    salePriceCOP: 16800000,
    minAllowedPriceCOP: 15500000,
    vatRate: 0.19,
    branchId: 'SED-01',
    locationInStore: 'Vitrina Alta Joyería A-01',
    status: 'DISPONIBLE',
    isConsignment: false,
    serialNumber: 'JOY-2026-0081',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'PRD-002',
    sku: 'ANI-BLA18-DIA-02',
    barcode: '770999000102',
    reference: 'SOL-DIA-GIA-72',
    name: 'Solitario Clásico Diamante GIA 0.72 ct Oro Blanco 18K',
    description: 'Solitario clásico en oro blanco de 18K rodiado con Diamante Natural Certificado GIA 0.72 ct, Color E, Claridad VVS2, Triple Excelente.',
    category: 'Anillos',
    metalType: 'ORO_18K_ITALIANO',
    metalColor: 'Blanco',
    fineness: 0.750,
    grossWeightGrams: 4.25,
    stoneWeightCarats: 0.72,
    stoneWeightGrams: 0.144,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 4.106,
    fineMetalContentGrams: 3.08,
    ringSize: '7 US',
    stones: [
      {
        id: 'GEM-03',
        type: 'Diamante Natural',
        carats: 0.72,
        quantity: 1,
        cut: 'Brillante Redondo',
        color: 'E',
        clarity: 'VVS2',
        certificateOrg: 'GIA',
        certificateNumber: 'GIA-2489110294',
        estimatedValueCOP: 12500000,
      },
    ],
    costPriceCOP: 12800000,
    additionalCostsCOP: 350000,
    totalCostCOP: 13150000,
    salePriceCOP: 18900000,
    minAllowedPriceCOP: 17800000,
    vatRate: 0.19,
    branchId: 'SED-01',
    locationInStore: 'Vitrina Alta Joyería A-02',
    status: 'DISPONIBLE',
    isConsignment: false,
    serialNumber: 'JOY-2026-0092',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'PRD-003',
    sku: 'CAD-ORO18-CUB-03',
    barcode: '770999000103',
    reference: 'CUB-ITA-50CM-26G',
    name: 'Cadena Eslabón Cubano Macizo Oro 18K Italiano 50 cm',
    description: 'Cadena cubana maciza en oro amarillo 18K Ley 0.750 terminación pulida a espejo. 50 centímetros de longitud, broche de seguridad tipo cajón con doble traba.',
    category: 'Cadenas',
    metalType: 'ORO_18K_ITALIANO',
    metalColor: 'Amarillo',
    fineness: 0.750,
    grossWeightGrams: 26.40,
    stoneWeightCarats: 0,
    stoneWeightGrams: 0,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 26.40,
    fineMetalContentGrams: 19.80, // 26.40 * 0.750 = 19.8g oro fino
    lengthCm: 50,
    stones: [],
    costPriceCOP: 8184000, // 26.4 * 310.000
    additionalCostsCOP: 250000,
    totalCostCOP: 8434000,
    salePriceCOP: 11800000,
    minAllowedPriceCOP: 10900000,
    vatRate: 0.19,
    branchId: 'SED-01',
    locationInStore: 'Vitrina Cadenas B-01',
    status: 'VENDIDO',
    isConsignment: false,
    serialNumber: 'JOY-2026-0114',
    createdAt: '2026-02-12T14:00:00Z',
    updatedAt: '2026-02-12T14:00:00Z',
  },
  {
    id: 'PRD-004',
    sku: 'PUL-BLA18-TEN-04',
    barcode: '770999000104',
    reference: 'TEN-DIA-42P-280CT',
    name: 'Pulsera Tennis Oro Blanco 18K con 42 Diamantes (2.80 ct total)',
    description: 'Pulsera clásica tipo Tennis elaborada en oro blanco de 18K con 42 diamantes naturales seleccionados de 0.067 ct cada uno engastados en 4 uñas con articulación flexible de alta resistencia.',
    category: 'Pulseras',
    metalType: 'ORO_18K_ITALIANO',
    metalColor: 'Blanco',
    fineness: 0.750,
    grossWeightGrams: 11.20,
    stoneWeightCarats: 2.80,
    stoneWeightGrams: 0.56,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 10.64,
    fineMetalContentGrams: 7.98,
    lengthCm: 18,
    stones: [
      {
        id: 'GEM-04',
        type: 'Diamante Natural',
        carats: 2.80,
        quantity: 42,
        cut: 'Brillante Redondo',
        color: 'G-H',
        clarity: 'VS2-SI1',
        estimatedValueCOP: 9800000,
      },
    ],
    costPriceCOP: 12400000,
    additionalCostsCOP: 400000,
    totalCostCOP: 12800000,
    salePriceCOP: 18500000,
    minAllowedPriceCOP: 17200000,
    vatRate: 0.19,
    branchId: 'SED-01',
    locationInStore: 'Vitrina Pulseras C-01',
    status: 'RESERVADO',
    isConsignment: false,
    serialNumber: 'JOY-2026-0120',
    createdAt: '2026-02-15T16:00:00Z',
    updatedAt: '2026-02-15T16:00:00Z',
  },
  {
    id: 'PRD-005',
    sku: 'ARE-ORO18-ESM-05',
    barcode: '770999000105',
    reference: 'ARE-ESM-CHIV-21',
    name: 'Aretes Colgantes Esmeraldas Chivor 2.10 ct Oro 18K',
    description: 'Par de aretes colgantes en oro amarillo 18K con dos esmeraldas naturales colombianas de Chivor talla pera de 1.05 ct cada una, decoradas con diamantes brillantes.',
    category: 'Aretes',
    metalType: 'ORO_18K_NACIONAL',
    metalColor: 'Amarillo',
    fineness: 0.750,
    grossWeightGrams: 5.60,
    stoneWeightCarats: 2.45,
    stoneWeightGrams: 0.49,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 5.11,
    fineMetalContentGrams: 3.832,
    stones: [
      {
        id: 'GEM-05',
        type: 'Esmeralda Colombiana',
        carats: 2.10,
        quantity: 2,
        cut: 'Pera',
        color: 'Verde Chivor Luminoso',
        clarity: 'Fina con Jardín Natural',
        certificateOrg: 'Laboratorio Joyeri',
        certificateNumber: 'JOY-ESM-449',
        estimatedValueCOP: 5600000,
      },
    ],
    costPriceCOP: 6200000,
    additionalCostsCOP: 280000,
    totalCostCOP: 6480000,
    salePriceCOP: 9400000,
    minAllowedPriceCOP: 8800000,
    vatRate: 0.19,
    branchId: 'SED-02',
    locationInStore: 'Vitrina Medellín Aretes M-01',
    status: 'VENDIDO',
    isConsignment: false,
    serialNumber: 'JOY-2026-0145',
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-02-20T11:00:00Z',
  },
  {
    id: 'PRD-006',
    sku: 'LIN-ORO24-BAR-06',
    barcode: '770999000106',
    reference: 'LINGOTE-24K-10G',
    name: 'Lingote de Oro Puro 24K (999.9) Certificado 10.00 g Sellado',
    description: 'Lingote de inversión en blister sellado de seguridad con número de serie único y ensayo de ley 999.9 milésimas de pureza garantizada.',
    category: 'Lingotes y Monedas',
    metalType: 'ORO_24K',
    metalColor: 'Amarillo',
    fineness: 0.999,
    grossWeightGrams: 10.00,
    stoneWeightCarats: 0,
    stoneWeightGrams: 0,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 10.00,
    fineMetalContentGrams: 9.99,
    stones: [],
    costPriceCOP: 3820000,
    additionalCostsCOP: 80000,
    totalCostCOP: 3900000,
    salePriceCOP: 4350000,
    minAllowedPriceCOP: 4200000,
    vatRate: 0.0, // Oro de inversión exento según normativa
    branchId: 'SED-01',
    locationInStore: 'Bóveda Principal de Seguridad',
    status: 'DISPONIBLE',
    isConsignment: false,
    serialNumber: 'ARG-2026-99081',
    createdAt: '2026-02-22T10:00:00Z',
    updatedAt: '2026-02-22T10:00:00Z',
  },
  {
    id: 'PRD-007',
    sku: 'PUL-PLA925-ROL-07',
    barcode: '770999000107',
    reference: 'PUL-PLATA-ROLO-925',
    name: 'Pulsera Rolo con Dije Corazón Candado Plata Ley 925',
    description: 'Pulsera de eslabones rolo fabricada en plata esterlina 925 con acabado electroquímico antioxidante y dije en forma de candado corazón.',
    category: 'Pulseras',
    metalType: 'PLATA_925',
    metalColor: 'Plata',
    fineness: 0.925,
    grossWeightGrams: 14.50,
    stoneWeightCarats: 0,
    stoneWeightGrams: 0,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 14.50,
    fineMetalContentGrams: 13.41,
    stones: [],
    costPriceCOP: 125000,
    additionalCostsCOP: 15000,
    totalCostCOP: 140000,
    salePriceCOP: 320000,
    minAllowedPriceCOP: 290000,
    vatRate: 0.19,
    branchId: 'SED-03',
    locationInStore: 'Vitrina Plata P-02',
    status: 'VENDIDO',
    isConsignment: false,
    serialNumber: 'JOY-PLA-049',
    createdAt: '2026-02-25T14:30:00Z',
    updatedAt: '2026-02-25T14:30:00Z',
  },
  {
    id: 'PRD-008',
    sku: 'REL-ROX-DAT-08',
    barcode: '770999000108',
    reference: 'ROLEX-DJ36-126233',
    name: 'Reloj Rolex Datejust 36 Acero y Oro Amarillo Bisel Estriado',
    description: 'Reloj de lujo pre-owned certificado en impecable estado de conservación. Caja de 36mm en acero Oystersteel y bisel de oro amarillo 18K. Esfera dorada con brazalete Jubilee.',
    category: 'Relojes de Lujo',
    metalType: 'ORO_18K_NACIONAL',
    metalColor: 'Bicolor',
    fineness: 0.750,
    grossWeightGrams: 135.00,
    stoneWeightCarats: 0,
    stoneWeightGrams: 0,
    otherComponentsWeightGrams: 105.00, // Maquinaria, zafiro y acero
    netMetalWeightGrams: 30.00, // Partes de oro 18K
    fineMetalContentGrams: 22.50,
    stones: [],
    costPriceCOP: 42000000,
    additionalCostsCOP: 1200000,
    totalCostCOP: 43200000,
    salePriceCOP: 56500000,
    minAllowedPriceCOP: 53000000,
    vatRate: 0.19,
    branchId: 'SED-01',
    locationInStore: 'Vitrina Bóveda Relojería',
    status: 'CONSIGNADO',
    isConsignment: true,
    consignmentOwner: 'Dr. Fernando Echeverri (Consignación Cliente)',
    consignmentCommissionRate: 0.12,
    serialNumber: '82M94012',
    createdAt: '2026-02-28T16:00:00Z',
    updatedAt: '2026-02-28T16:00:00Z',
  },
  {
    id: 'PRD-001-HIST',
    sku: 'ANI-ORO18-RUB-HIST',
    barcode: '770999000199',
    reference: 'REF-RUB-HIST',
    name: 'Anillo Oro 18K con Rubí Birmano 1.10 ct',
    description: 'Pieza histórica vendida. Se conserva para trazabilidad de factura, costo y garantía.',
    category: 'Anillos',
    metalType: 'ORO_18K_NACIONAL',
    metalColor: 'Amarillo',
    fineness: 0.750,
    grossWeightGrams: 5.02,
    stoneWeightCarats: 1.10,
    stoneWeightGrams: 0.22,
    otherComponentsWeightGrams: 0,
    netMetalWeightGrams: 4.80,
    fineMetalContentGrams: 3.60,
    stones: [
      {
        id: 'GEM-HIST-01',
        type: 'Rubí',
        carats: 1.10,
        quantity: 1,
        cut: 'Oval',
        color: 'Rojo Birmano',
        clarity: 'Calidad Gema',
        estimatedValueCOP: 1800000,
      },
    ],
    costPriceCOP: 4800000,
    additionalCostsCOP: 0,
    totalCostCOP: 4800000,
    salePriceCOP: 7800000,
    minAllowedPriceCOP: 7500000,
    vatRate: 0.19,
    branchId: 'SED-01',
    locationInStore: 'Vendido - Histórico',
    status: 'VENDIDO',
    isConsignment: false,
    serialNumber: 'JOY-HIST-0104',
    createdAt: '2026-03-01T14:22:00Z',
    updatedAt: '2026-03-01T14:22:00Z',
  },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'SAL-001',
    invoiceNumber: 'FAC-2026-0104',
    branchId: 'SED-01',
    customerId: 'CLI-01',
    customerName: 'María Camila Restrepo',
    customerDoc: 'CC 52.894.210',
    sellerId: 'USR-02',
    sellerName: 'Diana Marcela Morales',
    items: [
      {
        productId: 'PRD-001-HIST',
        sku: 'ANI-ORO18-RUB-HIST',
        name: 'Anillo Oro 18K con Rubí Birmano 1.10 ct',
        category: 'Anillos',
        metalType: 'ORO_18K_NACIONAL',
        metalColor: 'Amarillo',
        netMetalWeightGrams: 4.80,
        fineMetalContentGrams: 3.60,
        unitPriceCOP: 7800000,
        discountCOP: 300000,
        finalPriceCOP: 7500000,
        quantity: 1,
      },
    ],
    subtotalCOP: 6302521,
    discountTotalCOP: 300000,
    vatCOP: 1197479,
    totalCOP: 7500000,
    payments: [
      {
        id: 'PAY-01',
        method: 'TARJETA_CREDITO',
        amountCOP: 7500000,
        referenceNumber: 'AUT-884210',
      },
    ],
    status: 'PAGADA',
    accountingEntryId: 'CC-2026-0041',
    warrantyCode: 'GAR-2026-0104',
    notes: 'Venta por aniversario. Entrega en estuche de madera fina con certificado gemológico.',
    createdAt: '2026-03-01T14:22:00Z',
  },
  {
    id: 'SAL-002',
    invoiceNumber: 'FAC-2026-0105',
    branchId: 'SED-02',
    customerId: 'CLI-02',
    customerName: 'Alejandro Gómez Valencia',
    customerDoc: 'CC 79.432.889',
    sellerId: 'USR-02',
    sellerName: 'Diana Marcela Morales',
    items: [
      {
        productId: 'PRD-005',
        sku: 'ARE-ORO18-ESM-05',
        name: 'Aretes Colgantes Esmeraldas Chivor 2.10 ct Oro 18K',
        category: 'Aretes',
        metalType: 'ORO_18K_NACIONAL',
        metalColor: 'Amarillo',
        netMetalWeightGrams: 5.11,
        fineMetalContentGrams: 3.832,
        unitPriceCOP: 9400000,
        discountCOP: 400000,
        finalPriceCOP: 9000000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
      },
    ],
    subtotalCOP: 7563025,
    discountTotalCOP: 400000,
    vatCOP: 1436975,
    totalCOP: 9000000,
    payments: [
      { id: 'PAY-02A', method: 'TRANSFERENCIA_BANCOLOMBIA', amountCOP: 5000000, referenceNumber: 'TRF-992102' },
      { id: 'PAY-02B', method: 'EFECTIVO', amountCOP: 4000000 },
    ],
    status: 'PAGADA',
    accountingEntryId: 'CC-2026-0042',
    warrantyCode: 'GAR-2026-0105',
    notes: 'Cliente VIP El Tesoro. Regalo de cumpleaños.',
    createdAt: '2026-03-04T16:45:00Z',
  },
  {
    id: 'SAL-003',
    invoiceNumber: 'FAC-2026-0106',
    branchId: 'SED-01',
    customerId: 'CLI-03',
    customerName: 'Sofía Helena Pardo',
    customerDoc: 'CC 1.018.445.672',
    sellerId: 'USR-02',
    sellerName: 'Diana Marcela Morales',
    items: [
      {
        productId: 'PRD-003',
        sku: 'CAD-ORO18-CUB-03',
        name: 'Cadena Eslabón Cubano Macizo Oro 18K Italiano 50 cm',
        category: 'Cadenas',
        metalType: 'ORO_18K_ITALIANO',
        metalColor: 'Amarillo',
        netMetalWeightGrams: 26.40,
        fineMetalContentGrams: 19.80,
        unitPriceCOP: 11800000,
        discountCOP: 0,
        finalPriceCOP: 11800000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      },
    ],
    subtotalCOP: 9915966,
    discountTotalCOP: 0,
    vatCOP: 1884034,
    totalCOP: 11800000,
    payments: [
      { id: 'PAY-03', method: 'TARJETA_DEBITO', amountCOP: 11800000, referenceNumber: 'POS-771239' },
    ],
    status: 'PAGADA',
    accountingEntryId: 'CC-2026-0043',
    warrantyCode: 'GAR-2026-0106',
    notes: 'Compra directa en mostrador Centro Andino.',
    createdAt: '2026-03-07T11:10:00Z',
  },
  {
    id: 'SAL-004',
    invoiceNumber: 'FAC-2026-0107',
    branchId: 'SED-03',
    customerId: 'CLI-02',
    customerName: 'Alejandro Gómez Valencia',
    customerDoc: 'CC 79.432.889',
    sellerId: 'USR-01',
    sellerName: 'Carlos Mendoza',
    items: [
      {
        productId: 'PRD-007',
        sku: 'PUL-PLA925-ROL-07',
        name: 'Pulsera Rolo con Dije Corazón Candado Plata Ley 925',
        category: 'Pulseras',
        metalType: 'PLATA_925',
        metalColor: 'Plata',
        netMetalWeightGrams: 14.50,
        fineMetalContentGrams: 13.41,
        unitPriceCOP: 320000,
        discountCOP: 20000,
        finalPriceCOP: 300000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80',
      },
    ],
    subtotalCOP: 252101,
    discountTotalCOP: 20000,
    vatCOP: 47899,
    totalCOP: 300000,
    payments: [
      { id: 'PAY-04', method: 'EFECTIVO', amountCOP: 300000 },
    ],
    status: 'PAGADA',
    accountingEntryId: 'CC-2026-0044',
    warrantyCode: 'GAR-2026-0107',
    notes: 'Venta de platería en Candelaria Centro.',
    createdAt: '2026-03-08T09:15:00Z',
  },
];

const INITIAL_SALE_RETURNS: SaleReturn[] = [];

const INITIAL_CASH_SHIFT: CashShift = {
  id: 'CSH-2026-0308-01',
  shiftNumber: 'TURNO-2026-0084',
  branchId: 'SED-01',
  cashierId: 'USR-01',
  cashierName: 'Carlos Mendoza',
  openedAt: '2026-03-08T08:30:00Z',
  initialCashCOP: 1500000, // Base de caja en efectivo
  cashSalesCOP: 0,
  cardSalesCOP: 0,
  transferSalesCOP: 0,
  layawayCashCOP: 0,
  repairCashCOP: 0,
  repairCardCOP: 0,
  repairTransferCOP: 0,
  cashExpensesCOP: 0,
  cashRefundsCOP: 0,
  expectedCashCOP: 1500000,
  status: 'ABIERTA',
};

function createClosedCashShift(branchId: string): CashShift {
  return {
    id: `CSH-SIN-TURNO-${branchId}`,
    shiftNumber: `SIN-TURNO-${branchId}`,
    branchId,
    cashierId: 'USR-01',
    cashierName: 'Sin turno abierto',
    openedAt: '',
    initialCashCOP: 0,
    cashSalesCOP: 0,
    cardSalesCOP: 0,
    transferSalesCOP: 0,
    layawayCashCOP: 0,
    repairCashCOP: 0,
    repairCardCOP: 0,
    repairTransferCOP: 0,
    cashExpensesCOP: 0,
    cashRefundsCOP: 0,
    expectedCashCOP: 0,
    status: 'CERRADA',
  };
}

const INITIAL_LAYAWAYS: Layaway[] = [
  {
    id: 'LAY-01',
    code: 'SEP-2026-0012',
    branchId: 'SED-01',
    customerId: 'CLI-03',
    customerName: 'Sofía Helena Pardo',
    customerPhone: '312 770 1433',
    customerDoc: 'CC 1.018.445.672',
    productId: 'PRD-004',
    productSku: 'PUL-BLA18-TEN-04',
    productName: 'Pulsera Tennis Oro Blanco 18K con 42 Diamantes',
    totalAmountCOP: 18500000,
    initialDepositCOP: 5550000, // 30% anticipo
    balanceCOP: 12950000,
    dueDate: '2026-04-15',
    installments: [
      {
        id: 'INST-01',
        date: '2026-02-28T16:00:00Z',
        amountCOP: 5550000,
        method: 'TRANSFERENCIA_BANCOLOMBIA',
        receiptNumber: 'REC-SEP-0012-1',
        cashierName: 'Carlos Mendoza',
      },
    ],
    status: 'ACTIVO',
    sellerName: 'Diana Marcela Morales',
    createdAt: '2026-02-28T16:00:00Z',
  },
];

const INITIAL_REPAIRS: RepairOrder[] = [
  {
    id: 'REP-01',
    orderNumber: 'REP-2026-0078',
    branchId: 'SED-01',
    customerId: 'CLI-01',
    customerName: 'María Camila Restrepo',
    customerPhone: '315 889 4521',
    itemDescription: 'Anillo Solitario de Oro Blanco de la cliente con zafiro oval',
    declaredMetal: 'Oro Blanco 18K (Propiedad de la cliente)',
    initialWeightGrams: 4.62,
    previousDefects: 'Uña superior izquierda doblada con desgaste. Zafiro flojo con riesgo de caída. Rayones en aro.',
    serviceType: 'Engaste y Reposición de Gema',
    diagnosticDetails: 'Se requiere reconstrucción de 4 uñas en oro blanco 18K, reengaste bajo microscopio, pulido completo y baño de rodio electrolítico.',
    technicianName: 'Maestro Jorge Beltrán',
    partsCostCOP: 140000,
    laborCostCOP: 280000,
    quotedPriceCOP: 420000,
    vatRate: 0.19,
    advancePaymentCOP: 200000,
    advancePaymentMethod: 'EFECTIVO',
    payments: [
      {
        id: 'RPAY-01',
        date: '2026-03-02T11:00:00Z',
        amountCOP: 200000,
        method: 'EFECTIVO',
        receiptNumber: 'REC-REP-0078-1',
        cashierName: 'Carlos Mendoza',
      },
    ],
    balanceCOP: 220000,
    promiseDate: '2026-03-12',
    status: 'EN_PROCESO',
    createdAt: '2026-03-02T11:00:00Z',
  },
  {
    id: 'REP-02',
    orderNumber: 'REP-2026-0079',
    branchId: 'SED-01',
    customerId: 'CLI-02',
    customerName: 'Alejandro Gómez Valencia',
    customerPhone: '300 452 9811',
    itemDescription: 'Cadena de oro amarillo tejido militar de 32 gramos',
    declaredMetal: 'Oro Amarillo 18K (Propiedad del cliente)',
    initialWeightGrams: 32.15,
    previousDefects: 'Eslabón número 14 reventado. Broche flojo.',
    serviceType: 'Soldadura Láser',
    diagnosticDetails: 'Soldadura láser con aporte de soldadura de oro 18K 750 ley. Ajuste de resorte de broche marinero.',
    technicianName: 'Maestro Jorge Beltrán',
    partsCostCOP: 80000,
    laborCostCOP: 160000,
    quotedPriceCOP: 240000,
    vatRate: 0.19,
    advancePaymentCOP: 240000, // Pagado total
    advancePaymentMethod: 'EFECTIVO',
    payments: [
      {
        id: 'RPAY-02',
        date: '2026-03-03T15:30:00Z',
        amountCOP: 240000,
        method: 'EFECTIVO',
        receiptNumber: 'REC-REP-0079-1',
        cashierName: 'Carlos Mendoza',
      },
    ],
    balanceCOP: 0,
    promiseDate: '2026-03-09',
    status: 'LISTO_ENTREGA',
    createdAt: '2026-03-03T15:30:00Z',
  },
];

const INITIAL_MANUFACTURING: ManufacturingOrder[] = [
  {
    id: 'FAB-01',
    code: 'FAB-2026-0014',
    branchId: 'SED-01',
    designName: 'Dije Escudo Familia Rosales con Esmeralda y Diamantes',
    jewelType: 'Dijes',
    artisanName: 'Maestro Álvaro Morales',
    workshopName: 'Taller Central de Hechuras Joyeri',
    materialsDelivered: [
      {
        material: 'Granalla de Oro 18K Nacional',
        fineness: 0.750,
        weightGrams: 18.50,
      },
      {
        material: 'Soldadura Oro 18K',
        fineness: 0.750,
        weightGrams: 1.20,
      },
    ],
    stonesAssigned: [
      {
        stoneType: 'Esmeralda Corte Trapiche Muzo',
        quantity: 1,
        carats: 1.65,
      },
      {
        stoneType: 'Diamantes Brillantes',
        quantity: 8,
        carats: 0.24,
      },
    ],
    expectedWeightGrams: 17.20,
    finishedProductWeightGrams: 16.90,
    scrapAllowedPercent: 0.05, // 5% merma técnica permitida
    scrapReturnedGrams: 2.10, // Retal y limallas recuperadas
    netWeightDifferenceGrams: 0.70, // Merma de fundición y pulido
    laborCostCOP: 850000,
    materialCostCOP: 5460000,
    totalCostCOP: 6310000,
    status: 'CONCILIADA',
    createdAt: '2026-02-18T10:00:00Z',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-01',
    voucherNumber: 'EGR-2026-0034',
    branchId: 'SED-01',
    category: 'Seguridad y Bóvedas',
    description: 'Servicio mensual de monitoreo blindado y transporte de valores',
    amountCOP: 1850000,
    beneficiary: 'Prosegur Seguridad de Valores',
    paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA',
    registeredBy: 'Carlos Mendoza',
    date: '2026-03-01',
  },
  {
    id: 'EXP-02',
    voucherNumber: 'EGR-2026-0035',
    branchId: 'SED-01',
    category: 'Insumos de Taller',
    description: 'Pastas de pulir dialux, discos de pelo y ácido decapante para orfebrería',
    amountCOP: 320000,
    beneficiary: 'Insumos Joyeros de Colombia',
    paymentMethod: 'EFECTIVO',
    registeredBy: 'Carlos Mendoza',
    date: '2026-03-04',
  },
];

const INITIAL_ACCOUNTING: AccountingEntry[] = [
  {
    id: 'ACC-01',
    voucherNumber: 'CC-2026-0041',
    date: '2026-03-01',
    concept: 'Venta comercial factura FAC-2026-0104 a cliente María Camila Restrepo',
    sourceModule: 'VENTAS',
    rows: [
      { accountCode: '111005', accountName: 'Bancos Moneda Nacional (Tarjeta)', debitCOP: 7500000, creditCOP: 0 },
      { accountCode: '413535', accountName: 'Comercio al por mayor y menor - Joyas', debitCOP: 0, creditCOP: 6302521 },
      { accountCode: '240805', accountName: 'Impuesto sobre las Ventas por Pagar (IVA 19%)', debitCOP: 0, creditCOP: 1197479 },
      { accountCode: '613535', accountName: 'Costo de Ventas Joyería Oro 18K', debitCOP: 4800000, creditCOP: 0 },
      { accountCode: '143505', accountName: 'Inventario de Mercancías - Joyas Oro 18K', debitCOP: 0, creditCOP: 4800000 },
    ],
    totalDebitCOP: 12300000,
    totalCreditCOP: 12300000,
    isBalanced: true,
    createdBy: 'Sistema Automático JOYERI',
  },
];

const INITIAL_WARRANTIES: WarrantyRecord[] = [
  {
    id: 'WAR-01',
    warrantyCode: 'GAR-2026-0104',
    invoiceNumber: 'FAC-2026-0104',
    customerName: 'María Camila Restrepo',
    customerDoc: 'CC 52.894.210',
    productSku: 'ANI-ORO18-RUB-HIST',
    productName: 'Anillo Oro 18K con Rubí Birmano 1.10 ct',
    validityMonths: 36,
    startDate: '2026-03-01',
    endDate: '2029-03-01',
    coverageSummary: 'Garantía legal y comercial sobre autenticidad de Ley 0.750 Oro 18K de por vida. Mantenimiento y limpieza semestral gratuito en taller oficial.',
    status: 'VIGENTE',
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-01',
    docNumber: '1.020.765.431',
    name: 'Diana Marcela Morales',
    roleTitle: 'Asesora Senior de Alta Joyería',
    branchId: 'SED-01',
    baseSalaryCOP: 2200000,
    commissionRatePercent: 2.5,
    salesCurrentMonthCOP: 7500000,
    commissionEarnedCOP: 187500,
    active: true,
  },
  {
    id: 'EMP-02',
    docNumber: '19.450.812',
    name: 'Jorge Beltrán',
    roleTitle: 'Maestro Orfebre & Engastador',
    branchId: 'SED-01',
    baseSalaryCOP: 3500000,
    commissionRatePercent: 1.0,
    salesCurrentMonthCOP: 0,
    commissionEarnedCOP: 0,
    active: true,
  },
];

const INITIAL_AUDIT: AuditLogItem[] = [
  {
    id: 'AUD-01',
    timestamp: '2026-03-08T08:30:00Z',
    userId: 'USR-01',
    userName: 'Carlos Mendoza',
    action: 'APERTURA_CAJA',
    module: 'Caja y Bancos',
    details: 'Apertura de turno TURNO-2026-0084 en Sede Centro Andino con base de $1.500.000 COP en efectivo.',
  },
  {
    id: 'AUD-02',
    timestamp: '2026-03-08T08:35:00Z',
    userId: 'USR-01',
    userName: 'Carlos Mendoza',
    action: 'ACTUALIZACION_METALES',
    module: 'Metales Preciosos',
    details: 'Verificación matutina de cotización de Oro 24K ($382.000/g) y Oro 18K Nacional ($278.000/g).',
  },
];

const STORAGE_KEY = 'joyeri_erp_db_v1';
const AUTO_BACKUP_PREFIX = 'joyeri_erp_auto_backup_';
const AUTO_BACKUP_LIMIT = 7;

export interface DatabaseState {
  branches: Branch[];
  users: User[];
  metalPrices: MetalPriceConfig[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  purchases: Purchase[];
  rawMaterials: RawMaterial[];
  sales: Sale[];
  saleReturns: SaleReturn[];
  currentCashShift: CashShift;
  branchCashShifts: Record<string, CashShift>;
  cashShiftsHistory: CashShift[];
  layaways: Layaway[];
  repairs: RepairOrder[];
  manufacturingOrders: ManufacturingOrder[];
  expenses: Expense[];
  accountingEntries: AccountingEntry[];
  warranties: WarrantyRecord[];
  stockMovements: StockMovement[];
  employees: Employee[];
  auditLogs: AuditLogItem[];
  dailyReconciliations: DailyReconciliation[];
  activeBranchId: string;
  activeUserId: string;
  largeText: boolean;
}

class ERPDatabaseService {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const products: Product[] = Array.isArray(parsed.products)
          ? parsed.products.map((p: Product) => ({
              ...p,
              imageUrl: p.imageUrl || getDefaultJewelryImage(p.category, p.name),
            }))
          : INITIAL_PRODUCTS;
        const sales: Sale[] = Array.isArray(parsed.sales) ? parsed.sales : INITIAL_SALES;
        const saleReturns: SaleReturn[] = Array.isArray(parsed.saleReturns)
          ? parsed.saleReturns
          : [];
        const repairs: RepairOrder[] = Array.isArray(parsed.repairs)
          ? parsed.repairs.map((r: RepairOrder) => ({
              ...r,
              vatRate: typeof r.vatRate === 'number' ? r.vatRate : 0.19,
              advancePaymentMethod: r.advancePaymentMethod || 'EFECTIVO',
              payments: Array.isArray(r.payments)
                ? r.payments
                : r.advancePaymentCOP > 0
                  ? [
                      {
                        id: `RPAY-MIG-${r.id}`,
                        date: r.createdAt,
                        amountCOP: r.advancePaymentCOP,
                        method: 'EFECTIVO' as const,
                        receiptNumber: `REC-${r.orderNumber}-1`,
                        cashierName: 'Migración',
                      },
                    ]
                  : [],
            }))
          : INITIAL_REPAIRS;

        const returnedProductIds = new Set<string>();
        saleReturns.forEach((ret) => {
          ret.items.forEach((item) => returnedProductIds.add(item.productId));
        });
        const soldProductIds = new Set<string>();
        sales
          .filter((sale) => sale.status !== 'ANULADA')
          .forEach((sale) => {
            sale.items.forEach((item) => soldProductIds.add(item.productId));
          });

        products.forEach((product) => {
          if (
            product.status === 'DISPONIBLE' &&
            soldProductIds.has(product.id) &&
            !returnedProductIds.has(product.id) &&
            !product.isConsignment
          ) {
            product.status = 'VENDIDO';
          }
          if (product.isConsignment && product.status === 'DISPONIBLE') {
            product.status = 'CONSIGNADO';
          }
        });

        if (
          sales.some((sale) => sale.id === 'SAL-001') &&
          !products.some((product) => product.id === 'PRD-001-HIST')
        ) {
          const historical = INITIAL_PRODUCTS.find((p) => p.id === 'PRD-001-HIST');
          if (historical) products.push(historical);
        }

        const baseShift = parsed.currentCashShift || INITIAL_CASH_SHIFT;
        const currentCashShift: CashShift = {
          ...baseShift,
          repairCardCOP: baseShift.repairCardCOP ?? 0,
          repairTransferCOP: baseShift.repairTransferCOP ?? 0,
          cashRefundsCOP: baseShift.cashRefundsCOP ?? 0,
        };
        const cashShiftsHistory: CashShift[] = Array.isArray(parsed.cashShiftsHistory)
          ? parsed.cashShiftsHistory.map((shift: CashShift) => ({
              ...shift,
              repairCardCOP: shift.repairCardCOP ?? 0,
              repairTransferCOP: shift.repairTransferCOP ?? 0,
              cashRefundsCOP: shift.cashRefundsCOP ?? 0,
            }))
          : [];

        const branches: Branch[] = parsed.branches || INITIAL_BRANCHES;
        const activeBranchId: string = parsed.activeBranchId || 'SED-01';
        const branchCashShifts: Record<string, CashShift> = {};
        branches.forEach((branch) => {
          const saved = parsed.branchCashShifts?.[branch.id];
          if (saved) {
            branchCashShifts[branch.id] = {
              ...saved,
              repairCardCOP: saved.repairCardCOP ?? 0,
              repairTransferCOP: saved.repairTransferCOP ?? 0,
              cashRefundsCOP: saved.cashRefundsCOP ?? 0,
            };
          } else if (branch.id === activeBranchId) {
            branchCashShifts[branch.id] = currentCashShift;
          } else {
            branchCashShifts[branch.id] = createClosedCashShift(branch.id);
          }
        });

        return {
          branches,
          users: parsed.users || INITIAL_USERS,
          metalPrices: parsed.metalPrices || INITIAL_METAL_PRICES,
          customers: parsed.customers || INITIAL_CUSTOMERS,
          suppliers: parsed.suppliers || INITIAL_SUPPLIERS,
          products,
          purchases: Array.isArray(parsed.purchases) ? parsed.purchases : INITIAL_PURCHASES,
          rawMaterials: Array.isArray(parsed.rawMaterials)
            ? parsed.rawMaterials
            : INITIAL_RAW_MATERIALS,
          sales,
          saleReturns,
          currentCashShift: branchCashShifts[activeBranchId] || currentCashShift,
          branchCashShifts,
          cashShiftsHistory,
          layaways: parsed.layaways || INITIAL_LAYAWAYS,
          repairs,
          manufacturingOrders: parsed.manufacturingOrders || INITIAL_MANUFACTURING,
          expenses: parsed.expenses || INITIAL_EXPENSES,
          accountingEntries: parsed.accountingEntries || INITIAL_ACCOUNTING,
          warranties: parsed.warranties || INITIAL_WARRANTIES,
          stockMovements: parsed.stockMovements || [],
          employees: parsed.employees || INITIAL_EMPLOYEES,
          auditLogs: parsed.auditLogs || INITIAL_AUDIT,
          dailyReconciliations: Array.isArray(parsed.dailyReconciliations)
            ? parsed.dailyReconciliations
            : [],
          activeBranchId: activeBranchId,
          activeUserId: parsed.activeUserId || 'USR-01',
          largeText: !!parsed.largeText,
        };
      }
    } catch {
      // Fallback
    }

    return {
      branches: INITIAL_BRANCHES,
      users: INITIAL_USERS,
      metalPrices: INITIAL_METAL_PRICES,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      products: INITIAL_PRODUCTS,
      purchases: INITIAL_PURCHASES,
      rawMaterials: INITIAL_RAW_MATERIALS,
      sales: INITIAL_SALES,
      saleReturns: INITIAL_SALE_RETURNS,
      currentCashShift: INITIAL_CASH_SHIFT,
      branchCashShifts: {
        'SED-01': INITIAL_CASH_SHIFT,
        'SED-02': createClosedCashShift('SED-02'),
        'SED-03': createClosedCashShift('SED-03'),
      },
      cashShiftsHistory: [],
      layaways: INITIAL_LAYAWAYS,
      repairs: INITIAL_REPAIRS,
      manufacturingOrders: INITIAL_MANUFACTURING,
      expenses: INITIAL_EXPENSES,
      accountingEntries: INITIAL_ACCOUNTING,
      warranties: INITIAL_WARRANTIES,
      stockMovements: [],
      employees: INITIAL_EMPLOYEES,
      auditLogs: INITIAL_AUDIT,
      dailyReconciliations: [],
      activeBranchId: 'SED-01',
      activeUserId: 'USR-01',
      largeText: false,
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.saveDailySnapshot();
    } catch {
      // Ignore if quota exceeded
    }
    this.notify();
  }

  private listAutoBackupKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTO_BACKUP_PREFIX)) keys.push(key);
    }
    return keys.sort();
  }

  private saveDailySnapshot() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `${AUTO_BACKUP_PREFIX}${today}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, JSON.stringify(this.state));
      const backupKeys = this.listAutoBackupKeys();
      while (backupKeys.length > AUTO_BACKUP_LIMIT) {
        const oldest = backupKeys.shift();
        if (oldest) localStorage.removeItem(oldest);
      }
    } catch {
      // Sin espacio: el respaldo manual sigue disponible.
    }
  }

  public getAutoBackups(): { date: string; key: string; sizeKb: number }[] {
    return this.listAutoBackupKeys()
      .map((key) => {
        const raw = localStorage.getItem(key) || '';
        return {
          date: key.replace(AUTO_BACKUP_PREFIX, ''),
          key,
          sizeKb: Math.round(raw.length / 1024),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  public restoreAutoBackup(date: string) {
    const key = `${AUTO_BACKUP_PREFIX}${date}`;
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('No existe un respaldo automático para esa fecha.');
    this.importBackupJSON(raw);
  }

  public getState(): DatabaseState {
    const activeShift =
      this.state.branchCashShifts?.[this.state.activeBranchId];
    if (activeShift) {
      this.state.currentCashShift = activeShift;
    }
    return this.state;
  }

  public toggleLargeText(): boolean {
    this.state.largeText = !this.state.largeText;
    this.addAudit(
      'PREFERENCIA_ACCESIBILIDAD',
      'Configuración',
      this.state.largeText
        ? 'Modo letra grande activado'
        : 'Modo letra grande desactivado'
    );
    this.saveState();
    return this.state.largeText;
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getActiveBranch(): Branch {
    return (
      this.state.branches.find((b) => b.id === this.state.activeBranchId) ||
      this.state.branches[0]
    );
  }

  public getActiveUser(): User {
    return (
      this.state.users.find((u) => u.id === this.state.activeUserId) ||
      this.state.users[0]
    );
  }

  private getPaymentAccount(method: PaymentRecord['method']): { code: string; name: string } {
    if (method === 'EFECTIVO') {
      return { code: '110505', name: 'Caja General Sede' };
    }
    if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') {
      return { code: '111005', name: 'Bancos Cta Cte Tarjetas Datafono' };
    }
    return { code: '111001', name: 'Bancos Transferencias' };
  }

  public setActiveBranch(branchId: string) {
    const target = this.state.branches.find((b) => b.id === branchId);
    if (!target) throw new Error('Sucursal no encontrada');
    if (!this.state.branchCashShifts) this.state.branchCashShifts = {};
    this.state.activeBranchId = branchId;
    this.state.currentCashShift =
      this.state.branchCashShifts[branchId] || createClosedCashShift(branchId);
    this.state.branchCashShifts[branchId] = this.state.currentCashShift;
    this.addAudit('CAMBIO_SUCURSAL', 'Sesión', `Cambio de sucursal activa a ${branchId}`);
    this.saveState();
  }

  public setActiveUser(userId: string) {
    this.state.activeUserId = userId;
    this.addAudit('CAMBIO_USUARIO', 'Sesión', `Cambio de usuario activo a ${userId}`);
    this.saveState();
  }

  // MASTER DATA (ALTAS PERSISTIDAS)
  public createCustomer(data: Omit<Customer, 'id' | 'totalPurchasesCOP' | 'createdAt'>): Customer {
    const customer: Customer = {
      ...data,
      id: `CLI-${Date.now()}`,
      totalPurchasesCOP: 0,
      createdAt: new Date().toISOString(),
    };
    this.state.customers.unshift(customer);
    this.addAudit(
      'CREAR_CLIENTE',
      'Clientes',
      `Registrado cliente ${customer.name} (${customer.docType} ${customer.docNumber})`
    );
    this.saveState();
    return customer;
  }

  public createEmployee(
    data: Omit<Employee, 'id' | 'salesCurrentMonthCOP' | 'commissionEarnedCOP' | 'active'>
  ): Employee {
    const employee: Employee = {
      ...data,
      id: `EMP-${Date.now()}`,
      salesCurrentMonthCOP: 0,
      commissionEarnedCOP: 0,
      active: true,
    };
    this.state.employees.unshift(employee);
    this.addAudit('CREAR_EMPLEADO', 'Personal', `Registrado empleado ${employee.name}`);
    this.saveState();
    return employee;
  }

  public createSupplier(data: Omit<Supplier, 'id'>): Supplier {
    const supplier: Supplier = {
      ...data,
      id: `PRV-${Date.now()}`,
    };
    this.state.suppliers.unshift(supplier);
    this.addAudit(
      'CREAR_PROVEEDOR',
      'Proveedores',
      `Registrado proveedor ${supplier.companyName} (NIT ${supplier.nit})`
    );
    this.saveState();
    return supplier;
  }

  public createBranch(data: Omit<Branch, 'id' | 'isMain'>): Branch {
    const branch: Branch = {
      ...data,
      id: `SED-${Date.now()}`,
      isMain: false,
    };
    this.state.branches.push(branch);
    this.addAudit('CREAR_SUCURSAL', 'Sucursales', `Creada sucursal ${branch.name}`);
    this.saveState();
    return branch;
  }

  // AUDIT LOG
  public addAudit(action: string, module: string, details: string) {
    const user = this.getActiveUser();
    const entry: AuditLogItem = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      module,
      details,
    };
    this.state.auditLogs.unshift(entry);
    // Keep last 500 audit logs
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
  }

  // PRODUCT ACTIONS
  public createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'netMetalWeightGrams' | 'fineMetalContentGrams'>): Product {
    const netMetal = calculateNetMetalWeight(
      data.grossWeightGrams,
      data.stoneWeightCarats,
      data.otherComponentsWeightGrams
    );
    const fineMetal = calculateFineMetalWeight(netMetal, data.fineness);

    const newProduct: Product = {
      ...data,
      id: `PRD-${Date.now().toString().slice(-6)}`,
      imageUrl: data.imageUrl || getDefaultJewelryImage(data.category, data.name),
      netMetalWeightGrams: netMetal,
      fineMetalContentGrams: fineMetal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.products.unshift(newProduct);

    // Stock Movement
    const user = this.getActiveUser();
    this.state.stockMovements.unshift({
      id: `MOV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: newProduct.id,
      productSku: newProduct.sku,
      productName: newProduct.name,
      type: 'ENTRADA',
      quantity: 1,
      toBranchId: newProduct.branchId,
      reason: 'Ingreso inicial a inventario de joyería',
      userId: user.id,
      userName: user.name,
    });

    this.addAudit(
      'CREAR_PRODUCTO',
      'Inventario',
      `Creado producto ${newProduct.sku} (${newProduct.name}), peso neto: ${netMetal}g, oro fino: ${fineMetal}g`
    );

    this.saveState();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>): Product {
    const idx = this.state.products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error('Producto no encontrado');

    const current = this.state.products[idx];
    const gross = updates.grossWeightGrams ?? current.grossWeightGrams;
    const stoneCt = updates.stoneWeightCarats ?? current.stoneWeightCarats;
    const otherComp = updates.otherComponentsWeightGrams ?? current.otherComponentsWeightGrams;
    const fineness = updates.fineness ?? current.fineness;

    const netMetal = calculateNetMetalWeight(gross, stoneCt, otherComp);
    const fineMetal = calculateFineMetalWeight(netMetal, fineness);

    const updated: Product = {
      ...current,
      ...updates,
      netMetalWeightGrams: netMetal,
      fineMetalContentGrams: fineMetal,
      updatedAt: new Date().toISOString(),
    };

    this.state.products[idx] = updated;

    this.addAudit(
      'EDITAR_PRODUCTO',
      'Inventario',
      `Actualizada información de ${updated.sku}`
    );

    this.saveState();
    return updated;
  }

  public adjustProductStock(productId: string, newStatus: ProductStatus, reason: string) {
    const p = this.state.products.find((item) => item.id === productId);
    if (!p) throw new Error('Producto no encontrado');

    const oldStatus = p.status;
    p.status = newStatus;
    p.updatedAt = new Date().toISOString();

    const user = this.getActiveUser();
    this.state.stockMovements.unshift({
      id: `MOV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: p.id,
      productSku: p.sku,
      productName: p.name,
      type: 'AJUSTE',
      quantity: 1,
      reason: `${reason} (Estado previo: ${oldStatus} -> Nuevo: ${newStatus})`,
      userId: user.id,
      userName: user.name,
    });

    this.addAudit(
      'AJUSTE_INVENTARIO',
      'Inventario',
      `Ajuste sobre ${p.sku}: ${reason}. Estado: ${newStatus}`
    );

    this.saveState();
  }

  public transferProduct(productId: string, targetBranchId: string, reason: string) {
    const p = this.state.products.find((item) => item.id === productId);
    if (!p) throw new Error('Producto no encontrado');

    const originBranch = p.branchId;
    p.branchId = targetBranchId;
    p.updatedAt = new Date().toISOString();

    const user = this.getActiveUser();
    this.state.stockMovements.unshift({
      id: `MOV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: p.id,
      productSku: p.sku,
      productName: p.name,
      type: 'TRASLADO',
      quantity: 1,
      fromBranchId: originBranch,
      toBranchId: targetBranchId,
      reason,
      userId: user.id,
      userName: user.name,
    });

    this.addAudit(
      'TRASLADO_INVENTARIO',
      'Inventario',
      `Traslado de ${p.sku} desde sucursal ${originBranch} hacia ${targetBranchId}. Motivo: ${reason}`
    );

    this.saveState();
  }

  // POS & SALES TRANSACTION (ACID UNIT OF WORK)
  public executeSale(saleInput: {
    customerId: string;
    productIds: string[];
    discounts: Record<string, number>;
    payments: { method: PaymentRecord['method']; amountCOP: number; referenceNumber?: string }[];
    notes?: string;
  }): Sale {
    // 1. Validate Products Availability
    const productsToSell: Product[] = [];
    for (const pid of saleInput.productIds) {
      const p = this.state.products.find((item) => item.id === pid);
      if (!p) throw new Error(`Producto ${pid} no encontrado en base de datos`);
      if (p.status !== 'DISPONIBLE') {
        throw new Error(`El producto ${p.sku} (${p.name}) no está disponible para venta. Estado actual: ${p.status}`);
      }
      productsToSell.push(p);
    }

    const customer = this.state.customers.find((c) => c.id === saleInput.customerId);
    if (!customer) throw new Error('Cliente no registrado en el sistema');

    const user = this.getActiveUser();
    const branch = this.getActiveBranch();

    // 2. Calculate totals & build items
    let subtotalCOP = 0;
    let discountTotalCOP = 0;
    let vatTotalCOP = 0;
    const saleItems = productsToSell.map((prod) => {
      const disc = saleInput.discounts[prod.id] || 0;
      const finalPrice = Math.max(0, prod.salePriceCOP - disc);
      
      // Price floor validation: cannot sell below authorized minimum price
      if (finalPrice < prod.minAllowedPriceCOP) {
        throw new Error(`El precio final para ${prod.sku} ($${finalPrice}) está por debajo del precio mínimo autorizado ($${prod.minAllowedPriceCOP})`);
      }

      const itemBase = prod.vatRate > 0 ? finalPrice / (1 + prod.vatRate) : finalPrice;
      const itemVat = finalPrice - itemBase;

      subtotalCOP += itemBase;
      discountTotalCOP += disc;
      vatTotalCOP += itemVat;

      return {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        metalType: prod.metalType,
        metalColor: prod.metalColor,
        netMetalWeightGrams: prod.netMetalWeightGrams,
        fineMetalContentGrams: prod.fineMetalContentGrams,
        unitPriceCOP: prod.salePriceCOP,
        discountCOP: disc,
        finalPriceCOP: finalPrice,
        quantity: 1,
        imageUrl: prod.imageUrl,
      };
    });

    const totalCOP = Math.round(subtotalCOP + vatTotalCOP);

    // 3. Validate payment sums
    const totalPaid = saleInput.payments.reduce((acc, curr) => acc + curr.amountCOP, 0);
    if (Math.abs(totalPaid - totalCOP) > 10) {
      throw new Error(`El total pagado ($${totalPaid}) no coincide con el total de la venta ($${totalCOP})`);
    }

    // 4. Generate Consecutive numbers
    const invoiceNum = `FAC-2026-${String(this.state.sales.length + 105).padStart(4, '0')}`;
    const entryVoucher = `CC-2026-${String(this.state.accountingEntries.length + 42).padStart(4, '0')}`;
    const warrantyCode = `GAR-2026-${String(this.state.warranties.length + 105).padStart(4, '0')}`;

    // 5. Update Product Status to VENDIDO and record stock movements
    for (const prod of productsToSell) {
      prod.status = 'VENDIDO';
      prod.updatedAt = new Date().toISOString();

      this.state.stockMovements.unshift({
        id: `MOV-${Date.now()}-${prod.id}`,
        timestamp: new Date().toISOString(),
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        type: 'VENTA',
        quantity: 1,
        fromBranchId: prod.branchId,
        reason: `Venta según Factura ${invoiceNum} a ${customer.name}`,
        userId: user.id,
        userName: user.name,
      });
    }

    // 6. Update Cash Shift
    if (this.state.currentCashShift && this.state.currentCashShift.status === 'ABIERTA') {
      saleInput.payments.forEach((pay) => {
        if (pay.method === 'EFECTIVO') {
          this.state.currentCashShift.cashSalesCOP += pay.amountCOP;
          this.state.currentCashShift.expectedCashCOP += pay.amountCOP;
        } else if (pay.method === 'TARJETA_DEBITO' || pay.method === 'TARJETA_CREDITO') {
          this.state.currentCashShift.cardSalesCOP += pay.amountCOP;
        } else {
          this.state.currentCashShift.transferSalesCOP += pay.amountCOP;
        }
      });
    }

    // 7. Update Customer Total
    customer.totalPurchasesCOP += totalCOP;

    // 8. Generate Balanced Double-Entry Accounting Entry
    const totalCostOfGoods = productsToSell.reduce((acc, p) => acc + p.totalCostCOP, 0);
    const journalRows = [];

    // Debit payment accounts
    saleInput.payments.forEach((pay) => {
      if (pay.method === 'EFECTIVO') {
        journalRows.push({
          accountCode: '110505',
          accountName: 'Caja General Sede',
          debitCOP: pay.amountCOP,
          creditCOP: 0,
        });
      } else if (pay.method === 'TARJETA_DEBITO' || pay.method === 'TARJETA_CREDITO') {
        journalRows.push({
          accountCode: '111005',
          accountName: 'Bancos Cta Cte Tarjetas Datafono',
          debitCOP: pay.amountCOP,
          creditCOP: 0,
        });
      } else {
        journalRows.push({
          accountCode: '111001',
          accountName: 'Bancolombia Transferencias',
          debitCOP: pay.amountCOP,
          creditCOP: 0,
        });
      }
    });

    // Credit Revenue & VAT
    journalRows.push({
      accountCode: '413535',
      accountName: 'Comercio al por mayor y menor - Joyería Fina',
      debitCOP: 0,
      creditCOP: Math.round(subtotalCOP),
    });

    if (vatTotalCOP > 0) {
      journalRows.push({
        accountCode: '240805',
        accountName: 'Impuesto sobre las Ventas por Pagar (IVA)',
        debitCOP: 0,
        creditCOP: Math.round(vatTotalCOP),
      });
    }

    // Cost of sales & inventory relief
    journalRows.push({
      accountCode: '613535',
      accountName: 'Costo de Ventas Joyería y Metales Preciosos',
      debitCOP: totalCostOfGoods,
      creditCOP: 0,
    });
    journalRows.push({
      accountCode: '143505',
      accountName: 'Inventario de Mercancías Joyería',
      debitCOP: 0,
      creditCOP: totalCostOfGoods,
    });

    const sumDebits = journalRows.reduce((acc, r) => acc + r.debitCOP, 0);
    const sumCredits = journalRows.reduce((acc, r) => acc + r.creditCOP, 0);

    const accountingEntry: AccountingEntry = {
      id: `ACC-${Date.now()}`,
      voucherNumber: entryVoucher,
      date: new Date().toISOString().split('T')[0],
      concept: `Venta Factura ${invoiceNum} - Cliente: ${customer.name}`,
      sourceModule: 'VENTAS',
      rows: journalRows,
      totalDebitCOP: sumDebits,
      totalCreditCOP: sumCredits,
      isBalanced: sumDebits === sumCredits,
      createdBy: user.name,
    };
    this.state.accountingEntries.unshift(accountingEntry);

    // 9. Generate Warranty for primary piece
    const primaryPiece = productsToSell[0];
    const warranty: WarrantyRecord = {
      id: `WAR-${Date.now()}`,
      warrantyCode,
      invoiceNumber: invoiceNum,
      customerName: customer.name,
      customerDoc: `${customer.docType} ${customer.docNumber}`,
      productSku: primaryPiece.sku,
      productName: primaryPiece.name,
      validityMonths: 36,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 36 * 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      coverageSummary: `Garantía legal y comercial de ley sobre autenticidad de metal ${primaryPiece.metalType} y gemas de por vida. Limpieza y revisión semestral en taller oficial.`,
      status: 'VIGENTE',
    };
    this.state.warranties.unshift(warranty);

    // 10. Record Sale
    const newSale: Sale = {
      id: `SAL-${Date.now()}`,
      invoiceNumber: invoiceNum,
      branchId: branch.id,
      customerId: customer.id,
      customerName: customer.name,
      customerDoc: `${customer.docType} ${customer.docNumber}`,
      sellerId: user.id,
      sellerName: user.name,
      items: saleItems,
      subtotalCOP: Math.round(subtotalCOP),
      discountTotalCOP,
      vatCOP: Math.round(vatTotalCOP),
      totalCOP,
      payments: saleInput.payments.map((p, idx) => ({ ...p, id: `PAY-${Date.now()}-${idx}` })),
      status: 'PAGADA',
      accountingEntryId: entryVoucher,
      warrantyCode,
      notes: saleInput.notes,
      createdAt: new Date().toISOString(),
    };

    this.state.sales.unshift(newSale);

    this.addAudit(
      'VENTA_POS_CONFIRMADA',
      'Ventas',
      `Factura ${invoiceNum} confirmada por valor de $${totalCOP.toLocaleString('es-CO')} COP (${productsToSell.length} ítems)`
    );

    this.saveState();
    return newSale;
  }

  // SALE RETURNS / CREDIT NOTES / VOID
  public registerSaleReturn(input: {
    saleId: string;
    productIds: string[];
    reason: string;
    refundMethod: PaymentRecord['method'];
    stockCondition?: ProductStatus;
    markAnulada?: boolean;
    notes?: string;
  }): SaleReturn {
    const sale = this.state.sales.find((s) => s.id === input.saleId);
    if (!sale) throw new Error('Venta no encontrada');
    if (sale.status === 'ANULADA') throw new Error('La venta ya está anulada');
    if (sale.status === 'DEVUELTA_TOTAL') throw new Error('La venta ya fue devuelta en su totalidad');

    const requestedIds = Array.from(new Set(input.productIds));
    if (requestedIds.length === 0) throw new Error('Debe seleccionar al menos una joya para devolver');

    const priorReturns = this.state.saleReturns.filter((ret) => ret.saleId === sale.id);
    const alreadyReturned = new Set(
      priorReturns.flatMap((ret) => ret.items.map((item) => item.productId))
    );

    const saleItemMap = new Map(sale.items.map((item) => [item.productId, item]));
    const implicitVatRate =
      sale.subtotalCOP > 0 ? sale.vatCOP / sale.subtotalCOP : 0;

    const items: SaleReturnItem[] = requestedIds.map((productId) => {
      if (alreadyReturned.has(productId)) {
        throw new Error(`La joya ${productId} ya fue devuelta en una nota crédito anterior`);
      }
      const saleItem = saleItemMap.get(productId);
      if (!saleItem) {
        throw new Error(`La joya ${productId} no pertenece a la factura ${sale.invoiceNumber}`);
      }

      const product = this.state.products.find((p) => p.id === productId);
      const vatRate = product ? product.vatRate || 0 : implicitVatRate;
      const refundBaseCOP =
        vatRate > 0
          ? Math.round(saleItem.finalPriceCOP / (1 + vatRate))
          : saleItem.finalPriceCOP;
      const refundVatCOP = saleItem.finalPriceCOP - refundBaseCOP;

      return {
        productId: saleItem.productId,
        sku: saleItem.sku,
        name: saleItem.name,
        quantity: saleItem.quantity,
        refundBaseCOP,
        refundVatCOP,
        refundTotalCOP: saleItem.finalPriceCOP,
        costCOP: product ? product.totalCostCOP : 0,
      };
    });

    const subtotalCOP = items.reduce((acc, item) => acc + item.refundBaseCOP, 0);
    const vatCOP = items.reduce((acc, item) => acc + item.refundVatCOP, 0);
    const totalCOP = items.reduce((acc, item) => acc + item.refundTotalCOP, 0);
    const costCOP = items.reduce((acc, item) => acc + item.costCOP, 0);

    const shift = this.state.currentCashShift;
    if (input.refundMethod === 'EFECTIVO' && (!shift || shift.status !== 'ABIERTA')) {
      throw new Error('Debe abrir un turno de caja para registrar un reembolso en efectivo');
    }

    const user = this.getActiveUser();
    const now = new Date().toISOString();
    const creditNoteNumber = `NC-2026-${String(this.state.saleReturns.length + 1).padStart(4, '0')}`;
    const entryVoucher = `CC-2026-${String(this.state.accountingEntries.length + 42).padStart(4, '0')}`;
    const paymentAccount = this.getPaymentAccount(input.refundMethod);

    const journalRows = [
      {
        accountCode: '417505',
        accountName: 'Devoluciones en Ventas Joyería',
        debitCOP: subtotalCOP,
        creditCOP: 0,
      },
      ...(vatCOP > 0
        ? [
            {
              accountCode: '240805',
              accountName: 'Impuesto sobre las Ventas por Pagar (IVA)',
              debitCOP: vatCOP,
              creditCOP: 0,
            },
          ]
        : []),
      {
        accountCode: '143505',
        accountName: 'Inventario de Mercancías Joyería',
        debitCOP: costCOP,
        creditCOP: 0,
      },
      {
        accountCode: paymentAccount.code,
        accountName: paymentAccount.name,
        debitCOP: 0,
        creditCOP: totalCOP,
      },
      {
        accountCode: '613535',
        accountName: 'Costo de Ventas Joyería y Metales Preciosos',
        debitCOP: 0,
        creditCOP: costCOP,
      },
    ];

    const sumDebits = journalRows.reduce((acc, row) => acc + row.debitCOP, 0);
    const sumCredits = journalRows.reduce((acc, row) => acc + row.creditCOP, 0);

    this.state.accountingEntries.unshift({
      id: `ACC-${Date.now()}`,
      voucherNumber: entryVoucher,
      date: now.split('T')[0],
      concept: `Nota Crédito ${creditNoteNumber} - Factura ${sale.invoiceNumber} - ${sale.customerName}`,
      sourceModule: 'DEVOLUCION',
      rows: journalRows,
      totalDebitCOP: sumDebits,
      totalCreditCOP: sumCredits,
      isBalanced: sumDebits === sumCredits,
      createdBy: user.name,
    });

    for (const item of items) {
      const product = this.state.products.find((p) => p.id === item.productId);
      if (product) {
        product.status = input.stockCondition || 'DISPONIBLE';
        product.updatedAt = now;
      }

      this.state.stockMovements.unshift({
        id: `MOV-${Date.now()}-${item.productId}`,
        timestamp: now,
        productId: item.productId,
        productSku: item.sku,
        productName: item.name,
        type: 'DEVOLUCION',
        quantity: item.quantity,
        toBranchId: sale.branchId,
        reason: `Devolución Nota Crédito ${creditNoteNumber} - Factura ${sale.invoiceNumber}`,
        userId: user.id,
        userName: user.name,
      });
    }

    this.state.warranties.forEach((warranty) => {
      if (
        warranty.invoiceNumber === sale.invoiceNumber &&
        items.some((item) => item.sku === warranty.productSku)
      ) {
        warranty.status = 'ANULADA';
      }
    });

    if (input.refundMethod === 'EFECTIVO' && shift) {
      shift.cashRefundsCOP += totalCOP;
      shift.expectedCashCOP -= totalCOP;
    }

    sale.returnedTotalCOP = (sale.returnedTotalCOP || 0) + totalCOP;
    sale.returnedVatCOP = (sale.returnedVatCOP || 0) + vatCOP;

    const allReturnedIds = new Set([
      ...alreadyReturned,
      ...requestedIds,
    ]);
    if (input.markAnulada) {
      sale.status = 'ANULADA';
    } else {
      sale.status =
        allReturnedIds.size >= sale.items.length
          ? 'DEVUELTA_TOTAL'
          : 'DEVUELTA_PARCIAL';
    }

    const customer = this.state.customers.find((c) => c.id === sale.customerId);
    if (customer) {
      customer.totalPurchasesCOP = Math.max(0, customer.totalPurchasesCOP - totalCOP);
    }

    const saleReturn: SaleReturn = {
      id: `RET-${Date.now()}`,
      creditNoteNumber,
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      branchId: sale.branchId,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerDoc: sale.customerDoc,
      items,
      subtotalCOP,
      vatCOP,
      totalCOP,
      costCOP,
      reason: input.reason,
      refundMethod: input.refundMethod,
      accountingEntryId: entryVoucher,
      createdBy: user.name,
      createdAt: now,
    };
    this.state.saleReturns.unshift(saleReturn);

    this.addAudit(
      'DEVOLUCION_VENTA',
      'Ventas',
      `Nota Crédito ${creditNoteNumber} sobre Factura ${sale.invoiceNumber}: ${items.length} joya(s), reembolso $${totalCOP.toLocaleString('es-CO')} (${input.refundMethod}).`
    );

    this.saveState();
    return saleReturn;
  }

  public voidSale(
    saleId: string,
    reason: string,
    refundMethod: PaymentRecord['method']
  ): SaleReturn {
    const sale = this.state.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Venta no encontrada');
    if (sale.status === 'ANULADA') throw new Error('La venta ya está anulada');
    if (sale.status === 'DEVUELTA_TOTAL') throw new Error('La venta ya fue devuelta en su totalidad');

    const priorReturns = this.state.saleReturns.filter((ret) => ret.saleId === sale.id);
    const alreadyReturned = new Set(
      priorReturns.flatMap((ret) => ret.items.map((item) => item.productId))
    );
    const remainingProductIds = sale.items
      .filter((item) => !alreadyReturned.has(item.productId))
      .map((item) => item.productId);

    if (remainingProductIds.length === 0) {
      throw new Error('La venta ya fue devuelta en su totalidad');
    }

    return this.registerSaleReturn({
      saleId,
      productIds: remainingProductIds,
      reason,
      refundMethod,
      markAnulada: true,
    });
  }

  // LAYAWAYS (APARTADOS)
  public createLayaway(input: {
    customerId: string;
    productId: string;
    initialDepositCOP: number;
    paymentMethod: PaymentRecord['method'];
    dueDate: string;
  }): Layaway {
    const product = this.state.products.find((p) => p.id === input.productId);
    if (!product) throw new Error('Producto no encontrado');
    if (product.status !== 'DISPONIBLE') {
      throw new Error(`El producto no está disponible. Estado actual: ${product.status}`);
    }

    const customer = this.state.customers.find((c) => c.id === input.customerId);
    if (!customer) throw new Error('Cliente no registrado');

    const branch = this.getActiveBranch();
    const user = this.getActiveUser();

    // Mark product as RESERVADO
    product.status = 'RESERVADO';
    product.updatedAt = new Date().toISOString();

    const code = `SEP-2026-${String(this.state.layaways.length + 13).padStart(4, '0')}`;
    const balance = product.salePriceCOP - input.initialDepositCOP;

    const installment: Layaway['installments'][0] = {
      id: `INST-${Date.now()}`,
      date: new Date().toISOString(),
      amountCOP: input.initialDepositCOP,
      method: input.paymentMethod,
      receiptNumber: `REC-${code}-1`,
      cashierName: user.name,
    };

    const newLayaway: Layaway = {
      id: `LAY-${Date.now()}`,
      code,
      branchId: branch.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerDoc: `${customer.docType} ${customer.docNumber}`,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      totalAmountCOP: product.salePriceCOP,
      initialDepositCOP: input.initialDepositCOP,
      balanceCOP: balance,
      dueDate: input.dueDate,
      installments: [installment],
      status: balance <= 0 ? 'PAGADO' : 'ACTIVO',
      sellerName: user.name,
      createdAt: new Date().toISOString(),
    };

    this.state.layaways.unshift(newLayaway);

    // Update cash register
    if (this.state.currentCashShift && this.state.currentCashShift.status === 'ABIERTA') {
      if (input.paymentMethod === 'EFECTIVO') {
        this.state.currentCashShift.layawayCashCOP += input.initialDepositCOP;
        this.state.currentCashShift.expectedCashCOP += input.initialDepositCOP;
      }
    }

    this.addAudit(
      'CREAR_APARTADO',
      'Apartados',
      `Apartado ${code} para ${customer.name} de joya ${product.sku}. Abono inicial: $${input.initialDepositCOP.toLocaleString('es-CO')}`
    );

    this.saveState();
    return newLayaway;
  }

  public addLayawayPayment(layawayId: string, amountCOP: number, method: PaymentRecord['method']): Layaway {
    const layaway = this.state.layaways.find((l) => l.id === layawayId);
    if (!layaway) throw new Error('Apartado no encontrado');
    if (layaway.status === 'ENTREGADO' || layaway.status === 'CANCELADO') {
      throw new Error(`El apartado ya está en estado ${layaway.status}`);
    }

    const user = this.getActiveUser();
    const newBalance = Math.max(0, layaway.balanceCOP - amountCOP);
    const receiptNum = `REC-${layaway.code}-${layaway.installments.length + 1}`;

    layaway.installments.push({
      id: `INST-${Date.now()}`,
      date: new Date().toISOString(),
      amountCOP,
      method,
      receiptNumber: receiptNum,
      cashierName: user.name,
    });

    layaway.balanceCOP = newBalance;
    if (newBalance === 0) {
      layaway.status = 'PAGADO';
    } else {
      layaway.status = 'PARCIAL';
    }

    // Cash Shift
    if (this.state.currentCashShift && this.state.currentCashShift.status === 'ABIERTA' && method === 'EFECTIVO') {
      this.state.currentCashShift.layawayCashCOP += amountCOP;
      this.state.currentCashShift.expectedCashCOP += amountCOP;
    }

    this.addAudit(
      'ABONO_APARTADO',
      'Apartados',
      `Abono de $${amountCOP.toLocaleString('es-CO')} recibido en apartado ${layaway.code}. Saldo restate: $${newBalance.toLocaleString('es-CO')}`
    );

    this.saveState();
    return layaway;
  }

  public deliverLayaway(layawayId: string): Sale {
    const layaway = this.state.layaways.find((l) => l.id === layawayId);
    if (!layaway) throw new Error('Apartado no encontrado');
    if (layaway.status === 'ENTREGADO') {
      throw new Error('El apartado ya fue entregado');
    }
    if (layaway.balanceCOP > 0) {
      throw new Error(`No se puede entregar la joya: queda un saldo pendiente de $${layaway.balanceCOP.toLocaleString('es-CO')}`);
    }

    const product = this.state.products.find((p) => p.id === layaway.productId);
    if (!product) throw new Error('La joya del apartado no existe en inventario');
    if (product.status === 'VENDIDO') throw new Error('La joya ya figura como vendida');

    const customer = this.state.customers.find((c) => c.id === layaway.customerId);
    const user = this.getActiveUser();
    const now = new Date().toISOString();
    const totalCOP = layaway.totalAmountCOP;
    const vatRate = product.vatRate || 0;
    const subtotalCOP = Math.round(totalCOP / (1 + vatRate));
    const vatCOP = totalCOP - subtotalCOP;

    const invoiceNum = `FAC-2026-${String(this.state.sales.length + 105).padStart(4, '0')}`;
    const entryVoucher = `CC-2026-${String(this.state.accountingEntries.length + 42).padStart(4, '0')}`;
    const warrantyCode = `GAR-2026-${String(this.state.warranties.length + 105).padStart(4, '0')}`;

    const saleItems: Sale['items'] = [
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        metalType: product.metalType,
        metalColor: product.metalColor,
        netMetalWeightGrams: product.netMetalWeightGrams,
        fineMetalContentGrams: product.fineMetalContentGrams,
        unitPriceCOP: product.salePriceCOP,
        discountCOP: 0,
        finalPriceCOP: product.salePriceCOP,
        quantity: 1,
        imageUrl: product.imageUrl,
      },
    ];

    const payments: PaymentRecord[] = layaway.installments.map((installment, index) => ({
      id: `PAY-LAY-${layaway.id}-${index + 1}`,
      method: installment.method,
      amountCOP: installment.amountCOP,
      referenceNumber: installment.receiptNumber,
    }));
    const paid = payments.reduce((acc, payment) => acc + payment.amountCOP, 0);
    if (payments.length > 0 && paid !== totalCOP) {
      payments[payments.length - 1].amountCOP += totalCOP - paid;
    }

    const journalRows = payments.map((payment) => {
      const account = this.getPaymentAccount(payment.method);
      return {
        accountCode: account.code,
        accountName: account.name,
        debitCOP: payment.amountCOP,
        creditCOP: 0,
      };
    });
    journalRows.push({
      accountCode: '413535',
      accountName: 'Comercio al por mayor y menor - Joyería Fina',
      debitCOP: 0,
      creditCOP: subtotalCOP,
    });
    if (vatCOP > 0) {
      journalRows.push({
        accountCode: '240805',
        accountName: 'Impuesto sobre las Ventas por Pagar (IVA)',
        debitCOP: 0,
        creditCOP: vatCOP,
      });
    }
    journalRows.push({
      accountCode: '613535',
      accountName: 'Costo de Ventas Joyería y Metales Preciosos',
      debitCOP: product.totalCostCOP,
      creditCOP: 0,
    });
    journalRows.push({
      accountCode: '143505',
      accountName: 'Inventario de Mercancías Joyería',
      debitCOP: 0,
      creditCOP: product.totalCostCOP,
    });

    const sumDebits = journalRows.reduce((acc, row) => acc + row.debitCOP, 0);
    const sumCredits = journalRows.reduce((acc, row) => acc + row.creditCOP, 0);

    this.state.accountingEntries.unshift({
      id: `ACC-${Date.now()}`,
      voucherNumber: entryVoucher,
      date: now.split('T')[0],
      concept: `Venta Factura ${invoiceNum} - Entrega apartado ${layaway.code} - ${layaway.customerName}`,
      sourceModule: 'VENTAS',
      rows: journalRows,
      totalDebitCOP: sumDebits,
      totalCreditCOP: sumCredits,
      isBalanced: sumDebits === sumCredits,
      createdBy: user.name,
    });

    this.state.stockMovements.unshift({
      id: `MOV-${Date.now()}-${product.id}`,
      timestamp: now,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      type: 'VENTA',
      quantity: 1,
      fromBranchId: product.branchId,
      reason: `Venta por entrega de apartado ${layaway.code} - Factura ${invoiceNum}`,
      userId: user.id,
      userName: user.name,
    });

    this.state.warranties.unshift({
      id: `WAR-${Date.now()}`,
      warrantyCode,
      invoiceNumber: invoiceNum,
      customerName: layaway.customerName,
      customerDoc: layaway.customerDoc,
      productSku: product.sku,
      productName: product.name,
      validityMonths: 36,
      startDate: now.split('T')[0],
      endDate: new Date(Date.now() + 36 * 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      coverageSummary: `Garantía legal y comercial sobre autenticidad de metal ${product.metalType} y gemas de por vida. Limpieza y revisión semestral en taller oficial.`,
      status: 'VIGENTE',
    });

    const newSale: Sale = {
      id: `SAL-${Date.now()}`,
      invoiceNumber: invoiceNum,
      branchId: layaway.branchId,
      customerId: layaway.customerId,
      customerName: layaway.customerName,
      customerDoc: layaway.customerDoc,
      sellerId: user.id,
      sellerName: layaway.sellerName || user.name,
      items: saleItems,
      subtotalCOP,
      discountTotalCOP: 0,
      vatCOP,
      totalCOP,
      payments,
      status: 'PAGADA',
      accountingEntryId: entryVoucher,
      warrantyCode,
      notes: `Venta generada al entregar el apartado ${layaway.code}.`,
      createdAt: now,
    };

    this.state.sales.unshift(newSale);
    if (customer) customer.totalPurchasesCOP += totalCOP;

    product.status = 'VENDIDO';
    product.updatedAt = now;

    layaway.status = 'ENTREGADO';
    layaway.saleId = newSale.id;
    layaway.invoiceNumber = invoiceNum;
    layaway.deliveredAt = now;

    this.addAudit(
      'ENTREGA_APARTADO',
      'Apartados',
      `Joya ${layaway.productSku} entregada a ${layaway.customerName}. Factura ${invoiceNum} por $${totalCOP.toLocaleString('es-CO')}.`
    );

    this.saveState();
    return newSale;
  }

  // REPAIR ORDERS (TALLER Y CUSTODIA)
  private registerRepairPaymentInternal(
    repair: RepairOrder,
    amountCOP: number,
    method: PaymentRecord['method'],
    notes?: string
  ): RepairPayment {
    if (amountCOP <= 0) throw new Error('El pago debe ser mayor a cero');
    if (amountCOP > repair.balanceCOP + 0.01) {
      throw new Error(
        `El pago excede el saldo pendiente ($${repair.balanceCOP.toLocaleString('es-CO')})`
      );
    }

    const user = this.getActiveUser();
    const payment: RepairPayment = {
      id: `RPAY-${Date.now()}-${repair.payments.length + 1}`,
      date: new Date().toISOString(),
      amountCOP,
      method,
      receiptNumber: `REC-${repair.orderNumber}-${repair.payments.length + 1}`,
      cashierName: user.name,
      notes,
    };

    repair.payments.push(payment);
    repair.balanceCOP = Math.max(
      0,
      Math.round((repair.balanceCOP - amountCOP) * 100) / 100
    );

    const shift = this.state.currentCashShift;
    if (shift && shift.status === 'ABIERTA') {
      if (method === 'EFECTIVO') {
        shift.repairCashCOP += amountCOP;
        shift.expectedCashCOP += amountCOP;
      } else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') {
        shift.repairCardCOP += amountCOP;
      } else {
        shift.repairTransferCOP += amountCOP;
      }
    }

    const vatRate = repair.vatRate || 0.19;
    const base = Math.round(amountCOP / (1 + vatRate));
    const vat = amountCOP - base;
    const debitAccount =
      method === 'EFECTIVO'
        ? { code: '110505', name: 'Caja General Sede' }
        : method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO'
          ? { code: '111005', name: 'Bancos Cta Cte Tarjetas Datafono' }
          : { code: '111001', name: 'Bancos Transferencias' };

    const rows = [
      {
        accountCode: debitAccount.code,
        accountName: debitAccount.name,
        debitCOP: amountCOP,
        creditCOP: 0,
      },
      {
        accountCode: '413540',
        accountName: 'Ingresos Servicios de Taller y Reparaciones',
        debitCOP: 0,
        creditCOP: base,
      },
      ...(vat > 0
        ? [
            {
              accountCode: '240805',
              accountName: 'Impuesto sobre las Ventas por Pagar (IVA)',
              debitCOP: 0,
              creditCOP: vat,
            },
          ]
        : []),
    ];

    this.state.accountingEntries.unshift({
      id: `ACC-REP-${Date.now()}-${repair.payments.length}`,
      voucherNumber: `CC-REP-${repair.orderNumber}-${repair.payments.length}`,
      date: new Date().toISOString().split('T')[0],
      concept: `Abono orden de taller ${repair.orderNumber} - ${repair.customerName}`,
      sourceModule: 'REPARACION',
      rows,
      totalDebitCOP: amountCOP,
      totalCreditCOP: base + vat,
      isBalanced: base + vat === amountCOP,
      createdBy: user.name,
    });

    return payment;
  }

  public createRepairOrder(data: {
    customerId: string;
    itemDescription: string;
    declaredMetal: string;
    initialWeightGrams: number;
    previousDefects: string;
    serviceType: RepairOrder['serviceType'];
    diagnosticDetails: string;
    partsCostCOP: number;
    laborCostCOP: number;
    advancePaymentCOP: number;
    advancePaymentMethod: PaymentRecord['method'];
    vatRate?: number;
    promiseDate: string;
  }): RepairOrder {
    const customer = this.state.customers.find((c) => c.id === data.customerId);
    if (!customer) throw new Error('Cliente no registrado');

    const branch = this.getActiveBranch();
    const quoted = data.partsCostCOP + data.laborCostCOP;
    const orderNumber = `REP-2026-${String(this.state.repairs.length + 80).padStart(4, '0')}`;

    const newRepair: RepairOrder = {
      id: `REP-${Date.now()}`,
      orderNumber,
      branchId: branch.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      itemDescription: data.itemDescription,
      declaredMetal: data.declaredMetal,
      initialWeightGrams: data.initialWeightGrams,
      previousDefects: data.previousDefects,
      serviceType: data.serviceType,
      diagnosticDetails: data.diagnosticDetails,
      technicianName: 'Maestro Jorge Beltrán',
      partsCostCOP: data.partsCostCOP,
      laborCostCOP: data.laborCostCOP,
      quotedPriceCOP: quoted,
      vatRate: data.vatRate ?? 0.19,
      advancePaymentCOP: data.advancePaymentCOP,
      advancePaymentMethod: data.advancePaymentMethod,
      payments: [],
      balanceCOP: quoted,
      promiseDate: data.promiseDate,
      status: 'RECIBIDO',
      createdAt: new Date().toISOString(),
    };

    this.state.repairs.unshift(newRepair);

    if (data.advancePaymentCOP > 0) {
      this.registerRepairPaymentInternal(
        newRepair,
        data.advancePaymentCOP,
        data.advancePaymentMethod,
        'Anticipo inicial'
      );
    }

    this.addAudit(
      'CREAR_ORDEN_TALLER',
      'Taller de Reparaciones',
      `Recibida pieza de cliente en custodia: ${data.itemDescription} (${data.initialWeightGrams}g). Orden ${orderNumber}`
    );

    this.saveState();
    return newRepair;
  }

  public addRepairPayment(
    orderId: string,
    amountCOP: number,
    method: PaymentRecord['method'],
    notes?: string
  ): RepairOrder {
    const repair = this.state.repairs.find((r) => r.id === orderId);
    if (!repair) throw new Error('Orden no encontrada');
    if (repair.status === 'ENTREGADO' || repair.status === 'CANCELADO') {
      throw new Error(`La orden ya está en estado ${repair.status}`);
    }

    this.registerRepairPaymentInternal(repair, amountCOP, method, notes);
    this.addAudit(
      'ABONO_TALLER',
      'Taller de Reparaciones',
      `Abono de $${amountCOP.toLocaleString('es-CO')} en orden ${repair.orderNumber}. Saldo: $${repair.balanceCOP.toLocaleString('es-CO')}`
    );
    this.saveState();
    return repair;
  }

  public updateRepairStatus(orderId: string, status: RepairOrder['status'], finalWeight?: number) {
    const repair = this.state.repairs.find((r) => r.id === orderId);
    if (!repair) throw new Error('Orden no encontrada');

    if (status === 'ENTREGADO' && repair.balanceCOP > 0.01) {
      throw new Error(
        `No se puede entregar la orden: saldo pendiente de $${repair.balanceCOP.toLocaleString('es-CO')}`
      );
    }
    if (status === 'CANCELADO' && repair.payments.length > 0) {
      throw new Error(
        'No se puede cancelar una orden con pagos registrados; primero registre la devolución del anticipo.'
      );
    }

    repair.status = status;
    if (finalWeight !== undefined) {
      repair.finalWeightGrams = finalWeight;
    }
    if (status === 'ENTREGADO') {
      repair.deliveredDate = new Date().toISOString();
    }

    this.addAudit(
      'ESTADO_ORDEN_TALLER',
      'Taller de Reparaciones',
      `Orden ${repair.orderNumber} cambió a estado ${status}`
    );

    this.saveState();
  }

  // MANUFACTURING
  public createManufacturingOrder(data: {
    designName: string;
    jewelType: Product['category'];
    artisanName: string;
    workshopName: string;
    materialsDelivered: ManufacturingOrder['materialsDelivered'];
    stonesAssigned: ManufacturingOrder['stonesAssigned'];
    expectedWeightGrams: number;
    laborCostCOP: number;
    materialCostCOP: number;
  }): ManufacturingOrder {
    const code = `FAB-2026-${String(this.state.manufacturingOrders.length + 15).padStart(4, '0')}`;
    const branch = this.getActiveBranch();

    const order: ManufacturingOrder = {
      id: `FAB-${Date.now()}`,
      code,
      branchId: branch.id,
      designName: data.designName,
      jewelType: data.jewelType,
      artisanName: data.artisanName,
      workshopName: data.workshopName,
      materialsDelivered: data.materialsDelivered,
      stonesAssigned: data.stonesAssigned,
      expectedWeightGrams: data.expectedWeightGrams,
      finishedProductWeightGrams: 0,
      scrapAllowedPercent: 0.05,
      scrapReturnedGrams: 0,
      netWeightDifferenceGrams: 0,
      laborCostCOP: data.laborCostCOP,
      materialCostCOP: data.materialCostCOP,
      totalCostCOP: data.laborCostCOP + data.materialCostCOP,
      status: 'EN_TALLER',
      createdAt: new Date().toISOString(),
    };

    this.state.manufacturingOrders.unshift(order);

    this.addAudit(
      'ORDEN_FABRICACION',
      'Fabricación',
      `Creada orden de hechura ${code} (${data.designName}) entregada a ${data.artisanName}`
    );

    this.saveState();
    return order;
  }

  public reconcileManufacturing(orderId: string, finishedWeight: number, scrapReturned: number): ManufacturingOrder {
    const order = this.state.manufacturingOrders.find((m) => m.id === orderId);
    if (!order) throw new Error('Orden no encontrada');

    const totalDelivered = order.materialsDelivered.reduce((acc, m) => acc + m.weightGrams, 0);
    const scrapAllowed = totalDelivered * order.scrapAllowedPercent;
    const diff = Number((totalDelivered - finishedWeight - scrapReturned).toFixed(3));

    order.finishedProductWeightGrams = finishedWeight;
    order.scrapReturnedGrams = scrapReturned;
    order.netWeightDifferenceGrams = diff;
    order.status = 'CONCILIADA';

    this.addAudit(
      'CONCILIACION_FABRICACION',
      'Fabricación',
      `Conciliada orden ${order.code}. Peso entregado: ${totalDelivered}g, Joya terminada: ${finishedWeight}g, Retal devuelto: ${scrapReturned}g, Merma neta: ${diff}g (Permitido: ${scrapAllowed.toFixed(2)}g)`
    );

    this.saveState();
    return order;
  }

  // EXPENSES
  public recordExpense(data: {
    category: Expense['category'];
    description: string;
    amountCOP: number;
    beneficiary: string;
    paymentMethod: PaymentRecord['method'];
  }): Expense {
    const branch = this.getActiveBranch();
    const user = this.getActiveUser();
    const voucherNumber = `EGR-2026-${String(this.state.expenses.length + 36).padStart(4, '0')}`;

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      voucherNumber,
      branchId: branch.id,
      category: data.category,
      description: data.description,
      amountCOP: data.amountCOP,
      beneficiary: data.beneficiary,
      paymentMethod: data.paymentMethod,
      registeredBy: user.name,
      date: new Date().toISOString().split('T')[0],
    };

    this.state.expenses.unshift(newExpense);

    // If paid in cash, subtract from current shift
    if (data.paymentMethod === 'EFECTIVO' && this.state.currentCashShift && this.state.currentCashShift.status === 'ABIERTA') {
      this.state.currentCashShift.cashExpensesCOP += data.amountCOP;
      this.state.currentCashShift.expectedCashCOP -= data.amountCOP;
    }

    // Accounting Entry
    const accEntry: AccountingEntry = {
      id: `ACC-EXP-${Date.now()}`,
      voucherNumber: `CC-EXP-${voucherNumber}`,
      date: new Date().toISOString().split('T')[0],
      concept: `Gasto ${data.category}: ${data.description}`,
      sourceModule: 'GASTOS',
      rows: [
        {
          accountCode: '519595',
          accountName: `Gastos Operacionales - ${data.category}`,
          debitCOP: data.amountCOP,
          creditCOP: 0,
        },
        {
          accountCode: data.paymentMethod === 'EFECTIVO' ? '110505' : '111005',
          accountName: data.paymentMethod === 'EFECTIVO' ? 'Caja General' : 'Bancos Cta Cte',
          debitCOP: 0,
          creditCOP: data.amountCOP,
        },
      ],
      totalDebitCOP: data.amountCOP,
      totalCreditCOP: data.amountCOP,
      isBalanced: true,
      createdBy: user.name,
    };
    this.state.accountingEntries.unshift(accEntry);

    this.addAudit(
      'REGISTRO_GASTO',
      'Caja y Bancos',
      `Gasto registrado ${voucherNumber}: $${data.amountCOP.toLocaleString('es-CO')} (${data.category}) a favor de ${data.beneficiary}`
    );

    this.saveState();
    return newExpense;
  }

  // CASH SHIFTS (APERTURA)
  public openCashShift(initialCashCOP: number): CashShift {
    const branch = this.getActiveBranch();
    const user = this.getActiveUser();

    const newShift: CashShift = {
      id: `CSH-${Date.now()}`,
      shiftNumber: `TURNO-2026-${String(this.state.cashShiftsHistory.length + 85).padStart(4, '0')}`,
      branchId: branch.id,
      cashierId: user.id,
      cashierName: user.name,
      openedAt: new Date().toISOString(),
      initialCashCOP,
      cashSalesCOP: 0,
      cardSalesCOP: 0,
      transferSalesCOP: 0,
      layawayCashCOP: 0,
      repairCashCOP: 0,
      repairCardCOP: 0,
      repairTransferCOP: 0,
      cashExpensesCOP: 0,
      cashRefundsCOP: 0,
      expectedCashCOP: initialCashCOP,
      status: 'ABIERTA',
    };

    this.state.currentCashShift = newShift;
    if (!this.state.branchCashShifts) this.state.branchCashShifts = {};
    this.state.branchCashShifts[branch.id] = newShift;

    this.addAudit(
      'APERTURA_CAJA',
      'Caja y Bancos',
      `Apertura de turno ${newShift.shiftNumber} con base de $${initialCashCOP.toLocaleString('es-CO')}`
    );

    this.saveState();
    return newShift;
  }

  // DAILY RECONCILIATION (CUADRE DIARIO DE INVENTARIO Y CAJA)
  public registerDailyReconciliation(input: {
    countedGold: Record<string, { pieces: number; grossGrams: number }>;
    countedStones: Record<string, { quantity: number; carats: number }>;
    countedCashCOP: number;
    notes?: string;
    differenceReason?: string;
  }): DailyReconciliation {
    const branch = this.getActiveBranch();
    const user = this.getActiveUser();
    const shift = this.state.currentCashShift;
    const shiftWasOpen = !!shift && shift.status === 'ABIERTA';

    const expectedGold = getExpectedMetalLines(this.state.products, branch.id);
    const expectedStones = getExpectedStoneLines(this.state.products, branch.id);

    const goldLines: DailyReconciliationGoldLine[] = expectedGold.map((line) => {
      const counted = input.countedGold[line.metalType] || {
        pieces: 0,
        grossGrams: 0,
      };
      const piecesDifference = counted.pieces - line.pieces;
      const grossWeightDifferenceGrams = round3(
        counted.grossGrams - line.grossWeightGrams
      );

      return {
        ...line,
        countedPieces: counted.pieces,
        countedGrossWeightGrams: counted.grossGrams,
        piecesDifference,
        grossWeightDifferenceGrams,
        matches:
          piecesDifference === 0 &&
          Math.abs(grossWeightDifferenceGrams) <= RECONCILIATION_GRAMS_TOLERANCE,
      };
    });

    const stoneLines: DailyReconciliationStoneLine[] = expectedStones.map((line) => {
      const counted = input.countedStones[line.stoneType] || {
        quantity: 0,
        carats: 0,
      };
      const quantityDifference = counted.quantity - line.quantity;
      const caratsDifference = round3(counted.carats - line.carats);

      return {
        ...line,
        countedQuantity: counted.quantity,
        countedCarats: counted.carats,
        quantityDifference,
        caratsDifference,
        matches:
          quantityDifference === 0 &&
          Math.abs(caratsDifference) <= RECONCILIATION_CARATS_TOLERANCE,
      };
    });

    const expectedCashCOP = shift ? shift.expectedCashCOP : 0;
    const cashDifferenceCOP = round3(input.countedCashCOP - expectedCashCOP);
    const cashMatches =
      !!shift &&
      shift.status === 'ABIERTA' &&
      input.countedCashCOP === expectedCashCOP;
    const inventoryMatches =
      goldLines.every((line) => line.matches) &&
      stoneLines.every((line) => line.matches);
    const status: DailyReconciliation['status'] =
      inventoryMatches && cashMatches ? 'CUADRADO' : 'DIFERENCIA';

    const reconciliation: DailyReconciliation = {
      id: `CDR-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      branchId: branch.id,
      branchName: branch.name,
      responsibleUserId: user.id,
      responsibleUserName: user.name,
      shiftId: shift?.id,
      shiftNumber: shift?.shiftNumber,
      shiftStatus: shiftWasOpen ? 'CERRADA' : shift?.status,
      goldLines,
      expectedGoldPieces: goldLines.reduce((acc, line) => acc + line.pieces, 0),
      countedGoldPieces: goldLines.reduce(
        (acc, line) => acc + line.countedPieces,
        0
      ),
      expectedGoldGrossGrams: round3(
        goldLines.reduce((acc, line) => acc + line.grossWeightGrams, 0)
      ),
      countedGoldGrossGrams: round3(
        goldLines.reduce((acc, line) => acc + line.countedGrossWeightGrams, 0)
      ),
      expectedGoldNetGrams: round3(
        goldLines.reduce((acc, line) => acc + line.netMetalWeightGrams, 0)
      ),
      expectedGoldFineGrams: round3(
        goldLines.reduce((acc, line) => acc + line.fineMetalContentGrams, 0)
      ),
      stoneLines,
      expectedStoneQuantity: stoneLines.reduce(
        (acc, line) => acc + line.quantity,
        0
      ),
      countedStoneQuantity: stoneLines.reduce(
        (acc, line) => acc + line.countedQuantity,
        0
      ),
      expectedStoneCarats: round3(
        stoneLines.reduce((acc, line) => acc + line.carats, 0)
      ),
      countedStoneCarats: round3(
        stoneLines.reduce((acc, line) => acc + line.countedCarats, 0)
      ),
      expectedCashCOP,
      countedCashCOP: input.countedCashCOP,
      cashDifferenceCOP,
      inventoryMatches,
      cashMatches,
      status,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    this.state.dailyReconciliations.unshift(reconciliation);

    this.addAudit(
      'CUADRE_DIARIO',
      'Cuadre Diario',
      `Cuadre ${reconciliation.date} sede ${branch.name}. Metales: ${reconciliation.countedGoldPieces}/${reconciliation.expectedGoldPieces} piezas, ${reconciliation.countedGoldGrossGrams}g contados vs ${reconciliation.expectedGoldGrossGrams}g sistema. Piedras: ${reconciliation.countedStoneCarats}ct contados vs ${reconciliation.expectedStoneCarats}ct sistema. Caja: ${reconciliation.countedCashCOP.toLocaleString('es-CO')} contados vs ${reconciliation.expectedCashCOP.toLocaleString('es-CO')} esperados (diferencia ${reconciliation.cashDifferenceCOP.toLocaleString('es-CO')}). Estado: ${status}`
    );

    if (shiftWasOpen && shift) {
      shift.actualCountedCashCOP = input.countedCashCOP;
      shift.differenceCOP = cashDifferenceCOP;
      shift.differenceReason = input.differenceReason || input.notes;
      shift.notes = input.notes;
      shift.closedAt = new Date().toISOString();
      shift.status = 'CERRADA';
      this.state.cashShiftsHistory.unshift({ ...shift });

      this.addAudit(
        'CIERRE_CAJA',
        'Caja y Bancos',
        `Cierre de turno ${shift.shiftNumber} desde Cuadre Diario. Efectivo esperado: $${shift.expectedCashCOP.toLocaleString('es-CO')}, contado: $${input.countedCashCOP.toLocaleString('es-CO')}, diferencia: $${cashDifferenceCOP.toLocaleString('es-CO')}.`
      );
    }

    this.saveState();
    return reconciliation;
  }

  // METAL PRICES BOARD
  public updateMetalPrice(code: MetalPriceConfig['code'], buyPrice: number, sellPrice: number, source: string) {
    const item = this.state.metalPrices.find((m) => m.code === code);
    if (!item) return;

    item.buyPriceGramCOP = buyPrice;
    item.sellPriceGramCOP = sellPrice;
    item.lastUpdated = new Date().toISOString();
    item.source = source;

    this.addAudit(
      'ACTUALIZAR_COTIZACION',
      'Metales Preciosos',
      `Actualizada cotización de ${item.name}: Compra $${buyPrice.toLocaleString('es-CO')}/g - Venta $${sellPrice.toLocaleString('es-CO')}/g`
    );

    this.saveState();
  }

  /**
   * Sincroniza las tasas oficiales del Banco de la República con el ERP.
   * Deriva las aleaciones por ley y evita auditorías si no hubo cambios.
   */
  public syncOfficialMetalRates(input: {
    gold24kCOP: number;
    silverCOP: number;
    platinumCOP?: number;
    source?: string;
    effectiveText?: string;
  }): boolean {
    if (input.gold24kCOP <= 0 || input.silverCOP <= 0) return false;

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const factor: Record<string, number> = {
      ORO_24K: 1,
      ORO_18K_NACIONAL: 18 / 24,
      ORO_18K_ITALIANO: 18 / 24,
      ORO_14K: 14 / 24,
      ORO_10K: 10 / 24,
      PLATA_925: 1,
      PLATINO_950: 1,
    };
    const base: Record<string, number> = {
      ORO_24K: input.gold24kCOP,
      ORO_18K_NACIONAL: input.gold24kCOP,
      ORO_18K_ITALIANO: input.gold24kCOP,
      ORO_14K: input.gold24kCOP,
      ORO_10K: input.gold24kCOP,
      PLATA_925: input.silverCOP,
      PLATINO_950: input.platinumCOP || 0,
    };
    const sourceLabel = input.source || 'Banco de la República';
    const sourceText = input.effectiveText
      ? `${sourceLabel} (vig. ${input.effectiveText})`
      : sourceLabel;

    let changed = false;
    let updatedCount = 0;

    this.state.metalPrices.forEach((item) => {
      const target = base[item.code];
      if (!target || target <= 0) return;
      const sell = round2(target * factor[item.code]);
      const buy = round2(sell * 0.95);
      if (
        Math.abs(item.sellPriceGramCOP - sell) < 0.01 &&
        Math.abs(item.buyPriceGramCOP - buy) < 0.01
      ) {
        return;
      }
      item.buyPriceGramCOP = buy;
      item.sellPriceGramCOP = sell;
      item.lastUpdated = new Date().toISOString();
      item.source = sourceText;
      changed = true;
      updatedCount += 1;
    });

    if (changed) {
      this.addAudit(
        'SINCRONIZAR_COTIZACION_OFICIAL',
        'Metales Preciosos',
        `Tasas oficiales de ${sourceLabel} sincronizadas en ${updatedCount} referencias (${sourceText}).`
      );
      this.saveState();
    }
    return changed;
  }

  // PURCHASES & RAW MATERIALS
  public createPurchase(data: {
    invoiceNumber: string;
    supplierId: string;
    date: string;
    paymentMethod: PaymentRecord['method'];
    notes?: string;
    paid: boolean;
    items: Omit<PurchaseItem, 'id' | 'totalCostCOP'>[];
  }): Purchase {
    if (!data.items.length) throw new Error('Agrega al menos un ítem a la compra.');
    const supplier = this.state.suppliers.find((s) => s.id === data.supplierId);
    if (!supplier) throw new Error('Proveedor no encontrado.');
    const branch = this.getActiveBranch();
    const user = this.getActiveUser();
    const now = new Date().toISOString();
    const items: PurchaseItem[] = data.items.map((item, index) => ({
      ...item,
      id: `PIT-${Date.now()}-${index}`,
      totalCostCOP: Math.round(item.quantity * item.unitCostCOP),
    }));
    const totalCOP = items.reduce((acc, item) => acc + item.totalCostCOP, 0);
    if (totalCOP <= 0) throw new Error('El total de la compra debe ser mayor a cero.');

    if (!this.state.purchases) this.state.purchases = [];
    if (!this.state.branchCashShifts) this.state.branchCashShifts = {};

    const purchase: Purchase = {
      id: `PUR-${Date.now()}`,
      invoiceNumber: data.invoiceNumber.trim() || `FC-${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      branchId: branch.id,
      date: data.date,
      paymentMethod: data.paymentMethod,
      items,
      totalCOP,
      status: data.paid ? 'PAGADA' : 'PENDIENTE',
      notes: data.notes,
      accountingEntryId: `CC-COM-${Date.now()}`,
      createdBy: user.name,
      createdAt: now,
    };

    this.state.purchases.unshift(purchase);

    if (!data.paid) {
      supplier.balancePendingCOP += totalCOP;
    } else if (data.paymentMethod === 'EFECTIVO') {
      const shift = this.state.currentCashShift;
      if (shift && shift.status === 'ABIERTA') {
        shift.cashExpensesCOP += totalCOP;
        shift.expectedCashCOP -= totalCOP;
      }
    }

    // Ingresa materia prima / insumos / gemas al inventario físico.
    items.forEach((item) => {
      if (
        item.category !== 'Materia Prima' &&
        item.category !== 'Insumo de Taller' &&
        item.category !== 'Piedra Preciosa'
      ) {
        return;
      }
      const existing = this.state.rawMaterials.find(
        (m) => m.name.toLowerCase() === item.description.toLowerCase()
      );
      if (existing) {
        const totalQty = existing.quantity + item.quantity;
        existing.unitCostCOP =
          totalQty > 0
            ? Math.round(
                (existing.quantity * existing.unitCostCOP +
                  item.quantity * item.unitCostCOP) /
                  totalQty
              )
            : item.unitCostCOP;
        existing.quantity = round3(totalQty);
        existing.updatedAt = now;
      } else {
        this.state.rawMaterials.unshift({
          id: `MAT-${Date.now()}-${item.id}`,
          name: item.description,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          unitCostCOP: item.unitCostCOP,
          minStock: 0,
          branchId: branch.id,
          updatedAt: now,
        });
      }
    });

    const creditAccount = data.paid
      ? this.getPaymentAccount(data.paymentMethod)
      : { code: '220505', name: 'Proveedores Nacionales' };

    const entry: AccountingEntry = {
      id: `ACC-COM-${Date.now()}`,
      voucherNumber: purchase.accountingEntryId,
      date: data.date,
      concept: `Compra ${purchase.invoiceNumber} a ${supplier.companyName}`,
      sourceModule: 'COMPRAS',
      rows: [
        {
          accountCode: '143505',
          accountName: 'Inventario de Materias Primas e Insumos',
          debitCOP: totalCOP,
          creditCOP: 0,
        },
        {
          accountCode: creditAccount.code,
          accountName: creditAccount.name,
          debitCOP: 0,
          creditCOP: totalCOP,
        },
      ],
      totalDebitCOP: totalCOP,
      totalCreditCOP: totalCOP,
      isBalanced: true,
      createdBy: user.name,
    };
    this.state.accountingEntries.unshift(entry);

    this.addAudit(
      'REGISTRO_COMPRA',
      'Compras',
      `Compra ${purchase.invoiceNumber} por $${totalCOP.toLocaleString('es-CO')} a ${supplier.companyName} (${purchase.status}).`
    );

    this.saveState();
    return purchase;
  }

  public registerSupplierPayment(
    supplierId: string,
    amountCOP: number,
    paymentMethod: PaymentRecord['method'],
    notes?: string
  ): void {
    const supplier = this.state.suppliers.find((s) => s.id === supplierId);
    if (!supplier) throw new Error('Proveedor no encontrado.');
    if (amountCOP <= 0) throw new Error('El pago debe ser mayor a cero.');
    const user = this.getActiveUser();
    const today = new Date().toISOString().split('T')[0];

    supplier.balancePendingCOP = Math.max(
      0,
      supplier.balancePendingCOP - amountCOP
    );

    let remaining = amountCOP;
    this.state.purchases
      .filter((p) => p.supplierId === supplierId && p.status === 'PENDIENTE')
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((purchase) => {
        if (remaining >= purchase.totalCOP) {
          purchase.status = 'PAGADA';
          remaining -= purchase.totalCOP;
        }
      });

    if (paymentMethod === 'EFECTIVO') {
      const shift = this.state.currentCashShift;
      if (shift && shift.status === 'ABIERTA') {
        shift.cashExpensesCOP += amountCOP;
        shift.expectedCashCOP -= amountCOP;
      }
    }

    const creditAccount = this.getPaymentAccount(paymentMethod);
    const entry: AccountingEntry = {
      id: `ACC-PAG-${Date.now()}`,
      voucherNumber: `CC-PAG-${Date.now()}`,
      date: today,
      concept: `Pago a proveedor ${supplier.companyName}${notes ? `: ${notes}` : ''}`,
      sourceModule: 'COMPRAS',
      rows: [
        {
          accountCode: '220505',
          accountName: 'Proveedores Nacionales',
          debitCOP: amountCOP,
          creditCOP: 0,
        },
        {
          accountCode: creditAccount.code,
          accountName: creditAccount.name,
          debitCOP: 0,
          creditCOP: amountCOP,
        },
      ],
      totalDebitCOP: amountCOP,
      totalCreditCOP: amountCOP,
      isBalanced: true,
      createdBy: user.name,
    };
    this.state.accountingEntries.unshift(entry);

    this.addAudit(
      'PAGO_PROVEEDOR',
      'Compras',
      `Pago a ${supplier.companyName} por $${amountCOP.toLocaleString('es-CO')}. Saldo pendiente: $${supplier.balancePendingCOP.toLocaleString('es-CO')}.`
    );

    this.saveState();
  }

  public createRawMaterial(data: {
    name: string;
    category: RawMaterial['category'];
    unit: string;
    quantity: number;
    unitCostCOP: number;
    minStock: number;
  }): RawMaterial {
    if (!data.name.trim()) throw new Error('Escribe el nombre del material.');
    const branch = this.getActiveBranch();
    const material: RawMaterial = {
      id: `MAT-${Date.now()}`,
      name: data.name.trim(),
      category: data.category,
      unit: data.unit.trim() || 'unidad',
      quantity: data.quantity,
      unitCostCOP: data.unitCostCOP,
      minStock: data.minStock,
      branchId: branch.id,
      updatedAt: new Date().toISOString(),
    };
    this.state.rawMaterials.unshift(material);
    this.addAudit(
      'CREAR_MATERIA_PRIMA',
      'Materia Prima',
      `Creado ${material.name} con ${material.quantity}${material.unit} en ${branch.name}.`
    );
    this.saveState();
    return material;
  }

  public adjustRawMaterial(input: {
    id: string;
    quantityDelta: number;
    unitCostCOP?: number;
    notes?: string;
  }): RawMaterial {
    const material = this.state.rawMaterials.find((m) => m.id === input.id);
    if (!material) throw new Error('Material no encontrado.');
    const nextQty = material.quantity + input.quantityDelta;
    if (nextQty < 0) throw new Error('No puedes dejar el inventario en negativo.');
    material.quantity = round3(nextQty);
    if (typeof input.unitCostCOP === 'number' && input.unitCostCOP > 0) {
      material.unitCostCOP = input.unitCostCOP;
    }
    material.updatedAt = new Date().toISOString();
    this.addAudit(
      'AJUSTE_MATERIA_PRIMA',
      'Materia Prima',
      `Ajuste de ${material.name}: ${input.quantityDelta > 0 ? '+' : ''}${input.quantityDelta}${material.unit}. Nuevo saldo: ${material.quantity}${material.unit}.${input.notes ? ` Motivo: ${input.notes}` : ''}`
    );
    this.saveState();
    return material;
  }

  // BACKUP & RESTORE
  public exportBackupJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackupJSON(jsonStr: string) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.products || !parsed.sales) {
        throw new Error('Estructura de copia de seguridad inválida');
      }
      this.state = parsed;
      this.saveState();
      this.state = this.loadState();
    } catch (err: any) {
      throw new Error(`Error al importar respaldo: ${err.message}`);
    }
  }

  public resetToDefaultSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.saveState();
  }
}

export const erpDb = new ERPDatabaseService();
