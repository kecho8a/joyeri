/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShoppingCart,
  RotateCcw,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { StockMovement } from '../../types';
import {
  formatDateTime,
} from '../../utils/jewelryCalculations';

export const MovementsView: React.FC = () => {
  const state = erpDb.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('TODOS');

  const filteredMovements = state.stockMovements.filter((m) => {
    const matchesSearch =
      m.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'TODOS' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Trazabilidad & Movimientos Históricos de Inventario
          </h1>
          <p className="text-xs text-[#727985]">
            Kárdex inalterable de entradas, salidas, traslados entre sedes y ajustes de inventario
          </p>
        </div>
        <div className="text-xs bg-[#F4F5F7] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium text-[#20242B]">
          Total Movimientos: <strong className="font-mono text-[#059669]">{state.stockMovements.length}</strong>
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
            placeholder="Buscar por SKU, joya o motivo..."
            className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-medium"
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="ENTRADA">Entradas</option>
          <option value="VENTA">Ventas</option>
          <option value="TRASLADO">Traslados</option>
          <option value="AJUSTE">Ajustes</option>
          <option value="SALIDA">Salidas</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-float overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] text-[#727985] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Joya Afectada</th>
                <th className="py-2.5 px-3">Cantidad</th>
                <th className="py-2.5 px-3">Motivo / Detalle</th>
                <th className="py-2.5 px-3">Usuario Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#20242B]">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-[#F4F5F7]/30">
                  <td className="py-2.5 px-3 text-[#727985] whitespace-nowrap">
                    {formatDateTime(m.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        m.type === 'ENTRADA'
                          ? 'bg-[#21865B]/10 text-[#21865B]'
                          : m.type === 'VENTA'
                          ? 'bg-[#3478C6]/10 text-[#3478C6]'
                          : m.type === 'TRASLADO'
                          ? 'bg-[#10B981]/15 text-[#059669]'
                          : 'bg-[#DC2626]/10 text-[#DC2626]'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">{m.productSku}</td>
                  <td className="py-2.5 px-3 font-medium">{m.productName}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-center">{m.quantity}</td>
                  <td className="py-2.5 px-3 text-[#727985]">{m.reason}</td>
                  <td className="py-2.5 px-3 font-semibold">{m.userName}</td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#727985]">
                    No se registran movimientos con los filtros seleccionados.
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
