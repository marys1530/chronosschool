import React from 'react';
import {
  Calendar, Users, BookOpen, GraduationCap, BarChart3, Plus,
  Printer, FileSpreadsheet, Mail, Wand2, Bell, ShieldCheck,
  Moon, Sun, Globe, Car, AlertTriangle, Sparkles, Zap
} from 'lucide-react';
import { ScheduleTable, ActiveTab, ConflictIssue } from '../types';
import { SupportedLanguage, TRANSLATIONS } from '../utils/translations';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tables: ScheduleTable[];
  activeTableId: string;
  onSelectTable: (tableId: string) => void;
  onOpenNewTableModal: () => void;
  onOpenGenerateModal: () => void;
  onQuickResolveConflicts?: () => void;
  hoursPerDay: number;
  onChangeHoursPerDay: (hours: number) => void;
  conflicts: ConflictIssue[];
  onOpenConflictModal: () => void;
  onOpenPrintModal: () => void;
  onExportExcel: () => void;
  onOpenEmailModal: () => void;
  onOpenBackupModal: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  lang: SupportedLanguage;
  onChangeLang: (lang: SupportedLanguage) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  fairnessScore: number;
  carpoolScore: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  tables,
  activeTableId,
  onSelectTable,
  onOpenNewTableModal,
  onOpenGenerateModal,
  onQuickResolveConflicts,
  hoursPerDay,
  onChangeHoursPerDay,
  conflicts,
  onOpenConflictModal,
  onOpenPrintModal,
  onExportExcel,
  onOpenEmailModal,
  onOpenBackupModal,
  unreadNotificationsCount,
  onOpenNotifications,
  lang,
  onChangeLang,
  darkMode,
  onToggleDarkMode,
  fairnessScore,
  carpoolScore
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.it;
  const activeTable = tables.find(tbl => tbl.id === activeTableId) || tables[0];
  const hasErrors = conflicts.some(c => c.severity === 'error');

  return (
    <header className="border-b border-slate-700/80 bg-slate-900/95 sticky top-0 z-40 backdrop-blur print:hidden">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        {/* Logo and Table Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                {t.appName}
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Orario PRO
                </span>
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

          {/* Table Switcher & New Table */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium hidden md:inline">Tabella attiva:</span>
            <select
              id="select-schedule-table"
              aria-label="Seleziona tabella orario"
              value={activeTableId}
              onChange={(e) => onSelectTable(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {tables.map(tbl => (
                <option key={tbl.id} value={tbl.id}>
                  {tbl.name} ({tbl.hoursPerDay}h/gg)
                </option>
              ))}
            </select>
            <button
              id="btn-new-table"
              onClick={onOpenNewTableModal}
              title="Aggiungi o crea nuova tabella orario"
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-md px-2 py-1 font-medium transition"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">+ Nuova Tabella</span>
            </button>
          </div>
        </div>

        {/* Live Metrics: Fairness & Carpooling */}
        <div className="flex items-center gap-3">
          {/* Main Generate Schedule Button */}
          <button
            id="btn-generate-schedule-nav"
            onClick={onOpenGenerateModal}
            title="Genera orario scolastico completo ed equo per tutte le classi della scuola media"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span className="whitespace-nowrap">Genera Orario</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <span className="text-slate-400">Equità:</span>
            <span className={`font-bold ${fairnessScore >= 85 ? 'text-emerald-400' : fairnessScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
              {fairnessScore}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700" title="Allineamento colleghi con auto condivisa">
            <Car className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 hidden sm:inline">Carpool:</span>
            <span className="font-bold text-sky-400">{carpoolScore}%</span>
          </div>

          {/* Quick conflict button & 1-Click resolve */}
          <div className="flex items-center gap-1">
            <button
              id="btn-resolve-conflicts"
              onClick={onOpenConflictModal}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold shadow-sm transition ${
                conflicts.length > 0
                  ? hasErrors
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
              }`}
            >
              {conflicts.length > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{conflicts.length} Conflitti ({t.autoResolve})</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nessun Conflitto • Ottimizza</span>
                </>
              )}
            </button>

            {conflicts.length > 0 && onQuickResolveConflicts && (
              <button
                id="btn-quick-resolve-direct"
                onClick={onQuickResolveConflicts}
                title="Risolvi automaticamente tutti i conflitti in 1 click senza aprire il modal"
                className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 px-2 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">1-Click</span>
              </button>
            )}
          </div>

          {/* Tools and Utility buttons */}
          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              title="Notifiche cambi orario, assenze e aule"
              className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white relative transition"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Email dispatch */}
            <button
              id="btn-open-email"
              onClick={onOpenEmailModal}
              title="Invia orario per email a docenti/studenti"
              className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* Print & PDF */}
            <button
              id="btn-open-print"
              onClick={onOpenPrintModal}
              title="Stampa e Salva Report PDF A3"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-700/60 hover:bg-indigo-600 text-white font-medium transition text-xs shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden lg:inline">Salva / Stampa PDF A3</span>
            </button>

            {/* Excel Export */}
            <button
              id="btn-export-excel"
              onClick={onExportExcel}
              title="Esporta la schermata aperta in formato Excel (.xlsx)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-700/60 hover:bg-emerald-600 text-white font-medium transition text-xs shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Excel (.xlsx)</span>
            </button>

            {/* Security & Backup */}
            <button
              id="btn-open-backup"
              onClick={onOpenBackupModal}
              title="Cloud Backup crittografato & Sicurezza 2FA"
              className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Language */}
            <div className="flex items-center ml-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <select
                id="select-app-language"
                aria-label="Lingua dell'applicazione"
                value={lang}
                onChange={(e) => onChangeLang(e.target.value as SupportedLanguage)}
                className="bg-slate-800 text-slate-300 text-[11px] rounded px-1.5 py-0.5 border border-slate-700"
              >
                <option value="it">IT</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
              </select>
            </div>

            {/* Dark / Auto mode */}
            <button
              id="btn-toggle-dark-mode"
              onClick={onToggleDarkMode}
              title="Alterna tema chiaro / scuro"
              className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition ml-1"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation tabs & Hours per day selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          <button
            id="nav-tab-schedule"
            onClick={() => setActiveTab('orario')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeTab === 'orario'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.tabSchedule}</span>
          </button>

          <button
            id="nav-tab-teachers"
            onClick={() => setActiveTab('docenti')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeTab === 'docenti'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabTeachers}</span>
          </button>

          <button
            id="nav-tab-classes"
            onClick={() => setActiveTab('classi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeTab === 'classi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.tabClasses}</span>
          </button>

          <button
            id="nav-tab-study-plan"
            onClick={() => setActiveTab('piano_studi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeTab === 'piano_studi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.tabStudyPlan}</span>
          </button>

          <button
            id="nav-tab-analytics"
            onClick={() => setActiveTab('analisi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              activeTab === 'analisi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.tabAnalytics}</span>
          </button>
        </nav>

        {/* Configure hours per day (e.g. 3 hours for week 1 vs 6 hours regular) */}
        <div className="flex items-center gap-2 py-2">
          <span className="text-xs text-slate-400 font-medium">
            Ore giornaliere:
          </span>
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {[3, 4, 5, 6, 7, 8].map(h => (
              <button
                key={h}
                id={`btn-hours-${h}`}
                onClick={() => onChangeHoursPerDay(h)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
                  hoursPerDay === h
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title={h === 3 ? '3 ore giornaliere (Ideale per la 1ª settimana di scuola)' : `${h} ore giornaliere`}
              >
                {h}h {h === 3 && <span className="text-[10px] text-amber-300 font-bold ml-0.5">(1ª Sett.)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
