import { Token, tokenize, FormulaSyntaxError } from "./tokenizer";

export type Node =
  | { kind: "number"; value: number }
  | { kind: "identifier"; name: string }
  | { kind: "unary_minus"; operand: Node }
  | { kind: "percent"; operand: Node }
  | { kind: "binary"; op: "+" | "-" | "*" | "/"; left: Node; right: Node }
  | { kind: "compare"; op: ">" | "<" | ">=" | "<=" | "==" | "!="; left: Node; right: Node }
  | { kind: "call"; name: string; args: Node[] };

class Parser {
  private tokens: Token[];
  private idx = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.idx];
  }

  private next(): Token {
    return this.tokens[this.idx++];
  }

  private expect(type: Token["type"]): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new FormulaSyntaxError(`Expected ${type} but got '${t.value || "end of formula"}'`, t.pos);
    }
    return this.next();
  }

  parseExpression(): Node {
    const left = this.parseAdditive();
    const t = this.peek();
    if (t.type === "GT" || t.type === "LT" || t.type === "GTE" || t.type === "LTE" || t.type === "EQ" || t.type === "NEQ") {
      this.next();
      const right = this.parseAdditive();
      const op = t.value as "<" | ">" | ">=" | "<=" | "==" | "!=";
      return { kind: "compare", op, left, right };
    }
    return left;
  }

  private parseAdditive(): Node {
    let node = this.parseTerm();
    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.next().type === "PLUS" ? "+" : "-";
      const right = this.parseTerm();
      node = { kind: "binary", op, left: node, right };
    }
    return node;
  }

  private parseTerm(): Node {
    let node = this.parseUnary();
    while (this.peek().type === "STAR" || this.peek().type === "SLASH") {
      const op = this.next().type === "STAR" ? "*" : "/";
      const right = this.parseUnary();
      node = { kind: "binary", op, left: node, right };
    }
    return node;
  }

  private parseUnary(): Node {
    if (this.peek().type === "MINUS") {
      this.next();
      return { kind: "unary_minus", operand: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Node {
    let node = this.parsePrimary();
    while (this.peek().type === "PERCENT") {
      this.next();
      node = { kind: "percent", operand: node };
    }
    return node;
  }

  private parsePrimary(): Node {
    const t = this.peek();

    if (t.type === "NUMBER") {
      this.next();
      return { kind: "number", value: parseFloat(t.value) };
    }

    if (t.type === "IDENT") {
      this.next();
      if (this.peek().type === "LPAREN") {
        this.next();
        const args: Node[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseExpression());
          while (this.peek().type === "COMMA") {
            this.next();
            args.push(this.parseExpression());
          }
        }
        this.expect("RPAREN");
        return { kind: "call", name: t.value, args };
      }
      return { kind: "identifier", name: t.value };
    }

    if (t.type === "LPAREN") {
      this.next();
      const node = this.parseExpression();
      this.expect("RPAREN");
      return node;
    }

    throw new FormulaSyntaxError(`Unexpected token '${t.value || "end of formula"}'`, t.pos);
  }

  atEnd(): boolean {
    return this.peek().type === "EOF";
  }

  peekToken(): Token {
    return this.peek();
  }
}

export function parseFormula(input: string): Node {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  const node = parser.parseExpression();
  if (!parser.atEnd()) {
    const trailing = parser.peekToken();
    throw new FormulaSyntaxError(`Unexpected token '${trailing.value}' after end of expression`, trailing.pos);
  }
  return node;
}

/** Collects every identifier referenced in a formula, excluding function names. */
export function extractIdentifiers(node: Node): Set<string> {
  const names = new Set<string>();
  const visit = (n: Node) => {
    switch (n.kind) {
      case "identifier":
        names.add(n.name.toUpperCase());
        break;
      case "unary_minus":
      case "percent":
        visit(n.operand);
        break;
      case "binary":
      case "compare":
        visit(n.left);
        visit(n.right);
        break;
      case "call":
        n.args.forEach(visit);
        break;
    }
  };
  visit(node);
  return names;
}
