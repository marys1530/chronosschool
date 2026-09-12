import React, { useState } from 'react';
import {
  HelpCircle, X, ChevronRight, ChevronLeft, Check, Sparkles,
  Users, BookOpen, Wand2, Printer, Mail, ShieldCheck, Car
} from 'lucide-react';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      title: '1. Gestione Docenti & Auto Condivisa (Carpooling)',
      subtitle: 'Configura orari, ore cattedra e mobilità sostenibile',
      description:
        'Aggiungi i docenti con menu a tendina completo per le materie (nessun inserimento manuale faticoso). Se due o più docenti condividono la stessa auto per raggiungere la scuola, basta attivare la spunta "Condivide auto" e selezionare il collega: il sistema allineerà automaticamente gli orari per farli viaggiare insieme!',
      icon: <Car className="w-8 h-8 text-sky-400" />,
      tips: [
        'Puoi impostare il giorno libero preferito per ogni docente.',
        'Supporta eliminazione massiva rapida con caselle di selezione multiple.',
        'La griglia di disponibilità permette di indicare quali ore o giorni il docente è presente.'
      ]
    },
    {
      title: '2. Classi, Sezioni & Piani di Studio Modificabili',
      subtitle: 'Monte ore settimanale e annuale (33 settimane)',
      description:
        'Attiva o disattiva le classi (es. 1I e 2M escluse come richiesto). Nella sezione Piani di Studio ogni singola riga è interattiva: puoi modificare in tempo reale le ore settimanali di ogni materia, calcolare il monte ore annuale e cambiare il docente incaricato con un click.',
      icon: <BookOpen className="w-8 h-8 text-amber-400" />,
      tips: [
        'Puoi clonare l\'intero piano di studi da una classe all\'altra con un solo pulsante.',
        'Assegna aule e laboratori specifici (es. Lab. Informatica, Palestra) per evitare sovrapposizioni.',
        'Tutti i campi sono modificabili direttamente senza blocchi.'
      ]
    },
    {
      title: '3. Risoluzione Intelligente dei Conflitti (1-Click)',
      subtitle: 'Tre diverse opzioni di ottimizzazione a confronto',
      description:
        'Se compaiono sovrapposizioni tra docenti, carpooling o aule, premi "Risolvi Conflitti". Il motore analizzerà l\'orario e ti proporrà 3 soluzioni distinte (Massima Equità, Priorità Auto Condivisa, Compattazione Oraria) indicando indice percentuale e ore buche totali per scegliere la migliore!',
      icon: <Wand2 className="w-8 h-8 text-indigo-400" />,
      tips: [
        'Opzione A (Equità): distribuisce le ore per evitare giornate pesanti ai docenti.',
        'Opzione B (Carpooling): prioritizza la coincidenza di orari per chi viaggia insieme.',
        'Opzione C (Compattazione): ideale per la prima settimana con orario ridotto a 3 ore.'
      ]
    },
    {
      title: '4. Nuove Tabelle & Scelta Ore Giornaliere',
      subtitle: 'Configura 3 ore per la 1ª settimana o 6 ore standard',
      description:
        'Crea nuovi tabelloni per ogni esigenza. Se la prima settimana di scuola si svolgono soltanto 3 ore al giorno, seleziona "3h" nel selettore ore. Se togli la spunta "Copia dall\'orario precedente", otterrai una pagina nuova e pulita, senza lezioni duplicate!',
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
      tips: [
        'Puoi scegliere se mantenere l\'anagrafica docenti o iniziare da un foglio totalmente bianco.',
        'Supporta il passaggio immediato tra orari da 3 a 8 ore al giorno.'
      ]
    },
    {
      title: '5. Centro Stampa PDF & Invio Email',
      subtitle: 'Stampe ad alta definizione e invio telematico istantaneo',
      description:
        'Il centro di stampa PDF offre diverse viste specializzate: orario per classi (per bacheca studenti), orario per docenti (schede personali), tabellone master d\'istituto, report aule e report di equità. Inoltre puoi inviare l\'orario direttamente per email all\'indirizzo desiderato!',
      icon: <Printer className="w-8 h-8 text-purple-400" />,
      tips: [
        'Filtro rapido per singola classe o singolo docente.',
        'Compatibile con salvataggio PDF diretto di tutti i browser.',
        'Possibilità di allegare file Excel (.xlsx) formattato con filtri.'
      ]
    }
  ];

  const currentStep = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tutorial Interattivo ChronosSchool</h3>
              <p className="text-xs text-slate-400">Guida alle funzionalità avanzate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{currentStep.title}</h4>
              <p className="text-xs text-indigo-400 font-medium">{currentStep.subtitle}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-200">Consigli pratici:</span>
            {currentStep.tips.map((t, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  currentStepIndex === idx ? 'bg-indigo-500 w-6' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Indietro
              </button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                Avanti <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
              >
                Inizia a Usare l'App <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
