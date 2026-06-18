export interface DependencyResolutionResult {
  order: string[]; // component codes (uppercase) in safe evaluation order
}

export class CircularDependencyError extends Error {
  cycle: string[];
  constructor(cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(" → ")}`);
    this.name = "CircularDependencyError";
    this.cycle = cycle;
  }
}

/**
 * Given a map of component code -> set of identifiers it depends on,
 * returns a safe evaluation order. Identifiers that aren't keys in the map
 * (e.g. an external input like GROSS) are treated as already-available
 * leaves and don't need ordering themselves.
 */
export function resolveDependencyOrder(
  dependencies: Map<string, Set<string>>
): DependencyResolutionResult {
  const visited = new Set<string>();
  const inProgress = new Set<string>();
  const order: string[] = [];

  const visit = (code: string, path: string[]) => {
    if (visited.has(code)) return;
    if (inProgress.has(code)) {
      throw new CircularDependencyError([...path, code]);
    }
    inProgress.add(code);

    const deps = dependencies.get(code) ?? new Set();
    for (const dep of deps) {
      if (dependencies.has(dep)) {
        visit(dep, [...path, code]);
      }
    }

    inProgress.delete(code);
    visited.add(code);
    order.push(code);
  };

  for (const code of dependencies.keys()) {
    visit(code, []);
  }

  return { order };
}
