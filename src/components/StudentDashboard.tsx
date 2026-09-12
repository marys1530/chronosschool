import React, { useState } from 'react';
import {
  GraduationCap, Award, BookOpen, Clock, Calendar, CheckCircle2,
  AlertCircle, ChevronRight, TrendingUp, Sparkles, Building2, User
} from 'lucide-react';
import { StudentCredit, ScheduleSlot, PushNotification, SchoolClass, Teacher } from '../types';
import { DAYS } from '../data/defaultData';

interface StudentDashboardProps {
  students: StudentCredit[];
  slots: ScheduleSlot[];
  notifications: PushNotification[];
  classes: SchoolClass[];
  teachers: Teacher[];
  hoursPerDay: number;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  students,
  slots,
  notifications,
  classes,
  teachers,
  hoursPerDay
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<string>('Lunedì');

  const student = students.find(s => s.id === selectedStudentId) || students[0];
  if (!student) return null;

  const studentClassSlots = slots.filter(s => s.classId === student.classId && s.hour <= hoursPerDay);
  const daySlots = studentClassSlots
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.hour - b.hour);

  const teacherMap = new Map<string, Teacher>(teachers.map(t => [t.id, t]));

  // Related notifications
  const studentNotifications = notifications.filter(n => !n.classId || n.classId === student.classId);

  // PCTO percentage
  const pctoPercent = Math.min(100, Math.round((student.pctoHoursMaturate / student.pctoHoursTarget) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner and Student Selector */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Dashboard Studente & Crediti Scolastici
            </h2>
            <p className="text-xs text-slate-400">
              Visualizza l'orario personalizzato della tua classe, avvisi in tempo reale e monitoraggio crediti PCTO.
            </p>
          </div>
        </div>

        {/* Student Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold">Profilo Studente:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.studentName} (Classe {s.classId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards: Crediti, PCTO, Media */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Crediti Scolastici Totali */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Crediti Esame di Stato</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {student.totalCredits} <span className="text-xs text-slate-400 font-normal">/ 40 max</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
            <span>3º anno: {student.academicCreditsYear3}</span>
            <span>4º anno: {student.academicCreditsYear4}</span>
            <span>5º anno: {student.academicCreditsYear5}</span>
          </div>
        </div>

        {/* PCTO Hours */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ore PCTO Maturate</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {student.pctoHoursMaturate} <span className="text-xs text-slate-400 font-normal">/ {student.pctoHoursTarget} h</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pctoPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right">{pctoPercent}% completato</div>
        </div>

        {/* Media Voti */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Media Scolastica</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {student.averageGrade} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 flex justify-between">
            <span>Voto di Condotta:</span>
            <span className="font-bold text-white">{student.conductGrade} / 10</span>
          </div>
        </div>

        {/* Current Class Reference */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Classe di Appartenenza</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            Classe {student.classId}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
            Plesso Centrale • Aula {classes.find(c => c.id === student.classId)?.room || 'Aula Standard'}
          </div>
        </div>
      </div>

      {/* Main Grid: Daily Timetable & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Student Schedule for selected day */}
        <div className="lg:col-span-2 bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Orario Lezioni Giornaliero: {selectedDay}
            </h3>

            {/* Day Selector pills */}
            <div className="flex items-center gap-1">
              {DAYS.slice(0, 5).map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Lessons sequence */}
          <div className="space-y-2.5">
            {Array.from({ length: hoursPerDay }, (_, i) => i + 1).map(h => {
              const slot = daySlots.find(s => s.hour === h);
              const teacher = slot ? teacherMap.get(slot.teacherId) : null;

              return (
                <div
                  key={h}
                  className={`p-3 rounded-lg border flex items-center justify-between transition ${
                    slot
                      ? 'bg-slate-900/90 border-slate-700/80 hover:border-indigo-500'
                      : 'bg-slate-900/30 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                      {h}ª
                    </div>
                    <div>
                      {slot ? (
                        <>
                          <div className="font-bold text-white text-sm">{slot.subject}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {teacher?.name || 'Docente'}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-indigo-300">{slot.room}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Ora libera / Nessuna lezione</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-400">
                    {h === 1 ? '08:00 - 09:00' :
                     h === 2 ? '09:00 - 10:00' :
                     h === 3 ? '10:00 - 11:00' :
                     h === 4 ? '11:15 - 12:15' :
                     h === 5 ? '12:15 - 13:15' : '13:15 - 14:15'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Real-time Bulletin / Alerts for this student */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Bacheca Avvisi & Cambi Orario
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Tempo Reale
            </span>
          </div>

          <div className="space-y-2.5">
            {studentNotifications.map(n => (
              <div
                key={n.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{n.title}</span>
                  <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px]">{n.message}</p>
              </div>
            ))}

            {studentNotifications.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nessun avviso o variazione al momento per la tua classe.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
