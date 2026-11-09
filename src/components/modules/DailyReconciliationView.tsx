/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClipboardCheck,
  Scale,
  Gem,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Save,
  History,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import {
  METAL_DEFINITIONS,
  formatCOP,
  formatGrams,
  formatCarats,
  formatDate,
  formatDateTime,
} from '../../utils/jewelryCalculations';
import {
  getExpectedMetalLines,
  getExpectedStoneLines,
  getInStoreMetalPieces,
  RECONCILIATION_CARATS_TOLERANCE,
  RECONCILIATION_GRAMS_TOLERANCE,
  round3,
} from '../../utils/dailyReconciliation';

type GoldCountInput = { pieces: string; grossGrams: string };
type StoneCountInput = { quantity: string; carats: string };

const toNumber = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const signNumber = (value: number): string => `${value > 0 ? '+' : ''}${value}`;

const MatchBadge: React.FC<{ matches: boolean }> = ({ matches }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
      matches
        ? 'bg-[#21865B]/10 text-[#21865B]'
        : 'bg-[#D64545]/10 text-[#D64545]'
    }`}
  >
    {matches ? (
      <CheckCircle2 className="w-3 h-3" />
    ) : (
      <AlertTriangle className="w-3 h-3" />
    )}
    {matches ? 'Coincide' : 'Diferencia'}
  </span>
);

export const DailyReconciliationView: React.FC = () => {
  const state = erpDb.getState();
  const branch = erpDb.getActiveBranch();
  const user = erpDb.getActiveUser();
  const shift = state.currentCashShift;

  const expectedGold = getExpectedMetalLines(state.products, branch.id);
  const expectedStones = getExpectedStoneLines(state.products, branch.id);
  const goldPiecesInStore = getInStoreMetalPieces(state.products, branch.id);

  const [goldCounts, setGoldCounts] = useState<Record<string, GoldCountInput>>({});
  const [stoneCounts, setStoneCounts] = useState<Record<string, StoneCountInput>>({});
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');

  const expectedCashCOP = shift ? shift.expectedCashCOP : 0;
  const countedCashNumber = toNumber(countedCash);
  const cashDifferenceCOP = round3(countedCashNumber - expectedCashCOP);
  const cashMatches =
    !!shift &&
    shift.status === 'ABIERTA' &&
    countedCashNumber === expectedCashCOP;

  const goldPreview = expectedGold.map((line) => {
    const input = goldCounts[line.metalType] || { pieces: '', grossGrams: '' };
    const countedPieces = toNumber(input.pieces);
    const countedGrossWeightGrams = toNumber(input.grossGrams);
    const piecesDifference = countedPieces - line.pieces;
    const grossWeightDifferenceGrams = round3(
      countedGrossWeightGrams - line.grossWeightGrams
    );

    return {
      ...line,
      countedPieces,
      countedGrossWeightGrams,
      piecesDifference,
      grossWeightDifferenceGrams,
      matches:
        piecesDifference === 0 &&
        Math.abs(grossWeightDifferenceGrams) <= RECONCILIATION_GRAMS_TOLERANCE,
    };
  });

  const stonePreview = expectedStones.map((line) => {
    const input = stoneCounts[line.stoneType] || { quantity: '', carats: '' };
    const countedQuantity = toNumber(input.quantity);
    const countedCarats = toNumber(input.carats);
    const quantityDifference = countedQuantity - line.quantity;
    const caratsDifference = round3(countedCarats - line.carats);

    return {
      ...line,
      countedQuantity,
      countedCarats,
      quantityDifference,
      caratsDifference,
      matches:
        quantityDifference === 0 &&
        Math.abs(caratsDifference) <= RECONCILIATION_CARATS_TOLERANCE,
    };
  });

  const expectedGoldPieces = goldPreview.reduce((acc, line) => acc + line.pieces, 0);
  const countedGoldPieces = goldPreview.reduce(
    (acc, line) => acc + line.countedPieces,
    0
  );
  const expectedGoldGrossGrams = round3(
    goldPreview.reduce((acc, line) => acc + line.grossWeightGrams, 0)
  );
  const countedGoldGrossGrams = round3(
    goldPreview.reduce((acc, line) => acc + line.countedGrossWeightGrams, 0)
  );
  const expectedGoldFineGrams = round3(
    goldPreview.reduce((acc, line) => acc + line.fineMetalContentGrams, 0)
  );

  const expectedStoneQuantity = stonePreview.reduce(
    (acc, line) => acc + line.quantity,
    0
  );
  const countedStoneQuantity = stonePreview.reduce(
    (acc, line) => acc + line.countedQuantity,
    0
  );
  const expectedStoneCarats = round3(
    stonePreview.reduce((acc, line) => acc + line.carats, 0)
  );
  const countedStoneCarats = round3(
    stonePreview.reduce((acc, line) => acc + line.countedCarats, 0)
  );

  const inventoryMatches =
    goldPreview.every((line) => line.matches) &&
    stonePreview.every((line) => line.matches);
  const overallMatches = inventoryMatches && cashMatches;

  const handleGoldChange = (
    metalType: string,
    field: keyof GoldCountInput,
    value: string
  ) => {
    setGoldCounts((prev) => ({
      ...prev,
      [metalType]: {
        ...(prev[metalType] || { pieces: '', grossGrams: '' }),
        [field]: value,
      },
    }));
  };

  const handleStoneChange = (
    stoneType: string,
    field: keyof StoneCountInput,
    value: string
  ) => {
    setStoneCounts((prev) => ({
      ...prev,
      [stoneType]: {
        ...(prev[stoneType] || { quantity: '', carats: '' }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shift) {
      alert(
        'No existe un turno de caja registrado. Abra un turno en el módulo Caja antes de realizar el cuadre diario.'
      );
      return;
    }

    if (
      !overallMatches &&
      !confirm(
        'El cuadre presenta diferencias entre lo contado físicamente y el sistema. ¿Desea registrarlo igualmente con las observaciones?'
      )
    ) {
      return;
    }

    try {
      erpDb.registerDailyReconciliation({
        countedGold: goldPreview.reduce(
          (acc, line) => {
            acc[line.metalType] = {
              pieces: line.countedPieces,
              grossGrams: line.countedGrossWeightGrams,
            };
            return acc;
          },
          {} as Record<string, { pieces: number; grossGrams: number }>
        ),
        countedStones: stonePreview.reduce(
          (acc, line) => {
            acc[line.stoneType] = {
              quantity: line.countedQuantity,
              carats: line.countedCarats,
            };
            return acc;
          },
          {} as Record<string, { quantity: number; carats: number }>
        ),
        countedCashCOP: countedCashNumber,
        notes: notes.trim() || undefined,
      });

      alert(
        overallMatches
          ? 'Cuadre diario registrado y turno cerrado: inventario, piedras y efectivo coinciden con el sistema.'
          : 'Cuadre diario registrado y turno cerrado con diferencias documentadas. Consulte el historial.'
      );

      setGoldCounts({});
      setStoneCounts({});
      setCountedCash('');
      setNotes('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const differenceCashLabel = cashDifferenceCOP
    ? `${cashDifferenceCOP > 0 ? '+' : ''}${formatCOP(cashDifferenceCOP)} (${
        cashDifferenceCOP > 0 ? 'Sobrante' : 'Faltante'
      })`
    : '$ 0 (Cuadrada)';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B] flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#10B981]" />
            Cuadre Diario de Inventario & Caja
          </h1>
            <p className="text-xs text-[#727985]">
            Cierre oficial del día: verificación física de joyas y piedras contra el inventario, arqueo de efectivo y cierre del turno de caja en un solo registro
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1 text-xs">
          <span className="bg-[#F4F5F7] border border-[#E5E7EB] px-3 py-1 rounded-lg font-medium text-[#20242B]">
            {branch.name}
          </span>
          <span className="text-[#727985]">
            {formatDate(new Date().toISOString())} · Responsable: {user.name}
          </span>
        </div>
      </div>

      {!shift && (
        <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl p-3 text-xs text-[#059669] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No hay turno de caja registrado. El efectivo esperado se mostrará en cero hasta abrir un turno en el módulo Caja.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* GOLD INVENTORY */}
        <div className="card-float overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-sm text-[#20242B] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#10B981]" />
                1. Joyas de metal precioso que quedaron en la sede
              </h2>
              <p className="text-[11px] text-[#727985] mt-0.5">
                Ingrese lo contado físicamente. Se compara contra joyas en estado DISPONIBLE o RESERVADO de esta sede.
              </p>
            </div>
            <span className="text-[10px] text-[#727985] bg-[#F4F5F7] border border-[#E5E7EB] px-2 py-1 rounded">
              Tolerancia: ±{RECONCILIATION_GRAMS_TOLERANCE} g · piezas exactas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3">Metal / Ley</th>
                  <th className="py-2.5 px-3 text-right">Piezas Sistema</th>
                  <th className="py-2.5 px-3 text-right">Peso Bruto Sistema</th>
                  <th className="py-2.5 px-3 text-right">Oro Fino Sistema</th>
                  <th className="py-2.5 px-3">Piezas Contadas *</th>
                  <th className="py-2.5 px-3">Peso Bruto Contado (g) *</th>
                  <th className="py-2.5 px-3 text-right">Diferencia</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
                {goldPreview.map((line) => {
                  const metal = METAL_DEFINITIONS[line.metalType];
                  const input = goldCounts[line.metalType] || {
                    pieces: '',
                    grossGrams: '',
                  };

                  return (
                    <tr key={line.metalType} className="hover:bg-[#F4F5F7]/30">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{metal.name}</div>
                        <div className="font-mono text-[10px] text-[#727985]">
                          {metal.karatText}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {line.pieces}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatGrams(line.grossWeightGrams)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#059669]">
                        {formatGrams(line.fineMetalContentGrams)}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          required
                          value={input.pieces}
                          onChange={(e) =>
                            handleGoldChange(line.metalType, 'pieces', e.target.value)
                          }
                          className="w-20 bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2 py-1 font-mono font-bold focus:outline-none focus:border-[#10B981] focus:bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          required
                          value={input.grossGrams}
                          onChange={(e) =>
                            handleGoldChange(
                              line.metalType,
                              'grossGrams',
                              e.target.value
                            )
                          }
                          className="w-24 bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2 py-1 font-mono font-bold focus:outline-none focus:border-[#10B981] focus:bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={
                            line.piecesDifference === 0
                              ? 'text-[#21865B]'
                              : 'text-[#D64545]'
                          }
                        >
                          {signNumber(line.piecesDifference)} pzas
                        </span>
                        <span
                          className={`block text-[10px] ${
                            Math.abs(line.grossWeightDifferenceGrams) <=
                            RECONCILIATION_GRAMS_TOLERANCE
                              ? 'text-[#21865B]'
                              : 'text-[#D64545]'
                          }`}
                        >
                          {signNumber(line.grossWeightDifferenceGrams)} g
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <MatchBadge matches={line.matches} />
                      </td>
                    </tr>
                  );
                })}

                {goldPreview.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#727985]">
                      No hay joyas de metal precioso registradas como disponibles o reservadas en esta sede.
                    </td>
                  </tr>
                )}
              </tbody>

              {goldPreview.length > 0 && (
                <tfoot className="bg-[#F4F5F7] border-t border-[#E5E7EB] font-semibold">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL METALES</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {expectedGoldPieces}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatGrams(expectedGoldGrossGrams)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#059669]">
                      {formatGrams(expectedGoldFineGrams)}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{countedGoldPieces}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {formatGrams(countedGoldGrossGrams)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {signNumber(countedGoldPieces - expectedGoldPieces)} pzas
                    </td>
                    <td className="py-2.5 px-3">
                      <MatchBadge
                        matches={goldPreview.every((line) => line.matches)}
                      />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* STONES INVENTORY */}
        <div className="card-float overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-sm text-[#20242B] flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#10B981]" />
                2. Piedras Preciosas que quedaron en la sede
              </h2>
              <p className="text-[11px] text-[#727985] mt-0.5">
                Piedras engastadas en las joyas en estado DISPONIBLE o RESERVADO de esta sede.
              </p>
            </div>
            <span className="text-[10px] text-[#727985] bg-[#F4F5F7] border border-[#E5E7EB] px-2 py-1 rounded">
              Tolerancia: ±{RECONCILIATION_CARATS_TOLERANCE} ct · unidades exactas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3">Tipo de Piedra</th>
                  <th className="py-2.5 px-3 text-right">Unidades Sistema</th>
                  <th className="py-2.5 px-3 text-right">Quilates Sistema</th>
                  <th className="py-2.5 px-3">Unidades Contadas *</th>
                  <th className="py-2.5 px-3">Quilates Contados *</th>
                  <th className="py-2.5 px-3 text-right">Diferencia</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
                {stonePreview.map((line) => {
                  const input = stoneCounts[line.stoneType] || {
                    quantity: '',
                    carats: '',
                  };

                  return (
                    <tr key={line.stoneType} className="hover:bg-[#F4F5F7]/30">
                      <td className="py-2.5 px-3 font-semibold">{line.stoneType}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {line.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCarats(line.carats)}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          required
                          value={input.quantity}
                          onChange={(e) =>
                            handleStoneChange(
                              line.stoneType,
                              'quantity',
                              e.target.value
                            )
                          }
                          className="w-20 bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2 py-1 font-mono font-bold focus:outline-none focus:border-[#10B981] focus:bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          required
                          value={input.carats}
                          onChange={(e) =>
                            handleStoneChange(
                              line.stoneType,
                              'carats',
                              e.target.value
                            )
                          }
                          className="w-24 bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2 py-1 font-mono font-bold focus:outline-none focus:border-[#10B981] focus:bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={
                            line.quantityDifference === 0
                              ? 'text-[#21865B]'
                              : 'text-[#D64545]'
                          }
                        >
                          {signNumber(line.quantityDifference)} u
                        </span>
                        <span
                          className={`block text-[10px] ${
                            Math.abs(line.caratsDifference) <=
                            RECONCILIATION_CARATS_TOLERANCE
                              ? 'text-[#21865B]'
                              : 'text-[#D64545]'
                          }`}
                        >
                          {signNumber(line.caratsDifference)} ct
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <MatchBadge matches={line.matches} />
                      </td>
                    </tr>
                  );
                })}

                {stonePreview.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#727985]">
                      No hay piedras registradas en las joyas disponibles de esta sede.
                    </td>
                  </tr>
                )}
              </tbody>

              {stonePreview.length > 0 && (
                <tfoot className="bg-[#F4F5F7] border-t border-[#E5E7EB] font-semibold">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL PIEDRAS</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {expectedStoneQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatCarats(expectedStoneCarats)}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {countedStoneQuantity}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {formatCarats(countedStoneCarats)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {signNumber(countedStoneCarats - expectedStoneCarats)} ct
                    </td>
                    <td className="py-2.5 px-3">
                      <MatchBadge
                        matches={stonePreview.every((line) => line.matches)}
                      />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* CASH RECONCILIATION */}
        <div className="card-float overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h2 className="font-bold text-sm text-[#20242B] flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#10B981]" />
              3. Efectivo que debe haber en Caja
            </h2>
            <p className="text-[11px] text-[#727985] mt-0.5">
              Calculado con el turno de caja {shift ? shift.shiftNumber : 'sin turno'} ({shift ? shift.status : 'N/A'}).
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F4F5F7] rounded-xl border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#727985]">Base inicial</span>
                <span className="font-mono font-semibold">
                  {formatCOP(shift ? shift.initialCashCOP : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727985]">Ventas en efectivo</span>
                <span className="font-mono font-semibold text-[#21865B]">
                  +{formatCOP(shift ? shift.cashSalesCOP : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727985]">Abonos de apartados</span>
                <span className="font-mono font-semibold text-[#21865B]">
                  +{formatCOP(shift ? shift.layawayCashCOP : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727985]">Cobros de taller</span>
                <span className="font-mono font-semibold text-[#21865B]">
                  +{formatCOP(shift ? shift.repairCashCOP : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727985]">Egresos menores</span>
                <span className="font-mono font-semibold text-[#D64545]">
                  -{formatCOP(shift ? shift.cashExpensesCOP : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727985]">Devoluciones en efectivo</span>
                <span className="font-mono font-semibold text-[#D64545]">
                  -{formatCOP(shift ? shift.cashRefundsCOP : 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                <span className="font-semibold text-[#20242B]">
                  Efectivo esperado en gaveta
                </span>
                <span className="font-mono font-bold text-base text-[#20242B]">
                  {formatCOP(expectedCashCOP)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Efectivo Real Contado en Gaveta (COP) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="Ingrese el efectivo contado"
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
                />
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between font-mono font-bold ${
                  cashMatches
                    ? 'bg-[#21865B]/10 border-[#21865B]/20 text-[#21865B]'
                    : 'bg-[#D64545]/10 border-[#D64545]/20 text-[#D64545]'
                }`}
              >
                <span>Diferencia de caja:</span>
                <span>{differenceCashLabel}</span>
              </div>

              <p className="text-[10px] text-[#727985]">
                El efectivo esperado proviene de la base inicial más ventas en efectivo, abonos y cobros de taller, menos egresos menores del turno actual.
              </p>
            </div>
          </div>
        </div>

        {/* RESULT SUMMARY */}
        <div
          className={`rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            overallMatches
              ? 'bg-[#21865B]/10 border-[#21865B]/30'
              : 'bg-[#D64545]/10 border-[#D64545]/30'
          }`}
        >
          <div className="flex items-start gap-3">
            {overallMatches ? (
              <CheckCircle2 className="w-6 h-6 text-[#21865B] shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-[#D64545] shrink-0" />
            )}
            <div>
              <h3
                className={`font-bold text-sm ${
                  overallMatches ? 'text-[#21865B]' : 'text-[#D64545]'
                }`}
              >
                {overallMatches
                  ? 'Cuadre correcto: inventario y caja coinciden'
                  : 'El cuadre presenta diferencias'}
              </h3>
              <p className="text-[11px] text-[#20242B] mt-0.5">
                Metales: {countedGoldPieces}/{expectedGoldPieces} piezas y{' '}
                {formatGrams(countedGoldGrossGrams)} de {formatGrams(expectedGoldGrossGrams)} · Piedras:{' '}
                {formatCarats(countedStoneCarats)} de {formatCarats(expectedStoneCarats)} · Caja:{' '}
                {formatCOP(countedCashNumber)} de {formatCOP(expectedCashCOP)}
              </p>
            </div>
          </div>
        </div>

        {/* NOTES & SUBMIT */}
        <div className="card-float p-4 space-y-3">
          <div>
            <label className="font-semibold text-xs text-[#20242B] block mb-1">
              Observaciones del cuadre
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Novedades, faltantes, sobrantes o justificación de diferencias..."
              className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg p-2 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[10px] text-[#727985]">
              Se excluyen joyas vendidas, en taller o en consignación. Al registrar, se cierra el turno de caja abierto con el efectivo contado.
            </p>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Registrar Cuadre y Cerrar Turno
            </button>
          </div>
        </div>
      </form>

      {/* REFERENCE: GOLD PIECES IN STORE */}
      <div className="card-float overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h2 className="font-bold text-sm text-[#20242B]">
            Detalle de piezas de metal precioso que el sistema espera en la sede
          </h2>
          <p className="text-[11px] text-[#727985] mt-0.5">
            {goldPiecesInStore.length} piezas en estado DISPONIBLE o RESERVADO.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Joya</th>
                <th className="py-2.5 px-3">Metal</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Peso Bruto</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3">Piedras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {goldPiecesInStore.map((p) => (
                <tr key={p.id} className="hover:bg-[#F4F5F7]/30">
                  <td className="py-2.5 px-3 font-mono font-bold">{p.sku}</td>
                  <td className="py-2.5 px-3 font-medium">{p.name}</td>
                  <td className="py-2.5 px-3 text-[#727985]">
                    {METAL_DEFINITIONS[p.metalType].name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F4F5F7] border border-[#E5E7EB]">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatGrams(p.grossWeightGrams)}
                  </td>
                  <td className="py-2.5 px-3 text-[#727985]">
                    {p.locationInStore}
                  </td>
                  <td className="py-2.5 px-3 text-[#727985]">
                    {p.stones.length > 0
                      ? p.stones
                          .map(
                            (s) =>
                              `${s.type} (${s.quantity} u / ${formatCarats(s.carats)})`
                          )
                          .join(' · ')
                      : 'Sin piedras'}
                  </td>
                </tr>
              ))}

              {goldPiecesInStore.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#727985]">
                    No hay piezas de metal precioso disponibles o reservadas en esta sede.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORY */}
      <div className="card-float p-5 space-y-3">
        <h3 className="font-bold text-sm text-[#20242B] flex items-center gap-2">
          <History className="w-4 h-4 text-[#727985]" />
          Historial de Cuadres Diarios
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="p-2.5">Fecha</th>
                <th className="p-2.5">Sede</th>
                <th className="p-2.5">Responsable</th>
                <th className="p-2.5 text-right">Metales (pzas)</th>
                <th className="p-2.5 text-right">Metal (g)</th>
                <th className="p-2.5 text-right">Piedras (ct)</th>
                <th className="p-2.5 text-right">Caja Esperada</th>
                <th className="p-2.5 text-right">Caja Contada</th>
                <th className="p-2.5 text-right">Diferencia Caja</th>
                <th className="p-2.5">Estado</th>
                <th className="p-2.5">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {state.dailyReconciliations.map((r) => (
                <tr key={r.id}>
                  <td className="p-2.5 text-[#727985] whitespace-nowrap">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="p-2.5 font-semibold">{r.branchName}</td>
                  <td className="p-2.5">{r.responsibleUserName}</td>
                  <td className="p-2.5 text-right font-mono">
                    {r.countedGoldPieces}/{r.expectedGoldPieces}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {r.countedGoldGrossGrams}/{r.expectedGoldGrossGrams}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {r.countedStoneCarats}/{r.expectedStoneCarats}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {formatCOP(r.expectedCashCOP)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {formatCOP(r.countedCashCOP)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    <span
                      className={
                        r.cashDifferenceCOP === 0
                          ? 'text-[#21865B]'
                          : 'text-[#D64545]'
                      }
                    >
                      {formatCOP(r.cashDifferenceCOP)}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        r.status === 'CUADRADO'
                          ? 'bg-[#21865B]/10 text-[#21865B]'
                          : 'bg-[#D64545]/10 text-[#D64545]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-[#727985] italic text-[11px]">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}

              {state.dailyReconciliations.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-xs text-[#727985]">
                    No hay cuadres diarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
