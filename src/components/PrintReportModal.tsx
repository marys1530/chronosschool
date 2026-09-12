import React, { useState } from 'react';
import {
  Printer, FileText, X, Check, Users, BookOpen, LayoutGrid,
  FileSpreadsheet, Scale, AlertTriangle, Download, Loader2, ArrowLeft, Image
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayOfWeek } from '../types';
import { DAYS } from '../data/defaultData';
import {
  exportScheduleToExcel,
  exportActiveViewToExcel,
  exportElementToPdf,
  exportScheduleToWord,
  exportActiveViewToWord,
  exportElementToImage
} from '../utils/exportUtils';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ScheduleSlot[];
  teachers: Teacher[];
  classes: SchoolClass[];
  hoursPerDay: number;
  tableName: string;
}

// Sort classes: Section A first (I A, II A, III A), then Section B (I B, II B, III B), etc.
export function sortClassesAlphabetically(classesList: SchoolClass[]): SchoolClass[] {
  return [...classesList].sort((a, b) => {
    const parseClass = (c: SchoolClass) => {
      const section = c.section ? c.section.trim().toUpperCase() : (c.id.replace(/^[0-9IVX]+/, '').trim().toUpperCase() || 'A');
      let yearNum = c.year || 0;
      if (!yearNum) {
        if (c.id.startsWith('III') || c.id.startsWith('3')) yearNum = 3;
        else if (c.id.startsWith('II') || c.id.startsWith('2')) yearNum = 2;
        else if (c.id.startsWith('I') || c.id.startsWith('1')) yearNum = 1;
        else {
          const match = c.id.match(/^(\d+)/);
          yearNum = match ? parseInt(match[1], 10) : 0;
        }
      }
      return { section, yearNum, id: c.id };
    };

    const parsedA = parseClass(a);
    const parsedB = parseClass(b);

    if (parsedA.section !== parsedB.section) {
      return parsedA.section.localeCompare(parsedB.section, 'it');
    }
    return parsedA.yearNum - parsedB.yearNum;
  });
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  slots,
  teachers,
  classes,
  hoursPerDay,
  tableName
}) => {
  const [reportType, setReportType] = useState<'tabellone_a3' | 'classes' | 'teachers' | 'master' | 'fairness'>('tabellone_a3');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [customFileName, setCustomFileName] = useState<string>(tableName || 'Orario_Scolastico');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sorted classes in order: I A, II A, III A, I B, II B, III B, etc.
  const activeClasses = sortClassesAlphabetically(classes.filter(c => c.isActive));
  const teacherMap = new Map<string, Teacher>(teachers.map(t => [t.id, t]));
  const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'it'));

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    try {
      const mode = reportType === 'classes' ? 'by_class' : reportType === 'teachers' ? 'by_teacher' : reportType === 'master' ? 'master' : 'master_teachers';
      const targetClass = selectedClassFilter !== 'all' ? selectedClassFilter : undefined;
      const targetTeacher = selectedTeacherFilter !== 'all' ? selectedTeacherFilter : undefined;
      
      const ok = exportActiveViewToExcel({
        viewMode: mode,
        selectedClassId: targetClass,
        selectedTeacherId: targetTeacher,
        slots,
        teachers,
        classes,
        days: DAYS,
        hoursPerDay,
        tableName,
        customFileName: customFileName.trim() || undefined
      });

      if (ok) {
        setSaveSuccessMsg(`File Excel (${customFileName}.xlsx) scaricato con successo! Tabellone e dati pronti.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'esportazione Excel.');
    }
  };

  const handleWordExport = () => {
    try {
      const mode = reportType === 'classes' ? 'by_class' : reportType === 'teachers' ? 'by_teacher' : reportType === 'master' ? 'master' : 'master_teachers';
      const targetClass = selectedClassFilter !== 'all' ? selectedClassFilter : undefined;
      const targetTeacher = selectedTeacherFilter !== 'all' ? selectedTeacherFilter : undefined;

      const ok = exportActiveViewToWord({
        viewMode: mode,
        selectedClassId: targetClass,
        selectedTeacherId: targetTeacher,
        slots,
        teachers,
        classes,
        days: DAYS,
        hoursPerDay,
        tableName,
        customFileName: customFileName.trim() || undefined
      });

      if (ok) {
        setSaveSuccessMsg(`File Word (${customFileName}.doc) scaricato con successo! Pronto per Microsoft Word o LibreOffice.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'esportazione Word.');
    }
  };

  const handleImageExport = async () => {
    setIsExportingPdf(true);
    setSaveSuccessMsg(null);
    try {
      const targetName = customFileName.trim() || `Tabellone_${tableName}`;
      const ok = await exportElementToImage('printable-report-area', targetName, 'jpeg');
      if (ok) {
        setSaveSuccessMsg(`Immagine JPEG (${targetName}.jpg) ad alta risoluzione salvata e scaricata sul tuo computer!`);
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      } else {
        alert('Impossibile completare il salvataggio JPEG. Puoi utilizzare il tasto Stampa per esportare in PDF.');
      }
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio dell\'immagine JPEG.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSavePdfFile = async () => {
    setIsExportingPdf(true);
    setSaveSuccessMsg(null);
    try {
      const format = reportType === 'tabellone_a3' ? 'a3' : 'a4';
      const targetName = customFileName.trim() || `Tabellone_${tableName}_${reportType}`;
      const success = await exportElementToPdf('printable-report-area', targetName, format, 'landscape');
      if (success) {
        setSaveSuccessMsg(`File PDF (${targetName}.pdf) salvato e scaricato sul tuo computer con successo!`);
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      } else {
        alert('Generazione PDF completata: se il download non si avvia, usa il pulsante Stampa per salvare direttamente in PDF.');
      }
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full p-6 space-y-5 shadow-2xl my-6 print:bg-white print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              id="btn-back-print-report"
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm mr-1"
              title="Torna alla schermata precedente"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Torna Indietro</span>
            </button>
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Salva con Nome & Stampa Tabellone Orario
              </h3>
              <p className="text-xs text-slate-400">
                Salva in Word, Excel, PDF, JPEG o stampa direttamente. Classi ordinate per sezione (I A, II A, III A, I B, II B...).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSavePdfFile}
              disabled={isExportingPdf}
              id="btn-save-pdf-file"
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition cursor-pointer"
              title="Genera e scarica direttamente il file PDF (.pdf) sul tuo computer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-rose-200" />
                  <span>Salva PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleWordExport}
              id="btn-save-word-file"
              className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Salva e scarica il documento Word (.doc)"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>Salva Word (.doc)</span>
            </button>

            <button
              onClick={handleExcelExport}
              id="btn-save-excel-file"
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Scarica file Excel completo con Tabellone A3 Docenti e Classi"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Scarica Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleImageExport}
              disabled={isExportingPdf}
              id="btn-save-image-file"
              className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Salva e scarica come foto/immagine JPEG (.jpg)"
            >
              <Image className="w-4 h-4 text-purple-200" />
              <span>Salva JPEG (.jpg)</span>
            </button>

            <button
              onClick={handleTriggerPrint}
              id="btn-trigger-window-print"
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Apri finestra di stampa o salva con la stampante del browser"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer ml-1"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Salva con Nome Input Bar & Direct Download Buttons */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 space-y-3 print:hidden shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-slate-300 font-bold whitespace-nowrap flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-400" />
                Salva con Nome File:
              </span>
              <input
                type="text"
                id="input-custom-filename"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Inserisci nome file (es. Orario_Definitivo_2026)"
                className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400 text-[11px] font-semibold">(.pdf / .doc / .xlsx / .jpg)</span>
            </div>
            <div className="text-xs text-slate-400">
              Scegli il formato desiderato per scaricare subito il file:
            </div>
          </div>

          {/* Dedicated Instant Download Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 mr-1 flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Pulsanti Download:
            </span>

            <button
              onClick={handleSavePdfFile}
              disabled={isExportingPdf}
              id="btn-save-pdf-in-bar"
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition cursor-pointer"
              title="Scarica direttamente il file PDF (.pdf)"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF in corso...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-rose-200" />
                  <span>Salva PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handleExcelExport}
              id="btn-save-excel-in-bar"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title="Scarica file Excel completo (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Scarica Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleWordExport}
              id="btn-save-word-in-bar"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
              title="Scarica file Microsoft Word (.doc)"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>Salva Word (.doc)</span>
            </button>

            <button
              onClick={handleImageExport}
              disabled={isExportingPdf}
              id="btn-save-image-in-bar"
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
              title="Salva immagine JPEG (.jpg)"
            >
              <Image className="w-4 h-4 text-purple-200" />
              <span>Salva JPEG (.jpg)</span>
            </button>

            <button
              onClick={handleTriggerPrint}
              id="btn-trigger-print-in-bar"
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ml-auto"
              title="Stampa su carta o con stampante PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-900/60 border border-emerald-500/80 rounded-xl flex items-center gap-2 text-xs text-emerald-200 font-semibold shadow-lg">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Report Options Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs print:hidden">
          <button
            type="button"
            onClick={() => setReportType('tabellone_a3')}
            className={`p-2.5 rounded-lg border text-left font-medium transition cursor-pointer ${
              reportType === 'tabellone_a3'
                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="font-bold">Tabellone A3 Docenti</div>
            <div className="text-[10px] text-slate-500">Docenti A-Z & Classi</div>
          </button>

          <button
            type="button"
            onClick={() => setReportType('classes')}
            className={`p-2.5 rounded-lg border text-left font-medium transition cursor-pointer ${
              reportType === 'classes'
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-400 mb-1" />
            <div className="font-bold">Orario Classi</div>
            <div className="text-[10px] text-slate-500">I A, II A, III A, I B...</div>
          </button>

          <button
            type="button"
            onClick={() => setReportType('teachers')}
            className={`p-2.5 rounded-lg border text-left font-medium transition cursor-pointer ${
              reportType === 'teachers'
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="font-bold">Orario Docenti</div>
            <div className="text-[10px] text-slate-500">Schede individuali</div>
          </button>

          <button
            type="button"
            onClick={() => setReportType('master')}
            className={`p-2.5 rounded-lg border text-left font-medium transition cursor-pointer ${
              reportType === 'master'
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400 mb-1" />
            <div className="font-bold">Tabellone Generale Classi</div>
            <div className="text-[10px] text-slate-500">Tutte le sezioni A-Z</div>
          </button>

          <button
            type="button"
            onClick={() => setReportType('fairness')}
            className={`p-2.5 rounded-lg border text-left font-medium transition cursor-pointer ${
              reportType === 'fairness'
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4 text-purple-400 mb-1" />
            <div className="font-bold">Report Ore Buche & Equità</div>
            <div className="text-[10px] text-slate-500">Max 2 ore buche/sett</div>
          </button>
        </div>

        {/* Filters if by class or teacher */}
        <div className="flex items-center gap-3 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 print:hidden">
          <span className="text-slate-400 font-medium">Filtro visualizzazione:</span>
          {reportType === 'classes' && (
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="all">Tutte le Classi in Ordine (I A, II A, III A, I B...) ({activeClasses.length})</option>
              {activeClasses.map(c => (
                <option key={c.id} value={c.id}>Classe {c.id} (Sez. {c.section})</option>
              ))}
            </select>
          )}

          {reportType === 'teachers' && (
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="all">Tutti i Docenti ({teachers.length})</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {reportType === 'tabellone_a3' && (
            <span className="text-slate-300">
              Formato ottimizzato per stampa su foglio A3 orizzontale o salvataggio PDF.
            </span>
          )}
          {reportType === 'master' && (
            <span className="text-slate-300">
              Classi ordinate alfabeticamente: Sezione A (I A, II A, III A), Sezione B (I B, II B, III B)...
            </span>
          )}
          {reportType === 'fairness' && (
            <span className="text-slate-300">
              Verifica del vincolo: massimo 2 ore di buchi a settimana per ciascun docente.
            </span>
          )}
        </div>

        {/* Printable Paper Area */}
        <div id="printable-report-area" className="bg-white text-slate-950 p-6 rounded-xl shadow-inner max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:shadow-none print:rounded-none">
          {/* Document Header for Print */}
          <div className="border-b-2 border-slate-900 pb-3 mb-5 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                {tableName} - Orario Scolastico Ufficiale
              </h1>
              <p className="text-xs text-slate-600">
                Istituto Statale di Istruzione Secondaria • Anno Scolastico 2025/2026
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Documento generato il: {new Date().toLocaleDateString('it-IT')}</div>
              <div className="font-semibold text-slate-700">Tutte le Classi e Cattedre Assegnate</div>
            </div>
          </div>

          {/* 0. TABELLONE A3 DOCENTI (Docenti A-Z & Classi) */}
          {reportType === 'tabellone_a3' && (
            <div className="overflow-x-auto print:overflow-visible">
              <div className="mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider print:block">
                Tabellone Generale Docenti (Ordinamento A-Z) — Assegnazioni alle Classi
              </div>
              <table className="w-full text-center text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-black border-b border-slate-400">
                    <th rowSpan={2} className="p-1.5 border-r border-slate-400 text-left min-w-[130px] bg-slate-300">
                      Docente (A-Z)
                    </th>
                    <th rowSpan={2} className="p-1.5 border-r border-slate-400 text-left min-w-[80px] bg-slate-300">
                      Materie
                    </th>
                    {DAYS.slice(0, 5).map(day => (
                      <th key={day} colSpan={hoursPerDay} className="p-1 border-r border-slate-400 uppercase tracking-wider text-xs bg-slate-200">
                        {day}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                    {DAYS.slice(0, 5).map(day => (
                      <React.Fragment key={day}>
                        {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                          <th key={`${day}-${h}`} className="p-1 border-r border-slate-300 w-10 text-center font-mono">
                            {h}ª
                          </th>
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 bg-white text-slate-900">
                  {sortedTeachers.map((t, idx) => (
                    <tr key={t.id} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/80 hover:bg-slate-100'}>
                      <td className="p-1.5 font-bold border-r border-slate-300 text-left whitespace-nowrap">
                        {t.name}
                      </td>
                      <td className="p-1 text-slate-600 border-r border-slate-300 text-left text-[9px] truncate max-w-[100px]" title={t.subjects.join(', ')}>
                        {t.subjects.join(', ')}
                      </td>
                      {DAYS.slice(0, 5).map(day => (
                        <React.Fragment key={day}>
                          {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => {
                            const slot = slots.find(s => s.teacherId === t.id && s.day === day && s.hour === h);
                            return (
                              <td key={`${t.id}-${day}-${h}`} className="p-1 border-r border-slate-200 text-center align-middle">
                                {slot ? (
                                  <div className="leading-tight">
                                    <span className="font-extrabold text-indigo-950 text-[11px] block bg-indigo-50/90 border border-indigo-200 rounded px-1 py-0.5">
                                      {slot.classId}
                                    </span>
                                    <span className="text-[8px] text-slate-600 block truncate max-w-[45px] mx-auto">
                                      {slot.subject}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 1. REPORT ORARIO CLASSI (In ordine: I A, II A, III A, I B, II B, III B...) */}
          {reportType === 'classes' && (
            <div className="space-y-6">
              {activeClasses
                .filter(c => selectedClassFilter === 'all' || c.id === selectedClassFilter)
                .map(cls => (
                  <div key={cls.id} className="border border-slate-400 rounded-lg overflow-hidden page-break-after">
                    <div className="bg-slate-100 p-2.5 font-bold text-slate-900 flex justify-between text-xs border-b border-slate-400">
                      <span className="text-sm">CLASSE {cls.id} (Sezione {cls.section})</span>
                      <span className="text-slate-600 font-normal">Orario Settimanale Lezioni</span>
                    </div>
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-700">
                          <th className="p-2 border-r border-slate-300 w-16 text-left">Ora</th>
                          {DAYS.map(d => (
                            <th key={d} className="p-2 border-r border-slate-300">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                          <tr key={h} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-300 font-bold bg-slate-50 text-left">
                              {h}ª Ora
                            </td>
                            {DAYS.map(d => {
                              const slot = slots.find(s => s.classId === cls.id && s.day === d && s.hour === h);
                              const t = slot ? teacherMap.get(slot.teacherId) : null;
                              return (
                                <td key={d} className="p-1.5 border-r border-slate-300 text-left align-top">
                                  {slot ? (
                                    <div className="p-1 rounded bg-slate-50 border border-slate-200">
                                      <div className="font-bold text-slate-900 text-[11px]">{slot.subject}</div>
                                      <div className="text-[10px] text-slate-600">{t?.name || 'Docente'}</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 block text-center">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          )}

          {/* 2. REPORT ORARIO DOCENTI */}
          {reportType === 'teachers' && (
            <div className="space-y-6">
              {teachers
                .filter(t => selectedTeacherFilter === 'all' || t.id === selectedTeacherFilter)
                .map(t => {
                  const teacherSlots = slots.filter(s => s.teacherId === t.id && s.hour <= hoursPerDay);
                  return (
                    <div key={t.id} className="border border-slate-400 rounded-lg overflow-hidden page-break-after">
                      <div className="bg-slate-100 p-2.5 font-bold text-slate-900 flex justify-between text-xs border-b border-slate-400">
                        <span className="text-sm">DOCENTE: {t.name}</span>
                        <span className="text-slate-600 font-normal">
                          {teacherSlots.length} ore assegnate / {t.maxHoursPerWeek}h • Materie: {t.subjects.join(', ')}
                        </span>
                      </div>
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-700">
                            <th className="p-2 border-r border-slate-300 w-16 text-left">Ora</th>
                            {DAYS.map(d => (
                              <th key={d} className="p-2 border-r border-slate-300">{d}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                            <tr key={h} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-300 font-bold bg-slate-50 text-left">
                                {h}ª Ora
                              </td>
                              {DAYS.map(d => {
                                const slot = slots.find(s => s.teacherId === t.id && s.day === d && s.hour === h);
                                return (
                                  <td key={d} className="p-1.5 border-r border-slate-300 text-left align-top">
                                    {slot ? (
                                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                                        <div className="font-bold text-slate-900 text-[11px]">Classe {slot.classId}</div>
                                        <div className="text-slate-600 text-[10px]">{slot.subject}</div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 text-center block">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 3. MASTER GENERAL TABLE (Classi in ordine alfabetico: I A, II A, III A, I B, II B, III B...) */}
          {reportType === 'master' && (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-center text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="p-1 border-r border-slate-400">Classe</th>
                    <th className="p-1 border-r border-slate-400">Giorno</th>
                    {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                      <th key={h} className="p-1 border-r border-slate-400">{h}ª Ora</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {activeClasses.map(cls => (
                    <React.Fragment key={cls.id}>
                      {DAYS.slice(0, 5).map((day, dIdx) => (
                        <tr key={`${cls.id}-${day}`}>
                          {dIdx === 0 && (
                            <td rowSpan={5} className="p-1 font-bold border-r border-slate-400 align-middle bg-slate-50">
                              {cls.id}
                            </td>
                          )}
                          <td className="p-1 font-semibold border-r border-slate-300 text-left">{day}</td>
                          {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => {
                            const slot = slots.find(s => s.classId === cls.id && s.day === day && s.hour === h);
                            const t = slot ? teacherMap.get(slot.teacherId) : null;
                            return (
                              <td key={h} className="p-1 border-r border-slate-200 text-left truncate max-w-[90px]">
                                {slot ? `${slot.subject} (${t?.name.split(' ').pop()})` : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. FAIRNESS REPORT (Verifica max 2 ore buche) */}
          {reportType === 'fairness' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Verifica Indice di Equità Cattedre e Ore Buche Settimanali
                  </h3>
                  <p className="text-xs text-slate-500">
                    Regola d'istituto applicata: massimo 2 ore buche settimanali consentite per ciascun docente.
                  </p>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="p-2">Docente</th>
                    <th className="p-2">Ore Assegnate</th>
                    <th className="p-2">Max Ore</th>
                    <th className="p-2">Ore Buche Settimanali (Max 2h)</th>
                    <th className="p-2">Stato Conformità</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {sortedTeachers.map(t => {
                    const assigned = slots.filter(s => s.teacherId === t.id && s.hour <= hoursPerDay).length;

                    // Calculate weekly gaps
                    let gapsCount = 0;
                    DAYS.forEach(day => {
                      const daySlots = slots
                        .filter(s => s.teacherId === t.id && s.day === day && s.hour <= hoursPerDay)
                        .sort((a, b) => a.hour - b.hour);
                      if (daySlots.length > 1) {
                        const minH = daySlots[0].hour;
                        const maxH = daySlots[daySlots.length - 1].hour;
                        const span = maxH - minH + 1;
                        gapsCount += (span - daySlots.length);
                      }
                    });

                    const isConforming = gapsCount <= 2;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{t.name}</td>
                        <td className="p-2">{assigned} ore</td>
                        <td className="p-2">{t.maxHoursPerWeek} ore</td>
                        <td className="p-2 font-semibold">
                          <span className={isConforming ? 'text-emerald-700' : 'text-rose-700 font-bold'}>
                            {gapsCount} {gapsCount === 1 ? 'ora buca' : 'ore buche'}
                          </span>
                        </td>
                        <td className="p-2">
                          {isConforming ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> Conforme (≤ 2h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" /> Supera limite ({gapsCount}h &gt; 2h)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-2 print:hidden text-xs text-slate-400">
          <div>
            Suggerimento: puoi anche salvare in Word, Excel, PDF o Immagine JPEG usando i pulsanti in alto.
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Torna Indietro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
