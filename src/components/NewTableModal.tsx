import React, { useState } from 'react';
import { Calendar, Plus, X, Copy, FileText, Users, Clock, AlertCircle } from 'lucide-react';
import { ScheduleTable } from '../types';

interface NewTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: ScheduleTable;
  onCreateTable: (
    name: string,
    hoursPerDay: number,
    copyPreviousSlots: boolean,
    keepTeachers: boolean,
    description?: string
  ) => void;
}

export const NewTableModal: React.FC<NewTableModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onCreateTable
}) => {
  const [tableName, setTableName] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [copyPreviousSlots, setCopyPreviousSlots] = useState(false); // Default to false (new blank page)
  const [keepTeachers, setKeepTeachers] = useState(true);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    onCreateTable(
      tableName.trim(),
      hoursPerDay,
      copyPreviousSlots,
      keepTeachers,
      description.trim()
    );

    onClose();
    setTableName('');
    setCopyPreviousSlots(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Crea Nuova Tabella Orario
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nome Tabella *</label>
            <input
              type="text"
              required
              placeholder="Es. Orario Prima Settimana (3 ore) / Orario Definitivo"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Descrizione / Note (Opzionale)</label>
            <input
              type="text"
              placeholder="Es. Valido per la prima settimana con orario ridotto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Configurable Hours per day */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Ore giornaliere previste per questo tabellone
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[3, 4, 5, 6, 7, 8].map(h => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHoursPerDay(h)}
                  className={`py-2 rounded-lg font-bold border transition text-center ${
                    hoursPerDay === h
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>{h}h</div>
                  {h === 3 && <div className="text-[9px] text-amber-300 font-normal">1ª Sett</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Critical Bug Fix Area: Copy or Blank Table */}
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700 space-y-3">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Contenuto Iniziale del Tabellone
            </div>

            {/* Checkbox: Copia dall'orario precedente */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                id="checkbox-copy-previous"
                checked={copyPreviousSlots}
                onChange={(e) => setCopyPreviousSlots(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <span className="font-medium text-slate-200">
                  Copia lezioni dall'orario precedente ({currentTable.name})
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {copyPreviousSlots
                    ? 'Le lezioni già assegnate verranno duplicate nella nuova tabella.'
                    : 'Disattivato: Verrà generato un tabellone completamente NUOVO e VUOTO, senza copiare la pagina precedente.'}
                </p>
              </div>
            </label>

            {/* Option: Keep or Remove Teachers list */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-slate-300 font-medium">Elenco Docenti per la nuova pagina:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKeepTeachers(true)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    keepTeachers
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Mantieni Docenti
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Conserva anagrafica docenti con tabellone vuoto
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setKeepTeachers(false)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    !keepTeachers
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Pagina Totalmente Vuota
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Senza elenco docenti (da inserire da zero)
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Crea Tabella
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
