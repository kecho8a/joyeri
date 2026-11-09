/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  ShieldCheck,
  User,
  Filter,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { AuditLogItem } from '../../types';
import { formatDateTime } from '../../utils/jewelryCalculations';

export const AuditView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('TODOS');

  const filteredLogs = state.auditLogs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'TODOS' || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Bitácora de Auditoría, Trazabilidad & Seguridad
          </h1>
          <p className="text-xs text-[#727985]">
            Registro histórico inalterable de cada operación, cambio de precio, traslado y venta
          </p>
        </div>
        <div className="text-xs bg-[#21865B]/10 text-[#21865B] px-3 py-1.5 rounded-lg border border-[#21865B]/20 font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          Pista de Auditoría Activa ({state.auditLogs.length} eventos)
        </div>
      </div>

      {/* Filter bar */}
      <div className="card-float p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar evento, usuario o acción..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium"
        >
          <option value="TODOS">Todos los módulos</option>
          <option value="Ventas">Ventas POS</option>
          <option value="Inventario">Inventario</option>
          <option value="Caja y Bancos">Caja y Bancos</option>
          <option value="Apartados">Apartados</option>
          <option value="Taller de Reparaciones">Taller</option>
          <option value="Fabricación">Fabricación</option>
          <option value="Metales Preciosos">Metales Preciosos</option>
          <option value="Sesión">Sesión / Usuario</option>
        </select>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="card-float overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Acción Registrada</th>
                <th className="py-2.5 px-3">Módulo</th>
                <th className="py-2.5 px-3">Detalle Operacional</th>
                <th className="py-2.5 px-3">Usuario Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F4F5F7]/30">
                  <td className="py-2.5 px-3 text-[#727985] font-mono whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-xs text-[#20242B] bg-[#F4F5F7] px-2 py-0.5 rounded border border-[#E5E7EB]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#059669]">
                    {log.module}
                  </td>
                  <td className="py-2.5 px-3 text-[#20242B]">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                    {log.userName}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#727985]">
                    No hay eventos de auditoría que coincidan con la búsqueda.
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
