import { createHash } from "node:crypto";

/** Maximum formula expression length before rejection. */
export const MAX_FORMULA_LENGTH = 4096;
/** Maximum nesting depth for expressions. */
export const MAX_NESTING_DEPTH = 64;
/** Maximum number of cells in a referenced range. */
export const MAX_RANGE_SIZE = 10000;
/** Maximum evaluation workload (number of operations). */
export const MAX_EVAL_STEPS = 100000;

export type CellRef = string;

export interface CellAddress {
  sheetId: string;
  ref: string;
}

export interface RangeReference {
  start: CellAddress;
  end: CellAddress;
}

export type TokenKind =
  | "number"
  | "string"
  | "cell"
  | "range"
  | "function"
  | "operator"
  | "paren"
  | "comma"
  | "end";

export interface Token {
  kind: TokenKind;
  value: string;
  pos: number;
}

export type ExprNode =
  | { kind: "number"; value: number }
  | { kind: "cell"; ref: string }
  | { kind: "range"; start: string; end: string }
  | { kind: "binary"; op: string; left: ExprNode; right: ExprNode }
  | { kind: "unary"; op: string; operand: ExprNode }
  | { kind: "call"; name: string; args: ExprNode[] };

export interface EvalContext {
  sheets: Map<string, Map<string, { raw: string; value: number | string; error?: string }>>;
  currentSheetId: string;
  steps: number;
}

export interface EvalResult {
  value: number | string | number[];
  error?: string;
}

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  SUM: (args) => args.reduce((a, b) => a + b, 0),
  AVERAGE: (args) => (args.length === 0 ? 0 : args.reduce((a, b) => a + b, 0) / args.length),
  MIN: (args) => (args.length === 0 ? 0 : Math.min(...args)),
  MAX: (args) => (args.length === 0 ? 0 : Math.max(...args)),
  COUNT: (args) => args.length,
};

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  const upper = expr.toUpperCase();

  while (pos < expr.length) {
    const ch = expr[pos];

    if (ch === " " || ch === "\t") {
      pos++;
      continue;
    }

    if (ch === ",") {
      tokens.push({ kind: "comma", value: ",", pos });
      pos++;
      continue;
    }

    if (ch === "(" || ch === ")") {
      tokens.push({ kind: "paren", value: ch, pos });
      pos++;
      continue;
    }

    if ("+-*/%^".includes(ch)) {
      tokens.push({ kind: "operator", value: ch, pos });
      pos++;
      continue;
    }

    if (`"'"`.includes(ch)) {
      const quote = ch;
      pos++;
      let str = "";
      while (pos < expr.length && expr[pos] !== quote) {
        if (expr[pos] === "\\") {
          pos++;
          if (pos < expr.length) str += expr[pos++];
        } else {
          str += expr[pos++];
        }
      }
      if (pos < expr.length) pos++; // closing quote
      tokens.push({ kind: "string", value: str, pos });
      continue;
    }

    if (/[A-Z]/.test(ch)) {
      let ref = "";
      while (pos < expr.length && /[A-Z0-9:]/.test(expr[pos])) {
        ref += expr[pos++];
      }
      const rangeMatch = /^([A-Z]+[1-9][0-9]*):([A-Z]+[1-9][0-9]*)$/.exec(ref);
      if (rangeMatch) {
        tokens.push({ kind: "range", value: ref.toUpperCase(), pos: pos - ref.length });
        continue;
      }
      const cellMatch = /^([A-Z]+[1-9][0-9]*)$/.exec(ref.toUpperCase());
      if (cellMatch) {
        tokens.push({ kind: "cell", value: cellMatch[1], pos: pos - ref.length });
        continue;
      }
      tokens.push({ kind: "function", value: ref.toUpperCase(), pos: pos - ref.length });
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (pos < expr.length && /[0-9.]/.test(expr[pos])) {
        num += expr[pos++];
      }
      tokens.push({ kind: "number", value: num, pos: pos - num.length });
      continue;
    }

    throw new Error(`unexpected character '${ch}' at position ${pos}`);
  }

  tokens.push({ kind: "end", value: "", pos });
  return tokens;
}

export function parse(tokens: Token[]): ExprNode {
  let pos = 0;

  const peek = (): Token => tokens[pos];
  const consume = (expectedKind?: TokenKind): Token => {
    const tok = tokens[pos];
    if (expectedKind && tok.kind !== expectedKind) {
      throw new Error(`expected ${expectedKind}, got ${tok.kind} at position ${tok.pos}`);
    }
    pos++;
    return tok;
  };

  const parseExpression = (): ExprNode => {
    let left = parseTerm();
    while (peek().kind === "operator" && (peek().value === "+" || peek().value === "-")) {
      const op = consume().value;
      const right = parseTerm();
      left = { kind: "binary", op, left, right };
    }
    return left;
  };

  const parseTerm = (): ExprNode => {
    let left = parseFactor();
    while (peek().kind === "operator" && (peek().value === "*" || peek().value === "/" || peek().value === "%")) {
      const op = consume().value;
      const right = parseFactor();
      left = { kind: "binary", op, left, right };
    }
    return left;
  };

  const parseFactor = (): ExprNode => {
    const tok = peek();
    if (tok.kind === "operator" && tok.value === "-") {
      consume();
      const operand = parseFactor();
      return { kind: "unary", op: "-", operand };
    }
    if (tok.kind === "operator" && tok.value === "+") {
      consume();
      return parseFactor();
    }
    if (tok.kind === "paren" && tok.value === "(") {
      consume();
      const expr = parseExpression();
      consume("paren");
      return expr;
    }
    if (tok.kind === "number") {
      consume();
      return { kind: "number", value: Number(tok.value) };
    }
    if (tok.kind === "string") {
      consume();
      return { kind: "number", value: 0 }; // strings are not numeric
    }
    if (tok.kind === "cell") {
      consume();
      return { kind: "cell", ref: tok.value };
    }
    if (tok.kind === "range") {
      consume();
      const [start, end] = tok.value.split(":");
      return { kind: "range", start, end };
    }
    if (tok.kind === "function") {
      consume();
      const name = tok.value;
      consume("paren"); // (
      const args: ExprNode[] = [];
      if (peek().kind !== "paren") {
        args.push(parseExpression());
        while (peek().kind === "comma") {
          consume("comma");
          args.push(parseExpression());
        }
      }
      consume("paren"); // )
      return { kind: "call", name, args };
    }
    throw new Error(`unexpected token ${tok.kind} at position ${tok.pos}`);
  };

  const ast = parseExpression();
  if (peek().kind !== "end") {
    throw new Error(`unexpected token ${peek().kind} at position ${peek().pos}`);
  }
  return ast;
}

export function evaluate(
  node: ExprNode,
  ctx: EvalContext,
  depth = 0
): EvalResult {
  if (depth > MAX_NESTING_DEPTH) {
    return { value: "", error: "NESTING_LIMIT_EXCEEDED" };
  }
  ctx.steps++;
  if (ctx.steps > MAX_EVAL_STEPS) {
    return { value: "", error: "WORKLOAD_LIMIT_EXCEEDED" };
  }

  switch (node.kind) {
    case "number":
      return { value: node.value };
    case "cell": {
      const sheet = ctx.sheets.get(ctx.currentSheetId);
      if (!sheet) return { value: "", error: "REF_ERROR" };
      const cell = sheet.get(node.ref);
      if (!cell) return { value: 0, error: "REF_ERROR" };
      if (cell.error) return { value: "", error: cell.error };
      if (typeof cell.value === "number") return { value: cell.value };
      if (typeof cell.value === "string" && /^-?\d+(\.\d+)?$/.test(cell.value)) {
        return { value: Number(cell.value) };
      }
      return { value: 0, error: "VALUE_ERROR" };
    }
    case "range": {
      const values = resolveRange(ctx, node.start, node.end);
      return { value: values, error: undefined };
    }
    case "unary": {
      const val = evaluate(node.operand, ctx, depth + 1);
      if (val.error) return val;
      if (typeof val.value !== "number") return { value: "", error: "TYPE_ERROR" };
      return { value: node.op === "-" ? -val.value : val.value };
    }
    case "binary": {
      const left = evaluate(node.left, ctx, depth + 1);
      if (left.error) return left;
      const right = evaluate(node.right, ctx, depth + 1);
      if (right.error) return right;
      if (typeof left.value !== "number" || typeof right.value !== "number") {
        return { value: "", error: "TYPE_ERROR" };
      }
      switch (node.op) {
        case "+": return { value: left.value + right.value };
        case "-": return { value: left.value - right.value };
        case "*": return { value: left.value * right.value };
        case "/":
          if (right.value === 0) return { value: "", error: "DIV_BY_ZERO" };
          return { value: left.value / right.value };
        case "%":
          if (right.value === 0) return { value: "", error: "DIV_BY_ZERO" };
          return { value: left.value % right.value };
        case "^": return { value: Math.pow(left.value, right.value) };
        default: return { value: "", error: "OP_ERROR" };
      }
    }
    case "call": {
      const fn = FUNCTIONS[node.name];
      if (!fn) return { value: "", error: `UNKNOWN_FUNCTION:${node.name}` };
      const argValues: number[] = [];
      for (const arg of node.args) {
        const result = evaluate(arg, ctx, depth + 1);
        if (result.error) return result;
        if (typeof result.value === "number") {
          argValues.push(result.value);
        } else if (Array.isArray(result.value)) {
          argValues.push(...result.value);
        } else {
          return { value: "", error: "TYPE_ERROR" };
        }
      }
      try {
        return { value: fn(argValues) };
      } catch {
        return { value: "", error: "EVAL_ERROR" };
      }
    }
    default:
      return { value: "", error: "INTERNAL_ERROR" };
  }
}

function resolveRange(
  ctx: EvalContext,
  startRef: string,
  endRef: string
): number[] {
  const start = parseRef(startRef);
  const end = parseRef(endRef);
  if (!start || !end) return [];

  const values: number[] = [];
  for (let r = start.row; r <= end.row; r++) {
    for (let c = start.col; c <= end.col; c++) {
      if (values.length >= MAX_RANGE_SIZE) {
        break;
      }
      const ref = `${colToLetter(c)}${r}`;
      const sheet = ctx.sheets.get(ctx.currentSheetId);
      if (!sheet) continue;
      const cell = sheet.get(ref);
      if (!cell || cell.error) continue;
      if (typeof cell.value === "number") {
        values.push(cell.value);
      } else if (typeof cell.value === "string" && /^-?\d+(\.\d+)?$/.test(cell.value)) {
        values.push(Number(cell.value));
      }
    }
  }
  return values;
}

interface RefParts {
  col: number;
  row: number;
}

function parseRef(ref: string): RefParts | null {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!m) return null;
  return {
    col: colToIndex(m[1]),
    row: Number(m[2]),
  };
}

function colToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx;
}

function colToLetter(idx: number): string {
  let col = "";
  while (idx > 0) {
    idx--;
    col = String.fromCharCode(65 + (idx % 26)) + col;
    idx = Math.floor(idx / 26);
  }
  return col;
}

export function computeChecksum(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
