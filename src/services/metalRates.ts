/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { erpDb } from './store';

export interface MetalRate {
  compra: number;
  venta: number;
}

export interface MetalRatesData {
  fuente: string;
  url: string;
  obtenidoEn: string;
  vigencia: { desde: string; hasta: string; texto: string };
  metales: {
    oro: MetalRate;
    plata: MetalRate;
    platino?: MetalRate;
  };
}

export type MetalRatesSource = 'oficial' | 'cache' | 'interno';

export interface ResolvedMetalRates {
  rates: MetalRatesData;
  source: MetalRatesSource;
}

const CACHE_KEY = 'joyeri_precios_metales';

export function isValidMetalRatesPayload(
  data: unknown
): data is MetalRatesData {
  const d = data as MetalRatesData | null;
  return (
    !!d &&
    typeof d === 'object' &&
    !!d.metales?.oro &&
    !!d.metales?.plata &&
    d.metales.oro.compra > 0 &&
    d.metales.oro.venta > 0 &&
    d.metales.plata.compra > 0 &&
    d.metales.plata.venta > 0 &&
    typeof d.vigencia?.texto === 'string'
  );
}

export function readCachedMetalRates(): MetalRatesData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidMetalRatesPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function buildInternalMetalRates(): MetalRatesData {
  const state = erpDb.getState();
  const oro = state.metalPrices.find((m) => m.code === 'ORO_24K');
  const plata = state.metalPrices.find((m) => m.code === 'PLATA_925');
  return {
    fuente: 'Precios internos de referencia (sin conexión oficial)',
    url: '',
    obtenidoEn: new Date(0).toISOString(),
    vigencia: { desde: '', hasta: '', texto: '' },
    metales: {
      oro: {
        compra: oro?.buyPriceGramCOP ?? 0,
        venta: oro?.sellPriceGramCOP ?? 0,
      },
      plata: {
        compra: plata?.buyPriceGramCOP ?? 0,
        venta: plata?.sellPriceGramCOP ?? 0,
      },
    },
  };
}

function syncRatesToStore(data: MetalRatesData) {
  erpDb.syncOfficialMetalRates({
    gold24kCOP: data.metales.oro.venta,
    silverCOP: data.metales.plata.venta,
    platinumCOP: data.metales.platino?.venta,
    source: data.fuente,
    effectiveText: data.vigencia.texto,
  });
}

let inFlight: Promise<ResolvedMetalRates> | null = null;

/**
 * Carga las tasas oficiales del Banco de la República:
 * JSON publicado por el workflow, cache local o valores internos.
 * Las peticiones concurrentes comparten la misma promesa.
 */
export function loadMetalRates(): Promise<ResolvedMetalRates> {
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<ResolvedMetalRates> => {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}precios-metales.json`, {
        cache: 'no-cache',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      if (!isValidMetalRatesPayload(data)) throw new Error('Payload invalido');
      syncRatesToStore(data);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        // almacenamiento lleno o bloqueado: se ignora
      }
      return { rates: data, source: 'oficial' };
    } catch {
      const cached = readCachedMetalRates();
      if (cached) {
        syncRatesToStore(cached);
        return { rates: cached, source: 'cache' };
      }
      return { rates: buildInternalMetalRates(), source: 'interno' };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function useMetalRates(): ResolvedMetalRates & { oficial: boolean } {
  const [resolved, setResolved] = useState<ResolvedMetalRates>(() => {
    const cached = readCachedMetalRates();
    return cached
      ? { rates: cached, source: 'cache' }
      : { rates: buildInternalMetalRates(), source: 'interno' };
  });

  useEffect(() => {
    let cancelled = false;
    void loadMetalRates().then((result) => {
      if (!cancelled) setResolved(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...resolved, oficial: resolved.source === 'oficial' };
}
