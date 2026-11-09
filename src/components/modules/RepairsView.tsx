/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Scale,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { PaymentMethod, RepairOrder } from '../../types';
import {
  formatCOP,
  formatGrams,
  formatDateTime,
  formatDate,
} from '../../utils/jewelryCalculations';

interface RepairsViewProps {
  isNewModalOpenInitial?: boolean;
  onCloseNewModalInitial?: () => void;
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  isNewModalOpenInitial,
  onCloseNewModalInitial,
}) => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [isNewModalOpen, setIsNewModalOpen] = useState(isNewModalOpenInitial || false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<RepairOrder | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<RepairOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');

  // Form state
  const [formData, setFormData] = useState({
    customerId: state.customers[0]?.id || '',
    itemDescription: '',
    declaredMetal: 'Oro 18K Amarillo (Propiedad del Cliente)',
    initialWeightGrams: 4.5,
    previousDefects: '',
    serviceType: 'Ajuste de Talla' as RepairOrder['serviceType'],
    diagnosticDetails: '',
    partsCostCOP: 50000,
    laborCostCOP: 150000,
    advancePaymentCOP: 100000,
    advancePaymentMethod: 'EFECTIVO' as PaymentMethod,
    promiseDate: '2026-03-20',
  });

  const filteredRepairs = state.repairs.filter((r) => {
    const matchesSearch =
      r.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.itemDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemDescription) {
      alert('Describa la pieza recibida del cliente');
      return;
    }
    if (!formData.customerId) {
      alert('Seleccione el cliente propietario');
      return;
    }

    try {
      erpDb.createRepairOrder({
        customerId: formData.customerId,
        itemDescription: formData.itemDescription,
        declaredMetal: formData.declaredMetal,
        initialWeightGrams: formData.initialWeightGrams,
        previousDefects: formData.previousDefects || 'Sin defectos notorios preexistentes al ingreso.',
        serviceType: formData.serviceType,
        diagnosticDetails: formData.diagnosticDetails || 'Revisión y ejecución en taller especializado.',
        partsCostCOP: formData.partsCostCOP,
        laborCostCOP: formData.laborCostCOP,
        advancePaymentCOP: formData.advancePaymentCOP,
        advancePaymentMethod: formData.advancePaymentMethod,
        promiseDate: formData.promiseDate,
      });

      setIsNewModalOpen(false);
      if (onCloseNewModalInitial) onCloseNewModalInitial();
      alert('Orden de servicio registrada en custodia. Comprobante de pesaje emitido.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openPaymentModal = (r: RepairOrder) => {
    setPaymentOrder(r);
    setPaymentAmount(r.balanceCOP);
    setPaymentMethod('EFECTIVO');
  };

  const handleAdvanceStatus = (r: RepairOrder) => {
    const stages: RepairOrder['status'][] = [
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'EN_PROCESO',
      'CONTROL_CALIDAD',
      'LISTO_ENTREGA',
      'ENTREGADO',
    ];
    const currentIndex = stages.indexOf(r.status);
    if (currentIndex < stages.length - 1) {
      const nextStatus = stages[currentIndex + 1];
      let finalWeight: number | undefined;

      if (nextStatus === 'ENTREGADO') {
        if (r.balanceCOP > 0.01) {
          openPaymentModal(r);
          alert(
            `La orden tiene un saldo pendiente de $${r.balanceCOP.toLocaleString('es-CO')}. Registre el pago antes de entregar.`
          );
          return;
        }
        const input = prompt(
          `Entrega de joya al cliente.\nPeso inicial en balanza: ${r.initialWeightGrams}g\n\nIngrese el peso verificado de salida en balanza (g):`,
          r.initialWeightGrams.toString()
        );
        if (input === null) return;
        finalWeight = parseFloat(input) || r.initialWeightGrams;
      }

      try {
        erpDb.updateRepairStatus(r.id, nextStatus, finalWeight);
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrder) return;
    try {
      erpDb.addRepairPayment(paymentOrder.id, paymentAmount, paymentMethod);
      setPaymentOrder(null);
      alert('Pago registrado y aplicado al saldo de la orden.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const statusList = [
    { id: 'TODOS', label: 'Todas las Órdenes' },
    { id: 'RECIBIDO', label: '📥 Recibidas' },
    { id: 'EN_PROCESO', label: '⚙️ En Taller' },
    { id: 'LISTO_ENTREGA', label: '✅ Listas para Retiro' },
    { id: 'ENTREGADO', label: '📦 Entregadas' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#20242B] tracking-tight">
            Taller & Reparaciones (Custodia de Clientes)
          </h1>
          <p className="text-xs text-[#727985]">
            Separación estricta del inventario propio con pesaje inicial y final en balanza
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Recibir Joya en Taller</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-float p-3.5 space-y-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, orden REP o descripción de pieza..."
            className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl pl-9 pr-4 py-2 text-xs text-[#20242B] placeholder-[#727985] focus:outline-none focus:border-[#10B981] focus:bg-white transition-colors"
          />
        </div>

        {/* Status scroll pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {statusList.map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? 'bg-[#10B981] text-white shadow-xs font-semibold'
                  : 'bg-[#F4F5F7] text-[#727985] hover:text-[#20242B] border border-[#EAECEF]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Repair Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepairs.map((r) => {
          const isFinished = r.status === 'ENTREGADO';
          const isReady = r.status === 'LISTO_ENTREGA';
          return (
            <div
              key={r.id}
              className={`card-float p-4 flex flex-col justify-between space-y-3 transition-all ${
 isReady ? 'border-[#21865B] ring-1 ring-[#21865B]/20' : 'border-[#EAECEF]'
 }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-[#3478C6] bg-[#3478C6]/10 px-2 py-0.5 rounded-lg text-[11px]">
                    {r.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isFinished
                        ? 'bg-[#21865B]/10 text-[#21865B]'
                        : isReady
                        ? 'bg-[#21865B] text-white font-bold'
                        : 'bg-[#DC2626]/10 text-[#DC2626]'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#20242B] leading-snug">
                  {r.itemDescription}
                </h3>
                <p className="text-xs text-[#727985] mt-0.5">
                  Servicio: <strong className="text-[#20242B]">{r.serviceType}</strong>
                </p>

                {/* Custody details strip */}
                <div className="bg-[#F8F9FA] rounded-xl p-3 my-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#727985]">Propietario:</span>
                    <span className="font-semibold text-[#20242B]">{r.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#727985]">Teléfono:</span>
                    <span className="text-[#20242B] flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-[#727985]" />
                      {r.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#727985]">Peso Balanza Inicial:</span>
                    <span className="font-mono font-bold text-[#20242B]">{formatGrams(r.initialWeightGrams)}</span>
                  </div>
                  {r.finalWeightGrams && (
                    <div className="flex justify-between text-[#21865B] font-semibold">
                      <span>Peso Balanza Salida:</span>
                      <span className="font-mono font-bold">{formatGrams(r.finalWeightGrams)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-[#EAECEF]">
                    <span className="text-[#727985]">Fecha Promesa:</span>
                    <span className="font-semibold text-[#20242B]">{formatDate(r.promiseDate)}</span>
                  </div>
                </div>

                {r.previousDefects && (
                  <p className="text-[11px] text-[#727985] italic line-clamp-1">
                    <strong>Al recibir:</strong> {r.previousDefects}
                  </p>
                )}
              </div>

              {/* Bottom strip with finance & status advance action */}
              <div className="pt-2.5 border-t border-[#EAECEF] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#727985] block">Saldo Pendiente:</span>
                  <span className={`font-mono font-bold ${r.balanceCOP > 0 ? 'text-[#D64545]' : 'text-[#21865B]'}`}>
                    {formatCOP(r.balanceCOP)}
                  </span>
                  <span className="text-[10px] text-[#727985] block mt-0.5">
                    {r.payments.length} pago(s) registrado(s)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isFinished && r.balanceCOP > 0 && (
                    <button
                      onClick={() => openPaymentModal(r)}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#F4F5F7] border border-[#EAECEF] text-[#20242B] hover:bg-[#EAECEF] active:scale-95 transition-all"
                    >
                      Registrar pago
                    </button>
                  )}
                  {!isFinished && (
                    <button
                      onClick={() => handleAdvanceStatus(r)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-xs ${
                        isReady
                          ? 'bg-[#21865B] hover:bg-emerald-700 text-white'
                          : 'bg-[#10B981] hover:bg-[#059669] text-white'
                      }`}
                    >
                      <span>
                        {isReady
                          ? 'Entregar al Cliente'
                          : r.status === 'RECIBIDO'
                          ? 'Iniciar en Taller'
                          : r.status === 'EN_PROCESO'
                          ? 'Control de Calidad'
                          : 'Avanzar Estado'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NEW REPAIR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#EAECEF]">
              <div>
                <h2 className="text-base font-bold text-[#20242B]">Recepción de Joya en Taller</h2>
                <p className="text-xs text-[#727985]">Documento formal de recibo y custodia con pesaje certificado</p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1.5 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Cliente Propietario *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                >
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.docNumber}) - Tel: {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Descripción de la Joya *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Anillo de compromiso en oro blanco con zafiro oval"
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Metal Declarado</label>
                  <input
                    type="text"
                    value={formData.declaredMetal}
                    onChange={(e) => setFormData({ ...formData, declaredMetal: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Peso Inicial Balanza (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.initialWeightGrams}
                    onChange={(e) => setFormData({ ...formData, initialWeightGrams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono font-bold text-[#20242B]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Servicio Solicitado</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                >
                  <option value="Ajuste de Talla">Ajuste de Talla</option>
                  <option value="Engaste y Reposición de Gema">Engaste y Reposición de Gema</option>
                  <option value="Pulido y Baño de Rodio">Pulido y Baño de Rodio</option>
                  <option value="Soldadura Láser">Soldadura Láser</option>
                  <option value="Grabado Láser">Grabado Láser</option>
                  <option value="Hechura Personalizada">Hechura Personalizada</option>
                  <option value="Mantenimiento y Ajuste Broche">Mantenimiento y Ajuste Broche</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F8F9FA] p-3 rounded-2xl border border-[#EAECEF]">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Mano de Obra</label>
                  <input
                    type="number"
                    value={formData.laborCostCOP}
                    onChange={(e) => setFormData({ ...formData, laborCostCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#EAECEF] rounded-lg px-2.5 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Repuestos / Oro</label>
                  <input
                    type="number"
                    value={formData.partsCostCOP}
                    onChange={(e) => setFormData({ ...formData, partsCostCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#EAECEF] rounded-lg px-2.5 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Anticipo Pagado</label>
                  <input
                    type="number"
                    value={formData.advancePaymentCOP}
                    onChange={(e) => setFormData({ ...formData, advancePaymentCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#EAECEF] rounded-lg px-2.5 py-1 font-mono font-bold text-[#21865B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Método del Anticipo</label>
                  <select
                    value={formData.advancePaymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advancePaymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full bg-white border border-[#EAECEF] rounded-lg px-2.5 py-1 font-medium"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA_DEBITO">Tarjeta débito</option>
                    <option value="TARJETA_CREDITO">Tarjeta crédito</option>
                    <option value="TRANSFERENCIA_BANCOLOMBIA">Transferencia</option>
                    <option value="NEQUI_DAVIPLATA">Nequi / Daviplata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Fecha Promesa</label>
                <input
                  type="date"
                  value={formData.promiseDate}
                  onChange={(e) => setFormData({ ...formData, promiseDate: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5"
                />
              </div>

              <div className="pt-2 border-t border-[#EAECEF] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold"
                >
                  Recibir en Custodia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGO DE TALLER */}
      {paymentOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-md p-5 sm:p-7 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#EAECEF]">
              <div>
                <h2 className="text-base font-bold text-[#20242B]">Registrar pago de taller</h2>
                <p className="text-xs text-[#727985]">
                  {paymentOrder.orderNumber} · {paymentOrder.customerName}
                </p>
              </div>
              <button onClick={() => setPaymentOrder(null)} className="p-1.5 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F8F9FA] rounded-xl p-3 flex justify-between items-center">
              <span className="text-[#727985]">Saldo pendiente</span>
              <span className="font-mono font-bold text-[#D64545]">
                {formatCOP(paymentOrder.balanceCOP)}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Monto a pagar *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentOrder.balanceCOP}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-mono font-bold text-[#20242B]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Método de pago *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_DEBITO">Tarjeta débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta crédito</option>
                  <option value="TRANSFERENCIA_BANCOLOMBIA">Transferencia</option>
                  <option value="NEQUI_DAVIPLATA">Nequi / Daviplata</option>
                </select>
              </div>

              <p className="text-[11px] text-[#727985]">
                Los pagos en efectivo afectan el arqueo del turno de caja abierto.
              </p>

              <div className="pt-2 border-t border-[#EAECEF] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOrder(null)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#21865B] hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Aplicar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
