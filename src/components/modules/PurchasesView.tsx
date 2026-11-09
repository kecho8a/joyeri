/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  X,
  Truck,
  AlertTriangle,
  Wallet,
  Trash2,
  Minus,
  Gem,
  ArrowDownUp,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import {
  PaymentMethod,
  PurchaseItemCategory,
  RawMaterial,
} from '../../types';
import { formatCOP } from '../../utils/jewelryCalculations';

type Tab = 'compras' | 'materia' | 'cxp';

const CATEGORIES: PurchaseItemCategory[] = [
  'Materia Prima',
  'Insumo de Taller',
  'Piedra Preciosa',
  'Joya Terminada',
  'Otro',
];

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_DEBITO: 'Tarjeta débito',
  TARJETA_CREDITO: 'Tarjeta crédito',
  TRANSFERENCIA_BANCOLOMBIA: 'Transferencia bancaria',
  NEQUI_DAVIPLATA: 'Nequi / Daviplata',
  ANTICIPO_APARTADO: 'Anticipo / apartado',
};

const emptyItem = () => ({
  description: '',
  category: 'Materia Prima' as PurchaseItemCategory,
  quantity: 1,
  unit: 'g',
  unitCostCOP: 0,
});

const money = (value: number) => formatCOP(value || 0);

export const PurchasesView: React.FC = () => {
  const state = erpDb.getState();
  const purchases = state.purchases || [];
  const rawMaterials = state.rawMaterials || [];

  const [activeTab, setActiveTab] = useState<Tab>('compras');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<RawMaterial | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<string | null>(null);

  const [purchaseForm, setPurchaseForm] = useState({
    invoiceNumber: '',
    supplierId: state.suppliers[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA' as PaymentMethod,
    paid: true,
    notes: '',
    items: [emptyItem()],
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    category: 'Materia Prima' as PurchaseItemCategory,
    unit: 'g',
    quantity: 0,
    unitCostCOP: 0,
    minStock: 0,
  });

  const [adjustForm, setAdjustForm] = useState({
    quantityDelta: 0,
    unitCostCOP: 0,
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amountCOP: 0,
    paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA' as PaymentMethod,
    notes: '',
  });

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const purchasesThisMonth = purchases.filter((p) =>
    p.date.startsWith(monthPrefix)
  );
  const monthTotal = purchasesThisMonth.reduce((acc, p) => acc + p.totalCOP, 0);
  const rawMaterialValue = rawMaterials.reduce(
    (acc, m) => acc + m.quantity * m.unitCostCOP,
    0
  );
  const totalPayable = state.suppliers.reduce(
    (acc, s) => acc + s.balancePendingCOP,
    0
  );
  const lowStock = rawMaterials.filter((m) => m.quantity <= m.minStock);

  const filteredPurchases = useMemo(
    () =>
      purchases.filter(
        (p) =>
          p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [purchases, searchTerm]
  );

  const filteredMaterials = useMemo(
    () =>
      rawMaterials.filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.category.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [rawMaterials, searchTerm]
  );

  const filteredSuppliers = useMemo(
    () =>
      state.suppliers.filter(
        (s) =>
          s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.nit.includes(searchTerm)
      ),
    [state.suppliers, searchTerm]
  );

  const purchaseTotal = purchaseForm.items.reduce(
    (acc, item) => acc + item.quantity * item.unitCostCOP,
    0
  );

  const resetPurchaseForm = () => {
    setPurchaseForm({
      invoiceNumber: '',
      supplierId: state.suppliers[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA',
      paid: true,
      notes: '',
      items: [emptyItem()],
    });
    setError('');
  };

  const updateItem = (
    index: number,
    patch: Partial<ReturnType<typeof emptyItem>>
  ) => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!purchaseForm.supplierId) throw new Error('Selecciona un proveedor.');
      const validItems = purchaseForm.items.filter(
        (item) =>
          item.description.trim().length > 0 &&
          item.quantity > 0 &&
          item.unitCostCOP > 0
      );
      if (!validItems.length) {
        throw new Error(
          'Agrega al menos un ítem con descripción, cantidad y costo.'
        );
      }
      erpDb.createPurchase({
        invoiceNumber: purchaseForm.invoiceNumber,
        supplierId: purchaseForm.supplierId,
        date: purchaseForm.date,
        paymentMethod: purchaseForm.paymentMethod,
        paid: purchaseForm.paid,
        notes: purchaseForm.notes,
        items: validItems,
      });
      setIsPurchaseOpen(false);
      resetPurchaseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la compra.');
    }
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      erpDb.createRawMaterial(materialForm);
      setIsMaterialOpen(false);
      setMaterialForm({
        name: '',
        category: 'Materia Prima',
        unit: 'g',
        quantity: 0,
        unitCostCOP: 0,
        minStock: 0,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear el material.'
      );
    }
  };

  const handleAdjustMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setError('');
    try {
      if (!adjustForm.quantityDelta) {
        throw new Error('Escribe una cantidad a sumar o restar.');
      }
      erpDb.adjustRawMaterial({
        id: adjustTarget.id,
        quantityDelta: adjustForm.quantityDelta,
        unitCostCOP: adjustForm.unitCostCOP || undefined,
        notes: adjustForm.notes,
      });
      setAdjustTarget(null);
      setAdjustForm({ quantityDelta: 0, unitCostCOP: 0, notes: '' });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo ajustar el material.'
      );
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;
    setError('');
    try {
      erpDb.registerSupplierPayment(
        paymentTarget,
        paymentForm.amountCOP,
        paymentForm.paymentMethod,
        paymentForm.notes
      );
      setPaymentTarget(null);
      setPaymentForm({
        amountCOP: 0,
        paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA',
        notes: '',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo registrar el pago.'
      );
    }
  };

  const selectedSupplier = state.suppliers.find(
    (s) => s.id === paymentTarget
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Compras, Materia Prima & Cuentas por Pagar
          </h1>
          <p className="text-xs text-[#727985]">
            Registra lo que compras, controla insumos y paga a proveedores sin
            salir del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetPurchaseForm();
              setIsPurchaseOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Compra
          </button>
          <button
            onClick={() => setIsMaterialOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#20242B] text-xs font-semibold border border-[#EAECEF] transition-colors"
          >
            <Gem className="w-4 h-4" />
            Nuevo Material
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Truck className="w-4 h-4" />}
          label="Compras del mes"
          value={money(monthTotal)}
          hint={`${purchasesThisMonth.length} compras registradas`}
        />
        <KpiCard
          icon={<Package className="w-4 h-4" />}
          label="Materia prima valorizada"
          value={money(rawMaterialValue)}
          hint={`${rawMaterials.length} referencias`}
          tone="gold"
        />
        <KpiCard
          icon={<Wallet className="w-4 h-4" />}
          label="Cuentas por pagar"
          value={money(totalPayable)}
          hint={`${state.suppliers.filter((s) => s.balancePendingCOP > 0).length} proveedores con saldo`}
          tone={totalPayable > 0 ? 'red' : 'green'}
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Insumos bajo mínimo"
          value={String(lowStock.length)}
          hint={lowStock.length ? 'Requieren reposición' : 'Todo en orden'}
          tone={lowStock.length ? 'red' : 'green'}
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#EAECEF] p-3 shadow-[0_8px_30px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-xl">
          {(
            [
              ['compras', 'Compras', Truck],
              ['materia', 'Materia Prima', Package],
              ['cxp', 'Cuentas por Pagar', Wallet],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === id
                  ? 'bg-white text-[#059669] shadow-sm'
                  : 'text-[#727985] hover:text-[#20242B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 sm:max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'compras'
                ? 'Buscar factura o proveedor...'
                : activeTab === 'materia'
                ? 'Buscar material...'
                : 'Buscar proveedor...'
            }
            className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#10B981] focus:bg-white"
          />
        </div>
      </div>

      {activeTab === 'compras' && (
        <div className="space-y-3">
          {filteredPurchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(15,23,42,0.10)] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#059669] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-[#20242B]">
                        {purchase.supplierName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          purchase.status === 'PAGADA'
                            ? 'bg-[#21865B]/10 text-[#21865B]'
                            : 'bg-[#D64545]/10 text-[#D64545]'
                        }`}
                      >
                        {purchase.status === 'PAGADA' ? 'PAGADA' : 'PENDIENTE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#727985] mt-0.5">
                      Factura {purchase.invoiceNumber} · {purchase.date} ·{' '}
                      {PAYMENT_LABELS[purchase.paymentMethod]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#727985]">Total compra</p>
                  <p className="font-mono font-bold text-base text-[#20242B] tabular-nums">
                    {money(purchase.totalCOP)}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#EAECEF] grid grid-cols-1 sm:grid-cols-2 gap-2">
                {purchase.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 bg-[#F8F9FA] rounded-lg px-3 py-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#20242B] truncate">
                        {item.description}
                      </p>
                      <p className="text-[#727985]">
                        {item.category} · {item.quantity} {item.unit} ×{' '}
                        {money(item.unitCostCOP)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-[#20242B] tabular-nums shrink-0">
                      {money(item.totalCostCOP)}
                    </span>
                  </div>
                ))}
              </div>
              {purchase.notes && (
                <p className="text-[11px] text-[#727985] mt-2">
                  Nota: {purchase.notes}
                </p>
              )}
            </div>
          ))}
          {!filteredPurchases.length && (
            <EmptyState
              title="Aún no hay compras registradas"
              text="Registra tu primera compra para controlar costos, inventario y cuentas por pagar."
            />
          )}
        </div>
      )}

      {activeTab === 'materia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredMaterials.map((material) => {
            const isLow = material.quantity <= material.minStock;
            return (
              <div
                key={material.id}
                className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(15,23,42,0.10)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold bg-[#10B981]/10 text-[#059669] px-2 py-0.5 rounded-full">
                      {material.category}
                    </span>
                    {isLow && (
                      <span className="text-[10px] font-bold bg-[#D64545]/10 text-[#D64545] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Bajo mínimo
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#20242B] mt-2">
                    {material.name}
                  </h3>
                  <p className="text-[11px] text-[#727985] mt-0.5">
                    Mínimo: {material.minStock} {material.unit}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-[#F8F9FA] rounded-lg p-2">
                      <p className="text-[10px] text-[#727985]">Existencia</p>
                      <p
                        className={`font-mono font-bold text-sm tabular-nums ${
                          isLow ? 'text-[#D64545]' : 'text-[#20242B]'
                        }`}
                      >
                        {material.quantity} {material.unit}
                      </p>
                    </div>
                    <div className="bg-[#F8F9FA] rounded-lg p-2">
                      <p className="text-[10px] text-[#727985]">Costo unitario</p>
                      <p className="font-mono font-bold text-sm text-[#20242B] tabular-nums">
                        {money(material.unitCostCOP)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#727985]">Valorizado</span>
                    <span className="font-mono font-bold text-[#059669] tabular-nums">
                      {money(material.quantity * material.unitCostCOP)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setError('');
                    setAdjustTarget(material);
                    setAdjustForm({
                      quantityDelta: 0,
                      unitCostCOP: material.unitCostCOP,
                      notes: '',
                    });
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#20242B] text-xs font-semibold border border-[#EAECEF] transition-colors"
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  Ajustar existencia
                </button>
              </div>
            );
          })}
          {!filteredMaterials.length && (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                title="Sin materia prima registrada"
                text="Crea tus materiales e insumos para controlar existencias y costos reales."
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'cxp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#20242B] truncate">
                  {supplier.companyName}
                </h3>
                <p className="text-[11px] text-[#727985]">
                  NIT {supplier.nit} · {supplier.category}
                </p>
                <p
                  className={`font-mono font-bold text-base mt-1 tabular-nums ${
                    supplier.balancePendingCOP > 0
                      ? 'text-[#D64545]'
                      : 'text-[#21865B]'
                  }`}
                >
                  {money(supplier.balancePendingCOP)}
                </p>
              </div>
              <button
                disabled={supplier.balancePendingCOP <= 0}
                onClick={() => {
                  setError('');
                  setPaymentTarget(supplier.id);
                  setPaymentForm({
                    amountCOP: supplier.balancePendingCOP,
                    paymentMethod: 'TRANSFERENCIA_BANCOLOMBIA',
                    notes: '',
                  });
                }}
                className="px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:bg-[#EAECEF] disabled:text-[#A0A6B0] text-white text-xs font-semibold transition-colors shrink-0"
              >
                Registrar pago
              </button>
            </div>
          ))}
          {!filteredSuppliers.length && (
            <div className="md:col-span-2">
              <EmptyState
                title="Sin proveedores"
                text="Crea proveedores desde el módulo Proveedores & CxP."
              />
            </div>
          )}
        </div>
      )}

      {isPurchaseOpen && (
        <Modal
          title="Registrar compra"
          onClose={() => setIsPurchaseOpen(false)}
          wide
        >
          <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs">
            {error && <ErrorBox message={error} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Proveedor *">
                <select
                  value={purchaseForm.supplierId}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      supplierId: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {state.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Número de factura">
                <input
                  value={purchaseForm.invoiceNumber}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      invoiceNumber: e.target.value,
                    })
                  }
                  placeholder="FC-PRV-2026-0001"
                  className={inputClass}
                />
              </Field>
              <Field label="Fecha">
                <input
                  type="date"
                  value={purchaseForm.date}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, date: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Forma de pago">
                <select
                  value={purchaseForm.paymentMethod}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      paymentMethod: e.target.value as PaymentMethod,
                    })
                  }
                  className={inputClass}
                >
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="flex items-center gap-2 bg-[#F8F9FA] border border-[#EAECEF] rounded-lg px-3 py-2 font-semibold text-[#20242B]">
              <input
                type="checkbox"
                checked={purchaseForm.paid}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, paid: e.target.checked })
                }
                className="accent-[#10B981]"
              />
              Compra pagada de contado (si no, queda en cuentas por pagar)
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#20242B]">Ítems comprados</span>
                <button
                  type="button"
                  onClick={() =>
                    setPurchaseForm({
                      ...purchaseForm,
                      items: [...purchaseForm.items, emptyItem()],
                    })
                  }
                  className="text-[11px] font-semibold text-[#059669] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar ítem
                </button>
              </div>

              {purchaseForm.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#F8F9FA] border border-[#EAECEF] rounded-xl p-3 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Descripción *">
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, { description: e.target.value })
                        }
                        placeholder="Ej: Granalla Oro 18K"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Tipo">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(index, {
                            category: e.target.value as PurchaseItemCategory,
                          })
                        }
                        className={inputClass}
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Cantidad">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: Number(e.target.value),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Unidad">
                      <input
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, { unit: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Costo unitario">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.unitCostCOP}
                        onChange={(e) =>
                          updateItem(index, {
                            unitCostCOP: Number(e.target.value),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#727985]">
                      Subtotal:{' '}
                      <strong className="font-mono text-[#20242B]">
                        {money(item.quantity * item.unitCostCOP)}
                      </strong>
                    </span>
                    {purchaseForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseForm({
                            ...purchaseForm,
                            items: purchaseForm.items.filter(
                              (_, i) => i !== index
                            ),
                          })
                        }
                        className="text-[#D64545] flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Quitar
                      </button>
                    )}
                  </div>
                  {item.category === 'Joya Terminada' && (
                    <p className="text-[10px] text-[#059669] bg-[#10B981]/10 rounded-lg px-2 py-1">
                      El costo queda registrado. Da de alta la joya en Catálogo
                      para poder venderla y controlar su margen.
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Field label="Notas (opcional)">
              <input
                value={purchaseForm.notes}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, notes: e.target.value })
                }
                className={inputClass}
              />
            </Field>

            <div className="flex items-center justify-between bg-[#10B981]/10 rounded-xl px-3 py-2">
              <span className="font-semibold text-[#059669]">
                Total de la compra
              </span>
              <span className="font-mono font-bold text-base text-[#059669] tabular-nums">
                {money(purchaseTotal)}
              </span>
            </div>

            <ModalActions
              onCancel={() => setIsPurchaseOpen(false)}
              submitLabel="Guardar compra"
            />
          </form>
        </Modal>
      )}

      {isMaterialOpen && (
        <Modal title="Nuevo material o insumo" onClose={() => setIsMaterialOpen(false)}>
          <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
            {error && <ErrorBox message={error} />}
            <Field label="Nombre *">
              <input
                value={materialForm.name}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, name: e.target.value })
                }
                placeholder="Ej: Granalla Oro 18K"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select
                  value={materialForm.category}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      category: e.target.value as PurchaseItemCategory,
                    })
                  }
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unidad">
                <input
                  value={materialForm.unit}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, unit: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Existencia">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={materialForm.quantity}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Costo unitario">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={materialForm.unitCostCOP}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      unitCostCOP: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Stock mínimo">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={materialForm.minStock}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      minStock: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <ModalActions
              onCancel={() => setIsMaterialOpen(false)}
              submitLabel="Guardar material"
            />
          </form>
        </Modal>
      )}

      {adjustTarget && (
        <Modal
          title={`Ajustar ${adjustTarget.name}`}
          onClose={() => setAdjustTarget(null)}
        >
          <form onSubmit={handleAdjustMaterial} className="space-y-3 text-xs">
            {error && <ErrorBox message={error} />}
            <div className="bg-[#F8F9FA] rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[#727985]">Existencia actual</p>
                <p className="font-mono font-bold text-base text-[#20242B]">
                  {adjustTarget.quantity} {adjustTarget.unit}
                </p>
              </div>
              <Minus className="w-4 h-4 text-[#727985]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad (+ suma / − resta)">
                <input
                  type="number"
                  step="0.001"
                  value={adjustForm.quantityDelta}
                  onChange={(e) =>
                    setAdjustForm({
                      ...adjustForm,
                      quantityDelta: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Nuevo costo unitario">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={adjustForm.unitCostCOP}
                  onChange={(e) =>
                    setAdjustForm({
                      ...adjustForm,
                      unitCostCOP: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Motivo del ajuste">
              <input
                value={adjustForm.notes}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, notes: e.target.value })
                }
                placeholder="Conteo físico, merma, devolución..."
                className={inputClass}
              />
            </Field>
            <ModalActions
              onCancel={() => setAdjustTarget(null)}
              submitLabel="Guardar ajuste"
            />
          </form>
        </Modal>
      )}

      {selectedSupplier && (
        <Modal
          title={`Pago a ${selectedSupplier.companyName}`}
          onClose={() => setPaymentTarget(null)}
        >
          <form onSubmit={handlePayment} className="space-y-3 text-xs">
            {error && <ErrorBox message={error} />}
            <div className="bg-[#D64545]/10 rounded-xl p-3">
              <p className="text-[11px] text-[#D64545] font-semibold">
                Saldo pendiente actual
              </p>
              <p className="font-mono font-bold text-lg text-[#D64545] tabular-nums">
                {money(selectedSupplier.balancePendingCOP)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor a pagar *">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={paymentForm.amountCOP}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amountCOP: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Forma de pago">
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value as PaymentMethod,
                    })
                  }
                  className={inputClass}
                >
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <input
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <ModalActions
              onCancel={() => setPaymentTarget(null)}
              submitLabel="Registrar pago"
            />
          </form>
        </Modal>
      )}
    </div>
  );
};

const inputClass =
  'w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-lg px-3 py-1.5 text-xs text-[#20242B] focus:outline-none focus:border-[#10B981] focus:bg-white';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="font-semibold text-[#20242B] block mb-1">{label}</label>
    {children}
  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ title, onClose, wide, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div
      className={`bg-white rounded-2xl border border-[#EAECEF] shadow-2xl w-full ${
        wide ? 'max-w-2xl' : 'max-w-md'
      } max-h-[90vh] overflow-y-auto p-5`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-[#EAECEF]">
        <h2 className="text-base font-bold text-[#20242B]">{title}</h2>
        <button onClick={onClose} className="p-1 text-[#727985]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  submitLabel: string;
}> = ({ onCancel, submitLabel }) => (
  <div className="pt-3 border-t border-[#EAECEF] flex justify-end gap-2">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 text-[#727985] text-xs"
    >
      Cancelar
    </button>
    <button
      type="submit"
      className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold text-xs"
    >
      {submitLabel}
    </button>
  </div>
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-[#D64545]/10 border border-[#D64545]/20 text-[#D64545] rounded-lg px-3 py-2 text-[11px] font-medium">
    {message}
  </div>
);

const EmptyState: React.FC<{ title: string; text: string }> = ({
  title,
  text,
}) => (
  <div className="bg-white rounded-2xl border border-dashed border-[#D1D5DB] p-8 text-center">
    <Package className="w-8 h-8 text-[#C9CDD3] mx-auto" />
    <h3 className="font-bold text-sm text-[#20242B] mt-2">{title}</h3>
    <p className="text-xs text-[#727985] mt-1">{text}</p>
  </div>
);

const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: 'gold' | 'red' | 'green';
}> = ({ icon, label, value, hint, tone }) => {
  const toneClass =
    tone === 'red'
      ? 'text-[#D64545] bg-[#D64545]/10'
      : tone === 'green'
      ? 'text-[#21865B] bg-[#21865B]/10'
      : 'text-[#059669] bg-[#10B981]/10';
  return (
    <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${toneClass}`}>
          {icon}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#727985] mt-2">
        {label}
      </p>
      <p className="font-mono font-bold text-base text-[#20242B] tabular-nums">
        {value}
      </p>
      <p className="text-[10px] text-[#727985] mt-0.5">{hint}</p>
    </div>
  );
};
