/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BookmarkCheck,
  Wrench,
  Coins,
  Landmark,
  Users,
  Hammer,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Truck,
  TrendingDown,
  ShieldCheck,
  Building,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Layers,
  ClipboardCheck,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { JewelLogo } from '../common/JewelLogo';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const state = erpDb.getState();

  // Dynamic badges
  const availableCount = state.products.filter((p) => p.status === 'DISPONIBLE').length;
  const activeLayaways = state.layaways.filter((l) => l.status === 'ACTIVO' || l.status === 'PARCIAL').length;
  const pendingRepairs = state.repairs.filter((r) => r.status !== 'ENTREGADO' && r.status !== 'CANCELADO').length;

  const primaryItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta (Vender)', icon: ShoppingBag, isPrimaryAction: true },
    { id: 'products', label: 'Catálogo de Joyas', icon: Package, badge: availableCount },
    { id: 'layaways', label: 'Separados (Apartados)', icon: BookmarkCheck, badge: activeLayaways },
    { id: 'repairs', label: 'Taller & Reparaciones', icon: Wrench, badge: pendingRepairs },
    { id: 'metals', label: 'Pizarra de Metales & Leyes', icon: Coins },
    { id: 'cash', label: 'Caja del Día (Arqueos)', icon: Landmark },
    { id: 'daily-reconciliation', label: 'Cuadre Diario', icon: ClipboardCheck },
  ];

  const adminItems = [
    { id: 'customers', label: 'Clientes CRM', icon: Users },
    { id: 'sales', label: 'Historial de Facturas', icon: Receipt },
    { id: 'manufacturing', label: 'Fabricación & Hechuras', icon: Hammer },
    { id: 'movements', label: 'Trazabilidad de Stock', icon: Layers },
    { id: 'accounting', label: 'Contabilidad Partida Doble', icon: FileSpreadsheet },
    { id: 'reports', label: 'Informes Gerenciales', icon: BarChart3 },
    { id: 'suppliers', label: 'Proveedores & CxP', icon: Truck },
    { id: 'purchases', label: 'Compras & Materia Prima', icon: Package },
    { id: 'expenses', label: 'Gastos Operacionales', icon: TrendingDown },
    { id: 'warranties', label: 'Garantías Oficiales', icon: ShieldCheck },
    { id: 'branches', label: 'Sucursales & Sedes', icon: Building },
    { id: 'audit', label: 'Auditoría & Seguridad', icon: History },
    { id: 'settings', label: 'Configuración & Backup', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onSelectModule(id);
    onCloseMobile();
  };

  // Check if current module is inside admin items to automatically keep it expanded
  const isAdminActive = adminItems.some((item) => item.id === currentModule);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop fixed + Mobile slide-over drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto bg-white border-r border-[#EAECEF] flex flex-col transition-all duration-200 select-none ${
          isMobileOpen
            ? 'translate-x-0 w-72 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Mobile Header / Desktop Collapse Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#EAECEF]">
          <div className="flex items-center gap-2">
            <JewelLogo size="xs" variant="mark-only" />
            {(!collapsed || isMobileOpen) && (
              <span className="text-xs font-bold text-[#20242B] tracking-tight">
                JOYERI ERP
              </span>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7] transition-colors"
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Primary Operations Section */}
          <div>
            {(!collapsed || isMobileOpen) && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#727985]">
                Operación Diaria
              </p>
            )}
            <div className="space-y-1">
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    title={collapsed && !isMobileOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#10B981] text-white shadow-sm font-semibold'
                        : item.isPrimaryAction
                        ? 'bg-[#10B981]/10 text-[#059669] hover:bg-[#10B981]/20 font-semibold'
                        : 'text-[#20242B] hover:bg-[#F4F5F7] hover:text-[#20242B]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : item.isPrimaryAction
                          ? 'text-[#059669]'
                          : 'text-[#727985]'
                      }`}
                    />
                    {(!collapsed || isMobileOpen) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {(!collapsed || isMobileOpen) && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#F4F5F7] text-[#727985] border border-[#EAECEF]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin & Management Section */}
          <div className="pt-2 border-t border-[#EAECEF]">
            {(!collapsed || isMobileOpen) ? (
              <div>
                <button
                  onClick={() => setShowAdminSubmenu(!showAdminSubmenu || isAdminActive)}
                  className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#727985] hover:text-[#20242B]"
                >
                  <span>Gestión & Administración</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showAdminSubmenu || isAdminActive ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {(showAdminSubmenu || isAdminActive) && (
                  <div className="space-y-1 mt-1.5 pl-1">
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentModule === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                            isActive
                              ? 'bg-[#20242B] text-white shadow-sm font-semibold'
                              : 'text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7]'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#727985]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {adminItems.slice(0, 5).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={item.label}
                      className={`w-full flex items-center justify-center p-2 rounded-xl text-xs transition-colors ${
                        isActive
                          ? 'bg-[#20242B] text-white'
                          : 'text-[#727985] hover:bg-[#F4F5F7] hover:text-[#20242B]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        {(!collapsed || isMobileOpen) && (
          <div className="p-3 border-t border-[#EAECEF] bg-[#F8F9FA] text-[11px] text-[#727985]">
            <div className="flex items-center justify-between font-semibold text-[#20242B]">
              <span>JOYERI v2.4</span>
              <span className="text-[10px] text-[#21865B] bg-[#21865B]/10 px-1.5 py-0.5 rounded">
                Online
              </span>
            </div>
            <p className="text-[10px] text-[#727985] mt-0.5">
              Trazabilidad de Oro · COP
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
