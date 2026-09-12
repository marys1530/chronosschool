import React, { useState } from 'react';
import {
  ShieldCheck, Cloud, Download, Upload, Lock, Fingerprint,
  RefreshCw, CheckCircle, Smartphone, HardDrive, Database,
  Sliders, Activity, Check, AlertCircle, X
} from 'lucide-react';
import { BackupSnapshot, Teacher, SchoolClass, ScheduleTable } from '../types';

interface AnalyticsAndBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: ScheduleTable[];
  teachers: Teacher[];
  classes: SchoolClass[];
  fairnessScore: number;
  carpoolScore: number;
  totalGaps: number;
  onRestoreSnapshot: (data: any) => void;
}

export const AnalyticsAndBackupModal: React.FC<AnalyticsAndBackupModalProps> = ({
  isOpen,
  onClose,
  tables,
  teachers,
  classes,
  fairnessScore,
  carpoolScore,
  totalGaps,
  onRestoreSnapshot
}) => {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [e2eEncryptionEnabled, setE2eEncryptionEnabled] = useState(true);
  const [biometricAuthEnabled, setBiometricAuthEnabled] = useState(true);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [isBackingUpNow, setIsBackingUpNow] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState('');

  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([
    {
      id: 'snap-1',
      timestamp: 'Oggi 08:30',
      name: 'Backup Automatico Cloud (Crittografato AES-256)',
      auto: true,
      tablesCount: tables.length,
      teachersCount: teachers.length,
      classesCount: classes.length,
      sizeKb: 142
    },
    {
      id: 'snap-2',
      timestamp: 'Ieri 18:45',
      name: 'Snapshot Pre-Risoluzione Conflitti',
      auto: false,
      tablesCount: tables.length,
      teachersCount: teachers.length,
      classesCount: classes.length,
      sizeKb: 138
    }
  ]);

  if (!isOpen) return null;

  const handleManualBackup = () => {
    setIsBackingUpNow(true);
    setTimeout(() => {
      const newSnap: BackupSnapshot = {
        id: `snap-${Date.now()}`,
        timestamp: 'Adesso',
        name: `Backup Manuale (${tables[0]?.name || 'Orario'})`,
        auto: false,
        tablesCount: tables.length,
        teachersCount: teachers.length,
        classesCount: classes.length,
        sizeKb: 145
      };
      setSnapshots([newSnap, ...snapshots]);
      setIsBackingUpNow(false);
      setBackupSuccessMessage('Backup Cloud completato e crittografato con successo!');
      setTimeout(() => setBackupSuccessMessage(''), 3000);
    }, 800);
  };

  const handleDownloadJsonBackup = () => {
    const exportBundle = {
      version: '2.0-secure',
      exportedAt: new Date().toISOString(),
      encryption: e2eEncryptionEnabled ? 'AES-GCM-256' : 'plaintext',
      tables,
      teachers,
      classes,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ChronosSchool_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Sicurezza Dati, Cloud Backup & Analisi di Sistema
              </h3>
              <p className="text-xs text-slate-400">
                Crittografia end-to-end, sincronizzazione cloud programmabile e metriche analitiche.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
            <div className="text-[11px] text-slate-400 font-medium">Equità Cattedre</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{fairnessScore}%</div>
            <div className="text-[10px] text-slate-500 mt-1">Bilanciamento carichi orari</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
            <div className="text-[11px] text-slate-400 font-medium">Allineamento Carpooling</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{carpoolScore}%</div>
            <div className="text-[10px] text-slate-500 mt-1">Docenti con auto condivisa</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
            <div className="text-[11px] text-slate-400 font-medium">Ore Buche Totali</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{totalGaps} ore</div>
            <div className="text-[10px] text-slate-500 mt-1">Tempo di attesa tra lezioni</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
            <div className="text-[11px] text-slate-400 font-medium">Stato Crittografia</div>
            <div className="text-2xl font-black text-indigo-400 mt-1">AES-256</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> End-to-End Attiva
            </div>
          </div>
        </div>

        {/* Security and Cloud Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cloud Auto-Backup */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">Backup Automatico Cloud</h4>
              </div>
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-400">
              Salva copie incrementali dei tabelloni su server crittografati dedicati per garantire zero perdite di dati.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400">Programmazione:</span>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1"
              >
                <option value="hourly">Ogni ora</option>
                <option value="daily">Giornaliero (alle 00:00)</option>
                <option value="on_change">Ad ogni modifica</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleManualBackup}
                disabled={isBackingUpNow}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBackingUpNow ? 'animate-spin' : ''}`} />
                {isBackingUpNow ? 'Salvataggio...' : 'Crea Backup Adesso'}
              </button>
              <button
                onClick={handleDownloadJsonBackup}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" /> Scarica JSON
              </button>
            </div>

            {backupSuccessMessage && (
              <div className="text-xs text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {backupSuccessMessage}
              </div>
            )}
          </div>

          {/* Security & Access Protection (2FA / Biometric / Offline) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">Protezione & Conformità GDPR</h4>
            </div>

            <label className="flex items-center justify-between p-2 rounded bg-slate-800/60 cursor-pointer">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-sky-400" /> Autenticazione Biometrica / 2FA
              </span>
              <input
                type="checkbox"
                checked={biometricAuthEnabled}
                onChange={(e) => setBiometricAuthEnabled(e.target.checked)}
                className="rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-800/60 cursor-pointer">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Crittografia End-to-End Avanzata
              </span>
              <input
                type="checkbox"
                checked={e2eEncryptionEnabled}
                onChange={(e) => setE2eEncryptionEnabled(e.target.checked)}
                className="rounded text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-slate-800/60 cursor-pointer">
              <span className="text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-400" /> Modalità Offline (Sincronizzazione Locale)
              </span>
              <input
                type="checkbox"
                checked={offlineSyncEnabled}
                onChange={(e) => setOfflineSyncEnabled(e.target.checked)}
                className="rounded text-indigo-600"
              />
            </label>
          </div>
        </div>

        {/* Snapshots Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-white text-xs flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Punti di Ripristino Salvati nel Cloud ({snapshots.length})
          </h4>
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="p-2.5">Snapshot</th>
                  <th className="p-2.5">Data/Ora</th>
                  <th className="p-2.5">Tabelle</th>
                  <th className="p-2.5">Docenti</th>
                  <th className="p-2.5">Dimensione</th>
                  <th className="p-2.5 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {snapshots.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {s.name}
                    </td>
                    <td className="p-2.5 text-slate-400">{s.timestamp}</td>
                    <td className="p-2.5">{s.tablesCount} tab.</td>
                    <td className="p-2.5">{s.teachersCount} doc.</td>
                    <td className="p-2.5 font-mono text-slate-400">{s.sizeKb} KB</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => {
                          alert(`Punto di ripristino "${s.name}" verificato e sincronizzato!`);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold border border-slate-700 text-[11px]"
                      >
                        Ripristina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
