import React, { useState } from 'react';
import {
  Sparkles, X, Check, Scale, Clock, ShieldCheck,
  Zap, Car, RefreshCw, AlertCircle, Calendar, ArrowRight,
  Layers, Copy, Plus, FileText, ArrowLeft
} from 'lucide-react';
import { Teacher, SchoolClass, ScheduleTable, ScheduleSlot, GenerateScheduleTarget } from '../types';
import { generateFullSchedule, GenerateScheduleParams } from '../utils/solver';

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTable: ScheduleTable;
  tables?: ScheduleTable[];
  teachers: Teacher[];
  classes: SchoolClass[];
  onApplyGeneratedSlots: (newSlots: ScheduleSlot[], notice: string, targetConfig?: GenerateScheduleTarget) => void;
}

export const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({
  isOpen,
  onClose,
  activeTable,
  tables = [],
  teachers,
  classes,
  onApplyGeneratedSlots
}) => {
  const [strategy, setStrategy] = useState<'fairness' | 'turnation' | 'carpool' | 'compact'>('fairness');
  const [destinationMode, setDestinationMode] = useState<'new_page' | 'multi_pages' | 'current_page'>('new_page');
  const [newPageName, setNewPageName] = useState<string>(`Variante Orario ${tables.length + 1}`);
  const [ensureDoubleGymHours, setEnsureDoubleGymHours] = useState(true);
  const [balanceEarlyLateHours, setBalanceEarlyLateHours] = useState(true);
  const [preserveLocked, setPreserveLocked] = useState(true);
  const [respectCOE, setRespectCOE] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const activeClasses = classes.filter(c => c.isActive);

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      try {
        if (destinationMode === 'multi_pages') {
          // Generate 3 distinct schedule variants in 3 separate pages
          const resA = generateFullSchedule({
            teachers,
            classes,
            hoursPerDay: activeTable.hoursPerDay,
            existingSlots: [],
            preserveLocked: false,
            strategy: 'fairness',
            ensureDoubleGymHours,
            balanceEarlyLateHours,
            respectCOE
          });

          const resB = generateFullSchedule({
            teachers,
            classes,
            hoursPerDay: activeTable.hoursPerDay,
            existingSlots: [],
            preserveLocked: false,
            strategy: 'turnation',
            ensureDoubleGymHours,
            balanceEarlyLateHours,
            respectCOE
          });

          const resC = generateFullSchedule({
            teachers,
            classes,
            hoursPerDay: activeTable.hoursPerDay,
            existingSlots: [],
            preserveLocked: false,
            strategy: 'carpool',
            ensureDoubleGymHours,
            balanceEarlyLateHours,
            respectCOE
          });

          onApplyGeneratedSlots(
            resA.slots,
            'Generate 3 diverse opzioni di orario in 3 pagine distinte!',
            {
              mode: 'multi_pages',
              multiPages: [
                {
                  name: `Opzione A - Massima Equità (${activeTable.hoursPerDay}h)`,
                  slots: resA.slots,
                  hoursPerDay: activeTable.hoursPerDay
                },
                {
                  name: `Opzione B - Turnazione Ingressi/Uscite (${activeTable.hoursPerDay}h)`,
                  slots: resB.slots,
                  hoursPerDay: activeTable.hoursPerDay
                },
                {
                  name: `Opzione C - Mobilità & Auto (${activeTable.hoursPerDay}h)`,
                  slots: resC.slots,
                  hoursPerDay: activeTable.hoursPerDay
                }
              ]
            }
          );
          setIsGenerating(false);
          onClose();
          return;
        }

        const result = generateFullSchedule({
          teachers,
          classes,
          hoursPerDay: activeTable.hoursPerDay,
          existingSlots: destinationMode === 'new_page' ? [] : activeTable.slots,
          preserveLocked: destinationMode === 'new_page' ? false : preserveLocked,
          strategy,
          ensureDoubleGymHours,
          balanceEarlyLateHours,
          respectCOE
        });

        const targetName = destinationMode === 'new_page' ? (newPageName.trim() || `Variante ${tables.length + 1}`) : activeTable.name;
        const noticeMsg = `Orario generato con successo per "${targetName}"! ${result.metrics.totalLessonsGenerated} lezioni allocate • Equità: ${result.metrics.fairnessScore}% • Max buchi per docente: ${result.metrics.maxGapPerTeacher}h`;

        onApplyGeneratedSlots(result.slots, noticeMsg, {
          mode: destinationMode,
          newPageName: newPageName.trim() || `Variante Orario ${tables.length + 1}`
        });

        setIsGenerating(false);
        onClose();
      } catch (err) {
        console.error('Error generating schedule:', err);
        setIsGenerating(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-6 text-slate-100">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              id="btn-back-generate-top"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm mr-1"
              title="Torna alla schermata precedente"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Torna Indietro</span>
            </button>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Generatore Orario Automatico Equo
                <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
                  {activeTable.hoursPerDay} Ore/Giorno
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Costruisce l'orario completo eliminando ore buche ingiuste, alternando prime/ultime ore e garantendo ore doppie.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* School Overview Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Classi Attive</span>
            <span className="text-xl font-extrabold text-white">{activeClasses.length}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">(escluse 1I, 2M)</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Docenti in Organico</span>
            <span className="text-xl font-extrabold text-white">{teachers.length}</span>
            <span className="text-[10px] text-sky-400 block mt-0.5">Carichi distribuiti</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">Lezioni Settimanali</span>
            <span className="text-xl font-extrabold text-indigo-400">{activeClasses.length * activeTable.hoursPerDay * 5}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{activeTable.hoursPerDay * 5}h per classe</span>
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-indigo-400" />
            1. Seleziona la Strategia di Ottimizzazione:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Strategy 1 */}
            <div
              onClick={() => setStrategy('fairness')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                strategy === 'fairness'
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-400" /> Massima Equità & Zero Buchi
                  </span>
                  {strategy === 'fairness' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Elimina i buchi ingiusti: nessun docente avrà 4 ore buche mentre altri non ne hanno. Massimo 0-1 ore buche a settimana.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-2 block">✓ Raccomandato dal Collegio</span>
            </div>

            {/* Strategy 2 */}
            <div
              onClick={() => setStrategy('turnation')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                strategy === 'turnation'
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" /> Alternanza Ingressi & Uscite
                  </span>
                  {strategy === 'turnation' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nessun docente entra sempre alla 1ª ora o esce sempre all'ultima ora. Rotazione rigorosa di entrate posticipate ed uscite anticipate.
                </p>
              </div>
              <span className="text-[10px] font-bold text-amber-300 mt-2 block">✓ Risolve disparità orari estremi</span>
            </div>

            {/* Strategy 3 */}
            <div
              onClick={() => setStrategy('carpool')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                strategy === 'carpool'
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-sky-400" /> Priorità Auto Condivisa
                  </span>
                  {strategy === 'carpool' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sincronizzazione orari arrivo e partenza per i colleghi che viaggiano insieme in carpooling, con giorni di presenza coincidenti.
                </p>
              </div>
              <span className="text-[10px] font-bold text-sky-400 mt-2 block">✓ Zero attese parcheggio</span>
            </div>

            {/* Strategy 4 */}
            <div
              onClick={() => setStrategy('compact')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                strategy === 'compact'
                  ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" /> Compattazione Mattutina
                  </span>
                  {strategy === 'compact' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tutte le lezioni concentrate nelle prime ore della mattina. Ideale per la prima settimana (3 ore) o per uscite anticipate.
                </p>
              </div>
              <span className="text-[10px] font-bold text-purple-400 mt-2 block">✓ Blocco didattico continuo</span>
            </div>
          </div>
        </div>

        {/* Quality Toggles */}
        <div className="space-y-2.5 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            2. Regole di Vincolo & Benessere Docenti:
          </span>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200 hover:text-white">
            <input
              type="checkbox"
              checked={ensureDoubleGymHours}
              onChange={e => setEnsureDoubleGymHours(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
            <span>
              <strong>Garantisci ore doppie consecutive per Motoria</strong> (indispensabili per raggiungere i campetti sportivi o la palestra senza spezzare l'attività)
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200 hover:text-white">
            <input
              type="checkbox"
              checked={balanceEarlyLateHours}
              onChange={e => setBalanceEarlyLateHours(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
            <span>
              <strong>Turnazione equa ingressi/uscite</strong> (nessun docente esce sempre tardi o entra sempre alla 1ª ora)
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200 hover:text-white">
            <input
              type="checkbox"
              checked={respectCOE}
              onChange={e => setRespectCOE(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
            <span>
              <strong>Riconoscimento Cattedre Esterne (COE)</strong>: compatta i docenti a 9 ore su 2-3 giorni per liberare i restanti giorni per l'altra scuola
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200 hover:text-white">
            <input
              type="checkbox"
              checked={preserveLocked}
              onChange={e => setPreserveLocked(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
            <span>
              <strong>Preserva lezioni con lucchetto bloccate dall'utente</strong> (non verranno spostate dal generatore)
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isGenerating}
            id="btn-back-generate-bottom"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Torna Indietro</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Annulla
            </button>
            <button
              id="btn-confirm-generate-schedule"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calcolo Orario Ottimale in corso...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Genera Orario Automatico Ora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
