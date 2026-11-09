/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Package,
  Coins,
  Disc,
  Landmark,
  BookmarkCheck,
  Wrench,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  Plus,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import {
  formatCOP,
  formatGrams,
  formatCarats,
  formatDateTime,
} from '../../utils/jewelryCalculations';
import { getDefaultJewelryImage } from '../../utils/jewelryImages';
import { MetalRatesLabel } from '../common/MetalRatesLabel';
import { useMetalRates } from '../../services/metalRates';
import type { PaymentMethod } from '../../types';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_DEBITO: 'Débito',
  TARJETA_CREDITO: 'Crédito',
  TRANSFERENCIA_BANCOLOMBIA: 'Transferencia',
  NEQUI_DAVIPLATA: 'Nequi/Daviplata',
  ANTICIPO_APARTADO: 'Anticipo',
};

const paymentLabel = (method: PaymentMethod): string =>
  PAYMENT_METHOD_LABELS[method] ?? method;

interface DashboardViewProps {
  onNavigate: (module: string) => void;
  onOpenSale: () => void;
  onOpenProduct: () => void;
  onOpenRepair: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSale,
  onOpenProduct,
  onOpenRepair,
}) => {
  const state = erpDb.getState();
  const activeBranch = erpDb.getActiveBranch();
  const { rates: officialRates, oficial: ratesAreOfficial } = useMetalRates();

  // Metrics computation
  const availableProducts = state.products.filter(
    (p) => p.status === 'DISPONIBLE' && (p.branchId === activeBranch.id || !activeBranch.id)
  );

  const totalInventoryCost = availableProducts.reduce((acc, p) => acc + p.totalCostCOP, 0);
  const totalInventoryRetail = availableProducts.reduce((acc, p) => acc + p.salePriceCOP, 0);

  const totalFineGoldGrams = availableProducts
    .filter((p) => p.metalType.startsWith('ORO'))
    .reduce((acc, p) => acc + p.fineMetalContentGrams, 0);

  const totalGemCarats = availableProducts.reduce(
    (acc, p) => acc + p.stoneWeightCarats,
    0
  );

  const totalSalesCOP = state.sales.reduce((acc, s) => acc + s.totalCOP, 0);

  const todayKey = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(
    (s) =>
      s.branchId === activeBranch.id && s.createdAt.startsWith(todayKey)
  );
  const todaySalesCOP = todaySales.reduce((acc, s) => acc + s.totalCOP, 0);

  const inventoryMarginCOP = totalInventoryRetail - totalInventoryCost;
  const inventoryMarginPct =
    totalInventoryRetail > 0
      ? (inventoryMarginCOP / totalInventoryRetail) * 100
      : 0;

  const layawaysPendingCOP = state.layaways
    .filter((l) => l.status === 'ACTIVO' || l.status === 'PARCIAL')
    .reduce((acc, l) => acc + l.balanceCOP, 0);

  const currentCash = state.currentCashShift?.expectedCashCOP || 0;

  const pendingRepairs = state.repairs.filter(
    (r) => r.status !== 'ENTREGADO' && r.status !== 'CANCELADO'
  ).length;

  const readyRepairs = state.repairs.filter((r) => r.status === 'LISTO_ENTREGA');

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Quick Daily Action Strip (Súper fácil e intuitivo) */}
      <div className="card-float p-3.5 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-[#20242B] tracking-tight leading-snug">
              ¿Qué deseas realizar hoy en {activeBranch.name}?
            </h1>
            <p className="text-[11px] sm:text-xs text-[#727985]">
              Acciones operativas directas con un solo clic
            </p>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#059669] bg-[#10B981]/10 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
            Sede: {activeBranch.city}
          </span>
        </div>

        {/* Tasas del día (Banco de la República): etiqueta que se desliza */}
        <MetalRatesLabel />

        {/* Action cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {/* Action 1: Venta POS (destacada) */}
          <button
            onClick={onOpenSale}
            className="card-float group flex flex-col gap-2 p-3 sm:p-4 text-left min-h-[100px] sm:min-h-[116px] bg-gradient-to-br from-[#10B981] to-[#059669] border-[#059669] text-white shadow-[0_12px_26px_-16px_rgba(5,150,105,0.95)] active:scale-[0.97] transition-all"
          >
            <span className="card-icon bg-white/25 text-white group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span className="block min-w-0">
              <span className="block font-bold text-xs sm:text-sm leading-snug">
                Nueva Venta POS
              </span>
              <span className="hidden sm:block text-[10px] text-white/85 mt-0.5">
                Facturar joya en mostrador
              </span>
            </span>
          </button>

          {/* Action 2: Nueva Joya */}
          <button
            onClick={onOpenProduct}
            className="card-float group flex flex-col gap-2 p-3 sm:p-4 text-left min-h-[100px] sm:min-h-[116px] active:scale-[0.97] transition-all"
          >
            <span className="card-icon bg-[#10B981]/10 text-[#059669] group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </span>
            <span className="block min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[#20242B] leading-snug">
                + Ingresar Joya
              </span>
              <span className="hidden sm:block text-[10px] text-[#727985] mt-0.5">
                Con cálculo de oro fino
              </span>
            </span>
          </button>

          {/* Action 3: Recibir en Taller */}
          <button
            onClick={onOpenRepair}
            className="card-float group flex flex-col gap-2 p-3 sm:p-4 text-left min-h-[100px] sm:min-h-[116px] active:scale-[0.97] transition-all"
          >
            <span className="card-icon bg-[#3478C6]/10 text-[#3478C6] group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </span>
            <span className="block min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[#20242B] leading-snug">
                Recibir en Taller
              </span>
              <span className="hidden sm:block text-[10px] text-[#727985] mt-0.5">
                Custodia y pesaje balanza
              </span>
            </span>
          </button>

          {/* Action 4: Separados */}
          <button
            onClick={() => onNavigate('layaways')}
            className="card-float group flex flex-col gap-2 p-3 sm:p-4 text-left min-h-[100px] sm:min-h-[116px] active:scale-[0.97] transition-all"
          >
            <span className="card-icon bg-[#D99032]/10 text-[#A66A1C] group-hover:scale-110 transition-transform">
              <BookmarkCheck className="w-4 h-4" />
            </span>
            <span className="block min-w-0">
              <span className="block font-bold text-xs sm:text-sm text-[#20242B] leading-snug">
                Ver Separados
              </span>
              <span className="hidden sm:block text-[10px] text-[#727985] mt-0.5">
                Cobrar abonos a clientes
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* 2. Core Financial & Stock KPIs Grid (cards flotantes compactas en móvil) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Total Ventas */}
        <div className="card-float p-3 sm:p-4 lg:p-5 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#727985] leading-tight min-w-0">
              Ventas de Hoy
            </span>
            <span className="card-icon-sm bg-[#10B981]/10 text-[#059669]">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[15px] sm:text-xl lg:text-2xl font-bold text-[#059669] font-mono tabular-nums truncate">
            {formatCOP(todaySalesCOP)}
          </p>
          <div className="mt-auto pt-2 border-t border-[#EAECEF] flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#727985]">
            <span className="min-w-0 truncate">
              {todaySales.length} facturas
              <span className="hidden sm:inline">
                {' '}
                · Hist. {formatCOP(totalSalesCOP)}
              </span>
            </span>
            <button
              onClick={() => onNavigate('sales')}
              className="shrink-0 text-[#059669] font-semibold hover:underline flex items-center gap-0.5"
            >
              Ver <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Inventario Valorizado */}
        <div className="card-float p-3 sm:p-4 lg:p-5 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#727985] leading-tight min-w-0">
              Stock Comercial
            </span>
            <span className="card-icon-sm bg-[#3478C6]/10 text-[#3478C6]">
              <Package className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[15px] sm:text-xl lg:text-2xl font-bold text-[#20242B] font-mono tabular-nums truncate">
            {formatCOP(totalInventoryRetail)}
          </p>
          <div className="mt-auto pt-2 border-t border-[#EAECEF] flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#727985]">
            <span className="min-w-0 truncate">
              {inventoryMarginPct.toFixed(1)}% margen
              <span className="hidden sm:inline">
                {' '}
                · {formatCOP(inventoryMarginCOP)}
              </span>
            </span>
            <button
              onClick={() => onNavigate('products')}
              className="shrink-0 text-[#059669] font-semibold hover:underline flex items-center gap-0.5"
            >
              Catálogo <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: Oro Fino Puro */}
        <div className="card-float p-3 sm:p-4 lg:p-5 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#727985] leading-tight min-w-0">
              Oro Fino (24K)
            </span>
            <span className="card-icon-sm bg-[#FDE68A] text-[#B45309]">
              <Coins className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[15px] sm:text-xl lg:text-2xl font-bold text-[#20242B] font-mono tabular-nums truncate">
            {formatGrams(totalFineGoldGrams)}
          </p>
          <div className="mt-auto pt-2 border-t border-[#EAECEF] flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#727985]">
            <span className="min-w-0 truncate">Gemas: {formatCarats(totalGemCarats)}</span>
            <button
              onClick={() => onNavigate('metals')}
              className="shrink-0 text-[#059669] font-semibold hover:underline flex items-center gap-0.5"
            >
              Cotización <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Efectivo en Caja */}
        <div className="card-float p-3 sm:p-4 lg:p-5 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#727985] leading-tight min-w-0">
              Gaveta de Caja
            </span>
            <span className="card-icon-sm bg-[#21865B]/10 text-[#21865B]">
              <Landmark className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[15px] sm:text-xl lg:text-2xl font-bold text-[#20242B] font-mono tabular-nums truncate">
            {formatCOP(currentCash)}
          </p>
          <div className="mt-auto pt-2 border-t border-[#EAECEF] flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#727985]">
            <span
              className={`min-w-0 truncate font-semibold ${
                state.currentCashShift?.status === 'ABIERTA'
                  ? 'text-[#21865B]'
                  : 'text-[#D64545]'
              }`}
            >
              {state.currentCashShift?.status === 'ABIERTA'
                ? 'Turno abierto'
                : 'Sin turno'}
            </span>
            <button
              onClick={() => onNavigate('cash')}
              className="shrink-0 text-[#059669] font-semibold hover:underline flex items-center gap-0.5"
            >
              Arqueo <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Alerts & Workshop Pickup Notifications */}
      {readyRepairs.length > 0 && (
        <div className="bg-[#21865B]/10 border border-[#21865B]/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 w-full">
            <span className="card-icon bg-[#21865B] text-white">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#20242B] leading-snug">
                {readyRepairs.length} pieza(s) de clientes listas para entrega en taller
              </p>
              <p className="text-[#727985] truncate">
                {readyRepairs.map((r) => `${r.customerName} (${r.itemDescription})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('repairs')}
            className="self-start sm:self-auto px-3 py-1.5 bg-[#21865B] text-white rounded-lg font-semibold shrink-0"
          >
            Ver Taller & Entregar
          </button>
        </div>
      )}

      {/* 4. Two Column Responsive Split: Precious Metals Board + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        {/* Precious Metals Live Board */}
        <div className="card-float p-3.5 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EAECEF]">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#20242B] truncate">
                Pizarra de Oro & Metales Preciosos
              </h2>
              <p className="text-[11px] sm:text-xs text-[#727985] truncate">
                Tasas oficiales por gramo · liquidación en mostrador
              </p>
            </div>
            <button
              onClick={() => onNavigate('metals')}
              className="shrink-0 text-[11px] sm:text-xs font-semibold text-[#059669] hover:underline"
            >
              Calculadora
            </button>
          </div>

          {/* Precios REALES de hoy, con color propio que resalta */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="metal-rate-gold p-2.5 sm:p-3.5 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate">
                    Oro 24K
                  </span>
                </span>
                <span className="shrink-0 text-[8px] sm:text-[9px] font-bold uppercase bg-white/70 border border-[#F59E0B]/50 rounded px-1 py-0.5">
                  {ratesAreOfficial ? 'BanRep' : 'Ref.'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide opacity-75">
                  Venta por gramo
                </span>
                <span className="block font-mono font-extrabold text-base sm:text-xl tabular-nums leading-tight truncate">
                  {formatCOP(officialRates.metales.oro.venta)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-white/70 pt-1.5 text-[10px] sm:text-[11px] font-semibold">
                <span className="opacity-75">Compra</span>
                <span className="font-mono font-bold tabular-nums truncate">
                  {formatCOP(officialRates.metales.oro.compra)}
                </span>
              </div>
            </div>

            <div className="metal-rate-silver p-2.5 sm:p-3.5 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Disc className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate">
                    Plata 925
                  </span>
                </span>
                <span className="shrink-0 text-[8px] sm:text-[9px] font-bold uppercase bg-white/70 border border-[#94A3B8]/60 rounded px-1 py-0.5">
                  {ratesAreOfficial ? 'BanRep' : 'Ref.'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide opacity-75">
                  Venta por gramo
                </span>
                <span className="block font-mono font-extrabold text-base sm:text-xl tabular-nums leading-tight truncate">
                  {formatCOP(officialRates.metales.plata.venta)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-white/70 pt-1.5 text-[10px] sm:text-[11px] font-semibold">
                <span className="opacity-75">Compra</span>
                <span className="font-mono font-bold tabular-nums truncate">
                  {formatCOP(officialRates.metales.plata.compra)}
                </span>
              </div>
            </div>
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-[#727985]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            <span className="font-semibold text-[#20242B]">
              {ratesAreOfficial
                ? 'Banco de la República'
                : officialRates.fuente}
            </span>
            {officialRates.vigencia.texto && (
              <span>· Vig. {officialRates.vigencia.texto}</span>
            )}
          </p>

          <div className="divide-y divide-[#EAECEF]">
            {state.metalPrices
              .filter((m) => m.code !== 'ORO_24K' && m.code !== 'PLATA_925')
              .map((m) => (
                <div
                  key={m.code}
                  className="py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#20242B] truncate">{m.name}</p>
                    <p className="text-[10px] text-[#727985] truncate">
                      Ley {m.fineness} ({m.karatText})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <div>
                      <span className="text-[9px] text-[#727985] block uppercase font-semibold">
                        Compra
                      </span>
                      <span className="font-mono font-semibold text-[#20242B] tabular-nums text-[11px]">
                        {formatCOP(m.buyPriceGramCOP)}
                      </span>
                    </div>
                    <div className="bg-[#10B981]/10 rounded-lg px-1.5 py-1">
                      <span className="text-[9px] text-[#059669] block uppercase font-semibold">
                        Venta
                      </span>
                      <span className="font-mono font-bold text-[#059669] tabular-nums text-[11px]">
                        {formatCOP(m.sellPriceGramCOP)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Sales with Quick Receipt View */}
        <div className="card-float p-3.5 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EAECEF]">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#20242B] truncate">
                Últimas Facturas Emitidas
              </h2>
              <p className="text-[11px] sm:text-xs text-[#727985] truncate">
                Registro transaccional de ventas
              </p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="shrink-0 text-[11px] sm:text-xs font-semibold text-[#059669] hover:underline"
            >
              Ver Todas
            </button>
          </div>

          <div className="divide-y divide-[#EAECEF]">
            {state.sales.slice(0, 4).map((sale) => {
              const itemImg = sale.items[0]?.imageUrl || getDefaultJewelryImage(sale.items[0]?.category, sale.items[0]?.name);
              return (
                <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={itemImg}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-[#EAECEF] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-[#059669] shrink-0">{sale.invoiceNumber}</span>
                        <span className="text-[#727985] shrink-0">·</span>
                        <span className="font-medium text-[#20242B] truncate">{sale.customerName}</span>
                      </div>
                      <p className="text-[11px] text-[#727985] mt-0.5 truncate">
                        {formatDateTime(sale.createdAt)} · {sale.items.length} joya(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 max-w-[45%]">
                    <span className="font-mono font-bold text-[#20242B] tabular-nums block truncate">
                      {formatCOP(sale.totalCOP)}
                    </span>
                    <span className="text-[10px] block text-[#21865B] font-semibold truncate">
                      {sale.payments.map((p) => paymentLabel(p.method)).join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
