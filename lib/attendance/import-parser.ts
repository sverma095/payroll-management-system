import * as XLSX from "xlsx";

export interface AttendanceImportRow {
  employee_code: string;
  attendance_date: string; // ISO yyyy-mm-dd
  status: string;
  working_hours: number;
  overtime_hours: number;
}

export interface ParsedImportRow {
  row: number;
  data: AttendanceImportRow | null;
  error: string | null;
}

const VALID_STATUSES = new Set(["present", "absent", "half_day", "on_leave", "holiday", "week_off"]);

/** Expected columns: employee_code, attendance_date, status, working_hours, overtime_hours */
export function parseAttendanceFile(buffer: ArrayBuffer): ParsedImportRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

  return rows.map((raw, i) => {
    const rowNum = i + 2; // header is row 1
    const employee_code = String(raw.employee_code ?? "").trim();
    const status = String(raw.status ?? "").trim().toLowerCase();
    const dateRaw = String(raw.attendance_date ?? "").trim();

    if (!employee_code) return { row: rowNum, data: null, error: "Missing employee_code" };
    if (!dateRaw) return { row: rowNum, data: null, error: "Missing attendance_date" };

    const parsedDate = new Date(dateRaw);
    if (isNaN(parsedDate.getTime())) {
      return { row: rowNum, data: null, error: `Unparseable date: ${dateRaw}` };
    }
    if (!VALID_STATUSES.has(status)) {
      return { row: rowNum, data: null, error: `Invalid status: ${status}` };
    }

    return {
      row: rowNum,
      error: null,
      data: {
        employee_code,
        attendance_date: parsedDate.toISOString().slice(0, 10),
        status,
        working_hours: Number(raw.working_hours ?? 0) || 0,
        overtime_hours: Number(raw.overtime_hours ?? 0) || 0
      }
    };
  });
}
