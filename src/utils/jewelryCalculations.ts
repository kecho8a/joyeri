/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalType } from '../types';

export const METAL_DEFINITIONS: Record<MetalType, { name: string; karatText: string; fineness: number; densityGcm3: number }> = {
  ORO_24K: {
    name: 'Oro Puro 24K',
    karatText: '24K (999.9)',
    fineness: 0.999,
    densityGcm3: 19.32,
  },
  ORO_18K_NACIONAL: {
    name: 'Oro 18K Nacional',
    karatText: '18K (750)',
    fineness: 0.750,
    densityGcm3: 15.58,
  },
  ORO_18K_ITALIANO: {
    name: 'Oro 18K Italiano',
    karatText: '18K (750)',
    fineness: 0.750,
    densityGcm3: 15.65,
  },
  ORO_14K: {
    name: 'Oro 14K',
    karatText: '14K (585)',
    fineness: 0.585,
    densityGcm3: 13.07,
  },
  ORO_10K: {
    name: 'Oro 10K',
    karatText: '10K (417)',
    fineness: 0.417,
    densityGcm3: 11.57,
  },
  PLATA_925: {
    name: 'Plata Ley 925',
    karatText: 'Ley 925 (Sterling)',
    fineness: 0.925,
    densityGcm3: 10.36,
  },
  PLATINO_950: {
    name: 'Platino Puro 950',
    karatText: 'Platino 950',
    fineness: 0.950,
    densityGcm3: 21.45,
  },
};

/**
 * 1 Carat (ct) = 0.20 grams (g)
 */
export function caratsToGrams(carats: number): number {
  return Number((carats * 0.20).toFixed(4));
}

/**
 * Net Metal Weight = Gross Weight - (Stone Weight in grams) - (Other components in grams)
 */
export function calculateNetMetalWeight(
  grossWeightGrams: number,
  stoneWeightCarats: number,
  otherComponentsGrams: number = 0
): number {
  const stoneGrams = caratsToGrams(stoneWeightCarats);
  const net = grossWeightGrams - stoneGrams - otherComponentsGrams;
  return Number(Math.max(0, net).toFixed(3));
}

/**
 * Fine Metal Content = Net Metal Weight * Fineness proportion
 * Example for 10g of 18K (0.750): 10 * 0.750 = 7.50 g of pure gold.
 */
export function calculateFineMetalWeight(
  netMetalWeightGrams: number,
  fineness: number
): number {
  return Number((netMetalWeightGrams * fineness).toFixed(3));
}

/**
 * Format currency in Colombian Pesos (COP)
 */
export function formatCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format grams with 2 decimals
 */
export function formatGrams(grams: number): string {
  return `${Number(grams || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g`;
}

/**
 * Format carats with 2 decimals
 */
export function formatCarats(carats: number): string {
  return `${Number(carats || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ct`;
}

/**
 * Format Date DD/MM/AAAA
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '-';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Format DateTime DD/MM/AAAA HH:MM
 */
export function formatDateTime(isoDate: string): string {
  if (!isoDate) return '-';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}
