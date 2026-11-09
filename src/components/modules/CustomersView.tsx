/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Star,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  X,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Customer } from '../../types';
import {
  formatCOP,
  formatDate,
} from '../../utils/jewelryCalculations';

export const CustomersView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('TODOS');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    docType: 'CC' as Customer['docType'],
    docNumber: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Bogotá D.C.',
    segment: 'Frecuente' as Customer['segment'],
    preferredMetal: 'Oro 18K y Esmeraldas',
    anniversaryDate: '',
    birthday: '',
    notes: '',
  });

  const filteredCustomers = state.customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.docNumber.includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = segmentFilter === 'TODOS' || c.segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.docNumber) {
      alert('Nombre e identificación son obligatorios');
      return;
    }

    erpDb.createCustomer({
      docType: formData.docType,
      docNumber: formData.docNumber,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      segment: formData.segment,
      anniversaryDate: formData.anniversaryDate || undefined,
      birthday: formData.birthday || undefined,
      preferredMetal: formData.preferredMetal,
      notes: formData.notes,
    });
    setIsNewModalOpen(false);
    alert('Cliente registrado exitosamente en la base de datos.');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Clientes & CRM de Alta Joyería
          </h1>
          <p className="text-xs text-[#727985]">
            Historial de compras, fechas conmemorativas (aniversarios/cumpleaños) y segmentación VIP
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Filter bar */}
      <div className="card-float p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nombre, documento, teléfono..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
          />
        </div>

        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium"
        >
          <option value="TODOS">Todos los segmentos</option>
          <option value="VIP">Clientes VIP</option>
          <option value="Frecuente">Clientes Frecuentes</option>
          <option value="Ocasional">Clientes Ocasionales</option>
        </select>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            className="card-float p-4 hover:border-[#10B981] transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#727985] bg-[#F4F5F7] px-2 py-0.5 rounded">
                  {c.docType} {c.docNumber}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    c.segment === 'VIP'
                      ? 'bg-[#10B981]/15 text-[#059669] font-bold'
                      : 'bg-[#F4F5F7] text-[#727985]'
                  }`}
                >
                  {c.segment}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#20242B] mt-2">{c.name}</h3>
              <p className="text-xs text-[#727985] flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> {c.phone}
              </p>
              <p className="text-xs text-[#727985] flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {c.email || 'Sin correo'}
              </p>

              <div className="bg-[#F4F5F7] rounded-lg p-2.5 mt-2.5 space-y-1 text-xs">
                {c.preferredMetal && (
                  <p className="text-[#20242B]">
                    <span className="text-[#727985]">Preferencia:</span> {c.preferredMetal}
                  </p>
                )}
                {c.anniversaryDate && (
                  <p className="text-[#059669] flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" /> Aniversario: {formatDate(c.anniversaryDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#727985] block">Compras Totales</span>
                <span className="font-mono font-bold text-[#20242B] tabular-nums">
                  {formatCOP(c.totalPurchasesCOP)}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(c)}
                className="px-2.5 py-1 text-xs bg-[#F4F5F7] hover:bg-[#E5E7EB] rounded font-medium text-[#20242B]"
              >
                Ficha CRM
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: NEW CUSTOMER */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#20242B]">Nuevo Cliente JOYERI</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Tipo Doc.</label>
                  <select
                    value={formData.docType}
                    onChange={(e) => setFormData({ ...formData, docType: e.target.value as any })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5"
                  >
                    <option value="CC">Cédula (CC)</option>
                    <option value="NIT">NIT Empresa</option>
                    <option value="CE">Cédula Ext. (CE)</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-[#20242B] block mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 52.894.210"
                    value={formData.docNumber}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Camila Restrepo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 315 889 4521"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Segmento</label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value as any })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  >
                    <option value="VIP">Cliente VIP</option>
                    <option value="Frecuente">Cliente Frecuente</option>
                    <option value="Ocasional">Cliente Ocasional</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Fecha de Aniversario</label>
                  <input
                    type="date"
                    value={formData.anniversaryDate}
                    onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Preferencia de Metales & Gemas</label>
                <input
                  type="text"
                  placeholder="Ej. Oro 18K Blanco, Esmeraldas de Muzo, Talla 6"
                  value={formData.preferredMetal}
                  onChange={(e) => setFormData({ ...formData, preferredMetal: e.target.value })}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-[#727985]">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER DETAILS CRM */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="font-mono text-xs font-bold text-[#059669] bg-[#10B981]/10 px-2 py-0.5 rounded">
                  {selectedCustomer.segment}
                </span>
                <h3 className="font-bold text-base text-[#20242B] mt-1">{selectedCustomer.name}</h3>
                <p className="text-[#727985]">{selectedCustomer.docType} {selectedCustomer.docNumber}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#F4F5F7] p-3 rounded-xl">
              <div>
                <span className="text-[#727985] block">Teléfono Móvil:</span>
                <span className="font-semibold text-[#20242B]">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-[#727985] block">Correo:</span>
                <span className="font-semibold text-[#20242B]">{selectedCustomer.email || '-'}</span>
              </div>
              <div>
                <span className="text-[#727985] block">Dirección:</span>
                <span className="text-[#20242B]">{selectedCustomer.address || '-'} ({selectedCustomer.city})</span>
              </div>
              <div>
                <span className="text-[#727985] block">Total Facturado Histórico:</span>
                <span className="font-mono font-bold text-[#20242B]">{formatCOP(selectedCustomer.totalPurchasesCOP)}</span>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div className="border border-[#E5E7EB] rounded-xl p-3">
                <span className="font-semibold text-[#727985] block mb-1">Notas Comerciales:</span>
                <p className="text-[#20242B]">{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-[#20242B] text-white rounded-lg font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
