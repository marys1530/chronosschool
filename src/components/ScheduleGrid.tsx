import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, User, BookOpen, Clock, AlertTriangle, Car, Lock,
  Unlock, Check, Edit2, Plus, Trash2, X, Filter, ArrowLeftRight, GripVertical,
  LayoutGrid, Search, Download, FileSpreadsheet, FileText, Image, Printer, Loader2
} from 'lucide-react';
import { ScheduleSlot, Teacher, SchoolClass, DayOfWeek, ConflictIssue } from '../types';
import { DAYS, ALL_SCHOOL_SUBJECTS } from '../data/defaultData';
import {
  exportActiveViewToExcel,
  exportActiveViewToWord,
  exportElementToPdf,
  exportElementToImage
} from '../utils/exportUtils';

interface ScheduleGridProps {
  slots: ScheduleSlot[];
  teachers: Teacher[];
  classes: SchoolClass[];
  hoursPerDay: number;
  conflicts: ConflictIssue[];
  tableName?: string;
  onUpdateSlot: (updatedSlot: ScheduleSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onAddSlot: (newSlot: ScheduleSlot) => void;
  onSwapSlots?: (slotAId: string, slotBId: string) => void;
  onMoveSlot?: (slotId: string, targetDay: DayOfWeek, targetHour: number) => void;
  onViewChange?: (viewMode: 'master_teachers' | 'by_class' | 'by_teacher' | 'master', classId: string, teacherId: string) => void;
  onOpenPrintModal?: () => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  slots,
  teachers,
  classes,
  hoursPerDay,
  conflicts,
  tableName,
  onUpdateSlot,
  onDeleteSlot,
  onAddSlot,
  onSwapSlots,
  onMoveSlot,
  onViewChange,
  onOpenPrintModal
}) => {
  const activeClasses = classes.filter(c => c.isActive);
  // Default first view is the generic schedule of all teachers in alphabetical order (Tabellone Docenti A-Z)
  const [viewMode, setViewMode] = useState<'master_teachers' | 'by_class' | 'by_teacher' | 'master'>('master_teachers');
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClasses[0]?.id || '1A');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || 't1');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [editingCell, setEditingCell] = useState<{ day: DayOfWeek; hour: number; slot?: ScheduleSlot; teacherId?: string; classId?: string } | null>(null);

  // Drag & Drop and Swap states
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [selectedSwapSlotId, setSelectedSwapSlotId] = useState<string | null>(null);

  // Form states for cell editing (allows free manual typing/editing)
  const [editSubject, setEditSubject] = useState('Italiano');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editClassId, setEditClassId] = useState('');

  const teacherMap = new Map<string, Teacher>(teachers.map(t => [t.id, t]));
  const classMap = new Map<string, SchoolClass>(classes.map(c => [c.id, c]));

  // Sorted teachers A-Z
  const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const filteredMasterTeachers = sortedTeachers.filter(t =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(teacherSearch.toLowerCase()))
  );

  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Notify parent component about active view context
  useEffect(() => {
    if (onViewChange) {
      onViewChange(viewMode, selectedClassId, selectedTeacherId);
    }
  }, [viewMode, selectedClassId, selectedTeacherId, onViewChange]);

  const getActiveViewLabel = () => {
    if (viewMode === 'by_class') return `Orario Classe ${selectedClassId}`;
    if (viewMode === 'by_teacher') {
      const t = teacherMap.get(selectedTeacherId);
      return `Orario Docente ${t ? t.name : ''}`;
    }
    if (viewMode === 'master_teachers') return 'Tabellone Docenti (A-Z)';
    return 'Tabellone Classi';
  };

  const handleExportActiveExcel = () => {
    const cleanTableName = tableName || 'Orario_Scolastico';
    const ok = exportActiveViewToExcel({
      viewMode,
      selectedClassId,
      selectedTeacherId,
      slots,
      teachers,
      classes,
      days: DAYS,
      hoursPerDay,
      tableName: cleanTableName
    });
    if (ok) {
      setExportNotice(`${getActiveViewLabel()} salvato in formato Excel (.xlsx)! Download completato.`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  const handleExportActiveWord = () => {
    const cleanTableName = tableName || 'Orario_Scolastico';
    const ok = exportActiveViewToWord({
      viewMode,
      selectedClassId,
      selectedTeacherId,
      slots,
      teachers,
      classes,
      days: DAYS,
      hoursPerDay,
      tableName: cleanTableName
    });
    if (ok) {
      setExportNotice(`${getActiveViewLabel()} salvato in formato Word (.doc)! Pronto per l'apertura.`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  const handleExportActivePdf = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const targetId = viewMode === 'by_class' ? 'schedule-grid-by-class' :
                       viewMode === 'by_teacher' ? 'schedule-grid-by-teacher' :
                       viewMode === 'master_teachers' ? 'schedule-grid-master-teachers' : 'schedule-grid-master-classes';
      const cleanName = getActiveViewLabel().replace(/\s+/g, '_');
      const format = viewMode === 'master_teachers' || viewMode === 'master' ? 'a3' : 'a4';
      const ok = await exportElementToPdf(targetId, cleanName, format, 'landscape');
      if (ok) {
        setExportNotice(`${getActiveViewLabel()} salvato e scaricato in PDF (.pdf)!`);
        setTimeout(() => setExportNotice(null), 4500);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportActiveImage = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const targetId = viewMode === 'by_class' ? 'schedule-grid-by-class' :
                       viewMode === 'by_teacher' ? 'schedule-grid-by-teacher' :
                       viewMode === 'master_teachers' ? 'schedule-grid-master-teachers' : 'schedule-grid-master-classes';
      const cleanName = getActiveViewLabel().replace(/\s+/g, '_');
      const ok = await exportElementToImage(targetId, cleanName, 'jpeg');
      if (ok) {
        setExportNotice(`${getActiveViewLabel()} salvato come immagine JPEG (.jpg)!`);
        setTimeout(() => setExportNotice(null), 4500);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintActive = () => {
    window.print();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, slotId: string) => {
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSlotId(slotId);
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const key = `${day}-${hour}`;
    if (dragOverKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: DayOfWeek, targetHour: number, targetSlot?: ScheduleSlot) => {
    e.preventDefault();
    setDragOverKey(null);
    const sourceId = draggedSlotId || e.dataTransfer.getData('text/plain');
    setDraggedSlotId(null);
    if (!sourceId) return;

    if (targetSlot) {
      if (targetSlot.id === sourceId) return;
      if (onSwapSlots) {
        onSwapSlots(sourceId, targetSlot.id);
      } else {
        const sourceSlot = slots.find(s => s.id === sourceId);
        if (sourceSlot) {
          onUpdateSlot({ ...sourceSlot, day: targetDay, hour: targetHour });
          onUpdateSlot({ ...targetSlot, day: sourceSlot.day, hour: sourceSlot.hour });
        }
      }
    } else {
      if (onMoveSlot) {
        onMoveSlot(sourceId, targetDay, targetHour);
      } else {
        const sourceSlot = slots.find(s => s.id === sourceId);
        if (sourceSlot) {
          onUpdateSlot({ ...sourceSlot, day: targetDay, hour: targetHour });
        }
      }
    }
  };

  // Click-to-Swap / Move handlers
  const handleSlotCardClick = (day: DayOfWeek, hour: number, slot: ScheduleSlot, e: React.MouseEvent) => {
    if (selectedSwapSlotId) {
      e.stopPropagation();
      if (selectedSwapSlotId === slot.id) {
        setSelectedSwapSlotId(null);
        return;
      }
      if (onSwapSlots) {
        onSwapSlots(selectedSwapSlotId, slot.id);
      } else {
        const sourceSlot = slots.find(s => s.id === selectedSwapSlotId);
        if (sourceSlot) {
          onUpdateSlot({ ...sourceSlot, day: slot.day, hour: slot.hour });
          onUpdateSlot({ ...slot, day: sourceSlot.day, hour: sourceSlot.hour });
        }
      }
      setSelectedSwapSlotId(null);
      return;
    }
    handleCellClick(day, hour, slot);
  };

  const handleEmptyCellClick = (day: DayOfWeek, hour: number) => {
    if (selectedSwapSlotId) {
      if (onMoveSlot) {
        onMoveSlot(selectedSwapSlotId, day, hour);
      } else {
        const sourceSlot = slots.find(s => s.id === selectedSwapSlotId);
        if (sourceSlot) {
          onUpdateSlot({ ...sourceSlot, day, hour });
        }
      }
      setSelectedSwapSlotId(null);
      return;
    }
    handleCellClick(day, hour);
  };

  const handleToggleSwapMode = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSwapSlotId === slotId) {
      setSelectedSwapSlotId(null);
    } else {
      setSelectedSwapSlotId(slotId);
    }
  };

  // Open cell editor
  const handleCellClick = (day: DayOfWeek, hour: number, existingSlot?: ScheduleSlot, contextTeacherId?: string, contextClassId?: string) => {
    setEditingCell({ day, hour, slot: existingSlot, teacherId: contextTeacherId, classId: contextClassId });
    if (existingSlot) {
      setEditSubject(existingSlot.subject);
      setEditTeacherId(existingSlot.teacherId);
      setEditClassId(existingSlot.classId);
    } else {
      setEditSubject('Italiano');
      if (contextTeacherId) {
        setEditTeacherId(contextTeacherId);
        const currentT = teacherMap.get(contextTeacherId);
        const preferredClass = currentT?.assignedClassIds && currentT.assignedClassIds.length > 0
          ? currentT.assignedClassIds[0]
          : (activeClasses[0]?.id || '1A');
        setEditClassId(contextClassId || preferredClass);
      } else if (contextClassId) {
        setEditClassId(contextClassId);
        setEditTeacherId(teachers[0]?.id || '');
      } else if (viewMode === 'by_teacher') {
        const currentT = teacherMap.get(selectedTeacherId);
        setEditTeacherId(selectedTeacherId);
        const preferredClass = currentT?.assignedClassIds && currentT.assignedClassIds.length > 0
          ? currentT.assignedClassIds[0]
          : (activeClasses[0]?.id || '1A');
        setEditClassId(preferredClass);
      } else {
        setEditClassId(selectedClassId);
        setEditTeacherId(teachers[0]?.id || '');
      }
    }
  };

  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    const targetClassId = editClassId || editingCell.classId || (viewMode === 'by_teacher' ? editClassId : selectedClassId);
    const targetTeacherId = editTeacherId || editingCell.teacherId || (viewMode === 'by_class' ? editTeacherId : selectedTeacherId);

    if (editingCell.slot) {
      onUpdateSlot({
        ...editingCell.slot,
        subject: editSubject.trim() || 'Italiano',
        teacherId: editTeacherId || editingCell.slot.teacherId,
        classId: editClassId || editingCell.slot.classId,
      });
    } else {
      const newSlot: ScheduleSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        classId: targetClassId,
        day: editingCell.day,
        hour: editingCell.hour,
        subject: editSubject.trim() || 'Italiano',
        teacherId: targetTeacherId,
      };
      onAddSlot(newSlot);
    }

    setEditingCell(null);
  };

  // Helper to get conflict for a slot or cell
  const getSlotConflict = (slotId: string) => {
    return conflicts.find(c => c.involvedSlotIds.includes(slotId));
  };

  const activeSwapSlot = selectedSwapSlotId ? slots.find(s => s.id === selectedSwapSlotId) : null;
  const activeSwapTeacher = activeSwapSlot ? teacherMap.get(activeSwapSlot.teacherId) : null;

  return (
    <div className="space-y-4">
      {/* Swap Mode Active Banner */}
      {selectedSwapSlotId && activeSwapSlot && (
        <div className="bg-gradient-to-r from-amber-900/80 via-indigo-900/80 to-purple-900/80 border-2 border-amber-500 rounded-xl p-3.5 flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white text-sm block">
                Modalità Spostamento / Scambio Caselle Attiva
              </span>
              <span className="text-amber-200">
                Selezionata: <strong>{activeSwapSlot.subject}</strong> ({activeSwapTeacher?.name}, {activeSwapSlot.day} {activeSwapSlot.hour}ª ora).
                Clicca su un'altra casella per <strong>SCAMBIARLE</strong> o su un'ora libera per <strong>SPOSTARLA</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedSwapSlotId(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shrink-0"
          >
            Annulla Scambio
          </button>
        </div>
      )}

      {/* Top View Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary View: Tabellone Generale Docenti A-Z as explicitly requested */}
          <button
            onClick={() => setViewMode('master_teachers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'master_teachers'
                ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>Tabellone Docenti (A-Z)</span>
          </button>

          <button
            onClick={() => setViewMode('by_class')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'by_class'
                ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span>Orario per Classe</span>
          </button>

          <button
            onClick={() => setViewMode('by_teacher')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'by_teacher'
                ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-purple-300" />
            <span>Orario per Docente</span>
          </button>

          <button
            onClick={() => setViewMode('master')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'master'
                ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-amber-300" />
            <span>Tabellone Classi</span>
          </button>
        </div>

        {/* Filters according to active view */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'master_teachers' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtra docente o materia..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
                />
              </div>
              {teacherSearch && (
                <button
                  type="button"
                  onClick={() => setTeacherSearch('')}
                  className="text-xs text-slate-400 hover:text-white px-1.5 py-1 bg-slate-800 rounded border border-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {viewMode === 'by_class' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Classe:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500"
              >
                {activeClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    Classe {c.id} (Sezione {c.section})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'by_teacher' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Docente:</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subjects.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 hidden sm:flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span><strong>Trascina</strong> o clicca <strong>⇄</strong> per scambiare ore</span>
          </div>
        </div>
      </div>

      {/* Export notification notice */}
      {exportNotice && (
        <div className="p-3 bg-emerald-900/80 border border-emerald-500 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-100 font-bold shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-300 hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dedicated Quick Export Bar for the Current Active Page */}
      <div className="bg-slate-900/95 border border-indigo-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
              <span>Salva / Esporta Pagina Aperta:</span>
              <span className="text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/80 font-mono">
                {getActiveViewLabel()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Scarica immediatamente questa schermata nel formato desiderato (.xlsx, .pdf, .doc, .jpg)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportActiveExcel}
            id="btn-active-export-excel"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title={`Scarica ${getActiveViewLabel()} in formato Excel (.xlsx)`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportActivePdf}
            disabled={isExporting}
            id="btn-active-export-pdf"
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title={`Scarica ${getActiveViewLabel()} in formato PDF (.pdf)`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-rose-200" />
                <span>PDF (.pdf)</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportActiveWord}
            id="btn-active-export-word"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title={`Scarica ${getActiveViewLabel()} in formato Word (.doc)`}
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>Word (.doc)</span>
          </button>

          <button
            onClick={handleExportActiveImage}
            disabled={isExporting}
            id="btn-active-export-image"
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title={`Scarica ${getActiveViewLabel()} come immagine JPEG (.jpg)`}
          >
            <Image className="w-4 h-4 text-purple-200" />
            <span>Foto (.jpg)</span>
          </button>

          <button
            onClick={handlePrintActive}
            id="btn-active-print"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Stampa su carta o stampante PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Stampa</span>
          </button>
        </div>
      </div>

      {/* 0. VIEW TABELLONE GENERALE DOCENTI (A-Z) - PRIMA PAGINA */}
      {viewMode === 'master_teachers' && (
        <div id="schedule-grid-master-teachers" className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl active-schedule-view-container">
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Tabellone Generale Docenti (Ordinamento A-Z)</span>
                  <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {filteredMasterTeachers.length} docenti
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Orario generale con visualizzazione delle classi e materie assegnate a ogni docente. Clicca su qualsiasi casella per modificare la lezione o scambiarla.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 hidden md:flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-sm"></span>
              <span>Classe assegnata</span>
              <span className="inline-block w-2.5 h-2.5 bg-rose-600 rounded-sm ml-2"></span>
              <span>Conflitto</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/95 border-b border-slate-700 text-slate-300 font-semibold">
                  <th rowSpan={2} className="p-2.5 text-left min-w-[170px] sticky left-0 z-20 bg-slate-900 border-r border-slate-700">
                    Docente (A-Z)
                  </th>
                  <th rowSpan={2} className="p-2.5 text-left min-w-[120px] border-r border-slate-700 hidden md:table-cell">
                    Materie
                  </th>
                  <th rowSpan={2} className="p-2 text-center min-w-[70px] border-r border-slate-700" title="Ore cattedra assegnate / ore massime settimanali">
                    Cattedra
                  </th>
                  <th rowSpan={2} className="p-2 text-center min-w-[65px] border-r border-slate-700" title="Ore buche settimanali">
                    Buchi
                  </th>
                  {DAYS.map(day => (
                    <th
                      key={day}
                      colSpan={hoursPerDay}
                      className="p-2 border-r border-slate-700 bg-slate-800/80 font-bold uppercase tracking-wider text-[11px] text-slate-200"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-[11px] text-slate-400">
                  {DAYS.map(day =>
                    Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                      <th key={`${day}-${h}`} className="p-1 min-w-[70px] border-r border-slate-800 font-medium">
                        {h}ª
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredMasterTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4 + DAYS.length * hoursPerDay} className="p-8 text-center text-slate-500 italic">
                      Nessun docente trovato con i criteri di ricerca.
                    </td>
                  </tr>
                ) : (
                  filteredMasterTeachers.map(teacher => {
                    const teacherSlots = slots.filter(s => s.teacherId === teacher.id);
                    const assignedHours = teacherSlots.length;
                    const maxHours = teacher.maxHoursPerWeek || 18;

                    // Calculate gaps
                    let totalGaps = 0;
                    DAYS.forEach(day => {
                      const dayHours = teacherSlots.filter(s => s.day === day).map(s => s.hour).sort((a, b) => a - b);
                      if (dayHours.length >= 2) {
                        const minH = dayHours[0];
                        const maxH = dayHours[dayHours.length - 1];
                        const span = maxH - minH + 1;
                        totalGaps += (span - dayHours.length);
                      }
                    });

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-800/40 transition">
                        {/* Teacher Name */}
                        <td className="p-2.5 text-left sticky left-0 z-10 bg-slate-900 border-r border-slate-700">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: teacher.color || '#6366F1' }}
                            />
                            <div>
                              <div className="font-bold text-white text-xs leading-tight">{teacher.name}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                {teacher.email || 'Docente'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Subjects */}
                        <td className="p-2 text-left border-r border-slate-700 hidden md:table-cell">
                          <span className="text-[11px] text-slate-300 font-medium truncate block max-w-[130px]">
                            {teacher.subjects.join(', ')}
                          </span>
                        </td>

                        {/* Assigned Hours Badge */}
                        <td className="p-1.5 text-center border-r border-slate-700">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            assignedHours === maxHours
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : assignedHours > maxHours
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          }`}>
                            {assignedHours}/{maxHours}h
                          </span>
                        </td>

                        {/* Holes count */}
                        <td className="p-1.5 text-center border-r border-slate-700">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            totalGaps === 0
                              ? 'text-emerald-400 bg-emerald-950/40'
                              : totalGaps <= 2
                                ? 'text-indigo-300 bg-indigo-950/40'
                                : 'text-rose-300 bg-rose-950/80 border border-rose-800/80 font-black'
                          }`}>
                            {totalGaps}h
                          </span>
                        </td>

                        {/* Cells */}
                        {DAYS.map(day => {
                          const isAvailable = teacher.availability?.[day] !== undefined
                            ? teacher.availability[day]
                            : [true, true, true, true, true, true, true, true];

                          return Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => {
                            const slot = teacherSlots.find(s => s.day === day && s.hour === h);
                            const cellKey = `cell-${teacher.id}-${day}-${h}`;
                            const isDragOver = dragOverKey === cellKey;
                            const isSwapSelected = slot && selectedSwapSlotId === slot.id;
                            const conflict = slot ? getSlotConflict(slot.id) : null;
                            const availableAtHour = isAvailable[h - 1] !== false;

                            return (
                              <td
                                key={`${day}-${h}`}
                                onDragOver={(e) => handleDragOver(e, day, h)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day, h, slot)}
                                className={`p-1 min-w-[70px] border-r border-b border-slate-800 transition ${
                                  isDragOver ? 'bg-indigo-900/60 ring-2 ring-indigo-400' : ''
                                }`}
                              >
                                {slot ? (
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, slot.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleCellClick(day, h, slot, teacher.id, slot.classId)}
                                    className={`p-1.5 rounded-lg border text-left cursor-pointer transition relative group ${
                                      isSwapSelected
                                        ? 'bg-amber-950/90 border-amber-400 shadow-md ring-2 ring-amber-400 animate-pulse'
                                        : conflict
                                          ? 'bg-rose-950/90 border-rose-600 hover:border-rose-400'
                                          : 'bg-slate-900/95 border-slate-700 hover:border-indigo-400 hover:shadow-md'
                                    }`}
                                    title={`Clicca per modificare o scambiare: ${slot.subject} in Classe ${slot.classId}`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-black text-xs text-white bg-indigo-600 px-1.5 py-0.2 rounded shadow-xs">
                                        {slot.classId}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleToggleSwapMode(slot.id, e)}
                                        className={`p-0.5 rounded hover:bg-slate-700 transition ${
                                          isSwapSelected ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Scambia quest'ora con un'altra"
                                      >
                                        <ArrowLeftRight className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="text-[10px] text-slate-200 font-semibold truncate mt-0.5 leading-tight">
                                      {slot.subject}
                                    </div>

                                    {conflict && (
                                      <div className="text-[9px] text-rose-300 font-bold flex items-center gap-0.5 mt-0.5">
                                        <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                        <span className="truncate">{conflict.description}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : !availableAtHour ? (
                                  <div
                                    onClick={() => handleCellClick(day, h, undefined, teacher.id)}
                                    className="h-11 rounded bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-600 cursor-pointer hover:border-slate-700 hover:text-slate-400"
                                    title="Non disponibile (clicca per forzare assegnazione)"
                                  >
                                    <span className="text-slate-600 text-[10px]">Non disp.</span>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => handleCellClick(day, h, undefined, teacher.id)}
                                    className="h-11 rounded border border-dashed border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/20 flex items-center justify-center text-[11px] text-slate-600 hover:text-indigo-400 cursor-pointer transition"
                                    title={`Clicca per assegnare un'ora a ${teacher.name}`}
                                  >
                                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:opacity-100" />
                                  </div>
                                )}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW BY CLASS */}
      {viewMode === 'by_class' && (
        <div id="schedule-grid-by-class" className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl active-schedule-view-container">
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <h3 className="font-bold text-white text-base">
                Orario Settimanale Classe {selectedClassId}
              </h3>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Trascina con il mouse (Drag & Drop) o clicca l'icona ⇄ per scambiare le lezioni tra loro</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700 text-slate-300 font-semibold">
                  <th className="p-3 w-16 text-left">Ora</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-3 min-w-[150px] font-bold text-slate-200">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                  <tr key={h} className="hover:bg-slate-700/20">
                    <td className="p-3 font-bold text-slate-400 text-left bg-slate-900/40">
                      <div className="text-sm text-slate-200">{h}ª Ora</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {h === 1 ? '08:00 - 09:00' :
                         h === 2 ? '09:00 - 10:00' :
                         h === 3 ? '10:00 - 11:00' :
                         h === 4 ? '11:15 - 12:15' :
                         h === 5 ? '12:15 - 13:15' :
                         h === 6 ? '13:15 - 14:15' :
                         h === 7 ? '14:30 - 15:30' : '15:30 - 16:30'}
                      </div>
                    </td>

                    {DAYS.map(day => {
                      const slot = slots.find(s => s.classId === selectedClassId && s.day === day && s.hour === h);
                      const teacher = slot ? teacherMap.get(slot.teacherId) : null;
                      const conflict = slot ? getSlotConflict(slot.id) : null;
                      const hasCarpool = teacher?.carpoolGroupId;
                      const isDragged = slot && draggedSlotId === slot.id;
                      const isSwapSelected = slot && selectedSwapSlotId === slot.id;
                      const isOver = dragOverKey === `${day}-${h}`;

                      return (
                        <td
                          key={day}
                          className={`p-1.5 transition-colors ${
                            isOver ? 'bg-indigo-950/60 ring-2 ring-indigo-400' : ''
                          }`}
                          onDragOver={(e) => handleDragOver(e, day, h)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day, h, slot)}
                        >
                          {slot ? (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, slot.id)}
                              onClick={(e) => handleSlotCardClick(day, h, slot, e)}
                              className={`p-2.5 rounded-lg text-left transition cursor-move relative group border shadow-sm select-none ${
                                isSwapSelected
                                  ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400 scale-[1.02] shadow-lg'
                                  : isDragged
                                  ? 'opacity-40 border-dashed border-indigo-400'
                                  : conflict
                                  ? conflict.severity === 'error'
                                    ? 'bg-rose-950/70 border-rose-600 text-white'
                                    : 'bg-amber-950/60 border-amber-600 text-slate-100'
                                  : 'bg-slate-900/90 border-slate-700 hover:border-indigo-500 text-slate-100'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1 truncate">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                                  <span className="font-bold text-sm text-white tracking-tight truncate">
                                    {slot.subject}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {hasCarpool && (
                                    <Car className="w-3 h-3 text-sky-400" title="Docente in Carpooling (Auto Condivisa)" />
                                  )}
                                  {conflict && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" title={conflict.title} />
                                  )}
                                  {slot.isLocked && (
                                    <Lock className="w-3 h-3 text-amber-400" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleSwapMode(slot.id, e)}
                                    title={isSwapSelected ? 'Annulla selezione' : 'Scambia questa ora con un\'altra'}
                                    className={`p-1 rounded transition ${
                                      isSwapSelected
                                        ? 'bg-amber-500 text-slate-950 font-bold'
                                        : 'hover:bg-slate-800 text-slate-400 hover:text-indigo-300'
                                    }`}
                                  >
                                    <ArrowLeftRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium truncate">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: teacher?.color || '#6366F1' }}
                                />
                                <span className="truncate">{teacher?.name || 'Docente non assegnato'}</span>
                              </div>

                              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                <span className="text-[10px] text-slate-400 group-hover:text-indigo-300 transition">
                                  Trascina o clicca per modificare
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEmptyCellClick(day, h)}
                              className={`w-full h-16 rounded-lg border border-dashed text-xs flex flex-col items-center justify-center gap-1 transition ${
                                selectedSwapSlotId
                                  ? 'border-amber-400/80 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
                                  : 'border-slate-700/70 hover:border-indigo-500/80 hover:bg-slate-800/40 text-slate-500 hover:text-indigo-300'
                              }`}
                            >
                              {selectedSwapSlotId ? (
                                <>
                                  <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                                  <span className="text-[10px] font-bold text-amber-300">Sposta qui</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span className="text-[10px]">Libera</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW BY TEACHER */}
      {viewMode === 'by_teacher' && (
        <div id="schedule-grid-by-teacher" className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl active-schedule-view-container">
          {(() => {
            const currentTeacher = teacherMap.get(selectedTeacherId);
            const teacherSlots = slots.filter(s => s.teacherId === selectedTeacherId && s.hour <= hoursPerDay);
            const totalHours = teacherSlots.length;
            const isCarpool = currentTeacher?.carpoolGroupId;

            return (
              <>
                <div className="p-3.5 bg-slate-900/80 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: currentTeacher?.color || '#6366F1' }}
                    />
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        Orario Docente: {currentTeacher?.name}
                        {isCarpool && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 border border-sky-700 text-sky-300 flex items-center gap-1">
                            <Car className="w-3 h-3" /> Auto Condivisa
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-400">
                        Materie: {currentTeacher?.subjects.join(', ')} • {totalHours} di {currentTeacher?.maxHoursPerWeek} ore cattedra
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Giorno libero preferito:</span>
                    <span className="font-bold text-amber-300">{currentTeacher?.freeDayPreference || 'Nessuno'}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-700 text-slate-300 font-semibold">
                        <th className="p-3 w-16 text-left">Ora</th>
                        {DAYS.map(day => (
                          <th key={day} className="p-3 min-w-[150px] font-bold text-slate-200">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                        <tr key={h} className="hover:bg-slate-700/20">
                          <td className="p-3 font-bold text-slate-400 text-left bg-slate-900/40">
                            {h}ª Ora
                          </td>

                          {DAYS.map(day => {
                            const slot = slots.find(s => s.teacherId === selectedTeacherId && s.day === day && s.hour === h);
                            const conflict = slot ? getSlotConflict(slot.id) : null;
                            const isAvailable = currentTeacher?.availability?.[day]?.[h - 1] !== false;
                            const isDragged = slot && draggedSlotId === slot.id;
                            const isSwapSelected = slot && selectedSwapSlotId === slot.id;
                            const isOver = dragOverKey === `${day}-${h}`;

                            return (
                              <td
                                key={day}
                                className={`p-1.5 transition-colors ${
                                  isOver ? 'bg-indigo-950/60 ring-2 ring-indigo-400' : ''
                                }`}
                                onDragOver={(e) => handleDragOver(e, day, h)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day, h, slot)}
                              >
                                {slot ? (
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, slot.id)}
                                    onClick={(e) => handleSlotCardClick(day, h, slot, e)}
                                    className={`p-2.5 rounded-lg text-left transition cursor-move border shadow-sm select-none ${
                                      isSwapSelected
                                        ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400 scale-[1.02] shadow-lg'
                                        : isDragged
                                        ? 'opacity-40 border-dashed border-indigo-400'
                                        : conflict
                                        ? 'bg-rose-950/70 border-rose-600 text-white'
                                        : 'bg-slate-900/90 border-slate-700 hover:border-indigo-500 text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1">
                                        <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span className="font-bold text-sm text-indigo-300">
                                          Classe {slot.classId}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {conflict && (
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => handleToggleSwapMode(slot.id, e)}
                                          title="Scambia ora"
                                          className={`p-1 rounded transition ${
                                            isSwapSelected
                                              ? 'bg-amber-500 text-slate-950 font-bold'
                                              : 'hover:bg-slate-800 text-slate-400 hover:text-indigo-300'
                                          }`}
                                        >
                                          <ArrowLeftRight className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="font-medium text-white truncate text-xs">
                                      {slot.subject}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleEmptyCellClick(day, h)}
                                    className={`w-full h-16 rounded-lg border border-dashed flex items-center justify-center text-[11px] transition ${
                                      selectedSwapSlotId
                                        ? 'border-amber-400 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
                                        : !isAvailable
                                        ? 'bg-slate-900/30 border-slate-800 text-slate-600'
                                        : 'border-slate-800/80 text-slate-500 hover:border-indigo-500 hover:text-indigo-300'
                                    }`}
                                  >
                                    {selectedSwapSlotId ? (
                                      <span className="text-[10px] font-bold text-amber-300">Sposta qui</span>
                                    ) : !isAvailable ? (
                                      'Non disp.'
                                    ) : (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Libero</span>
                                      </div>
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* MASTER TIMETABLE GRID (All classes overview) */}
      {viewMode === 'master' && (
        <div id="schedule-grid-master-classes" className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl active-schedule-view-container">
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-white text-base">
              Tabellone Generale d'Istituto (Tutte le Classi Attive)
            </h3>
            <span className="text-xs text-slate-400">
              Visione completa delle classi per coordinatori di plesso e presidenza
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700 text-slate-300 font-semibold">
                  <th className="p-2.5 text-left bg-slate-900">Classe</th>
                  <th className="p-2.5 text-left bg-slate-900">Giorno</th>
                  {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                    <th key={h} className="p-2.5 bg-slate-900 font-bold">{h}ª Ora</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {activeClasses.map(cls => (
                  <React.Fragment key={cls.id}>
                    {DAYS.slice(0, 5).map((day, dIdx) => (
                      <tr key={`${cls.id}-${day}`} className="hover:bg-slate-700/20">
                        {dIdx === 0 && (
                          <td
                            rowSpan={5}
                            className="p-2 font-bold text-white bg-slate-900/60 border-r border-slate-700 align-middle text-sm"
                          >
                            Classe {cls.id}
                          </td>
                        )}
                        <td className="p-2 font-semibold text-slate-300 text-left border-r border-slate-800">
                          {day}
                        </td>
                        {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => {
                          const slot = slots.find(s => s.classId === cls.id && s.day === day && s.hour === h);
                          const teacher = slot ? teacherMap.get(slot.teacherId) : null;
                          const conflict = slot ? getSlotConflict(slot.id) : null;

                          return (
                            <td key={h} className="p-1 min-w-[120px]">
                              {slot ? (
                                <div
                                  onClick={() => handleCellClick(day, h, slot)}
                                  className={`p-1.5 rounded text-left cursor-pointer border ${
                                    conflict
                                      ? 'bg-rose-950/80 border-rose-600'
                                      : 'bg-slate-900/90 border-slate-700 hover:border-indigo-500'
                                  }`}
                                >
                                  <div className="font-bold text-white truncate text-[11px]">
                                    {slot.subject}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {teacher ? teacher.name.split(' ').pop() : ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
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
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                {editingCell.slot ? 'Modifica Lezione' : 'Nuova Lezione'} ({editingCell.day}, {editingCell.hour}ª Ora)
              </h3>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Nome Materia (Modificabile manualmente)</label>
                  <span className="text-[10px] text-indigo-400">Scrivi liberamente o scegli dai suggerimenti</span>
                </div>
                <input
                  type="text"
                  list="subjects-datalist"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Es. Italiano, Storia, Geografia, Lab..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 font-medium"
                  required
                />
                <datalist id="subjects-datalist">
                  {ALL_SCHOOL_SUBJECTS.map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Docente Incaricato</label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  {teachers.map(t => {
                    const isQualified = t.subjects.includes(editSubject);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} {isQualified ? '★ (Abilitato)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Classe Assegnata</label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  {activeClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      Classe {c.id} (Sez. {c.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                {editingCell.slot ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteSlot(editingCell.slot!.id);
                      setEditingCell(null);
                    }}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    <Trash2 className="w-4 h-4" /> Elimina Lezione
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                  >
                    Salva
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
