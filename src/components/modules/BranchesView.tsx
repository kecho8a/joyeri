/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building,
  Plus,
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle2,
  X,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Branch } from '../../types';
import { formatCOP } from '../../utils/jewelryCalculations';

export const BranchesView: React.FC = () => {
  const state = erpDb.getState();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    city: 'Cali',
    address: '',
    phone: '',
    managerName: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Nombre y código de sede son obligatorios');
      return;
    }

    erpDb.createBranch({
      code: formData.code,
      name: formData.name,
      city: formData.city,
      address: formData.address,
      phone: formData.phone,
      managerName: formData.managerName,
    });
    setIsNewModalOpen(false);
    alert('Nueva sucursal creada exitosamente.');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Gestión Multi-Sede & Sucursales
          </h1>
          <p className="text-xs text-[#727985]">
            Administración centralizada de inventarios, cajas independientes y traslados inter-sucursales
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Sede
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.branches.map((b) => {
          const branchProducts = state.products.filter((p) => p.branchId === b.id && p.status === 'DISPONIBLE');
          const branchValuation = branchProducts.reduce((acc, p) => acc + p.salePriceCOP, 0);
          const isCurrent = state.activeBranchId === b.id;

          return (
            <div
              key={b.id}
              className={`bg-white rounded-xl border p-4 shadow-sm space-y-3 transition-all ${
                isCurrent ? 'border-[#9B7028] ring-1 ring-[#9B7028]/20' : 'border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#727985] bg-[#F4F5F7] px-2 py-0.5 rounded">
                    {b.code}
                  </span>
                  <h3 className="font-bold text-sm text-[#20242B] mt-1.5">{b.name}</h3>
                  <p className="text-xs text-[#727985]">{b.city}</p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-[#7F581A] bg-[#9B7028]/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Activa
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-[#727985]">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {b.address}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {b.phone}</p>
                <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Gerente: {b.managerName}</p>
              </div>

              <div className="bg-[#F4F5F7] p-2.5 rounded-lg grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#727985] block text-[11px]">Joyas en Vitrina:</span>
                  <span className="font-mono font-bold text-[#20242B]">{branchProducts.length} uds</span>
                </div>
                <div>
                  <span className="text-[#727985] block text-[11px]">Valorización Stock:</span>
                  <span className="font-mono font-bold text-[#20242B] tabular-nums">{formatCOP(branchValuation)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex justify-end">
                {!isCurrent ? (
                  <button
                    onClick={() => erpDb.setActiveBranch(b.id)}
                    className="px-3 py-1.5 bg-[#F4F5F7] hover:bg-[#E5E7EB] text-[#20242B] rounded-lg text-xs font-semibold"
                  >
                    Seleccionar como Sede Activa
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-[#7F581A]">Operando en esta sede</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NEW BRANCH */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#20242B]">Nueva Sede / Sucursal</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Código de Sede *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CALI-CHIPICHAPE"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Nombre Comercial de la Sede *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sede Centro Comercial Chipichape"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Dirección Completa *</label>
                <input
                  type="text"
                  required
                  placeholder="Calle o Carrera y número de local..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Gerente de Sede</label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-[#727985]">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-lg font-semibold">
                  Crear Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
