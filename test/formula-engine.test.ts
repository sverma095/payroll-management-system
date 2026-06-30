import { computeStructure, validateStructure } from "../lib/formula-engine";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${label}`);
  }
}

const components = [
  { code: "Basic", formula: "Gross × 50%" },
  { code: "HRA", formula: "Basic × 40%" },
  { code: "PF", formula: "Min(Basic,15000) × 12%" }
];
const { values } = computeStructure(components, { GROSS: 50000 });
assertEqual(values.BASIC, 25000, "basic 50% of gross");
assertEqual(values.HRA, 10000, "hra 40% of basic");
assertEqual(values.PF, 1800, "pf capped at 15000 base");

const circular = validateStructure([{ code: "A", formula: "B + 1" }, { code: "B", formula: "A + 1" }]);
assertEqual(circular.valid, false, "circular dependency rejected");

const ifTest = computeStructure([{ code: "PT", formula: "IF(Gross > 15000, 200, 0)" }], { GROSS: 20000 });
assertEqual(ifTest.values.PT, 200, "IF/comparison works");
