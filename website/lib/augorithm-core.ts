export type EditorMode = "algorithm" | "erd" | "uml";
export type NodeKind =
  | "start"
  | "end"
  | "input"
  | "output"
  | "process"
  | "decision"
  | "loop"
  | "comment"
  | "entity"
  | "class"
  | "usecase"
  | "note";

export interface Point {
  x: number;
  y: number;
}

export interface NodeStyle {
  fill: string;
  stroke: string;
  text: string;
  fontSize: number;
}

export interface DiagramNode {
  id: string;
  kind: NodeKind;
  label: string;
  position: Point;
  width: number;
  height: number;
  sourceLine?: number;
  sourceKey?: string;
  locked?: boolean;
  breakpoint?: boolean;
  layer?: string;
  style: NodeStyle;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  annotationOnly?: boolean;
  sourcePort?: "top" | "right" | "bottom" | "left";
  targetPort?: "top" | "right" | "bottom" | "left";
  waypoints?: Point[];
  strokeWidth?: number;
  arrow?: "end" | "none";
}

export interface DiagramPage {
  id: string;
  name: string;
  mode: EditorMode;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  background: string;
}

export interface ProjectV2 {
  schemaVersion: 2;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  activePageId: string;
  pages: DiagramPage[];
  database: {
    name: string;
    attributes: string;
    primaryKey: string;
    dependencies: string;
  };
  python: {
    code: string;
    input: string;
  };
  preferences: {
    theme: "light" | "dark" | "system";
    snapToGrid: boolean;
    gridSize: number;
    language: "en" | "my";
  };
}

export interface Diagnostic {
  line: number;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface ParseResult {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  diagnostics: Diagnostic[];
}

export interface ExecutionResult {
  output: string[];
  variables: Record<string, unknown>;
  trace: number[];
  diagnostics: Diagnostic[];
  session?: ExecutionSession; // defined when paused waiting for INPUT
}

/** Serialisable snapshot of a paused execution. */
export interface ExecutionSession {
  pointer: number;
  variables: Record<string, unknown>;
  forStack: Array<{ line: number; name: string; end: number; step: number }>;
  whileStack: Array<{ line: number; condition: string }>;
  output: string[];
  trace: number[];
  waitingFor: string; // e.g. "mark" or "mark[0]"
}

export const DEFAULT_PSEUDOCODE = `START
INPUT score
IF score >= 50 THEN
    OUTPUT "Pass"
ELSE
    OUTPUT "Try again"
END IF
END`;

export function formatPseudocode(code: string): string {
  let depth = 0;
  return code
    .split(/\r?\n/)
    .map((raw) => raw.trim())
    .map((statement) => {
      if (!statement) return "";
      const closesBlock = /^(?:else(?:\s+if)?|elseif|end(?:\s+(?:if|while|for|function|procedure|switch|do))?$|endif|endwhile|next\b|endfor|case\b|default\b)/i.test(statement);
      if (closesBlock) depth = Math.max(0, depth - 1);
      const formatted = `${"    ".repeat(depth)}${statement}`;
      const opensBlock = /^(?:if\b.*\bthen|else(?:\s+if\b.*\bthen)?|elseif\b.*\bthen|while\b|for\b|do\b|switch\b|case\b|default\b|function\b|procedure\b)/i.test(statement);
      const terminalCloser = /^(?:end(?:\s+(?:if|while|for|function|procedure|switch|do))?|endif|endwhile|next\b|endfor)$/i.test(statement);
      if (opensBlock && !terminalCloser) depth += 1;
      return formatted;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

const COLORS: Record<NodeKind, NodeStyle> = {
  start: { fill: "#f1eef7", stroke: "#65558f", text: "#172033", fontSize: 14 },
  end: { fill: "#f1eef7", stroke: "#65558f", text: "#172033", fontSize: 14 },
  input: { fill: "#eaf6fb", stroke: "#247da8", text: "#172033", fontSize: 14 },
  output: { fill: "#edf8f0", stroke: "#2d8a57", text: "#172033", fontSize: 14 },
  process: { fill: "#fff8e8", stroke: "#a66a00", text: "#172033", fontSize: 14 },
  decision: { fill: "#fff0e7", stroke: "#d45113", text: "#172033", fontSize: 14 },
  loop: { fill: "#f8efff", stroke: "#7e3db3", text: "#172033", fontSize: 14 },
  comment: { fill: "#f3f5f8", stroke: "#667085", text: "#172033", fontSize: 14 },
  entity: { fill: "#eef5ff", stroke: "#1769d2", text: "#172033", fontSize: 14 },
  class: { fill: "#f2efff", stroke: "#6a4bc4", text: "#172033", fontSize: 14 },
  usecase: { fill: "#eef9f6", stroke: "#087f6a", text: "#172033", fontSize: 14 },
  note: { fill: "#fff9d9", stroke: "#9b7500", text: "#172033", fontSize: 14 },
};

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, " ").toLowerCase();
}

function classify(statement: string): NodeKind | null {
  if (/^(start|program main|begin)$/i.test(statement)) return "start";
  if (/^(end|stop)$/i.test(statement)) return "end";
  if (/^(input|read)\b/i.test(statement)) return "input";
  if (/^(output|display|print)\b/i.test(statement)) return "output";
  if (/^(if|else if|elseif|switch|case)\b/i.test(statement)) return "decision";
  if (/^(while|do\b|for\b|next\b|end while|endwhile|end for|endfor)\b/i.test(statement)) return "loop";
  if (/^(\/\/|#|comment\b)/i.test(statement)) return "comment";
  if (/^(else|end if|endif)$/i.test(statement)) return "decision";
  if (/^(declare|constant|set|let|add|subtract|function|procedure|return|break|call)\b/i.test(statement)
    || /^[A-Za-z_]\w*(?:\[[^\]]+\])?\s*(?:=|<-|←|:=)/.test(statement)) {
    return "process";
  }
  return null;
}

function defaultSize(kind: NodeKind): { width: number; height: number } {
  if (kind === "decision") return { width: 260, height: 116 };
  if (kind === "start" || kind === "end" || kind === "usecase") return { width: 220, height: 72 };
  if (kind === "entity" || kind === "class") return { width: 250, height: 150 };
  if (kind === "note") return { width: 220, height: 120 };
  return { width: 260, height: 82 };
}

export function parsePseudocode(code: string, previousNodes: DiagramNode[] = []): ParseResult {
  const previousByKey = new Map(previousNodes.map((node) => [node.sourceKey, node]));
  const occurrences = new Map<string, number>();
  const nodes: DiagramNode[] = [];
  const diagnostics: Diagnostic[] = [];
  const tokens: Array<{ statement: string; line: number; nodeId?: string }> = [];
  const structuralOnly = /^(?:else|end if|endif|end while|endwhile|next(?:\s+\w+)?|end for|endfor)$/i;
  const layoutStack: Array<{ type: "if" | "loop"; side: number }> = [];

  code.split(/\r?\n/).forEach((raw, index) => {
    const statement = raw.trim();
    if (!statement) return;
    const normalized = normalizeLine(statement);
    const kind = classify(statement);
    if (!kind) {
      diagnostics.push({
        line: index + 1,
        severity: "warning",
        message: `Unknown statement: ${statement}`,
      });
      return;
    }

    if (structuralOnly.test(statement)) {
      if (/^else$/i.test(statement)) {
        const branch = layoutStack.at(-1);
        if (branch?.type === "if") branch.side = 1;
      } else if (/^(?:end if|endif|end while|endwhile|next\b|end for|endfor)/i.test(statement)) {
        layoutStack.pop();
      }
      tokens.push({ statement, line: index + 1 });
      return;
    }
    const occurrence = occurrences.get(normalized) ?? 0;
    occurrences.set(normalized, occurrence + 1);
    const sourceKey = `${normalized}::${occurrence}`;
    const prior = previousByKey.get(sourceKey);
    const size = defaultSize(kind);
    if (/^(?:else if|elseif)\b/i.test(statement)) {
      const branch = layoutStack.at(-1);
      if (branch?.type === "if") branch.side = 1;
    }
    const horizontalOffset = layoutStack.reduce((total, entry) => total + entry.side, 0);
    const generatedPosition = {
      x: 480 + horizontalOffset * 300,
      y: 60 + nodes.length * 110,
    };

    const node: DiagramNode = {
      id: prior?.id ?? `node-${hash(sourceKey)}`,
      kind,
      label: statement,
      position: prior?.position ?? generatedPosition,
      width: prior?.width ?? size.width,
      height: prior?.height ?? size.height,
      sourceLine: index + 1,
      sourceKey,
      locked: prior?.locked ?? false,
      breakpoint: prior?.breakpoint ?? false,
      layer: prior?.layer ?? "Logic",
      style: prior?.style ?? { ...COLORS[kind] },
    };
    nodes.push(node);
    tokens.push({ statement, line: index + 1, nodeId: node.id });
    if (/^if\b/i.test(statement)) layoutStack.push({ type: "if", side: -1 });
    else if (/^(?:while|for)\b/i.test(statement)) layoutStack.push({ type: "loop", side: 1 });
  });

  if (!nodes.some((node) => node.kind === "start")) {
    diagnostics.push({ line: 1, severity: "warning", message: "Add START at the beginning." });
  }
  if (!nodes.some((node) => node.kind === "end")) {
    diagnostics.push({
      line: Math.max(1, code.split(/\r?\n/).length),
      severity: "warning",
      message: "Add END at the end.",
    });
  }

  const edges: DiagramEdge[] = [];
  const edgeKeys = new Set<string>();
  const addEdge = (source: string | undefined, target: string | undefined, label?: string) => {
    if (!source || !target) return;
    const key = `${source}:${target}:${label ?? ""}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ id: `edge-${hash(key)}`, source, target, label });
  };
  const nextNodeId = (start: number, end: number, fallback?: string): string | undefined => {
    for (let index = start; index < end; index += 1) {
      if (tokens[index]?.nodeId) return tokens[index].nodeId;
    }
    return fallback;
  };
  const findIfBounds = (start: number, end: number) => {
    let depth = 0;
    let alternate = -1;
    for (let index = start + 1; index < end; index += 1) {
      const value = tokens[index].statement;
      if (depth === 0 && /^else(?:\s+if)?\b/i.test(value) && alternate < 0) {
        alternate = index;
      } else if (/^(?:if|else if|elseif)\b/i.test(value)) depth += 1;
      else if (/^(?:end if|endif)$/i.test(value)) {
        if (depth === 0) return { alternate, close: index };
        depth -= 1;
      }
    }
    return { alternate, close: end };
  };
  const findLoopClose = (start: number, end: number, isFor: boolean) => {
    let depth = 0;
    for (let index = start + 1; index < end; index += 1) {
      const value = tokens[index].statement;
      if (isFor ? /^for\b/i.test(value) : /^while\b/i.test(value)) depth += 1;
      const closes = isFor
        ? /^(?:next\b|end for|endfor)/i.test(value)
        : /^(?:end while|endwhile)$/i.test(value);
      if (closes) {
        if (depth === 0) return index;
        depth -= 1;
      }
    }
    return end;
  };
  const connectRange = (start: number, end: number, fallback?: string) => {
    let index = start;
    while (index < end) {
      const token = tokens[index];
      if (!token.nodeId) {
        index += 1;
        continue;
      }
      const isIf = /^(?:if|else if|elseif)\b/i.test(token.statement);
      const isFor = /^for\b/i.test(token.statement);
      const isWhile = /^while\b/i.test(token.statement);
      if (isIf) {
        const bounds = findIfBounds(index, end);
        const after = nextNodeId(bounds.close + 1, end, fallback);
        const trueEnd = bounds.alternate >= 0 ? bounds.alternate : bounds.close;
        const trueEntry = nextNodeId(index + 1, trueEnd, after);
        const falseEntry = bounds.alternate >= 0
          ? nextNodeId(bounds.alternate, bounds.close, after)
          : after;
        addEdge(token.nodeId, trueEntry, "True");
        addEdge(token.nodeId, falseEntry, "False");
        connectRange(index + 1, trueEnd, after);
        if (bounds.alternate >= 0) connectRange(bounds.alternate, bounds.close, after);
        index = bounds.close + 1;
        continue;
      }
      if (isFor || isWhile) {
        const close = findLoopClose(index, end, isFor);
        const after = nextNodeId(close + 1, end, fallback);
        const bodyEntry = nextNodeId(index + 1, close, token.nodeId);
        addEdge(token.nodeId, bodyEntry, isFor ? "Next" : "True");
        addEdge(token.nodeId, after, isFor ? "Done" : "False");
        connectRange(index + 1, close, token.nodeId);
        index = close + 1;
        continue;
      }
      addEdge(token.nodeId, nextNodeId(index + 1, end, fallback));
      index += 1;
    }
  };
  connectRange(0, tokens.length);

  return { nodes, edges, diagnostics };
}

export function createProject(name = "Untitled Algorithm", code = DEFAULT_PSEUDOCODE): ProjectV2 {
  const now = new Date().toISOString();
  const parsed = parsePseudocode(code);
  return {
    schemaVersion: 2,
    name,
    code,
    createdAt: now,
    updatedAt: now,
    activePageId: "page-main",
    pages: [
      {
        id: "page-main",
        name: "Main",
        mode: "algorithm",
        nodes: parsed.nodes,
        edges: parsed.edges,
        background: "#f7f9fc",
      },
    ],
    database: { name: "", attributes: "", primaryKey: "", dependencies: "" },
    python: { code: "", input: "" },
    preferences: { theme: "system", snapToGrid: true, gridSize: 20, language: "en" },
  };
}

export function migrateProject(input: unknown): ProjectV2 {
  if (!input || typeof input !== "object") return createProject();
  const candidate = input as Partial<ProjectV2> & {
    version?: number;
    database?: Partial<ProjectV2["database"]>;
    python?: Partial<ProjectV2["python"]>;
  };
  const code = typeof candidate.code === "string" ? candidate.code : DEFAULT_PSEUDOCODE;
  const base = createProject(typeof candidate.name === "string" ? candidate.name : "Untitled Algorithm", code);
  if (candidate.schemaVersion === 2 && Array.isArray(candidate.pages) && candidate.pages.length) {
    const pages = (candidate.pages as DiagramPage[]).map((page) => {
      if (page.mode !== "algorithm") return page;
      const parsed = parsePseudocode(code, page.nodes);
      return {
        ...page,
        nodes: parsed.nodes,
        edges: parsed.edges,
      };
    });
    const activePageId = pages.some((page) => page.id === candidate.activePageId)
      ? candidate.activePageId as string
      : pages[0].id;
    return {
      ...base,
      ...candidate,
      schemaVersion: 2,
      activePageId,
      pages,
      preferences: { ...base.preferences, ...candidate.preferences },
      database: { ...base.database, ...candidate.database },
      python: { ...base.python, ...candidate.python },
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    ...base,
    database: { ...base.database, ...candidate.database },
    python: { ...base.python, ...candidate.python },
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : base.createdAt,
  };
}

function coerceValue(raw: string): unknown {
  const value = raw.trim();
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
  if (value !== "" && Number.isFinite(Number(value))) return Number(value);
  return value.replace(/^["']|["']$/g, "");
}

function evaluate(expression: string, variables: Record<string, unknown>): unknown {
  const prepared = expression
    .replace(/\bAND\b/gi, "&&")
    .replace(/\bOR\b/gi, "||")
    .replace(/\bNOT\b/gi, "!")
    .replace(/<>/g, "!=")
    .replace(/(?<![<>=!])=(?!=)/g, "==")
    .replace(/\bTRUE\b/gi, "true")
    .replace(/\bFALSE\b/gi, "false")
    .replace(/\b(?:sqrt|abs|round|floor|ceil|ceiling|min|max|pow)\s*\(/gi, (match) => {
      const name = match.slice(0, match.indexOf("(")).toLowerCase();
      return `Math.${name === "ceiling" ? "ceil" : name}(`;
    });
  const names = Object.keys(variables).filter((name) => /^[A-Za-z_]\w*$/.test(name));
  const values = names.map((name) => variables[name]);
  try {
    return Function(...names, `"use strict"; return (${prepared});`)(...values);
  } catch {
    return coerceValue(expression);
  }
}

function matchingCloser(lines: string[], start: number, open: RegExp, close: RegExp, alternate?: RegExp): number {
  let depth = 0;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (open.test(line)) depth += 1;
    if (close.test(line)) {
      if (depth === 0) return index;
      depth -= 1;
    }
    if (depth === 0 && alternate?.test(line)) return index;
  }
  return lines.length;
}

/**
 * Resume a paused execution by supplying one input value.
 * Returns the same ExecutionResult type; may pause again for the next INPUT.
 */
export function resumeExecution(
  code: string,
  session: ExecutionSession,
  inputValue: string,
): ExecutionResult {
  return executePseudocode(code, inputValue, session);
}

export function executePseudocode(
  code: string,
  rawInput = "",
  resumeFrom?: ExecutionSession,
): ExecutionResult {
  const lines = code.split(/\r?\n/);

  // When resuming, the single rawInput value is the answer to the pending INPUT.
  // When starting fresh, rawInput may be a comma-separated pre-supply (legacy path).
  const inputQueue: string[] = resumeFrom
    ? [rawInput.trim()].filter(Boolean)
    : rawInput.split(/[,\n]/).map((value) => value.trim()).filter(Boolean);

  const variables: Record<string, unknown> = resumeFrom ? { ...resumeFrom.variables } : {};
  const output: string[] = resumeFrom ? [...resumeFrom.output] : [];
  const trace: number[] = resumeFrom ? [...resumeFrom.trace] : [];
  const diagnostics: Diagnostic[] = [];
  const forStack: Array<{ line: number; name: string; end: number; step: number }> = resumeFrom
    ? resumeFrom.forStack.map((f) => ({ ...f }))
    : [];
  const whileStack: Array<{ line: number; condition: string }> = resumeFrom
    ? resumeFrom.whileStack.map((w) => ({ ...w }))
    : [];
  let pointer = resumeFrom ? resumeFrom.pointer : 0;
  let inputIndex = 0;
  let guard = 0;

  while (pointer < lines.length && guard < 10000) {
    guard += 1;
    const statement = lines[pointer].trim();
    const lineNumber = pointer + 1;
    if (!statement) {
      pointer += 1;
      continue;
    }
    trace.push(lineNumber);

    if (/^(start|end|program main|begin)$/i.test(statement) || /^(comment|\/\/|#)/i.test(statement)) {
      pointer += 1;
      continue;
    }

    const declaration = statement.match(/^(?:declare|constant)\s+([A-Za-z_]\w*)(?:\s*\[\s*(.+?)\s*\])?/i);
    if (declaration) {
      variables[declaration[1]] = declaration[2]
        ? Array.from({ length: Math.max(0, Number(evaluate(declaration[2], variables))) }, () => 0)
        : 0;
      pointer += 1;
      continue;
    }

    const inputMatch = statement.match(/^(?:input|read)\s+([A-Za-z_]\w*)(?:\s*\[\s*(.+?)\s*\])?/i);
    if (inputMatch) {
      // Pause and surface a session when no input value is queued.
      if (inputIndex >= inputQueue.length) {
        const indexExpr = inputMatch[2] ? Number(evaluate(inputMatch[2], variables)) : undefined;
        const waitingFor = indexExpr !== undefined
          ? `${inputMatch[1]}[${indexExpr}]`
          : inputMatch[1];
        const session: ExecutionSession = {
          pointer,
          variables: { ...variables },
          forStack: forStack.map((f) => ({ ...f })),
          whileStack: whileStack.map((w) => ({ ...w })),
          output: [...output],
          trace: [...trace],
          waitingFor,
        };
        return { output: [...output], variables: { ...variables }, trace: [...trace], diagnostics, session };
      }
      const value = coerceValue(inputQueue[inputIndex]);
      if (inputMatch[2]) {
        const array = Array.isArray(variables[inputMatch[1]]) ? variables[inputMatch[1]] as unknown[] : [];
        array[Number(evaluate(inputMatch[2], variables))] = value;
        variables[inputMatch[1]] = array;
      } else variables[inputMatch[1]] = value;
      inputIndex += 1;
      pointer += 1;
      continue;
    }

    const outputMatch = statement.match(/^(?:output|display|print)\s*(.*)$/i);
    if (outputMatch) {
      const parts = outputMatch[1].split(",").map((part) => evaluate(part.trim(), variables));
      output.push(parts.join(" "));
      pointer += 1;
      continue;
    }

    const addMatch = statement.match(/^add\s+(.+?)\s+to\s+([A-Za-z_]\w*)$/i);
    if (addMatch) {
      variables[addMatch[2]] = Number(variables[addMatch[2]] ?? 0) + Number(evaluate(addMatch[1], variables));
      pointer += 1;
      continue;
    }

    const assignment = statement
      .replace(/^(?:set|let)\s+/i, "")
      .match(/^([A-Za-z_]\w*)(?:\s*\[\s*(.+?)\s*\])?\s*(?:=|<-|←|:=|\bto\b)\s*(.+)$/i);
    if (assignment) {
      const value = evaluate(assignment[3], variables);
      if (assignment[2]) {
        const array = Array.isArray(variables[assignment[1]]) ? variables[assignment[1]] as unknown[] : [];
        array[Number(evaluate(assignment[2], variables))] = value;
        variables[assignment[1]] = array;
      } else variables[assignment[1]] = value;
      pointer += 1;
      continue;
    }

    if (/^break$/i.test(statement)) {
      if (forStack.length) {
        forStack.pop();
        pointer = matchingCloser(lines, pointer, /^for\b/i, /^(?:next\b|end for|endfor)/i) + 1;
      } else if (whileStack.length) {
        whileStack.pop();
        pointer = matchingCloser(lines, pointer, /^while\b/i, /^(?:end while|endwhile)$/i) + 1;
      } else pointer += 1;
      continue;
    }

    const ifMatch = statement.match(/^(?:if|else if|elseif)\s+(.+?)(?:\s+then)?$/i);
    if (ifMatch) {
      if (!Boolean(evaluate(ifMatch[1], variables))) {
        const alternate = matchingCloser(lines, pointer, /^if\b/i, /^(?:end if|endif)$/i, /^else\b/i);
        pointer = /^else$/i.test(lines[alternate]?.trim() ?? "") ? alternate + 1 : alternate;
      } else {
        pointer += 1;
      }
      continue;
    }
    if (/^else\b/i.test(statement)) {
      pointer = matchingCloser(lines, pointer, /^if\b/i, /^(?:end if|endif)$/i);
      continue;
    }
    if (/^(?:end if|endif)$/i.test(statement)) {
      pointer += 1;
      continue;
    }

    const whileMatch = statement.match(/^while\s+(.+)$/i);
    if (whileMatch) {
      if (!Boolean(evaluate(whileMatch[1], variables))) {
        pointer = matchingCloser(lines, pointer, /^while\b/i, /^(?:end while|endwhile)$/i) + 1;
      } else {
        whileStack.push({ line: pointer, condition: whileMatch[1] });
        pointer += 1;
      }
      continue;
    }
    if (/^(?:end while|endwhile)$/i.test(statement)) {
      const loop = whileStack.at(-1);
      if (loop && Boolean(evaluate(loop.condition, variables))) pointer = loop.line;
      else {
        whileStack.pop();
        pointer += 1;
      }
      continue;
    }

    const forMatch = statement.match(/^for\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/i);
    if (forMatch) {
      const existing = forStack.at(-1);
      if (!existing || existing.line !== pointer) {
        const start = Number(evaluate(forMatch[2], variables));
        const end = Number(evaluate(forMatch[3], variables));
        const step = Number(evaluate(forMatch[4] ?? "1", variables));
        variables[forMatch[1]] = start;
        const hasIterations = step >= 0 ? start <= end : start >= end;
        if (!hasIterations) {
          pointer = matchingCloser(lines, pointer, /^for\b/i, /^(?:next\b|end for|endfor)/i) + 1;
          continue;
        }
        forStack.push({
          line: pointer,
          name: forMatch[1],
          end,
          step,
        });
      }
      pointer += 1;
      continue;
    }
    if (/^(?:next\b|end for|endfor)/i.test(statement)) {
      const loop = forStack.at(-1);
      if (loop) {
        variables[loop.name] = Number(variables[loop.name] ?? 0) + loop.step;
        const keepGoing = loop.step >= 0
          ? Number(variables[loop.name]) <= loop.end
          : Number(variables[loop.name]) >= loop.end;
        if (keepGoing) pointer = loop.line + 1;
        else {
          forStack.pop();
          pointer += 1;
        }
      } else pointer += 1;
      continue;
    }

    diagnostics.push({ line: lineNumber, severity: "warning", message: `Skipped: ${statement}` });
    pointer += 1;
  }

  if (guard >= 10000) {
    diagnostics.push({ line: Math.max(1, pointer + 1), severity: "error", message: "Execution stopped: loop limit reached." });
  }
  return { output, variables, trace, diagnostics };
}

export function generateSource(code: string, language: "python" | "javascript" | "java" | "swift"): string {
  const lines = code.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const out: string[] = [];
  const declared = new Set<string>();
  let indent = 0;
  const pad = () => "    ".repeat(Math.max(0, indent));
  const expression = (value: string) => value
    .replace(/<>/g, "!=")
    .replace(/\bAND\b/gi, "&&")
    .replace(/\bOR\b/gi, "||")
    .replace(/(?<![<>=!])=(?!=)/g, "==");

  if (language === "java") out.push("public class Main {", "    public static void main(String[] args) {");
  if (language === "javascript") out.push("// Generated by Augorithm");
  if (language === "swift") out.push("// Generated by Augorithm");
  if (language === "java") indent = 2;

  lines.forEach((statement) => {
    if (/^(start|end)$/i.test(statement)) return;
    if (/^(?:end if|endif|end while|endwhile|next\b|end for|endfor)/i.test(statement)) {
      indent = Math.max(language === "java" ? 2 : 0, indent - 1);
      if (language !== "python") out.push(`${pad()}}`);
      return;
    }
    if (/^else\b/i.test(statement)) {
      indent = Math.max(language === "java" ? 2 : 0, indent - 1);
      out.push(language === "python" ? `${pad()}else:` : `${pad()}} else {`);
      indent += 1;
      return;
    }
    const inputMatch = statement.match(/^(?:input|read)\s+([A-Za-z_]\w*)/i);
    if (inputMatch) {
      declared.add(inputMatch[1]);
      const line = language === "python" ? `${inputMatch[1]} = input()`
        : language === "javascript" ? `const ${inputMatch[1]} = prompt("${inputMatch[1]}");`
          : language === "swift" ? `let ${inputMatch[1]} = readLine() ?? ""`
            : `String ${inputMatch[1]} = new java.util.Scanner(System.in).nextLine();`;
      out.push(`${pad()}${line}`);
      return;
    }
    const outputMatch = statement.match(/^(?:output|display|print)\s*(.*)$/i);
    if (outputMatch) {
      const javaOutput = outputMatch[1].split(",").map((part) => part.trim()).join(' + " " + ');
      const line = language === "python" ? `print(${outputMatch[1]})`
        : language === "javascript" ? `console.log(${outputMatch[1]});`
          : language === "swift" ? `print(${outputMatch[1]})`
            : `System.out.println(${javaOutput});`;
      out.push(`${pad()}${line}`);
      return;
    }
    const ifMatch = statement.match(/^(?:if|else if|elseif)\s+(.+?)(?:\s+then)?$/i);
    if (ifMatch) {
      const isElseIf = /^(?:else if|elseif)\b/i.test(statement);
      if (isElseIf) indent = Math.max(language === "java" ? 2 : 0, indent - 1);
      const keyword = isElseIf ? (language === "python" ? "elif" : "} else if") : "if";
      out.push(language === "python"
        ? `${pad()}${keyword} ${expression(ifMatch[1]).replace(/&&/g, "and").replace(/\|\|/g, "or")}:`
        : `${pad()}${keyword} (${expression(ifMatch[1])}) {`);
      indent += 1;
      return;
    }
    const whileMatch = statement.match(/^while\s+(.+)$/i);
    if (whileMatch) {
      out.push(language === "python"
        ? `${pad()}while ${expression(whileMatch[1]).replace(/&&/g, "and").replace(/\|\|/g, "or")}:`
        : `${pad()}while (${expression(whileMatch[1])}) {`);
      indent += 1;
      return;
    }
    const forMatch = statement.match(/^for\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/i);
    if (forMatch) {
      declared.add(forMatch[1]);
      const step = forMatch[4] ?? "1";
      if (language === "python") out.push(`${pad()}for ${forMatch[1]} in range(${forMatch[2]}, (${forMatch[3]}) + 1, ${step}):`);
      else if (language === "swift") out.push(`${pad()}for ${forMatch[1]} in stride(from: ${forMatch[2]}, through: ${forMatch[3]}, by: ${step}) {`);
      else if (language === "java") out.push(`${pad()}for (int ${forMatch[1]} = ${forMatch[2]}; ${forMatch[1]} <= ${forMatch[3]}; ${forMatch[1]} += ${step}) {`);
      else out.push(`${pad()}for (let ${forMatch[1]} = ${forMatch[2]}; ${forMatch[1]} <= ${forMatch[3]}; ${forMatch[1]} += ${step}) {`);
      indent += 1;
      return;
    }
    const addMatch = statement.match(/^add\s+(.+?)\s+to\s+([A-Za-z_]\w*)$/i);
    if (addMatch) {
      out.push(`${pad()}${addMatch[2]} += ${addMatch[1]}${language === "javascript" || language === "java" ? ";" : ""}`);
      return;
    }
    const assignment = statement
      .replace(/^(?:set|let)\s+/i, "")
      .replace(/<-|←|:=|\bto\b/i, "=");
    const assignmentMatch = assignment.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const [whole, name] = assignmentMatch;
      const prefix = declared.has(name) ? ""
        : language === "javascript" ? "let "
          : language === "java" ? "double "
            : language === "swift" ? "var "
              : "";
      declared.add(name);
      out.push(`${pad()}${prefix}${whole}${language === "javascript" || language === "java" ? ";" : ""}`);
      return;
    }
    out.push(`${pad()}${assignment}${language === "javascript" || language === "java" ? ";" : ""}`);
  });

  if (language === "java") out.push("    }", "}");
  return out.join("\n");
}

export function createDiagramNode(kind: NodeKind, position: Point, label?: string): DiagramNode {
  const size = defaultSize(kind);
  return {
    id: `node-${crypto.randomUUID()}`,
    kind,
    label: label ?? kind[0].toUpperCase() + kind.slice(1),
    position,
    ...size,
    layer: "Diagram",
    style: { ...COLORS[kind] },
  };
}
