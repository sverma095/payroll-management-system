import { ReportTable } from "./builders";

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tableToCsv(table: ReportTable): string {
  const header = table.columns.map((c) => escapeCsv(c.label)).join(",");
  const lines = table.rows.map((row) => table.columns.map((c) => escapeCsv(row[c.key] ?? "")).join(","));
  return [header, ...lines].join("\n");
}
