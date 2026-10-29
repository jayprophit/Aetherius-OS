import { EventLedger, nowIso } from "../../app-kit/src/index.ts";

/**
 * Calculator core.
 *
 * A recursive-descent expression evaluator with deterministic precedence,
 * functions, constants, history and memory. It is not a symbolic algebra
 * system and it uses IEEE-754 doubles, so it is a calculator, not a money
 * engine.
 */

type Token =
  | { kind: "number"; value: number }
  | { kind: "name"; value: string }
  | { kind: "operator"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" };

interface FunctionSpec {
  minArgs: number;
  maxArgs: number;
  apply: (args: number[]) => number;
}

const FUNCTIONS: Record<string, FunctionSpec> = {
  sqrt: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.sqrt(x!) },
  abs: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.abs(x!) },
  round: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.round(x!) },
  floor: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.floor(x!) },
  ceil: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.ceil(x!) },
  ln: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.log(x!) },
  log: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.log10(x!) },
  sin: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.sin(x!) },
  cos: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.cos(x!) },
  tan: { minArgs: 1, maxArgs: 1, apply: ([x]) => Math.tan(x!) },
  min: { minArgs: 1, maxArgs: 8, apply: (args) => Math.min(...args) },
  max: { minArgs: 1, maxArgs: 8, apply: (args) => Math.max(...args) },
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index]!;
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(input.slice(index));
      if (!match) throw new Error(`invalid number at position ${index}`);
      tokens.push({ kind: "number", value: Number(match[0]) });
      index += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(input.slice(index))!;
      tokens.push({ kind: "name", value: match[0].toLowerCase() });
      index += match[0].length;
      continue;
    }
    if ("+-*/%^,".includes(char)) {
      tokens.push({ kind: "operator", value: char });
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "lparen" });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "rparen" });
      index += 1;
      continue;
    }
    throw new Error(`unexpected character at position ${index}: ${char}`);
  }
  return tokens;
}

class Parser {
  private readonly tokens: Token[];
  private position = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): number {
    if (this.tokens.length === 0) throw new Error("the expression is empty");
    const value = this.expression();
    if (this.position !== this.tokens.length) throw new Error("unexpected trailing input");
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private consume(): Token {
    const token = this.tokens[this.position];
    if (!token) throw new Error("the expression ends unexpectedly");
    this.position += 1;
    return token;
  }

  private expression(): number {
    let value = this.term();
    for (;;) {
      const token = this.peek();
      if (token?.kind === "operator" && (token.value === "+" || token.value === "-")) {
        this.consume();
        const right = this.term();
        value = token.value === "+" ? value + right : value - right;
      } else {
        return value;
      }
    }
  }

  private term(): number {
    let value = this.unary();
    for (;;) {
      const token = this.peek();
      if (token?.kind === "operator" && ["*", "/", "%"].includes(token.value)) {
        this.consume();
        const right = this.unary();
        if ((token.value === "/" || token.value === "%") && right === 0) throw new Error("division by zero");
        value = token.value === "*" ? value * right : token.value === "/" ? value / right : value % right;
      } else {
        return value;
      }
    }
  }

  private unary(): number {
    const token = this.peek();
    if (token?.kind === "operator" && (token.value === "-" || token.value === "+")) {
      this.consume();
      const value = this.unary();
      return token.value === "-" ? -value : value;
    }
    return this.power();
  }

  private power(): number {
    const base = this.primary();
    const token = this.peek();
    if (token?.kind === "operator" && token.value === "^") {
      this.consume();
      // Right associative: 2^3^2 is 2^(3^2).
      return base ** this.unary();
    }
    return base;
  }

  private primary(): number {
    const token = this.consume();
    if (token.kind === "number") return token.value;
    if (token.kind === "lparen") {
      const value = this.expression();
      if (!this.peek()) throw new Error("missing closing parenthesis");
      const close = this.consume();
      if (close.kind !== "rparen") throw new Error("missing closing parenthesis");
      return value;
    }
    if (token.kind === "name") {
      const next = this.peek();
      if (next?.kind === "lparen") {
        this.consume();
        const args: number[] = [];
        if (this.peek()?.kind !== "rparen") {
          for (;;) {
            args.push(this.expression());
            const separator = this.peek();
            if (separator?.kind === "operator" && separator.value === ",") {
              this.consume();
              continue;
            }
            break;
          }
        }
        const close = this.consume();
        if (close.kind !== "rparen") throw new Error("missing closing parenthesis in call");
        const spec = FUNCTIONS[token.value];
        if (!spec) throw new Error(`unknown function: ${token.value}`);
        if (args.length < spec.minArgs || args.length > spec.maxArgs) {
          throw new Error(`${token.value} expects between ${spec.minArgs} and ${spec.maxArgs} arguments`);
        }
        return spec.apply(args);
      }
      const constant = CONSTANTS[token.value];
      if (constant === undefined) throw new Error(`unknown name: ${token.value}`);
      return constant;
    }
    throw new Error("expected a number, name or parenthesised expression");
  }
}

export function evaluate(expression: string): number {
  if (typeof expression !== "string" || !expression.trim()) throw new Error("the expression is empty");
  const value = new Parser(tokenize(expression)).parse();
  if (!Number.isFinite(value)) throw new Error("the result is not a finite number");
  return value;
}

export interface Calculation {
  expression: string;
  result: number;
  at: string;
}

export interface CalculatorOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CalculatorSession {
  private readonly calculations: Calculation[] = [];
  private memoryValue = 0;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CalculatorOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  evaluate(expression: string): number {
    const result = evaluate(expression);
    this.calculations.push({ expression: expression.trim(), result, at: nowIso(this.clock) });
    this.ledger.append({ type: "calculator.evaluated", actor: "calculator", subject: "expression", data: { result } });
    return result;
  }

  history(): Calculation[] {
    return this.calculations.map((calculation) => ({ ...calculation }));
  }

  clearHistory(): void {
    this.calculations.length = 0;
  }

  memory(): number {
    return this.memoryValue;
  }

  memoryAdd(value: number): number {
    if (!Number.isFinite(value)) throw new Error("memory needs a finite number");
    this.memoryValue += value;
    return this.memoryValue;
  }

  memorySubtract(value: number): number {
    if (!Number.isFinite(value)) throw new Error("memory needs a finite number");
    this.memoryValue -= value;
    return this.memoryValue;
  }

  memoryClear(): void {
    this.memoryValue = 0;
  }
}
