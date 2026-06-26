import { ReportTable } from "./builders";

export function buildJournalVoucher(details: { gross_salary: number; total_deduction: number; net_salary: number; pf: number; esi: number; pt: number; lwf: number; tds: number }[]): ReportTable {
  const sum = (k: string) => details.reduce((s, d: any) => s + Number(d[k] ?? 0), 0);
  const gross = sum("gross_salary");
  const rows = [
    { account: "Salary Expense", type: "Debit", amount: gross },
    { account: "PF Payable", type: "Credit", amount: sum("pf") },
    { account: "ESI Payable", type: "Credit", amount: sum("esi") },
    { account: "PT Payable", type: "Credit", amount: sum("pt") },
    { account: "LWF Payable", type: "Credit", amount: sum("lwf") },
    { account: "TDS Payable", type: "Credit", amount: sum("tds") },
    { account: "Salary Payable (Net)", type: "Credit", amount: sum("net_salary") }
  ].filter((r) => r.amount > 0);

  return {
    title: "Journal Voucher",
    note: "Indicative GL mapping — verify account names against your chart of accounts before import.",
    columns: [
      { key: "account", label: "Account" },
      { key: "type", label: "Dr/Cr" },
      { key: "amount", label: "Amount" }
    ],
    rows
  };
}
