import { parseFormula, extractIdentifiers, Node } from "./parser";
import { evaluate, FormulaEvaluationError } from "./evaluator";
import { resolveDependencyOrder, CircularDependencyError } from "./resolver";
import { FormulaSyntaxError } from "./tokenizer";

export { FormulaSyntaxError, FormulaEvaluationError, CircularDependencyError };

export interface ComponentFormula {
  /** component_code from salary_components, used as the formula variable name */
  code: string;
  formula: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  evaluationOrder: string[]; // empty if a cycle was found
}

/**
 * Validates a whole salary structure: every formula must parse, every
 * identifier it references must resolve to either another component in the
 * structure or a declared input variable (e.g. GROSS), and there must be no
 * circular dependency.
 */
export function validateStructure(
  components: ComponentFormula[],
  inputVariables: string[] = ["GROSS"]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const knownInputs = new Set(inputVariables.map((v) => v.toUpperCase()));
  const dependencyMap = new Map<string, Set<string>>();
  const asts = new Map<string, Node>();

  for (const c of components) {
    const code = c.code.toUpperCase();
    try {
      const ast = parseFormula(c.formula);
      asts.set(code, ast);
      const deps = extractIdentifiers(ast);
      dependencyMap.set(code, deps);

      for (const dep of deps) {
        const isKnownComponent = components.some((other) => other.code.toUpperCase() === dep);
        if (!isKnownComponent && !knownInputs.has(dep)) {
          issues.push({
            code: c.code,
            message: `References unknown component or variable: ${dep}`
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid formula";
      issues.push({ code: c.code, message });
    }
  }

  let evaluationOrder: string[] = [];
  if (issues.length === 0) {
    try {
      evaluationOrder = resolveDependencyOrder(dependencyMap).order;
    } catch (err) {
      if (err instanceof CircularDependencyError) {
        issues.push({ code: err.cycle[0] ?? "", message: err.message });
      } else {
        throw err;
      }
    }
  }

  return { valid: issues.length === 0, issues, evaluationOrder };
}

/**
 * Computes every component's value for one employee/month, given input
 * variables (e.g. { GROSS: 50000 }). Throws if the structure doesn't
 * validate — call validateStructure first if you want to surface errors
 * per-component instead of failing the whole computation.
 */
export function computeStructure(
  components: ComponentFormula[],
  inputs: Record<string, number>
): { values: Record<string, number>; order: string[] } {
  const validation = validateStructure(components, Object.keys(inputs));
  if (!validation.valid) {
    const first = validation.issues[0];
    throw new FormulaEvaluationError(`${first.code}: ${first.message}`);
  }

  const context: Record<string, number> = {};
  for (const [k, v] of Object.entries(inputs)) context[k.toUpperCase()] = v;

  const byCode = new Map(components.map((c) => [c.code.toUpperCase(), c]));

  for (const code of validation.evaluationOrder) {
    const comp = byCode.get(code)!;
    const ast = parseFormula(comp.formula);
    context[code] = evaluate(ast, context);
  }

  return { values: context, order: validation.evaluationOrder };
}
