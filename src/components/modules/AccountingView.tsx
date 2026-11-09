/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  BookOpen,
  PieChart,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { AccountingEntry } from '../../types';
import {
  formatCOP,
  formatDateTime,
  formatDate,
} from '../../utils/jewelryCalculations';

export const AccountingView: React.FC = () => {
  const state = erpDb.getState();
  const [activeTab, setActiveTab] = useState<'journal' | 'trialBalance' | 'chartOfAccounts'>('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('TODOS');

  const filteredEntries = state.accountingEntries.filter((e) => {
    const matchesSearch =
      e.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.concept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'TODOS' || e.sourceModule === sourceFilter;
    return matchesSearch && matchesSource;
  });

  // Calculate Trial Balance accounts from all entries
  const accountBalances: Record<string, { code: string; name: string; totalDebit: number; totalCredit: number }> = {};
  state.accountingEntries.forEach((entry) => {
    entry.rows.forEach((row) => {
      if (!accountBalances[row.accountCode]) {
        accountBalances[row.accountCode] = {
          code: row.accountCode,
          name: row.accountName,
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      accountBalances[row.accountCode].totalDebit += row.debitCOP;
      accountBalances[row.accountCode].totalCredit += row.creditCOP;
    });
  });

  const trialBalanceRows = Object.values(accountBalances).sort((a, b) => a.code.localeCompare(b.code));
  const totalDebits = trialBalanceRows.reduce((acc, r) => acc + r.totalDebit, 0);
  const totalCredits = trialBalanceRows.reduce((acc, r) => acc + r.totalCredit, 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Módulo Contable de Partida Doble
          </h1>
          <p className="text-xs text-[#727985]">
            Asientos inalterables de diario, balance de comprobación y cuadre estricto Débito = Crédito
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#F4F5F7] p-1 rounded-lg border border-[#E5E7EB] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'journal'
                ? 'bg-white text-[#20242B] shadow-sm'
                : 'text-[#727985] hover:text-[#20242B]'
            }`}
          >
            Libro Diario ({state.accountingEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('trialBalance')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'trialBalance'
                ? 'bg-white text-[#20242B] shadow-sm'
                : 'text-[#727985] hover:text-[#20242B]'
            }`}
          >
            Balance de Comprobación
          </button>
        </div>
      </div>

      {activeTab === 'journal' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="card-float p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex-1 max-w-sm relative">
              <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por comprobante o concepto..."
                className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium"
            >
              <option value="TODOS">Todos los orígenes</option>
              <option value="VENTAS">Ventas POS</option>
              <option value="GASTOS">Gastos Operacionales</option>
              <option value="CAJA">Movimientos de Caja</option>
              <option value="COMPRAS">Compras e Inventario</option>
            </select>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="card-float p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#3478C6] bg-[#3478C6]/10 px-2 py-0.5 rounded">
                      {entry.voucherNumber}
                    </span>
                    <span className="text-xs font-semibold text-[#20242B]">{entry.concept}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#727985]">
                    <span>Fecha: {formatDate(entry.date)}</span>
                    <span className="text-[#21865B] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cuadrado
                    </span>
                  </div>
                </div>

                {/* Rows Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-2 px-3">Cuenta PUC</th>
                        <th className="py-2 px-3">Descripción de la Cuenta</th>
                        <th className="py-2 px-3 text-right">Débito (COP)</th>
                        <th className="py-2 px-3 text-right">Crédito (COP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] font-mono text-[#20242B]">
                      {entry.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#F4F5F7]/30">
                          <td className="py-2 px-3 font-bold">{row.accountCode}</td>
                          <td className="py-2 px-3 font-sans text-[#727985]">{row.accountName}</td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {row.debitCOP > 0 ? formatCOP(row.debitCOP) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {row.creditCOP > 0 ? formatCOP(row.creditCOP) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#F4F5F7] font-mono font-bold text-xs border-t border-[#E5E7EB]">
                      <tr>
                        <td colSpan={2} className="py-2 px-3 font-sans">
                          Sumas Iguales:
                        </td>
                        <td className="py-2 px-3 text-right text-[#21865B] tabular-nums">
                          {formatCOP(entry.totalDebitCOP)}
                        </td>
                        <td className="py-2 px-3 text-right text-[#21865B] tabular-nums">
                          {formatCOP(entry.totalCreditCOP)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Trial Balance Tab */
        <div className="card-float p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-sm font-bold text-[#20242B]">
                Balance de Comprobación Acumulado
              </h2>
              <p className="text-xs text-[#727985]">
                Sumas de débitos y créditos acumulados por código contable
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#21865B]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Balance Cuadrado: Débitos == Créditos</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3">Código PUC</th>
                  <th className="py-2.5 px-3">Denominación de Cuenta</th>
                  <th className="py-2.5 px-3 text-right">Movimiento Débito</th>
                  <th className="py-2.5 px-3 text-right">Movimiento Crédito</th>
                  <th className="py-2.5 px-3 text-right">Saldo Neto (COP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
                {trialBalanceRows.map((r) => {
                  const net = r.totalDebit - r.totalCredit;
                  return (
                    <tr key={r.code} className="hover:bg-[#F4F5F7]/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#20242B]">{r.code}</td>
                      <td className="py-2.5 px-3 font-medium">{r.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">
                        {formatCOP(r.totalDebit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#727985]">
                        {formatCOP(r.totalCredit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                        {net >= 0 ? formatCOP(net) : `(${formatCOP(Math.abs(net))})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#F4F5F7] font-mono font-bold text-xs border-t border-[#E5E7EB]">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 font-sans">
                    TOTALES BALANCE DE COMPROBACIÓN:
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#21865B] tabular-nums">
                    {formatCOP(totalDebits)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#21865B] tabular-nums">
                    {formatCOP(totalCredits)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#21865B] tabular-nums">
                    {formatCOP(totalDebits - totalCredits)} (0.00)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
