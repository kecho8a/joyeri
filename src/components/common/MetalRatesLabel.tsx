/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { erpDb } from '../../services/store';
import { formatCOP } from '../../utils/jewelryCalculations';

interface MetalRate {
  compra: number;
  venta: number;
}

interface MetalRatesData {
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

const CACHE_KEY = 'joyeri_precios_metales';

function isValidPayload(data: unknown): data is MetalRatesData {
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

function buildFallbackFromStore(): MetalRatesData {
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

function readCache(): MetalRatesData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const MetalRatesLabel: React.FC = () => {
  const [rates, setRates] = useState<MetalRatesData>(
    () => readCache() ?? buildFallbackFromStore()
  );
  const [source, setSource] = useState<'oficial' | 'cache' | 'interno'>(
    () => (readCache() ? 'cache' : 'interno')
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(`${base}precios-metales.json`, {
          cache: 'no-cache',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!isValidPayload(data)) throw new Error('Payload invalido');
        if (cancelled) return;
        setRates(data);
        setSource('oficial');
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // almacenamiento lleno o bloqueado: se ignora
        }
      } catch {
        if (cancelled) return;
        const cached = readCache();
        if (cached) {
          setRates(cached);
          setSource('cache');
        } else {
          setRates(buildFallbackFromStore());
          setSource('interno');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { oro, plata } = rates.metales;
  const vigencia = rates.vigencia.texto;
  const oficial = source === 'oficial';

  // Móvil: un solo "$" por metal y sin espacio ("$405.533/426.877")
  // para que el texto quepa dentro de la píldora en pantallas de 360px.
  const pair = (a: number, b: number) => {
    const [first, second] = [formatCOP(a), formatCOP(b)];
    return [first.replace(/\$\s*/, '$'), second.replace(/^\$\s*/, '')] as const;
  };
  const [oroCompra, oroVenta] = pair(oro.compra, oro.venta);
  const [plataCompra, plataVenta] = pair(plata.compra, plata.venta);

  return (
    <div
      className="relative w-full h-9 overflow-hidden rounded-full border border-[#9B7028]/25 bg-[#9B7028]/5"
      role="marquee"
      title="Tasas por gramo — Banco de la República"
      aria-label={`Tasas del dia: oro compra ${formatCOP(
        oro.compra
      )} venta ${formatCOP(oro.venta)} por gramo, plata compra ${formatCOP(
        plata.compra
      )} venta ${formatCOP(plata.venta)} por gramo`}
    >
      {/* Compacto en móvil (valores con un solo "$" por metal, 9px);
          icono desde sm, compra/venta desde md y vigencia/fuente
          desde lg para que nunca desborde */}
      <div className="metal-rates-label gap-0.5 px-2 text-[9px] sm:gap-2 sm:px-4 sm:text-[11px] font-semibold text-[#5C4313]">
        <Landmark className="hidden sm:block w-3.5 h-3.5 shrink-0 text-[#7F581A]" />
        <span className="text-[#7F581A]">ORO</span>
        <span className="hidden md:inline text-[#727985] font-medium">
          compra
        </span>
        <span className="text-[#20242B] font-bold tabular-nums">
          {oroCompra}
        </span>
        <span className="text-[#C9CDD3]">/</span>
        <span className="hidden md:inline text-[#727985] font-medium">
          venta
        </span>
        <span className="text-[#20242B] font-bold tabular-nums">
          {oroVenta}
        </span>
        <span className="text-[#C9CDD3]">·</span>
        <span className="text-[#7F581A]">PLATA</span>
        <span className="hidden md:inline text-[#727985] font-medium">
          compra
        </span>
        <span className="text-[#20242B] font-bold tabular-nums">
          {plataCompra}
        </span>
        <span className="text-[#C9CDD3]">/</span>
        <span className="hidden md:inline text-[#727985] font-medium">
          venta
        </span>
        <span className="text-[#20242B] font-bold tabular-nums">
          {plataVenta}
        </span>
        <span className="hidden md:inline text-[#C9CDD3]">|</span>
        <span className="hidden md:inline text-[#7F581A]">c/g</span>
        {vigencia && (
          <span className="hidden lg:inline font-medium text-[#727985]">
            Vig. {vigencia}
          </span>
        )}
        <span className="hidden lg:inline font-medium text-[#727985]">
          {oficial ? 'Banco de la República' : rates.fuente}
        </span>
      </div>
    </div>
  );
};
