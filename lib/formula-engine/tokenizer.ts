export type TokenType =
  | "NUMBER"
  | "IDENT"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "PERCENT"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const MULT_ALIASES = new Set(["×", "x", "X", "*"]);

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
  const isIdentChar = (c: string) => /[A-Za-z0-9_]/.test(c);

  while (i < input.length) {
    const c = input[i];

    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }

    if (isDigit(c) || (c === "." && isDigit(input[i + 1] ?? ""))) {
      let start = i;
      while (i < input.length && (isDigit(input[i]) || input[i] === ".")) i++;
      tokens.push({ type: "NUMBER", value: input.slice(start, i), pos: start });
      continue;
    }

    if (isIdentStart(c)) {
      let start = i;
      while (i < input.length && isIdentChar(input[i])) i++;
      tokens.push({ type: "IDENT", value: input.slice(start, i), pos: start });
      continue;
    }

    if (MULT_ALIASES.has(c)) {
      tokens.push({ type: "STAR", value: c, pos: i });
      i++;
      continue;
    }

    switch (c) {
      case "+":
        tokens.push({ type: "PLUS", value: c, pos: i });
        i++;
        continue;
      case "-":
        tokens.push({ type: "MINUS", value: c, pos: i });
        i++;
        continue;
      case "/":
      case "÷":
        tokens.push({ type: "SLASH", value: c, pos: i });
        i++;
        continue;
      case "%":
        tokens.push({ type: "PERCENT", value: c, pos: i });
        i++;
        continue;
      case "(":
        tokens.push({ type: "LPAREN", value: c, pos: i });
        i++;
        continue;
      case ")":
        tokens.push({ type: "RPAREN", value: c, pos: i });
        i++;
        continue;
      case ",":
        tokens.push({ type: "COMMA", value: c, pos: i });
        i++;
        continue;
      default:
        throw new FormulaSyntaxError(`Unexpected character '${c}'`, i);
    }
  }

  tokens.push({ type: "EOF", value: "", pos: i });
  return tokens;
}

export class FormulaSyntaxError extends Error {
  pos: number;
  constructor(message: string, pos: number) {
    super(message);
    this.name = "FormulaSyntaxError";
    this.pos = pos;
  }
}
