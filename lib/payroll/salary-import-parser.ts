import * as XLSX from "xlsx";

export interface SalaryImportRow {
  employee_code: string;
  monthly_gross: number;
  effective_from: string;
}
export interface ParsedSalaryRow {
  row: number;
  data: SalaryImportRow | null;
  error: string | null;
}

export function parseSalaryFile(buffer: ArrayBuffer): ParsedSalaryRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

  return rows.map((raw, i) => {
    const rowNum = i + 2;
    const employee_code = String(raw.employee_code ?? "").trim();
    const monthly_gross = Number(raw.monthly_gross ?? 0);
    const effective_from = String(raw.effective_from ?? "").trim();

    if (!employee_code) return { row: rowNum, data: null, error: "Missing employee_code" };
    if (!monthly_gross) return { row: rowNum, data: null, error: "Missing/invalid monthly_gross" };
    if (!effective_from || isNaN(new Date(effective_from).getTime())) {
      return { row: rowNum, data: null, error: "Missing/invalid effective_from" };
    }
    return {
      row: rowNum,
      error: null,
      data: { employee_code, monthly_gross, effective_from: new Date(effective_from).toISOString().slice(0, 10) }
    };
  });
}
