/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useSyncExternalStore } from 'react';
import { erpDb } from './services/store';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/modules/DashboardView';
import { ProductsView } from './components/modules/ProductsView';
import { MovementsView } from './components/modules/MovementsView';
import { MetalsBoardView } from './components/modules/MetalsBoardView';
import { PosView } from './components/modules/PosView';
import { SalesView } from './components/modules/SalesView';
import { LayawaysView } from './components/modules/LayawaysView';
import { RepairsView } from './components/modules/RepairsView';
import { ManufacturingView } from './components/modules/ManufacturingView';
import { CashView } from './components/modules/CashView';
import { DailyReconciliationView } from './components/modules/DailyReconciliationView';
import { AccountingView } from './components/modules/AccountingView';
import { CustomersView } from './components/modules/CustomersView';
import { SuppliersView } from './components/modules/SuppliersView';
import { PurchasesView } from './components/modules/PurchasesView';
import { ExpensesView } from './components/modules/ExpensesView';
import { WarrantiesView } from './components/modules/WarrantiesView';
import { EmployeesView } from './components/modules/EmployeesView';
import { BranchesView } from './components/modules/BranchesView';
import { ReportsView } from './components/modules/ReportsView';
import { AuditView } from './components/modules/AuditView';
import { SettingsView } from './components/modules/SettingsView';

export default function App() {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickProductModal, setQuickProductModal] = useState(false);
  const [quickRepairModal, setQuickRepairModal] = useState(false);

  // Subscribe to reactive database changes
  const state = useSyncExternalStore(
    (onStoreChange) => erpDb.subscribe(onStoreChange),
    () => erpDb.getState()
  );

  const handleGlobalSearch = (term: string) => {
    if (term.trim().length > 0 && currentModule !== 'products') {
      setCurrentModule('products');
    }
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#20242B] ${
        state.largeText ? 'large-text' : ''
      }`}
    >
      {/* Sidebar Navigation (Desktop Fixed + Mobile Slide Drawer) */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => setCurrentModule(mod)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header with Hamburger & Search */}
        <Header
          onNavigate={(mod) => setCurrentModule(mod)}
          onOpenQuickSale={() => setCurrentModule('pos')}
          onOpenQuickProduct={() => {
            setCurrentModule('products');
            setQuickProductModal(true);
          }}
          onOpenQuickRepair={() => {
            setCurrentModule('repairs');
            setQuickRepairModal(true);
          }}
          onGlobalSearch={handleGlobalSearch}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentModule === 'dashboard' && (
              <DashboardView
                onNavigate={(mod) => setCurrentModule(mod)}
                onOpenSale={() => setCurrentModule('pos')}
                onOpenProduct={() => {
                  setCurrentModule('products');
                  setQuickProductModal(true);
                }}
                onOpenRepair={() => {
                  setCurrentModule('repairs');
                  setQuickRepairModal(true);
                }}
              />
            )}

            {currentModule === 'products' && (
              <ProductsView
                isCreateOpenInitial={quickProductModal}
                onCloseCreateInitial={() => setQuickProductModal(false)}
              />
            )}

            {currentModule === 'movements' && <MovementsView />}

            {currentModule === 'metals' && <MetalsBoardView />}

            {currentModule === 'pos' && (
              <PosView onSaleComplete={() => setCurrentModule('sales')} />
            )}

            {currentModule === 'sales' && <SalesView />}

            {currentModule === 'layaways' && <LayawaysView />}

            {currentModule === 'repairs' && (
              <RepairsView
                isNewModalOpenInitial={quickRepairModal}
                onCloseNewModalInitial={() => setQuickRepairModal(false)}
              />
            )}

            {currentModule === 'manufacturing' && <ManufacturingView />}

            {currentModule === 'cash' && <CashView />}

            {currentModule === 'daily-reconciliation' && <DailyReconciliationView />}

            {currentModule === 'accounting' && <AccountingView />}

            {currentModule === 'customers' && <CustomersView />}

            {currentModule === 'suppliers' && <SuppliersView />}

            {currentModule === 'purchases' && <PurchasesView />}

            {currentModule === 'expenses' && <ExpensesView />}

            {currentModule === 'warranties' && <WarrantiesView />}

            {currentModule === 'employees' && <EmployeesView />}

            {currentModule === 'branches' && <BranchesView />}

            {currentModule === 'reports' && <ReportsView />}

            {currentModule === 'audit' && <AuditView />}

            {currentModule === 'settings' && <SettingsView />}
          </div>
        </main>

        {/* Bottom Mobile Navigation Bar */}
        <BottomNav
          currentModule={currentModule}
          onSelectModule={(mod) => setCurrentModule(mod)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
      </div>
    </div>
  );
}
