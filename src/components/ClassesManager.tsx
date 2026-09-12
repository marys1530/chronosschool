import React, { useState } from 'react';
import { BookOpen, Plus, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw, Layers } from 'lucide-react';
import { SchoolClass } from '../types';
import { MIDDLE_SCHOOL_SECTIONS, createAllStandardClasses } from '../data/defaultData';

interface ClassesManagerProps {
  classes: SchoolClass[];
  onToggleClassActive: (classId: string) => void;
  onAddClass: (newClass: SchoolClass) => void;
  onUpdateClass: (updatedClass: SchoolClass) => void;
  onDeleteClass: (classId: string) => void;
  onRestoreAllClasses?: (allClasses: SchoolClass[]) => void;
}

export const ClassesManager: React.FC<ClassesManagerProps> = ({
  classes,
  onToggleClassActive,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onRestoreAllClasses
}) => {
  const [newYear, setNewYear] = useState<number>(1);
  const [newSection, setNewSection] = useState<string>('N');
  const [newIsActive, setNewIsActive] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewSectionModalOpen, setIsNewSectionModalOpen] = useState(false);
  const [newSectionLetter, setNewSectionLetter] = useState<string>('N');
  const [includeYear1, setIncludeYear1] = useState(true);
  const [includeYear2, setIncludeYear2] = useState(true);
  const [includeYear3, setIncludeYear3] = useState(true);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  // Scuola Media: Classi 1ª, 2ª, 3ª Media
  const years = [1, 2, 3];

  // Dynamically compute all present sections sorted alphabetically
  const presentSections: string[] = Array.from(new Set<string>(classes.map(c => c.section))).sort((a: string, b: string) => a.localeCompare(b, 'it'));

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSection = newSection.trim().toUpperCase();
    const id = `${newYear}${cleanSection}`;
    if (classes.some(c => c.id === id)) {
      alert(`La classe ${id} esiste già nell'organico!`);
      return;
    }

    const created: SchoolClass = {
      id,
      year: newYear,
      section: cleanSection,
      isActive: newIsActive,
      notes: !newIsActive ? 'Non formata' : undefined
    };
    onAddClass(created);
    setIsModalOpen(false);
  };

  const handleCreateFullSection = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSection = newSectionLetter.trim().toUpperCase();
    if (!cleanSection) return;

    const yearsToCreate: number[] = [];
    if (includeYear1) yearsToCreate.push(1);
    if (includeYear2) yearsToCreate.push(2);
    if (includeYear3) yearsToCreate.push(3);

    if (yearsToCreate.length === 0) {
      alert('Seleziona almeno un anno per la nuova sezione!');
      return;
    }

    let addedCount = 0;
    yearsToCreate.forEach(yr => {
      const id = `${yr}${cleanSection}`;
      if (!classes.some(c => c.id === id)) {
        onAddClass({
          id,
          year: yr,
          section: cleanSection,
          isActive: true
        });
        addedCount++;
      }
    });

    setIsNewSectionModalOpen(false);
    setSelectedSectionFilter(cleanSection);
    // Next suggestion letter
    const nextChar = String.fromCharCode(cleanSection.charCodeAt(0) + 1);
    setNewSectionLetter(nextChar);
  };

  const handleAutoAddAllClasses = () => {
    const fullRoster = createAllStandardClasses();
    if (onRestoreAllClasses) {
      onRestoreAllClasses(fullRoster);
    } else {
      const existingIds = new Set(classes.map(c => c.id));
      fullRoster.forEach(c => {
        if (!existingIds.has(c.id)) {
          onAddClass(c);
        }
      });
    }
  };

  const activeCount = classes.filter(c => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header & Instructions */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Configurazione Classi & Sezioni ({activeCount} Classi Attive su {classes.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestisci le classi <strong>I, II e III</strong> per ogni sezione (dalla A alla M ed eventuali nuove sezioni come <strong>N, O, P</strong>).
            Aggiungi nuove sezioni complete con il pulsante <strong>+</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Add Full Section (e.g. N -> 1N, 2N, 3N) */}
          <button
            id="btn-add-full-section"
            onClick={() => setIsNewSectionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer"
            title="Aggiungi una nuova sezione completa con 1ª, 2ª e 3ª Media (es. Sezione N: I N, II N, III N)"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Aggiungi Sezione (es. I N, II N, III N)</span>
          </button>

          <button
            id="btn-add-class-open"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Singola Classe</span>
          </button>

          <button
            id="btn-auto-add-all-classes"
            onClick={handleAutoAddAllClasses}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium shadow-sm transition cursor-pointer"
            title="Aggiunge o ripristina tutte le classi standard A-M"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ripristina A-M</span>
          </button>
        </div>
      </div>

      {/* Notice on classes */}
      <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-lg flex items-start justify-between gap-3 text-xs">
        <div className="text-slate-300">
          <strong className="text-indigo-300 font-semibold block mb-0.5">
            Organico Classi & Sezioni Flessibile:
          </strong>
          Puoi creare qualsiasi nuova sezione (es. <strong>N, O, P</strong>) con relative classi <strong>1ª, 2ª e 3ª</strong> in un solo clic con il pulsante <span className="font-bold text-white">+ Aggiungi Sezione</span>.
          Le classi non formate possono essere escluse o incluse immediatamente.
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold text-xs pr-1 shrink-0">Filtra per Sezione:</span>
        <button
          onClick={() => setSelectedSectionFilter('all')}
          className={`px-2.5 py-1 rounded-md font-bold transition shrink-0 ${
            selectedSectionFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Tutte ({classes.length})
        </button>
        {presentSections.map(sec => {
          const countInSec = classes.filter(c => c.section === sec).length;
          const activeInSec = classes.filter(c => c.section === sec && c.isActive).length;
          return (
            <button
              key={sec}
              onClick={() => setSelectedSectionFilter(sec)}
              className={`px-2.5 py-1 rounded-md font-bold transition whitespace-nowrap shrink-0 ${
                selectedSectionFilter === sec
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Sez. {sec} ({activeInSec}/{countInSec})
            </button>
          );
        })}

        {/* Quick Add Section Button next to filter pills */}
        <button
          onClick={() => setIsNewSectionModalOpen(true)}
          className="px-2.5 py-1 rounded-md bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-indigo-200 font-bold transition flex items-center gap-1 shrink-0"
          title="Aggiungi un'altra sezione (es. N, O, P)"
        >
          <Plus className="w-3.5 h-3.5 text-amber-300" />
          <span>Nuova Sezione</span>
        </button>

        {/* Delete current filtered section if not 'all' */}
        {selectedSectionFilter !== 'all' && (
          <button
            onClick={() => setSectionToDelete(selectedSectionFilter)}
            className="px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
            title={`Elimina tutte le classi della Sezione ${selectedSectionFilter}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Elimina Sez. {selectedSectionFilter}</span>
          </button>
        )}
      </div>

      {/* Grid by School Year (1ª, 2ª, 3ª Media) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {years.map(yr => {
          const yearClasses = classes
            .filter(c => c.year === yr)
            .filter(c => selectedSectionFilter === 'all' || c.section === selectedSectionFilter)
            .sort((a, b) => a.section.localeCompare(b.section, 'it'));
          const activeInYear = yearClasses.filter(c => c.isActive).length;

          return (
            <div
              key={yr}
              className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/40">
                    {yr === 1 ? 'I' : yr === 2 ? 'II' : 'III'}
                  </span>
                  <h3 className="font-bold text-white text-sm">Classi {yr}ª Media ({yr === 1 ? 'I' : yr === 2 ? 'II' : 'III'})</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {activeInYear} di {yearClasses.length} attive
                  </span>
                  <button
                    onClick={() => {
                      setNewYear(yr);
                      setIsModalOpen(true);
                    }}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-indigo-300 transition"
                    title={`Aggiungi classe per il ${yr}º anno`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Class Cards */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {yearClasses.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 italic">
                    Nessuna classe presente per la sezione selezionata.
                  </div>
                ) : (
                  yearClasses.map(cls => {
                    const romanYear = cls.year === 1 ? 'I' : cls.year === 2 ? 'II' : 'III';

                    return (
                      <div
                        key={cls.id}
                        className={`p-2.5 rounded-lg border transition flex items-center justify-between ${
                          cls.isActive
                            ? 'bg-slate-900/80 border-slate-700 text-white hover:border-slate-600'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => onToggleClassActive(cls.id)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition cursor-pointer ${
                              cls.isActive
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 border border-slate-700'
                            }`}
                            title={cls.isActive ? 'Attiva / Formata (Clicca per escludere dall\'orario)' : 'Non formata (Clicca per includere nell\'orario)'}
                          >
                            {cls.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm tracking-tight">Classe {cls.id}</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({romanYear} {cls.section})
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-semibold">
                                Sez. {cls.section}
                              </span>
                              {!cls.isActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold">
                                  {cls.notes || 'Non formata'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {cls.isActive ? 'Inclusa nell\'orario e tabellone' : 'Esclusa dal tabellone orario'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleClassActive(cls.id)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                              cls.isActive
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                            }`}
                          >
                            {cls.isActive ? 'Escludi' : 'Attiva'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClassToDelete(cls);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/80 border border-transparent hover:border-rose-800/60 transition cursor-pointer"
                            title={`Elimina classe ${cls.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Add Complete Section (e.g. Section N -> I N, II N, III N) */}
      {isNewSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Aggiungi Nuova Sezione Completa
              </h3>
              <button
                type="button"
                onClick={() => setIsNewSectionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFullSection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lettera della Sezione da Creare:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    required
                    placeholder="Es. N"
                    value={newSectionLetter}
                    onChange={(e) => setNewSectionLetter(e.target.value.toUpperCase())}
                    className="w-20 bg-slate-900 border border-indigo-500 text-indigo-200 rounded-lg p-2.5 uppercase text-center font-black text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-slate-400 text-xs">
                    Suggerimenti rapidi:
                    <div className="flex gap-1.5 mt-1">
                      {['N', 'O', 'P', 'Q', 'R'].map(letter => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setNewSectionLetter(letter)}
                          className={`px-2 py-0.5 rounded font-bold transition ${
                            newSectionLetter === letter
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          Sez. {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-700">
                <span className="block text-slate-300 font-semibold">
                  Classi da generare per la sezione {newSectionLetter.toUpperCase() || '?'}:
                </span>
                <div className="space-y-2 bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeYear1}
                      onChange={(e) => setIncludeYear1(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-800"
                    />
                    <span className="font-bold">1ª Media (I {newSectionLetter.toUpperCase()})</span>
                    <span className="text-slate-400 text-[11px]">— Classe 1{newSectionLetter.toUpperCase()}</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeYear2}
                      onChange={(e) => setIncludeYear2(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-800"
                    />
                    <span className="font-bold">2ª Media (II {newSectionLetter.toUpperCase()})</span>
                    <span className="text-slate-400 text-[11px]">— Classe 2{newSectionLetter.toUpperCase()}</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeYear3}
                      onChange={(e) => setIncludeYear3(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-800"
                    />
                    <span className="font-bold">3ª Media (III {newSectionLetter.toUpperCase()})</span>
                    <span className="text-slate-400 text-[11px]">— Classe 3{newSectionLetter.toUpperCase()}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewSectionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                >
                  <Plus className="w-4 h-4" />
                  Crea Sezione & Classi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Single Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Aggiungi Singola Classe
            </h3>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Anno Scolastico</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2"
                  >
                    {[1, 2, 3].map(y => (
                      <option key={y} value={y}>{y}ª Media ({y === 1 ? 'I' : y === 2 ? 'II' : 'III'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sezione (Lettera)</label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    placeholder="Es. A, B, E, N..."
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 uppercase text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-new-is-active"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900"
                />
                <label htmlFor="chk-new-is-active" className="text-slate-300 font-medium cursor-pointer">
                  Classe formata e attiva nell'orario
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Crea Classe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Class */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Elimina Classe {classToDelete.id}</h3>
                <p className="text-xs text-rose-300">Conferma eliminazione definitiva dall'organico</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Sei sicuro di voler eliminare la classe <strong className="text-white font-semibold">Classe {classToDelete.id}</strong> (Sezione {classToDelete.section})?
              Tutte le ore e le lezioni assegnate a questa classe nel tabellone orario verranno rimosse.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClass(classToDelete.id);
                  setClassToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sì, Elimina Classe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Entire Section */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Elimina Sezione {sectionToDelete}</h3>
                <p className="text-xs text-rose-300">Conferma rimozione di tutte le classi della sezione</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Sei sicuro di voler eliminare tutte le classi appartenenti alla <strong className="text-white font-semibold">Sezione {sectionToDelete}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  const secClasses = classes.filter(c => c.section === sectionToDelete);
                  secClasses.forEach(c => onDeleteClass(c.id));
                  setSelectedSectionFilter('all');
                  setSectionToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sì, Elimina Intera Sezione</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
