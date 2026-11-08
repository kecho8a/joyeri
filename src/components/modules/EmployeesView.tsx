/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  DollarSign,
  TrendingUp,
  Percent,
  Award,
  X,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Employee } from '../../types';
import { formatCOP } from '../../utils/jewelryCalculations';

export const EmployeesView: React.FC = () => {
  const state = erpDb.getState();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    docNumber: '',
    name: '',
    roleTitle: 'Asesor Comercial de Joyería',
    baseSalaryCOP: 2200000,
    commissionRatePercent: 2.5,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.docNumber) {
      alert('Nombre y documento son obligatorios');
      return;
    }

    const newEmp: Employee = {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      docNumber: formData.docNumber,
      name: formData.name,
      roleTitle: formData.roleTitle,
      branchId: state.activeBranchId,
      baseSalaryCOP: formData.baseSalaryCOP,
      commissionRatePercent: formData.commissionRatePercent,
      salesCurrentMonthCOP: 0,
      commissionEarnedCOP: 0,
      active: true,
    };

    state.employees.unshift(newEmp);
    erpDb.addAudit('CREAR_EMPLEADO', 'Personal', `Registrado empleado ${newEmp.name}`);
    setIsNewModalOpen(false);
    alert('Empleado registrado exitosamente.');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Empleados & Liquidación de Comisiones Comerciales
          </h1>
          <p className="text-xs text-[#727985]">
            Seguimiento de metas, ventas individuales netas y comisiones calculadas por asesor
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.employees.map((emp) => {
          const totalCompensation = emp.baseSalaryCOP + emp.commissionEarnedCOP;
          return (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#20242B]">{emp.name}</h3>
                  <p className="text-xs text-[#727985]">{emp.roleTitle}</p>
                </div>
                <span className="text-[10px] bg-[#21865B]/10 text-[#21865B] font-semibold px-2 py-0.5 rounded">
                  Activo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F4F5F7] p-3 rounded-lg text-xs">
                <div>
                  <span className="text-[#727985] block text-[11px]">Salario Base:</span>
                  <span className="font-mono font-bold text-[#20242B]">{formatCOP(emp.baseSalaryCOP)}</span>
                </div>
                <div>
                  <span className="text-[#727985] block text-[11px]">Tasa Comisión:</span>
                  <span className="font-mono font-bold text-[#9B7028]">{emp.commissionRatePercent}%</span>
                </div>
                <div>
                  <span className="text-[#727985] block text-[11px]">Ventas del Mes:</span>
                  <span className="font-mono font-bold text-[#20242B]">{formatCOP(emp.salesCurrentMonthCOP)}</span>
                </div>
                <div>
                  <span className="text-[#21865B] block font-semibold text-[11px]">Comisión Ganada:</span>
                  <span className="font-mono font-bold text-[#21865B]">{formatCOP(emp.commissionEarnedCOP)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#727985]">Total Compensación Mensual:</span>
                <span className="font-mono font-bold text-sm text-[#20242B]">
                  {formatCOP(totalCompensation)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NEW EMPLOYEE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#20242B]">Nuevo Empleado / Asesor</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Cédula de Ciudadanía *</label>
                  <input
                    type="text"
                    required
                    value={formData.docNumber}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Cargo</label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Salario Base (COP) *</label>
                  <input
                    type="number"
                    required
                    value={formData.baseSalaryCOP}
                    onChange={(e) => setFormData({ ...formData, baseSalaryCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Tasa Comisión (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.commissionRatePercent}
                    onChange={(e) => setFormData({ ...formData, commissionRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-[#727985]">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-lg font-semibold">
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
