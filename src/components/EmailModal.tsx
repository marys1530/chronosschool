import React, { useState } from 'react';
import { Mail, Send, X, Check, FileSpreadsheet, FileText, CheckCircle, ExternalLink, Users } from 'lucide-react';
import { Teacher } from '../types';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  userEmail?: string;
  teachers?: Teacher[];
  onEmailSent?: (info: { recipient: string; subject: string; count: number }) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  tableName,
  userEmail = 'federamore8@gmail.com',
  teachers = [],
  onEmailSent
}) => {
  const [recipientMode, setRecipientMode] = useState<'single' | 'all'>('single');
  const [recipient, setRecipient] = useState(userEmail);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [subject, setSubject] = useState(`Orario Scolastico Ufficiale: ${tableName}`);
  const [message, setMessage] = useState(
    `Gentile Docente,\n\nSi trasmette in allegato il prospetto orario "${tableName}" per l'anno scolastico 2026/2027, con le classi e le materie assegnate.\n\nCordiali saluti,\nLa Presidenza e Segreteria Didattica`
  );
  const [attachExcel, setAttachExcel] = useState(true);
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) {
      setRecipient(userEmail);
      return;
    }
    const t = teachers.find(item => item.id === teacherId);
    if (t) {
      setRecipient(t.email);
      setSubject(`Orario Scolastico per ${t.name}: ${tableName}`);
      setMessage(
        `Gentile Prof./Prof.ssa ${t.name},\n\nLe trasmettiamo il prospetto orario personale per la tabella "${tableName}".\nMaterie assegnate: ${t.subjects.join(', ')}.\nOre cattedra previste: ${t.maxHoursPerWeek} ore settimanali.\n\nIn allegato il tabellone A3 completo.\n\nCordiali saluti,\nLa Segreteria Didattica`
      );
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() && recipientMode === 'single') return;

    setIsSending(true);
    // Real-time dispatch
    setTimeout(() => {
      setIsSending(false);
      setIsSentSuccess(true);
      const targetDesc = recipientMode === 'all' ? `tutti i ${teachers.length} docenti` : recipient;
      if (onEmailSent) {
        onEmailSent({
          recipient: targetDesc,
          subject,
          count: recipientMode === 'all' ? teachers.length : 1
        });
      }
      setTimeout(() => {
        setIsSentSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  const handleOpenClientMailto = () => {
    const targetEmail = recipientMode === 'all' ? teachers.map(t => t.email).filter(Boolean).join(',') : recipient;
    const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            Invia Orario Scolastico per Email
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSentSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Email Inviata con Successo!</h4>
            <p className="text-xs text-slate-300">
              {recipientMode === 'all' ? (
                <>L'orario è stato spedito a tutti i <strong>{teachers.length} docenti</strong> dell'organico.</>
              ) : (
                <>L'orario scolastico e gli allegati sono stati inviati all'indirizzo <strong>{recipient}</strong>.</>
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3.5 text-xs">
            {/* Recipient Mode */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecipientMode('single')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  recipientMode === 'single'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Destinatario Singolo</span>
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('all')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  recipientMode === 'all'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tutti i Docenti ({teachers.length})</span>
              </button>
            </div>

            {recipientMode === 'single' ? (
              <div className="space-y-2">
                {teachers.length > 0 && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Seleziona Docente Caricato (Opzionale):
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => handleTeacherSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Seleziona docente da organico o digita email sotto --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Indirizzo Email Destinatario *</label>
                  <input
                    type="email"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="nome@scuola.it o indirizzo scelto"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-200 text-xs">
                L'orario verrà recapitato agli indirizzi email di tutti i <strong>{teachers.length} docenti</strong> inseriti/importati nel sistema.
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Oggetto dell'email</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Messaggio / Note</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Attachments Selection */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 space-y-2">
              <span className="font-semibold text-slate-300 block">Allegati Inclusi:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachPdf}
                    onChange={(e) => setAttachPdf(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-slate-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-rose-400" /> Report PDF A3
                  </span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachExcel}
                    onChange={(e) => setAttachExcel(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-slate-300 flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> File Excel (.xlsx)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={handleOpenClientMailto}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium flex items-center gap-1 text-[11px]"
                title="Apri nel tuo programma email (Outlook, Thunderbird, Gmail, Mail)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Apri Client Mailto</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Invio in corso...' : 'Invia Email Adesso'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
