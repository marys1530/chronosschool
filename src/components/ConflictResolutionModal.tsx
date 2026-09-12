import React, { useState, useMemo } from 'react';
import {
  Wand2, X, Check, AlertTriangle, Car, Clock,
  Sparkles, Scale, Zap, BookOpen, Calendar, ArrowLeft,
  User, School, Filter, CheckCircle2
} from 'lucide-react';
import { ConflictIssue, ResolutionOption, ScheduleSlot, Teacher, SchoolClass, DayOfWeek } from '../types';
import { DAYS } from '../data/defaultData';
import { resolveAllConflictsAutomatically, generateResolutionOptions } from '../utils/solver';
import { sortClassesAlphabetically } from './PrintReportModal';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictIssue[];
  options: ResolutionOption[];
  onApplyOption: (selectedOption: ResolutionOption) => void;
  teachers: Teacher[];
  classes?: SchoolClass[];
  hoursPerDay?: number;
  currentSlots?: ScheduleSlot[];
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  options,
  onApplyOption,
  teachers,
  classes = [],
  hoursPerDay = 6,
  currentSlots = []
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(options[0]?.id || 'opt-fairness');
  const [previewMode, setPreviewMode] = useState<'class' | 'teacher'>('class');
  
  const sortedClasses = useMemo(() => {
    return sortClassesAlphabetically(classes.filter(c => c.isActive !== false));
  }, [classes]);

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }, [teachers]);

  const [selectedClassId, setSelectedClassId] = useState<string>(sortedClasses[0]?.id || '1A');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(sortedTeachers[0]?.id || (teachers[0]?.id || ''));

  // Ensure options are robustly populated with slots
  const safeOptions = useMemo(() => {
    if (options && options.length > 0 && options.some(o => (o.proposedSlots && o.proposedSlots.length > 0) || (o.slots && o.slots.length > 0))) {
      return options;
    }
    // Fallback generate options dynamically
    return generateResolutionOptions(currentSlots, teachers, classes, hoursPerDay);
  }, [options, currentSlots, teachers, classes, hoursPerDay]);

  const currentChoice = safeOptions.find(o => o.id === selectedOptionId) || safeOptions[0];
  const proposedSlots = currentChoice?.proposedSlots || currentChoice?.slots || [];
  const teacherMap = useMemo(() => new Map<string, Teacher>(teachers.map(t => [t.id, t])), [teachers]);
  const classMap = useMemo(() => new Map<string, SchoolClass>(classes.map(c => [c.id, c])), [classes]);

  // Set of original slot keys to detect modifications: `${classId}_${teacherId}_${day}_${hour}_${subject}`
  const originalSlotKeys = useMemo(() => {
    const set = new Set<string>();
    currentSlots.forEach(s => {
      set.add(`${s.classId}_${s.teacherId}_${s.day}_${s.hour}_${s.subject}`);
    });
    return set;
  }, [currentSlots]);

  // Total modified slots count for this chosen option
  const modifiedSlotsCount = useMemo(() => {
    let count = 0;
    proposedSlots.forEach(s => {
      const key = `${s.classId}_${s.teacherId}_${s.day}_${s.hour}_${s.subject}`;
      if (!originalSlotKeys.has(key)) {
        count++;
      }
    });
    return count;
  }, [proposedSlots, originalSlotKeys]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full p-6 space-y-6 shadow-2xl my-6">
        {/* Top Header with Torna Indietro */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              id="btn-back-conflicts-top"
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm mr-1"
              title="Torna alla schermata precedente"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Torna Indietro</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Risoluzione Conflitti & Opzioni di Orario
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Anteprima con modifiche evidenziate
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scegli tra diverse opzioni risolutive. Il tabellone mostra in anteprima tutte le modifiche evidenziate con etichetta dedicata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Chiudi"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Master 1-Click Resolve Banner */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-600/30">
              <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base block flex items-center gap-2">
                Risolvi Tutto con 1 Click (Consigliato)
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  Opzione Migliore
                </span>
              </span>
              <p className="text-xs text-slate-300">
                Azzera istantaneamente le sovrapposizioni, impone il limite di max 2 buchi settimanali ed equilibra le prime e ultime ore.
              </p>
            </div>
          </div>

          <button
            id="btn-quick-auto-resolve-master"
            onClick={() => {
              const bestOpt = safeOptions[0];
              if (bestOpt) {
                onApplyOption(bestOpt);
                onClose();
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-600/30 transition transform hover:scale-[1.02] cursor-pointer"
          >
            <Zap className="w-5 h-5 text-amber-300" />
            <span>⚡ Risolvi Conflitti Subito (1-Click)</span>
          </button>
        </div>

        {/* Conflicts Alert List */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-xs">
                {conflicts.length} Conflitti e Disallineamenti Rilevati
              </span>
            </div>
            {conflicts.length === 0 ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Nessun conflitto (Orario Conforme)
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-medium">
                {conflicts.filter(c => c.severity === 'error').length} errori bloccanti da risolvere
              </span>
            )}
          </div>

          {conflicts.length > 0 && (
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {conflicts.map(c => (
                <div
                  key={c.id}
                  className={`p-2 rounded flex items-center justify-between border ${
                    c.severity === 'error'
                      ? 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {c.type === 'carpool_mismatch' ? (
                      <Car className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span><strong>{c.title}:</strong> {c.description}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                    {c.day} {c.hour}ª
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4 Solution Options Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Scegli la Strategia di Risoluzione Desiderata:
            </h4>
            <span className="text-xs text-slate-400">
              Clicca su una carta per aggiornare l'anteprima sottostante
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {safeOptions.map(opt => {
              const isSelected = selectedOptionId === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400'
                      : 'bg-slate-900/70 border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                      <Check className="w-4 h-4 font-bold" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs leading-snug pr-6">{opt.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{opt.subtitle}</p>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                      <div className="bg-slate-800/90 p-1.5 rounded-lg border border-slate-700 text-center">
                        <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                          <Scale className="w-2.5 h-2.5 text-indigo-400" /> Equità
                        </div>
                        <div className="font-extrabold text-emerald-400 text-sm">{opt.fairnessScore}%</div>
                      </div>

                      <div className="bg-slate-800/90 p-1.5 rounded-lg border border-slate-700 text-center">
                        <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                          <Car className="w-2.5 h-2.5 text-sky-400" /> Auto
                        </div>
                        <div className="font-extrabold text-sky-400 text-sm">{opt.carpoolScore}%</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-300 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Buchi stimati: <strong className="text-white">{opt.gapHoursTotal} ore</strong></span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyOption(opt);
                        onClose();
                      }}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Scegli & Applica Questa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABELLONE ANTEPRIMA CON MODIFICHE EVIDENZIATE (User Explicit Requirement) */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="font-bold text-white text-sm block">
                  Anteprima Tabellone: <span className="text-indigo-300">{currentChoice.title}</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {modifiedSlotsCount > 0 ? `${modifiedSlotsCount} modifiche/ottimizzazioni apportate (evidenziate in giallo/ambra)` : 'Nessuna modifica necessaria, orario già allineato'}
                </span>
              </div>
            </div>

            {/* View Selector: by Class or by Teacher */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('class')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewMode === 'class' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Per Classe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('teacher')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewMode === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Per Docente</span>
                </button>
              </div>

              {previewMode === 'class' ? (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
                >
                  {sortedClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      Classe {c.id} (Sez. {c.section})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 max-w-xs"
                >
                  {sortedTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subjects[0] || 'Docente'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Timetable Matrix with HIGHLIGHTED MODIFICATIONS */}
          <div className="overflow-x-auto max-h-72 rounded-lg border border-slate-800">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                  <th className="p-2 w-14 text-left">Ora</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-2 min-w-[130px] text-slate-200">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => (
                  <tr key={h} className="hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-slate-400 text-left bg-slate-950/50">
                      {h}ª Ora
                    </td>
                    {DAYS.map(day => {
                      let slot: ScheduleSlot | undefined;
                      if (previewMode === 'class') {
                        slot = proposedSlots.find(
                          s => s.classId === selectedClassId && s.day === day && s.hour === h
                        );
                      } else {
                        slot = proposedSlots.find(
                          s => s.teacherId === selectedTeacherId && s.day === day && s.hour === h
                        );
                      }

                      const teacher = slot ? teacherMap.get(slot.teacherId) : null;
                      const isModified = slot ? !originalSlotKeys.has(`${slot.classId}_${slot.teacherId}_${slot.day}_${slot.hour}_${slot.subject}`) : false;

                      return (
                        <td key={day} className="p-1">
                          {slot ? (
                            <div
                              className={`p-2 rounded-lg text-left transition border ${
                                isModified
                                  ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400/60 text-amber-100 shadow-md'
                                  : 'bg-indigo-950/40 border-indigo-500/30 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-white text-[11px] truncate">
                                  {slot.subject}
                                </span>
                                {isModified && (
                                  <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-amber-500 text-slate-950 uppercase tracking-tight shrink-0 shadow">
                                    ★ MODIFICATA
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-300 truncate mt-0.5">
                                {previewMode === 'class' ? (teacher?.name || 'Docente') : `Classe ${slot.classId}`}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 text-[11px] text-slate-600 font-mono">-</div>
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

        {/* Footer Actions with Torna Indietro */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            id="btn-back-conflicts-bottom"
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Torna Indietro</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              id="btn-confirm-apply-solution"
              type="button"
              onClick={() => {
                if (currentChoice) {
                  onApplyOption(currentChoice);
                  onClose();
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Applica Questa Opzione al Tabellone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
