/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Hammer,
  Plus,
  Scale,
  CheckCircle2,
  AlertCircle,
  Package,
  Coins,
  Gem,
  ArrowRight,
  X,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { ManufacturingOrder } from '../../types';
import {
  formatCOP,
  formatGrams,
  formatDate,
  formatDateTime,
} from '../../utils/jewelryCalculations';

export const ManufacturingView: React.FC = () => {
  const state = erpDb.getState();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [reconcileOrder, setReconcileOrder] = useState<ManufacturingOrder | null>(null);

  // Reconcile inputs
  const [finishedWeight, setFinishedWeight] = useState<number>(0);
  const [scrapReturned, setScrapReturned] = useState<number>(0);

  // New order form
  const [formData, setFormData] = useState({
    designName: '',
    jewelType: 'Anillos' as ManufacturingOrder['jewelType'],
    artisanName: 'Maestro Álvaro Morales',
    workshopName: 'Taller Central de Orfebrería Joyeri',
    materialDeliveredGrams: 20.0,
    materialDeliveredType: 'Granalla de Oro 18K Nacional (Ley 0.750)',
    stonesNotes: '1 Esmeralda Muzo 1.50 ct',
    laborCostCOP: 750000,
    materialCostCOP: 5560000,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.designName) {
      alert('Ingrese el nombre del diseño a fabricar');
      return;
    }

    try {
      erpDb.createManufacturingOrder({
        designName: formData.designName,
        jewelType: formData.jewelType,
        artisanName: formData.artisanName,
        workshopName: formData.workshopName,
        materialsDelivered: [
          {
            material: formData.materialDeliveredType,
            fineness: 0.750,
            weightGrams: formData.materialDeliveredGrams,
          },
        ],
        stonesAssigned: [],
        expectedWeightGrams: formData.materialDeliveredGrams * 0.95,
        laborCostCOP: formData.laborCostCOP,
        materialCostCOP: formData.materialCostCOP,
      });

      setIsNewModalOpen(false);
      alert('Orden de fabricación emitida y materiales asignados al orfebre.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileOrder) return;

    try {
      erpDb.reconcileManufacturing(reconcileOrder.id, finishedWeight, scrapReturned);
      setReconcileOrder(null);
      alert('Conciliación de metales guardada. Trazabilidad de merma registrada en auditoría.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Fabricación de Joyería & Control de Mermas de Fundición
          </h1>
          <p className="text-xs text-[#727985]">
            Control de materia prima entregada a orfebres vs joya terminada vs retales recuperados
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Hechura
        </button>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.manufacturingOrders.map((ord) => {
          const totalDelivered = ord.materialsDelivered.reduce((acc, m) => acc + m.weightGrams, 0);
          return (
            <div
              key={ord.id}
              className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#7F581A] bg-[#9B7028]/10 px-2 py-0.5 rounded">
                    {ord.code}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      ord.status === 'CONCILIADA'
                        ? 'bg-[#21865B]/10 text-[#21865B]'
                        : 'bg-[#D99032]/10 text-[#D99032]'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#20242B] mt-2">
                  {ord.designName}
                </h3>
                <p className="text-xs text-[#727985]">
                  Orfebre: <strong className="text-[#20242B]">{ord.artisanName}</strong> · {ord.workshopName}
                </p>

                {/* Metal Reconciliation Box */}
                <div className="bg-[#F4F5F7] p-3 rounded-xl my-2.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#727985]">Oro Entregado al Taller:</span>
                    <span className="font-mono font-bold text-[#20242B]">{formatGrams(totalDelivered)}</span>
                  </div>

                  {ord.status === 'CONCILIADA' ? (
                    <>
                      <div className="flex justify-between text-[#20242B]">
                        <span className="text-[#727985]">Peso Joya Terminada:</span>
                        <span className="font-mono font-bold">{formatGrams(ord.finishedProductWeightGrams)}</span>
                      </div>
                      <div className="flex justify-between text-[#20242B]">
                        <span className="text-[#727985]">Retal y Limalla Devuelta:</span>
                        <span className="font-mono font-bold">{formatGrams(ord.scrapReturnedGrams)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#E5E7EB] text-[#7F581A]">
                        <span className="font-semibold">Merma Neta Documentada:</span>
                        <span className="font-mono font-bold">
                          {formatGrams(ord.netWeightDifferenceGrams)} ({((ord.netWeightDifferenceGrams / totalDelivered) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-[#D99032] italic">
                      ⏳ En proceso de fundición y hechura en taller. Pendiente de conciliar peso terminado.
                    </div>
                  )}
                </div>

                {/* Cost summary */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <span className="text-[#727985] block text-[10px]">Costo Materiales:</span>
                    <span className="font-mono font-bold text-[#20242B]">{formatCOP(ord.materialCostCOP)}</span>
                  </div>
                  <div>
                    <span className="text-[#727985] block text-[10px]">Mano de Obra:</span>
                    <span className="font-mono font-bold text-[#20242B]">{formatCOP(ord.laborCostCOP)}</span>
                  </div>
                  <div>
                    <span className="text-[#727985] block text-[10px]">Costo Total Fabricación:</span>
                    <span className="font-mono font-bold text-[#7F581A]">{formatCOP(ord.totalCostCOP)}</span>
                  </div>
                </div>
              </div>

              {ord.status !== 'CONCILIADA' && (
                <div className="pt-2 border-t border-[#E5E7EB] flex justify-end">
                  <button
                    onClick={() => {
                      setReconcileOrder(ord);
                      setFinishedWeight(totalDelivered * 0.9);
                      setScrapReturned(totalDelivered * 0.06);
                    }}
                    className="px-3 py-1.5 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Conciliar Pesos & Mermas
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: NEW MANUFACTURING ORDER */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#20242B]">
                Nueva Orden de Hechura & Producción
              </h2>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Nombre del Diseño / Pieza *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pulsera Eslabón Especial con Zafiros"
                  value={formData.designName}
                  onChange={(e) => setFormData({ ...formData, designName: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Orfebre Responsable</label>
                  <input
                    type="text"
                    value={formData.artisanName}
                    onChange={(e) => setFormData({ ...formData, artisanName: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Taller de Destino</label>
                  <input
                    type="text"
                    value={formData.workshopName}
                    onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="bg-[#F4F5F7] p-3 rounded-xl border border-[#E5E7EB] space-y-2">
                <span className="font-bold text-[#20242B] block">Material Precioso Asignado</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#727985] block mb-1">Tipo de Metal</label>
                    <input
                      type="text"
                      value={formData.materialDeliveredType}
                      onChange={(e) => setFormData({ ...formData, materialDeliveredType: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[#727985] block mb-1">Peso Entregado (Gramos) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.materialDeliveredGrams}
                      onChange={(e) => setFormData({ ...formData, materialDeliveredGrams: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Costo Materiales (COP)</label>
                  <input
                    type="number"
                    value={formData.materialCostCOP}
                    onChange={(e) => setFormData({ ...formData, materialCostCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Costo Mano de Obra (COP)</label>
                  <input
                    type="number"
                    value={formData.laborCostCOP}
                    onChange={(e) => setFormData({ ...formData, laborCostCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-lg font-semibold"
                >
                  Asignar y Emitir Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECONCILE */}
      {reconcileOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="font-bold text-[#20242B] text-sm">Conciliación de Pesos & Mermas</h3>
                <p className="text-[11px] font-mono text-[#727985]">{reconcileOrder.code}</p>
              </div>
              <button onClick={() => setReconcileOrder(null)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
                <p className="text-[#727985]">Oro total entregado al orfebre:</p>
                <p className="font-mono font-bold text-base text-[#20242B]">
                  {formatGrams(reconcileOrder.materialsDelivered.reduce((acc, m) => acc + m.weightGrams, 0))}
                </p>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Peso Joya Terminada (Gramos en Balanza) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={finishedWeight}
                  onChange={(e) => setFinishedWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#20242B]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Retal y Limalla Recuperada (Gramos) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={scrapReturned}
                  onChange={(e) => setScrapReturned(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReconcileOrder(null)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#21865B] hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Guardar Conciliación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
