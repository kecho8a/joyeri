/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark } from 'lucide-react';
import { useMetalRates } from '../../services/metalRates';
import { formatCOP } from '../../utils/jewelryCalculations';

export const MetalRatesLabel: React.FC = () => {
  const { rates, oficial } = useMetalRates();
  const { oro, plata } = rates.metales;
  const vigencia = rates.vigencia.texto;

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
      className="relative w-full h-9 overflow-hidden rounded-full border border-[#10B981]/25 bg-[#10B981]/5"
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
        <Landmark className="hidden sm:block w-3.5 h-3.5 shrink-0 text-[#059669]" />
        <span className="text-[#059669]">ORO</span>
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
        <span className="text-[#059669]">PLATA</span>
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
        <span className="hidden md:inline text-[#059669]">c/g</span>
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
