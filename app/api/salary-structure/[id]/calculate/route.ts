import { createClient } from "@/lib/supabase/server";
import { validateStructure, computeStructure, FormulaEvaluationError } from "@/lib/formula-engine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const gross = Number(body.gross ?? 0);

  if (!Number.isFinite(gross) || gross < 0) {
    return NextResponse.json({ error: "Gross must be a non-negative number" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: details } = await supabase
    .from("salary_structure_details")
    .select("formula, salary_components(component_code)")
    .eq("salary_structure_id", params.id);

  const components = (details ?? [])
    .filter((d: any) => d.salary_components?.component_code)
    .map((d: any) => ({ code: d.salary_components.component_code as string, formula: d.formula as string }));

  if (components.length === 0) {
    return NextResponse.json({ error: "This structure has no formula lines yet" }, { status: 400 });
  }

  const validation = validateStructure(components, ["GROSS"]);
  if (!validation.valid) {
    return NextResponse.json({ valid: false, issues: validation.issues }, { status: 200 });
  }

  try {
    const result = computeStructure(components, { GROSS: gross });
    return NextResponse.json({ valid: true, values: result.values, order: result.order });
  } catch (err) {
    const message = err instanceof FormulaEvaluationError ? err.message : "Calculation failed";
    return NextResponse.json({ valid: false, issues: [{ code: "", message }] }, { status: 200 });
  }
}
