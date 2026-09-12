export type DayOfWeek = 'Lunedì' | 'Martedì' | 'Mercoledì' | 'Giovedì' | 'Venerdì' | 'Sabato';

export interface TeacherAvailability {
  // DayOfWeek -> array of boolean representing availability for each hour (0 to 7)
  [day: string]: boolean[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subjects: string[]; // Standard school subjects from dropdown
  maxHoursPerWeek: number;
  maxHoursPerDay: number;
  maxGapHours?: number; // Massimo ore buche consentite (0 buchi, 1, 2, 3...)
  freeDayPreference?: DayOfWeek; // Giorno libero preferito
  carpoolGroupId?: string; // ID gruppo auto condivisa
  carpoolWithTeacherIds?: string[]; // IDs dei colleghi con cui condivide l'auto
  availability: TeacherAvailability;
  assignedHoursCount?: number;
  color?: string;
  assignedClassIds?: string[]; // Classi specifiche es. ["1A", "3A"]
  assignedSections?: string[]; // Sezioni es. ["A", "B", "O"]
  requiresDoubleHours?: boolean; // Richiede 2 ore consecutive (es. Motoria ai campetti, Tecnologia, Arte)
  coExternalHours?: number; // Ore cattedra orario esterna (COE) in altra scuola (es. 9 ore qui + 9 altrove)
  specialRequirements?: string; // Esigenze particolari / note
}

export interface SchoolClass {
  id: string; // e.g. "1A", "2B", "2E", "3E"
  year: number; // 1, 2, 3
  section: string; // A, B, C, D, E, F, G, H, I, L, M
  room?: string; // Facoltativo / Deprecato (non presente nel plesso)
  isActive: boolean; // Se inclusa nell'orario (es. 1I e 2M escluse)
  notes?: string;
}

export interface SubjectStudyPlan {
  subject: string;
  hoursPerWeek: number;
  teacherId?: string; // Docente principale o singolo
  teacherIds?: string[]; // Più docenti assegnati (es. cattedra condivisa, potenziamento, ~20 docenti di italiano)
  roomRequirement?: string; // Facoltativo / Deprecato
}

export interface ClassStudyPlan {
  classId: string;
  subjects: SubjectStudyPlan[];
}

export interface ScheduleSlot {
  id: string;
  classId: string;
  day: DayOfWeek;
  hour: number; // 1 to 8 (1-indexed)
  subject: string;
  teacherId: string;
  room?: string; // Facoltativo (aule non presenti)
  isLocked?: boolean; // Se bloccata dall'utente
}

export interface ScheduleTable {
  id: string;
  name: string;
  description?: string;
  hoursPerDay: number; // 3 per la prima settimana, standard 6, fino a 8
  daysCount: number; // 5 (Lun-Ven) o 6 (Lun-Sab)
  createdAt: string;
  slots: ScheduleSlot[];
  isActive?: boolean;
}

export interface GenerateScheduleTarget {
  mode: 'current_page' | 'new_page' | 'multi_pages';
  newPageName?: string;
  multiPages?: { name: string; slots: ScheduleSlot[]; hoursPerDay: number }[];
}

export interface ConflictIssue {
  id: string;
  type: 'teacher_double_booking' | 'class_double_booking' | 'room_double_booking' | 'carpool_mismatch' | 'teacher_unavailable' | 'max_hours_exceeded' | 'excessive_gaps';
  severity: 'error' | 'warning';
  title: string;
  description: string;
  day: DayOfWeek;
  hour: number;
  involvedTeacherIds?: string[];
  involvedClassIds?: string[];
  involvedSlotIds: string[];
}

export interface ResolutionOption {
  id: string;
  title: string;
  subtitle: string;
  fairnessScore: number; // 0 to 100
  carpoolScore: number; // 0 to 100
  gapHoursTotal: number; // Totale ore buche docenti
  description: string;
  actionSummary: string[];
  slots: ScheduleSlot[];
  proposedSlots?: ScheduleSlot[];
}

export interface StudentCredit {
  id: string;
  studentName: string;
  classId: string;
  pctoHoursMaturate: number;
  pctoHoursTarget: number;
  academicCreditsYear3: number; // Max 12
  academicCreditsYear4: number; // Max 13
  academicCreditsYear5: number; // Max 15
  totalCredits: number;
  averageGrade: number;
  conductGrade: number;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'substitution' | 'absence' | 'room_change' | 'timetable_update' | 'backup';
  read: boolean;
  classId?: string;
  teacherId?: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  name: string;
  auto: boolean;
  tablesCount: number;
  teachersCount: number;
  classesCount: number;
  sizeKb: number;
}

export type ActiveTab = 'orario' | 'docenti' | 'classi' | 'piano_studi' | 'analisi';
