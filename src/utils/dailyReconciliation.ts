/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoldInventorySnapshot,
  MetalType,
  Product,
  ProductStatus,
  StoneInventorySnapshot,
} from '../types';

/**
 * Tolerancias de conciliación:
 * - Peso: la balanza puede redondear, se permite ±0.05 g.
 * - Quilates: se permite ±0.05 ct.
 * - Cantidades (piezas / unidades) y efectivo: deben coincidir exactamente.
 */
export const RECONCILIATION_GRAMS_TOLERANCE = 0.05;
export const RECONCILIATION_CARATS_TOLERANCE = 0.05;

/**
 * Joyas que físicamente deben estar en la sede: disponibles o reservadas/apartadas.
 * EN_TALLER se encuentra fuera (taller), CONSIGNADO fuera (consignación) y VENDIDO ya salió.
 */
export const IN_STORE_STATUSES: ProductStatus[] = ['DISPONIBLE', 'RESERVADO'];

export function round3(value: number): number {
  return Number((value || 0).toFixed(3));
}

export function isGoldMetalType(metalType: MetalType): boolean {
  return metalType.startsWith('ORO_');
}

export function getInStoreProducts(products: Product[], branchId: string): Product[] {
  return products.filter(
    (p) => p.branchId === branchId && IN_STORE_STATUSES.includes(p.status)
  );
}

/**
 * Agrupa las joyas de oro que el sistema registra físicamente en la sede.
 */
export function getExpectedGoldLines(
  products: Product[],
  branchId: string
): GoldInventorySnapshot[] {
  const grouped = new Map<MetalType, GoldInventorySnapshot>();

  getInStoreProducts(products, branchId)
    .filter((p) => isGoldMetalType(p.metalType))
    .forEach((p) => {
      const current = grouped.get(p.metalType) || {
        metalType: p.metalType,
        pieces: 0,
        grossWeightGrams: 0,
        netMetalWeightGrams: 0,
        fineMetalContentGrams: 0,
      };

      current.pieces += 1;
      current.grossWeightGrams = round3(current.grossWeightGrams + p.grossWeightGrams);
      current.netMetalWeightGrams = round3(
        current.netMetalWeightGrams + p.netMetalWeightGrams
      );
      current.fineMetalContentGrams = round3(
        current.fineMetalContentGrams + p.fineMetalContentGrams
      );

      grouped.set(p.metalType, current);
    });

  return Array.from(grouped.values()).sort((a, b) =>
    a.metalType.localeCompare(b.metalType)
  );
}

/**
 * Agrupa TODAS las joyas de metal precioso (oro, plata y platino) que el
 * sistema registra físicamente en la sede. Se usa para el cuadre diario.
 */
export function getExpectedMetalLines(
  products: Product[],
  branchId: string
): GoldInventorySnapshot[] {
  const grouped = new Map<MetalType, GoldInventorySnapshot>();

  getInStoreProducts(products, branchId).forEach((p) => {
    const current = grouped.get(p.metalType) || {
      metalType: p.metalType,
      pieces: 0,
      grossWeightGrams: 0,
      netMetalWeightGrams: 0,
      fineMetalContentGrams: 0,
    };

    current.pieces += 1;
    current.grossWeightGrams = round3(current.grossWeightGrams + p.grossWeightGrams);
    current.netMetalWeightGrams = round3(
      current.netMetalWeightGrams + p.netMetalWeightGrams
    );
    current.fineMetalContentGrams = round3(
      current.fineMetalContentGrams + p.fineMetalContentGrams
    );

    grouped.set(p.metalType, current);
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.metalType.localeCompare(b.metalType)
  );
}

/**
 * Detalle de piezas de metal precioso que el sistema espera encontrar en la sede.
 */
export function getInStoreMetalPieces(products: Product[], branchId: string): Product[] {
  return getInStoreProducts(products, branchId);
}

/**
 * Agrupa las piedras engastadas en las joyas que el sistema registra en la sede.
 */
export function getExpectedStoneLines(
  products: Product[],
  branchId: string
): StoneInventorySnapshot[] {
  const grouped = new Map<string, StoneInventorySnapshot>();

  getInStoreProducts(products, branchId).forEach((p) => {
    p.stones.forEach((stone) => {
      const current = grouped.get(stone.type) || {
        stoneType: stone.type,
        quantity: 0,
        carats: 0,
      };

      current.quantity += stone.quantity;
      current.carats = round3(current.carats + stone.carats);

      grouped.set(stone.type, current);
    });
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.stoneType.localeCompare(b.stoneType)
  );
}

/**
 * Detalle de piezas de oro que el sistema espera encontrar en la sede.
 */
export function getInStoreGoldPieces(products: Product[], branchId: string): Product[] {
  return getInStoreProducts(products, branchId).filter((p) =>
    isGoldMetalType(p.metalType)
  );
}
