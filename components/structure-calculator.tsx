"use client";

import { useState } from "react";

interface CalcResult {
  valid: boolean;
  values?: Record<string, number>;
  order?: string[];
  issues?: { code: string; message: string }[];
  error?: string;
}

export function StructureCalculator({ structureId }: { structureId: string }) {
  const [gross, setGross] = useState("50000");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runCalculation() {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary-structure/${structureId}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gross: Number(gross) })
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white border border-line rounded-xl p-5">
      <h2 className="text-sm font-semibold text-ink mb-1">Test calculation</h2>
      <p className="text-xs text-ink/50 mb-4">
        Validates every formula and runs them in dependency order — no
        developer needed to check a formula change.
      </p>

      <div className="flex items-end gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink/70 mb-1.5">Gross (monthly)</label>
          <input
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            type="number"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <button
          onClick={runCalculation}
          disabled={loading}
          className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Calculating…" : "Calculate"}
        </button>
      </div>

      {result && !result.valid && (
        <div className="space-y-1">
          {(result.issues ?? [{ code: "", message: result.error ?? "Invalid structure" }]).map((issue, i) => (
            <p key={i} className="text-sm text-warn">
              {issue.code ? <span className="font-mono">{issue.code}</span> : null}
              {issue.code ? ": " : ""}
              {issue.message}
            </p>
          ))}
        </div>
      )}

      {result?.valid && result.values && (
        <table className="w-full text-sm">
          <tbody>
            {result.order!.map((code) => (
              <tr key={code} className="border-t border-line">
                <td className="py-1.5 font-mono text-ink/70">{code}</td>
                <td className="py-1.5 text-right text-ink">
                  ₹{result.values![code].toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
