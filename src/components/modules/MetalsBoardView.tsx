/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Coins,
  Calculator,
  Edit2,
  TrendingUp,
  Check,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import { erpDb } from '../../services/store';
import { MetalPriceConfig, MetalType } from '../../types';
import {
  formatCOP,
  formatGrams,
  formatDateTime,
  calculateFineMetalWeight,
  METAL_DEFINITIONS,
} from '../../utils/jewelryCalculations';

export const MetalsBoardView: React.FC = () => {
  const state = erpDb.getState();
  const [editingMetal, setEditingMetal] = useState<MetalPriceConfig | null>(null);
  const [buyPriceInput, setBuyPriceInput] = useState<number>(0);
  const [sellPriceInput, setSellPriceInput] = useState<number>(0);
  const [sourceInput, setSourceInput] = useState('');

  // Interactive Purity Calculator
  const [calcMetalType, setCalcMetalType] = useState<MetalType>('ORO_18K_NACIONAL');
  const [calcWeightGrams, setCalcWeightGrams] = useState<number>(10.0);

  const selectedDef = METAL_DEFINITIONS[calcMetalType];
  const metalConfig = state.metalPrices.find((m) => m.code === calcMetalType);
  const calculatedFineGrams = calculateFineMetalWeight(calcWeightGrams, selectedDef.fineness);
  const scrapBuyValueCOP = calculatedFineGrams > 0 && metalConfig
    ? calcWeightGrams * metalConfig.buyPriceGramCOP
    : 0;
  const retailBaseValueCOP = calculatedFineGrams > 0 && metalConfig
    ? calcWeightGrams * metalConfig.sellPriceGramCOP
    : 0;

  const handleStartEdit = (metal: MetalPriceConfig) => {
    setEditingMetal(metal);
    setBuyPriceInput(metal.buyPriceGramCOP);
    setSellPriceInput(metal.sellPriceGramCOP);
    setSourceInput(metal.source);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMetal) return;

    try {
      erpDb.updateMetalPrice(
        editingMetal.code,
        buyPriceInput,
        sellPriceInput,
        sourceInput || 'Mercado Mayorista de Joyeros'
      );
      setEditingMetal(null);
      alert('Cotización actualizada y registrada en auditoría del sistema.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Pizarra de Cotizaciones de Metales Preciosos & Leyes
          </h1>
          <p className="text-xs text-[#727985]">
            Valores oficiales de compra de retal (chatarra) y venta base por gramo para Colombia (COP)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#727985] bg-[#F4F5F7] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
          <span>Moneda: <strong>COP (Peso Colombiano)</strong></span>
          <span>·</span>
          <span>Unidad: <strong>Gramos (g)</strong></span>
        </div>
      </div>

      {/* Main Metal Prices Board */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#9B7028]" />
          Precios Vigentes en Mostrador
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.metalPrices.map((metal) => {
            const def = METAL_DEFINITIONS[metal.code];
            return (
              <div
                key={metal.code}
                className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F4F5F7]/40 hover:border-[#9B7028] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#20242B]">{metal.name}</h3>
                      <p className="text-[11px] text-[#727985]">
                        Ley: {metal.fineness} ({metal.karatText})
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartEdit(metal)}
                      className="p-1 rounded text-[#727985] hover:text-[#20242B] hover:bg-[#E5E7EB]"
                      title="Actualizar cotización"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-[#E5E7EB] mt-3">
                    <div>
                      <span className="text-[10px] text-[#727985] block uppercase font-semibold">
                        Compra Retal
                      </span>
                      <span className="font-mono font-bold text-sm text-[#20242B] tabular-nums">
                        {formatCOP(metal.buyPriceGramCOP)}
                      </span>
                      <span className="text-[10px] text-[#727985] block">por gramo</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7F581A] block uppercase font-semibold">
                        Venta Base
                      </span>
                      <span className="font-mono font-bold text-sm text-[#7F581A] tabular-nums">
                        {formatCOP(metal.sellPriceGramCOP)}
                      </span>
                      <span className="text-[10px] text-[#727985] block">por gramo</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#727985] pt-2 border-t border-[#E5E7EB]">
                  <p className="truncate">Fuente: {metal.source}</p>
                  <p>Actualizado: {formatDateTime(metal.lastUpdated)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Purity & Weight Valuation Calculator */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#3478C6]" />
            Calculadora Oficial de Pureza & Contenido de Metal Fino
          </h2>
          <p className="text-xs text-[#727985]">
            Verifique al instante el contenido exacto de oro puro (24K) y su valorización comercial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-[#F4F5F7] p-4 rounded-xl border border-[#E5E7EB] text-xs">
          <div>
            <label className="font-semibold text-[#20242B] block mb-1">
              Seleccione Metal & Kilataje
            </label>
            <select
              value={calcMetalType}
              onChange={(e) => setCalcMetalType(e.target.value as MetalType)}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-medium"
            >
              <option value="ORO_24K">Oro Puro 24K (Ley 0.999)</option>
              <option value="ORO_18K_NACIONAL">Oro 18K Nacional (Ley 0.750)</option>
              <option value="ORO_18K_ITALIANO">Oro 18K Italiano (Ley 0.750)</option>
              <option value="ORO_14K">Oro 14K (Ley 0.585)</option>
              <option value="ORO_10K">Oro 10K (Ley 0.417)</option>
              <option value="PLATA_925">Plata Esterlina 925 (Ley 0.925)</option>
              <option value="PLATINO_950">Platino Puro 950 (Ley 0.950)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#20242B] block mb-1">
              Peso Neto en Balanza (Gramos)
            </label>
            <input
              type="number"
              step="0.01"
              value={calcWeightGrams}
              onChange={(e) => setCalcWeightGrams(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#20242B]"
            />
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
            <div>
              <span className="text-[#7F581A] block font-semibold text-[11px]">
                Oro Fino Puro Resultante (24K):
              </span>
              <span className="font-mono font-bold text-base text-[#7F581A] tabular-nums">
                {formatGrams(calculatedFineGrams)}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#727985]">
              {calcWeightGrams}g × {selectedDef.fineness}
            </span>
          </div>
        </div>

        {/* Valuation outcome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white flex justify-between items-center">
            <div>
              <span className="text-[#727985] block text-[11px]">Valor Compra de Retal / Chatarra:</span>
              <span className="text-base font-bold text-[#20242B] font-mono tabular-nums">
                {formatCOP(scrapBuyValueCOP)}
              </span>
            </div>
            <span className="text-[11px] text-[#727985]">A liquidar al cliente</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white flex justify-between items-center">
            <div>
              <span className="text-[#7F581A] block font-semibold text-[11px]">Valor Base de Venta:</span>
              <span className="text-base font-bold text-[#7F581A] font-mono tabular-nums">
                {formatCOP(retailBaseValueCOP)}
              </span>
            </div>
            <span className="text-[11px] text-[#727985]">Metal elaborado base</span>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT PRICE */}
      {editingMetal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="font-bold text-[#20242B] text-sm">Actualizar Cotización</h3>
                <p className="text-xs text-[#727985]">{editingMetal.name}</p>
              </div>
              <button onClick={() => setEditingMetal(null)} className="p-1 text-[#727985]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Precio Compra Retal (COP / Gramo) *
                </label>
                <input
                  type="number"
                  required
                  value={buyPriceInput}
                  onChange={(e) => setBuyPriceInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Precio Venta Base (COP / Gramo) *
                </label>
                <input
                  type="number"
                  required
                  value={sellPriceInput}
                  onChange={(e) => setSellPriceInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold text-[#7F581A]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#20242B] block mb-1">
                  Fuente de Referencia Verificable *
                </label>
                <input
                  type="text"
                  required
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMetal(null)}
                  className="px-4 py-2 text-[#727985]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#9B7028] hover:bg-[#7F581A] text-white rounded-lg font-semibold"
                >
                  Guardar Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
