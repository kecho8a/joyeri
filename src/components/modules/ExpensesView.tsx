/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  DollarSign,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Expense, PaymentMethod } from '../../types';
import { formatCOP, formatDate } from '../../utils/jewelryCalculations';

export const ExpensesView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Insumos de Taller' as Expense['category'],
    description: '',
    amountCOP: 150000,
    beneficiary: '',
    paymentMethod: 'EFECTIVO' as PaymentMethod,
  });

  const filteredExpenses = state.expenses.filter((e) => {
    return (
      e.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amountCOP, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.beneficiary || formData.amountCOP <= 0) {
      alert('Complete los campos obligatorios del gasto');
      return;
    }

    try {
      erpDb.recordExpense({
        category: formData.category,
        description: formData.description,
        amountCOP: formData.amountCOP,
        beneficiary: formData.beneficiary,
        paymentMethod: formData.paymentMethod,
      });

      setIsNewModalOpen(false);
      alert('Gasto registrado exitosamente, descontado de caja/bancos y asentado en contabilidad.');
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
            Gastos & Egresos Operacionales de Joyería
          </h1>
          <p className="text-xs text-[#727985]">
            Control de insumos de taller, seguridad de bóvedas, arriendos y afectación directa a caja y contabilidad
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-[#F4F5F7] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium text-[#20242B]">
            Total Egresos: <strong className="font-mono text-[#D64545]">{formatCOP(totalExpenses)}</strong>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Gasto
          </button>
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
            placeholder="Buscar por comprobante, beneficiario o concepto..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#9B7028] focus:bg-white"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2.5 px-3">Comprobante</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3">Concepto / Descripción</th>
                <th className="py-2.5 px-3">Beneficiario</th>
                <th className="py-2.5 px-3">Medio de Pago</th>
                <th className="py-2.5 px-3 text-right">Valor (COP)</th>
                <th className="py-2.5 px-3">Registrado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-[#F4F5F7]/30">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#D64545]">{e.voucherNumber}</td>
                  <td className="py-2.5 px-3 text-[#727985]">{formatDate(e.date)}</td>
                  <td className="py-2.5 px-3 font-semibold">{e.category}</td>
                  <td className="py-2.5 px-3 text-[#20242B]">{e.description}</td>
                  <td className="py-2.5 px-3 font-medium">{e.beneficiary}</td>
                  <td className="py-2.5 px-3 text-[#727985]">{e.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D64545] tabular-nums">
                    -{formatCOP(e.amountCOP)}
                  </td>
                  <td className="py-2.5 px-3 text-[#727985]">{e.registeredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW EXPENSE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#20242B]">Registrar Gasto Operacional</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5"
                  >
                    <option value="Insumos de Taller">Insumos de Taller</option>
                    <option value="Seguridad y Bóvedas">Seguridad y Bóvedas</option>
                    <option value="Arriendo">Arriendo Local</option>
                    <option value="Servicios Públicos">Servicios Públicos</option>
                    <option value="Publicidad y Mercadeo">Publicidad</option>
                    <option value="Honorarios">Honorarios Profesionales</option>
                    <option value="Gastos Menores">Gastos Menores (Caja Menor)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Medio de Pago</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5"
                  >
                    <option value="EFECTIVO">Efectivo (Sale de Caja)</option>
                    <option value="TRANSFERENCIA_BANCOLOMBIA">Transferencia Bancolombia</option>
                    <option value="TARJETA_CREDITO">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Beneficiario / Proveedor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Insumos Joyeros de Colombia"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Concepto / Detalle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de pasta para pulido dialux y brocas"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Valor del Gasto (COP) *</label>
                <input
                  type="number"
                  required
                  value={formData.amountCOP}
                  onChange={(e) => setFormData({ ...formData, amountCOP: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#D64545]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-[#727985]">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#D64545] hover:bg-red-700 text-white rounded-lg font-semibold">
                  Confirmar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
