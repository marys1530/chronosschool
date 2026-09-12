import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Check, Copy, X, Edit2, Save } from 'lucide-react';
import { ClassStudyPlan, SchoolClass, Teacher, SubjectStudyPlan } from '../types';
import { ALL_SCHOOL_SUBJECTS } from '../data/defaultData';

interface StudyPlanManagerProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  studyPlans: ClassStudyPlan[];
  onUpdateStudyPlan: (plan: ClassStudyPlan) => void;
  onApplyPlanToSchedule: (classId: string) => void;
  onRenameSubjectGlobal?: (oldName: string, newName: string) => void;
}

export const StudyPlanManager: React.FC<StudyPlanManagerProps> = ({
  classes,
  teachers,
  studyPlans,
  onUpdateStudyPlan,
  onApplyPlanToSchedule,
  onRenameSubjectGlobal
}) => {
  const activeClasses = classes.filter(c => c.isActive);
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClasses[0]?.id || '1A');
  const [newSubjectName, setNewSubjectName] = useState('Italiano');
  const [newSubjectHours, setNewSubjectHours] = useState(3);
  const [newSubjectTeacher, setNewSubjectTeacher] = useState('');
  const [copyTargetClassId, setCopyTargetClassId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual Subject Name Editing State
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);
  const [editingSubjectText, setEditingSubjectText] = useState('');
  const [applyRenameGlobally, setApplyRenameGlobally] = useState(true);

  // Find or create default plan for selected class
  const currentPlan = studyPlans.find(p => p.classId === selectedClassId) || {
    classId: selectedClassId,
    subjects: []
  };

  const handleUpdateSubjectHours = (subjIndex: number, newHours: number) => {
    const updatedSubjects = [...currentPlan.subjects];
    updatedSubjects[subjIndex] = {
      ...updatedSubjects[subjIndex],
      hoursPerWeek: Math.max(1, newHours)
    };
    onUpdateStudyPlan({
      classId: selectedClassId,
      subjects: updatedSubjects
    });
  };

  const handleAddTeacherToSubject = (subjIndex: number, teacherId: string) => {
    const updatedSubjects = [...currentPlan.subjects];
    const target = updatedSubjects[subjIndex];
    const existingIds = target.teacherIds || (target.teacherId ? [target.teacherId] : []);
    if (!existingIds.includes(teacherId)) {
      const nextIds = [...existingIds, teacherId];
      updatedSubjects[subjIndex] = {
        ...target,
        teacherId: nextIds[0],
        teacherIds: nextIds
      };
      onUpdateStudyPlan({
        classId: selectedClassId,
        subjects: updatedSubjects
      });
      setStatusMessage('Docente aggiunto con successo alla materia.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleRemoveTeacherFromSubject = (subjIndex: number, teacherId: string) => {
    const updatedSubjects = [...currentPlan.subjects];
    const target = updatedSubjects[subjIndex];
    const existingIds = target.teacherIds || (target.teacherId ? [target.teacherId] : []);
    const nextIds = existingIds.filter(id => id !== teacherId);
    updatedSubjects[subjIndex] = {
      ...target,
      teacherId: nextIds[0] || undefined,
      teacherIds: nextIds
    };
    onUpdateStudyPlan({
      classId: selectedClassId,
      subjects: updatedSubjects
    });
  };

  const handleDeleteSubject = (subjIndex: number) => {
    const targetSubj = currentPlan.subjects[subjIndex]?.subject || 'Materia';
    const updatedSubjects = currentPlan.subjects.filter((_, idx) => idx !== subjIndex);
    onUpdateStudyPlan({
      classId: selectedClassId,
      subjects: updatedSubjects
    });
    setStatusMessage(`Materia "${targetSubj}" rimossa con successo dal piano.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveSubjectName = (subjIndex: number) => {
    const cleanNewName = editingSubjectText.trim();
    if (!cleanNewName) return;

    const oldName = currentPlan.subjects[subjIndex]?.subject;
    if (oldName === cleanNewName) {
      setEditingSubjectIndex(null);
      return;
    }

    const updatedSubjects = [...currentPlan.subjects];
    updatedSubjects[subjIndex] = {
      ...updatedSubjects[subjIndex],
      subject: cleanNewName
    };

    onUpdateStudyPlan({
      classId: selectedClassId,
      subjects: updatedSubjects
    });

    if (applyRenameGlobally && onRenameSubjectGlobal && oldName) {
      onRenameSubjectGlobal(oldName, cleanNewName);
      setStatusMessage(`Materia rinominata in "${cleanNewName}" sia nel piano che nel tabellone orari.`);
    } else {
      setStatusMessage(`Materia rinominata in "${cleanNewName}" per la classe ${selectedClassId}.`);
    }

    setEditingSubjectIndex(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();

    const existingIdx = currentPlan.subjects.findIndex(s => s.subject === newSubjectName);

    if (existingIdx >= 0) {
      // If subject already in plan, assign the selected teacher to it
      if (newSubjectTeacher) {
        handleAddTeacherToSubject(existingIdx, newSubjectTeacher);
        setStatusMessage(`Docente assegnato alla materia "${newSubjectName}" per la classe ${selectedClassId}.`);
      } else {
        // Increment hours or add distinct module
        const moduleName = `${newSubjectName} (Cattedra 2)`;
        const newEntry: SubjectStudyPlan = {
          subject: moduleName,
          hoursPerWeek: Number(newSubjectHours),
          teacherId: newSubjectTeacher || undefined,
          teacherIds: newSubjectTeacher ? [newSubjectTeacher] : []
        };
        onUpdateStudyPlan({
          classId: selectedClassId,
          subjects: [...currentPlan.subjects, newEntry]
        });
        setStatusMessage(`Aggiunto modulo "${moduleName}" alla classe ${selectedClassId}.`);
      }
    } else {
      const newEntry: SubjectStudyPlan = {
        subject: newSubjectName,
        hoursPerWeek: Number(newSubjectHours),
        teacherId: newSubjectTeacher || undefined,
        teacherIds: newSubjectTeacher ? [newSubjectTeacher] : []
      };

      onUpdateStudyPlan({
        classId: selectedClassId,
        subjects: [...currentPlan.subjects, newEntry]
      });

      setStatusMessage(`Materia "${newSubjectName}" aggiunta al piano per la classe ${selectedClassId}.`);
    }

    setNewSubjectHours(3);
    setNewSubjectTeacher('');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCopyPlanToClass = () => {
    if (!copyTargetClassId || copyTargetClassId === selectedClassId) return;
    const clonedSubjects: SubjectStudyPlan[] = JSON.parse(JSON.stringify(currentPlan.subjects));
    onUpdateStudyPlan({
      classId: copyTargetClassId,
      subjects: clonedSubjects
    });
    setStatusMessage(`Piano di studio copiato con successo dalla classe ${selectedClassId} alla classe ${copyTargetClassId}.`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const totalWeeklyHours = currentPlan.subjects.reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const totalAnnualHours = totalWeeklyHours * 33; // 33 weeks school year

  const teacherMap = new Map(teachers.map(t => [t.id, t]));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Piani di Studio & Assegnazione Docenti
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Configura le ore per ciascuna materia e assegna uno o più docenti incaricati (es. per Italiano con cattedre ripartite).
          </p>
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-semibold">Classe:</label>
          <select
            id="select-study-plan-class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-900 border border-indigo-500/50 text-indigo-200 font-bold rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {activeClasses.map(c => (
              <option key={c.id} value={c.id}>
                Classe {c.id} ({c.year === 1 ? 'I' : c.year === 2 ? 'II' : 'III'} {c.section})
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Study Plan Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-900/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>Piano di Studi — Classe {selectedClassId}</span>
              <span className="text-xs font-normal text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
                {totalWeeklyHours} ore settimanali • {totalAnnualHours} ore annue
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Puoi assegnare più docenti alla stessa materia utilizzando il menu rapido (+ Assegna Docente).
            </p>
          </div>

          {/* Quick Copy */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Copia piano in:</span>
            <select
              value={copyTargetClassId}
              onChange={(e) => setCopyTargetClassId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="">Seleziona classe...</option>
              {activeClasses.filter(c => c.id !== selectedClassId).map(c => (
                <option key={c.id} value={c.id}>Classe {c.id}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCopyPlanToClass}
              disabled={!copyTargetClassId}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copia</span>
            </button>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                <th className="p-3">Materia</th>
                <th className="p-3 text-center w-28">Ore Settimanali</th>
                <th className="p-3 text-center w-28">Monte Ore Annuo</th>
                <th className="p-3">Docenti Incaricati (Supporto Più Docenti es. Italiano)</th>
                <th className="p-3 text-right w-16">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {currentPlan.subjects.map((item, idx) => {
                const assignedTeacherIds = item.teacherIds && item.teacherIds.length > 0
                  ? item.teacherIds
                  : (item.teacherId ? [item.teacherId] : []);
                const assignedTeachers = assignedTeacherIds
                  .map(id => teacherMap.get(id))
                  .filter((t): t is Teacher => Boolean(t));

                return (
                  <tr key={`${item.subject}-${idx}`} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-semibold text-white">
                      {editingSubjectIndex === idx ? (
                        <div className="space-y-1.5 min-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingSubjectText}
                              onChange={(e) => setEditingSubjectText(e.target.value)}
                              className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400 font-bold flex-1"
                              placeholder="Nuovo nome materia..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSubjectName(idx);
                                if (e.key === 'Escape') setEditingSubjectIndex(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSubjectName(idx)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                              title="Salva nuovo nome"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubjectIndex(null)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition cursor-pointer"
                              title="Annulla"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={applyRenameGlobally}
                              onChange={(e) => setApplyRenameGlobally(e.target.checked)}
                              className="rounded border-slate-700 text-indigo-600"
                            />
                            <span>Rinomina anche nelle lezioni orario e docenti abilitati</span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                          <span className="text-sm">{item.subject}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubjectIndex(idx);
                              setEditingSubjectText(item.subject);
                              setApplyRenameGlobally(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-300 opacity-60 group-hover:opacity-100 hover:bg-slate-700 transition cursor-pointer ml-1"
                            title="Modifica manualmente il nome di questa materia"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Editable Hours Per Week */}
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={item.hoursPerWeek}
                          onChange={(e) => handleUpdateSubjectHours(idx, Number(e.target.value))}
                          className="w-10 bg-transparent text-center font-bold text-indigo-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                        />
                        <span className="text-slate-400 text-[11px]">h/sett</span>
                      </div>
                    </td>

                    {/* Annual Hours Calculation */}
                    <td className="p-3 text-center">
                      <span className="font-semibold text-amber-300 text-xs">
                        {item.hoursPerWeek * 33} h/anno
                      </span>
                    </td>

                    {/* Assigned Teachers: allows multiple! */}
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {assignedTeachers.map(t => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/90 border border-indigo-700/70 text-indigo-200 text-xs font-semibold shadow-xs"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#6366f1' }} />
                            <span>{t.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeacherFromSubject(idx, t.id)}
                              className="text-slate-400 hover:text-rose-400 transition ml-0.5 cursor-pointer"
                              title={`Rimuovi ${t.name} da questa materia`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}

                        {/* Add another teacher selector */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddTeacherToSubject(idx, e.target.value);
                            }
                          }}
                          className="bg-slate-900 border border-dashed border-indigo-500/70 text-indigo-300 hover:text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="">+ Assegna Docente...</option>
                          {teachers
                            .filter(t => !assignedTeacherIds.includes(t.id))
                            .map(t => {
                              const isQualified = t.subjects.includes(item.subject);
                              return (
                                <option key={t.id} value={t.id}>
                                  {t.name} {isQualified ? '★ (Abilitato)' : `(${t.subjects.slice(0, 2).join(', ')})`}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    </td>

                    {/* Delete Subject */}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition cursor-pointer"
                        title="Rimuovi materia dal piano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {currentPlan.subjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                    Nessuna materia ancora definita per la classe {selectedClassId}. Usa il modulo sottostante per inserire materie e docenti.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Subject to Class Bar */}
        <form onSubmit={handleAddSubject} className="p-3 bg-slate-900/80 border-t border-slate-700 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-semibold">+ Materia:</span>
            <input
              type="text"
              list="studyplan-subjects-suggest"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Nome materia..."
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 focus:outline-none font-medium w-40 sm:w-48"
              required
            />
            <datalist id="studyplan-subjects-suggest">
              {ALL_SCHOOL_SUBJECTS.map(subj => (
                <option key={subj} value={subj} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-medium">Ore/sett:</span>
            <input
              type="number"
              min={1}
              max={12}
              value={newSubjectHours}
              onChange={(e) => setNewSubjectHours(Number(e.target.value))}
              className="w-12 bg-slate-800 border border-slate-700 text-slate-100 rounded px-2 py-1.5 text-center font-bold"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-medium">Docente Incaricato:</span>
            <select
              value={newSubjectTeacher}
              onChange={(e) => setNewSubjectTeacher(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none max-w-xs font-medium"
            >
              <option value="">Seleziona docente...</option>
              {teachers.map(t => {
                const isQualified = t.subjects.includes(newSubjectName);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} {isQualified ? '★' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            id="btn-insert-into-plan"
            className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Inserisci nel Piano</span>
          </button>
        </form>
      </div>
    </div>
  );
};
