/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  Printer,
  ShieldCheck,
  X,
  Coins,
  AlertCircle,
  Gem,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Product, PaymentMethod, Sale } from '../../types';
import {
  formatCOP,
  formatGrams,
  formatDateTime,
  formatDate,
  METAL_DEFINITIONS,
} from '../../utils/jewelryCalculations';
import { getDefaultJewelryImage } from '../../utils/jewelryImages';
import { JewelLogo } from '../common/JewelLogo';

interface PosViewProps {
  onSaleComplete?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({ onSaleComplete }) => {
  const state = erpDb.getState();
  const activeBranch = erpDb.getActiveBranch();
  const activeUser = erpDb.getActiveUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [cartProductIds, setCartProductIds] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    state.customers[0]?.id || ''
  );
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mobile tab state: 'catalog' | 'cart'
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Completed sale for receipt modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Available jewels
  const availableJewels = state.products.filter(
    (p) =>
      p.status === 'DISPONIBLE' &&
      !cartProductIds.includes(p.id) &&
      (p.branchId === activeBranch.id || !activeBranch.id) &&
      (selectedCategory === 'TODAS' || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartProducts = cartProductIds
    .map((id) => state.products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  // Financial totals
  let subtotal = 0;
  let totalDiscount = 0;
  let totalVat = 0;
  let grandTotal = 0;

  cartProducts.forEach((p) => {
    const disc = discounts[p.id] || 0;
    const finalItemPrice = Math.max(0, p.salePriceCOP - disc);
    const base = p.vatRate > 0 ? finalItemPrice / (1 + p.vatRate) : finalItemPrice;
    const vat = finalItemPrice - base;

    subtotal += base;
    totalDiscount += disc;
    totalVat += vat;
    grandTotal += finalItemPrice;
  });

  const addToCart = (product: Product) => {
    setErrorMsg(null);
    setCartProductIds([...cartProductIds, product.id]);
  };

  const removeFromCart = (productId: string) => {
    setCartProductIds(cartProductIds.filter((id) => id !== productId));
    const nextDisc = { ...discounts };
    delete nextDisc[productId];
    setDiscounts(nextDisc);
  };

  const handleDiscountChange = (productId: string, val: number) => {
    const prod = state.products.find((p) => p.id === productId);
    if (prod && prod.salePriceCOP - val < prod.minAllowedPriceCOP) {
      setErrorMsg(
        `Precio mínimo permitido para ${prod.sku}: $${prod.minAllowedPriceCOP.toLocaleString('es-CO')}`
      );
    } else {
      setErrorMsg(null);
    }
    setDiscounts({ ...discounts, [productId]: Math.max(0, val) });
  };

  const handleCheckout = () => {
    if (cartProducts.length === 0) {
      alert('Agregue al menos una joya al carrito');
      return;
    }
    if (!selectedCustomerId) {
      alert('Seleccione un cliente registrado');
      return;
    }

    try {
      const sale = erpDb.executeSale({
        customerId: selectedCustomerId,
        productIds: cartProductIds,
        discounts,
        payments: [
          {
            method: paymentMethod,
            amountCOP: grandTotal,
            referenceNumber: referenceNumber || undefined,
          },
        ],
        notes: saleNotes || undefined,
      });

      setCompletedSale(sale);
      setCartProductIds([]);
      setDiscounts({});
      setReferenceNumber('');
      setSaleNotes('');
      setErrorMsg(null);
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const categoriesList = ['TODAS', 'Anillos', 'Cadenas', 'Pulseras', 'Aretes', 'Dijes', 'Relojes de Lujo', 'Lingotes y Monedas'];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#20242B] tracking-tight">
            Punto de Venta (POS) & Mostrador
          </h1>
          <p className="text-xs text-[#727985]">
            Emisión ágil de facturas comerciales con garantía oficial y deducción automática de stock
          </p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden w-full sm:w-auto items-center bg-[#F4F5F7] p-1 rounded-xl border border-[#EAECEF] text-xs font-semibold">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'catalog'
                ? 'bg-white text-[#20242B] shadow-xs'
                : 'text-[#727985]'
            }`}
          >
            💍 Catálogo ({availableJewels.length})
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'cart'
                ? 'bg-white text-[#9B7028] shadow-xs font-bold'
                : 'text-[#727985]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Carrito ({cartProducts.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-[#D64545]/10 border border-[#D64545]/20 text-[#D64545] p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Catalog (7 cols) + Right Checkout (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Jewelry Picker (Visible on desktop or when mobileTab === 'catalog') */}
        <div className={`lg:col-span-7 space-y-3 ${mobileTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
          {/* Quick Search & Category Pills */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escanear código o buscar SKU / Nombre / Esmeralda..."
                className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl pl-9 pr-4 py-2 text-xs text-[#20242B] placeholder-[#727985] focus:outline-none focus:border-[#9B7028] focus:bg-white transition-colors"
                autoFocus
              />
            </div>

            {/* Category horizontal scroll pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#9B7028] text-white shadow-xs font-semibold'
                      : 'bg-[#F4F5F7] text-[#727985] hover:text-[#20242B] border border-[#EAECEF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Jewelry Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {availableJewels.map((j) => {
              const mDef = METAL_DEFINITIONS[j.metalType];
              return (
                <div
                  key={j.id}
                  className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-[#9B7028] transition-all flex flex-col justify-between space-y-2.5 group text-left"
                >
                  <div>
                    {/* Jewel Image */}
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#F4F5F7] mb-2 group">
                      <img
                        src={j.imageUrl || getDefaultJewelryImage(j.category, j.name)}
                        alt={j.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 font-mono font-bold text-[#7F581A] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] shadow-xs">
                        {j.sku}
                      </span>
                      <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-[#20242B] px-1.5 py-0.5 rounded shadow-xs">
                        {mDef ? mDef.karatText : j.metalType}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-[#20242B] line-clamp-2 leading-snug">
                      {j.name}
                    </h3>

                    {/* Weight & Gem highlights */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#727985]">
                      <span className="bg-[#F4F5F7] px-2 py-0.5 rounded font-mono">
                        Peso: {formatGrams(j.netMetalWeightGrams)}
                      </span>
                      <span className="bg-[#9B7028]/5 text-[#7F581A] px-2 py-0.5 rounded font-mono font-bold">
                        Oro 24K: {formatGrams(j.fineMetalContentGrams)}
                      </span>
                    </div>

                    {j.stones.length > 0 && (
                      <p className="text-[11px] text-[#3478C6] mt-1.5 font-medium truncate flex items-center gap-1">
                        <Gem className="w-3 h-3 shrink-0" />
                        {j.stones[0].type} ({j.stones[0].carats} ct)
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-[#EAECEF] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#727985] block">Precio Venta</span>
                      <span className="font-mono font-bold text-sm text-[#20242B] tabular-nums">
                        {formatCOP(j.salePriceCOP)}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(j)}
                      className="px-3 py-1.5 rounded-xl bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {availableJewels.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-[#EAECEF] p-10 text-center text-xs text-[#727985]">
                No hay joyas disponibles en esta categoría o con este término de búsqueda.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Cart & Checkout (Visible on desktop or when mobileTab === 'cart') */}
        <div className={`lg:col-span-5 bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 ${mobileTab === 'catalog' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAECEF]">
            <h2 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#9B7028]" />
              Carrito de Facturación ({cartProducts.length} ítems)
            </h2>
            {cartProducts.length > 0 && (
              <button
                onClick={() => setCartProductIds([])}
                className="text-xs text-[#D64545] hover:underline font-semibold"
              >
                Vaciar Carrito
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div>
            <label className="text-xs font-semibold text-[#20242B] block mb-1">
              Cliente Titular de la Factura *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 text-xs font-medium text-[#20242B] focus:bg-white"
            >
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.docType} {c.docNumber}) · {c.segment}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="divide-y divide-[#EAECEF] max-h-[220px] overflow-y-auto pr-1">
            {cartProducts.map((p) => {
              const currentDisc = discounts[p.id] || 0;
              const finalPrice = Math.max(0, p.salePriceCOP - currentDisc);
              return (
                <div key={p.id} className="py-2.5 flex items-start justify-between gap-2.5 text-xs">
                  <img
                    src={p.imageUrl || getDefaultJewelryImage(p.category, p.name)}
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover border border-[#EAECEF] shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-[#20242B] line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-[#727985] font-mono mt-0.5">
                      {p.sku} · {formatGrams(p.netMetalWeightGrams)} metal
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#727985]">Descuento:</span>
                      <input
                        type="number"
                        min="0"
                        value={currentDisc || ''}
                        placeholder="0"
                        onChange={(e) => handleDiscountChange(p.id, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-[#F4F5F7] border border-[#EAECEF] rounded-lg px-2 py-0.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-[#20242B] block tabular-nums">
                      {formatCOP(finalPrice)}
                    </span>
                    <button
                      onClick={() => removeFromCart(p.id)}
                      className="text-[#D64545] p-1 mt-1 hover:text-red-700"
                      title="Quitar joya"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {cartProducts.length === 0 && (
              <div className="py-10 text-center text-xs text-[#727985]">
                No hay joyas en el carrito. Seleccione piezas del panel izquierdo para facturar.
              </div>
            )}
          </div>

          {/* Payment Method Selector with Big Touch Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#EAECEF]">
            <label className="text-xs font-semibold text-[#20242B] block">
              Forma de Pago
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('EFECTIVO')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  paymentMethod === 'EFECTIVO'
                    ? 'border-[#9B7028] bg-[#9B7028]/10 text-[#7F581A] font-bold shadow-xs'
                    : 'border-[#EAECEF] hover:bg-[#F4F5F7] text-[#20242B]'
                }`}
              >
                💵 Efectivo (Caja)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TARJETA_CREDITO')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  paymentMethod === 'TARJETA_CREDITO'
                    ? 'border-[#9B7028] bg-[#9B7028]/10 text-[#7F581A] font-bold shadow-xs'
                    : 'border-[#EAECEF] hover:bg-[#F4F5F7] text-[#20242B]'
                }`}
              >
                💳 Tarjeta / Datafono
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFERENCIA_BANCOLOMBIA')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  paymentMethod === 'TRANSFERENCIA_BANCOLOMBIA'
                    ? 'border-[#9B7028] bg-[#9B7028]/10 text-[#7F581A] font-bold shadow-xs'
                    : 'border-[#EAECEF] hover:bg-[#F4F5F7] text-[#20242B]'
                }`}
              >
                🏦 Bancolombia
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('NEQUI_DAVIPLATA')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  paymentMethod === 'NEQUI_DAVIPLATA'
                    ? 'border-[#9B7028] bg-[#9B7028]/10 text-[#7F581A] font-bold shadow-xs'
                    : 'border-[#EAECEF] hover:bg-[#F4F5F7] text-[#20242B]'
                }`}
              >
                📱 Nequi / Daviplata
              </button>
            </div>

            {paymentMethod !== 'EFECTIVO' && (
              <input
                type="text"
                placeholder="Número de comprobante / autorización..."
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5 text-xs font-mono"
              />
            )}
          </div>

          {/* Pricing Totals Box */}
          <div className="bg-[#F4F5F7] rounded-2xl p-4 border border-[#EAECEF] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#727985]">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">{formatCOP(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[#21865B] font-semibold">
                <span>Descuento Aplicado:</span>
                <span className="font-mono tabular-nums">-{formatCOP(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#727985]">
              <span>IVA (19%):</span>
              <span className="font-mono tabular-nums">{formatCOP(totalVat)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#20242B] pt-2 border-t border-[#EAECEF]">
              <span>Total Factura:</span>
              <span className="font-mono text-[#7F581A] tabular-nums text-lg">
                {formatCOP(grandTotal)}
              </span>
            </div>
          </div>

          {/* Checkout CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={cartProducts.length === 0}
            className="w-full py-3.5 rounded-xl bg-[#9B7028] hover:bg-[#7F581A] active:scale-98 disabled:opacity-40 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Cobrar {cartProducts.length > 0 ? formatCOP(grandTotal) : ''}</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Quick Cart trigger for Mobile if user is in catalog */}
      {cartProducts.length > 0 && mobileTab === 'catalog' && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
          <button
            onClick={() => setMobileTab('cart')}
            className="w-full py-3 px-4 bg-[#9B7028] text-white rounded-xl shadow-lg flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Carrito ({cartProducts.length} joyas)</span>
            </div>
            <span className="font-mono">{formatCOP(grandTotal)}</span>
          </button>
        </div>
      )}

      {/* RECEIPT / INVOICE MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-lg p-5 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header info */}
            <div className="text-center pb-3 border-b border-[#EAECEF]">
              <div className="flex justify-center mb-2">
                <JewelLogo size="lg" variant="mark-only" />
              </div>
              <h2 className="text-base font-bold text-[#20242B]">JOYERI S.A.S.</h2>
              <p className="text-[11px] text-[#727985]">
                NIT 901.442.118-4 · Joyería Fina & Metales Preciosos
              </p>
              <p className="text-[11px] text-[#727985]">
                {activeBranch.name} · {activeBranch.address}
              </p>
              <div className="mt-2 inline-block bg-[#F4F5F7] px-3 py-1 rounded-lg border border-[#EAECEF] font-mono font-bold text-xs text-[#20242B]">
                FACTURA: {completedSale.invoiceNumber}
              </div>
            </div>

            {/* Customer & Sale Metadata */}
            <div className="text-xs space-y-1 bg-[#F4F5F7] p-3 rounded-xl border border-[#EAECEF]">
              <div className="flex justify-between">
                <span className="text-[#727985]">Fecha & Hora:</span>
                <span className="font-semibold text-[#20242B]">
                  {formatDateTime(completedSale.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727985]">Cliente:</span>
                <span className="font-semibold text-[#20242B]">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727985]">Documento:</span>
                <span className="font-mono text-[#20242B]">{completedSale.customerDoc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727985]">Asesor:</span>
                <span className="text-[#20242B]">{completedSale.sellerName}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-[#EAECEF] rounded-xl overflow-hidden text-xs">
              <div className="bg-[#F4F5F7] px-3 py-1.5 font-semibold text-[#727985] flex justify-between">
                <span>Descripción & Pureza</span>
                <span>Valor Final</span>
              </div>
              <div className="divide-y divide-[#EAECEF]">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="p-3">
                    <p className="font-bold text-[#20242B]">{item.name}</p>
                    <p className="text-[11px] text-[#727985] font-mono mt-0.5">
                      SKU: {item.sku} · Peso Neto: {formatGrams(item.netMetalWeightGrams)} · Oro Fino: {formatGrams(item.fineMetalContentGrams)} (24K)
                    </p>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-[#EAECEF]/60">
                      <span className="text-[11px] text-[#727985]">Precio liquidado</span>
                      <span className="font-mono font-bold text-[#20242B]">
                        {formatCOP(item.finalPriceCOP)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-[#F4F5F7] rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-[#727985]">
                <span>Subtotal Base:</span>
                <span className="font-mono">{formatCOP(completedSale.subtotalCOP)}</span>
              </div>
              <div className="flex justify-between text-[#727985]">
                <span>IVA (19%):</span>
                <span className="font-mono">{formatCOP(completedSale.vatCOP)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#20242B] pt-1 border-t border-[#EAECEF]">
                <span>TOTAL FACTURA:</span>
                <span className="font-mono text-[#7F581A]">{formatCOP(completedSale.totalCOP)}</span>
              </div>
            </div>

            {/* Warranty Certificate info */}
            <div className="bg-[#21865B]/10 border border-[#21865B]/20 rounded-xl p-2.5 text-xs text-[#21865B] flex items-center justify-between">
              <div>
                <span className="font-bold block">Garantía de Ley Incluida</span>
                <span className="text-[11px] font-mono">Certificado: {completedSale.warrantyCode}</span>
              </div>
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAECEF]">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#20242B] rounded-lg text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-lg text-xs font-semibold"
              >
                Listo / Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
