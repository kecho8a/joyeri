/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  X,
  Coins,
  Gem,
  FileText,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { Product, JewelCategory, MetalType, Gemstone } from '../../types';
import {
  formatCOP,
  formatGrams,
  formatCarats,
  calculateNetMetalWeight,
  calculateFineMetalWeight,
  METAL_DEFINITIONS,
  caratsToGrams,
} from '../../utils/jewelryCalculations';
import {
  getDefaultJewelryImage,
  JEWELRY_IMAGE_PRESETS,
} from '../../utils/jewelryImages';

interface ProductsViewProps {
  isCreateOpenInitial?: boolean;
  onCloseCreateInitial?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  isCreateOpenInitial,
  onCloseCreateInitial,
}) => {
  const state = erpDb.getState();
  const activeBranch = erpDb.getActiveBranch();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedMetal, setSelectedMetal] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('DISPONIBLE');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(isCreateOpenInitial || false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [transferModalProduct, setTransferModalProduct] = useState<Product | null>(null);
  const [targetBranchId, setTargetBranchId] = useState(state.branches[1]?.id || 'SED-02');
  const [transferReason, setTransferReason] = useState('Rotación de exhibición en vitrina');

  // New product form
  const [formData, setFormData] = useState({
    sku: `ANI-ORO18-${Date.now().toString().slice(-4)}`,
    barcode: `770${Math.floor(100000000 + Math.random() * 900000000)}`,
    reference: 'REF-JOY-NEW',
    name: '',
    description: '',
    category: 'Anillos' as JewelCategory,
    metalType: 'ORO_18K_NACIONAL' as MetalType,
    metalColor: 'Amarillo' as Product['metalColor'],
    grossWeightGrams: 5.5,
    stoneWeightCarats: 0,
    otherComponentsWeightGrams: 0,
    ringSize: '',
    costPriceCOP: 2500000,
    additionalCostsCOP: 150000,
    salePriceCOP: 4200000,
    minAllowedPriceCOP: 3800000,
    vatRate: 0.19,
    locationInStore: 'Vitrina Principal A-1',
    hasStones: false,
    stoneType: 'Diamante Natural' as Gemstone['type'],
    stoneCarats: 0.5,
    stoneCut: 'Brillante Redondo' as Gemstone['cut'],
    stoneColor: 'G',
    stoneClarity: 'VS1',
    stoneCertOrg: 'GIA' as Gemstone['certificateOrg'],
    stoneCertNum: '',
    imageUrl: '',
  });

  // Calculate live previews
  const metalDef = METAL_DEFINITIONS[formData.metalType];
  const stoneGramsPreview = caratsToGrams(formData.hasStones ? formData.stoneCarats : 0);
  const netMetalPreview = calculateNetMetalWeight(
    formData.grossWeightGrams,
    formData.hasStones ? formData.stoneCarats : 0,
    formData.otherComponentsWeightGrams
  );
  const fineMetalPreview = calculateFineMetalWeight(netMetalPreview, metalDef.fineness);
  const totalCostPreview = formData.costPriceCOP + formData.additionalCostsCOP;
  const marginPreview =
    formData.salePriceCOP > 0
      ? (((formData.salePriceCOP - totalCostPreview) / formData.salePriceCOP) * 100).toFixed(1)
      : '0';

  // Filtered Products
  const filteredProducts = state.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);

    const matchesCategory = selectedCategory === 'TODAS' || p.category === selectedCategory;
    const matchesMetal = selectedMetal === 'TODOS' || p.metalType === selectedMetal;
    const matchesStatus = selectedStatus === 'TODOS' || p.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesMetal && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Por favor ingrese el nombre de la joya');
      return;
    }

    const stones: Gemstone[] = [];
    if (formData.hasStones && formData.stoneCarats > 0) {
      stones.push({
        id: `GEM-${Date.now()}`,
        type: formData.stoneType,
        carats: formData.stoneCarats,
        quantity: 1,
        cut: formData.stoneCut,
        color: formData.stoneColor,
        clarity: formData.stoneClarity,
        certificateOrg: formData.stoneCertOrg,
        certificateNumber: formData.stoneCertNum || undefined,
      });
    }

    try {
      erpDb.createProduct({
        sku: formData.sku,
        barcode: formData.barcode,
        reference: formData.reference,
        name: formData.name,
        description: formData.description || `Joya elaborada en ${formData.metalType} (${formData.metalColor}).`,
        category: formData.category,
        metalType: formData.metalType,
        metalColor: formData.metalColor,
        fineness: metalDef.fineness,
        grossWeightGrams: formData.grossWeightGrams,
        stoneWeightCarats: formData.hasStones ? formData.stoneCarats : 0,
        stoneWeightGrams: stoneGramsPreview,
        otherComponentsWeightGrams: formData.otherComponentsWeightGrams,
        ringSize: formData.ringSize || undefined,
        stones,
        costPriceCOP: formData.costPriceCOP,
        additionalCostsCOP: formData.additionalCostsCOP,
        totalCostCOP: totalCostPreview,
        salePriceCOP: formData.salePriceCOP,
        minAllowedPriceCOP: formData.minAllowedPriceCOP,
        vatRate: formData.vatRate,
        branchId: activeBranch.id,
        locationInStore: formData.locationInStore,
        status: 'DISPONIBLE',
        isConsignment: false,
        imageUrl: formData.imageUrl || getDefaultJewelryImage(formData.category, formData.name),
      });

      setIsCreateModalOpen(false);
      if (onCloseCreateInitial) onCloseCreateInitial();
      alert('Joya guardada exitosamente en inventario con contenido de oro fino calculado.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalProduct) return;
    try {
      erpDb.transferProduct(transferModalProduct.id, targetBranchId, transferReason);
      setTransferModalProduct(null);
      alert('Traslado registrado con trazabilidad de auditoría');
    } catch (err: any) {
      alert(`Error al trasladar: ${err.message}`);
    }
  };

  const categories = ['TODAS', 'Anillos', 'Cadenas', 'Pulseras', 'Aretes', 'Dijes', 'Gargantillas', 'Relojes de Lujo', 'Lingotes y Monedas', 'Gemas Certificadas'];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#20242B] tracking-tight">
            Catálogo & Stock de Joyería
          </h1>
          <p className="text-xs text-[#727985]">
            Control de pesos brutos, gemas, peso neto de metal y contenido de oro puro 24K
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F4F5F7] p-1 rounded-xl border border-[#EAECEF] text-xs font-semibold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white text-[#20242B] shadow-xs' : 'text-[#727985]'
              }`}
            >
              Fichas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#20242B] shadow-xs' : 'text-[#727985]'
              }`}
            >
              Tabla
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#9B7028] hover:bg-[#7F581A] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Joya</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#727985] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nombre de joya, corte de gema o referencia..."
            className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl pl-9 pr-4 py-2 text-xs text-[#20242B] placeholder-[#727985] focus:outline-none focus:border-[#9B7028] focus:bg-white transition-colors"
          />
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
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

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAECEF]">
          <select
            value={selectedMetal}
            onChange={(e) => setSelectedMetal(e.target.value)}
            className="bg-[#F4F5F7] border border-[#EAECEF] rounded-lg px-2.5 py-1 text-xs text-[#20242B] font-medium"
          >
            <option value="TODOS">Todos los Metales</option>
            <option value="ORO_18K_NACIONAL">Oro 18K Nacional</option>
            <option value="ORO_18K_ITALIANO">Oro 18K Italiano</option>
            <option value="ORO_14K">Oro 14K</option>
            <option value="ORO_24K">Oro 24K Puro</option>
            <option value="PLATA_925">Plata 925</option>
            <option value="PLATINO_950">Platino 950</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#F4F5F7] border border-[#EAECEF] rounded-lg px-2.5 py-1 text-xs text-[#20242B] font-medium"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="DISPONIBLE">Disponibles en Vitrina</option>
            <option value="RESERVADO">En Separados</option>
            <option value="VENDIDO">Vendidos</option>
          </select>

          <span className="text-[11px] text-[#727985] ml-auto">
            Mostrando <strong>{filteredProducts.length}</strong> joyas
          </span>
        </div>
      </div>

      {/* Main View: Cards View (Default, Elegant & Friendly) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredProducts.map((p) => {
            const mDef = METAL_DEFINITIONS[p.metalType];
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#EAECEF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-[#9B7028] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* High Quality Jewelry Photo */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#F4F5F7] mb-2.5 group">
                    <img
                      src={p.imageUrl || getDefaultJewelryImage(p.category, p.name)}
                      alt={p.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="font-mono font-bold text-[#7F581A] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[10px] shadow-xs">
                        {p.sku}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs ${
                          p.status === 'DISPONIBLE'
                            ? 'bg-[#21865B] text-white'
                            : p.status === 'RESERVADO'
                            ? 'bg-[#D99032] text-white'
                            : 'bg-[#727985] text-white'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                      {p.locationInStore}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-[#20242B] line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-[#727985] mt-0.5 font-medium">
                    {p.category} · {p.metalColor} {p.ringSize ? `· Talla ${p.ringSize}` : ''}
                  </p>

                  {/* Weights card */}
                  <div className="bg-[#F8F9FA] rounded-xl p-2.5 my-2.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#727985] block text-[10px]">Metal & Ley:</span>
                      <span className="font-semibold text-[#20242B]">{mDef?.karatText}</span>
                    </div>
                    <div>
                      <span className="text-[#727985] block text-[10px]">Peso Bruto:</span>
                      <span className="font-mono font-semibold text-[#20242B]">
                        {formatGrams(p.grossWeightGrams)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#727985] block text-[10px]">Metal Neto:</span>
                      <span className="font-mono font-semibold text-[#20242B]">
                        {formatGrams(p.netMetalWeightGrams)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7F581A] block text-[10px] font-semibold">Oro Fino 24K:</span>
                      <span className="font-mono font-bold text-[#7F581A]">
                        {formatGrams(p.fineMetalContentGrams)}
                      </span>
                    </div>
                  </div>

                  {/* Gemstone highlights */}
                  {p.stones.length > 0 && (
                    <div className="text-[11px] text-[#3478C6] bg-[#3478C6]/5 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold truncate">
                        <Gem className="w-3.5 h-3.5 shrink-0" />
                        {p.stones[0].type} ({formatCarats(p.stones[0].carats)})
                      </span>
                      {p.stones[0].certificateOrg && (
                        <span className="text-[10px] font-mono text-[#727985] shrink-0">
                          {p.stones[0].certificateOrg}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer with price & actions */}
                <div className="pt-2.5 border-t border-[#EAECEF] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#727985] block">Precio de Venta</span>
                    <span className="font-mono font-bold text-base text-[#20242B] tabular-nums">
                      {formatCOP(p.salePriceCOP)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTransferModalProduct(p)}
                      className="p-1.5 text-[#727985] hover:text-[#20242B] hover:bg-[#F4F5F7] rounded-lg transition-colors"
                      title="Trasladar a otra sede"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedProductDetails(p)}
                      className="px-3 py-1.5 text-xs bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#20242B] font-semibold rounded-lg transition-colors"
                    >
                      Ficha
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#727985] font-semibold border-b border-[#EAECEF]">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Joya</th>
                  <th className="py-2.5 px-3">Metal & Ley</th>
                  <th className="py-2.5 px-3 text-right">Peso Bruto</th>
                  <th className="py-2.5 px-3 text-right">Peso Neto Metal</th>
                  <th className="py-2.5 px-3 text-right text-[#7F581A] font-bold">Oro Fino 24K</th>
                  <th className="py-2.5 px-3">Gemas</th>
                  <th className="py-2.5 px-3 text-right">Precio Venta</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECEF] text-[#20242B]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F9FA]/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#7F581A]">{p.sku}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.imageUrl || getDefaultJewelryImage(p.category, p.name)}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover border border-[#EAECEF] shrink-0"
                        />
                        <span className="font-semibold text-[#20242B] line-clamp-1 max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#727985]">{p.metalType}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatGrams(p.grossWeightGrams)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">{formatGrams(p.netMetalWeightGrams)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#7F581A]">
                      {formatGrams(p.fineMetalContentGrams)}
                    </td>
                    <td className="py-2.5 px-3 text-[#727985]">
                      {p.stones.length > 0 ? `${p.stones[0].type} (${p.stones[0].carats} ct)` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{formatCOP(p.salePriceCOP)}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F4F5F7]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedProductDetails(p)}
                        className="px-2.5 py-1 bg-[#F4F5F7] hover:bg-[#EAECEF] rounded text-xs font-semibold"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW JEWELRY PIECE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECEF]">
              <div>
                <h2 className="text-base font-bold text-[#20242B]">
                  Ingresar Nueva Joya al Inventario
                </h2>
                <p className="text-xs text-[#727985]">
                  Cálculo en vivo de peso neto metálico y pureza de oro fino 24K
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[#727985] hover:text-[#20242B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-[#20242B] block mb-1">Nombre Comercial de la Joya *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Anillo Solitario Oro 18K con Esmeralda Muzo 1.50 ct"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* High Luxury Photography Selector */}
              <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-[#EAECEF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#20242B] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#9B7028]" />
                    Fotografía de Alta Joyería
                  </span>
                  {formData.imageUrl && (
                    <span className="text-[10px] text-[#21865B] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Foto vinculada
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-[#727985] block mb-1.5">
                    Seleccionar foto de catálogo con 1 clic:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {JEWELRY_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`flex items-center gap-1.5 p-1 rounded-xl border transition-all shrink-0 ${
                          formData.imageUrl === preset.url
                            ? 'border-[#9B7028] bg-white ring-2 ring-[#9B7028]/20 shadow-xs'
                            : 'border-[#EAECEF] bg-white hover:border-[#9B7028]/50'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                        <span className="text-[10px] font-medium pr-1 text-[#20242B]">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="O pegar URL directa de fotografía de la joya (https://...)"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-white border border-[#EAECEF] rounded-xl px-3 py-1.5 text-xs text-[#20242B]"
                  />
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-8 h-8 rounded-lg object-cover border border-[#EAECEF] shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#EAECEF] flex items-center justify-center shrink-0 text-[#727985] text-[10px]">
                      Foto
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as JewelCategory })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2"
                  >
                    <option value="Anillos">Anillos</option>
                    <option value="Cadenas">Cadenas</option>
                    <option value="Pulseras">Pulseras</option>
                    <option value="Aretes">Aretes</option>
                    <option value="Dijes">Dijes</option>
                    <option value="Gargantillas">Gargantillas</option>
                    <option value="Relojes de Lujo">Relojes de Lujo</option>
                    <option value="Lingotes y Monedas">Lingotes y Monedas</option>
                    <option value="Gemas Certificadas">Gemas Certificadas</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Metal & Kilataje</label>
                  <select
                    value={formData.metalType}
                    onChange={(e) => setFormData({ ...formData, metalType: e.target.value as MetalType })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="ORO_18K_NACIONAL">Oro 18K Nacional (Ley 0.750)</option>
                    <option value="ORO_18K_ITALIANO">Oro 18K Blanco/Italiano (Ley 0.750)</option>
                    <option value="ORO_14K">Oro 14K (Ley 0.585)</option>
                    <option value="ORO_10K">Oro 10K (Ley 0.417)</option>
                    <option value="ORO_24K">Oro Puro 24K (Ley 0.999)</option>
                    <option value="PLATA_925">Plata Ley 925 (Ley 0.925)</option>
                    <option value="PLATINO_950">Platino 950 (Ley 0.950)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Color Metal</label>
                  <select
                    value={formData.metalColor}
                    onChange={(e) => setFormData({ ...formData, metalColor: e.target.value as any })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2"
                  >
                    <option value="Amarillo">Amarillo</option>
                    <option value="Blanco">Blanco</option>
                    <option value="Rosa">Rosa</option>
                    <option value="Bicolor">Bicolor</option>
                    <option value="Plata">Plata</option>
                  </select>
                </div>
              </div>

              {/* Real-time Metal Calculation Strip */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#EAECEF] space-y-3">
                <span className="font-bold text-[#20242B] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#9B7028]" />
                  Pesaje en Balanza & Pureza de Oro Fino
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[#20242B] block mb-1">Peso Bruto Total (g) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.grossWeightGrams}
                      onChange={(e) => setFormData({ ...formData, grossWeightGrams: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#20242B] block mb-1">Peso Piedras (Quilates / ct)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hasStones ? formData.stoneCarats : 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hasStones: true,
                          stoneCarats: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#20242B] block mb-1">Otros Comp. (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.otherComponentsWeightGrams}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otherComponentsWeightGrams: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#EAECEF] flex items-center justify-between">
                  <div>
                    <span className="text-[#727985] block text-[11px]">Peso Neto Metálico:</span>
                    <span className="font-mono font-bold text-sm text-[#20242B]">{formatGrams(netMetalPreview)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#7F581A] block font-semibold text-[11px]">
                      Contenido Oro Fino Puro (24K / Ley {metalDef.fineness}):
                    </span>
                    <span className="font-mono font-bold text-base text-[#7F581A]">
                      {formatGrams(fineMetalPreview)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Prices */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Costo Adquisición (COP)</label>
                  <input
                    type="number"
                    value={formData.costPriceCOP}
                    onChange={(e) => setFormData({ ...formData, costPriceCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Precio Venta (COP) *</label>
                  <input
                    type="number"
                    required
                    value={formData.salePriceCOP}
                    onChange={(e) => setFormData({ ...formData, salePriceCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono font-bold text-[#20242B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#20242B] block mb-1">Precio Mínimo Permitido</label>
                  <input
                    type="number"
                    required
                    value={formData.minAllowedPriceCOP}
                    onChange={(e) => setFormData({ ...formData, minAllowedPriceCOP: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAECEF] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-[#727985] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-xl font-bold shadow-xs"
                >
                  Guardar Joya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT DETAILS SHEET */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-lg p-5 sm:p-7 space-y-4 text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-[#EAECEF]">
              <div>
                <span className="font-mono text-xs font-bold text-[#7F581A] bg-[#9B7028]/10 px-2 py-0.5 rounded">
                  {selectedProductDetails.sku}
                </span>
                <h2 className="text-base font-bold text-[#20242B] mt-1">
                  {selectedProductDetails.name}
                </h2>
                <p className="text-xs text-[#727985]">{selectedProductDetails.reference}</p>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="p-1 rounded text-[#727985] hover:text-[#20242B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Jewelry Image */}
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-[#F4F5F7] border border-[#EAECEF]">
              <img
                src={selectedProductDetails.imageUrl || getDefaultJewelryImage(selectedProductDetails.category, selectedProductDetails.name)}
                alt={selectedProductDetails.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-[#727985]">{selectedProductDetails.description}</p>

            <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#EAECEF] space-y-2">
              <h4 className="font-bold text-[#20242B]">Detalles Físicos & Pureza:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#727985]">Metal & Ley:</span>
                  <p className="font-semibold text-[#20242B]">
                    {selectedProductDetails.metalType} (Ley {selectedProductDetails.fineness})
                  </p>
                </div>
                <div>
                  <span className="text-[#727985]">Color:</span>
                  <p className="font-semibold text-[#20242B]">{selectedProductDetails.metalColor}</p>
                </div>
                <div>
                  <span className="text-[#727985]">Peso Neto Metálico:</span>
                  <p className="font-mono font-bold text-[#20242B]">
                    {formatGrams(selectedProductDetails.netMetalWeightGrams)}
                  </p>
                </div>
                <div>
                  <span className="text-[#7F581A] font-semibold">Oro Fino Puro 24K:</span>
                  <p className="font-mono font-bold text-[#7F581A]">
                    {formatGrams(selectedProductDetails.fineMetalContentGrams)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-xl border border-[#EAECEF]">
              <div>
                <span className="text-[#727985] block">Precio de Venta al Público:</span>
                <span className="font-mono font-bold text-base text-[#20242B]">
                  {formatCOP(selectedProductDetails.salePriceCOP)}
                </span>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="px-4 py-2 bg-[#20242B] text-white rounded-xl font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER TO BRANCH */}
      {transferModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAECEF] shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#EAECEF]">
              <h2 className="text-base font-bold text-[#20242B]">Trasladar Joya de Sucursal</h2>
              <button onClick={() => setTransferModalProduct(null)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#EAECEF]">
                <p className="font-bold text-[#20242B]">{transferModalProduct.name}</p>
                <p className="font-mono text-[#727985] text-[11px] mt-0.5">SKU: {transferModalProduct.sku}</p>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Sucursal Destino *</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl px-3 py-2 font-medium"
                >
                  {state.branches
                    .filter((b) => b.id !== transferModalProduct.branchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">Motivo del Traslado *</label>
                <textarea
                  rows={2}
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-[#F4F5F7] border border-[#EAECEF] rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EAECEF]">
                <button
                  type="button"
                  onClick={() => setTransferModalProduct(null)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-xl font-bold"
                >
                  Confirmar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
