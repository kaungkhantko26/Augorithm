import type { Diagnostic } from "./augorithm-core";

export type AlgorithmType = "INTEGER" | "REAL" | "STRING" | "BOOLEAN" | "CHAR" | "LIST" | "UNKNOWN";
export interface SourceMapping { irStatementId: string; pseudocodeLine?: number; pythonLine?: number; }
export interface VariableDeclaration { name: string; type: AlgorithmType; size?: string; }
export type AlgorithmStatement =
  | { id: string; kind: "input"; target: string; prompt?: string }
  | { id: string; kind: "output"; value: string }
  | { id: string; kind: "assignment"; target: string; value: string }
  | { id: string; kind: "if"; condition: string; then: AlgorithmStatement[]; otherwise: AlgorithmStatement[] }
  | { id: string; kind: "for"; variable: string; start: string; end: string; step: string; body: AlgorithmStatement[] }
  | { id: string; kind: "while"; condition: string; body: AlgorithmStatement[] }
  | { id: string; kind: "break" | "continue" | "return"; value?: string }
  | { id: string; kind: "comment"; text: string }
  | { id: string; kind: "custom"; language: string; code: string };

export interface AlgorithmIR {
  id: string;
  name: string;
  declarations: VariableDeclaration[];
  statements: AlgorithmStatement[];
  mappings: SourceMapping[];
  diagnostics: Diagnostic[];
}

let idCounter = 0;
const nextId = () => `ir-${++idCounter}`;
const cleanExpression = (value: string) => value.trim().replace(/\bAND\b/gi, "and").replace(/\bOR\b/gi, "or").replace(/<>/g, "!=");
const inferLiteral = (value: string): AlgorithmType => /^[-+]?\d+$/.test(value) ? "INTEGER" : /^[-+]?\d*\.\d+$/.test(value) ? "REAL" : /^(?:true|false)$/i.test(value) ? "BOOLEAN" : /^(['"]).*\1$/.test(value) ? "STRING" : /^\[.*\]$/.test(value) ? "LIST" : "UNKNOWN";

export function parsePseudocodeToIR(code: string, name = "Main"): AlgorithmIR {
  idCounter = 0;
  const root: AlgorithmStatement[] = [];
  const declarations: VariableDeclaration[] = [];
  const diagnostics: Diagnostic[] = [];
  const mappings: SourceMapping[] = [];
  const stack: Array<{ body: AlgorithmStatement[]; statement?: AlgorithmStatement }> = [{ body: root }];
  const body = () => stack.at(-1)!.body;
  const add = (statement: AlgorithmStatement, line: number) => { body().push(statement); mappings.push({ irStatementId: statement.id, pseudocodeLine: line }); };

  code.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const text = raw.trim();
    if (!text || /^(?:start|end)$/i.test(text)) return;
    const declaration = text.match(/^declare\s+([A-Za-z_]\w*)(?:\[([^\]]+)\])?\s+as\s+(integer|real|string|boolean|char|array|list|unknown)/i);
    if (declaration) { const declaredType = declaration[3].toUpperCase(); declarations.push({ name: declaration[1], size: declaration[2], type: (declaredType === "ARRAY" || declaredType === "LIST" ? "UNKNOWN" : declaredType) as AlgorithmType }); return; }
    if (/^(?:end if|endif)$/i.test(text)) { if (stack.length > 1) stack.pop(); else diagnostics.push({ line, severity: "error", message: "END IF has no matching IF." }); return; }
    if (/^(?:end for|endfor|next\b)/i.test(text)) { if (stack.length > 1) stack.pop(); else diagnostics.push({ line, severity: "error", message: "Loop ending has no matching FOR." }); return; }
    if (/^(?:end while|endwhile)$/i.test(text)) { if (stack.length > 1) stack.pop(); else diagnostics.push({ line, severity: "error", message: "END WHILE has no matching WHILE." }); return; }
    if (/^else$/i.test(text)) {
      const frame = stack.at(-1);
      if (frame?.statement?.kind === "if") frame.body = frame.statement.otherwise;
      else diagnostics.push({ line, severity: "error", message: "ELSE has no matching IF." });
      return;
    }
    const ifMatch = text.match(/^if\s+(.+?)\s+then$/i);
    if (ifMatch) { const statement: AlgorithmStatement = { id: nextId(), kind: "if", condition: cleanExpression(ifMatch[1]), then: [], otherwise: [] }; add(statement, line); stack.push({ body: statement.then, statement }); return; }
    const forMatch = text.match(/^for\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+(to|downto)\s+(.+?)(?:\s+step\s+(.+))?$/i);
    if (forMatch) { const statement: AlgorithmStatement = { id: nextId(), kind: "for", variable: forMatch[1], start: forMatch[2], end: forMatch[4], step: forMatch[5] ?? (forMatch[3].toLowerCase() === "downto" ? "-1" : "1"), body: [] }; add(statement, line); stack.push({ body: statement.body, statement }); return; }
    const whileMatch = text.match(/^while\s+(.+?)(?:\s+do)?$/i);
    if (whileMatch) { const statement: AlgorithmStatement = { id: nextId(), kind: "while", condition: cleanExpression(whileMatch[1]), body: [] }; add(statement, line); stack.push({ body: statement.body, statement }); return; }
    const input = text.match(/^(?:input|read)\s+(.+)$/i);
    if (input) { add({ id: nextId(), kind: "input", target: input[1].trim() }, line); return; }
    const output = text.match(/^(?:output|display|print)\s*(.*)$/i);
    if (output) { add({ id: nextId(), kind: "output", value: output[1] }, line); return; }
    const assignment = text.replace(/^(?:set|let)\s+/i, "").match(/^([A-Za-z_]\w*(?:\[[^\]]+\])?)\s*(?:=|<-|←|:=)\s*(.+)$/);
    if (assignment) { add({ id: nextId(), kind: "assignment", target: assignment[1], value: assignment[2] }, line); if (!declarations.some((item) => item.name === assignment[1])) declarations.push({ name: assignment[1], type: inferLiteral(assignment[2]) }); return; }
    const simple = text.match(/^(break|continue|return)(?:\s+(.+))?$/i);
    if (simple) { add({ id: nextId(), kind: simple[1].toLowerCase() as "break" | "continue" | "return", value: simple[2] }, line); return; }
    if (/^(?:#|\/\/)/.test(text)) { add({ id: nextId(), kind: "comment", text: text.replace(/^(?:#|\/\/)\s*/, "") }, line); return; }
    diagnostics.push({ line, severity: "warning", message: `Unsupported pseudocode statement: ${text}` });
    add({ id: nextId(), kind: "custom", language: "pseudocode", code: text }, line);
  });
  if (stack.length > 1) diagnostics.push({ line: code.split(/\r?\n/).length, severity: "error", message: "One or more control structures are not closed." });
  declarations.forEach((item) => { if (item.type === "UNKNOWN") diagnostics.push({ line: 1, severity: "warning", message: `Variable "${item.name}" has an unknown type; verify it before generating Java.` }); });
  return { id: `algorithm-${Date.now()}`, name, declarations, statements: root, mappings, diagnostics };
}

export function parsePythonToIR(code: string, name = "Main"): AlgorithmIR {
  idCounter = 0;
  if (/\b(?:async\s+def|await|yield|lambda)\b|^\s*@/m.test(code)) return { id: `algorithm-${Date.now()}`, name, declarations: [], statements: [], mappings: [], diagnostics: [{ line: code.split(/\r?\n/).findIndex((line) => /\b(?:async\s+def|await|yield|lambda)\b|^\s*@/.test(line)) + 1, severity: "error", message: "This Python feature cannot be converted into beginner pseudocode without changing its behavior." }] };
  const pseudo: string[] = ["START"];
  const indents = [0];
  const closers: string[] = [];
  const diagnostics: Diagnostic[] = [];
  const declarations = new Map<string, AlgorithmType>();
  const closeTo = (indent: number) => { while (indents.at(-1)! > indent) { indents.pop(); pseudo.push(closers.pop()!); } };
  code.split(/\r?\n/).forEach((raw, index) => {
    if (!raw.trim() || raw.trim().startsWith("#")) return;
    const indent = raw.match(/^\s*/)?.[0].replace(/\t/g, "    ").length ?? 0;
    const text = raw.trim();
    if (/^(?:elif\b.*|else):$/.test(text) && indents.at(-1)! > indent && closers.at(-1) === "END IF") { indents.pop(); closers.pop(); }
    else closeTo(indent);
    const input = text.match(/^([A-Za-z_]\w*)\s*=\s*(?:(int|float|str|bool)\()?input\((.*?)\)\)?$/);
    if (input) { const type = input[2] === "int" ? "INTEGER" : input[2] === "float" ? "REAL" : input[2] === "bool" ? "BOOLEAN" : "STRING"; declarations.set(input[1], type); if (input[3]) pseudo.push(`DISPLAY ${input[3]}`); pseudo.push(`INPUT ${input[1]}`); return; }
    const print = text.match(/^print\((.*)\)$/); if (print) { pseudo.push(`DISPLAY ${print[1]}`); return; }
    const conditional = text.match(/^(if|elif)\s+(.+):$/); if (conditional) { pseudo.push(`${conditional[1] === "elif" ? "ELSE IF" : "IF"} ${conditional[2]} THEN`); indents.push(indent + 1); closers.push("END IF"); return; }
    if (/^else:$/.test(text)) { pseudo.push("ELSE"); indents.push(indent + 1); closers.push("END IF"); return; }
    const range = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\((.+)\):$/);
    if (range) { const args = range[2].split(",").map((item) => item.trim()); const start = args.length === 1 ? "0" : args[0]; const stop = args.length === 1 ? args[0] : args[1]; const step = args[2] ?? "1"; const numericStop = /^-?\d+$/.test(stop) ? String(Number(stop) - (Number(step) < 0 ? -1 : 1)) : `(${stop}) - 1`; pseudo.push(`FOR ${range[1]} = ${start} ${Number(step) < 0 ? "DOWNTO" : "TO"} ${numericStop}${Math.abs(Number(step)) !== 1 ? ` STEP ${step}` : ""}`); declarations.set(range[1], "INTEGER"); indents.push(indent + 1); closers.push("END FOR"); return; }
    const whileMatch = text.match(/^while\s+(.+):$/); if (whileMatch) { pseudo.push(`WHILE ${whileMatch[1]}`); indents.push(indent + 1); closers.push("END WHILE"); return; }
    const assign = text.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/); if (assign) { declarations.set(assign[1], inferLiteral(assign[2])); pseudo.push(`${assign[1]} = ${assign[2]}`); return; }
    if (/^(break|continue|return\b.*)$/.test(text)) { pseudo.push(text.toUpperCase()); return; }
    diagnostics.push({ line: index + 1, severity: "warning", message: `Python statement is preserved as custom code: ${text}` });
    pseudo.push(`// Custom Python: ${text}`);
  });
  closeTo(-1); pseudo.push("END");
  const ir = parsePseudocodeToIR([...pseudo.slice(0, 1), ...[...declarations].map(([variable, type]) => `DECLARE ${variable} AS ${type}`), ...pseudo.slice(1)].join("\n"), name);
  ir.diagnostics.push(...diagnostics); return ir;
}

function walk(statements: AlgorithmStatement[], emit: (statement: AlgorithmStatement, depth: number) => void, depth = 0) { statements.forEach((statement) => { emit(statement, depth); if (statement.kind === "if") { walk(statement.then, emit, depth + 1); walk(statement.otherwise, emit, depth + 1); } else if (statement.kind === "for" || statement.kind === "while") walk(statement.body, emit, depth + 1); }); }
const pseudoExpr = (value: string) => value.replace(/\band\b/gi, "AND").replace(/\bor\b/gi, "OR").replace(/==/g, "=");
const codeExpr = (value: string, java = false) => value.replace(/\bAND\b/gi, java ? "&&" : "and").replace(/\bOR\b/gi, java ? "||" : "or").replace(/(?<![<>=!])=(?!=)/g, "==");

export function generatePseudocode(ir: AlgorithmIR): string {
  const out = ["START", "", ...ir.declarations.map((item) => `DECLARE ${item.name}${item.size ? `[${item.size}]` : ""} AS ${item.type}`), ""];
  const emitBlock = (items: AlgorithmStatement[], depth: number) => items.forEach((s) => { const p = "    ".repeat(depth); if (s.kind === "input") out.push(`${p}INPUT ${s.target}`); else if (s.kind === "output") out.push(`${p}DISPLAY ${s.value}`); else if (s.kind === "assignment") out.push(`${p}${s.target} = ${s.value}`); else if (s.kind === "comment") out.push(`${p}// ${s.text}`); else if (s.kind === "custom") out.push(`${p}// Custom ${s.language}: ${s.code}`); else if (s.kind === "break" || s.kind === "continue" || s.kind === "return") out.push(`${p}${s.kind.toUpperCase()}${s.value ? ` ${s.value}` : ""}`); else if (s.kind === "if") { out.push(`${p}IF ${pseudoExpr(s.condition)} THEN`); emitBlock(s.then, depth + 1); if (s.otherwise.length) { out.push(`${p}ELSE`); emitBlock(s.otherwise, depth + 1); } out.push(`${p}END IF`); } else if (s.kind === "for") { out.push(`${p}FOR ${s.variable} = ${s.start} ${Number(s.step) < 0 ? "DOWNTO" : "TO"} ${s.end}${Math.abs(Number(s.step)) !== 1 ? ` STEP ${s.step}` : ""}`); emitBlock(s.body, depth + 1); out.push(`${p}END FOR`); } else if (s.kind === "while") { out.push(`${p}WHILE ${pseudoExpr(s.condition)}`); emitBlock(s.body, depth + 1); out.push(`${p}END WHILE`); } });
  emitBlock(ir.statements, 0); out.push("", "END"); return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function generatePython(ir: AlgorithmIR): string {
  const out = ["# Generated by Augorithm from the shared algorithm model"];
  const types = new Map(ir.declarations.map((item) => [item.name, item.type]));
  ir.declarations.filter((item) => item.size).forEach((item) => out.push(`${item.name} = [0] * (${item.size})`));
  const emit = (items: AlgorithmStatement[], depth: number) => items.forEach((s) => { const p = "    ".repeat(depth); if (s.kind === "input") { const t = types.get(s.target.replace(/\[.*$/, "")); const cast = t === "INTEGER" ? "int" : t === "REAL" ? "float" : t === "BOOLEAN" ? "bool" : "str"; out.push(`${p}${s.target} = ${cast}(input())`); } else if (s.kind === "output") out.push(`${p}print(${s.value})`); else if (s.kind === "assignment") out.push(`${p}${s.target} = ${s.value}`); else if (s.kind === "comment") out.push(`${p}# ${s.text}`); else if (s.kind === "custom") out.push(`${p}# Unsupported ${s.language}: ${s.code}`); else if (s.kind === "break" || s.kind === "continue") out.push(`${p}${s.kind}`); else if (s.kind === "return") out.push(`${p}return${s.value ? ` ${s.value}` : ""}`); else if (s.kind === "if") { out.push(`${p}if ${codeExpr(s.condition)}:`); emit(s.then, depth + 1); if (!s.then.length) out.push(`${p}    pass`); if (s.otherwise.length) { out.push(`${p}else:`); emit(s.otherwise, depth + 1); } } else if (s.kind === "for") { const end = Number(s.step) < 0 ? `(${s.end}) - 1` : `(${s.end}) + 1`; out.push(`${p}for ${s.variable} in range(${s.start}, ${end}, ${s.step}):`); emit(s.body, depth + 1); } else if (s.kind === "while") { out.push(`${p}while ${codeExpr(s.condition)}:`); emit(s.body, depth + 1); } });
  emit(ir.statements, 0); return out.join("\n");
}

export function javaClassName(name: string): string { const words = name.replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean); let result = words.map((word) => word[0].toUpperCase() + word.slice(1)).join("") || "Main"; if (/^\d/.test(result)) result = `Program${result}`; if (["Class", "Public", "Static", "Void", "Int", "Double", "String"].includes(result)) result += "Program"; return result; }
const javaType = (type: AlgorithmType, array = false) => `${type === "INTEGER" ? "int" : type === "REAL" ? "double" : type === "BOOLEAN" ? "boolean" : type === "CHAR" ? "char" : "String"}${array ? "[]" : ""}`;
export function generateJava(ir: AlgorithmIR, educational = true): { filename: string; code: string; diagnostics: Diagnostic[] } {
  const className = javaClassName(ir.name); const usesInput = (() => { let found = false; walk(ir.statements, (s) => { if (s.kind === "input") found = true; }); return found; })();
  const out: string[] = []; if (usesInput) out.push("import java.util.Scanner;", ""); out.push(`public class ${className} {`, "", "    public static void main(String[] args) {"); if (usesInput) out.push(educational ? "        // Read values from the keyboard" : "", "        Scanner scanner = new Scanner(System.in);", "");
  const types = new Map(ir.declarations.map((item) => [item.name, item])); ir.declarations.forEach((item) => out.push(`        ${javaType(item.type, Boolean(item.size))} ${item.name}${item.size ? ` = new ${javaType(item.type)}[${item.size}]` : item.type === "STRING" ? " = \"\"" : item.type === "BOOLEAN" ? " = false" : " = 0"};`)); if (ir.declarations.length) out.push("");
  const emit = (items: AlgorithmStatement[], depth: number) => items.forEach((s) => { const p = "    ".repeat(depth); if (s.kind === "input") { const target = s.target.replace(/\[.*$/, ""); const type = types.get(target)?.type ?? "UNKNOWN"; const method = type === "INTEGER" ? "nextInt()" : type === "REAL" ? "nextDouble()" : type === "BOOLEAN" ? "nextBoolean()" : type === "CHAR" ? "nextLine().charAt(0)" : "nextLine()"; out.push(`${p}${s.target} = scanner.${method};`); } else if (s.kind === "output") out.push(`${p}System.out.println(${s.value.split(",").map((x) => x.trim()).join(' + " " + ')});`); else if (s.kind === "assignment") out.push(`${p}${s.target} = ${s.value};`); else if (s.kind === "comment") out.push(`${p}// ${s.text}`); else if (s.kind === "custom") out.push(`${p}// Unsupported ${s.language}: ${s.code}`); else if (s.kind === "break" || s.kind === "continue") out.push(`${p}${s.kind};`); else if (s.kind === "return") out.push(`${p}return${s.value ? ` ${s.value}` : ""};`); else if (s.kind === "if") { out.push(`${p}if (${codeExpr(s.condition, true)}) {`); emit(s.then, depth + 1); if (s.otherwise.length) { out.push(`${p}} else {`); emit(s.otherwise, depth + 1); } out.push(`${p}}`); } else if (s.kind === "for") { const op = Number(s.step) < 0 ? ">=" : "<="; out.push(`${p}for (${s.variable} = ${s.start}; ${s.variable} ${op} ${s.end}; ${s.variable} += ${s.step}) {`); emit(s.body, depth + 1); out.push(`${p}}`); } else if (s.kind === "while") { out.push(`${p}while (${codeExpr(s.condition, true)}) {`); emit(s.body, depth + 1); out.push(`${p}}`); } });
  emit(ir.statements, 2); if (usesInput) out.push("", "        scanner.close();"); out.push("    }", "}"); const diagnostics = [...ir.diagnostics]; if (ir.declarations.some((item) => item.type === "UNKNOWN")) diagnostics.push({ line: 1, severity: "error", message: "Java generation requires all variable types to be known." }); return { filename: `${className}.java`, code: out.filter((line, index, all) => line !== "" || all[index - 1] !== "").join("\n"), diagnostics };
}

export function generateNotes(ir: AlgorithmIR): string {
  let loops = 0; let branches = 0; let inputs = 0; let outputs = 0; walk(ir.statements, (s) => { if (s.kind === "for" || s.kind === "while") loops += 1; if (s.kind === "if") branches += 1; if (s.kind === "input") inputs += 1; if (s.kind === "output") outputs += 1; });
  const complexity = loops === 0 ? "O(1)" : loops === 1 ? "O(n)" : `O(n^${loops}) (estimate)`;
  return `# ${ir.name}\n\n## Overview\n\nThis algorithm uses ${ir.declarations.length} variable${ir.declarations.length === 1 ? "" : "s"}, reads ${inputs} input${inputs === 1 ? "" : "s"}, and produces ${outputs} output${outputs === 1 ? "" : "s"}.\n\n## Flow explanation\n\nThe program starts, processes ${branches} selection${branches === 1 ? "" : "s"} and ${loops} loop${loops === 1 ? "" : "s"}, then finishes.\n\n## Complexity\n\nTime complexity: ${complexity}.\n\nSpace complexity: ${ir.declarations.some((item) => item.size) ? "O(n) because the algorithm stores an array or list." : "O(1) because it stores a fixed number of scalar values."}\n\n## Java notes\n\nThe generated Java file contains a public class whose name matches the filename, a main method, typed variables, and Scanner setup only when keyboard input is required.`;
}
