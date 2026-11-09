/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookmarkCheck,
  Plus,
  Search,
  DollarSign,
  Package,
  Calendar,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  Phone,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Layaway, Product, Customer, PaymentMethod } from '../../types';
import {
  formatCOP,
  formatDateTime,
  formatDate,
} from '../../utils/jewelryCalculations';

export const LayawaysView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [paymentModalLayaway, setPaymentModalLayaway] = useState<Layaway | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(500000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');

  // New Layaway Form
  const availableJewels = state.products.filter((p) => p.status === 'DISPONIBLE');
  const [selectedProductId, setSelectedProductId] = useState(availableJewels[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [initialDeposit, setInitialDeposit] = useState<number>(1000000);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [dueDate, setDueDate] = useState('2026-05-15');

  const selectedProduct = state.products.find((p) => p.id === selectedProductId);

  const filteredLayaways = state.layaways.filter((l) => {
    const matchesSearch =
      l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.productSku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'TODOS' || l.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Seleccione una joya para apartar');
      return;
    }
    if (!selectedCustomerId) {
      alert('Seleccione un cliente registrado');
      return;
    }

    try {
      erpDb.createLayaway({
        customerId: selectedCustomerId,
        productId: selectedProductId,
        initialDepositCOP: initialDeposit,
        paymentMethod: initialPaymentMethod,
        dueDate,
      });

      setIsNewModalOpen(false);
      alert('Apartado registrado. La joya ha quedado en estado RESERVADO.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalLayaway) return;
    if (paymentAmount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    try {
      erpDb.addLayawayPayment(paymentModalLayaway.id, paymentAmount, paymentMethod);
      setPaymentModalLayaway(null);
      alert('Abono registrado en caja y actualizado en el saldo del cliente.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeliver = (layawayId: string) => {
    if (confirm('¿Confirmar entrega definitiva de la joya al cliente? Se generará la factura y garantía de la venta.')) {
      try {
        const sale = erpDb.deliverLayaway(layawayId);
        alert(
          `Joya entregada. Factura ${sale.invoiceNumber} emitida por ${formatCOP(sale.totalCOP)} con garantía ${sale.warrantyCode}.`
        );
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filterTabs = [
    { id: 'TODOS', label: 'Todos los Separados' },
    { id: 'ACTIVO', label: 'En Pago' },
    { id: 'PAGADO', label: '✅ Listos para Entregar' },
    { id: 'ENTREGADO', label: '📦 Entregados' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#20242B] tracking-tight">
            Separados & Planes de Pago a Cuotas
          </h1>
          <p className="text-xs text-[#727985]">
            Reserva de joyas con anticipo, abonos progresivos a caja y entrega contra saldo cero
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Separado</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código SEP, cliente o joya..."
            className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl pl-9 pr-4 py-2 text-xs text-[#20242B] placeholder-[#727985] focus:outline-none focus:border-[#9B7028] focus:bg-white transition-colors"
          />
        </div>

        {/* Filter scroll pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-[#9B7028] text-white shadow-xs font-semibold'
                  : 'bg-[#F4F5F7] text-[#727985] hover:text-[#20242B] border border-[#EAECEF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layaways Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLayaways.map((lay) => {
          const pctPaid = Math.min(100, ((lay.totalAmountCOP - lay.balanceCOP) / lay.totalAmountCOP) * 100);
          const isFullyPaid = lay.balanceCOP === 0 || lay.status === 'PAGADO';
          const isDelivered = lay.status === 'ENTREGADO';

          return (
            <div
              key={lay.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3 transition-all ${
                isFullyPaid && !isDelivered
                  ? 'border-[#21865B] ring-1 ring-[#21865B]/20'
                  : 'border-[#EAECEF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#7F581A] bg-[#9B7028]/10 px-2 py-0.5 rounded-lg text-[11px]">
                    {lay.code}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isDelivered
                        ? 'bg-[#727985]/10 text-[#727985]'
                        : isFullyPaid
                        ? 'bg-[#21865B] text-white font-bold'
                        : 'bg-[#D99032]/10 text-[#D99032]'
                    }`}
                  >
                    {lay.status}
                  </span>
                </div>
                {isDelivered && lay.invoiceNumber && (
                  <p className="text-[10px] font-mono text-[#21865B] mt-1">
                    Factura: {lay.invoiceNumber}
                  </p>
                )}

                <h3 className="font-bold text-sm sm:text-base text-[#20242B] leading-snug">
                  {lay.productName}
                </h3>
                <p className="text-xs text-[#727985] mt-0.5 font-medium">
                  Cliente: <strong className="text-[#20242B]">{lay.customerName}</strong> ({lay.customerPhone})
                </p>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#727985]">Abonado: {pctPaid.toFixed(0)}%</span>
                    <span className="font-mono font-bold text-[#20242B] tabular-nums">
                      {formatCOP(lay.totalAmountCOP - lay.balanceCOP)} de {formatCOP(lay.totalAmountCOP)}
                    </span>
                  </div>
                  <div className="w-full bg-[#F4F5F7] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFullyPaid ? 'bg-[#21865B]' : 'bg-[#9B7028]'}`}
                      style={{ width: `${pctPaid}%` }}
                    />
                  </div>
                </div>

                {/* Balance & Due Date strip */}
                <div className="grid grid-cols-2 gap-2 bg-[#F8F9FA] p-3 rounded-xl mt-3 text-xs">
                  <div>
                    <span className="text-[#727985] block text-[10px]">Saldo por Pagar:</span>
                    <span className={`font-mono font-bold text-sm ${lay.balanceCOP > 0 ? 'text-[#D64545]' : 'text-[#21865B]'}`}>
                      {formatCOP(lay.balanceCOP)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#727985] block text-[10px]">Fecha Límite:</span>
                    <span className="font-medium text-[#20242B]">{formatDate(lay.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2.5 border-t border-[#EAECEF] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#727985] text-[11px]">
                  {lay.installments.length} abono(s) registrado(s)
                </span>

                <div className="flex items-center gap-2">
                  {!isDelivered && lay.balanceCOP > 0 && (
                    <button
                      onClick={() => {
                        setPaymentModalLayaway(lay);
                        setPaymentAmount(Math.min(500000, lay.balanceCOP));
                      }}
                      className="px-3.5 py-1.5 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                    >
                      + Abonar Cuota
                    </button>
                  )}
                  {isFullyPaid && !isDelivered && (
                    <button
                      onClick={() => handleDeliver(lay.id)}
                      className="px-3.5 py-1.5 bg-[#21865B] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Entregar Joya
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NEW LAYAWAY */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-lg p-5 sm:p-7 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#EAECEF]">
              <div>
                <h2 className="text-base font-bold text-[#20242B]">Separar Joya a Cuotas</h2>
                <p className="text-xs text-[#727985]">Bloqueo en inventario comercial hasta liquidación total</p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1.5 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Joya a Separar *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                >
                  {availableJewels.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.sku} - {j.name} ({formatCOP(j.salePriceCOP)})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-[11px] text-[#727985] mt-1 font-mono">
                    Valor total de venta: <strong className="text-[#20242B]">{formatCOP(selectedProduct.salePriceCOP)}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Cliente Titular *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                >
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.docNumber}) - Tel: {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Anticipo Inicial (COP) *</label>
                  <input
                    type="number"
                    required
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#727985] block mt-0.5">Sugerido: 30%</span>
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Medio de Pago</label>
                  <select
                    value={initialPaymentMethod}
                    onChange={(e) => setInitialPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5"
                  >
                    <option value="EFECTIVO">Efectivo (Entra a Caja)</option>
                    <option value="TARJETA_CREDITO">Tarjeta Débito/Crédito</option>
                    <option value="TRANSFERENCIA_BANCOLOMBIA">Bancolombia</option>
                    <option value="NEQUI_DAVIPLATA">Nequi / Daviplata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Fecha Límite de Liquidación *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-xl font-bold"
                >
                  Crear Separado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PAYMENT */}
      {paymentModalLayaway && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-sm p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#EAECEF]">
              <div>
                <h3 className="font-bold text-[#20242B] text-sm">Abono a Separado</h3>
                <p className="text-[11px] font-mono text-[#727985]">{paymentModalLayaway.code}</p>
              </div>
              <button onClick={() => setPaymentModalLayaway(null)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#EAECEF]">
                <p className="text-[#727985] text-[11px]">Saldo pendiente actual:</p>
                <p className="font-mono font-bold text-base text-[#D64545]">
                  {formatCOP(paymentModalLayaway.balanceCOP)}
                </p>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Monto del Abono (COP) *</label>
                <input
                  type="number"
                  required
                  max={paymentModalLayaway.balanceCOP}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-mono font-bold text-[#20242B]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2"
                >
                  <option value="EFECTIVO">Efectivo (Entra a Caja)</option>
                  <option value="TARJETA_CREDITO">Tarjeta Débito/Crédito</option>
                  <option value="TRANSFERENCIA_BANCOLOMBIA">Bancolombia</option>
                  <option value="NEQUI_DAVIPLATA">Nequi / Daviplata</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EAECEF]">
                <button
                  type="button"
                  onClick={() => setPaymentModalLayaway(null)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-xl font-bold"
                >
                  Registrar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
