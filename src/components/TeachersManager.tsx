import React, { useState } from 'react';
import {
  Users, UserPlus, Trash2, Edit3, Car, Clock, CheckSquare, Square,
  Check, X, ShieldAlert, Sparkles, Filter, Mail, Phone, Calendar,
  FileSpreadsheet, Plus
} from 'lucide-react';
import { Teacher, DayOfWeek, SchoolClass } from '../types';
import { ALL_SCHOOL_SUBJECTS, DAYS } from '../data/defaultData';

interface TeachersManagerProps {
  teachers: Teacher[];
  classes?: SchoolClass[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onBulkDeleteTeachers: (teacherIds: string[]) => void;
  onDeleteAllTeachers: () => void;
  onOpenConflictResolution: () => void;
  onOpenImportModal: () => void;
}

export const TeachersManager: React.FC<TeachersManagerProps> = ({
  teachers,
  classes = [],
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onBulkDeleteTeachers,
  onDeleteAllTeachers,
  onOpenConflictResolution,
  onOpenImportModal
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [carpoolOnlyFilter, setCarpoolOnlyFilter] = useState(false);
  const [availabilityModalTeacher, setAvailabilityModalTeacher] = useState<Teacher | null>(null);
  const [assigningClassesTeacher, setAssigningClassesTeacher] = useState<Teacher | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // New Teacher form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSelectedSubjects, setNewSelectedSubjects] = useState<string[]>(['Italiano']);
  const [newAssignedClasses, setNewAssignedClasses] = useState<string[]>([]);
  const [newMaxHoursWeek, setNewMaxHoursWeek] = useState(18);
  const [newMaxHoursDay, setNewMaxHoursDay] = useState(4);
  const [newMaxGapHours, setNewMaxGapHours] = useState(2);
  const [newFreeDay, setNewFreeDay] = useState<DayOfWeek>('Sabato');
  const [newCarpoolEnabled, setNewCarpoolEnabled] = useState(false);
  const [newCarpoolPartnerId, setNewCarpoolPartnerId] = useState('');

  // Filtering
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter || t.subjects.includes(subjectFilter);
    const matchesCarpool = !carpoolOnlyFilter || (t.carpoolWithTeacherIds && t.carpoolWithTeacherIds.length > 0);
    return matchesSearch && matchesSubject && matchesCarpool;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTeachers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTeachers.map(t => t.id));
    }
  };

  const handleSaveNewTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const defaultAvail: Record<string, boolean[]> = {};
    DAYS.forEach(d => {
      defaultAvail[d] = [true, true, true, true, true, true, true, true];
    });

    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@scuola.it`,
      phone: newPhone.trim(),
      subjects: newSelectedSubjects.length > 0 ? newSelectedSubjects : ['Italiano'],
      assignedClassIds: newAssignedClasses,
      maxHoursPerWeek: Number(newMaxHoursWeek),
      maxHoursPerDay: Number(newMaxHoursDay),
      maxGapHours: Number(newMaxGapHours),
      freeDayPreference: newFreeDay,
      carpoolGroupId: newCarpoolEnabled ? `carpool-${Date.now()}` : undefined,
      carpoolWithTeacherIds: newCarpoolEnabled && newCarpoolPartnerId ? [newCarpoolPartnerId] : [],
      availability: defaultAvail,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    };

    // If carpool partner chosen, reciprocally link
    if (newCarpoolEnabled && newCarpoolPartnerId) {
      const partner = teachers.find(t => t.id === newCarpoolPartnerId);
      if (partner) {
        onUpdateTeacher({
          ...partner,
          carpoolGroupId: newTeacher.carpoolGroupId,
          carpoolWithTeacherIds: Array.from(new Set([...(partner.carpoolWithTeacherIds || []), newTeacher.id]))
        });
      }
    }

    onAddTeacher(newTeacher);
    setIsCreating(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewSelectedSubjects(['Italiano']);
    setNewAssignedClasses([]);
  };

  const handleUpdateAvailabilityCell = (day: string, hourIndex: number) => {
    if (!availabilityModalTeacher) return;
    const current = availabilityModalTeacher.availability[day] || [true, true, true, true, true, true, true, true];
    const updatedDay = [...current];
    updatedDay[hourIndex] = !updatedDay[hourIndex];

    const updatedTeacher = {
      ...availabilityModalTeacher,
      availability: {
        ...availabilityModalTeacher.availability,
        [day]: updatedDay
      }
    };
    setAvailabilityModalTeacher(updatedTeacher);
    onUpdateTeacher(updatedTeacher);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Controls */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Organico Docenti & Cattedre ({teachers.length} Docenti)
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestisci anagrafica, materie di insegnamento, disponibilità oraria e carpooling (auto condivisa).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import Teachers Button */}
          <button
            id="btn-import-teachers"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition"
            title="Importa da file Excel (.xlsx), CSV, Word, PDF o incolla testo con classi, ore, carpooling"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importa Docenti (Excel/Word/PDF)</span>
          </button>

          {/* Add Teacher Button */}
          <button
            id="btn-add-teacher"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuovo Docente</span>
          </button>

          {/* Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button
              id="btn-bulk-delete-teachers"
              onClick={() => {
                onBulkDeleteTeachers(selectedIds);
                setSelectedIds([]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md animate-pulse transition"
              title="Elimina tutti i docenti selezionati"
            >
              <Trash2 className="w-4 h-4" />
              <span>Elimina Selezionati ({selectedIds.length})</span>
            </button>
          )}

          {/* Delete All (Elimina masse docenti) */}
          <button
            id="btn-delete-all-teachers"
            onClick={() => setShowDeleteAllConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold transition"
            title="Elimina tutti i docenti in massa"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Elimina Masse Docenti</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Delete All */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-rose-500/50 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-7 h-7" />
              <h3 className="text-lg font-bold text-white">Conferma Eliminazione di Massa</h3>
            </div>
            <p className="text-sm text-slate-300">
              Sei sicuro di voler eliminare l'intero organico di <strong>{teachers.length} docenti</strong>?
              Questa azione cancellerà tutti i docenti e le assegnazioni correlate nel tabellone orari.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  onDeleteAllTeachers();
                  setSelectedIds([]);
                  setShowDeleteAllConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Sì, Elimina Tutti i Docenti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <input
            type="text"
            id="input-search-teachers"
            placeholder="Cerca docente per nome o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none w-64"
          />

          {/* Subject Dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-filter-subject"
              aria-label="Filtra per materia"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Tutte le Materie</option>
              {ALL_SCHOOL_SUBJECTS.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Carpool only checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
            <input
              type="checkbox"
              id="check-carpool-filter"
              checked={carpoolOnlyFilter}
              onChange={(e) => setCarpoolOnlyFilter(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-sky-400" />
              Solo Auto Condivisa (Carpooling)
            </span>
          </label>
        </div>

        {/* Selection summary */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
          >
            {selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>Seleziona Tutti ({filteredTeachers.length})</span>
          </button>
        </div>
      </div>

      {/* Teachers List Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Seleziona tutti i docenti visibili"
                    checked={selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-700 text-indigo-600"
                  />
                </th>
                <th className="p-3">Docente</th>
                <th className="p-3">Materie Abilitate (Menu a tendina)</th>
                <th className="p-3">Classi e Sezioni Assegnate (es. 2E, 3E)</th>
                <th className="p-3 text-center">Ore Settimanali</th>
                <th className="p-3 text-center">Max Ore/Giorno</th>
                <th className="p-3 text-center">Max Buchi</th>
                <th className="p-3 text-center">Giorno Libero</th>
                <th className="p-3">Auto Condivisa (Carpool)</th>
                <th className="p-3 text-center">Disponibilità</th>
                <th className="p-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredTeachers.map(teacher => {
                const isSelected = selectedIds.includes(teacher.id);
                const isCarpooling = teacher.carpoolWithTeacherIds && teacher.carpoolWithTeacherIds.length > 0;
                const partnerNames = isCarpooling
                  ? teacher.carpoolWithTeacherIds!.map(id => teachers.find(t => t.id === id)?.name || id).join(', ')
                  : '';

                return (
                  <tr
                    key={teacher.id}
                    className={`hover:bg-slate-700/40 transition ${isSelected ? 'bg-indigo-950/30' : ''}`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Seleziona ${teacher.name}`}
                        checked={isSelected}
                        onChange={() => handleToggleSelect(teacher.id)}
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: teacher.color || '#6366F1' }}
                        />
                        <div>
                          <div className="font-semibold text-white text-sm">{teacher.name}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> {teacher.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 max-w-xs">
                      {/* Subject Dropdown & Badges */}
                      <div className="flex flex-wrap gap-1 items-center">
                        {teacher.subjects.map(subj => (
                          <span
                            key={subj}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700 text-slate-200 text-[11px] border border-slate-600"
                          >
                            {subj}
                            <button
                              type="button"
                              onClick={() => {
                                const newSubs = teacher.subjects.filter(s => s !== subj);
                                onUpdateTeacher({ ...teacher, subjects: newSubs.length > 0 ? newSubs : ['Italiano'] });
                              }}
                              className="text-slate-400 hover:text-rose-400"
                              title="Rimuovi materia"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        {/* Quick Subject Add Dropdown */}
                        <select
                          aria-label={`Aggiungi materia a ${teacher.name}`}
                          value=""
                          onChange={(e) => {
                            if (e.target.value && !teacher.subjects.includes(e.target.value)) {
                              onUpdateTeacher({
                                ...teacher,
                                subjects: [...teacher.subjects, e.target.value]
                              });
                            }
                          }}
                          className="bg-slate-900 border border-slate-700 text-indigo-400 hover:text-indigo-300 rounded px-1.5 py-0.5 text-[11px] font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="">+ Aggiungi Materia</option>
                          {ALL_SCHOOL_SUBJECTS.filter(s => !teacher.subjects.includes(s)).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-3 min-w-[200px]">
                      {/* Assigned Classes Pill Buttons */}
                      <div className="flex flex-wrap gap-1 items-center">
                        {(teacher.assignedClassIds || []).map(cid => (
                          <span
                            key={cid}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/80 text-indigo-200 font-bold text-xs shadow-xs"
                          >
                            <span>{cid}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (teacher.assignedClassIds || []).filter(c => c !== cid);
                                onUpdateTeacher({ ...teacher, assignedClassIds: next });
                              }}
                              className="text-slate-400 hover:text-rose-400 cursor-pointer ml-0.5"
                              title={`Rimuovi classe ${cid}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setAssigningClassesTeacher(teacher)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-dashed border-indigo-500/60 text-indigo-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                          title="Assegna o seleziona classi (es. 2E, 3E)"
                        >
                          <Plus className="w-3 h-3 text-indigo-400" />
                          <span>+ Classi</span>
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 font-semibold text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                        <input
                          type="number"
                          aria-label={`Ore settimanali di ${teacher.name}`}
                          min={1}
                          max={36}
                          value={teacher.maxHoursPerWeek}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            onUpdateTeacher({ ...teacher, maxHoursPerWeek: val });
                          }}
                          className="w-10 bg-transparent text-center text-xs font-bold text-indigo-300 focus:outline-none"
                        />
                        <span className="text-slate-400 text-[10px]">ore/sett</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 font-semibold text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                        <input
                          type="number"
                          aria-label={`Max ore al giorno per ${teacher.name}`}
                          min={1}
                          max={8}
                          value={teacher.maxHoursPerDay}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            onUpdateTeacher({ ...teacher, maxHoursPerDay: val });
                          }}
                          className="w-8 bg-transparent text-center text-xs font-bold text-amber-300 focus:outline-none"
                        />
                        <span className="text-slate-400 text-[10px]">h/gg</span>
                      </div>
                    </td>
                    {/* Max Buchi Settimanali */}
                    <td className="p-3 text-center">
                      <select
                        aria-label={`Massimo ore buche per ${teacher.name}`}
                        value={teacher.maxGapHours !== undefined ? teacher.maxGapHours : 2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateTeacher({ ...teacher, maxGapHours: val });
                        }}
                        className={`border rounded px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer transition ${
                          (teacher.maxGapHours ?? 2) === 0
                            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                            : (teacher.maxGapHours ?? 2) === 1
                            ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300'
                            : (teacher.maxGapHours ?? 2) === 2
                            ? 'bg-indigo-950/90 border-indigo-500 text-indigo-300'
                            : 'bg-amber-950/90 border-amber-500 text-amber-300'
                        }`}
                        title="Ore buche settimanali consentite (0 buchi, 1 buco, 2 buchi, 3+ o nessun limite)"
                      >
                        <option value={0}>0 buchi</option>
                        <option value={1}>1 buco max</option>
                        <option value={2}>2 buchi max</option>
                        <option value={3}>3 buchi max</option>
                        <option value={4}>4 buchi max</option>
                        <option value={99}>Nessun limite</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        aria-label={`Giorno libero per ${teacher.name}`}
                        value={teacher.freeDayPreference || 'Nessuno'}
                        onChange={(e) => {
                          const val = e.target.value === 'Nessuno' ? undefined : (e.target.value as DayOfWeek);
                          onUpdateTeacher({ ...teacher, freeDayPreference: val });
                        }}
                        className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="Nessuno">Nessuno</option>
                        {DAYS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      {/* Carpool Checkbox and Partner selection */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(isCarpooling)}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              if (!enabled) {
                                onUpdateTeacher({
                                  ...teacher,
                                  carpoolGroupId: undefined,
                                  carpoolWithTeacherIds: []
                                });
                              } else {
                                // Default pick first other teacher
                                const other = teachers.find(t => t.id !== teacher.id);
                                onUpdateTeacher({
                                  ...teacher,
                                  carpoolGroupId: `group-${teacher.id}`,
                                  carpoolWithTeacherIds: other ? [other.id] : []
                                });
                              }
                            }}
                            className="rounded border-slate-700 text-sky-500 focus:ring-sky-400"
                          />
                          <span className={`text-xs font-medium flex items-center gap-1 ${isCarpooling ? 'text-sky-400 font-bold' : 'text-slate-400'}`}>
                            <Car className="w-3.5 h-3.5" />
                            Condivide Auto
                          </span>
                        </label>

                        {isCarpooling && (
                          <div className="flex items-center gap-1 text-[11px] text-sky-300 bg-sky-950/40 px-2 py-1 rounded border border-sky-800/40">
                            <span className="text-slate-400">Con:</span>
                            <select
                              aria-label={`Collega in carpooling con ${teacher.name}`}
                              value={teacher.carpoolWithTeacherIds?.[0] || ''}
                              onChange={(e) => {
                                const partnerId = e.target.value;
                                onUpdateTeacher({
                                  ...teacher,
                                  carpoolWithTeacherIds: partnerId ? [partnerId] : []
                                });
                              }}
                              className="bg-slate-900 text-sky-200 rounded px-1 py-0.5 text-[11px] border border-sky-700"
                            >
                              <option value="">Seleziona collega...</option>
                              {teachers.filter(t => t.id !== teacher.id).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setAvailabilityModalTeacher(teacher)}
                        className="flex items-center gap-1 mx-auto px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                        title="Modifica griglia oraria delle disponibilità per questo docente"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Modifica Ore</span>
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeacherToDelete(teacher);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-600 transition cursor-pointer"
                          title={`Elimina docente ${teacher.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Availability Matrix */}
      {availabilityModalTeacher && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: availabilityModalTeacher.color || '#6366F1' }} />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Modifica Disponibilità Oraria: {availabilityModalTeacher.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Clicca sulle caselle orarie per contrassegnare ore disponibili (verde) o non disponibili (rosso/grigio).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAvailabilityModalTeacher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 font-semibold">
                    <th className="p-2.5 text-left">Giorno</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                      <th key={h} className="p-2.5">{h}ª Ora</th>
                    ))}
                    <th className="p-2.5">Azioni Giorno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {DAYS.map(day => {
                    const hours = availabilityModalTeacher.availability[day] || [true, true, true, true, true, true, true, true];
                    const isAllAvailable = hours.slice(0, 8).every(Boolean);

                    return (
                      <tr key={day} className="hover:bg-slate-700/20">
                        <td className="p-2.5 font-bold text-slate-200 text-left">{day}</td>
                        {hours.slice(0, 8).map((isAvailable, idx) => (
                          <td key={idx} className="p-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateAvailabilityCell(day, idx)}
                              className={`w-9 h-9 rounded-md font-semibold text-xs transition flex items-center justify-center border ${
                                isAvailable
                                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/50'
                                  : 'bg-rose-950/40 text-rose-400 border-rose-800/40 hover:bg-rose-900/50'
                              }`}
                              title={`${day} ${idx + 1}ª ora: ${isAvailable ? 'Disponibile' : 'Non disponibile'}`}
                            >
                              {isAvailable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                        ))}
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newDay = hours.map(() => !isAllAvailable);
                              const updated = {
                                ...availabilityModalTeacher,
                                availability: {
                                  ...availabilityModalTeacher.availability,
                                  [day]: newDay
                                }
                              };
                              setAvailabilityModalTeacher(updated);
                              onUpdateTeacher(updated);
                            }}
                            className="text-[11px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                          >
                            {isAllAvailable ? 'Imposta Tutto Off' : 'Imposta Tutto On'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500"></span>
                  <span>Disponibile per lezioni</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-950/50 border border-rose-700"></span>
                  <span>Non disponibile (bloccato)</span>
                </div>
              </div>
              <button
                onClick={() => setAvailabilityModalTeacher(null)}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Chiudi e Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Teacher */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Inserisci Nuovo Docente
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Prof.ssa Martina Neri"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Istituzionale</label>
                  <input
                    type="email"
                    placeholder="nome.cognome@scuola.it"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefono (Opzionale)</label>
                  <input
                    type="tel"
                    placeholder="+39 340 0000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject Dropdown Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Materie di Insegnamento (Menu a tendina rapido)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {newSelectedSubjects.map(s => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 px-2 py-0.5 rounded text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setNewSelectedSubjects(prev => prev.filter(item => item !== s))}
                        className="hover:text-rose-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !newSelectedSubjects.includes(e.target.value)) {
                      setNewSelectedSubjects([...newSelectedSubjects, e.target.value]);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Seleziona una materia da aggiungere dal menu...</option>
                  {ALL_SCHOOL_SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ore Sett.</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={newMaxHoursWeek}
                    onChange={(e) => setNewMaxHoursWeek(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Ore/Gg</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={newMaxHoursDay}
                    onChange={(e) => setNewMaxHoursDay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Buchi</label>
                  <select
                    value={newMaxGapHours}
                    onChange={(e) => setNewMaxGapHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2"
                  >
                    <option value={0}>0 buchi</option>
                    <option value={1}>1 buco max</option>
                    <option value={2}>2 buchi max</option>
                    <option value={3}>3 buchi max</option>
                    <option value={4}>4 buchi max</option>
                    <option value={99}>Nessun vincolo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Giorno Libero</label>
                  <select
                    value={newFreeDay}
                    onChange={(e) => setNewFreeDay(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Carpooling options */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCarpoolEnabled}
                    onChange={(e) => setNewCarpoolEnabled(e.target.checked)}
                    className="rounded border-slate-700 text-sky-500"
                  />
                  <span className="font-semibold text-sky-400 flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    Condivisione Macchina (Carpooling)
                  </span>
                </label>

                {newCarpoolEnabled && (
                  <div>
                    <label className="block text-slate-400 mb-1">Con quale collega viaggia?</label>
                    <select
                      value={newCarpoolPartnerId}
                      onChange={(e) => setNewCarpoolPartnerId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-1.5"
                    >
                      <option value="">Seleziona collega per sincronizzare orari...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subjects.join(', ')})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Class & Section Assignment Buttons */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 space-y-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Classi e Sezioni Assegnate (Pulsanti 1ª, 2ª, 3ª es. 2E, 3E)
                </label>
                <p className="text-[11px] text-slate-400">
                  Clicca sui pulsanti delle classi per assegnarle al docente. Puoi selezionare classi specifiche (es. solo 2E e 3E).
                </p>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {Array.from(new Set(classes.filter(c => c.isActive).map(c => c.section))).sort((a, b) => a.localeCompare(b, 'it')).map(sec => {
                    const secClasses = classes.filter(c => c.isActive && c.section === sec).sort((a, b) => a.year - b.year);
                    return (
                      <div key={sec} className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
                        <span className="text-[11px] font-bold text-amber-300 w-16 shrink-0">Sez. {sec}:</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {secClasses.map(c => {
                            const isAssigned = newAssignedClasses.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (isAssigned) {
                                    setNewAssignedClasses(prev => prev.filter(id => id !== c.id));
                                  } else {
                                    setNewAssignedClasses(prev => [...prev, c.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                  isAssigned
                                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                                    : 'bg-slate-900 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                                }`}
                              >
                                {c.id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Salva Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Classes to Teacher */}
      {assigningClassesTeacher && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: assigningClassesTeacher.color || '#6366F1' }}
                />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Assegna Classi: {assigningClassesTeacher.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seleziona le classi singole (es. 2E e 3E) o l'intera sezione. Le classi non formate non vengono assegnate.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningClassesTeacher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Class selection matrix */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              {Array.from(new Set(classes.filter(c => c.isActive).map(c => c.section))).sort((a, b) => a.localeCompare(b, 'it')).map(sec => {
                const secClasses = classes.filter(c => c.isActive && c.section === sec).sort((a, b) => a.year - b.year);
                const assigned = assigningClassesTeacher.assignedClassIds || [];
                const allSecAssigned = secClasses.every(c => assigned.includes(c.id));

                return (
                  <div key={sec} className="bg-slate-900/70 border border-slate-700/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-300 text-sm">Sezione {sec}</span>
                      <span className="text-slate-400 text-[11px]">({secClasses.length} classi formate)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {secClasses.map(c => {
                        const isAssigned = assigned.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              const next = isAssigned
                                ? assigned.filter(id => id !== c.id)
                                : [...assigned, c.id];
                              const updated = { ...assigningClassesTeacher, assignedClassIds: next };
                              setAssigningClassesTeacher(updated);
                              onUpdateTeacher(updated);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isAssigned
                                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                            }`}
                          >
                            {c.id}
                          </button>
                        );
                      })}

                      {/* Toggle entire section */}
                      <button
                        type="button"
                        onClick={() => {
                          const secIds = secClasses.map(c => c.id);
                          const next = allSecAssigned
                            ? assigned.filter(id => !secIds.includes(id))
                            : Array.from(new Set([...assigned, ...secIds]));
                          const updated = { ...assigningClassesTeacher, assignedClassIds: next };
                          setAssigningClassesTeacher(updated);
                          onUpdateTeacher(updated);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                      >
                        {allSecAssigned ? 'Deseleziona Tutta' : 'Tutta la Sez.'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-xs">
              <div className="text-slate-400">
                Totale classi assegnate: <strong className="text-indigo-300">{(assigningClassesTeacher.assignedClassIds || []).length}</strong>
              </div>
              <button
                type="button"
                onClick={() => setAssigningClassesTeacher(null)}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition cursor-pointer"
              >
                Fatto & Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Teacher Confirmation Modal (Prevents browser popup blocking) */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Elimina Docente</h3>
                <p className="text-xs text-rose-300">Conferma rimozione del docente</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Sei sicuro di voler eliminare definitivamente il docente{' '}
              <strong className="text-white font-semibold">{teacherToDelete.name}</strong>?
              Tutte le sue preferenze orarie e assegnazioni verranno rimosse.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTeacher(teacherToDelete.id);
                  setSelectedIds(prev => prev.filter(id => id !== teacherToDelete.id));
                  setTeacherToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                Sì, Elimina Docente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
