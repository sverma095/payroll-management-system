import { getComponentValue } from "@/lib/payroll/breakdown";

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportTable {
  title: string;
  note?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

interface PayrollDetailRow {
  employee_id: string;
  gross_salary: number;
  total_deduction: number;
  net_salary: number;
  pf: number;
  esi: number;
  pt: number;
  lwf: number;
  tds: number;
  breakdown_json: any;
}

interface EmployeeRow {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  uan: string | null;
  esic_number: string | null;
  pan: string | null;
  department_name?: string | null;
  designation_name?: string | null;
  status?: string;
}

function employeeName(e: EmployeeRow) {
  return `${e.first_name} ${e.last_name ?? ""}`.trim();
}

export function buildPayrollRegister(details: PayrollDetailRow[], employees: Map<string, EmployeeRow>): ReportTable {
  return {
    title: "Payroll Register",
    columns: [
      { key: "code", label: "Employee code" },
      { key: "name", label: "Name" },
      { key: "gross", label: "Gross" },
      { key: "pf", label: "PF" },
      { key: "esi", label: "ESI" },
      { key: "pt", label: "PT" },
      { key: "lwf", label: "LWF" },
      { key: "tds", label: "TDS" },
      { key: "deductions", label: "Total deductions" },
      { key: "net", label: "Net pay" }
    ],
    rows: details.map((d) => {
      const e = employees.get(d.employee_id);
      return {
        code: e?.employee_code ?? "",
        name: e ? employeeName(e) : "",
        gross: d.gross_salary,
        pf: d.pf,
        esi: d.esi,
        pt: d.pt,
        lwf: d.lwf,
        tds: d.tds,
        deductions: d.total_deduction,
        net: d.net_salary
      };
    })
  };
}

/**
 * PF/ESI/PT/LWF reports below show whatever the company actually
 * configured for that component (0 if they haven't defined one) — same
 * principle as payroll processing itself. Employer-side contribution only
 * shows if the company defined a matching EMPLOYER_PF / EMPLOYER_ESI
 * component; otherwise it's blank, not a guessed number.
 */

export function buildPFReport(details: PayrollDetailRow[], employees: Map<string, EmployeeRow>): ReportTable {
  return {
    title: "PF Report",
    note: "Indicative format for review — verify against the current EPFO ECR specification before filing.",
    columns: [
      { key: "uan", label: "UAN" },
      { key: "code", label: "Employee code" },
      { key: "name", label: "Name" },
      { key: "wages", label: "EPF wages (Basic)" },
      { key: "employee_pf", label: "Employee PF" },
      { key: "employer_pf", label: "Employer PF" }
    ],
    rows: details.map((d) => {
      const e = employees.get(d.employee_id);
      return {
        uan: e?.uan ?? "MISSING",
        code: e?.employee_code ?? "",
        name: e ? employeeName(e) : "",
        wages: getComponentValue(d.breakdown_json, "BASIC"),
        employee_pf: d.pf,
        employer_pf: getComponentValue(d.breakdown_json, "EMPLOYER_PF") || ""
      };
    })
  };
}

export function buildESIReport(details: PayrollDetailRow[], employees: Map<string, EmployeeRow>): ReportTable {
  return {
    title: "ESI Report",
    note: "Indicative format — verify against the current ESIC upload specification before filing.",
    columns: [
      { key: "esic", label: "ESIC number" },
      { key: "code", label: "Employee code" },
      { key: "name", label: "Name" },
      { key: "wages", label: "ESI wages (Gross)" },
      { key: "employee_esi", label: "Employee ESI" },
      { key: "employer_esi", label: "Employer ESI" }
    ],
    rows: details
      .filter((d) => d.esi > 0 || employees.get(d.employee_id)?.esic_number)
      .map((d) => {
        const e = employees.get(d.employee_id);
        return {
          esic: e?.esic_number ?? "MISSING",
          code: e?.employee_code ?? "",
          name: e ? employeeName(e) : "",
          wages: d.gross_salary,
          employee_esi: d.esi,
          employer_esi: getComponentValue(d.breakdown_json, "EMPLOYER_ESI") || ""
        };
      })
  };
}

export function buildPTReport(details: PayrollDetailRow[], employees: Map<string, EmployeeRow>): ReportTable {
  return {
    title: "Professional Tax Report",
    columns: [
      { key: "code", label: "Employee code" },
      { key: "name", label: "Name" },
      { key: "gross", label: "Gross" },
      { key: "pt", label: "PT deducted" }
    ],
    rows: details
      .filter((d) => d.pt > 0)
      .map((d) => {
        const e = employees.get(d.employee_id);
        return { code: e?.employee_code ?? "", name: e ? employeeName(e) : "", gross: d.gross_salary, pt: d.pt };
      })
  };
}

export function buildLWFReport(details: PayrollDetailRow[], employees: Map<string, EmployeeRow>): ReportTable {
  return {
    title: "LWF Report",
    columns: [
      { key: "code", label: "Employee code" },
      { key: "name", label: "Name" },
      { key: "lwf", label: "LWF deducted" }
    ],
    rows: details
      .filter((d) => d.lwf > 0)
      .map((d) => {
        const e = employees.get(d.employee_id);
        return { code: e?.employee_code ?? "", name: e ? employeeName(e) : "", lwf: d.lwf };
      })
  };
}

export function buildTDSReport(details: PayrollDetailRow[], employees: Map<string, EmployeeRow>): ReportTable {
  return {
    title: "TDS Report",
    note: "Rows marked \"Estimated\" used the fallback new-regime calculator (no investment declarations) because the company hasn't defined its own TDS formula component.",
    columns: [
      { key: "pan", label: "PAN" },
      { key: "code", label: "Employee code" },
      { key: "name", label: "Name" },
      { key: "tds", label: "TDS" },
      { key: "basis", label: "Basis" }
    ],
    rows: details
      .filter((d) => d.tds > 0)
      .map((d) => {
        const e = employees.get(d.employee_id);
        return {
          pan: e?.pan ?? "MISSING",
          code: e?.employee_code ?? "",
          name: e ? employeeName(e) : "",
          tds: d.tds,
          basis: d.breakdown_json?.tdsEstimated ? "Estimated" : "Formula"
        };
      })
  };
}

export function buildHeadcountReport(employees: EmployeeRow[]): ReportTable {
  const byDept = new Map<string, number>();
  for (const e of employees) {
    const key = e.department_name ?? "Unassigned";
    byDept.set(key, (byDept.get(key) ?? 0) + 1);
  }
  return {
    title: "Headcount Report",
    columns: [
      { key: "department", label: "Department" },
      { key: "count", label: "Active employees" }
    ],
    rows: Array.from(byDept.entries()).map(([department, count]) => ({ department, count }))
  };
}
