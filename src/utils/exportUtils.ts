import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ScheduleSlot, Teacher, SchoolClass, DayOfWeek } from '../types';

export interface ExportFilterOptions {
  subjectFilter?: string;
  roomFilter?: string;
  classFilter?: string;
  teacherFilter?: string;
}

const DEFAULT_DAYS: DayOfWeek[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

/**
 * Universal safe Blob downloader that functions reliably inside sandboxed iframes,
 * popups, and all standard desktop & mobile browsers.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 500);
}

/**
 * Downloads an XLSX workbook via Blob to bypass iframe download restrictions.
 */
export function downloadWorkbook(wb: XLSX.WorkBook, filename: string): boolean {
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    downloadBlob(blob, safeName);
    return true;
  } catch (err) {
    console.error('Error writing workbook to blob:', err);
    return false;
  }
}

export interface ActiveViewExportParams {
  viewMode: 'master_teachers' | 'by_class' | 'by_teacher' | 'master';
  selectedClassId?: string;
  selectedTeacherId?: string;
  slots: ScheduleSlot[];
  teachers: Teacher[];
  classes: SchoolClass[];
  days?: DayOfWeek[];
  hoursPerDay?: number;
  tableName?: string;
  customFileName?: string;
}

/**
 * Smart context-aware Excel export that saves exactly the active view currently open on screen:
 * - If on "Orario per Classe", exports that specific class's weekly schedule as the primary sheet.
 * - If on "Orario per Docente", exports that specific teacher's weekly schedule as the primary sheet.
 * - If on "Tabellone Docenti A-Z", exports the complete A-Z master timetable.
 * - If on "Tabellone Classi", exports the full classes timetable.
 * All exports also include secondary tabs for full completeness.
 */
export function exportActiveViewToExcel(params: ActiveViewExportParams): boolean {
  try {
    const {
      viewMode,
      selectedClassId,
      selectedTeacherId,
      slots,
      teachers,
      classes,
      days = DEFAULT_DAYS,
      hoursPerDay = 6,
      tableName = 'Orario_Scolastico',
      customFileName
    } = params;

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const activeClasses = classes.filter(c => c.isActive !== false);
    const sortedClasses = [...activeClasses].sort((a, b) => a.id.localeCompare(b.id, 'it', { numeric: true }));
    const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'it'));

    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().slice(0, 10);
    let defaultFileName = '';

    // 1. PRIMARY SHEET DEPENDING ON ACTIVE VIEW
    if (viewMode === 'by_class') {
      const targetClassId = selectedClassId || sortedClasses[0]?.id || '1A';
      defaultFileName = `Orario_Classe_${targetClassId}_${tableName}`;

      // Build specific weekly grid for this class
      const classRows: any[] = [];
      for (let h = 1; h <= hoursPerDay; h++) {
        const rowObj: any = { 'Ora': `${h}ª Ora` };
        days.forEach(day => {
          const slot = slots.find(s => s.classId === targetClassId && s.day === day && s.hour === h);
          if (slot) {
            const t = teacherMap.get(slot.teacherId);
            rowObj[day] = `${slot.subject}${t ? ` (${t.name})` : ''}`;
          } else {
            rowObj[day] = '- (Libera)';
          }
        });
        classRows.push(rowObj);
      }
      const wsClass = XLSX.utils.json_to_sheet(classRows);
      XLSX.utils.book_append_sheet(wb, wsClass, `Orario Classe ${targetClassId}`);

      // Summary of subjects for this class
      const subjectSummary: Record<string, { count: number; teacher: string }> = {};
      slots
        .filter(s => s.classId === targetClassId && s.hour <= hoursPerDay)
        .forEach(s => {
          if (!subjectSummary[s.subject]) {
            const t = teacherMap.get(s.teacherId);
            subjectSummary[s.subject] = { count: 0, teacher: t ? t.name : 'N/D' };
          }
          subjectSummary[s.subject].count++;
        });

      const summaryRows = Object.entries(subjectSummary).map(([subject, info]) => ({
        'Materia': subject,
        'Docente Assegnato': info.teacher,
        'Ore Settimanali': `${info.count} ore`
      }));
      const wsSubj = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSubj, `Materie Classe ${targetClassId}`);

    } else if (viewMode === 'by_teacher') {
      const fallbackTeacher: Teacher = {
        id: 't1',
        name: 'Docente',
        subjects: [],
        color: '#6366F1',
        maxHoursPerWeek: 18,
        maxHoursPerDay: 4,
        availability: {},
        email: '',
        freeDayPreference: undefined,
        carpoolGroupId: undefined
      };
      const targetTeacher: Teacher = teachers.find(t => t.id === selectedTeacherId) || sortedTeachers[0] || fallbackTeacher;
      const cleanTeacherName = targetTeacher.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      defaultFileName = `Orario_Docente_${cleanTeacherName}_${tableName}`;

      // Build specific weekly grid for this teacher
      const teacherRows: any[] = [];
      for (let h = 1; h <= hoursPerDay; h++) {
        const rowObj: any = { 'Ora': `${h}ª Ora` };
        days.forEach(day => {
          const slot = slots.find(s => s.teacherId === targetTeacher.id && s.day === day && s.hour === h);
          if (slot) {
            rowObj[day] = `Classe ${slot.classId} (${slot.subject})`;
          } else {
            rowObj[day] = '-';
          }
        });
        teacherRows.push(rowObj);
      }
      const wsTeacher = XLSX.utils.json_to_sheet(teacherRows);
      XLSX.utils.book_append_sheet(wb, wsTeacher, `Orario ${targetTeacher.name.slice(0, 25)}`);

      // Teacher workload summary
      const assignedSlots = slots.filter(s => s.teacherId === targetTeacher.id && s.hour <= hoursPerDay);
      const teacherOverview = [{
        'Docente': targetTeacher.name,
        'Email': targetTeacher.email || 'Non indicata',
        'Materie Abilitate': targetTeacher.subjects.join(', '),
        'Ore Assegnate': assignedSlots.length,
        'Max Ore Cattedra': targetTeacher.maxHoursPerWeek,
        'Giorno Libero': targetTeacher.freeDayPreference || 'Nessuno',
        'Auto Condivisa (Carpooling)': targetTeacher.carpoolGroupId ? 'Sì' : 'No'
      }];
      const wsOverview = XLSX.utils.json_to_sheet(teacherOverview);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Dettaglio Cattedra');

    } else if (viewMode === 'master_teachers') {
      defaultFileName = `Tabellone_Docenti_AZ_${tableName}`;

      // Tabellone Generale Docenti A-Z
      const masterA3Data: any[] = sortedTeachers.map(t => {
        const row: any = {
          'Docente (A-Z)': t.name,
          'Materie': t.subjects.join(', '),
          'Cattedra': `${t.maxHoursPerWeek}h`
        };

        days.forEach(day => {
          for (let h = 1; h <= hoursPerDay; h++) {
            const slot = slots.find(s => s.teacherId === t.id && s.day === day && s.hour === h);
            const colKey = `${day} ${h}ª`;
            row[colKey] = slot ? `${slot.classId} (${slot.subject})` : '-';
          }
        });
        return row;
      });
      const wsMaster = XLSX.utils.json_to_sheet(masterA3Data);
      XLSX.utils.book_append_sheet(wb, wsMaster, 'Tabellone Docenti A-Z');

    } else {
      // viewMode === 'master' (Tabellone Classi)
      defaultFileName = `Tabellone_Classi_${tableName}`;

      const classGridData: any[] = [];
      sortedClasses.forEach(cls => {
        days.forEach(day => {
          const row: any = { 'Classe': cls.id, 'Sezione': cls.section, 'Giorno': day };
          for (let h = 1; h <= hoursPerDay; h++) {
            const slot = slots.find(s => s.classId === cls.id && s.day === day && s.hour === h);
            if (slot) {
              const t = teacherMap.get(slot.teacherId);
              const teacherLastName = t ? t.name.split(' ').pop() : '';
              row[`${h}ª Ora`] = `${slot.subject}${teacherLastName ? ` (${teacherLastName})` : ''}`;
            } else {
              row[`${h}ª Ora`] = '-';
            }
          }
          classGridData.push(row);
        });
      });
      const wsClassGrid = XLSX.utils.json_to_sheet(classGridData);
      XLSX.utils.book_append_sheet(wb, wsClassGrid, 'Tabellone Classi');
    }

    // 2. ALSO APPEND SECONDARY COMPLETE SHEETS SO FILE HAS FULL DATA
    // Append Tabellone Docenti A-Z if not already the first sheet
    if (viewMode !== 'master_teachers') {
      const masterA3Data: any[] = sortedTeachers.map(t => {
        const row: any = {
          'Docente': t.name,
          'Materie': t.subjects.join(', '),
          'Cattedra': `${t.maxHoursPerWeek}h`
        };
        days.forEach(day => {
          for (let h = 1; h <= hoursPerDay; h++) {
            const slot = slots.find(s => s.teacherId === t.id && s.day === day && s.hour === h);
            row[`${day} ${h}ª`] = slot ? `${slot.classId} (${slot.subject})` : '-';
          }
        });
        return row;
      });
      const wsMaster = XLSX.utils.json_to_sheet(masterA3Data);
      XLSX.utils.book_append_sheet(wb, wsMaster, 'Tutti i Docenti');
    }

    // Append Tabellone Classi if not already first sheet
    if (viewMode !== 'master') {
      const classGridData: any[] = [];
      sortedClasses.forEach(cls => {
        days.forEach(day => {
          const row: any = { 'Classe': cls.id, 'Sezione': cls.section, 'Giorno': day };
          for (let h = 1; h <= hoursPerDay; h++) {
            const slot = slots.find(s => s.classId === cls.id && s.day === day && s.hour === h);
            if (slot) {
              const t = teacherMap.get(slot.teacherId);
              const teacherLastName = t ? t.name.split(' ').pop() : '';
              row[`${h}ª Ora`] = `${slot.subject}${teacherLastName ? ` (${teacherLastName})` : ''}`;
            } else {
              row[`${h}ª Ora`] = '-';
            }
          }
          classGridData.push(row);
        });
      });
      const wsClassGrid = XLSX.utils.json_to_sheet(classGridData);
      XLSX.utils.book_append_sheet(wb, wsClassGrid, 'Tutte le Classi');
    }

    // Download using safe Blob method
    const finalFileName = (customFileName?.trim() || defaultFileName).replace(/\s+/g, '_');
    return downloadWorkbook(wb, `${finalFileName}_${dateStr}.xlsx`);
  } catch (err) {
    console.error('Error in exportActiveViewToExcel:', err);
    return false;
  }
}

/**
 * Backward-compatible general Excel export.
 */
export function exportToExcel(
  slots: ScheduleSlot[],
  teachers: Teacher[],
  classes: SchoolClass[],
  daysOrHours?: DayOfWeek[] | number,
  hoursOrTableName?: number | string,
  filtersOrDays?: ExportFilterOptions | DayOfWeek[],
  tableNameOrFilters?: string | ExportFilterOptions
): boolean {
  try {
    let days: DayOfWeek[] = DEFAULT_DAYS;
    let hoursPerDay: number = 6;
    let filters: ExportFilterOptions = {};
    let tableName: string = 'Orario_Scolastico';

    if (Array.isArray(daysOrHours)) {
      days = daysOrHours;
      if (typeof hoursOrTableName === 'number') hoursPerDay = hoursOrTableName;
      if (typeof filtersOrDays === 'object' && !Array.isArray(filtersOrDays)) filters = filtersOrDays || {};
      if (typeof tableNameOrFilters === 'string') tableName = tableNameOrFilters;
    } else if (typeof daysOrHours === 'number') {
      hoursPerDay = daysOrHours;
      if (typeof hoursOrTableName === 'string') tableName = hoursOrTableName;
      if (Array.isArray(filtersOrDays)) days = filtersOrDays;
      if (typeof tableNameOrFilters === 'object') filters = tableNameOrFilters || {};
    }

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'it'));
    const activeClasses = classes.filter(c => c.isActive !== false);
    const sortedClasses = [...activeClasses].sort((a, b) => a.id.localeCompare(b.id, 'it', { numeric: true }));

    const wb = XLSX.utils.book_new();

    // 1. Tabellone Docenti A-Z
    const masterA3Data: any[] = sortedTeachers.map(t => {
      const row: any = {
        'Docente': t.name,
        'Email': t.email || '',
        'Materie': t.subjects.join(', '),
        'Cattedra': `${t.maxHoursPerWeek}h`
      };
      days.slice(0, 5).forEach(day => {
        for (let h = 1; h <= hoursPerDay; h++) {
          const slot = slots.find(s => s.teacherId === t.id && s.day === day && s.hour === h);
          row[`${day} - ${h}ª Ora`] = slot ? `${slot.classId} (${slot.subject})` : '-';
        }
      });
      return row;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masterA3Data), 'Tabellone A3 Docenti');

    // 2. Tabellone Classi
    const classGridData: any[] = [];
    sortedClasses.forEach(cls => {
      days.forEach(day => {
        const row: any = { 'Classe': cls.id, 'Sezione': cls.section, 'Giorno': day };
        for (let h = 1; h <= hoursPerDay; h++) {
          const slot = slots.find(s => s.classId === cls.id && s.day === day && s.hour === h);
          if (slot) {
            const t = teacherMap.get(slot.teacherId);
            const teacherLastName = t ? t.name.split(' ').pop() : '';
            row[`${h}ª Ora`] = `${slot.subject}${teacherLastName ? ` (${teacherLastName})` : ''}`;
          } else {
            row[`${h}ª Ora`] = '-';
          }
        }
        classGridData.push(row);
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classGridData), 'Tabellone Classi');

    // 3. Raw Data
    const rawData = slots
      .filter(s => s.hour <= hoursPerDay)
      .filter(s => !filters.subjectFilter || s.subject.toLowerCase().includes(filters.subjectFilter.toLowerCase()))
      .filter(s => !filters.classFilter || s.classId === filters.classFilter)
      .filter(s => !filters.teacherFilter || s.teacherId === filters.teacherFilter)
      .map(s => {
        const teacher = teacherMap.get(s.teacherId);
        return {
          'Classe': s.classId,
          'Giorno': s.day,
          'Ora': `${s.hour}ª Ora`,
          'Materia': s.subject,
          'Docente': teacher ? teacher.name : 'N/D'
        };
      });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawData), 'Elenco Lezioni');

    const cleanName = (tableName || 'Orario_Scolastico').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return downloadWorkbook(wb, `${cleanName}_${dateStr}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return false;
  }
}

export const exportScheduleToExcel = exportToExcel;

/**
 * Exports Timetable to a rich Microsoft Word document (.doc) specific to the active view
 */
export function exportActiveViewToWord(params: ActiveViewExportParams): boolean {
  try {
    const {
      viewMode,
      selectedClassId,
      selectedTeacherId,
      slots,
      teachers,
      classes,
      days = DEFAULT_DAYS,
      hoursPerDay = 6,
      tableName = 'Orario_Scolastico',
      customFileName
    } = params;

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const activeClasses = classes.filter(c => c.isActive !== false);
    const sortedClasses = [...activeClasses].sort((a, b) => a.id.localeCompare(b.id, 'it', { numeric: true }));
    const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'it'));

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${tableName}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; margin: 20px; font-size: 10pt; color: #111; }
          h1 { font-size: 16pt; color: #1e3a8a; margin-bottom: 2px; text-align: center; }
          h2 { font-size: 13pt; color: #1e293b; margin-top: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
          p.subtitle { text-align: center; font-size: 9.5pt; color: #64748b; margin-top: 0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; }
          th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
          .highlight { background-color: #e0e7ff; font-weight: bold; }
          .day-header { background-color: #3b82f6; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>ISTITUTO COMPRENSIVO STATALE</h1>
        <p class="subtitle">Orario Scolastico Ufficiale • Anno Scolastico 2025/2026 • ${tableName}</p>
    `;

    let finalName = '';

    if (viewMode === 'by_class') {
      const targetClassId = selectedClassId || sortedClasses[0]?.id || '1A';
      finalName = customFileName || `Orario_Classe_${targetClassId}_${tableName}`;
      html += `<h2>ORARIO SETTIMANALE - CLASSE ${targetClassId}</h2>`;
      html += `<table><thead><tr><th>Ora</th>`;
      days.forEach(d => { html += `<th>${d}</th>`; });
      html += `</tr></thead><tbody>`;

      for (let h = 1; h <= hoursPerDay; h++) {
        html += `<tr><td style="font-weight: bold; background-color: #f8fafc;">${h}ª Ora</td>`;
        days.forEach(d => {
          const slot = slots.find(s => s.classId === targetClassId && s.day === d && s.hour === h);
          if (slot) {
            const t = teacherMap.get(slot.teacherId);
            html += `<td class="highlight">${slot.subject}<br><span style="font-size: 8pt; color: #475569;">${t ? t.name : ''}</span></td>`;
          } else {
            html += `<td style="color: #94a3b8;">-</td>`;
          }
        });
        html += `</tr>`;
      }
      html += `</tbody></table>`;

    } else if (viewMode === 'by_teacher') {
      const targetTeacher = teachers.find(t => t.id === selectedTeacherId) || sortedTeachers[0];
      const teacherSafeName = (targetTeacher?.name || 'Docente').replace(/[^a-zA-Z0-9_-]/g, '_');
      finalName = customFileName || `Orario_Docente_${teacherSafeName}_${tableName}`;
      html += `<h2>ORARIO SETTIMANALE DOCENTE - ${targetTeacher?.name || 'Docente'}</h2>`;
      html += `<p><strong>Materie:</strong> ${targetTeacher?.subjects.join(', ')} • <strong>Cattedra:</strong> ${targetTeacher?.maxHoursPerWeek}h</p>`;
      html += `<table><thead><tr><th>Ora</th>`;
      days.forEach(d => { html += `<th>${d}</th>`; });
      html += `</tr></thead><tbody>`;

      for (let h = 1; h <= hoursPerDay; h++) {
        html += `<tr><td style="font-weight: bold; background-color: #f8fafc;">${h}ª Ora</td>`;
        days.forEach(d => {
          const slot = slots.find(s => s.teacherId === targetTeacher?.id && s.day === d && s.hour === h);
          if (slot) {
            html += `<td class="highlight">Classe ${slot.classId}<br><span style="font-size: 8pt; color: #475569;">${slot.subject}</span></td>`;
          } else {
            html += `<td style="color: #94a3b8;">-</td>`;
          }
        });
        html += `</tr>`;
      }
      html += `</tbody></table>`;

    } else if (viewMode === 'master_teachers') {
      finalName = customFileName || `Tabellone_Docenti_AZ_${tableName}`;
      html += `<h2>TABELLONE GENERALE DOCENTI (ORDINAMENTO A-Z)</h2>`;
      html += `<table><thead><tr><th>Docente</th><th>Materie</th>`;
      days.forEach(d => { html += `<th colspan="${hoursPerDay}">${d}</th>`; });
      html += `</tr><tr><th></th><th></th>`;
      days.forEach(() => {
        for (let h = 1; h <= hoursPerDay; h++) {
          html += `<th style="font-size: 8pt;">${h}ª</th>`;
        }
      });
      html += `</tr></thead><tbody>`;

      sortedTeachers.forEach(t => {
        html += `<tr><td style="text-align: left; font-weight: bold;">${t.name}</td><td style="font-size: 8pt;">${t.subjects.join(', ')}</td>`;
        days.forEach(day => {
          for (let h = 1; h <= hoursPerDay; h++) {
            const slot = slots.find(s => s.teacherId === t.id && s.day === day && s.hour === h);
            if (slot) {
              html += `<td class="highlight">${slot.classId}<br><span style="font-size: 7pt; color: #374151;">${slot.subject}</span></td>`;
            } else {
              html += `<td style="color: #94a3b8;">-</td>`;
            }
          }
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;

    } else {
      // master (tabellone classi)
      finalName = customFileName || `Tabellone_Classi_${tableName}`;
      html += `<h2>TABELLONE GENERALE CLASSI</h2>`;
      sortedClasses.forEach(cls => {
        html += `<h3 style="font-size: 11pt; color: #1e3a8a; margin-top: 12px;">Classe ${cls.id} (Sezione ${cls.section})</h3>`;
        html += `<table><thead><tr><th>Ora</th>`;
        days.forEach(d => { html += `<th>${d}</th>`; });
        html += `</tr></thead><tbody>`;
        for (let h = 1; h <= hoursPerDay; h++) {
          html += `<tr><td style="font-weight: bold; background-color: #f8fafc;">${h}ª Ora</td>`;
          days.forEach(d => {
            const slot = slots.find(s => s.classId === cls.id && s.day === d && s.hour === h);
            if (slot) {
              const t = teacherMap.get(slot.teacherId);
              html += `<td style="background-color: #eff6ff;"><strong>${slot.subject}</strong><br><span style="font-size: 8pt; color: #475569;">${t ? t.name : ''}</span></td>`;
            } else {
              html += `<td>-</td>`;
            }
          });
          html += `</tr>`;
        }
        html += `</tbody></table>`;
      });
    }

    html += `</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const cleanFileName = finalName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `${cleanFileName}_${dateStr}.doc`);
    return true;
  } catch (err) {
    console.error('Error in exportActiveViewToWord:', err);
    return false;
  }
}

/**
 * Standard complete Word export
 */
export function exportScheduleToWord(
  slots: ScheduleSlot[],
  teachers: Teacher[],
  classes: SchoolClass[],
  hoursPerDay: number = 6,
  tableName: string = 'Orario_Scolastico'
): boolean {
  return exportActiveViewToWord({
    viewMode: 'master_teachers',
    slots,
    teachers,
    classes,
    hoursPerDay,
    tableName
  });
}

/**
 * Captures an HTML element as high-res canvas for PDF and JPEG generation
 */
async function captureElementCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  const targetWidth = Math.max(element.scrollWidth, element.clientWidth, 1200);

  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = `${targetWidth}px`;
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.backgroundColor = '#0f172a';
  clone.style.color = '#f8fafc';
  clone.style.zIndex = '-999';

  const innerScrollables = clone.querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-y-auto, [class*="max-h-"]');
  innerScrollables.forEach(el => {
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
  });

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 1.6,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#0f172a',
      windowWidth: targetWidth
    });
    return canvas;
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}

/**
 * Helper to resolve target element by ID or fallback to visible timetable containers
 */
function findTargetElement(elementId: string): HTMLElement | null {
  return (
    document.getElementById(elementId) ||
    document.getElementById('active-schedule-view-container') ||
    document.getElementById('printable-report-area') ||
    document.getElementById('schedule-grid-master-teachers') ||
    document.getElementById('schedule-grid-by-class') ||
    document.getElementById('schedule-grid-by-teacher') ||
    document.getElementById('schedule-grid-master-classes') ||
    document.querySelector<HTMLElement>('.schedule-grid-container')
  );
}

/**
 * Exports HTML container to high-resolution JPEG image (.jpg)
 */
export async function exportElementToImage(
  elementId: string,
  filename: string = 'Tabellone_Orario',
  format: 'jpeg' | 'png' = 'jpeg'
): Promise<boolean> {
  const element = findTargetElement(elementId);
  if (!element) {
    console.error(`Element for Image generation not found (#${elementId}).`);
    return false;
  }

  try {
    const canvas = await captureElementCanvas(element);
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? 'png' : 'jpg';
    const cleanName = filename.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);

    return new Promise<boolean>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          // Fallback via data URL
          try {
            const dataUrl = canvas.toDataURL(mimeType, 0.95);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${cleanName}_${dateStr}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            resolve(true);
          } catch (e) {
            console.error('DataURL fallback failed:', e);
            resolve(false);
          }
          return;
        }
        downloadBlob(blob, `${cleanName}_${dateStr}.${extension}`);
        resolve(true);
      }, mimeType, 0.95);
    });
  } catch (err) {
    console.error('Failed to export element to image:', err);
    return false;
  }
}

/**
 * Exports HTML container directly to a downloadable PDF file (.pdf)
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string = 'Tabellone_Orario',
  format: 'a3' | 'a4' = 'a3',
  orientation: 'landscape' | 'portrait' = 'landscape'
): Promise<boolean> {
  const element = findTargetElement(elementId);
  if (!element) {
    console.error(`Element for PDF generation not found (#${elementId}).`);
    window.print();
    return true;
  }

  try {
    const canvas = await captureElementCanvas(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const margin = 6;
    const availableWidth = pdfWidth - margin * 2;
    const availableHeight = pdfHeight - margin * 2;

    const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;

    const posX = (pdfWidth - renderWidth) / 2;
    const posY = margin;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);

    const dateStr = new Date().toISOString().slice(0, 10);
    const cleanName = filename.replace(/\s+/g, '_');
    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, `${cleanName}_${dateStr}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to export element to PDF, falling back to print:', err);
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

export function exportToCsv(
  slots: ScheduleSlot[],
  teachers: Teacher[],
  hoursPerDay: number,
  tableName: string = 'Orario_Scolastico'
): void {
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const headers = ['Classe', 'Giorno', 'Ora', 'Materia', 'Docente', 'Aula'];

  const rows = slots
    .filter(s => s.hour <= hoursPerDay)
    .map(s => {
      const t = teacherMap.get(s.teacherId);
      return [
        s.classId,
        s.day,
        `${s.hour}ª Ora`,
        `"${s.subject}"`,
        `"${t ? t.name : ''}"`,
        `"${s.room || 'Aula'}"`
      ].join(';');
    });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanName = tableName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `${cleanName}_${dateStr}.csv`);
}

export function printDocument(): void {
  window.print();
}
