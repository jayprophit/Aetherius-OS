import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import {
  tokenize,
  parse,
  evaluate,
  type EvalContext,
  MAX_FORMULA_LENGTH,
  computeChecksum,
} from "./formula-engine.ts";

export type CellValue = number | string;
export type EvalValue = CellValue | CellValue[];

export interface SheetCell {
  ref: string;
  raw: string;
  value: CellValue;
  error?: string;
  formula?: boolean;
  dependencies?: string[];
}

export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, SheetCell>;
}

export interface Workbook {
  id: string;
  name: string;
  sheets: SheetData[];
  activeSheetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SheetsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  storageDir?: string;
}

export class Sheets {
  private readonly workbooks = new Map<string, Workbook>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly storageDir: string;

  constructor(options: SheetsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.storageDir = options.storageDir ?? "./sheets-data";
  }

  createWorkbook(name: string): Workbook {
    const now = nowIso(this.clock);
    const workbook: Workbook = {
      id: newId("workbook"),
      name,
      sheets: [this.createSheet("Sheet1")],
      activeSheetId: "",
      createdAt: now,
      updatedAt: now,
    };
    workbook.activeSheetId = workbook.sheets[0].id;
    this.workbooks.set(workbook.id, workbook);
    this.ledger.append({ type: "sheets.created", actor: "sheets", subject: workbook.id });
    this.persist();
    return workbook;
  }

  createSheet(name: string): SheetData {
    return {
      id: newId("sheet"),
      name,
      cells: {},
    };
  }

  addSheet(workbookId: string, name: string): SheetData {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error("workbook not found");
    const sheet = this.createSheet(name);
    workbook.sheets.push(sheet);
    workbook.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "sheets.sheet.added", actor: "sheets", subject: sheet.id });
    this.persist();
    return sheet;
  }


  private evaluateWithEngine(workbook: Workbook, sheet: SheetData, expr: string, currentRef: string): { value: CellValue; error?: string } {
    // Check for direct self-reference in expression
    const refRegex = new RegExp("" + currentRef.replace(/[\-\/\^$.*+?()[\]{}|]/g, "\$&") + "");
    if (refRegex.test(expr)) {
      return { value: "", error: "CIRCULAR_REF" };
    }
    
    const tokens = this.tokenise(expr);
    const ast = this.parse(tokens, 0);
    const result = this.evaluateAST(ast.node, workbook, sheet, new Set([currentRef]));
    return this.scalarResult(result);
  }

  private evaluateFormula(formula: string, workbook: Workbook, sheet: SheetData): { value: CellValue; error?: string } {
    const tokens = this.tokenise(formula);
    const ast = this.parse(tokens, 0);
    return this.scalarResult(this.evaluateAST(ast.node, workbook, sheet, new Set()));
  }

  private scalarResult(result: { value: EvalValue; error?: string }): { value: CellValue; error?: string } {
    const { value, error } = result;
    if (Array.isArray(value)) {
      return { value: "", error: error ?? "ARRAY_NOT_SCALAR" };
    }
    return { value, error };
  }

  private tokenise(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
      if (expr[i] === " " || expr[i] === "	") {
        i++;
        continue;
      }
      if (/[0-9.]/.test(expr[i])) {
        let num = "";
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          num += expr[i];
          i++;
        }
        tokens.push(num);
        continue;
      }
      if (/[A-Z]/.test(expr[i])) {
        let ref = "";
        while (i < expr.length && /[A-Z]/.test(expr[i])) {
          ref += expr[i];
          i++;
        }
        while (i < expr.length && /[0-9]/.test(expr[i])) {
          ref += expr[i];
          i++;
        }
        tokens.push(ref);
        continue;
      }
      if ("+-*/()".includes(expr[i])) {
        tokens.push(expr[i]);
        i++;
        continue;
      }
      if (expr[i] === ",") {
        tokens.push(",");
        i++;
        continue;
      }
      if (expr[i] === ":") {
        tokens.push(":");
        i++;
        continue;
      }
      i++;
    }
    return tokens;
  }

  private parse(tokens: string[], pos: number): { node: any; pos: number } {
    const { node, pos: end2 } = this.parseExpression(tokens, pos);
    return { node, pos: end2 };
  }

  private parseExpression(tokens: string[], pos: number): { node: any; pos: number } {
    let { node, pos: cur } = this.parseTerm(tokens, pos);
    while (cur < tokens.length && (tokens[cur] === "+" || tokens[cur] === "-")) {
      const op = tokens[cur];
      cur++;
      const right = this.parseTerm(tokens, cur);
      node = { type: "binary", op, left: node, right: right.node };
      cur = right.pos;
    }
    return { node, pos: cur };
  }

  private parseTerm(tokens: string[], pos: number): { node: any; pos: number } {
    let { node, pos: cur } = this.parseFactor(tokens, pos);
    while (cur < tokens.length && (tokens[cur] === "*" || tokens[cur] === "/")) {
      const op = tokens[cur];
      cur++;
      const right = this.parseFactor(tokens, cur);
      node = { type: "binary", op, left: node, right: right.node };
      cur = right.pos;
    }
    return { node, pos: cur };
  }

  private parseFactor(tokens: string[], pos: number): { node: any; pos: number } {
    if (pos < tokens.length && tokens[pos] === "(") {
      pos++;
      const { node, pos: end2 } = this.parseExpression(tokens, pos);
      pos = end2 + 1;
      return { node, pos };
    }
    if (pos < tokens.length && tokens[pos] === "-") {
      pos++;
      const { node, pos: end2 } = this.parseFactor(tokens, pos);
      return { node: { type: "unary", op: "-", operand: node }, pos: end2 };
    }
    if (pos < tokens.length && tokens[pos] === "+") {
      pos++;
      const { node, pos: end2 } = this.parseFactor(tokens, pos);
      return { node, pos: end2 };
    }
    if (pos >= tokens.length) {
      return { node: { type: "number", value: 0 }, pos };
    }
    const token = tokens[pos];
    if (/^[0-9.]+$/.test(token)) {
      return { node: { type: "number", value: parseFloat(token) }, pos: pos + 1 };
    }
    if (/^[A-Z]+[1-9][0-9]*$/.test(token)) {
      return { node: { type: "ref", value: token }, pos: pos + 1 };
    }
    if (/^[A-Z]+$/.test(token) && pos + 1 < tokens.length && tokens[pos + 1] === "(") {
      return this.parseFunction(tokens, pos);
    }
    return { node: { type: "number", value: 0 }, pos: pos + 1 };
  }

  private parseFunction(tokens: string[], pos: number): { node: any; pos: number } {
    const fn = tokens[pos];
    pos++;
    if (pos >= tokens.length || tokens[pos] !== "(") {
      return { node: { type: "number", value: 0 }, pos };
    }
    pos++;
    const args: any[] = [];
    while (pos < tokens.length && tokens[pos] !== ")") {
      const { node, pos: end2 } = this.parseExpression(tokens, pos);
      pos = end2;
      if (pos < tokens.length && tokens[pos] === ":") {
        pos++;
        const { node: endNode, pos: endPos } = this.parseExpression(tokens, pos);
        args.push({ type: "range", start: node, end: endNode });
        pos = endPos;
      } else {
        args.push(node);
      }
      if (pos < tokens.length && tokens[pos] === ",") {
        pos++;
      }
    }
    if (pos < tokens.length && tokens[pos] === ")") {
      pos++;
    }
    return { node: { type: "function", name: fn, args }, pos };
  }

  private evaluateAST(node: any, workbook: Workbook, sheet: SheetData, visited: Set<string>): { value: EvalValue; error?: string } {
    if (!node) {
      return { value: 0 };
    }
    
    switch (node.type) {
      case "number":
        return { value: node.value };
      case "ref": {
        if (visited.has(node.value)) {
          return { value: "#CIRC!", error: "CIRCULAR_REF" };
        }
        visited.add(node.value);
        const cell = sheet.cells[node.value];
        if (!cell) {
          return { value: "#REF!", error: "INVALID_REF" };
        }
        if (cell.error) {
          return { value: cell.error };
        }
        return { value: cell.value as CellValue };
      }
      case "binary": {
        const left = this.evaluateAST(node.left, workbook, sheet, visited);
        const right = this.evaluateAST(node.right, workbook, sheet, visited);
        if (left.error) return left;
        if (right.error) return right;
        
        const l = Number(left.value);
        const r = Number(right.value);
        
        switch (node.op) {
          case "+": return { value: l + r };
          case "-": return { value: l - r };
          case "*": return { value: l * r };
          case "/":
            if (r === 0) {
              return { value: "#DIV/0!", error: "DIV_BY_ZERO" };
            }
            return { value: l / r };
          default:
            return { value: 0, error: "INVALID_OP" };
        }
      }
      case "unary": {
        const operand = this.evaluateAST(node.operand, workbook, sheet, visited);
        if (operand.error) return operand;
        const val = Number(operand.value);
        return { value: -val };
      }
      case "range": {
        const startCol = node.start.value.match(/^([A-Z]+)/)?.[1] || "";
        const startRow = parseInt(node.start.value.match(/([1-9][0-9]*)$/)?.[1] || "0");
        const endCol = node.end.value.match(/^([A-Z]+)/)?.[1] || "";
        const endRow = parseInt(node.end.value.match(/([1-9][0-9]*)$/)?.[1] || "0");
        
        const values: CellValue[] = [];
        const startIdx = this.colToIndex(startCol) - 1;
        const endIdx = this.colToIndex(endCol) - 1;
        
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startIdx; c <= endIdx; c++) {
            const ref = `${this.indexToCol(c)}${r}`;
            const cell = sheet.cells[ref];
            if (cell) {
              if (cell.error) return { value: cell.error };
              values.push(cell.value as CellValue);
            }
          }
        }
        
        return { value: values };
      }
      case "function": {
        const values: CellValue[] = [];
        for (const arg of node.args) {
          const result = this.evaluateAST(arg, workbook, sheet, visited);
          if (result.error) return result;
          if (Array.isArray(result.value)) {
            values.push(...result.value);
          } else {
            values.push(result.value);
          }
        }
        
        const nums = values.map(v => Number(v));
        
        switch (node.name) {
          case "SUM":
            return { value: nums.reduce((a, b) => a + b, 0) };
          case "AVERAGE":
            if (nums.length === 0) return { value: 0, error: "NO_ARGS" };
            return { value: nums.reduce((a, b) => a + b, 0) / nums.length };
          case "MIN":
            if (nums.length === 0) return { value: 0, error: "NO_ARGS" };
            return { value: Math.min(...nums) };
          case "MAX":
            if (nums.length === 0) return { value: 0, error: "NO_ARGS" };
            return { value: Math.max(...nums) };
          case "COUNT":
            return { value: nums.filter(n => !isNaN(n)).length };
          default:
            return { value: 0, error: `UNKNOWN_FUNCTION:${node.name}` };
        }
      }
      default:
        return { value: 0, error: "INVALID_AST" };
    }
  }

  setCell(workbookId: string, sheetId: string, ref: string, raw: string): SheetCell {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error("workbook not found");
    const sheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!sheet) throw new Error("sheet not found");

    const norm = this.normaliseRef(ref);
    const trimmed = raw.trim();
    const cell: SheetCell = {
      ref: norm,
      raw: trimmed,
      value: "",
      error: undefined,
      formula: trimmed.startsWith("="),
      dependencies: trimmed.startsWith("=") ? this.extractDependencies(trimmed.slice(1)) : undefined,
    };

    // Add cell to sheet before evaluation so circular references can be detected
    sheet.cells[norm] = cell;

    if (cell.formula) {
      const expr = trimmed.slice(1);
      
      // Resource limit check
      if (expr.length > MAX_FORMULA_LENGTH) {
        cell.error = "FORMULA_TOO_LONG";
        cell.value = "";
      } else {
        // Check for circular references using dependency graph
        const newDeps = this.extractDependencies(expr);
        if (this.hasCircularDependency(sheet, norm, new Set(newDeps))) {
          cell.error = "CIRCULAR_REF";
          cell.value = "";
        } else {
          const result = this.evaluateWithEngine(workbook, sheet, expr, norm);
          cell.value = result.value;
          cell.error = result.error;
        }
      }
    } else {
      const num = Number(trimmed);
      cell.value = trimmed === "" ? "" : Number.isNaN(num) ? trimmed : num;
    }

    // Recalculate dependent cells (skip if circular reference detected)
    if (cell.error !== "CIRCULAR_REF") {
      this.recalculateDependents(workbook, sheet, norm);
    }

    workbook.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "sheets.cell.set", actor: "sheets", subject: norm });
    this.persist();
    return cell;
  }

  getCell(workbookId: string, sheetId: string, ref: string): SheetCell | undefined {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error("workbook not found");
    const sheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!sheet) throw new Error("sheet not found");
    return sheet.cells[this.normaliseRef(ref)];
  }

  removeCell(workbookId: string, sheetId: string, ref: string): void {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error("workbook not found");
    const sheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!sheet) throw new Error("sheet not found");
    const norm = this.normaliseRef(ref);
    delete sheet.cells[norm];
    workbook.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "sheets.cell.removed", actor: "sheets", subject: norm });
    this.persist();
  }

  listCells(workbookId: string, sheetId: string): SheetCell[] {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error("workbook not found");
    const sheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!sheet) throw new Error("sheet not found");
    return Object.values(sheet.cells).sort((a, b) => a.ref.localeCompare(b.ref));
  }

  exportCsv(workbookId: string, sheetId: string): string {
    return this.exportCsvProfile(workbookId, sheetId, "data-exchange");
  }

  exportCsvProfile(workbookId: string, sheetId: string, profile: "data-exchange" | "spreadsheet-safe"): string {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error("workbook not found");
    const sheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!sheet) throw new Error("sheet not found");

    const cells = Object.values(sheet.cells);
    if (cells.length === 0) return "";

    const refs = cells.map((c) => c.ref);
    const maxRef = refs.sort().reverse()[0];
    const colMatch = /^([A-Z]+)/.exec(maxRef);
    const rowMatch = /([1-9][0-9]*)$/.exec(maxRef);
    if (!colMatch || !rowMatch) return "";

    const maxCol = this.colToIndex(colMatch[1]);
    const maxRow = parseInt(rowMatch[1], 10);

    const rows: string[] = [];
    for (let r = 1; r <= maxRow; r++) {
      const cols: string[] = [];
      for (let c = 0; c < maxCol; c++) {
        const ref = `${this.indexToCol(c)}${r}`;
        const cell = sheet.cells[ref];
        let val = cell ? String(cell.value) : "";
        
        // Security: escape formula injection for data-exchange profile
        if (profile === "data-exchange") {
          if (cell?.formula && cell.error) {
            // Reject cells that contain formula errors
            val = `#FORMULA_ERROR:${cell.error}`;
          } else if (this.isFormulaInjection(val)) {
            val = this.escapeFormulaInjection(val);
          }
        } else if (profile === "spreadsheet-safe") {
          // Prefix with tab to prevent formula execution in spreadsheet apps
          if (this.isFormulaInjection(val)) {
            val = "\t" + val;
          }
        }

        cols.push(this.escapeCsvField(val));
      }
      rows.push(cols.join(","));
    }
    return rows.join("\n");
  }

  private isFormulaInjection(val: string): boolean {
    if (!val) return false;
    const trimmed = val.trimStart();
    const dangerousPrefix = /^[=+\-@@\s\u3000\u00a0]+/;
    if (dangerousPrefix.test(trimmed)) return true;
    // Full-width variants
    if (/^[＝＋－＠\s]+/.test(trimmed)) return true;
    return false;
  }

  private escapeFormulaInjection(val: string): string {
    // Prefix with tab to neutralise formula execution
    return "\t" + val;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }
  getDependencyGraph(workbookId: string, sheetId: string): Record<string, string[]> {
    const workbook = this.workbooks.get(workbookId);
    if (!workbook) throw new Error('workbook not found');
    const sheet = workbook.sheets.find((s) => s.id === sheetId);
    if (!sheet) throw new Error('sheet not found');

    const graph: Record<string, string[]> = {};
    for (const cell of Object.values(sheet.cells)) {
      if (cell.dependencies && cell.dependencies.length > 0) {
        graph[cell.ref] = cell.dependencies;
      }
    }
    return graph;
  }

  getWorkbook(workbookId: string): Workbook | undefined {
    return this.workbooks.get(workbookId);
  }

  listWorkbooks(): Workbook[] {
    return Array.from(this.workbooks.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private persist(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
    const all = Array.from(this.workbooks.values());
    writeFileSync(`${this.storageDir}/workbooks.json`, JSON.stringify(all, null, 2));
  }

  load(): void {
    if (!existsSync(this.storageDir)) return;
    const path = `${this.storageDir}/workbooks.json`;
    if (!existsSync(path)) return;
    const raw = readFileSync(path, 'utf8');
    const data: Workbook[] = JSON.parse(raw);
    this.workbooks.clear();
    for (const wb of data) {
      this.workbooks.set(wb.id, wb);
    }
  }

  private normaliseRef(ref: string): string {
    const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(ref.trim().toUpperCase());
    if (!match) throw new Error(`invalid cell reference: ${ref}`);
    return `${match[1]}${match[2]}`;
  }

  private colToIndex(col: string): number {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
      idx = idx * 26 + (col.charCodeAt(i) - 64);
    }
    return idx;
  }

  private indexToCol(idx: number): string {
    let col = '';
    idx++;
    while (idx > 0) {
      idx--;
      col = String.fromCharCode(65 + (idx % 26)) + col;
      idx = Math.floor(idx / 26);
    }
    return col;
  }

  private hasCircularDependency(sheet: SheetData, ref: string, deps: Set<string>, visited = new Set<string>()): boolean {
    if (visited.has(ref)) return true;
    visited.add(ref);
    
    for (const dep of deps) {
      const depCell = sheet.cells[dep];
      if (depCell?.dependencies) {
        if (this.hasCircularDependency(sheet, dep, new Set(depCell.dependencies), visited)) {
          return true;
        }
      }
    }
    return false;
  }

  private extractDependencies(formula: string): string[] {
    const refs = new Set<string>();
    const regex = /(?:^|[^A-Za-z0-9_])([A-Z]+[1-9][0-9]*)(?=[^A-Za-z0-9_]|$)/g;
    let match;
    while ((match = regex.exec(formula)) !== null) {
      refs.add(match[1]);
    }
    return Array.from(refs);
  }

  private recalculateDependents(workbook: Workbook, sheet: SheetData, ref: string, visited = new Set<string>()): void {
    const sheetRefs = Object.keys(sheet.cells);
    for (const dependentRef of sheetRefs) {
      const cell = sheet.cells[dependentRef];
      if (cell.dependencies && cell.dependencies.includes(ref) && dependentRef !== ref) {
        const formula = cell.raw as string;
        const result = this.evaluateFormula(formula, workbook, sheet);
        if (result.error) {
          cell.error = result.error;
          cell.value = result.error;
        } else {
          cell.error = undefined;
          cell.value = result.value;
        }
        this.recalculateDependents(workbook, sheet, dependentRef, visited);
      }
    }
  }
}
