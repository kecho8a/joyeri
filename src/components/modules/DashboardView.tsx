/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Package,
  Coins,
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
  const totalSalesCount = state.sales.length;

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
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#20242B] tracking-tight">
              ¿Qué deseas realizar hoy en {activeBranch.name}?
            </h1>
            <p className="text-xs text-[#727985]">
              Acciones operativas directas con un solo clic
            </p>
          </div>
          <span className="text-xs font-semibold text-[#7F581A] bg-[#9B7028]/10 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Sede: {activeBranch.city}
          </span>
        </div>

        {/* Tasas del día (Banco de la República): etiqueta que se desliza */}
        <MetalRatesLabel />

        {/* Action cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {/* Action 1: Venta POS */}
          <button
            onClick={onOpenSale}
            className="p-3 sm:p-4 rounded-xl border border-[#9B7028]/30 bg-[#9B7028]/5 hover:bg-[#9B7028]/15 active:scale-98 transition-all text-left flex flex-col justify-between group min-h-[90px]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#9B7028] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="font-bold text-xs sm:text-sm text-[#20242B]">Nueva Venta POS</p>
              <p className="text-[10px] text-[#727985] hidden sm:block">Facturar joya en mostrador</p>
            </div>
          </button>

          {/* Action 2: Nueva Joya */}
          <button
            onClick={onOpenProduct}
            className="p-3 sm:p-4 rounded-xl border border-[#EAECEF] bg-white hover:border-[#9B7028] hover:bg-[#F8F9FA] active:scale-98 transition-all text-left flex flex-col justify-between group min-h-[90px]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F4F5F7] text-[#20242B] flex items-center justify-center border border-[#EAECEF] group-hover:bg-[#9B7028]/10 group-hover:text-[#7F581A]">
              <Package className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="font-bold text-xs sm:text-sm text-[#20242B]">+ Ingresar Joya</p>
              <p className="text-[10px] text-[#727985] hidden sm:block">Con cálculo de oro fino</p>
            </div>
          </button>

          {/* Action 3: Recibir en Taller */}
          <button
            onClick={onOpenRepair}
            className="p-3 sm:p-4 rounded-xl border border-[#EAECEF] bg-white hover:border-[#9B7028] hover:bg-[#F8F9FA] active:scale-98 transition-all text-left flex flex-col justify-between group min-h-[90px]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F4F5F7] text-[#20242B] flex items-center justify-center border border-[#EAECEF] group-hover:bg-[#9B7028]/10 group-hover:text-[#7F581A]">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="font-bold text-xs sm:text-sm text-[#20242B]">Recibir en Taller</p>
              <p className="text-[10px] text-[#727985] hidden sm:block">Custodia y pesaje balanza</p>
            </div>
          </button>

          {/* Action 4: Separados */}
          <button
            onClick={() => onNavigate('layaways')}
            className="p-3 sm:p-4 rounded-xl border border-[#EAECEF] bg-white hover:border-[#9B7028] hover:bg-[#F8F9FA] active:scale-98 transition-all text-left flex flex-col justify-between group min-h-[90px]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F4F5F7] text-[#20242B] flex items-center justify-center border border-[#EAECEF] group-hover:bg-[#9B7028]/10 group-hover:text-[#7F581A]">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="font-bold text-xs sm:text-sm text-[#20242B]">Ver Separados</p>
              <p className="text-[10px] text-[#727985] hidden sm:block">Cobrar abonos a clientes</p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Core Financial & Stock KPIs Grid (Clean floating cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Ventas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#727985]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Ventas Facturadas</span>
              <div className="w-7 h-7 rounded-lg bg-[#21865B]/10 text-[#21865B] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#20242B] font-mono mt-2 tabular-nums">
              {formatCOP(totalSalesCOP)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#EAECEF] flex items-center justify-between text-xs text-[#727985]">
            <span>{totalSalesCount} facturas emitidas</span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[#9B7028] font-semibold hover:underline flex items-center gap-0.5"
            >
              Ver <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Inventario Valorizado */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#727985]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Stock Comercial</span>
              <div className="w-7 h-7 rounded-lg bg-[#9B7028]/15 text-[#7F581A] flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#20242B] font-mono mt-2 tabular-nums">
              {formatCOP(totalInventoryRetail)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#EAECEF] flex items-center justify-between text-xs text-[#727985]">
            <span>Costo: {formatCOP(totalInventoryCost)}</span>
            <button
              onClick={() => onNavigate('products')}
              className="text-[#9B7028] font-semibold hover:underline flex items-center gap-0.5"
            >
              Catálogo <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: Oro Fino Puro */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#727985]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Oro Fino (24K)</span>
              <div className="w-7 h-7 rounded-lg bg-[#D99032]/10 text-[#D99032] flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#7F581A] font-mono mt-2 tabular-nums">
              {formatGrams(totalFineGoldGrams)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#EAECEF] flex items-center justify-between text-xs text-[#727985]">
            <span>Gemas: {formatCarats(totalGemCarats)}</span>
            <button
              onClick={() => onNavigate('metals')}
              className="text-[#9B7028] font-semibold hover:underline flex items-center gap-0.5"
            >
              Cotización <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Efectivo en Caja */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#727985]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Gaveta de Caja</span>
              <div className="w-7 h-7 rounded-lg bg-[#3478C6]/10 text-[#3478C6] flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#20242B] font-mono mt-2 tabular-nums">
              {formatCOP(currentCash)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#EAECEF] flex items-center justify-between text-xs text-[#727985]">
            <span className="text-[#21865B] font-semibold">Turno Abierto</span>
            <button
              onClick={() => onNavigate('cash')}
              className="text-[#9B7028] font-semibold hover:underline flex items-center gap-0.5"
            >
              Arqueo <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Alerts & Workshop Pickup Notifications */}
      {readyRepairs.length > 0 && (
        <div className="bg-[#21865B]/10 border border-[#21865B]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#21865B] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[#20242B]">
                {readyRepairs.length} pieza(s) de clientes listas para entrega en taller
              </p>
              <p className="text-[#727985]">
                {readyRepairs.map((r) => `${r.customerName} (${r.itemDescription})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('repairs')}
            className="px-3 py-1.5 bg-[#21865B] text-white rounded-lg font-semibold shrink-0"
          >
            Ver Taller & Entregar
          </button>
        </div>
      )}

      {/* 4. Two Column Responsive Split: Precious Metals Board + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Precious Metals Live Board */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#EAECEF]">
            <div>
              <h2 className="text-sm font-bold text-[#20242B]">
                Pizarra de Oro & Metales Preciosos
              </h2>
              <p className="text-xs text-[#727985]">
                Valores por gramo para liquidación en mostrador
              </p>
            </div>
            <button
              onClick={() => onNavigate('metals')}
              className="text-xs font-semibold text-[#9B7028] hover:underline"
            >
              Calculadora & Pizarra
            </button>
          </div>

          <div className="divide-y divide-[#EAECEF]">
            {state.metalPrices.slice(0, 5).map((m) => (
              <div
                key={m.code}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-[#20242B]">{m.name}</p>
                  <p className="text-[11px] text-[#727985]">Ley {m.fineness} ({m.karatText})</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-[#727985] block">Compra Retal</span>
                    <span className="font-mono font-semibold text-[#20242B] tabular-nums">
                      {formatCOP(m.buyPriceGramCOP)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7F581A] block font-semibold">Venta Base</span>
                    <span className="font-mono font-bold text-[#7F581A] tabular-nums">
                      {formatCOP(m.sellPriceGramCOP)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales with Quick Receipt View */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#EAECEF]">
            <div>
              <h2 className="text-sm font-bold text-[#20242B]">
                Últimas Facturas Emitidas
              </h2>
              <p className="text-xs text-[#727985]">Registro transaccional de ventas</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-[#9B7028] hover:underline"
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
                        <span className="font-mono font-bold text-[#7F581A] shrink-0">{sale.invoiceNumber}</span>
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
