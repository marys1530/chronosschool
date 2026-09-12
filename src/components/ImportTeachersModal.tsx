import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileText, FileSpreadsheet, Check, AlertCircle, X,
  Trash2, UserCheck, Sparkles, Car, Clock, BookOpen, Layers,
  Plus, ArrowLeft, Edit3, HelpCircle
} from 'lucide-react';
import { Teacher, DayOfWeek } from '../types';
import { MIDDLE_SCHOOL_SUBJECTS, MIDDLE_SCHOOL_SECTIONS, DAYS } from '../data/defaultData';

interface ImportTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTeachers: (newTeachers: Teacher[], replaceAll: boolean) => void;
  existingTeachersCount: number;
}

export interface ParsedTeacherRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subjects: string[];
  maxHoursPerWeek: number;
  coExternalHours?: number;
  assignedClassIds: string[];
  assignedSections: string[];
  requiresDoubleHours: boolean;
  carpoolPartnerName?: string;
  carpoolEnabled: boolean;
  freeDayPreference?: DayOfWeek;
  maxGapHours?: number;
  specialRequirements?: string;
}

export const ImportTeachersModal: React.FC<ImportTeachersModalProps> = ({
  isOpen,
  onClose,
  onImportTeachers,
  existingTeachersCount
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manual'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedTeacherRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  // Extract classes from text like "1A, 3A, 1B e SEZ C" or "1A 2A 3A" or "SEZIONE B"
  const extractClassIds = (text: string): string[] => {
    if (!text) return [];
    const normalized = text.replace(/[ª°^]/g, '');
    const matches: string[] = [];

    // 1. Direct class codes (1A, 2B, 3C, ecc.)
    const regexDirect = /\b([1-3])\s*([A-Oa-o])\b/g;
    let match;
    while ((match = regexDirect.exec(normalized)) !== null) {
      matches.push(`${match[1]}${match[2].toUpperCase()}`);
    }

    // 2. Whole section mentions: "SEZ C", "SEZ. C", "SEZIONE C", "SEZIONI A B C"
    const sectionRegex = /(?:sez(?:ione|\.)?|sezioni)\s+([A-Oa-o](?:\s*(?:,|e|ed|\/)\s*[A-Oa-o])*)/gi;
    let secMatch;
    while ((secMatch = sectionRegex.exec(normalized)) !== null) {
      const letters = secMatch[1].match(/[A-Oa-o]/g);
      if (letters) {
        letters.forEach(letter => {
          const lUpper = letter.toUpperCase();
          matches.push(`1${lUpper}`);
          matches.push(`2${lUpper}`);
          matches.push(`3${lUpper}`);
        });
      }
    }

    return Array.from(new Set(matches));
  };

  // Extract subjects matching Middle School official subjects or keywords
  const extractSubjects = (text: string): string[] => {
    if (!text) return ['Italiano'];
    const lower = text.toLowerCase();
    const found: string[] = [];

    // Explicit check for "Italiano e Storia" or individual subjects
    if (lower.includes('italiano')) found.push('Italiano');
    if (lower.includes('storia')) found.push('Storia');
    if (lower.includes('geografia')) found.push('Geografia');
    if (lower.includes('matematica') || lower.includes('mate')) found.push('Matematica');
    if (lower.includes('scienze')) found.push('Scienze');
    if (lower.includes('inglese')) found.push('Inglese');
    if (lower.includes('francese')) found.push('Francese');
    if (lower.includes('spagnolo')) found.push('Francese'); // fallback language
    if (lower.includes('tecnologia') || lower.includes('ed. tecnica') || lower.includes('tecnica')) found.push('Tecnologia');
    if (lower.includes('arte') || lower.includes('disegno') || lower.includes('immagine')) found.push('Arte e Immagine');
    if (lower.includes('motori') || lower.includes('educazione fisica') || lower.includes('ed. fisica') || lower.includes('sport')) found.push('Scienze Motorie e Sportive');
    if (lower.includes('musica') || lower.includes('strumento')) found.push('Musica');
    if (lower.includes('religione') || lower.includes('irc')) found.push('Religione Cattolica');
    if (lower.includes('sostegno')) found.push('Sostegno');

    return found.length > 0 ? Array.from(new Set(found)) : ['Italiano'];
  };

  // Extract free day
  const extractFreeDay = (text: string): DayOfWeek | undefined => {
    const lower = text.toLowerCase();
    for (const d of DAYS) {
      if (lower.includes(d.toLowerCase().slice(0, 4))) {
        return d;
      }
    }
    return undefined;
  };

  // SMART PARSER FOR TEACHER STRINGS
  // Handles unstructured formats like:
  // "ANELLO ANELLO.CHIARA@ISTRUZIONE.IT MATERIE ABILITATE ITALIANO E STORIA, ASSEGNATO ALLE CLASSI 1A,3A,1B E SEZ C, ORE SETTIMANALI 18 ORE"
  const parseLineToTeacher = (line: string, index: number): ParsedTeacherRow | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('cognome') || trimmed.toLowerCase().startsWith('docente')) {
      return null;
    }

    let name = '';
    let email = '';
    let subjects: string[] = [];
    let classes: string[] = [];
    let hours = 18;
    let coHours = 0;
    let requiresDouble = false;
    let carpool = false;
    let carpoolPartner = '';
    let specialReq = '';
    let freeDay: DayOfWeek | undefined = undefined;

    // 1. Detect email
    const emailMatch = trimmed.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) {
      email = emailMatch[0];
    }

    // 2. Extract name
    if (email) {
      const beforeEmail = trimmed.split(email)[0].trim();
      if (beforeEmail) {
        // Clean leading titles
        name = beforeEmail.replace(/^prof\.?(?:ssa)?\s+/i, '').replace(/[,;:]/g, '').trim();
      } else {
        // Derive name from email username (e.g. anello.chiara -> Anello Chiara)
        const username = email.split('@')[0];
        name = username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      }
    } else {
      // Check if delimited by tab, semicolon or comma
      const parts = trimmed.split(/[\t;|]/).map(p => p.trim());
      if (parts.length >= 2) {
        name = parts[0].replace(/^prof\.?(?:ssa)?\s+/i, '').trim();
      } else {
        const cleanLine = trimmed.replace(/prof\.?(?:ssa)?\s+/i, '');
        const words = cleanLine.split(/\s+/).filter(Boolean);
        name = words.slice(0, 2).join(' ');
      }
    }

    // Clean name from trailing keywords
    name = name.replace(/\b(?:materie|abilitat[ae]|classi|assegnat[ao]|ore)\b.*$/i, '').trim();
    if (!name) {
      name = `Docente ${index + 1}`;
    }

    if (!email) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      email = `${cleanName}@istruzione.it`;
    }

    // 3. Extract hours
    const hourRegex = /(?:ore\s*settimanali|cattedra|ore)[:\s]+(\d{1,2})|\b(\d{1,2})\s*(?:ore|h)\b/i;
    const hourMatch = trimmed.match(hourRegex);
    if (hourMatch) {
      const parsedH = parseInt(hourMatch[1] || hourMatch[2], 10);
      if (parsedH > 0 && parsedH <= 24) {
        hours = parsedH;
      }
    }

    // 4. Detect COE (es. 9+9)
    const coeMatch = trimmed.match(/(\d{1,2})\s*\+\s*(\d{1,2})/);
    if (coeMatch) {
      hours = parseInt(coeMatch[1], 10);
      coHours = parseInt(coeMatch[2], 10);
    } else if (trimmed.toLowerCase().includes('coe') || trimmed.toLowerCase().includes('altra scuola')) {
      hours = 9;
      coHours = 9;
    }

    // 5. Extract subjects
    // Look specifically after "MATERIE ABILITATE" or "MATERIE"
    const subjBlockMatch = trimmed.match(/(?:materie\s+abilitate|materia|insegna)[:\s]+(.*?)(?=,\s*assegnat|,\s*classi|,\s*ore|assegnat|classi|ore|$)/i);
    if (subjBlockMatch && subjBlockMatch[1]) {
      subjects = extractSubjects(subjBlockMatch[1]);
    } else {
      subjects = extractSubjects(trimmed);
    }

    // 6. Extract classes
    // Look specifically after "ASSEGNATO ALLE CLASSI" or "CLASSI"
    const classBlockMatch = trimmed.match(/(?:assegnat[ao]\s+alle\s+classi|classi|assegnat[ao])[:\s]+(.*?)(?=,\s*ore|ore|materie|$)/i);
    if (classBlockMatch && classBlockMatch[1]) {
      classes = extractClassIds(classBlockMatch[1]);
    } else {
      classes = extractClassIds(trimmed);
    }

    // 7. Special requirements & double hours
    if (trimmed.toLowerCase().includes('consecutiv') || 
        trimmed.toLowerCase().includes('campett') || 
        trimmed.toLowerCase().includes('doppi') ||
        subjects.includes('Scienze Motorie e Sportive')) {
      requiresDouble = true;
    }

    // 8. Carpooling
    if (trimmed.toLowerCase().includes('auto') || 
        trimmed.toLowerCase().includes('viagg') || 
        trimmed.toLowerCase().includes('carpool') ||
        trimmed.toLowerCase().includes('macchina')) {
      carpool = true;
      const partnerMatch = trimmed.match(/(?:con|assieme a|insieme a)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/i);
      if (partnerMatch && partnerMatch[1]) {
        carpoolPartner = partnerMatch[1].trim();
      }
    }

    freeDay = extractFreeDay(trimmed);
    const sections = Array.from(new Set(classes.map(c => c.slice(1))));

    return {
      id: `doc-${Date.now()}-${index}`,
      name: name.replace(/[,;]/g, '').trim(),
      email,
      subjects,
      maxHoursPerWeek: hours,
      coExternalHours: coHours > 0 ? coHours : undefined,
      assignedClassIds: classes,
      assignedSections: sections,
      requiresDoubleHours: requiresDouble,
      carpoolEnabled: carpool,
      carpoolPartnerName: carpoolPartner,
      freeDayPreference: freeDay,
      maxGapHours: 2,
      specialRequirements: trimmed.length > 5 ? trimmed : undefined
    };
  };

  // Handle parsing pasted text
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setParseError('Incolla del testo da Word o una riga prima di avviare l\'importazione.');
      return;
    }
    setParseError(null);
    setIsParsing(true);

    try {
      const lines = pastedText.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
      const results: ParsedTeacherRow[] = [];

      lines.forEach((line, idx) => {
        const parsed = parseLineToTeacher(line, idx);
        if (parsed && parsed.name) {
          results.push(parsed);
        }
      });

      if (results.length === 0) {
        setParseError('Non è stato possibile identificare docenti validi nel testo incollato. Verifica il formato o usa l\'inserimento manuale.');
      } else {
        setParsedRows(results);
      }
    } catch (err) {
      setParseError('Errore durante l\'analisi del testo incollato.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle File Upload (.xlsx, .xls, .csv, .txt)
  const handleFileUpload = (file: File) => {
    setParseError(null);
    setIsParsing(true);

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r\n|\n/).filter(Boolean);
          const results: ParsedTeacherRow[] = [];
          lines.forEach((line, idx) => {
            const parsed = parseLineToTeacher(line, idx);
            if (parsed && parsed.name) {
              results.push(parsed);
            }
          });
          if (results.length === 0) {
            setParseError(`Nessun dato trovato nel file ${file.name}`);
          } else {
            setParsedRows(results);
          }
        } catch (err) {
          setParseError(`Errore nella lettura del file CSV: ${String(err)}`);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      // Excel (.xlsx, .xls)
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const results: ParsedTeacherRow[] = [];
          jsonRows.forEach((rowArray: any[], idx) => {
            if (!rowArray || rowArray.length === 0) return;
            const line = rowArray.filter(cell => cell !== undefined && cell !== null).join(' | ');
            const parsed = parseLineToTeacher(line, idx);
            if (parsed && parsed.name) {
              results.push(parsed);
            }
          });

          if (results.length === 0) {
            setParseError(`Nessun docente valido trovato nel foglio "${firstSheetName}".`);
          } else {
            setParsedRows(results);
          }
        } catch (err) {
          setParseError(`Errore nel caricamento del file Excel: ${String(err)}`);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Add empty row for manual typing
  const handleAddNewManualRow = () => {
    const newRow: ParsedTeacherRow = {
      id: `doc-${Date.now()}-${parsedRows.length}`,
      name: 'Nuovo Docente',
      email: 'docente@istruzione.it',
      subjects: ['Italiano', 'Storia'],
      maxHoursPerWeek: 18,
      assignedClassIds: ['1A', '2A', '3A'],
      assignedSections: ['A'],
      requiresDoubleHours: false,
      carpoolEnabled: false,
      maxGapHours: 2
    };
    setParsedRows(prev => [...prev, newRow]);
  };

  // Update a field on a parsed row
  const handleUpdateRowField = (index: number, field: keyof ParsedTeacherRow, value: any) => {
    setParsedRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove parsed row
  const removeParsedRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Convert parsed rows to final Teacher objects and submit
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const newTeachers: Teacher[] = parsedRows.map((r, i) => {
      const defaultAvail: Record<string, boolean[]> = {};
      DAYS.forEach(d => {
        if (r.coExternalHours && r.coExternalHours > 0) {
          defaultAvail[d] = (d === 'Lunedì' || d === 'Mercoledì' || d === 'Venerdì')
            ? [true, true, true, true, true, true, true, true]
            : [false, false, false, false, false, false, false, false];
        } else {
          defaultAvail[d] = [true, true, true, true, true, true, true, true];
        }
      });

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#A855F7', '#6366F1'];
      const color = colors[i % colors.length];

      return {
        id: `t-imp-${Date.now()}-${i}`,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        subjects: r.subjects,
        maxHoursPerWeek: r.maxHoursPerWeek,
        maxHoursPerDay: Math.min(5, Math.ceil(r.maxHoursPerWeek / 4)),
        maxGapHours: r.maxGapHours !== undefined ? r.maxGapHours : 2,
        freeDayPreference: r.freeDayPreference,
        carpoolGroupId: r.carpoolEnabled ? `carpool-${Date.now()}-${i}` : undefined,
        carpoolWithTeacherIds: [],
        availability: defaultAvail,
        color,
        assignedClassIds: r.assignedClassIds,
        assignedSections: r.assignedSections,
        requiresDoubleHours: r.requiresDoubleHours,
        coExternalHours: r.coExternalHours,
        specialRequirements: r.specialRequirements
      };
    });

    onImportTeachers(newTeachers, replaceAll);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl my-6">
        {/* Header with Torna Indietro */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              id="btn-back-import-teachers"
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm mr-1"
              title="Torna alla schermata precedente"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Torna Indietro</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Importazione & Dettagli Docenti (Excel, Word, CSV o Copia-Incolla)
              </h3>
              <p className="text-xs text-slate-400">
                Incolla o carica qualsiasi formato con nome, email, materie abilitate, classi assegnate e ore settimanali.
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

        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-slate-700 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>Copia e Incolla da Word / Testo / Email</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Carica File (.xlsx, .xls, .csv, .txt)</span>
          </button>
        </div>

        {/* Tab 1: Copy-Paste */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Scrivi o Incolla il testo dei docenti con tutti i dettagli:
              </label>
              <button
                type="button"
                onClick={() => setPastedText(
`ANELLO ANELLO.CHIARA@ISTRUZIONE.IT MATERIE ABILITATE ITALIANO E STORIA, ASSEGNATO ALLE CLASSI 1A,3A,1B E SEZ C, ORE SETTIMANALI 18 ORE
ROSSI MARCO.ROSSI@ISTRUZIONE.IT MATERIE ABILITATE MATEMATICA E SCIENZE, ASSEGNATO ALLE CLASSI 1A,2A,3A, ORE SETTIMANALI 18 ORE
BIANCHI LAURA.BIANCHI@ISTRUZIONE.IT MATERIE ABILITATE SCIENZE MOTORIE, ASSEGNATO ALLE CLASSI 1B,2B,3B, ORE SETTIMANALI 18 ORE, 2 ORE CONSECUTIVE CAMPETTI
VERDI ANTONIO.VERDI@ISTRUZIONE.IT MATERIE ABILITATE INGLESE, ASSEGNATO ALLE CLASSI 1A,1B,2A,2B, ORE SETTIMANALI 18 ORE, AUTO CON ROSSI`
                )}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
              >
                Incolla formato d'esempio richiesto
              </button>
            </div>

            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Esempio richiesto:
ANELLO ANELLO.CHIARA@ISTRUZIONE.IT MATERIE ABILITATE ITALIANO E STORIA, ASSEGNATO ALLE CLASSI 1A,3A,1B E SEZ C, ORE SETTIMANALI 18 ORE"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl p-3.5 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
            />

            <button
              onClick={handleParsePastedText}
              disabled={isParsing || !pastedText.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analizza e Carica Docenti nella Posizione Corretta</span>
            </button>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              dragOver
                ? 'border-indigo-500 bg-indigo-950/30'
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              id="file-upload-input"
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Trascina qui il file Excel o Word oppure clicca per selezionarlo
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Supporta fogli Excel (.xlsx, .xls), file CSV e documenti con i dettagli cattedra.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Error message */}
        {parseError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parsed and Editable Preview Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">
                Tabella Dati Docenti ({parsedRows.length} Docenti Pronti)
              </h4>
            </div>
            
            <button
              type="button"
              onClick={handleAddNewManualRow}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Aggiungi Docente Manuale</span>
            </button>
          </div>

          {parsedRows.length > 0 ? (
            <div className="overflow-x-auto max-h-72 border border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 sticky top-0 text-slate-300 border-b border-slate-700 font-semibold z-10">
                  <tr>
                    <th className="p-2.5 min-w-[140px]">Cognome e Nome</th>
                    <th className="p-2.5 min-w-[170px]">Email</th>
                    <th className="p-2.5 min-w-[150px]">Materie Abilitate</th>
                    <th className="p-2.5 min-w-[150px]">Classi / Sezioni</th>
                    <th className="p-2.5 w-20">Ore Sett.</th>
                    <th className="p-2.5 w-24">Max Buchi</th>
                    <th className="p-2.5 text-right w-16">Elimina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-900/40">
                  {parsedRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-800/60">
                      {/* Name input */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleUpdateRowField(idx, 'name', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Email input */}
                      <td className="p-2">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => handleUpdateRowField(idx, 'email', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Subjects input */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.subjects.join(', ')}
                          onChange={(e) => handleUpdateRowField(idx, 'subjects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="es. Italiano, Storia"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Classes input */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.assignedClassIds.join(', ')}
                          onChange={(e) => {
                            const val = e.target.value;
                            const cls = extractClassIds(val);
                            handleUpdateRowField(idx, 'assignedClassIds', cls.length > 0 ? cls : val.split(',').map(c => c.trim()).filter(Boolean));
                          }}
                          placeholder="es. 1A, 3A, 1B, 1C..."
                          className="w-full bg-slate-800 border border-slate-700 text-indigo-300 rounded px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Hours input */}
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={row.maxHoursPerWeek}
                          onChange={(e) => handleUpdateRowField(idx, 'maxHoursPerWeek', parseInt(e.target.value, 10) || 18)}
                          className="w-16 bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Max Gap Hours Select */}
                      <td className="p-2">
                        <select
                          value={row.maxGapHours !== undefined ? row.maxGapHours : 2}
                          onChange={(e) => handleUpdateRowField(idx, 'maxGapHours', parseInt(e.target.value, 10))}
                          className="bg-slate-800 border border-slate-700 text-amber-300 rounded px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value={0}>0 buchi</option>
                          <option value={1}>1 buco</option>
                          <option value={2}>2 buchi</option>
                          <option value={3}>3 buchi</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeParsedRow(idx)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Rimuovi docente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-700 rounded-xl text-slate-400 text-xs">
              Nessun docente ancora in tabella. Incolla il testo sopra oppure clicca su "+ Aggiungi Docente Manuale".
            </div>
          )}

          {/* Import options and confirmation bar */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                <input
                  type="radio"
                  name="importMode"
                  checked={!replaceAll}
                  onChange={() => setReplaceAll(false)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Aggiungi ai docenti esistenti ({existingTeachersCount} in plesso)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-rose-300 font-medium">
                <input
                  type="radio"
                  name="importMode"
                  checked={replaceAll}
                  onChange={() => setReplaceAll(true)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>Sostituisci l'intero organico con questi {parsedRows.length} docenti</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Torna Indietro</span>
              </button>
              <button
                id="btn-confirm-import-teachers"
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Conferma e Salva ({parsedRows.length} Docenti)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
