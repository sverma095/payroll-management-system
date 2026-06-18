import { Node } from "./parser";

export class FormulaEvaluationError extends Error {}

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  MIN: (...args) => Math.min(...args),
  MAX: (...args) => Math.max(...args),
  ROUND: (a, digits = 0) => {
    const factor = Math.pow(10, digits);
    return Math.round(a * factor) / factor;
  },
  ABS: (a) => Math.abs(a),
  FLOOR: (a) => Math.floor(a),
  CEIL: (a) => Math.ceil(a),
  IF: (cond, then, otherwise) => (cond !== 0 ? then : otherwise)
};

/** context keys must be UPPERCASE component/variable codes */
export function evaluate(node: Node, context: Record<string, number>): number {
  switch (node.kind) {
    case "number":
      return node.value;
    case "identifier": {
      const key = node.name.toUpperCase();
      if (!(key in context)) {
        throw new FormulaEvaluationError(`Unknown component or variable: ${node.name}`);
      }
      return context[key];
    }
    case "unary_minus":
      return -evaluate(node.operand, context);
    case "percent":
      return evaluate(node.operand, context) / 100;
    case "compare": {
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      switch (node.op) {
        case ">":
          return left > right ? 1 : 0;
        case "<":
          return left < right ? 1 : 0;
        case ">=":
          return left >= right ? 1 : 0;
        case "<=":
          return left <= right ? 1 : 0;
        case "==":
          return left === right ? 1 : 0;
        case "!=":
          return left !== right ? 1 : 0;
      }
      break;
    }
    case "binary": {
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          if (right === 0) {
            throw new FormulaEvaluationError("Division by zero");
          }
          return left / right;
      }
      break;
    }
    case "call": {
      const fn = FUNCTIONS[node.name.toUpperCase()];
      if (!fn) {
        throw new FormulaEvaluationError(`Unknown function: ${node.name}`);
      }
      const args = node.args.map((a) => evaluate(a, context));
      return fn(...args);
    }
  }
  throw new FormulaEvaluationError("Unable to evaluate formula");
}
