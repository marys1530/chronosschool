import { Teacher, SchoolClass, ClassStudyPlan, ScheduleTable, DayOfWeek, StudentCredit, PushNotification } from '../types';

export const MIDDLE_SCHOOL_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M'];

export const ALL_SCHOOL_SUBJECTS = [
  'Italiano',
  'Storia',
  'Geografia',
  'Matematica',
  'Scienze',
  'Inglese',
  'Francese',
  'Tecnologia',
  'Arte e Immagine',
  'Scienze Motorie e Sportive',
  'Musica',
  'Religione Cattolica',
  'Sostegno',
  'Informatica'
];

export const MIDDLE_SCHOOL_SUBJECTS = [
  'Italiano',
  'Storia',
  'Geografia',
  'Matematica',
  'Scienze',
  'Inglese',
  'Francese',
  'Tecnologia',
  'Arte e Immagine',
  'Scienze Motorie e Sportive',
  'Musica',
  'Religione Cattolica',
  'Sostegno'
];

export const SCHOOL_ROOMS = [
  'Aula Standard'
];

export const DAYS: DayOfWeek[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const createDefaultAvailability = () => {
  const avail: Record<string, boolean[]> = {};
  DAYS.forEach(day => {
    avail[day] = [true, true, true, true, true, true, true, true];
  });
  return avail;
};

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Prof. Marco Rossi',
    email: 'marco.rossi@scuola.it',
    phone: '+39 340 1234567',
    subjects: ['Italiano', 'Storia', 'Geografia'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Sabato',
    carpoolGroupId: 'carpool-1',
    carpoolWithTeacherIds: ['t2'],
    color: '#3B82F6',
    availability: createDefaultAvailability(),
    assignedClassIds: ['2E', '3E'], // Non tutta la sezione E: solo 2E e 3E
    assignedSections: ['E']
  },
  {
    id: 't2',
    name: 'Prof.ssa Laura Bianchi',
    email: 'laura.bianchi@scuola.it',
    phone: '+39 349 7654321',
    subjects: ['Italiano', 'Storia', 'Geografia'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 5,
    freeDayPreference: 'Sabato',
    carpoolGroupId: 'carpool-1',
    carpoolWithTeacherIds: ['t1'],
    color: '#10B981',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A'],
    assignedSections: ['A']
  },
  {
    id: 't3',
    name: 'Prof. Giuseppe Verdi',
    email: 'giuseppe.verdi@scuola.it',
    phone: '+39 333 9988776',
    subjects: ['Matematica', 'Scienze'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Mercoledì',
    carpoolGroupId: 'carpool-2',
    carpoolWithTeacherIds: ['t4'],
    color: '#F59E0B',
    availability: createDefaultAvailability(),
    assignedClassIds: ['2E', '3E'],
    assignedSections: ['E']
  },
  {
    id: 't4',
    name: 'Prof.ssa Elena Russo',
    email: 'elena.russo@scuola.it',
    phone: '+39 328 1122334',
    subjects: ['Matematica', 'Scienze'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Mercoledì',
    carpoolGroupId: 'carpool-2',
    carpoolWithTeacherIds: ['t3'],
    color: '#8B5CF6',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1B', '2B', '3B'],
    assignedSections: ['B']
  },
  {
    id: 't5',
    name: 'Prof. Roberto Ferrari',
    email: 'roberto.ferrari@scuola.it',
    phone: '+39 347 4455667',
    subjects: ['Inglese'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Venerdì',
    color: '#EC4899',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '2E', '3E'],
  },
  {
    id: 't6',
    name: 'Prof.ssa Chiara Esposito',
    email: 'chiara.esposito@scuola.it',
    phone: '+39 338 5566778',
    subjects: ['Francese'],
    maxHoursPerWeek: 16,
    maxHoursPerDay: 4,
    freeDayPreference: 'Lunedì',
    color: '#06B6D4',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '2E', '3E'],
  },
  {
    id: 't7',
    name: 'Prof. Andrea Romani',
    email: 'andrea.romani@scuola.it',
    phone: '+39 345 9900112',
    subjects: ['Scienze Motorie e Sportive'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Giovedì',
    color: '#14B8A6',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '1B', '2B', '3B', '2E', '3E'],
  },
  {
    id: 't8',
    name: 'Prof.ssa Francesca Conti',
    email: 'francesca.conti@scuola.it',
    phone: '+39 320 3344556',
    subjects: ['Arte e Immagine'],
    maxHoursPerWeek: 14,
    maxHoursPerDay: 3,
    freeDayPreference: 'Martedì',
    color: '#F97316',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '2E', '3E'],
  },
  {
    id: 't9',
    name: 'Don Matteo Riccardi',
    email: 'matteo.riccardi@scuola.it',
    phone: '+39 339 6677889',
    subjects: ['Religione Cattolica'],
    maxHoursPerWeek: 12,
    maxHoursPerDay: 3,
    color: '#64748B',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '1B', '2B', '3B', '2E', '3E'],
  },
  {
    id: 't10',
    name: 'Prof.ssa Silvia Marini',
    email: 'silvia.marini@scuola.it',
    phone: '+39 342 7788990',
    subjects: ['Tecnologia'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Venerdì',
    color: '#A855F7',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '2E', '3E'],
  },
  {
    id: 't11',
    name: 'Prof. Marco Barbieri',
    email: 'marco.barbieri@scuola.it',
    phone: '+39 348 8899112',
    subjects: ['Musica'],
    maxHoursPerWeek: 18,
    maxHoursPerDay: 4,
    freeDayPreference: 'Giovedì',
    color: '#E11D48',
    availability: createDefaultAvailability(),
    assignedClassIds: ['1A', '2A', '3A', '2E', '3E'],
  }
];

/**
 * Creates the complete standard class roster:
 * Sections: A, B, C, D, E, F, G, H, I, L, M
 * Years: 1, 2, 3 for each section
 * 1I and 2M unformed by default per user configuration.
 */
export const createAllStandardClasses = (): SchoolClass[] => {
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M'];
  const years = [1, 2, 3];
  const list: SchoolClass[] = [];

  sections.forEach(sec => {
    years.forEach(yr => {
      const id = `${yr}${sec}`;
      const isUnformed = (id === '1I' || id === '2M');
      list.push({
        id,
        year: yr,
        section: sec,
        isActive: !isUnformed,
        notes: isUnformed ? 'Classe non formata' : undefined
      });
    });
  });

  return list;
};

export const INITIAL_CLASSES: SchoolClass[] = createAllStandardClasses();

export const INITIAL_STUDY_PLANS: ClassStudyPlan[] = [
  {
    classId: '1A',
    subjects: [
      { subject: 'Italiano', hoursPerWeek: 4, teacherId: 't1' },
      { subject: 'Latino', hoursPerWeek: 3, teacherId: 't1' },
      { subject: 'Storia', hoursPerWeek: 2, teacherId: 't2' },
      { subject: 'Geografia', hoursPerWeek: 2, teacherId: 't2' },
      { subject: 'Matematica', hoursPerWeek: 4, teacherId: 't3' },
      { subject: 'Inglese', hoursPerWeek: 3, teacherId: 't5' },
      { subject: 'Scienze Naturali', hoursPerWeek: 2, teacherId: 't6' },
      { subject: 'Scienze Motorie e Sportive', hoursPerWeek: 2, teacherId: 't7', roomRequirement: 'Palestra A' },
      { subject: 'Disegno e Storia dell\'Arte', hoursPerWeek: 2, teacherId: 't8' },
      { subject: 'Religione Cattolica', hoursPerWeek: 1, teacherId: 't9' },
      { subject: 'Informatica', hoursPerWeek: 2, teacherId: 't4', roomRequirement: 'Lab. Informatica 1' },
    ]
  },
  {
    classId: '1B',
    subjects: [
      { subject: 'Italiano', hoursPerWeek: 4, teacherId: 't2' },
      { subject: 'Storia', hoursPerWeek: 2, teacherId: 't1' },
      { subject: 'Geografia', hoursPerWeek: 2, teacherId: 't2' },
      { subject: 'Matematica', hoursPerWeek: 4, teacherId: 't4' },
      { subject: 'Inglese', hoursPerWeek: 3, teacherId: 't5' },
      { subject: 'Scienze Naturali', hoursPerWeek: 2, teacherId: 't6' },
      { subject: 'Scienze Motorie e Sportive', hoursPerWeek: 2, teacherId: 't7', roomRequirement: 'Palestra B' },
      { subject: 'Diritto ed Economia', hoursPerWeek: 2, teacherId: 't10' },
      { subject: 'Disegno e Storia dell\'Arte', hoursPerWeek: 2, teacherId: 't8' },
      { subject: 'Religione Cattolica', hoursPerWeek: 1, teacherId: 't9' },
      { subject: 'Informatica', hoursPerWeek: 2, teacherId: 't4', roomRequirement: 'Lab. Informatica 2' },
    ]
  },
  {
    classId: '2A',
    subjects: [
      { subject: 'Italiano', hoursPerWeek: 4, teacherId: 't1' },
      { subject: 'Latino', hoursPerWeek: 3, teacherId: 't1' },
      { subject: 'Storia', hoursPerWeek: 2, teacherId: 't2' },
      { subject: 'Matematica', hoursPerWeek: 4, teacherId: 't3' },
      { subject: 'Fisica', hoursPerWeek: 2, teacherId: 't3', roomRequirement: 'Lab. Fisica' },
      { subject: 'Inglese', hoursPerWeek: 3, teacherId: 't5' },
      { subject: 'Chimica', hoursPerWeek: 2, teacherId: 't6', roomRequirement: 'Lab. Chimica' },
      { subject: 'Scienze Motorie e Sportive', hoursPerWeek: 2, teacherId: 't7', roomRequirement: 'Palestra A' },
      { subject: 'Disegno e Storia dell\'Arte', hoursPerWeek: 2, teacherId: 't8' },
      { subject: 'Religione Cattolica', hoursPerWeek: 1, teacherId: 't9' },
    ]
  },
  {
    classId: '3A',
    subjects: [
      { subject: 'Italiano', hoursPerWeek: 4, teacherId: 't1' },
      { subject: 'Filosofia', hoursPerWeek: 3, teacherId: 't8' },
      { subject: 'Storia', hoursPerWeek: 2, teacherId: 't10' },
      { subject: 'Matematica', hoursPerWeek: 4, teacherId: 't3' },
      { subject: 'Fisica', hoursPerWeek: 3, teacherId: 't3', roomRequirement: 'Lab. Fisica' },
      { subject: 'Inglese', hoursPerWeek: 3, teacherId: 't5' },
      { subject: 'Biologia', hoursPerWeek: 3, teacherId: 't6', roomRequirement: 'Lab. Chimica' },
      { subject: 'Scienze Motorie e Sportive', hoursPerWeek: 2, teacherId: 't7', roomRequirement: 'Palestra B' },
      { subject: 'Religione Cattolica', hoursPerWeek: 1, teacherId: 't9' },
    ]
  }
];

export const INITIAL_TABLES: ScheduleTable[] = [
  {
    id: 'table-regular',
    name: 'Orario Ordinario (6 Ore)',
    description: 'Orario scolastico standard completo a 6 ore giornaliere',
    hoursPerDay: 6,
    daysCount: 5,
    createdAt: '2026-09-01T08:00:00Z',
    slots: [
      // Lunedì 1A
      { id: 's-1a-lun-1', classId: '1A', day: 'Lunedì', hour: 1, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-lun-2', classId: '1A', day: 'Lunedì', hour: 2, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-lun-3', classId: '1A', day: 'Lunedì', hour: 3, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 's-1a-lun-4', classId: '1A', day: 'Lunedì', hour: 4, subject: 'Inglese', teacherId: 't5', room: 'Aula 101' },
      { id: 's-1a-lun-5', classId: '1A', day: 'Lunedì', hour: 5, subject: 'Scienze Naturali', teacherId: 't6', room: 'Aula 101' },
      { id: 's-1a-lun-6', classId: '1A', day: 'Lunedì', hour: 6, subject: 'Scienze Motorie e Sportive', teacherId: 't7', room: 'Palestra A' },

      // Lunedì 1B
      { id: 's-1b-lun-1', classId: '1B', day: 'Lunedì', hour: 1, subject: 'Matematica', teacherId: 't4', room: 'Aula 102' },
      { id: 's-1b-lun-2', classId: '1B', day: 'Lunedì', hour: 2, subject: 'Inglese', teacherId: 't5', room: 'Aula 102' },
      { id: 's-1b-lun-3', classId: '1B', day: 'Lunedì', hour: 3, subject: 'Italiano', teacherId: 't2', room: 'Aula 102' },
      { id: 's-1b-lun-4', classId: '1B', day: 'Lunedì', hour: 4, subject: 'Italiano', teacherId: 't2', room: 'Aula 102' },
      { id: 's-1b-lun-5', classId: '1B', day: 'Lunedì', hour: 5, subject: 'Diritto ed Economia', teacherId: 't10', room: 'Aula 102' },
      { id: 's-1b-lun-6', classId: '1B', day: 'Lunedì', hour: 6, subject: 'Informatica', teacherId: 't4', room: 'Lab. Informatica 2' },

      // Lunedì 2A
      { id: 's-2a-lun-1', classId: '2A', day: 'Lunedì', hour: 1, subject: 'Storia', teacherId: 't2', room: 'Aula 201' },
      { id: 's-2a-lun-2', classId: '2A', day: 'Lunedì', hour: 2, subject: 'Matematica', teacherId: 't3', room: 'Aula 201' },
      { id: 's-2a-lun-3', classId: '2A', day: 'Lunedì', hour: 3, subject: 'Fisica', teacherId: 't3', room: 'Lab. Fisica' },
      { id: 's-2a-lun-4', classId: '2A', day: 'Lunedì', hour: 4, subject: 'Italiano', teacherId: 't1', room: 'Aula 201' },
      { id: 's-2a-lun-5', classId: '2A', day: 'Lunedì', hour: 5, subject: 'Chimica', teacherId: 't6', room: 'Lab. Chimica' },
      { id: 's-2a-lun-6', classId: '2A', day: 'Lunedì', hour: 6, subject: 'Inglese', teacherId: 't5', room: 'Aula 201' },

      // Martedì 1A
      { id: 's-1a-mar-1', classId: '1A', day: 'Martedì', hour: 1, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 's-1a-mar-2', classId: '1A', day: 'Martedì', hour: 2, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 's-1a-mar-3', classId: '1A', day: 'Martedì', hour: 3, subject: 'Latino', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-mar-4', classId: '1A', day: 'Martedì', hour: 4, subject: 'Storia', teacherId: 't2', room: 'Aula 101' },
      { id: 's-1a-mar-5', classId: '1A', day: 'Martedì', hour: 5, subject: 'Disegno e Storia dell\'Arte', teacherId: 't8', room: 'Aula 101' },
      { id: 's-1a-mar-6', classId: '1A', day: 'Martedì', hour: 6, subject: 'Religione Cattolica', teacherId: 't9', room: 'Aula 101' },

      // Martedì 1B
      { id: 's-1b-mar-1', classId: '1B', day: 'Martedì', hour: 1, subject: 'Italiano', teacherId: 't2', room: 'Aula 102' },
      { id: 's-1b-mar-2', classId: '1B', day: 'Martedì', hour: 2, subject: 'Storia', teacherId: 't1', room: 'Aula 102' },
      { id: 's-1b-mar-3', classId: '1B', day: 'Martedì', hour: 3, subject: 'Informatica', teacherId: 't4', room: 'Lab. Informatica 2' },
      { id: 's-1b-mar-4', classId: '1B', day: 'Martedì', hour: 4, subject: 'Matematica', teacherId: 't4', room: 'Aula 102' },
      { id: 's-1b-mar-5', classId: '1B', day: 'Martedì', hour: 5, subject: 'Scienze Motorie e Sportive', teacherId: 't7', room: 'Palestra B' },
      { id: 's-1b-mar-6', classId: '1B', day: 'Martedì', hour: 6, subject: 'Geografia', teacherId: 't2', room: 'Aula 102' },

      // Mercoledì 1A
      { id: 's-1a-mer-1', classId: '1A', day: 'Mercoledì', hour: 1, subject: 'Informatica', teacherId: 't4', room: 'Lab. Informatica 1' },
      { id: 's-1a-mer-2', classId: '1A', day: 'Mercoledì', hour: 2, subject: 'Informatica', teacherId: 't4', room: 'Lab. Informatica 1' },
      { id: 's-1a-mer-3', classId: '1A', day: 'Mercoledì', hour: 3, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-mer-4', classId: '1A', day: 'Mercoledì', hour: 4, subject: 'Latino', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-mer-5', classId: '1A', day: 'Mercoledì', hour: 5, subject: 'Inglese', teacherId: 't5', room: 'Aula 101' },
      { id: 's-1a-mer-6', classId: '1A', day: 'Mercoledì', hour: 6, subject: 'Geografia', teacherId: 't2', room: 'Aula 101' },

      // Giovedì 1A
      { id: 's-1a-gio-1', classId: '1A', day: 'Giovedì', hour: 1, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-gio-2', classId: '1A', day: 'Giovedì', hour: 2, subject: 'Latino', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-gio-3', classId: '1A', day: 'Giovedì', hour: 3, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 's-1a-gio-4', classId: '1A', day: 'Giovedì', hour: 4, subject: 'Scienze Naturali', teacherId: 't6', room: 'Aula 101' },
      { id: 's-1a-gio-5', classId: '1A', day: 'Giovedì', hour: 5, subject: 'Disegno e Storia dell\'Arte', teacherId: 't8', room: 'Aula 101' },
      { id: 's-1a-gio-6', classId: '1A', day: 'Giovedì', hour: 6, subject: 'Scienze Motorie e Sportive', teacherId: 't7', room: 'Palestra A' },

      // Venerdì 1A
      { id: 's-1a-ven-1', classId: '1A', day: 'Venerdì', hour: 1, subject: 'Inglese', teacherId: 't5', room: 'Aula 101' },
      { id: 's-1a-ven-2', classId: '1A', day: 'Venerdì', hour: 2, subject: 'Storia', teacherId: 't2', room: 'Aula 101' },
      { id: 's-1a-ven-3', classId: '1A', day: 'Venerdì', hour: 3, subject: 'Geografia', teacherId: 't2', room: 'Aula 101' },
      { id: 's-1a-ven-4', classId: '1A', day: 'Venerdì', hour: 4, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 's-1a-ven-5', classId: '1A', day: 'Venerdì', hour: 5, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 's-1a-ven-6', classId: '1A', day: 'Venerdì', hour: 6, subject: 'Scienze Naturali', teacherId: 't6', room: 'Aula 101' },
    ]
  },
  {
    id: 'table-week-1',
    name: 'Prima Settimana (3 Ore)',
    description: 'Orario provvisorio per la prima settimana di scuola ridotto a 3 ore giornaliere',
    hoursPerDay: 3,
    daysCount: 5,
    createdAt: '2026-09-02T08:00:00Z',
    slots: [
      { id: 'w1-1a-lun-1', classId: '1A', day: 'Lunedì', hour: 1, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 'w1-1a-lun-2', classId: '1A', day: 'Lunedì', hour: 2, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 'w1-1a-lun-3', classId: '1A', day: 'Lunedì', hour: 3, subject: 'Inglese', teacherId: 't5', room: 'Aula 101' },

      { id: 'w1-1b-lun-1', classId: '1B', day: 'Lunedì', hour: 1, subject: 'Matematica', teacherId: 't4', room: 'Aula 102' },
      { id: 'w1-1b-lun-2', classId: '1B', day: 'Lunedì', hour: 2, subject: 'Italiano', teacherId: 't2', room: 'Aula 102' },
      { id: 'w1-1b-lun-3', classId: '1B', day: 'Lunedì', hour: 3, subject: 'Inglese', teacherId: 't5', room: 'Aula 102' },

      { id: 'w1-1a-mar-1', classId: '1A', day: 'Martedì', hour: 1, subject: 'Matematica', teacherId: 't3', room: 'Aula 101' },
      { id: 'w1-1a-mar-2', classId: '1A', day: 'Martedì', hour: 2, subject: 'Latino', teacherId: 't1', room: 'Aula 101' },
      { id: 'w1-1a-mar-3', classId: '1A', day: 'Martedì', hour: 3, subject: 'Scienze Naturali', teacherId: 't6', room: 'Aula 101' },

      { id: 'w1-1a-mer-1', classId: '1A', day: 'Mercoledì', hour: 1, subject: 'Italiano', teacherId: 't1', room: 'Aula 101' },
      { id: 'w1-1a-mer-2', classId: '1A', day: 'Mercoledì', hour: 2, subject: 'Geografia', teacherId: 't2', room: 'Aula 101' },
      { id: 'w1-1a-mer-3', classId: '1A', day: 'Mercoledì', hour: 3, subject: 'Informatica', teacherId: 't4', room: 'Lab. Informatica 1' },
    ]
  }
];

export const INITIAL_STUDENTS: StudentCredit[] = [
  {
    id: 'st-1',
    studentName: 'Alessandro Moretti',
    classId: '5A',
    pctoHoursMaturate: 140,
    pctoHoursTarget: 150,
    academicCreditsYear3: 11,
    academicCreditsYear4: 12,
    academicCreditsYear5: 14,
    totalCredits: 37,
    averageGrade: 8.4,
    conductGrade: 9,
  },
  {
    id: 'st-2',
    studentName: 'Giulia Colombo',
    classId: '5A',
    pctoHoursMaturate: 155,
    pctoHoursTarget: 150,
    academicCreditsYear3: 12,
    academicCreditsYear4: 13,
    academicCreditsYear5: 15,
    totalCredits: 40,
    averageGrade: 9.2,
    conductGrade: 10,
  },
  {
    id: 'st-3',
    studentName: 'Matteo Riva',
    classId: '4A',
    pctoHoursMaturate: 95,
    pctoHoursTarget: 150,
    academicCreditsYear3: 10,
    academicCreditsYear4: 11,
    academicCreditsYear5: 0,
    totalCredits: 21,
    averageGrade: 7.6,
    conductGrade: 8,
  },
  {
    id: 'st-4',
    studentName: 'Sara De Angelis',
    classId: '3A',
    pctoHoursMaturate: 45,
    pctoHoursTarget: 150,
    academicCreditsYear3: 11,
    academicCreditsYear4: 0,
    academicCreditsYear5: 0,
    totalCredits: 11,
    averageGrade: 8.1,
    conductGrade: 9,
  },
  {
    id: 'st-5',
    studentName: 'Federico Amore',
    classId: '5A',
    pctoHoursMaturate: 150,
    pctoHoursTarget: 150,
    academicCreditsYear3: 12,
    academicCreditsYear4: 13,
    academicCreditsYear5: 14,
    totalCredits: 39,
    averageGrade: 8.9,
    conductGrade: 10,
  },
];

export const INITIAL_NOTIFICATIONS: PushNotification[] = [
  {
    id: 'notif-1',
    title: 'Sostituzione Docente',
    message: 'Prof. Rossi assente domani alla 1ª ora in 1A. Sostituisce Prof.ssa Bianchi (Italiano).',
    timestamp: 'Oggi 08:15',
    type: 'substitution',
    read: false,
    classId: '1A',
    teacherId: 't1'
  },
  {
    id: 'notif-2',
    title: 'Variazione Aula',
    message: 'La lezione di Fisica della 2A del Giovedì alla 3ª ora si sposterà nel Lab. Fisica (Piano 2).',
    timestamp: 'Ieri 14:30',
    type: 'room_change',
    read: false,
    classId: '2A'
  },
  {
    id: 'notif-3',
    title: 'Avviso Condivisione Auto (Carpooling)',
    message: 'Orario sincronizzato con successo per i docenti Rossi e Bianchi (auto condivisa).',
    timestamp: '2 giorni fa',
    type: 'timetable_update',
    read: true,
    teacherId: 't1'
  },
  {
    id: 'notif-4',
    title: 'Backup Automatico Cloud',
    message: 'Snapshot di sicurezza dell\'orario salvato con crittografia end-to-end.',
    timestamp: '3 giorni fa',
    type: 'backup',
    read: true,
  }
];

// Convenient backward/forward-compatible aliases
export const DEFAULT_TEACHERS = INITIAL_TEACHERS;
export const DEFAULT_CLASSES = INITIAL_CLASSES;
export const DEFAULT_TABLES = INITIAL_TABLES;
export const DEFAULT_STUDY_PLANS = INITIAL_STUDY_PLANS;
export const DEFAULT_STUDENTS = INITIAL_STUDENTS;
export const DEFAULT_NOTIFICATIONS = INITIAL_NOTIFICATIONS;
