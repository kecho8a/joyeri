/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Menu,
  X,
  Search,
  Building2,
  ShoppingBag,
  Package,
  Wrench,
  ChevronDown,
  Type,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { JewelLogo } from '../common/JewelLogo';

interface HeaderProps {
  onNavigate: (module: string) => void;
  onOpenQuickSale: () => void;
  onOpenQuickProduct: () => void;
  onOpenQuickRepair: () => void;
  onGlobalSearch: (term: string) => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenQuickSale,
  onOpenQuickProduct,
  onOpenQuickRepair,
  onGlobalSearch,
  onToggleMobileMenu,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const state = erpDb.getState();
  const activeBranch = erpDb.getActiveBranch();
  const activeUser = erpDb.getActiveUser();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onGlobalSearch(e.target.value);
  };

  return (
    <header className="h-16 bg-white border-b border-[#EAECEF] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile hamburger & Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#20242B] hover:bg-[#F4F5F7] transition-colors focus:outline-none"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5 text-[#20242B]" />
        </button>

        {/* Brand identity */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
        >
          <JewelLogo size="md" variant="mark-only" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#20242B] group-hover:text-[#059669] transition-colors">
                JOYERI
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#059669] bg-[#10B981]/10 px-1.5 py-0.5 rounded uppercase">
                ERP
              </span>
            </div>
            <p className="text-[10px] text-[#727985] font-medium leading-none hidden sm:block">
              Joyerías & Metales Preciosos
            </p>
          </div>
        </button>

        {/* Sede selector (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 pl-4 border-l border-[#EAECEF] text-xs">
          <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
          <select
            value={state.activeBranchId}
            onChange={(e) => erpDb.setActiveBranch(e.target.value)}
            className="text-xs font-semibold text-[#20242B] bg-transparent border-0 focus:ring-0 cursor-pointer py-1 pr-6"
            title="Cambiar sucursal activa"
          >
            {state.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle: Global Search Bar */}
      <div className="flex-1 max-w-sm lg:max-w-md relative hidden md:block">
        <Search className="w-4 h-4 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar SKU, cliente, oro 18K, esmeralda o factura..."
          className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#20242B] placeholder-[#727985] focus:outline-none focus:border-[#10B981] focus:bg-white transition-all shadow-inner"
        />
      </div>

      {/* Right: Quick actions & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Sale button */}
        <button
          onClick={onOpenQuickSale}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-white bg-[#10B981] hover:bg-[#059669] active:scale-95 transition-all shadow-sm"
          title="Nueva Venta en Punto de Venta"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Venta POS</span>
          <span className="sm:hidden">Vender</span>
        </button>

        {/* Quick Add Product button (hidden on very small screens) */}
        <button
          onClick={onOpenQuickProduct}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#20242B] bg-[#F4F5F7] hover:bg-[#EAECEF] transition-colors border border-[#EAECEF]"
          title="Crear Joya en Inventario"
        >
          <Package className="w-3.5 h-3.5 text-[#727985]" />
          <span>+ Joya</span>
        </button>

        {/* Large text toggle */}
        <button
          onClick={() => erpDb.toggleLargeText()}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            state.largeText
              ? 'bg-[#10B981] text-white border-[#10B981]'
              : 'bg-[#F4F5F7] text-[#20242B] border-[#EAECEF] hover:bg-[#EAECEF]'
          }`}
          title={state.largeText ? 'Volver a letra normal' : 'Activar letra grande'}
          aria-pressed={state.largeText}
        >
          <Type className="w-3.5 h-3.5" />
          <span>{state.largeText ? 'A−' : 'A+'}</span>
        </button>

        {/* User avatar & role */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#EAECEF]">
          <div className="w-8 h-8 rounded-full bg-[#EAECEF] text-[#20242B] font-bold text-xs flex items-center justify-center border border-[#EAECEF]">
            {activeUser.avatarInitials}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-[#20242B] leading-tight truncate max-w-[120px]">
              {activeUser.name}
            </p>
            <p className="text-[10px] text-[#727985] capitalize truncate max-w-[120px]">
              {activeBranch.city} · {activeUser.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
