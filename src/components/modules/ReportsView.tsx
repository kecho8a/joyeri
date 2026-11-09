/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Coins,
  ShieldCheck,
  Users,
  Printer,
  PieChart,
  Scale,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  Clock,
  ArrowUpRight,
  Wallet,
  Landmark,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import {
  formatCOP,
  formatGrams,
  formatCarats,
  formatDate,
  formatDateTime,
  METAL_DEFINITIONS,
} from '../../utils/jewelryCalculations';
import { getDefaultJewelryImage } from '../../utils/jewelryImages';
import {
  calculateProfitAndLoss,
  calculateSellerPerformance,
  matchesTimeFilter,
} from '../../utils/financials';

type ReportTab = 'pyg' | 'metals' | 'sellers' | 'payments' | 'workshop' | 'inventory';
type TimeFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

export const ReportsView: React.FC = () => {
  const state = erpDb.getState();
  const branches = state.branches;

  const [activeTab, setActiveTab] = useState<ReportTab>('pyg');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Filter sales by branch and time
  const filteredSales = useMemo(() => {
    return state.sales.filter((sale) => {
      const matchBranch = selectedBranchId === 'ALL' || sale.branchId === selectedBranchId;
      if (!matchBranch) return false;
      return matchesTimeFilter(sale.createdAt, timeFilter);
    });
  }, [state.sales, selectedBranchId, timeFilter]);

  const filteredReturns = useMemo(() => {
    return state.saleReturns.filter((ret) => {
      const matchBranch = selectedBranchId === 'ALL' || ret.branchId === selectedBranchId;
      if (!matchBranch) return false;
      return matchesTimeFilter(ret.createdAt, timeFilter);
    });
  }, [state.saleReturns, selectedBranchId, timeFilter]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return state.expenses.filter((expense) => {
      const matchBranch = selectedBranchId === 'ALL' || expense.branchId === selectedBranchId;
      if (!matchBranch) return false;
      return matchesTimeFilter(expense.date, timeFilter);
    });
  }, [state.expenses, selectedBranchId, timeFilter]);

  // Financial calculations (VAT-exclusive revenue, net of returns)
  const pnl = useMemo(
    () =>
      calculateProfitAndLoss({
        sales: filteredSales,
        returns: filteredReturns,
        products: state.products,
        employees: state.employees,
        expenses: filteredExpenses,
      }),
    [filteredSales, filteredReturns, state.products, state.employees, filteredExpenses]
  );

  const totalGrossSalesCOP = pnl.grossSalesCOP;
  const totalDiscountsCOP = pnl.discountsCOP;
  const totalVatCOP = pnl.vatCOP;
  const totalCostCOP = pnl.cogsCOP;
  const grossProfitCOP = pnl.grossProfitCOP;
  const grossMarginPercent = pnl.grossMarginPercent.toFixed(1);
  const totalExpensesCOP = pnl.expensesCOP;
  const totalCommissionsCOP = pnl.commissionsCOP;
  const netOperatingIncomeCOP = pnl.netOperatingIncomeCOP;
  const totalBilledCOP = filteredSales
    .filter((sale) => sale.status !== 'ANULADA')
    .reduce((acc, sale) => acc + sale.totalCOP, 0);

  // Inventory & Metals calculations
  const filteredProducts = useMemo(() => {
    return state.products.filter((p) => {
      return selectedBranchId === 'ALL' || p.branchId === selectedBranchId;
    });
  }, [state.products, selectedBranchId]);

  const inventoryAvailable = filteredProducts.filter((p) => p.status === 'DISPONIBLE');
  const totalInventoryRetailValueCOP = inventoryAvailable.reduce((acc, p) => acc + p.salePriceCOP, 0);
  const totalInventoryCostValueCOP = inventoryAvailable.reduce((acc, p) => acc + p.totalCostCOP, 0);

  const totalFineGold24KGrams = inventoryAvailable
    .filter((p) => p.metalType.startsWith('ORO'))
    .reduce((acc, p) => acc + p.fineMetalContentGrams, 0);

  const totalFineSilverGrams = inventoryAvailable
    .filter((p) => p.metalType === 'PLATA_925')
    .reduce((acc, p) => acc + p.fineMetalContentGrams, 0);

  const totalGrossWeightGrams = inventoryAvailable.reduce((acc, p) => acc + p.grossWeightGrams, 0);

  // Metal valuation at current market prices
  const priceGold24K = state.metalPrices.find((m) => m.code === 'ORO_24K')?.sellPriceGramCOP || 425000;
  const priceSilver = state.metalPrices.find((m) => m.code === 'PLATA_925')?.sellPriceGramCOP || 28000;
  const totalMetalMarketValueCOP = Math.round(
    totalFineGold24KGrams * priceGold24K + totalFineSilverGrams * priceSilver
  );

  // Sellers Performance Breakdown (commission on net revenue before VAT)
  const sellerStats = useMemo(
    () =>
      calculateSellerPerformance({
        sales: filteredSales,
        returns: filteredReturns,
        employees: state.employees,
      }),
    [filteredSales, filteredReturns, state.employees]
  );

  // Payment Methods Breakdown
  const paymentStats = useMemo(() => {
    const stats: Record<string, { count: number; totalCOP: number }> = {
      EFECTIVO: { count: 0, totalCOP: 0 },
      TARJETA_DEBITO: { count: 0, totalCOP: 0 },
      TARJETA_CREDITO: { count: 0, totalCOP: 0 },
      TRANSFERENCIA_BANCOLOMBIA: { count: 0, totalCOP: 0 },
      WOMPI_QR: { count: 0, totalCOP: 0 },
      OTRO: { count: 0, totalCOP: 0 },
    };

    filteredSales.forEach((sale) => {
      sale.payments.forEach((p) => {
        const key = stats[p.method] ? p.method : 'OTRO';
        stats[key].count += 1;
        stats[key].totalCOP += p.amountCOP;
      });
    });

    return stats;
  }, [filteredSales]);

  // Workshop & Manufacturing Statistics
  const workshopStats = useMemo(() => {
    const totalOrders = state.manufacturingOrders.length;
    const reconciled = state.manufacturingOrders.filter((o) => o.status === 'CONCILIADA');
    const totalDeliveredGrams = state.manufacturingOrders.reduce((acc, o) => {
      return acc + o.materialsDelivered.reduce((sum, m) => sum + m.weightGrams, 0);
    }, 0);
    const totalFinishedGrams = reconciled.reduce((acc, o) => acc + (o.finishedProductWeightGrams || 0), 0);
    const totalScrapGrams = reconciled.reduce((acc, o) => acc + (o.scrapReturnedGrams || 0), 0);
    const totalLossGrams = reconciled.reduce((acc, o) => acc + (o.netWeightDifferenceGrams || 0), 0);
    const lossPercentage = totalDeliveredGrams > 0 ? ((totalLossGrams / totalDeliveredGrams) * 100).toFixed(2) : '0';

    return {
      totalOrders,
      reconciledOrders: reconciled.length,
      totalDeliveredGrams,
      totalFinishedGrams,
      totalScrapGrams,
      totalLossGrams,
      lossPercentage,
    };
  }, [state.manufacturingOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    
    if (activeTab === 'pyg') {
      csv += 'REPORTE FINANCIERO Y P&G - JOYERI ERP\n';
      csv += `Fecha Emisión,"${new Date().toLocaleString()}"\n`;
      csv += `Sede,"${selectedBranchId}"\n\n`;
      csv += 'Factura,Fecha,Cliente,Documento,Sede,Subtotal Base COP,IVA 19% COP,Descuento COP,Total Factura COP\n';
      filteredSales.forEach((s) => {
        csv += `"${s.invoiceNumber}","${s.createdAt}","${s.customerName}","${s.customerDoc}","${s.branchId}",${s.subtotalCOP},${s.vatCOP},${s.discountTotalCOP},${s.totalCOP}\n`;
      });
    } else if (activeTab === 'metals') {
      csv += 'BALANCE EXACTO DE METALES Y BOVEDA - JOYERI ERP\n\n';
      csv += 'SKU,Joya,Categoria,Metal,Ley,Peso Bruto (g),Peso Neto Metal (g),Oro Fino 24K (g),Costo Total COP,Precio Venta COP,Ubicacion,Estado\n';
      filteredProducts.forEach((p) => {
        csv += `"${p.sku}","${p.name}","${p.category}","${p.metalType}",${p.fineness},${p.grossWeightGrams},${p.netMetalWeightGrams},${p.fineMetalContentGrams},${p.totalCostCOP},${p.salePriceCOP},"${p.locationInStore}","${p.status}"\n`;
      });
    } else if (activeTab === 'sellers') {
      csv += 'RENDIMIENTO DE ASESORES Y COMISIONES - JOYERI ERP\n\n';
      csv += 'Asesor,Ventas Realizadas,Piezas Vendidas,Total Ventas COP,Comision Liquidada COP\n';
      sellerStats.forEach((s) => {
        csv += `"${s.name}",${s.salesCount},${s.itemsCount},${s.totalSalesCOP},${s.commissionEarnedCOP}\n`;
      });
    } else {
      csv += 'KARDEX DE INVENTARIO VALORIZADO - JOYERI ERP\n\n';
      csv += 'SKU,Nombre,Categoria,Sede,Ubicacion,Estado,Costo Total COP,Precio Venta COP\n';
      filteredProducts.forEach((p) => {
        csv += `"${p.sku}","${p.name}","${p.category}","${p.branchId}","${p.locationInStore}","${p.status}",${p.totalCostCOP},${p.salePriceCOP}\n`;
      });
    }

    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `reporte_joyeri_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Controls */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#21865B] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
              Control Total de la Tienda & Auditoría
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#20242B] tracking-tight mt-0.5">
            Informes Gerenciales & Métricas Exactas
          </h1>
          <p className="text-xs text-[#727985] mt-0.5">
            Consolidado en tiempo real de ventas, inventario fino 24K, balance P&G, nómina y mermas
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Branch filter */}
          <div className="flex items-center gap-1.5 bg-[#F4F5F7] px-3 py-1.5 rounded-xl border border-[#EAECEF] text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-[#727985]" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent focus:outline-none text-[#20242B] cursor-pointer"
            >
              <option value="ALL">Todas las Sedes (Consolidado)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          {/* Time filter */}
          <div className="flex items-center gap-1.5 bg-[#F4F5F7] px-3 py-1.5 rounded-xl border border-[#EAECEF] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#727985]" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="bg-transparent focus:outline-none text-[#20242B] cursor-pointer"
            >
              <option value="ALL">Todo el Histórico</option>
              <option value="TODAY">Hoy</option>
              <option value="WEEK">Últimos 7 Días</option>
              <option value="MONTH">Este Mes (Marzo 2026)</option>
              <option value="YEAR">Año 2026</option>
            </select>
          </div>

          {/* Print & CSV buttons */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#20242B] text-xs font-semibold transition-colors"
              title="Imprimir informe gerencial"
            >
              <Printer className="w-3.5 h-3.5 text-[#727985]" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.02)] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pyg')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'pyg'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>P&G y Ventas Netas</span>
        </button>

        <button
          onClick={() => setActiveTab('metals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'metals'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Bóveda & Oro Fino 24K</span>
        </button>

        <button
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'sellers'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Asesores & Comisiones</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Medios de Pago & Caja</span>
        </button>

        <button
          onClick={() => setActiveTab('workshop')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'workshop'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Taller & Control de Mermas</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'inventory'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Kárdex & Stock Físico</span>
        </button>
      </div>

      {/* 3. TAB 1: P&G Y VENTAS NETAS */}
      {activeTab === 'pyg' && (
        <div className="space-y-4">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider">Ventas Brutas Facturadas</span>
                <span className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#059669]">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-[#20242B] font-mono mt-2 tabular-nums">
                {formatCOP(totalBilledCOP)}
              </p>
              <div className="flex justify-between items-center text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF]">
                <span>{filteredSales.length} transacciones</span>
                <span>Desc: {formatCOP(totalDiscountsCOP)}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider">Costo Mercancía (COGS)</span>
                <span className="p-1.5 rounded-lg bg-[#727985]/10 text-[#727985]">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-[#727985] font-mono mt-2 tabular-nums">
                {formatCOP(totalCostCOP)}
              </p>
              <div className="flex justify-between items-center text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF]">
                <span>Metal puro + Hechura + Gemas</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#21865B] font-bold uppercase tracking-wider">Utilidad Bruta Comercial</span>
                <span className="p-1.5 rounded-lg bg-[#21865B]/10 text-[#21865B]">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-[#21865B] font-mono mt-2 tabular-nums">
                {formatCOP(grossProfitCOP)}
              </p>
              <div className="flex justify-between items-center text-[10px] text-[#21865B] mt-1 pt-2 border-t border-[#EAECEF] font-semibold">
                <span>Margen Bruto Real:</span>
                <span>{grossMarginPercent}%</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">Utilidad Neta (EBITDA)</span>
                <span className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#059669]">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-[#059669] font-mono mt-2 tabular-nums">
                {formatCOP(netOperatingIncomeCOP)}
              </p>
              <div className="flex justify-between items-center text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF]">
                <span>Gastos Op: {formatCOP(totalExpensesCOP)}</span>
                <span>IVA: {formatCOP(totalVatCOP)}</span>
              </div>
            </div>
          </div>

          {/* Visual Profit & Loss Breakdown Statement */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAECEF] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#20242B]">
                  Estado de Resultados Financiero Consolidado (P&G)
                </h3>
                <p className="text-xs text-[#727985]">
                  Estructura contable exacta bajo normas NIIF y normativa fiscal colombiana
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#059669] bg-[#10B981]/10 px-2.5 py-1 rounded-lg">
                Moneda: Pesos Colombianos (COP)
              </span>
            </div>

            <div className="divide-y divide-[#EAECEF] text-xs">
              <div className="py-2.5 flex justify-between items-center font-medium">
                <span className="text-[#20242B] pl-2">(+) Ingresos Brutos por Venta de Joyería (base sin IVA)</span>
                <span className="font-mono font-bold text-base text-[#20242B]">{formatCOP(totalGrossSalesCOP)}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-[#727985]">
                <span className="pl-6">(i) Descuentos comerciales otorgados (ya incluidos en la base)</span>
                <span className="font-mono">{formatCOP(totalDiscountsCOP)}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-[#727985]">
                <span className="pl-6">(-) Devoluciones y Notas Crédito</span>
                <span className="font-mono text-[#D64545]">-{formatCOP(pnl.returnsCOP)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center font-bold bg-[#F8F9FA] px-2 rounded-lg text-[#20242B]">
                <span>(=) Ingresos Operacionales Netos</span>
                <span className="font-mono">{formatCOP(pnl.netRevenueCOP)}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-[#727985]">
                <span className="pl-6">(-) Costo de Venta Mercancía (Oro Fino, Montura y Piedras Preciosas)</span>
                <span className="font-mono text-[#D64545]">-{formatCOP(totalCostCOP)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center font-bold bg-[#21865B]/10 px-2 rounded-lg text-[#21865B]">
                <span>(=) UTILIDAD BRUTA OPERATIVA</span>
                <span className="font-mono text-sm">{formatCOP(grossProfitCOP)} ({grossMarginPercent}%)</span>
              </div>
              <div className="py-2 flex justify-between items-center text-[#727985]">
                <span className="pl-6">(-) Gastos Administrativos, Arriendos & Servicios de Taller</span>
                <span className="font-mono text-[#D64545]">-{formatCOP(totalExpensesCOP)}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-[#727985]">
                <span className="pl-6">(-) Liquidación de Comisiones Comerciales de Venta (sobre ingreso neto sin IVA)</span>
                <span className="font-mono text-[#D64545]">-{formatCOP(totalCommissionsCOP)}</span>
              </div>
              <div className="py-3 flex justify-between items-center font-bold bg-[#10B981]/15 px-3 rounded-xl text-[#059669] text-sm">
                <span>(=) RESULTADO INTEGRAL OPERATIVO ANTES DE IMPUESTOS</span>
                <span className="font-mono text-base">{formatCOP(netOperatingIncomeCOP)}</span>
              </div>
            </div>
          </div>

          {/* Sales Transactions Detail */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-[#EAECEF] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#20242B]">
                Registro Detallado de Facturación ({filteredSales.length} comprobantes)
              </h3>
              <span className="text-xs text-[#727985]">
                Total: <strong className="font-mono text-[#059669]">{formatCOP(totalBilledCOP)}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#727985] font-semibold border-b border-[#EAECEF]">
                  <tr>
                    <th className="py-2.5 px-3">Factura</th>
                    <th className="py-2.5 px-3">Fecha & Sede</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Joyas Vendidas</th>
                    <th className="py-2.5 px-3 text-right">Subtotal Base</th>
                    <th className="py-2.5 px-3 text-right">IVA (19%)</th>
                    <th className="py-2.5 px-3 text-right">Total Factura</th>
                    <th className="py-2.5 px-3">Medio de Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECEF] text-[#20242B]">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8F9FA]/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#059669]">{s.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-[#727985]">
                        <span className="block text-[#20242B] font-medium">{formatDate(s.createdAt)}</span>
                        <span className="text-[10px] text-[#727985]">
                          {branches.find((b) => b.id === s.branchId)?.name || s.branchId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold block">{s.customerName}</span>
                        <span className="text-[10px] text-[#727985]">{s.customerDoc}</span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <div className="flex items-center gap-2">
                          {s.items[0]?.imageUrl && (
                            <img
                              src={s.items[0].imageUrl}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover shrink-0 border border-[#EAECEF]"
                            />
                          )}
                          <span className="truncate block font-medium">
                            {s.items.map((i) => i.name).join(', ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">{formatCOP(s.subtotalCOP)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">{formatCOP(s.vatCOP)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#20242B] tabular-nums">
                        {formatCOP(s.totalCOP)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold bg-[#F4F5F7] px-2 py-0.5 rounded text-[#20242B]">
                          {s.payments.map((p) => p.method).join(' + ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#727985]">
                        No se registraron ventas en el período o sede seleccionada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: METALES Y BOVEDA (ORO FINO 24K Y PLATA 925) */}
      {activeTab === 'metals' && (
        <div className="space-y-4">
          {/* Top Metal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider">Oro Fino Puro 24K en Bóveda</span>
                <span className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#059669]">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#059669] font-mono mt-2 tabular-nums">
                {formatGrams(totalFineGold24KGrams)}
              </p>
              <div className="text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF] flex justify-between">
                <span>Precio Fix: {formatCOP(priceGold24K)}/g</span>
                <span className="font-semibold text-[#20242B]">
                  {formatCOP(Math.round(totalFineGold24KGrams * priceGold24K))}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#3478C6] font-bold uppercase tracking-wider">Plata Fina 925 en Stock</span>
                <span className="p-1.5 rounded-lg bg-[#3478C6]/10 text-[#3478C6]">
                  <Scale className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#3478C6] font-mono mt-2 tabular-nums">
                {formatGrams(totalFineSilverGrams)}
              </p>
              <div className="text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF] flex justify-between">
                <span>Precio Gramo: {formatCOP(priceSilver)}/g</span>
                <span className="font-semibold text-[#20242B]">
                  {formatCOP(Math.round(totalFineSilverGrams * priceSilver))}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider">Peso Físico Total en Balanzas</span>
                <span className="p-1.5 rounded-lg bg-[#F4F5F7] text-[#20242B]">
                  <Scale className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#20242B] font-mono mt-2 tabular-nums">
                {formatGrams(totalGrossWeightGrams)}
              </p>
              <div className="text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF]">
                <span>{inventoryAvailable.length} piezas en vitrinas y cajas fuertes</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#21865B] font-bold uppercase tracking-wider">Valorización de Metales SPOT</span>
                <span className="p-1.5 rounded-lg bg-[#21865B]/10 text-[#21865B]">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-[#21865B] font-mono mt-2 tabular-nums">
                {formatCOP(totalMetalMarketValueCOP)}
              </p>
              <div className="text-[10px] text-[#727985] mt-1 pt-2 border-t border-[#EAECEF] flex justify-between">
                <span>Costo Adquisición:</span>
                <span className="font-mono font-semibold">{formatCOP(totalInventoryCostValueCOP)}</span>
              </div>
            </div>
          </div>

          {/* Metal Matrix Table */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-[#EAECEF] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#20242B]">
                  Matriz de Existencias por Tipo de Aleación y Ley
                </h3>
                <p className="text-xs text-[#727985]">
                  Fórmula oficial: Peso Neto de Metal × Ley Milésimas = Contenido Fino de Metal Puro
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#727985] font-semibold border-b border-[#EAECEF]">
                  <tr>
                    <th className="py-2.5 px-3">Aleación / Metal</th>
                    <th className="py-2.5 px-3">Ley Oficial</th>
                    <th className="py-2.5 px-3 text-center">Piezas en Stock</th>
                    <th className="py-2.5 px-3 text-right">Peso Bruto Total</th>
                    <th className="py-2.5 px-3 text-right">Peso Neto Metal</th>
                    <th className="py-2.5 px-3 text-right text-[#059669]">Metal Fino Puro</th>
                    <th className="py-2.5 px-3 text-right">Precio Mercado Gramo</th>
                    <th className="py-2.5 px-3 text-right">Valorización Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECEF] text-[#20242B]">
                  {(['ORO_18K_NACIONAL', 'ORO_18K_ITALIANO', 'ORO_24K', 'ORO_14K', 'PLATA_925'] as const).map((metal) => {
                    const mDef = METAL_DEFINITIONS[metal];
                    const prods = inventoryAvailable.filter((p) => p.metalType === metal);
                    const gross = prods.reduce((acc, p) => acc + p.grossWeightGrams, 0);
                    const net = prods.reduce((acc, p) => acc + p.netMetalWeightGrams, 0);
                    const fine = prods.reduce((acc, p) => acc + p.fineMetalContentGrams, 0);
                    const priceGram = state.metalPrices.find((m) => m.code === metal)?.sellPriceGramCOP || 330000;
                    const valuation = Math.round(fine * priceGram);

                    return (
                      <tr key={metal} className="hover:bg-[#F8F9FA]/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#20242B]">{mDef?.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[#727985]">{mDef?.fineness.toFixed(3)} ({mDef?.karatText})</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{prods.length}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">{formatGrams(gross)}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatGrams(net)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#059669] tabular-nums">
                          {formatGrams(fine)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">{formatCOP(priceGram)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#20242B] tabular-nums">
                          {formatCOP(valuation)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: ASESORES Y COMISIONES */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="font-bold text-sm text-[#20242B]">
              Rendimiento Comercial & Liquidación de Comisiones de Joyería
            </h3>
            <p className="text-xs text-[#727985]">
              Cálculo de metas comerciales por asesor, ticket promedio y comisión liquidable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerStats.map((seller) => {
              const emp = state.employees.find((e) => e.name === seller.name);
              const commRate = emp ? emp.commissionRatePercent : 2.5;
              const ticketAverage = seller.salesCount > 0 ? Math.round(seller.totalSalesCOP / seller.salesCount) : 0;

              return (
                <div
                  key={seller.name}
                  className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#059669] flex items-center justify-center font-bold text-sm">
                      {seller.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#20242B]">{seller.name}</h4>
                      <p className="text-[11px] text-[#727985]">{emp?.roleTitle || 'Asesor de Ventas'}</p>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] rounded-xl p-3 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[#727985]">
                      <span>Ventas Totales:</span>
                      <span className="font-bold text-[#20242B]">{formatCOP(seller.totalSalesCOP)}</span>
                    </div>
                    <div className="flex justify-between text-[#727985]">
                      <span>Operaciones / Joyas:</span>
                      <span className="text-[#20242B]">{seller.salesCount} ventas ({seller.itemsCount} piezas)</span>
                    </div>
                    <div className="flex justify-between text-[#727985]">
                      <span>Ticket Promedio:</span>
                      <span className="text-[#20242B]">{formatCOP(ticketAverage)}</span>
                    </div>
                    <div className="flex justify-between text-[#727985]">
                      <span>Tasa Comisión Pactada:</span>
                      <span className="text-[#10B981] font-bold">{commRate}%</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#EAECEF] text-sm text-[#21865B] font-bold">
                      <span>COMISIÓN A LIQUIDAR:</span>
                      <span>{formatCOP(seller.commissionEarnedCOP)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TAB 4: MEDIOS DE PAGO Y CAJA */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(paymentStats).map(([method, data]) => {
              const percent = totalBilledCOP > 0 ? ((data.totalCOP / totalBilledCOP) * 100).toFixed(1) : '0';
              return (
                <div
                  key={method}
                  className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#20242B]">{method.replace('_', ' ')}</span>
                    <span className="font-mono text-[#059669] bg-[#10B981]/10 px-2 py-0.5 rounded text-[10px] font-bold">
                      {percent}%
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-[#20242B]">{formatCOP(data.totalCOP)}</p>
                  <p className="text-[11px] text-[#727985]">{data.count} operaciones registradas</p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-[#F4F5F7] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-[#10B981] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, parseFloat(percent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Cash Shift Status */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between border-b border-[#EAECEF] pb-3">
              <div>
                <h4 className="font-bold text-sm text-[#20242B]">
                  Estado Actual de Caja de Seguridad ({state.currentCashShift.shiftNumber})
                </h4>
                <p className="text-xs text-[#727985]">
                  Cajero responsable: {state.currentCashShift.cashierName} · Sede: {state.currentCashShift.branchId}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#21865B]/10 text-[#21865B]">
                {state.currentCashShift.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
              <div className="bg-[#F8F9FA] p-3 rounded-xl">
                <span className="text-[#727985] block text-[10px]">Base Inicial Efectivo</span>
                <span className="font-bold text-base text-[#20242B]">
                  {formatCOP(state.currentCashShift.initialCashCOP)}
                </span>
              </div>
              <div className="bg-[#F8F9FA] p-3 rounded-xl">
                <span className="text-[#727985] block text-[10px]">Ventas Efectivo Hoy</span>
                <span className="font-bold text-base text-[#21865B]">
                  {formatCOP(state.currentCashShift.cashSalesCOP)}
                </span>
              </div>
              <div className="bg-[#F8F9FA] p-3 rounded-xl">
                <span className="text-[#727985] block text-[10px]">Egresos / Gastos Menores</span>
                <span className="font-bold text-base text-[#D64545]">
                  -{formatCOP(state.currentCashShift.cashExpensesCOP)}
                </span>
              </div>
              <div className="bg-[#10B981]/10 p-3 rounded-xl">
                <span className="text-[#059669] block text-[10px] font-bold">Efectivo Esperado en Gaveta</span>
                <span className="font-bold text-base text-[#059669]">
                  {formatCOP(state.currentCashShift.expectedCashCOP)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: TALLER Y CONTROL DE MERMAS */}
      {activeTab === 'workshop' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider block">Órdenes de Hechura</span>
              <p className="text-xl font-bold font-mono text-[#20242B] mt-1">{workshopStats.totalOrders}</p>
              <span className="text-[10px] text-[#21865B]">{workshopStats.reconciledOrders} conciliadas con balanza</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider block">Materia Prima Entregada</span>
              <p className="text-xl font-bold font-mono text-[#20242B] mt-1">{formatGrams(workshopStats.totalDeliveredGrams)}</p>
              <span className="text-[10px] text-[#727985]">Oro 18K y plata en granalla</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#21865B] font-bold uppercase tracking-wider block">Joya + Retales Recuperados</span>
              <p className="text-xl font-bold font-mono text-[#21865B] mt-1">
                {formatGrams(workshopStats.totalFinishedGrams + workshopStats.totalScrapGrams)}
              </p>
              <span className="text-[10px] text-[#727985]">Retal devuelto: {formatGrams(workshopStats.totalScrapGrams)}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider block">Merma Media de Fundición</span>
              <p className="text-xl font-bold font-mono text-[#059669] mt-1">{workshopStats.lossPercentage}%</p>
              <span className="text-[10px] text-[#21865B]">Tolerancia permitida: ≤ 5.0%</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-[#EAECEF]">
              <h3 className="font-bold text-sm text-[#20242B]">
                Trazabilidad Detallada de Órdenes de Fundición y Orfebrería
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#727985] font-semibold border-b border-[#EAECEF]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Diseño</th>
                    <th className="py-2.5 px-3">Orfebre Responsable</th>
                    <th className="py-2.5 px-3 text-right">Oro Entregado</th>
                    <th className="py-2.5 px-3 text-right">Joya Terminada</th>
                    <th className="py-2.5 px-3 text-right">Retal Devuelto</th>
                    <th className="py-2.5 px-3 text-right text-[#059669]">Merma Neta</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECEF] text-[#20242B]">
                  {state.manufacturingOrders.map((ord) => {
                    const delivered = ord.materialsDelivered.reduce((sum, m) => sum + m.weightGrams, 0);
                    return (
                      <tr key={ord.id} className="hover:bg-[#F8F9FA]/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#059669]">{ord.code}</td>
                        <td className="py-2.5 px-3 font-semibold">{ord.designName}</td>
                        <td className="py-2.5 px-3 text-[#727985]">{ord.artisanName}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatGrams(delivered)}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {ord.finishedProductWeightGrams ? formatGrams(ord.finishedProductWeightGrams) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {ord.scrapReturnedGrams ? formatGrams(ord.scrapReturnedGrams) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#059669] tabular-nums">
                          {ord.netWeightDifferenceGrams ? formatGrams(ord.netWeightDifferenceGrams) : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              ord.status === 'CONCILIADA'
                                ? 'bg-[#21865B]/10 text-[#21865B]'
                                : 'bg-[#DC2626]/10 text-[#DC2626]'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 6: KARDEX Y STOCK FISICO CON IMAGENES */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider block">Total Valor Comercial en Vitrinas</span>
              <p className="text-xl font-bold font-mono text-[#20242B] mt-1">{formatCOP(totalInventoryRetailValueCOP)}</p>
              <span className="text-[10px] text-[#21865B]">Precio venta sugerido con IVA</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#727985] font-bold uppercase tracking-wider block">Costo de Inversión en Stock</span>
              <p className="text-xl font-bold font-mono text-[#727985] mt-1">{formatCOP(totalInventoryCostValueCOP)}</p>
              <span className="text-[10px] text-[#727985]">Costo adquisición metales y orfebrería</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider block">Margen Potencial Global</span>
              <p className="text-xl font-bold font-mono text-[#059669] mt-1">
                {totalInventoryRetailValueCOP > 0
                  ? (((totalInventoryRetailValueCOP - totalInventoryCostValueCOP) / totalInventoryRetailValueCOP) * 100).toFixed(1)
                  : '0'}%
              </p>
              <span className="text-[10px] text-[#727985]">Plusvalía sobre stock físico</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-[#EAECEF] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#20242B]">
                Kárdex Físico de Joyería ({filteredProducts.length} registros)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#727985] font-semibold border-b border-[#EAECEF]">
                  <tr>
                    <th className="py-2.5 px-3">Joya & Foto</th>
                    <th className="py-2.5 px-3">SKU & Ref</th>
                    <th className="py-2.5 px-3">Sede & Ubicación</th>
                    <th className="py-2.5 px-3 text-right">Peso Neto</th>
                    <th className="py-2.5 px-3 text-right text-[#059669]">Oro 24K Fino</th>
                    <th className="py-2.5 px-3 text-right">Costo Total</th>
                    <th className="py-2.5 px-3 text-right">Precio Venta</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECEF] text-[#20242B]">
                  {filteredProducts.map((p) => {
                    const img = p.imageUrl || getDefaultJewelryImage(p.category, p.name);
                    return (
                      <tr key={p.id} className="hover:bg-[#F8F9FA]/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={img}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#EAECEF] shrink-0"
                            />
                            <div>
                              <span className="font-bold text-[#20242B] block line-clamp-1">{p.name}</span>
                              <span className="text-[10px] text-[#727985]">{p.category} · {p.metalType}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-bold text-[#059669] block">{p.sku}</span>
                          <span className="text-[10px] text-[#727985]">{p.reference}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[#727985]">
                          <span className="text-[#20242B] font-medium block">
                            {branches.find((b) => b.id === p.branchId)?.name || p.branchId}
                          </span>
                          <span className="text-[10px]">{p.locationInStore}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatGrams(p.netMetalWeightGrams)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#059669] tabular-nums">
                          {formatGrams(p.fineMetalContentGrams)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">{formatCOP(p.totalCostCOP)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#20242B] tabular-nums">
                          {formatCOP(p.salePriceCOP)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              p.status === 'DISPONIBLE'
                                ? 'bg-[#21865B]/10 text-[#21865B]'
                                : p.status === 'RESERVADO'
                                ? 'bg-[#DC2626]/10 text-[#DC2626]'
                                : 'bg-[#727985]/10 text-[#727985]'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
