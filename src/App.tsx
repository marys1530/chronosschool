import React, { useState, useMemo, useEffect } from 'react';
import {
  DEFAULT_TEACHERS,
  DEFAULT_CLASSES,
  DEFAULT_TABLES,
  DEFAULT_STUDY_PLANS,
  DEFAULT_STUDENTS,
  DEFAULT_NOTIFICATIONS
} from './data/defaultData';
import {
  ScheduleTable,
  Teacher,
  SchoolClass,
  ClassStudyPlan,
  StudentCredit,
  PushNotification,
  ActiveTab,
  ScheduleSlot,
  ResolutionOption,
  DayOfWeek,
  GenerateScheduleTarget
} from './types';
import {
  detectScheduleConflicts,
  generateResolutionOptions,
  calculateFairnessScore,
  calculateCarpoolScore,
  resolveAllConflictsAutomatically
} from './utils/solver';
import { exportScheduleToExcel, exportActiveViewToExcel } from './utils/exportUtils';
import { DAYS } from './data/defaultData';
import { SupportedLanguage } from './utils/translations';

// Components
import { Navbar } from './components/Navbar';
import { ScheduleGrid } from './components/ScheduleGrid';
import { TeachersManager } from './components/TeachersManager';
import { ClassesManager } from './components/ClassesManager';
import { StudyPlanManager } from './components/StudyPlanManager';
import { NewTableModal } from './components/NewTableModal';
import { GenerateScheduleModal } from './components/GenerateScheduleModal';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { PrintReportModal } from './components/PrintReportModal';
import { EmailModal } from './components/EmailModal';
import { AnalyticsAndBackupModal } from './components/AnalyticsAndBackupModal';
import { InteractiveTutorialModal } from './components/InteractiveTutorialModal';
import { ImportTeachersModal } from './components/ImportTeachersModal';
import {
  Calendar, Wand2, Printer, Mail, HelpCircle, ShieldCheck,
  CheckCircle2, Bell, X, Info, Plus, Layers, FileSpreadsheet,
  Sparkles, Zap, Trash2
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [tables, setTables] = useState<ScheduleTable[]>(() => {
    const saved = localStorage.getItem('chronos_tables_v2');
    return saved ? JSON.parse(saved) : DEFAULT_TABLES;
  });

  const [activeTableId, setActiveTableId] = useState<string>(() => {
    return tables[0]?.id || 'tbl-1';
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('chronos_teachers_v2');
    return saved ? JSON.parse(saved) : DEFAULT_TEACHERS;
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem('chronos_classes_v2');
    return saved ? JSON.parse(saved) : DEFAULT_CLASSES;
  });

  const [studyPlans, setStudyPlans] = useState<ClassStudyPlan[]>(() => {
    const saved = localStorage.getItem('chronos_study_plans_v2');
    return saved ? JSON.parse(saved) : DEFAULT_STUDY_PLANS;
  });

  const [students, setStudents] = useState<StudentCredit[]>(DEFAULT_STUDENTS);
  const [notifications, setNotifications] = useState<PushNotification[]>(DEFAULT_NOTIFICATIONS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('orario');
  const [lang, setLang] = useState<SupportedLanguage>('it');
  const [darkMode, setDarkMode] = useState(true);

  // Modals state
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [isGenerateScheduleModalOpen, setIsGenerateScheduleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<ScheduleTable | null>(null);

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('chronos_tables_v2', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('chronos_teachers_v2', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('chronos_classes_v2', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('chronos_study_plans_v2', JSON.stringify(studyPlans));
  }, [studyPlans]);

  // Current active table
  const activeTable = useMemo(() => {
    return tables.find(t => t.id === activeTableId) || tables[0];
  }, [tables, activeTableId]);

  // Active slots filtered by table's hoursPerDay
  const activeSlots = useMemo(() => {
    return activeTable?.slots || [];
  }, [activeTable]);

  // Conflict Detection
  const conflicts = useMemo(() => {
    if (!activeTable) return [];
    return detectScheduleConflicts(activeSlots, teachers, classes, activeTable.hoursPerDay);
  }, [activeSlots, teachers, classes, activeTable]);

  // Conflict resolution proposals
  const resolutionOptions = useMemo(() => {
    if (!activeTable) return [];
    return generateResolutionOptions(activeSlots, teachers, classes, activeTable.hoursPerDay);
  }, [activeSlots, teachers, classes, activeTable]);

  // Key performance indicators
  const fairnessScore = useMemo(() => {
    if (!activeTable) return 100;
    const res = calculateFairnessScore(activeSlots, teachers, activeTable.hoursPerDay);
    return typeof res === 'number' ? res : res.score;
  }, [activeSlots, teachers, activeTable]);

  const carpoolScore = useMemo(() => {
    if (!activeTable) return 100;
    return calculateCarpoolScore(activeSlots, teachers, activeTable.hoursPerDay);
  }, [activeSlots, teachers, activeTable]);

  const totalGaps = useMemo(() => {
    let count = 0;
    teachers.forEach(t => {
      ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'].forEach(day => {
        const hours = activeSlots
          .filter(s => s.teacherId === t.id && s.day === day && s.hour <= activeTable.hoursPerDay)
          .map(s => s.hour)
          .sort((a, b) => a - b);
        if (hours.length > 1) {
          const min = hours[0];
          const max = hours[hours.length - 1];
          count += (max - min + 1) - hours.length;
        }
      });
    });
    return count;
  }, [activeSlots, teachers, activeTable]);

  // TABLE OPERATIONS
  const handleSelectTable = (id: string) => {
    setActiveTableId(id);
  };

  const handleChangeHoursPerDay = (hours: number) => {
    setTables(prev =>
      prev.map(tbl => (tbl.id === activeTableId ? { ...tbl, hoursPerDay: hours } : tbl))
    );
    setBannerNotice(`Orario aggiornato su ${hours} ore giornaliere per ${activeTable.name}`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  // CREATE NEW TABLE (Solves user reported bug)
  const handleCreateNewTable = (
    name: string,
    hoursPerDay: number,
    copyPreviousSlots: boolean,
    keepTeachers: boolean,
    description?: string
  ) => {
    const newId = `tbl-${Date.now()}`;
    const newSlots: ScheduleSlot[] = copyPreviousSlots
      ? JSON.parse(JSON.stringify(activeSlots.filter(s => s.hour <= hoursPerDay)))
      : []; // Strictly empty when copy is unchecked!

    const newTable: ScheduleTable = {
      id: newId,
      name,
      description: description || (hoursPerDay === 3 ? 'Orario 1ª Settimana (3 ore)' : 'Orario scolastico'),
      hoursPerDay,
      daysCount: 5,
      isActive: true,
      slots: newSlots,
      createdAt: new Date().toISOString()
    };

    if (!keepTeachers) {
      // User chose clean page without teachers
      setTeachers([]);
    }

    setTables(prev => [newTable, ...prev]);
    setActiveTableId(newId);
    setBannerNotice(`Nuova tabella "${name}" creata con successo (${newSlots.length} lezioni iniziali)`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // DELETE / CLOSE SCHEDULE PAGE (Solves user reported bug where pages could not be closed)
  const handleDeleteTable = (tableId: string) => {
    const tableTarget = tables.find(t => t.id === tableId);
    if (!tableTarget) return;

    if (tables.length <= 1) {
      // If it's the only page, reset its slots cleanly rather than leaving an empty state
      const resetTable: ScheduleTable = {
        id: `tbl-${Date.now()}`,
        name: 'Orario Principale',
        hoursPerDay: 6,
        daysCount: 5,
        slots: [],
        createdAt: new Date().toISOString()
      };
      setTables([resetTable]);
      setActiveTableId(resetTable.id);
      setTableToDelete(null);
      setBannerNotice(`Pagina orario svuotata e reimpostata.`);
      setTimeout(() => setBannerNotice(null), 3500);
      return;
    }

    const remaining = tables.filter(t => t.id !== tableId);
    setTables(remaining);
    if (activeTableId === tableId) {
      setActiveTableId(remaining[0].id);
    }
    setTableToDelete(null);
    setBannerNotice(`Pagina orario "${tableTarget.name}" eliminata con successo.`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  // GLOBAL SUBJECT RENAMING HANDLER
  const handleRenameSubjectGlobal = (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;

    // 1. Rename in all slots across all tables
    setTables(prev =>
      prev.map(tbl => ({
        ...tbl,
        slots: tbl.slots.map(s => (s.subject === oldName ? { ...s, subject: newName } : s))
      }))
    );

    // 2. Rename in teachers' subjects array
    setTeachers(prev =>
      prev.map(t => ({
        ...t,
        subjects: t.subjects.map(s => (s === oldName ? newName : s))
      }))
    );

    // 3. Rename in all study plans
    setStudyPlans(prev =>
      prev.map(plan => ({
        ...plan,
        subjects: plan.subjects.map(item => (item.subject === oldName ? { ...item, subject: newName } : item))
      }))
    );

    setBannerNotice(`Materia "${oldName}" rinominata in "${newName}" in tutto l'orario e docenti.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // SLOT OPERATIONS
  const handleUpdateSlot = (updatedSlot: ScheduleSlot) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        const exists = tbl.slots.some(s => s.id === updatedSlot.id);
        const updatedSlots = exists
          ? tbl.slots.map(s => (s.id === updatedSlot.id ? updatedSlot : s))
          : [...tbl.slots, updatedSlot];
        return { ...tbl, slots: updatedSlots };
      })
    );
  };

  const handleDeleteSlot = (slotId: string) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        return {
          ...tbl,
          slots: tbl.slots.filter(s => s.id !== slotId)
        };
      })
    );
  };

  const handleAddSlot = (newSlot: ScheduleSlot) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        return {
          ...tbl,
          slots: [...tbl.slots, newSlot]
        };
      })
    );
  };

  // ATOMIC SWAP SLOTS (Drag and drop or 1-click slot exchange)
  const handleSwapSlots = (slotAId: string, slotBId: string) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        const slotA = tbl.slots.find(s => s.id === slotAId);
        const slotB = tbl.slots.find(s => s.id === slotBId);
        if (!slotA || !slotB) return tbl;

        const dayA = slotA.day;
        const hourA = slotA.hour;

        const updatedSlots = tbl.slots.map(s => {
          if (s.id === slotAId) return { ...s, day: slotB.day, hour: slotB.hour };
          if (s.id === slotBId) return { ...s, day: dayA, hour: hourA };
          return s;
        });

        return { ...tbl, slots: updatedSlots };
      })
    );

    setBannerNotice(`Caselle scambiate con successo nel tabellone orari!`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  // MOVE SLOT (Move a lesson to empty slot)
  const handleMoveSlot = (slotId: string, targetDay: DayOfWeek, targetHour: number) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        const updatedSlots = tbl.slots.map(s => {
          if (s.id === slotId) return { ...s, day: targetDay, hour: targetHour };
          return s;
        });
        return { ...tbl, slots: updatedSlots };
      })
    );

    setBannerNotice(`Lezione spostata a ${targetDay}, ${targetHour}ª ora!`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  // 1-CLICK RESOLUTION HANDLER
  const handleApplyResolutionOption = (option: ResolutionOption) => {
    const slotsToApply = option.proposedSlots || option.slots;
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        return {
          ...tbl,
          slots: slotsToApply
        };
      })
    );

    // Add push notification
    const newNotice: PushNotification = {
      id: `notif-${Date.now()}`,
      title: 'Conflitti Risolti con Successo',
      message: `Applicata strategia "${option.title}". Equità al ${option.fairnessScore}%, carpooling al ${option.carpoolScore}%.`,
      timestamp: 'Adesso',
      read: false,
      type: 'timetable_update'
    };
    setNotifications(prev => [newNotice, ...prev]);

    setBannerNotice(`Soluzione "${option.title}" applicata con successo! Conflitti azzerati.`);
    setTimeout(() => setBannerNotice(null), 4500);
  };

  // FULL SCHEDULE GENERATION HANDLER (Supports generating different schedules in separate pages)
  const handleApplyGeneratedSlots = (
    newSlots: ScheduleSlot[],
    notice: string,
    targetConfig?: GenerateScheduleTarget
  ) => {
    if (targetConfig?.mode === 'multi_pages' && targetConfig.multiPages && targetConfig.multiPages.length > 0) {
      const newCreatedTables: ScheduleTable[] = targetConfig.multiPages.map((p, idx) => ({
        id: `tbl-${Date.now()}-${idx}`,
        name: p.name,
        hoursPerDay: p.hoursPerDay || activeTable.hoursPerDay,
        daysCount: 5,
        slots: p.slots,
        createdAt: new Date().toISOString()
      }));

      setTables(prev => [...prev, ...newCreatedTables]);
      setActiveTableId(newCreatedTables[0].id);

      const newNotice: PushNotification = {
        id: `notif-${Date.now()}`,
        title: '3 Diverse Pagine Orario Generate',
        message: `Generate con successo 3 varianti di orario in schede distinte: ${newCreatedTables.map(t => t.name).join(', ')}.`,
        timestamp: 'Adesso',
        read: false,
        type: 'timetable_update'
      };
      setNotifications(prev => [newNotice, ...prev]);

      setBannerNotice(`Generate 3 opzioni di orario in 3 pagine distinte! Puoi passare da una all'altra cliccando sui pulsanti in alto.`);
      setTimeout(() => setBannerNotice(null), 6000);
      return;
    }

    if (targetConfig?.mode === 'new_page' && targetConfig.newPageName) {
      const newId = `tbl-${Date.now()}`;
      const newTable: ScheduleTable = {
        id: newId,
        name: targetConfig.newPageName.trim() || `Orario Variante ${tables.length + 1}`,
        hoursPerDay: activeTable.hoursPerDay,
        daysCount: 5,
        slots: newSlots,
        createdAt: new Date().toISOString()
      };

      setTables(prev => [...prev, newTable]);
      setActiveTableId(newId);

      const newNotice: PushNotification = {
        id: `notif-${Date.now()}`,
        title: 'Nuova Pagina Orario Creata',
        message: `Creato nuovo orario nella nuova pagina "${newTable.name}".`,
        timestamp: 'Adesso',
        read: false,
        type: 'timetable_update'
      };
      setNotifications(prev => [newNotice, ...prev]);

      setBannerNotice(`Orario generato con successo e salvato nella nuova pagina "${newTable.name}"!`);
      setTimeout(() => setBannerNotice(null), 5500);
      return;
    }

    // Default: overwrite active table
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.id !== activeTableId) return tbl;
        return {
          ...tbl,
          slots: newSlots
        };
      })
    );

    const newNotice: PushNotification = {
      id: `notif-${Date.now()}`,
      title: 'Nuovo Orario Generato',
      message: notice,
      timestamp: 'Adesso',
      read: false,
      type: 'timetable_update'
    };
    setNotifications(prev => [newNotice, ...prev]);

    setBannerNotice(notice);
    setTimeout(() => setBannerNotice(null), 5500);
  };

  // DIRECT 1-CLICK ALL CONFLICT RESOLUTION
  const handleQuickResolveAllConflicts = () => {
    const result = resolveAllConflictsAutomatically(
      activeSlots,
      teachers,
      classes,
      activeTable.hoursPerDay
    );
    handleApplyResolutionOption(result.chosenOption);
  };

  // TEACHER OPERATIONS
  const handleAddTeacher = (newTeacher: Teacher) => {
    setTeachers(prev => [newTeacher, ...prev]);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => (t.id === updatedTeacher.id ? updatedTeacher : t)));
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const teacherObj = teachers.find(t => t.id === teacherId);
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    // Remove slots assigned to this teacher across all tables
    setTables(prev =>
      prev.map(tbl => ({
        ...tbl,
        slots: tbl.slots.filter(s => s.teacherId !== teacherId)
      }))
    );
    setBannerNotice(`Docente "${teacherObj?.name || 'Docente'}" eliminato con successo.`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleBulkDeleteTeachers = (teacherIds: string[]) => {
    setTeachers(prev => prev.filter(t => !teacherIds.includes(t.id)));
    setTables(prev =>
      prev.map(tbl => ({
        ...tbl,
        slots: tbl.slots.filter(s => !teacherIds.includes(s.teacherId))
      }))
    );
    setBannerNotice(`Eliminati con successo ${teacherIds.length} docenti.`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleDeleteAllTeachers = () => {
    setTeachers([]);
    setTables(prev =>
      prev.map(tbl => ({
        ...tbl,
        slots: []
      }))
    );
    setBannerNotice('Tutti i docenti e le assegnazioni sono stati rimossi.');
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleImportTeachers = (importedTeachers: Teacher[], replaceAll: boolean) => {
    if (replaceAll) {
      setTeachers(importedTeachers);
      setTables(prev =>
        prev.map(tbl => ({
          ...tbl,
          slots: []
        }))
      );
      setBannerNotice(`Organico docenti aggiornato con ${importedTeachers.length} nuovi docenti.`);
    } else {
      setTeachers(prev => {
        const existingNames = new Set(prev.map(t => t.name.toLowerCase()));
        const toAdd = importedTeachers.filter(t => !existingNames.has(t.name.toLowerCase()));
        return [...prev, ...toAdd];
      });
      setBannerNotice(`Importati con successo ${importedTeachers.length} docenti da file/testo.`);
    }
    setIsImportModalOpen(false);
    setTimeout(() => setBannerNotice(null), 4500);
  };

  // CLASS OPERATIONS
  const handleToggleClassActive = (classId: string) => {
    setClasses(prev =>
      prev.map(c => (c.id === classId ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleAddClass = (newClass: SchoolClass) => {
    setClasses(prev => [...prev, newClass]);
  };

  const handleUpdateClass = (updatedClass: SchoolClass) => {
    setClasses(prev => prev.map(c => (c.id === updatedClass.id ? updatedClass : c)));
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    // Remove slots assigned to this class across all tables
    setTables(prev =>
      prev.map(tbl => ({
        ...tbl,
        slots: tbl.slots.filter(s => s.classId !== classId)
      }))
    );
    // Remove class from teachers' assignedClassIds
    setTeachers(prev =>
      prev.map(t => ({
        ...t,
        assignedClassIds: (t.assignedClassIds || []).filter(cid => cid !== classId)
      }))
    );
    setBannerNotice(`Classe ${classId} eliminata dall'organico con successo.`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleRestoreAllClasses = (restoredClasses: SchoolClass[]) => {
    setClasses(prev => {
      const standardIds = new Set(restoredClasses.map(c => c.id));
      const customClasses = prev.filter(c => !standardIds.has(c.id));
      return [...restoredClasses, ...customClasses];
    });
    setBannerNotice('Ripristinate con successo tutte le classi standard delle sezioni A - M!');
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // STUDY PLAN OPERATIONS
  const handleUpdateStudyPlan = (plan: ClassStudyPlan) => {
    setStudyPlans(prev => {
      const exists = prev.some(p => p.classId === plan.classId);
      if (exists) {
        return prev.map(p => (p.classId === plan.classId ? plan : p));
      } else {
        return [...prev, plan];
      }
    });
  };

  // Context of the active schedule view (synced from ScheduleGrid)
  const [scheduleViewContext, setScheduleViewContext] = useState<{
    viewMode: 'master_teachers' | 'by_class' | 'by_teacher' | 'master';
    selectedClassId: string;
    selectedTeacherId: string;
  }>({
    viewMode: 'master_teachers',
    selectedClassId: '1A',
    selectedTeacherId: 't1'
  });

  // EXPORT EXCEL - CONTEXT AWARE TO THE ACTIVE VIEW
  const handleExportExcel = () => {
    let viewTitle = 'Tabellone Docenti (A-Z)';
    if (scheduleViewContext.viewMode === 'by_class') {
      viewTitle = `Orario Classe ${scheduleViewContext.selectedClassId}`;
    } else if (scheduleViewContext.viewMode === 'by_teacher') {
      const t = teachers.find(teach => teach.id === scheduleViewContext.selectedTeacherId);
      viewTitle = `Orario Docente ${t ? t.name : ''}`;
    } else if (scheduleViewContext.viewMode === 'master') {
      viewTitle = 'Tabellone Classi';
    }

    const ok = exportActiveViewToExcel({
      viewMode: scheduleViewContext.viewMode,
      selectedClassId: scheduleViewContext.selectedClassId,
      selectedTeacherId: scheduleViewContext.selectedTeacherId,
      slots: activeSlots,
      teachers,
      classes,
      days: DAYS,
      hoursPerDay: activeTable.hoursPerDay,
      tableName: activeTable.name
    });

    if (ok) {
      setBannerNotice(`${viewTitle} esportato in formato Excel (.xlsx)! Download completato.`);
      setTimeout(() => setBannerNotice(null), 4500);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Navigation & Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tables={tables}
        activeTableId={activeTableId}
        onSelectTable={handleSelectTable}
        onOpenNewTableModal={() => setIsNewTableModalOpen(true)}
        onOpenGenerateModal={() => setIsGenerateScheduleModalOpen(true)}
        onQuickResolveConflicts={handleQuickResolveAllConflicts}
        hoursPerDay={activeTable.hoursPerDay}
        onChangeHoursPerDay={handleChangeHoursPerDay}
        conflicts={conflicts}
        onOpenConflictModal={() => setIsConflictModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onExportExcel={handleExportExcel}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        lang={lang}
        onChangeLang={setLang}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        fairnessScore={fairnessScore}
        carpoolScore={carpoolScore}
      />

      {/* Dynamic Toast / Notice Banner */}
      {bannerNotice && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{bannerNotice}</span>
          <button onClick={() => setBannerNotice(null)} className="p-0.5 hover:bg-indigo-700 rounded ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-time Notifications Popover */}
      {isNotificationsOpen && (
        <div className="max-w-md w-full fixed top-20 right-4 z-50 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              Notifiche & Variazioni Orario ({notifications.length})
            </h4>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-2.5 rounded-lg text-xs border ${
                  !n.read ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-slate-800/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{n.title}</span>
                  <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between">
            <button
              onClick={() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
            >
              Segna tutte come lette
            </button>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Horizontal Table Switcher & New Table (+) Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 pl-1 shrink-0">
              <Layers className="w-4 h-4 text-indigo-400" />
              Pagine Orario:
            </span>
            {tables.map(tbl => (
              <div
                key={tbl.id}
                className={`flex items-center rounded-lg border transition ${
                  tbl.id === activeTableId
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectTable(tbl.id)}
                  className="px-3 py-1.5 text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>{tbl.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    tbl.id === activeTableId ? 'bg-indigo-900/80 text-indigo-200' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {tbl.hoursPerDay}h
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTableToDelete(tbl);
                  }}
                  className={`p-1.5 mr-1 rounded hover:bg-rose-950/80 hover:text-rose-300 transition cursor-pointer ${
                    tbl.id === activeTableId ? 'text-indigo-200 hover:text-white' : 'text-slate-400'
                  }`}
                  title={`Chiudi / Elimina pagina "${tbl.name}" (Tasto X)`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Quick + Button for New Page / Table */}
            <button
              id="btn-quick-add-page-main"
              onClick={() => setIsNewTableModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
              title="Aggiungi una nuova pagina/tabella (es. Orario Docenti di Sostegno, 1ª Settimana, ecc.)"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuova Pagina / Tabella (es. Sostegno)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Importa docenti da Excel, Word o PDF"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Importa Docenti</span>
            </button>
          </div>
        </div>

        {/* Quick Guide & Action Bar when on Orario Tab */}
        {activeTab === 'orario' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-300">
                Stai visualizzando: <strong className="text-white">{activeTable.name}</strong> •{' '}
                <span className="text-indigo-400 font-bold">{activeTable.hoursPerDay} ore/giorno</span>
                {activeTable.hoursPerDay === 3 && (
                  <span className="ml-2 text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    1ª Settimana Ridotta (3 ore)
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-generate-schedule-bar"
                onClick={() => setIsGenerateScheduleModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 text-xs transition cursor-pointer"
                title="Genera orario completo per tutte le classi garantendo equità ore buche e rotazione orari"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>✨ Genera Orario</span>
              </button>

              <button
                id="btn-resolve-conflicts-bar"
                onClick={() => setIsConflictModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm text-xs transition cursor-pointer ${
                  conflicts.length > 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Risolvi Conflitti ({conflicts.length})</span>
              </button>

              {conflicts.length > 0 && (
                <button
                  id="btn-quick-resolve-bar"
                  onClick={handleQuickResolveAllConflicts}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm text-xs transition cursor-pointer"
                  title="Risolvi automaticamente tutti i conflitti con la strategia Massima Equità in 1 solo click"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ Risolvi Subito Tutto (1-Click)</span>
                </button>
              )}

              <button
                id="btn-actionbar-export-excel"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-700/90 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1.5 border border-emerald-500/80 text-xs shadow-sm cursor-pointer transition"
                title="Esporta subito la schermata aperta in formato Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Esporta Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-700 text-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Stampa PDF
              </button>

              <button
                onClick={() => setIsTutorialModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-700 text-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Guida Tutorial
              </button>

              <button
                type="button"
                onClick={() => setTableToDelete(activeTable)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title={`Elimina o chiudi la tabella/pagina orario corrente (${activeTable.name})`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Elimina Questa Tabella</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Orario Grid */}
        {activeTab === 'orario' && (
          <ScheduleGrid
            slots={activeSlots}
            teachers={teachers}
            classes={classes}
            hoursPerDay={activeTable.hoursPerDay}
            conflicts={conflicts}
            tableName={activeTable.name}
            onUpdateSlot={handleUpdateSlot}
            onDeleteSlot={handleDeleteSlot}
            onAddSlot={handleAddSlot}
            onSwapSlots={handleSwapSlots}
            onMoveSlot={handleMoveSlot}
            onViewChange={(viewMode, classId, teacherId) => {
              setScheduleViewContext({ viewMode, selectedClassId: classId, selectedTeacherId: teacherId });
            }}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />
        )}

        {/* Tab 2: Gestione Docenti */}
        {activeTab === 'docenti' && (
          <TeachersManager
            teachers={teachers}
            classes={classes}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onBulkDeleteTeachers={handleBulkDeleteTeachers}
            onDeleteAllTeachers={handleDeleteAllTeachers}
            onOpenConflictResolution={() => setIsConflictModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}

        {/* Tab 3: Gestione Classi */}
        {activeTab === 'classi' && (
          <ClassesManager
            classes={classes}
            onToggleClassActive={handleToggleClassActive}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onRestoreAllClasses={handleRestoreAllClasses}
          />
        )}

        {/* Tab 4: Piani di Studio (Fully Editable) */}
        {activeTab === 'piano_studi' && (
          <StudyPlanManager
            classes={classes}
            teachers={teachers}
            studyPlans={studyPlans}
            onUpdateStudyPlan={handleUpdateStudyPlan}
            onRenameSubjectGlobal={handleRenameSubjectGlobal}
            onApplyPlanToSchedule={(classId) => {
              setBannerNotice(`Piano di studio applicato all'orario per la classe ${classId}!`);
              setTimeout(() => setBannerNotice(null), 3500);
            }}
          />
        )}

        {/* Tab 5: Analisi & Performance */}
        {activeTab === 'analisi' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
              <h2 className="text-xl font-bold text-white mb-2">Cruscotto Analitico d'Istituto</h2>
              <p className="text-xs text-slate-400">
                Monitoraggio in tempo reale di carichi orari, allineamento mobilità sostenibile (auto condivisa) e utilizzo aule.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
                <div className="text-xs text-slate-400 font-semibold">Indice di Equità Oraria</div>
                <div className="text-3xl font-black text-emerald-400 mt-2">{fairnessScore}%</div>
                <p className="text-xs text-slate-400 mt-2">
                  Misura il bilanciamento delle cattedre tra i docenti dell'istituto e l'assenza di sovraccarichi giornalieri.
                </p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
                <div className="text-xs text-slate-400 font-semibold">Sincronizzazione Auto Condivisa</div>
                <div className="text-3xl font-black text-sky-400 mt-2">{carpoolScore}%</div>
                <p className="text-xs text-slate-400 mt-2">
                  Percentuale di coincidenza delle fasce orarie per i docenti con carpooling abilitato.
                </p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
                <div className="text-xs text-slate-400 font-semibold">Ore Buche Totali</div>
                <div className="text-3xl font-black text-amber-400 mt-2">{totalGaps} ore</div>
                <p className="text-xs text-slate-400 mt-2">
                  Totale ore di attesa tra lezioni consecutive per tutti i docenti.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConflictModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Wand2 className="w-4 h-4" /> Ottimizza Automaticamente
              </button>
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Backup & Sicurezza Cloud
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewTableModal
        isOpen={isNewTableModalOpen}
        onClose={() => setIsNewTableModalOpen(false)}
        currentTable={activeTable}
        onCreateTable={handleCreateNewTable}
      />

      <GenerateScheduleModal
        isOpen={isGenerateScheduleModalOpen}
        onClose={() => setIsGenerateScheduleModalOpen(false)}
        activeTable={activeTable}
        tables={tables}
        teachers={teachers}
        classes={classes}
        onApplyGeneratedSlots={handleApplyGeneratedSlots}
      />

      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={conflicts}
        options={resolutionOptions}
        onApplyOption={handleApplyResolutionOption}
        teachers={teachers}
        classes={classes}
        hoursPerDay={activeTable.hoursPerDay}
        currentSlots={activeSlots}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        slots={activeSlots}
        teachers={teachers}
        classes={classes}
        hoursPerDay={activeTable.hoursPerDay}
        tableName={activeTable.name}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        tableName={activeTable.name}
        teachers={teachers}
        onEmailSent={(info) => {
          setBannerNotice(`Email inviata con successo a ${info.recipient}! Orario "${activeTable.name}" recapitato.`);
          setTimeout(() => setBannerNotice(null), 5000);
        }}
      />

      <ImportTeachersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportTeachers={handleImportTeachers}
        existingTeachersCount={teachers.length}
      />

      <AnalyticsAndBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tables={tables}
        teachers={teachers}
        classes={classes}
        fairnessScore={fairnessScore}
        carpoolScore={carpoolScore}
        totalGaps={totalGaps}
        onRestoreSnapshot={(data) => {
          if (data.tables) setTables(data.tables);
          if (data.teachers) setTeachers(data.teachers);
          if (data.classes) setClasses(data.classes);
        }}
      />

      <InteractiveTutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />

      {/* Confirmation Modal to Delete/Close a Schedule Page / Table */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Elimina Pagina Orario</h3>
                <p className="text-xs text-rose-300">Conferma chiusura ed eliminazione definitiva</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Sei sicuro di voler chiudere ed eliminare la pagina orario{' '}
              <strong className="text-white font-semibold">"{tableToDelete.name}"</strong>?
              {tables.length <= 1 ? (
                <span className="block mt-2 text-amber-300 text-xs">
                  Nota: Questa è l'unica pagina rimasta; l'orario verrà svuotato e reimpostato come pagina principale vuota.
                </span>
              ) : (
                <span className="block mt-2 text-slate-400 text-xs">
                  Tutte le {tableToDelete.slots.length} lezioni contenute in questa tabella verranno rimosse.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTable(tableToDelete.id)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sì, Elimina Pagina</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
