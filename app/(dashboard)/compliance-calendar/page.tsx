const DUE_DATES = [
  { day: "7", item: "TDS deposit (previous month)" },
  { day: "15", item: "PF (ECR) due date" },
  { day: "15", item: "ESI contribution due date" },
  { day: "21", item: "ESI payment last date" },
  { day: "25", item: "PF return filing" },
  { day: "Varies by state", item: "Professional Tax payment" },
  { day: "15 Jun/Sep/Dec/Mar", item: "Advance tax (employer TDS reconciliation)" },
  { day: "31 May", item: "Form 16 issuance to employees" }
];

export default function ComplianceCalendarPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Compliance Calendar</h1>
      <p className="text-sm text-ink/50 mb-6">Standard statutory due dates — verify against current notifications for your state/year.</p>
      <div className="bg-white border border-line rounded-xl overflow-hidden max-w-lg">
        <div className="overflow-x-auto">
        <table className="w-full text-sm"><tbody>
          {DUE_DATES.map((d, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5 font-mono text-ink/70 whitespace-nowrap">{d.day}</td>
              <td className="px-4 py-2.5 text-ink">{d.item}</td>
            </tr>
          ))}
        </tbody></table>
        </div>
      </div>
    </div>
  );
}
