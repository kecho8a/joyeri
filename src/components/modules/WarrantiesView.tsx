/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileCheck,
  Printer,
  Calendar,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { WarrantyRecord } from '../../types';
import { formatDate } from '../../utils/jewelryCalculations';

export const WarrantiesView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = state.warranties.filter((w) => {
    return (
      w.warrantyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.productSku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Certificados de Garantía Oficial & Autenticidad de Ley
          </h1>
          <p className="text-xs text-[#727985]">
            Emisión de certificados legales y comerciales de pureza de metales y gemas naturales
          </p>
        </div>
        <div className="text-xs bg-[#21865B]/10 text-[#21865B] px-3 py-1.5 rounded-lg border border-[#21865B]/20 font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          {state.warranties.length} Garantías Registradas
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-sm flex items-center gap-3 text-xs">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de garantía, factura o cliente..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#9B7028] focus:bg-white"
          />
        </div>
      </div>

      {/* Grid of Warranties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#21865B] bg-[#21865B]/10 px-2 py-0.5 rounded">
                {w.warrantyCode}
              </span>
              <span className="text-[10px] font-bold text-[#21865B] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {w.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#20242B]">{w.productName}</h3>
              <p className="text-xs text-[#727985] font-mono mt-0.5">
                SKU: {w.productSku} · Factura: {w.invoiceNumber}
              </p>
            </div>

            <div className="bg-[#F4F5F7] p-2.5 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#727985]">Titular:</span>
                <span className="font-semibold text-[#20242B]">{w.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727985]">Documento:</span>
                <span className="font-mono text-[#20242B]">{w.customerDoc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727985]">Vigencia:</span>
                <span className="font-semibold text-[#20242B]">
                  {formatDate(w.startDate)} al {formatDate(w.endDate)} ({w.validityMonths} meses)
                </span>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-lg p-2.5 text-[11px] text-[#727985]">
              <span className="font-bold text-[#20242B] block mb-0.5">Términos de Cobertura:</span>
              <p>{w.coverageSummary}</p>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#20242B] bg-[#F4F5F7] hover:bg-[#E5E7EB] rounded font-medium"
              >
                <Printer className="w-3.5 h-3.5 text-[#727985]" />
                Imprimir Certificado
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
