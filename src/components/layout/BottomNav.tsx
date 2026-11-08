/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BookmarkCheck,
  Wrench,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentModule,
  onSelectModule,
  onOpenMobileMenu,
}) => {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'pos', label: 'Vender', icon: ShoppingBag, isPrimary: true },
    { id: 'products', label: 'Joyas', icon: Package },
    { id: 'layaways', label: 'Separados', icon: BookmarkCheck },
    { id: 'repairs', label: 'Taller', icon: Wrench },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EAECEF] px-2 py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectModule(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[54px] min-h-[44px] ${
              isActive
                ? 'text-[#9B7028] font-bold'
                : item.isPrimary
                ? 'text-[#7F581A] font-semibold'
                : 'text-[#727985] hover:text-[#20242B]'
            }`}
          >
            <div
              className={`p-1 rounded-md ${
                item.isPrimary && !isActive ? 'bg-[#9B7028]/10' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer trigger */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[#727985] hover:text-[#20242B] transition-colors min-w-[54px] min-h-[44px]"
      >
        <div className="p-1">
          <Menu className="w-4 h-4" />
        </div>
        <span className="text-[10px] mt-0.5 leading-tight">Más</span>
      </button>
    </nav>
  );
};
