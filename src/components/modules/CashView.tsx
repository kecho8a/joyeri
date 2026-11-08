/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  CreditCard,
  TrendingDown,
  Coins,
  X,
  History,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { CashShift } from '../../types';
import {
  formatCOP,
  formatDateTime,
  formatDate,
} from '../../utils/jewelryCalculations';

export const CashView: React.FC = () => {
  const state = erpDb.getState();
  const currentShift = state.currentCashShift;
  const activeBranch = erpDb.getActiveBranch();
  const activeUser = erpDb.getActiveUser();

  // Modals
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  // Close shift form
  const [actualCountedCash, setActualCountedCash] = useState<number>(
    currentShift ? currentShift.expectedCashCOP : 0
  );
  const [differenceReason, setDifferenceReason] = useState('');
  const [notes, setNotes] = useState('');

  // Open shift form
  const [initialCashInput, setInitialCashInput] = useState<number>(1500000);

  const diff = currentShift ? actualCountedCash - currentShift.expectedCashCOP : 0;

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      erpDb.closeCashShift(actualCountedCash, differenceReason || undefined, notes || undefined);
      setIsCloseModalOpen(false);
      alert('Turno de caja cerrado exitosamente con arqueo documentado.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      erpDb.openCashShift(initialCashInput);
      setIsOpenModalOpen(false);
      alert('Nuevo turno de caja abierto.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Caja, Tesorería & Arqueos de Turno
          </h1>
          <p className="text-xs text-[#727985]">
            Control de efectivo en caja, conciliación de pagos electrónicos y cierre con justificación de diferencias
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentShift && currentShift.status === 'ABIERTA' ? (
            <button
              onClick={() => {
                setActualCountedCash(currentShift.expectedCashCOP);
                setIsCloseModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D64545] hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Lock className="w-4 h-4" />
              Arqueo & Cierre de Caja
            </button>
          ) : (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21865B] hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Unlock className="w-4 h-4" />
              Apertura de Turno
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Dashboard */}
      {currentShift && currentShift.status === 'ABIERTA' ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#21865B] bg-[#21865B]/10 px-2 py-0.5 rounded">
                TURNO ABIERTO: {currentShift.shiftNumber}
              </span>
              <h2 className="text-base font-bold text-[#20242B] mt-1">
                {activeBranch.name} · Cajero: {currentShift.cashierName}
              </h2>
              <p className="text-xs text-[#727985]">
                Apertura: {formatDateTime(currentShift.openedAt)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#727985] block font-medium">Efectivo Físico Esperado</span>
              <span className="text-2xl font-bold text-[#20242B] font-mono tabular-nums">
                {formatCOP(currentShift.expectedCashCOP)}
              </span>
            </div>
          </div>

          {/* Money movements flow grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#F4F5F7] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#727985] block font-semibold uppercase">Base Inicial</span>
              <span className="font-mono font-bold text-xs text-[#20242B] tabular-nums">
                {formatCOP(currentShift.initialCashCOP)}
              </span>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#21865B] block font-semibold uppercase">Ventas Efectivo</span>
              <span className="font-mono font-bold text-xs text-[#21865B] tabular-nums">
                +{formatCOP(currentShift.cashSalesCOP)}
              </span>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#21865B] block font-semibold uppercase">Abonos Separados</span>
              <span className="font-mono font-bold text-xs text-[#21865B] tabular-nums">
                +{formatCOP(currentShift.layawayCashCOP)}
              </span>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#21865B] block font-semibold uppercase">Cobros Taller</span>
              <span className="font-mono font-bold text-xs text-[#21865B] tabular-nums">
                +{formatCOP(currentShift.repairCashCOP)}
              </span>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#D64545] block font-semibold uppercase">Egresos Menores</span>
              <span className="font-mono font-bold text-xs text-[#D64545] tabular-nums">
                -{formatCOP(currentShift.cashExpensesCOP)}
              </span>
            </div>

            <div className="bg-[#F4F5F7] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#3478C6] block font-semibold uppercase">Datafono Tarjetas</span>
              <span className="font-mono font-bold text-xs text-[#3478C6] tabular-nums">
                {formatCOP(currentShift.cardSalesCOP)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center space-y-3 shadow-sm">
          <Lock className="w-8 h-8 text-[#727985] mx-auto" />
          <h2 className="text-base font-bold text-[#20242B]">La Caja se encuentra actualmente cerrada</h2>
          <p className="text-xs text-[#727985] max-w-md mx-auto">
            Abra un turno de caja para habilitar ventas en efectivo, abonos de separados y egresos en esta sucursal.
          </p>
          <button
            onClick={() => setIsOpenModalOpen(true)}
            className="px-4 py-2 bg-[#21865B] hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
          >
            <Unlock className="w-4 h-4" />
            Iniciar Apertura de Turno
          </button>
        </div>
      )}

      {/* Historical Shifts Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-[#20242B] flex items-center gap-2">
          <History className="w-4 h-4 text-[#727985]" />
          Historial de Turnos & Arqueos Cerrados
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="p-2.5">Turno</th>
                <th className="p-2.5">Cajero</th>
                <th className="p-2.5">Apertura</th>
                <th className="p-2.5">Cierre</th>
                <th className="p-2.5 text-right">Efectivo Esperado</th>
                <th className="p-2.5 text-right">Efectivo Contado</th>
                <th className="p-2.5 text-right">Diferencia</th>
                <th className="p-2.5">Motivo de Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {state.cashShiftsHistory.map((sh) => (
                <tr key={sh.id}>
                  <td className="p-2.5 font-mono font-bold">{sh.shiftNumber}</td>
                  <td className="p-2.5 font-semibold">{sh.cashierName}</td>
                  <td className="p-2.5 text-[#727985]">{formatDateTime(sh.openedAt)}</td>
                  <td className="p-2.5 text-[#727985]">{sh.closedAt ? formatDateTime(sh.closedAt) : '-'}</td>
                  <td className="p-2.5 text-right font-mono">{formatCOP(sh.expectedCashCOP)}</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {sh.actualCountedCashCOP !== undefined ? formatCOP(sh.actualCountedCashCOP) : '-'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {sh.differenceCOP !== undefined ? (
                      <span className={sh.differenceCOP === 0 ? 'text-[#21865B]' : 'text-[#D64545]'}>
                        {formatCOP(sh.differenceCOP)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-2.5 text-[#727985] italic text-[11px]">
                    {sh.differenceReason || (sh.differenceCOP === 0 ? 'Cuadrado exacto' : '-')}
                  </td>
                </tr>
              ))}
              {state.cashShiftsHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-[#727985]">
                    No hay turnos cerrados en el historial reciente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CLOSE SHIFT & RECONCILIATION */}
      {isCloseModalOpen && currentShift && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="font-bold text-[#20242B] text-sm">Arqueo y Cierre de Turno de Caja</h3>
                <p className="text-xs text-[#727985]">{currentShift.shiftNumber}</p>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-[#F4F5F7] rounded-xl border border-[#E5E7EB] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#727985]">Efectivo según sistema:</span>
                  <span className="font-mono font-bold text-[#20242B]">
                    {formatCOP(currentShift.expectedCashCOP)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Efectivo Real Contado en Gaveta (COP) *
                </label>
                <input
                  type="number"
                  required
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#20242B]"
                />
              </div>

              {/* Difference feedback */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between font-mono font-bold ${
                  diff === 0
                    ? 'bg-[#21865B]/10 border-[#21865B]/20 text-[#21865B]'
                    : 'bg-[#D64545]/10 border-[#D64545]/20 text-[#D64545]'
                }`}
              >
                <span>Diferencia de Caja:</span>
                <span>{diff > 0 ? `+${formatCOP(diff)} (Sobrante)` : diff < 0 ? `${formatCOP(diff)} (Faltante)` : '$ 0 (Cuadrada)'}</span>
              </div>

              {diff !== 0 && (
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">
                    Justificación Obligatoria de la Diferencia *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Explique el motivo del sobrante o faltante detectado..."
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg p-2"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Observaciones Finales</label>
                <input
                  type="text"
                  placeholder="Novedades del turno..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D64545] hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Confirmar Cierre de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OPEN SHIFT */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#20242B] text-sm">Apertura de Turno de Caja</h3>
              <button onClick={() => setIsOpenModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Sucursal</label>
                <input
                  type="text"
                  disabled
                  value={activeBranch.name}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#727985]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Cajero Responsable</label>
                <input
                  type="text"
                  disabled
                  value={activeUser.name}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#727985]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Base Inicial en Efectivo (COP) *
                </label>
                <input
                  type="number"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#20242B]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#21865B] hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Abrir Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
