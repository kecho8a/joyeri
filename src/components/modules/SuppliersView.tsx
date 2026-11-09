/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  X,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Supplier } from '../../types';
import { formatCOP } from '../../utils/jewelryCalculations';

export const SuppliersView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nit: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: 'Bogotá D.C.',
    category: 'Fundición y Metales' as Supplier['category'],
    balancePendingCOP: 0,
  });

  const filteredSuppliers = state.suppliers.filter((s) => {
    return (
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nit.includes(searchTerm) ||
      s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.nit) {
      alert('Nombre y NIT son obligatorios');
      return;
    }

    erpDb.createSupplier({
      nit: formData.nit,
      companyName: formData.companyName,
      contactName: formData.contactName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      category: formData.category,
      balancePendingCOP: formData.balancePendingCOP,
    });
    setIsNewModalOpen(false);
    alert('Proveedor guardado exitosamente.');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Proveedores de Metales, Gemas & Talleres Externos
          </h1>
          <p className="text-xs text-[#727985]">
            Directorio de refinerías de oro, minas de esmeralda, orfebres y cuentas por pagar
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filter bar */}
      <div className="card-float p-3 flex items-center gap-3 text-xs">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por razón social, NIT o contacto..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div
            key={s.id}
            className="card-float p-4 hover:border-[#10B981] transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#727985] bg-[#F4F5F7] px-2 py-0.5 rounded">
                  NIT: {s.nit}
                </span>
                <span className="text-[10px] bg-[#10B981]/10 text-[#059669] font-semibold px-2 py-0.5 rounded">
                  {s.category}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#20242B] mt-2">{s.companyName}</h3>
              <p className="text-xs text-[#727985] mt-0.5">Contacto: {s.contactName}</p>

              <div className="mt-3 space-y-1 text-xs text-[#727985]">
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {s.phone}</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {s.email}</p>
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {s.city}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#727985] block">Saldo Pendiente (CxP)</span>
                <span className="font-mono font-bold text-[#D64545] tabular-nums">
                  {formatCOP(s.balancePendingCOP)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: NEW SUPPLIER */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#20242B]">Nuevo Proveedor</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">NIT / Cédula *</label>
                  <input
                    type="text"
                    required
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2 py-1.5"
                  >
                    <option value="Fundición y Metales">Fundición y Metales</option>
                    <option value="Piedras Preciosas y Esmeraldas">Esmeraldas & Gemas</option>
                    <option value="Hechura y Orfebrería">Hechura y Orfebrería</option>
                    <option value="Herramientas e Insumos">Herramientas e Insumos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
                  <label className="font-semibold text-[#20242B] block mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-[#727985]">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold">
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
