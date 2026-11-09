/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  FileSpreadsheet,
  X,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import {
  Sale,
  AccountingEntry,
  PaymentMethod,
  ProductStatus,
} from '../../types';
import {
  formatCOP,
  formatGrams,
  formatDateTime,
  formatDate,
} from '../../utils/jewelryCalculations';

export const SalesView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [inspectAccounting, setInspectAccounting] = useState<AccountingEntry | null>(null);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnProductIds, setReturnProductIds] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('EFECTIVO');
  const [returnStockCondition, setReturnStockCondition] = useState<ProductStatus>('DISPONIBLE');

  const filteredSales = state.sales.filter((s) => {
    return (
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.warrantyCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenAccounting = (voucherNum: string) => {
    const entry = state.accountingEntries.find((e) => e.voucherNumber === voucherNum);
    if (entry) {
      setInspectAccounting(entry);
    } else {
      alert('Comprobante contable no encontrado');
    }
  };

  const getReturnedProductIds = (sale: Sale): Set<string> => {
    return new Set(
      state.saleReturns
        .filter((ret) => ret.saleId === sale.id)
        .flatMap((ret) => ret.items.map((item) => item.productId))
    );
  };

  const openReturnModal = (sale: Sale) => {
    const alreadyReturned = getReturnedProductIds(sale);
    const remaining = sale.items.filter((item) => !alreadyReturned.has(item.productId));
    if (remaining.length === 0) {
      alert('Todas las joyas de esta factura ya fueron devueltas.');
      return;
    }
    setReturnSale(sale);
    setReturnProductIds(remaining.map((item) => item.productId));
    setReturnReason('');
    setRefundMethod('EFECTIVO');
    setReturnStockCondition('DISPONIBLE');
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSale) return;
    if (returnProductIds.length === 0) {
      alert('Seleccione al menos una joya para devolver.');
      return;
    }
    if (!returnReason.trim()) {
      alert('Registre el motivo de la devolución o anulación.');
      return;
    }
    try {
      const creditNote = erpDb.registerSaleReturn({
        saleId: returnSale.id,
        productIds: returnProductIds,
        reason: returnReason.trim(),
        refundMethod,
        stockCondition: returnStockCondition,
      });
      setReturnSale(null);
      alert(
        `Nota Crédito ${creditNote.creditNoteNumber} registrada por ${formatCOP(creditNote.totalCOP)}. La joya volvió a inventario (${returnStockCondition}).`
      );
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleVoidSale = () => {
    if (!returnSale) return;
    if (!returnReason.trim()) {
      alert('Registre el motivo de la anulación.');
      return;
    }
    if (!confirm('Se anulará la factura completa: devolución de todas las joyas a inventario, nota crédito y reembolso. ¿Continuar?')) return;
    try {
      const creditNote = erpDb.voidSale(returnSale.id, returnReason.trim(), refundMethod);
      setReturnSale(null);
      alert(
        `Factura anulada. Nota Crédito ${creditNote.creditNoteNumber} por ${formatCOP(creditNote.totalCOP)}.`
      );
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const selectedSaleCost = selectedSale
    ? selectedSale.items.reduce((acc, item) => {
        const product = state.products.find((p) => p.id === item.productId);
        return acc + (product ? product.totalCostCOP * item.quantity : 0);
      }, 0)
    : 0;
  const selectedSaleCostsKnown = selectedSale
    ? selectedSale.items.every((item) =>
        state.products.some((p) => p.id === item.productId)
      )
    : false;
  const selectedSaleMargin = selectedSale
    ? selectedSale.subtotalCOP - selectedSaleCost
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Historial de Ventas & Comprobantes Internos
          </h1>
          <p className="text-xs text-[#727985]">
            Registro correlativo de ventas, comprobantes internos, cuentas afectadas y garantías
          </p>
        </div>
        <div className="text-xs bg-[#F4F5F7] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium text-[#20242B]">
          Total Facturado: <strong className="font-mono text-[#059669]">{formatCOP(state.sales.filter((s) => s.status !== 'ANULADA').reduce((acc, s) => acc + s.totalCOP, 0))}</strong>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número de factura, cliente o cédula..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB] select-none">
              <tr>
                <th className="py-2.5 px-3">No. Factura</th>
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Joyas Vendidas</th>
                <th className="py-2.5 px-3 text-right">Subtotal Base</th>
                <th className="py-2.5 px-3 text-right">IVA (19%)</th>
                <th className="py-2.5 px-3 text-right">Total Factura</th>
                <th className="py-2.5 px-3">Medio de Pago</th>
                <th className="py-2.5 px-3 text-center">Contabilidad</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#20242B]">
                    {s.invoiceNumber}
                    {s.status !== 'PAGADA' && (
                      <span
                        className={`ml-1.5 text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded ${
                          s.status === 'ANULADA' || s.status === 'DEVUELTA_TOTAL'
                            ? 'bg-[#D64545]/10 text-[#D64545]'
                            : 'bg-[#10B981]/10 text-[#059669]'
                        }`}
                      >
                        {s.status === 'DEVUELTA_PARCIAL'
                          ? 'DEV. PARCIAL'
                          : s.status === 'DEVUELTA_TOTAL'
                          ? 'DEVUELTA'
                          : 'ANULADA'}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#727985]">
                    {formatDateTime(s.createdAt)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-[#20242B] block">{s.customerName}</span>
                    <span className="text-[10px] text-[#727985] block">{s.customerDoc}</span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px]">
                    <span className="font-medium text-[#20242B] block truncate">
                      {s.items.map((i) => i.name).join(', ')}
                    </span>
                    <span className="text-[10px] text-[#727985] block">
                      {s.items.length} ítem(s)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">
                    {formatCOP(s.subtotalCOP)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">
                    {formatCOP(s.vatCOP)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#20242B] tabular-nums">
                    {formatCOP(s.totalCOP)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-semibold text-[#20242B] block">
                      {s.payments.map((p) => p.method).join(', ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleOpenAccounting(s.accountingEntryId)}
                      className="px-2 py-0.5 rounded bg-[#F4F5F7] hover:bg-[#E5E7EB] text-[#3478C6] font-mono text-[11px] font-semibold border border-[#E5E7EB]"
                      title="Ver asiento contable de partida doble"
                    >
                      {s.accountingEntryId}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {s.status !== 'ANULADA' && s.status !== 'DEVUELTA_TOTAL' && (
                        <button
                          onClick={() => openReturnModal(s)}
                          className="px-2.5 py-1 rounded bg-[#D64545]/10 text-[#D64545] hover:bg-[#D64545] hover:text-white transition-colors font-semibold text-xs border border-[#D64545]/20"
                        >
                          Devolver
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="px-2.5 py-1 rounded bg-[#10B981]/10 text-[#059669] hover:bg-[#10B981] hover:text-white transition-colors font-semibold text-xs"
                      >
                        Ver Factura
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-[#727985]">
                    No se encontraron registros de ventas coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VIEW INVOICE */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="font-mono text-xs font-bold text-[#059669]">
                  FACTURA: {selectedSale.invoiceNumber}
                </span>
                <h3 className="font-bold text-[#20242B] text-base mt-0.5">
                  Comprobante de Venta JOYERI
                </h3>
                <p className="text-xs text-[#727985]">
                  Fecha: {formatDateTime(selectedSale.createdAt)}
                </p>
                <p className="text-[10px] text-[#727985] mt-1">
                  Comprobante interno de control. No constituye factura
                  electrónica DIAN.
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded text-[#727985] hover:text-[#20242B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-xl border border-[#E5E7EB] text-xs space-y-1">
              <p><strong className="text-[#727985]">Cliente:</strong> {selectedSale.customerName}</p>
              <p><strong className="text-[#727985]">Identificación:</strong> {selectedSale.customerDoc}</p>
              <p><strong className="text-[#727985]">Asesor:</strong> {selectedSale.sellerName}</p>
              <p><strong className="text-[#727985]">Garantía:</strong> {selectedSale.warrantyCode}</p>
            </div>

            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden text-xs">
              <div className="bg-[#F4F5F7] px-3 py-1.5 font-semibold text-[#727985] flex justify-between">
                <span>Detalle de Joyas</span>
                <span>Valor</span>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {selectedSale.items.map((it, idx) => (
                  <div key={idx} className="p-3">
                    <p className="font-semibold text-[#20242B]">{it.name}</p>
                    <p className="text-[11px] text-[#727985]">
                      SKU: {it.sku} · Metal: {it.metalType} · Peso Neto: {formatGrams(it.netMetalWeightGrams)} · Oro Fino: {formatGrams(it.fineMetalContentGrams)}
                    </p>
                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className="text-[#727985]">Precio final</span>
                      <span className="font-mono font-bold text-[#20242B]">{formatCOP(it.finalPriceCOP)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between text-[#727985]">
                <span>Subtotal:</span>
                <span>{formatCOP(selectedSale.subtotalCOP)}</span>
              </div>
              <div className="flex justify-between text-[#727985]">
                <span>IVA (19%):</span>
                <span>{formatCOP(selectedSale.vatCOP)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#20242B] pt-1 border-t border-[#E5E7EB]">
                <span>TOTAL PAGADO:</span>
                <span className="text-[#059669]">{formatCOP(selectedSale.totalCOP)}</span>
              </div>
              {(selectedSale.returnedTotalCOP || 0) > 0 && (
                <div className="flex justify-between text-[#D64545] pt-1 border-t border-[#E5E7EB]">
                  <span>Devuelto (Notas Crédito):</span>
                  <span>-{formatCOP(selectedSale.returnedTotalCOP || 0)}</span>
                </div>
              )}
              {selectedSaleCostsKnown ? (
                <div
                  className={`flex justify-between pt-1 border-t border-[#E5E7EB] font-semibold ${
                    selectedSaleMargin >= 0
                      ? 'text-[#21865B]'
                      : 'text-[#D64545]'
                  }`}
                >
                  <span>Utilidad estimada (sin IVA):</span>
                  <span>
                    {formatCOP(selectedSaleMargin)}
                    {selectedSale.subtotalCOP > 0
                      ? ` (${(
                          (selectedSaleMargin / selectedSale.subtotalCOP) *
                          100
                        ).toFixed(0)}%)`
                      : ''}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between pt-1 border-t border-[#E5E7EB] text-[#727985]">
                  <span>Utilidad estimada:</span>
                  <span>No disponible (costo histórico)</span>
                </div>
              )}
            </div>

            {state.saleReturns.filter((ret) => ret.saleId === selectedSale.id).length > 0 && (
              <div className="border border-[#E5E7EB] rounded-xl overflow-hidden text-xs">
                <div className="bg-[#D64545]/10 px-3 py-1.5 font-semibold text-[#D64545]">
                  Notas Crédito Asociadas
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {state.saleReturns
                    .filter((ret) => ret.saleId === selectedSale.id)
                    .map((ret) => (
                      <div key={ret.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-mono font-semibold text-[#20242B]">{ret.creditNoteNumber}</p>
                          <p className="text-[11px] text-[#727985]">
                            {ret.items.map((item) => item.sku).join(', ')} · {ret.refundMethod}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-[#D64545]">-{formatCOP(ret.totalCOP)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F5F7] hover:bg-[#E5E7EB] text-[#20242B] rounded-lg text-xs font-semibold"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-[#20242B] text-white rounded-lg text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW LINKED ACCOUNTING ENTRY (PARTIDA DOBLE) */}
      {inspectAccounting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="font-mono text-xs font-bold text-[#3478C6] bg-[#3478C6]/10 px-2 py-0.5 rounded">
                  ASIENTO CONTABLE: {inspectAccounting.voucherNumber}
                </span>
                <h3 className="font-bold text-[#20242B] text-base mt-1">
                  Comprobante de Partida Doble
                </h3>
                <p className="text-xs text-[#727985]">{inspectAccounting.concept}</p>
              </div>
              <button
                onClick={() => setInspectAccounting(null)}
                className="p-1 rounded text-[#727985]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F4F5F7] text-[#727985] font-semibold">
                  <tr>
                    <th className="p-2.5">Cuenta</th>
                    <th className="p-2.5">Nombre Cuenta</th>
                    <th className="p-2.5 text-right">Débito (COP)</th>
                    <th className="p-2.5 text-right">Crédito (COP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-mono">
                  {inspectAccounting.rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-[#20242B]">{r.accountCode}</td>
                      <td className="p-2.5 font-sans text-[#727985]">{r.accountName}</td>
                      <td className="p-2.5 text-right tabular-nums">
                        {r.debitCOP > 0 ? formatCOP(r.debitCOP) : '-'}
                      </td>
                      <td className="p-2.5 text-right tabular-nums">
                        {r.creditCOP > 0 ? formatCOP(r.creditCOP) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F4F5F7] font-mono font-bold text-xs border-t border-[#E5E7EB]">
                  <tr>
                    <td colSpan={2} className="p-2.5 font-sans">TOTALES (Sumas Iguales):</td>
                    <td className="p-2.5 text-right text-[#21865B]">
                      {formatCOP(inspectAccounting.totalDebitCOP)}
                    </td>
                    <td className="p-2.5 text-right text-[#21865B]">
                      {formatCOP(inspectAccounting.totalCreditCOP)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-[#727985]">
              <span className="flex items-center gap-1.5 text-[#21865B] font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Partida Doble Cuadrada (Débitos = Créditos)
              </span>
              <span>Generado por: {inspectAccounting.createdBy}</span>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setInspectAccounting(null)}
                className="px-4 py-2 bg-[#20242B] text-white rounded-lg text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR DEVOLUCIÓN / NOTA CRÉDITO */}
      {returnSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="font-mono text-xs font-bold text-[#D64545] bg-[#D64545]/10 px-2 py-0.5 rounded">
                  DEVOLUCIÓN · {returnSale.invoiceNumber}
                </span>
                <h3 className="font-bold text-[#20242B] text-base mt-1">
                  Registrar Nota Crédito
                </h3>
                <p className="text-[11px] text-[#727985]">
                  {returnSale.customerName} · {formatCOP(returnSale.totalCOP)}
                </p>
              </div>
              <button
                onClick={() => setReturnSale(null)}
                className="p-1 rounded text-[#727985] hover:text-[#20242B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="font-semibold text-[#20242B] mb-1.5">Joyas a devolver</p>
              <div className="space-y-1.5">
                {returnSale.items.map((item) => {
                  const alreadyReturned = getReturnedProductIds(returnSale).has(item.productId);
                  const checked = returnProductIds.includes(item.productId);
                  return (
                    <label
                      key={item.productId}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${
                        alreadyReturned
                          ? 'border-[#E5E7EB] bg-[#F4F5F7] opacity-60 cursor-not-allowed'
                          : checked
                          ? 'border-[#D64545] bg-[#D64545]/5 cursor-pointer'
                          : 'border-[#E5E7EB] hover:border-[#D64545]/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={alreadyReturned}
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReturnProductIds((prev) => [...prev, item.productId]);
                            } else {
                              setReturnProductIds((prev) =>
                                prev.filter((id) => id !== item.productId)
                              );
                            }
                          }}
                        />
                        <div>
                          <p className="font-semibold text-[#20242B]">{item.name}</p>
                          <p className="text-[10px] text-[#727985] font-mono">
                            {item.sku}
                            {alreadyReturned && ' · YA DEVUELTA'}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#20242B]">
                        {formatCOP(item.finalPriceCOP)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Motivo *</label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Ej: falla de montura, arrepentimiento, error de talla..."
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#20242B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Reembolso vía *</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-medium"
                  >
                    <option value="EFECTIVO">Efectivo (requiere turno de caja abierto)</option>
                    <option value="TARJETA_DEBITO">Tarjeta débito</option>
                    <option value="TARJETA_CREDITO">Tarjeta crédito</option>
                    <option value="TRANSFERENCIA_BANCOLOMBIA">Transferencia</option>
                    <option value="NEQUI_DAVIPLATA">Nequi / Daviplata</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Estado al regresar</label>
                  <select
                    value={returnStockCondition}
                    onChange={(e) => setReturnStockCondition(e.target.value as ProductStatus)}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-medium"
                  >
                    <option value="DISPONIBLE">Disponible (vitrina)</option>
                    <option value="EN_TALLER">En taller (revisión)</option>
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-[#727985] leading-relaxed">
                La nota crédito reversa IVA, costo de venta, inventario y garantía correspondientes. Consulte la partida doble desde la tabla.
              </p>

              <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between gap-2">
                <button
                  type="button"
                  onClick={handleVoidSale}
                  className="px-3 py-2 rounded-lg bg-[#20242B] text-white font-semibold hover:bg-black"
                >
                  Anular venta completa
                </button>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnSale(null)}
                    className="px-3 py-2 text-[#727985]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#D64545] hover:bg-red-700 text-white font-semibold"
                  >
                    Emitir Nota Crédito
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
