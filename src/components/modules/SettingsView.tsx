/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  ShieldAlert,
  Database,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { erpDb } from '../../services/store';

const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const SettingsView: React.FC = () => {
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const handleExportBackup = () => {
    const jsonStr = erpDb.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `joyeri_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Copia de seguridad del ERP descargada exitosamente en formato JSON.');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText) return;
    try {
      erpDb.importBackupJSON(importJsonText);
      alert('Base de datos restaurada correctamente.');
      setShowImportBox(false);
      setImportJsonText('');
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleResetData = () => {
    if (confirm('¿Está seguro de reiniciar los datos del ERP a los valores predeterminados de prueba? Esta acción reemplazará los datos actuales.')) {
      erpDb.resetToDefaultSeed();
      alert('Base de datos reiniciada a los valores de prueba de joyería.');
      window.location.reload();
    }
  };

  const autoBackups = erpDb.getAutoBackups();

  const handleRestoreAutoBackup = (date: string) => {
    if (
      !confirm(
        `¿Restaurar el respaldo automático del ${formatDate(
          date
        )}? Se reemplazarán los datos actuales.`
      )
    ) {
      return;
    }
    try {
      erpDb.restoreAutoBackup(date);
      alert('Respaldo automático restaurado correctamente.');
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="card-float p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#20242B]">
            Configuración del Sistema & Copias de Seguridad
          </h1>
          <p className="text-xs text-[#727985]">
            Ajustes regionales, parámetros de joyería, respaldo JSON y restauración de base de datos
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#21865B] bg-[#21865B]/10 px-2.5 py-1 rounded font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          Sistema Operativo & Seguro
        </div>
      </div>

      {/* Regional Settings Card */}
      <div className="card-float p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#3478C6]" />
          Configuración Regional & Parámetros
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
            <span className="text-[#727985] block font-semibold mb-0.5">País & Localización:</span>
            <span className="font-bold text-[#20242B]">Colombia (América/Bogotá - GMT-5)</span>
          </div>

          <div className="p-3 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
            <span className="text-[#727985] block font-semibold mb-0.5">Moneda Predeterminada:</span>
            <span className="font-bold text-[#20242B]">COP (Peso Colombiano - $)</span>
          </div>

          <div className="p-3 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
            <span className="text-[#727985] block font-semibold mb-0.5">Formato de Presentación de Fechas:</span>
            <span className="font-bold text-[#20242B]">DD/MM/AAAA</span>
          </div>

          <div className="p-3 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
            <span className="text-[#727985] block font-semibold mb-0.5">Tasa General de IVA para Joyería:</span>
            <span className="font-bold text-[#20242B]">19% (Oro de inversión 24K exento)</span>
          </div>
        </div>
      </div>

      {/* Database Backup & Recovery Card */}
      <div className="card-float p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#10B981]" />
          Procedimiento de Copia de Seguridad & Restauración
        </h2>
        <p className="text-xs text-[#727985]">
          Descargue un volcado completo de toda la base de datos empresarial (productos, ventas, contabilidad, clientes, movimientos y arqueos) o restaure un respaldo previo.
        </p>

        <div className="flex items-start gap-2 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl px-3 py-2 text-[11px] text-[#059669]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            La información se guarda únicamente en este navegador y computador.
            Descargue el JSON con frecuencia y guárdelo en un lugar seguro; si
            borra los datos del navegador, perderá el sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar Respaldo JSON Completo
          </button>

          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F4F5F7] hover:bg-[#E5E7EB] text-[#20242B] border border-[#E5E7EB] rounded-lg text-xs font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Restaurar desde Respaldo
          </button>

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-2 text-[#D64545] hover:bg-red-50 rounded-lg text-xs font-semibold ml-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar a Datos de Prueba
          </button>
        </div>

        {showImportBox && (
          <form onSubmit={handleImportSubmit} className="mt-4 p-4 bg-[#F4F5F7] rounded-xl border border-[#E5E7EB] space-y-3 text-xs">
            <label className="font-semibold text-[#20242B] block">
              Pegue aquí el contenido JSON del archivo de respaldo:
            </label>
            <textarea
              rows={4}
              required
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"branches": [...], "products": [...], ...}'
              className="w-full bg-white border border-[#E5E7EB] rounded-lg p-2 font-mono text-[11px]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportBox(false)}
                className="px-3 py-1.5 text-[#727985]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#20242B] text-white rounded-lg font-semibold"
              >
                Cargar y Restaurar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Automatic Daily Backups Card */}
      <div className="card-float p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#20242B] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#21865B]" />
              Respaldos Automáticos Diarios
            </h2>
            <p className="text-xs text-[#727985] mt-1">
              El sistema guarda una copia por día en este navegador y conserva
              las últimas 7. Descarga el JSON completo para guardar una copia
              fuera del computador.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#21865B] bg-[#21865B]/10 px-2 py-1 rounded-full shrink-0">
            {autoBackups.length}/7
          </span>
        </div>

        {autoBackups.length ? (
          <div className="space-y-2">
            {autoBackups.map((backup) => (
              <div
                key={backup.key}
                className="flex items-center justify-between gap-3 bg-[#F8F9FA] border border-[#EAECEF] rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-white border border-[#EAECEF] flex items-center justify-center">
                    <Database className="w-4 h-4 text-[#10B981]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#20242B]">
                      {formatDate(backup.date)}
                    </p>
                    <p className="text-[10px] text-[#727985]">
                      Copia automática · {backup.sizeKb} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestoreAutoBackup(backup.date)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:border-[#10B981] text-[#20242B] text-[11px] font-semibold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-xl p-4 text-center">
            <p className="text-xs text-[#727985]">
              Aún no hay respaldos automáticos. Se creará uno al guardar el
              primer cambio del día.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
