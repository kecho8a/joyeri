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
import { Sale, AccountingEntry } from '../../types';
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

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Historial de Ventas & Facturación Electrónica
          </h1>
          <p className="text-xs text-[#727985]">
            Registro correlativo de ventas, comprobantes DIAN, cuentas afectadas y garantías
          </p>
        </div>
        <div className="text-xs bg-[#F4F5F7] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium text-[#20242B]">
          Total Facturado: <strong className="font-mono text-[#7F581A]">{formatCOP(state.sales.reduce((acc, s) => acc + s.totalCOP, 0))}</strong>
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
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#9B7028] focus:bg-white"
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
                    <button
                      onClick={() => setSelectedSale(s)}
                      className="px-2.5 py-1 rounded bg-[#9B7028]/10 text-[#7F581A] hover:bg-[#9B7028] hover:text-white transition-colors font-semibold text-xs"
                    >
                      Ver Factura
                    </button>
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
                <span className="font-mono text-xs font-bold text-[#7F581A]">
                  FACTURA: {selectedSale.invoiceNumber}
                </span>
                <h3 className="font-bold text-[#20242B] text-base mt-0.5">
                  Comprobante de Venta JOYERI
                </h3>
                <p className="text-xs text-[#727985]">
                  Fecha: {formatDateTime(selectedSale.createdAt)}
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
                <span className="text-[#7F581A]">{formatCOP(selectedSale.totalCOP)}</span>
              </div>
            </div>

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
    </div>
  );
};
