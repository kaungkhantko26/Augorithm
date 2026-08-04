"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDiagramNode,
  createProject,
  executePseudocode,
  resumeExecution,
  formatPseudocode,
  generateSource,
  migrateProject,
  parsePseudocode,
  type DiagramEdge,
  type DiagramNode,
  type DiagramPage,
  type EditorMode,
  type ExecutionSession,
  type NodeKind,
  type Point,
  type ProjectV2,
} from "@/lib/augorithm-core";
import { loadRecoveryProject, saveRecoveryProject } from "@/lib/project-storage";
import { CONNECTOR_STROKE_WIDTH, edgeLabelPoint, edgePoints, pathFromPoints } from "@/lib/diagram-routing";
import { validateConnections } from "@/lib/connector-validation";
import { generateJava, generateNotes, generatePseudocode, generatePython, parsePseudocodeToIR, parsePythonToIR } from "@/lib/algorithm-ir";
import { EditorToolbar } from "./editor-toolbar";
import { EditorPalette } from "./editor-palette";
import { EditorCanvas } from "./editor-canvas";
import { EditorInspector } from "./editor-inspector";
import { EditorBottomPanel, type BottomTab } from "./editor-bottom-panel";
import { CodeEditor } from "./code-editor";

const STORAGE_KEY = "augorithm:web-project:v2";
type RuntimeStatus = "idle" | "building" | "ready" | "running" | "paused" | "waiting-for-input" | "completed" | "error" | "stopped";
type RuntimeSpeed = ".25" | ".5" | "1" | "2" | "instant";
const cloneProject = (project: ProjectV2): ProjectV2 => structuredClone(project);

function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function pageWithUpdates(project: ProjectV2, pageId: string, updates: Partial<DiagramPage>): ProjectV2 {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    pages: project.pages.map((page) => page.id === pageId ? { ...page, ...updates } : page),
  };
}

function exportSvg(page: DiagramPage): string {
  const exportPadding = 144;
  const nodeMap = new Map(page.nodes.map((node) => [node.id, node]));
  const routedPoints = page.edges.flatMap((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    return source && target ? edgePoints(edge, source, target, page.nodes) : [];
  });
  const minContentX = page.nodes.length
    ? Math.min(...page.nodes.map((node) => node.position.x), ...routedPoints.map((point) => point.x))
    : 0;
  const minContentY = page.nodes.length
    ? Math.min(...page.nodes.map((node) => node.position.y), ...routedPoints.map((point) => point.y))
    : 0;
  const maxContentX = page.nodes.length
    ? Math.max(...page.nodes.map((node) => node.position.x + node.width), ...routedPoints.map((point) => point.x))
    : 1000;
  const maxContentY = page.nodes.length
    ? Math.max(...page.nodes.map((node) => node.position.y + node.height), ...routedPoints.map((point) => point.y))
    : 700;
  const width = Math.ceil(maxContentX - minContentX + exportPadding * 2);
  const height = Math.ceil(maxContentY - minContentY + exportPadding * 2);
  const offsetX = exportPadding - minContentX;
  const offsetY = exportPadding - minContentY;
  const escape = (value: string) => value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character] ?? character);
  const edges = page.edges.map((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return "";
    const points = edgePoints(edge, source, target, page.nodes);
    const path = pathFromPoints(points);
    const labelPoint = edgeLabelPoint(points);
    const label = edge.label
      ? `<g><rect x="${labelPoint.x - edge.label.length * 4.2 - 8}" y="${labelPoint.y - 12}" width="${edge.label.length * 8.4 + 16}" height="22" rx="11" fill="${page.background}" stroke="#aebed0"/><text x="${labelPoint.x}" y="${labelPoint.y + 3}" text-anchor="middle" fill="#30455f" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700">${escape(edge.label)}</text></g>`
      : "";
    return `<g><path d="${path}" fill="none" stroke="#30455f" stroke-width="${CONNECTOR_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"${edge.annotationOnly ? ' stroke-dasharray="8 8"' : ""}${edge.arrow === "none" ? "" : ' marker-end="url(#arrow)"'}/>${label}</g>`;
  }).join("");
  const nodes = page.nodes.map((node) => {
    const radius = node.kind === "start" || node.kind === "end" || node.kind === "usecase" ? node.height / 2 : 12;
    const left = node.position.x;
    const top = node.position.y;
    const right = left + node.width;
    const bottom = top + node.height;
    const middleX = left + node.width / 2;
    const middleY = top + node.height / 2;
    const shape = node.kind === "decision"
      ? `<polygon points="${middleX},${top} ${right},${middleY} ${middleX},${bottom} ${left},${middleY}" fill="${node.style.fill}" stroke="${node.style.stroke}" stroke-width="3" stroke-linejoin="round"/>`
      : node.kind === "input" || node.kind === "output"
        ? `<polygon points="${left + 24},${top} ${right},${top} ${right - 24},${bottom} ${left},${bottom}" fill="${node.style.fill}" stroke="${node.style.stroke}" stroke-width="3" stroke-linejoin="round"/>`
        : node.kind === "loop"
          ? `<polygon points="${left + 28},${top} ${right - 28},${top} ${right},${middleY} ${right - 28},${bottom} ${left + 28},${bottom} ${left},${middleY}" fill="${node.style.fill}" stroke="${node.style.stroke}" stroke-width="3" stroke-linejoin="round"/>`
          : `<rect x="${left}" y="${top}" width="${node.width}" height="${node.height}" rx="${radius}" fill="${node.style.fill}" stroke="${node.style.stroke}" stroke-width="3"/>`;
    const lines = node.label.match(/.{1,34}(?:\s|$)/g) ?? [node.label];
    const text = lines.slice(0, 4).map((line, index) =>
      `<tspan x="${node.position.x + node.width / 2}" dy="${index === 0 ? 0 : 19}">${escape(line.trim())}</tspan>`).join("");
    return `<g>${shape}<text x="${node.position.x + node.width / 2}" y="${node.position.y + node.height / 2 - (lines.length - 1) * 8}" text-anchor="middle" dominant-baseline="middle" fill="${node.style.text}" font-family="Inter,Arial,sans-serif" font-size="${node.style.fontSize}" font-weight="650">${text}</text></g>`;
  }).join("");
  const markerId = `augorithm-arrow-${page.id.replace(/[^a-z0-9_-]/gi, "")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="${markerId}" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 7 7"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#30455f"/></marker></defs><rect width="100%" height="100%" fill="${page.background}"/><g transform="translate(${offsetX} ${offsetY})">${edges.replaceAll('url(#arrow)', `url(#${markerId})`)}${nodes}</g></svg>`;
}

async function svgToPng(svg: string): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The diagram could not be rendered."));
      image.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas export is unavailable.");
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed.")), "image/png", 1);
    });
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function EditorWorkspace() {
  const [project, setProject] = useState<ProjectV2>(() => createProject());
  const [history, setHistory] = useState<ProjectV2[]>([]);
  const [future, setFuture] = useState<ProjectV2[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [paletteCollapsed, setPaletteCollapsed] = useState(true);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>("console");
  const [workspaceView, setWorkspaceView] = useState<"canvas" | "code" | "split" | "source" | "notes">("canvas");
  const [zoom, setZoom] = useState(0.9);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [pendingSession, setPendingSession] = useState<ExecutionSession | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [runtimeNodeId, setRuntimeNodeId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("idle");
  const [runtimeSpeed, setRuntimeSpeed] = useState<RuntimeSpeed>("1");
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [runtimeMessage, setRuntimeMessage] = useState("Ready");
  const [stepResult, setStepResult] = useState<ReturnType<typeof executePseudocode> | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [presentationMode, setPresentationMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [pythonImportRequest, setPythonImportRequest] = useState(0);
  const [sourceLanguage, setSourceLanguage] = useState<"python" | "javascript" | "java" | "swift">("python");
  const [sourceRunning, setSourceRunning] = useState(false);
  const [sourceDrafts, setSourceDrafts] = useState<Partial<Record<"python" | "javascript" | "java" | "swift", string>>>({});
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState(() => parsePseudocode(project.code).diagnostics);
  const [lastParsedCode, setLastParsedCode] = useState(project.code);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pythonInputRef = useRef<HTMLInputElement>(null);
  const dragOriginRef = useRef<ProjectV2 | null>(null);
  const edgeDragOriginRef = useRef<ProjectV2 | null>(null);

  const activePage = project.pages.find((page) => page.id === project.activePageId) ?? project.pages[0];
  const selectedNode = activePage.nodes.find((node) => node.id === selectedIds[0]) ?? null;
  const selectedEdge = activePage.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const algorithmIR = useMemo(() => parsePseudocodeToIR(project.code, project.name), [project.code, project.name]);
  const javaBuild = useMemo(() => generateJava(algorithmIR), [algorithmIR]);
  const generatedSource = useMemo(() => sourceLanguage === "python" ? generatePython(algorithmIR)
    : sourceLanguage === "java" ? javaBuild.code
      : generateSource(project.code, sourceLanguage), [algorithmIR, javaBuild.code, project.code, sourceLanguage]);
  const generatedNotes = useMemo(() => generateNotes(algorithmIR), [algorithmIR]);
  const activeSource = sourceDrafts[sourceLanguage] ?? generatedSource;

  const commit = useCallback((updater: (current: ProjectV2) => ProjectV2) => {
    setProject((current) => {
      setHistory((items) => [...items.slice(-59), cloneProject(current)]);
      setFuture([]);
      return updater(current);
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setProject((current) => {
        setFuture((next) => [cloneProject(current), ...next].slice(0, 60));
        return cloneProject(previous);
      });
      return items.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((items) => {
      const next = items[0];
      if (!next) return items;
      setProject((current) => {
        setHistory((previous) => [...previous.slice(-59), cloneProject(current)]);
        return cloneProject(next);
      });
      return items.slice(1);
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const indexedProject = await loadRecoveryProject();
        const saved = indexedProject ?? JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved) {
          const recovered = migrateProject(saved);
          setLastParsedCode(recovered.code);
          setProject(recovered);
        }
      } catch {
        // A malformed recovery record should never block the editor.
      }
    })();
    try {
      const savedTheme = localStorage.getItem("augorithm:web-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        window.setTimeout(() => setTheme(savedTheme), 0);
      }
    } catch {
      // A malformed recovery record should never block the editor.
    }
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      void saveRecoveryProject(project).catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    if (project.code === lastParsedCode) return;
    const timer = window.setTimeout(() => {
      setProject((current) => {
        const page = current.pages.find((item) => item.id === current.activePageId) ?? current.pages[0];
        if (!page || page.mode !== "algorithm") return current;
        const parsed = parsePseudocode(current.code, page.nodes);
        setLastParsedCode(current.code);
        setDiagnostics(parsed.diagnostics);
        return pageWithUpdates(current, page.id, { nodes: parsed.nodes, edges: parsed.edges });
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [lastParsedCode, project.code]);

  useEffect(() => {
    document.documentElement.dataset.editorTheme = theme;
    localStorage.setItem("augorithm:web-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!pythonImportRequest) return;
    pythonInputRef.current?.click();
  }, [pythonImportRequest]);

  const build = useCallback((resetLayout = false) => {
    const page = project.pages.find((item) => item.id === project.activePageId) ?? project.pages[0];
    const parsed = parsePseudocode(project.code, resetLayout ? [] : page.nodes);
    setLastParsedCode(project.code);
    const connectionDiagnostics = validateConnections(parsed.nodes, parsed.edges);
    setDiagnostics([...parsed.diagnostics, ...connectionDiagnostics]);
    commit((current) => pageWithUpdates(current, page.id, {
      mode: "algorithm",
      nodes: parsed.nodes,
      edges: [...parsed.edges, ...page.edges.filter((edge) => edge.annotationOnly)],
    }));
    setSelectedIds([]);
    setSelectedEdgeId(null);
    setRuntimeStatus(connectionDiagnostics.length || parsed.diagnostics.some((item) => item.severity === "error") ? "error" : "ready");
    setRuntimeMessage(connectionDiagnostics.length ? "Build failed" : "Ready");
    setBottomTab(connectionDiagnostics.length || parsed.diagnostics.some((item) => item.severity === "error") ? "problems" : "console");
    setBottomCollapsed(false);
  }, [commit, project]);

  /** Shared helper that applies any ExecutionResult to state */
  const applyResult = useCallback((result: ReturnType<typeof executePseudocode>) => {
    setOutput(result.output);
    setVariables(result.variables);
    setDiagnostics([...parsePseudocode(project.code, activePage.nodes).diagnostics, ...result.diagnostics]);
    const finalLine = result.trace.at(-1);
    setRuntimeNodeId(activePage.nodes.find((node) => node.sourceLine === finalLine)?.id ?? null);
    setStepIndex(result.trace.length - 1);
    if (result.session) {
      // Execution paused — waiting for the user to supply one INPUT value.
      setPendingSession(result.session);
      setRuntimeStatus("waiting-for-input");
      setRuntimeMessage(`Waiting for input: ${result.session.waitingFor}`);
      setBottomTab("console");
      setBottomCollapsed(false);
      // Keep running=true so Run button shows "■ Stop"
    } else {
      setPendingSession(null);
      setRunning(false);
      setRuntimeStatus(result.diagnostics.some((item) => item.severity === "error") ? "error" : "completed");
      setRuntimeMessage(result.diagnostics.some((item) => item.severity === "error") ? "Execution error" : "Completed");
      setBottomTab(result.diagnostics.some((item) => item.severity === "error") ? "problems" : "console");
      setBottomCollapsed(false);
    }
  }, [activePage.nodes, project.code]);

  const run = useCallback(() => {
    const parsed = parsePseudocode(project.code, activePage.nodes);
    const connectionDiagnostics = validateConnections(parsed.nodes, parsed.edges);
    const buildDiagnostics = [...parsed.diagnostics, ...connectionDiagnostics];
    if (buildDiagnostics.some((item) => item.severity === "error")) {
      setDiagnostics(buildDiagnostics);
      setRuntimeStatus("error");
      setRuntimeMessage("Build failed");
      setBottomTab("problems");
      setBottomCollapsed(false);
      return;
    }
    setRunning(true);
    setRuntimeStatus("running");
    setRuntimeMessage("Running");
    setPendingSession(null);
    setInput("");
    setInputError("");
    setOutput([]);
    setVariables({});
    setBottomTab("console");
    setBottomCollapsed(false);
    applyResult(executePseudocode(project.code, ""));
    setStepResult(null);
  }, [activePage.nodes, applyResult, project.code]);

  const stop = useCallback(() => {
    setPendingSession(null);
    setRunning(false);
    setRuntimeStatus("stopped");
    setRuntimeMessage("Stopped");
    setActiveEdgeId(null);
  }, []);

  const resetRuntime = useCallback(() => {
    setStepResult(null);
    setPendingSession(null);
    setRunning(false);
    setOutput([]);
    setVariables({});
    setStepIndex(-1);
    setRuntimeNodeId(null);
    setActiveEdgeId(null);
    setRuntimeStatus("idle");
    setRuntimeMessage("Ready");
  }, []);

  /** Called when the user submits a value for the current INPUT statement. */
  const submitInput = useCallback(() => {
    if (!pendingSession) return;
    const value = input.trim();
    if (!value) return;
    const variableName = pendingSession.waitingFor.replace(/\[.*$/, "");
    const currentValue = pendingSession.variables[variableName];
    const expectsNumber = typeof currentValue === "number" || (Array.isArray(currentValue) && currentValue.every((item) => typeof item === "number"));
    if (expectsNumber && !Number.isFinite(Number(value))) {
      setInputError("Enter a valid number before continuing.");
      return;
    }
    setInput("");
    setInputError("");
    applyResult(resumeExecution(project.code, pendingSession, value));
  }, [applyResult, input, pendingSession, project.code]);

  const step = useCallback(() => {
    if (pendingSession) return;
    let result = stepResult;
    if (!result || stepIndex >= result.trace.length - 1) {
      const parsed = parsePseudocode(project.code, activePage.nodes);
      const issues = [...parsed.diagnostics, ...validateConnections(parsed.nodes, parsed.edges)];
      if (issues.some((item) => item.severity === "error")) {
        setDiagnostics(issues); setRuntimeStatus("error"); setRuntimeMessage("Build failed"); setBottomTab("problems"); return;
      }
      result = executePseudocode(project.code, "");
      setStepResult(result);
      setStepIndex(-1);
      setOutput([]);
      setVariables({});
    }
    const trace = result.trace;
    const nextIndex = Math.min(stepIndex + 1, trace.length - 1);
    setStepIndex(nextIndex);
    const line = trace[nextIndex];
    const node = activePage.nodes.find((item) => item.sourceLine === line);
    const previousNode = activePage.nodes.find((item) => item.id === runtimeNodeId);
    setRuntimeNodeId(node?.id ?? null);
    setActiveEdgeId(previousNode && node ? activePage.edges.find((edge) => edge.source === previousNode.id && edge.target === node.id)?.id ?? null : null);
    setRuntimeStatus("paused");
    setRuntimeMessage(node ? `Paused at line ${line}` : "Paused");
    if (node) setSelectedIds([node.id]);
    if (nextIndex === trace.length - 1) {
      setOutput(result.output);
      setVariables(result.variables);
      if (result.session) { setPendingSession(result.session); setRuntimeStatus("waiting-for-input"); setRuntimeMessage(`Waiting for input: ${result.session.waitingFor}`); }
      else { setRuntimeStatus(result.diagnostics.some((item) => item.severity === "error") ? "error" : "completed"); setRuntimeMessage(result.diagnostics.some((item) => item.severity === "error") ? "Execution error" : "Completed"); }
    }
  }, [activePage.edges, activePage.nodes, pendingSession, project.code, runtimeNodeId, stepIndex, stepResult]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      } else if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        downloadFile(`${project.name || "Augorithm"}.augo`, JSON.stringify(project, null, 2), "application/json");
      } else if (modifier && event.key.toLowerCase() === "o") {
        event.preventDefault();
        fileInputRef.current?.click();
      } else if (modifier && event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      } else if (modifier && event.key === "Enter") {
        event.preventDefault();
        run();
      } else if (event.key === "F10" && !event.shiftKey) {
        event.preventDefault();
        step();
      } else if (event.key === "F11") {
        event.preventDefault();
        setPresentationMode((value) => !value);
      } else if (event.key.toLowerCase() === "f") {
        const target = event.target as HTMLElement;
        if (!target.matches("input, textarea, select, [contenteditable=true]")) { event.preventDefault(); setFocusMode((value) => !value); }
      } else if (event.key === "/") {
        const target = event.target as HTMLElement;
        if (!target.matches("input, textarea, select, [contenteditable=true]")) { event.preventDefault(); setCommandSearch(""); setCommandOpen(true); }
      } else if (event.key.toLowerCase() === "c") {
        const target = event.target as HTMLElement;
        if (!target.matches("input, textarea, select, [contenteditable=true]")) { event.preventDefault(); setConnectionMode((value) => !value); setConnectionSourceId(null); }
      } else if (modifier && event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetRuntime();
      } else if (event.key === "Escape" && (running || runtimeStatus === "paused" || runtimeStatus === "waiting-for-input")) {
        event.preventDefault();
        stop();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;
        if (!target.matches("input, textarea, select, [contenteditable=true]") && selectedEdgeId) {
          event.preventDefault();
          commit((current) => pageWithUpdates(current, activePage.id, {
            edges: activePage.edges.filter((edge) => edge.id !== selectedEdgeId),
          }));
          setSelectedEdgeId(null);
        } else if (!target.matches("input, textarea, select, [contenteditable=true]") && selectedIds.length) {
          event.preventDefault();
          commit((current) => pageWithUpdates(current, activePage.id, {
            nodes: activePage.nodes.filter((node) => !selectedIds.includes(node.id)),
            edges: activePage.edges.filter((edge) => !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)),
          }));
          setSelectedIds([]);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePage, commit, project, redo, resetRuntime, run, running, runtimeStatus, selectedEdgeId, selectedIds, step, stop, undo]);

  const updateNode = (updates: Partial<DiagramNode>) => {
    if (!selectedNode) return;
    commit((current) => pageWithUpdates(current, activePage.id, {
      nodes: activePage.nodes.map((node) => node.id === selectedNode.id ? { ...node, ...updates } : node),
    }));
  };

  const updateEdge = (updates: Partial<DiagramEdge>) => {
    if (!selectedEdge) return;
    commit((current) => pageWithUpdates(current, activePage.id, {
      edges: activePage.edges.map((edge) => edge.id === selectedEdge.id ? { ...edge, ...updates } : edge),
    }));
  };

  const addNode = (kind: NodeKind, point?: Point) => {
    const position = point ?? { x: 760, y: 120 + activePage.nodes.length * 28 };
    const node = createDiagramNode(kind, position);
    commit((current) => pageWithUpdates(current, activePage.id, {
      nodes: [...activePage.nodes, node],
      edges: activePage.edges,
    }));
    setSelectedIds([node.id]);
  };

  const moveNode = (id: string, point: Point, finished: boolean) => {
    if (!dragOriginRef.current) dragOriginRef.current = cloneProject(project);
    setProject((current) => pageWithUpdates(current, activePage.id, {
      nodes: current.pages.find((page) => page.id === activePage.id)!.nodes.map(
        (node) => node.id === id ? { ...node, position: point } : node,
      ),
    }));
    if (finished && dragOriginRef.current) {
      setHistory((items) => [...items.slice(-59), dragOriginRef.current!]);
      setFuture([]);
      dragOriginRef.current = null;
    }
  };

  const moveEdgeWaypoint = (id: string, index: number, point: Point, finished: boolean, seed: Point[]) => {
    if (!edgeDragOriginRef.current) edgeDragOriginRef.current = cloneProject(project);
    setProject((current) => pageWithUpdates(current, activePage.id, {
      edges: current.pages.find((page) => page.id === activePage.id)!.edges.map((edge) => {
        if (edge.id !== id) return edge;
        const waypoints = [...(edge.waypoints?.length ? edge.waypoints : seed)];
        waypoints[index] = point;
        return { ...edge, waypoints };
      }),
    }));
    if (finished && edgeDragOriginRef.current) {
      setHistory((items) => [...items.slice(-59), edgeDragOriginRef.current!]);
      setFuture([]);
      edgeDragOriginRef.current = null;
    }
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    commit((current) => pageWithUpdates(current, activePage.id, {
      nodes: activePage.nodes.filter((node) => !selectedIds.includes(node.id)),
      edges: activePage.edges.filter((edge) => !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)),
    }));
    setSelectedIds([]);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    commit((current) => pageWithUpdates(current, activePage.id, {
      edges: activePage.edges.filter((edge) => edge.id !== selectedEdgeId),
    }));
    setSelectedEdgeId(null);
  };

  const connectNode = (nodeId: string) => {
    if (!connectionSourceId) {
      setConnectionSourceId(nodeId);
      setSelectedIds([nodeId]);
      setSelectedEdgeId(null);
      return;
    }
    if (connectionSourceId === nodeId) {
      setConnectionSourceId(null);
      return;
    }
    const edge: DiagramEdge = {
      id: `edge-${crypto.randomUUID()}`,
      source: connectionSourceId,
      target: nodeId,
      annotationOnly: activePage.mode === "algorithm",
      strokeWidth: CONNECTOR_STROKE_WIDTH,
      arrow: "end",
    };
    commit((current) => pageWithUpdates(current, activePage.id, {
      edges: [...activePage.edges, edge],
    }));
    setConnectionSourceId(null);
    setSelectedIds([]);
    setSelectedEdgeId(edge.id);
    setInspectorCollapsed(false);
  };

  const duplicateSelected = () => {
    if (!selectedNode) return;
    const duplicate = {
      ...cloneProject({ ...project, pages: [{ ...activePage, nodes: [selectedNode], edges: [] }] }).pages[0].nodes[0],
      id: `node-${crypto.randomUUID()}`,
      sourceKey: undefined,
      sourceLine: undefined,
      position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 40 },
    };
    commit((current) => pageWithUpdates(current, activePage.id, { nodes: [...activePage.nodes, duplicate] }));
    setSelectedIds([duplicate.id]);
  };

  const setMode = (mode: EditorMode) => {
    commit((current) => pageWithUpdates(current, activePage.id, { mode }));
  };

  const addPage = () => {
    const id = `page-${crypto.randomUUID()}`;
    const page: DiagramPage = {
      id,
      name: `Page ${project.pages.length + 1}`,
      mode: "algorithm",
      nodes: [],
      edges: [],
      background: theme === "dark" ? "#111a28" : "#f7f9fc",
    };
    commit((current) => ({ ...current, pages: [...current.pages, page], activePageId: id }));
    setSelectedIds([]);
    setSelectedEdgeId(null);
    setConnectionSourceId(null);
  };

  const exportPng = async () => {
    const blob = await svgToPng(exportSvg(activePage));
    downloadFile(`${project.name || "Augorithm"}.png`, blob, "image/png");
    setOutput(["PNG exported. Check your browser Downloads folder."]);
    setBottomTab("console");
    setBottomCollapsed(false);
  };

  const copyDiagram = async () => {
    const blob = await svgToPng(exportSvg(activePage));
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      downloadFile(`${project.name || "Augorithm"}.png`, blob, "image/png");
      setOutput(["Clipboard images are unavailable in this browser, so a PNG was downloaded instead."]);
    } else {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setOutput(["Flowchart copied. Paste it directly into PowerPoint, Canva, or a document."]);
    }
    setBottomTab("console");
    setBottomCollapsed(false);
  };

  const runGeneratedSource = () => {
    if (sourceLanguage !== "python" && sourceLanguage !== "javascript") return;
    const worker = new Worker(sourceLanguage === "python" ? "/python-worker.js" : "/javascript-worker.js");
    setSourceRunning(true);
    setOutput([sourceLanguage === "python" ? "Loading the Python runtime…" : "Running JavaScript…"]);
    setBottomTab("console");
    setBottomCollapsed(false);
    const timeout = window.setTimeout(() => {
      worker.terminate();
      setSourceRunning(false);
      setOutput(["Execution stopped after 20 seconds. Check the code for an infinite loop."]);
    }, 20_000);
    worker.onmessage = (event: MessageEvent<{ status: string; output?: string[]; error?: string }>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      setSourceRunning(false);
      const lines = event.data.output ?? [];
      setOutput(event.data.status === "error"
        ? [...lines, `Error: ${event.data.error ?? "Execution failed."}`]
        : lines.length ? lines : ["Program finished without output."]);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      setSourceRunning(false);
      setOutput([`Runtime error: ${event.message}`]);
    };
    worker.postMessage({ code: activeSource, input });
  };

  const regenerateSource = () => {
    setSourceDrafts((drafts) => ({ ...drafts, [sourceLanguage]: generatedSource }));
  };

  const exportSource = () => {
    const extension = sourceLanguage === "python" ? "py"
      : sourceLanguage === "javascript" ? "js"
        : sourceLanguage === "java" ? "java"
          : "swift";
    downloadFile(sourceLanguage === "java" ? javaBuild.filename : `${project.name || "Augorithm"}.${extension}`, activeSource, "text/plain;charset=utf-8");
  };
  const openPythonImporter = useCallback(() => pythonInputRef.current?.click(), []);

  const rebuildFromIR = () => {
    const next = generatePseudocode(algorithmIR);
    setProject((current) => ({ ...current, code: next, updatedAt: new Date().toISOString() }));
    setSourceDrafts({ python: generatePython(algorithmIR), java: javaBuild.code });
    setDiagnostics([...algorithmIR.diagnostics, ...javaBuild.diagnostics]);
    setRuntimeMessage("All views rebuilt from the shared algorithm model");
  };

  const importPython = (code: string) => {
    const imported = parsePythonToIR(code, project.name);
    if (imported.diagnostics.some((item) => item.severity === "error")) {
      setDiagnostics(imported.diagnostics); setBottomTab("problems"); setBottomCollapsed(false); return;
    }
    const pseudocode = generatePseudocode(imported);
    commit((current) => ({ ...current, code: pseudocode, python: { ...current.python, code }, updatedAt: new Date().toISOString() }));
    setSourceDrafts({ python: code, java: generateJava(imported).code });
    setDiagnostics(imported.diagnostics);
    setWorkspaceView("split");
  };

  const commandActions = [
    { label: "Build flowchart", hint: "⌘B", action: () => build(false) },
    { label: "Run algorithm", hint: "⌘R", action: run },
    { label: "Auto layout", hint: "⇧A", action: () => build(true) },
    { label: "Export SVG", hint: "SVG", action: () => downloadFile(`${project.name}.svg`, exportSvg(activePage), "image/svg+xml") },
    { label: "Toggle theme", hint: "Theme", action: () => setTheme((value) => value === "light" ? "dark" : "light") },
    { label: "Add page", hint: "Page", action: addPage },
    { label: "Export PNG", hint: "Export", action: () => void exportPng() },
    { label: "Import Python", hint: "Import", action: () => setPythonImportRequest((value) => value + 1) },
    { label: "Generate Java", hint: "Java", action: () => { setSourceLanguage("java"); setWorkspaceView("source"); } },
    { label: "Focus Mode", hint: "F", action: () => setFocusMode((value) => !value) },
    { label: "Presentation Mode", hint: "F11", action: () => setPresentationMode(true) },
    { label: "Zoom In", hint: "+", action: () => setZoom((value) => Math.min(2, value + .1)) },
    { label: "Zoom Out", hint: "−", action: () => setZoom((value) => Math.max(.35, value - .1)) },
    { label: "Fit Canvas", hint: "View", action: () => setZoom(.78) },
    ...(["input", "output", "process", "decision", "loop", "comment"] as NodeKind[]).map((kind) => ({ label: `Insert ${kind}`, hint: "Shape", action: () => addNode(kind) })),
  ].filter((item) => item.label.toLowerCase().includes(commandSearch.toLowerCase()));

  return (
    <main className={`editor-app full-mode ${presentationMode ? "presentation-mode" : ""} ${focusMode ? "focus-mode" : ""}`}>
      <EditorToolbar
        projectName={project.name}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        running={running}
        runtimeStatus={runtimeStatus}
        runtimeMessage={runtimeMessage}
        runtimeSpeed={runtimeSpeed}
        theme={theme}
        onProjectNameChange={(name) => setProject((current) => ({ ...current, name, updatedAt: new Date().toISOString() }))}
        onNew={() => {
          commit(() => createProject());
          setOutput([]);
          setVariables({});
          setSelectedIds([]);
          setSelectedEdgeId(null);
          setSourceDrafts({});
        }}
        onOpen={() => fileInputRef.current?.click()}
        onSave={() => downloadFile(`${project.name || "Augorithm"}.augo`, JSON.stringify(project, null, 2), "application/json")}
        onUndo={undo}
        onRedo={redo}
        onBuild={() => build(false)}
        onRun={run}
        onStop={stop}
        onReset={resetRuntime}
        onSpeedChange={setRuntimeSpeed}
        onStep={step}
        onExportSvg={() => downloadFile(`${project.name || "Augorithm"}.svg`, exportSvg(activePage), "image/svg+xml")}
        onExportPng={() => void exportPng()}
        onCopyDiagram={() => void copyDiagram()}
        onAutoLayout={() => build(true)}
        onToggleTheme={() => setTheme((value) => value === "light" ? "dark" : "light")}
        onOpenCommands={() => setCommandOpen(true)}
        onConvert={(target) => {
          if (target === "flowchart" || target === "all") rebuildFromIR();
          else { setSourceLanguage(target); setWorkspaceView("source"); if (target === "python") setSourceDrafts((drafts) => ({ ...drafts, python: generatePython(algorithmIR) })); else setSourceDrafts((drafts) => ({ ...drafts, java: javaBuild.code })); }
        }}
        onImportPython={openPythonImporter}
        onExportJava={() => downloadFile(javaBuild.filename, javaBuild.code, "text/x-java-source;charset=utf-8")}
        onExportNotes={() => downloadFile(`${project.name || "Augorithm"}-notes.md`, generatedNotes, "text/markdown;charset=utf-8")}
        onPresentation={() => setPresentationMode(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".augo,application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const imported = migrateProject(JSON.parse(await file.text()));
            commit(() => imported);
            setDiagnostics(parsePseudocode(imported.code).diagnostics);
            setSelectedIds([]);
            setSelectedEdgeId(null);
            setSourceDrafts({});
          } finally {
            event.target.value = "";
          }
        }}
      />
      <input ref={pythonInputRef} type="file" accept=".py,text/x-python" hidden onChange={async (event) => { const file = event.target.files?.[0]; if (file) importPython(await file.text()); event.target.value = ""; }} />

      <div className={`editor-shell ${paletteCollapsed ? "palette-closed" : ""} ${inspectorCollapsed ? "inspector-closed" : ""}`}>
        {!paletteCollapsed && <div className="palette-scrim" role="presentation" onMouseDown={() => setPaletteCollapsed(true)} />}
        {!paletteCollapsed && <EditorPalette
          mode={activePage.mode}
          search={paletteSearch}
          collapsed={false}
          compact={activePage.nodes.length > 0}
          onModeChange={setMode}
          onSearchChange={setPaletteSearch}
          onAddNode={(kind) => { addNode(kind); setPaletteCollapsed(true); }}
          onToggle={() => setPaletteCollapsed((value) => !value)}
        />}

        <section className="editor-workspace" aria-label="Project workspace">
          <div className="workspace-toolbar">
            <button className="insert-trigger" type="button" onClick={() => setPaletteCollapsed(false)} aria-label="Add a shape">＋ Add</button>
            <div className="view-switcher" role="group" aria-label="Workspace view">
              {([
                ["canvas", "Flowchart"],
                ["code", "Pseudocode"],
                ["python", "Python"],
                ["java", "Java"],
                ["notes", "Notes"],
              ] as Array<[string, string]>).map(([view, label]) => (
                <button
                  type="button"
                  className={(view === "python" || view === "java" ? workspaceView === "source" && sourceLanguage === view : workspaceView === view) ? "active" : ""}
                  aria-label={view === "code" ? "Pseudocode editor" : undefined}
                  aria-pressed={workspaceView === view}
                  onClick={() => { if (view === "python" || view === "java") { setSourceLanguage(view); setWorkspaceView("source"); } else setWorkspaceView(view as "canvas" | "code" | "notes"); }}
                  key={view}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={`workspace-content view-${workspaceView}`}>
            {(workspaceView === "code" || workspaceView === "split") && (
              <CodeEditor
                value={project.code}
                title="Pseudocode"
                fileName={`${project.name}.augo`}
                language="Augorithm"
                onChange={(code) => setProject((current) => ({ ...current, code, updatedAt: new Date().toISOString() }))}
                onFormat={() => setProject((current) => ({ ...current, code: formatPseudocode(current.code), updatedAt: new Date().toISOString() }))}
                actions={<button type="button" onClick={() => build(false)}>Build flowchart</button>}
              />
            )}
            {workspaceView === "source" && (
              <section className="generated-source-pane" aria-label="Generated source editor">
                <div className="source-editor-toolbar">
                  <div role="tablist" aria-label="Generated language">
                    {(["python", "javascript", "java", "swift"] as const).map((language) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={sourceLanguage === language}
                        className={sourceLanguage === language ? "active" : ""}
                        onClick={() => setSourceLanguage(language)}
                        key={language}
                      >
                        {language === "javascript" ? "JavaScript" : language[0].toUpperCase() + language.slice(1)}
                      </button>
                    ))}
                  </div>
                  <span>Generated code is editable and kept until you regenerate it.</span>
                </div>
                <CodeEditor
                  value={activeSource}
                  title="GENERATED SOURCE"
                  fileName={sourceLanguage === "java" ? javaBuild.filename : `Main.${sourceLanguage === "python" ? "py" : sourceLanguage === "javascript" ? "js" : "swift"}`}
                  language={sourceLanguage === "javascript" ? "JavaScript" : sourceLanguage[0].toUpperCase() + sourceLanguage.slice(1)}
                  onChange={(value) => setSourceDrafts((drafts) => ({ ...drafts, [sourceLanguage]: value }))}
                  actions={(
                    <>
                      <button type="button" onClick={regenerateSource}>Regenerate</button>
                      <button type="button" onClick={exportSource}>Export</button>
                      <button
                        type="button"
                        className="ide-run-button"
                        disabled={sourceRunning || (sourceLanguage !== "python" && sourceLanguage !== "javascript")}
                        onClick={runGeneratedSource}
                      >
                        {sourceRunning ? "Running…" : "▶ Run"}
                      </button>
                    </>
                  )}
                />
              </section>
            )}
            {workspaceView === "notes" && (
              <section className="generated-source-pane notes-view" aria-label="Educational notes">
                <div className="source-editor-toolbar"><strong>Algorithm notes</strong><button type="button" onClick={() => downloadFile(`${project.name}-notes.md`, generatedNotes, "text/markdown;charset=utf-8")}>Download notes</button></div>
                <pre>{generatedNotes}</pre>
              </section>
            )}
            {(workspaceView === "canvas" || workspaceView === "split") && (
              <div className="canvas-workspace-frame"><EditorCanvas
                nodes={activePage.nodes}
                edges={activePage.edges}
                selectedIds={selectedIds}
                selectedEdgeId={selectedEdgeId}
                runtimeNodeId={runtimeNodeId}
                activeEdgeId={activeEdgeId}
                connectionMode={connectionMode}
                connectionSourceId={connectionSourceId}
                zoom={zoom}
                snapToGrid={project.preferences.snapToGrid}
                gridSize={project.preferences.gridSize}
                onSelect={(id, additive) => {
                  setSelectedEdgeId(null);
                  setInspectorCollapsed(false);
                  setSelectedIds((items) => additive
                    ? items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
                    : [id]);
                }}
                onSelectEdge={(id) => {
                  setSelectedIds([]);
                  setSelectedEdgeId(id);
                  setInspectorCollapsed(false);
                }}
                onClearSelection={() => {
                  setSelectedIds([]);
                  setSelectedEdgeId(null);
                  setInspectorCollapsed(true);
                }}
                onMoveNode={moveNode}
                onMoveEdgeWaypoint={moveEdgeWaypoint}
                onAddNode={addNode}
                onConnectNode={connectNode}
                onNewFlowchart={() => addNode("process", { x: 770, y: 280 })}
                onOpenExample={() => commit(() => createProject("Student Result Example"))}
                onImportPython={openPythonImporter}
                onEditNode={(id) => {
                  setSelectedEdgeId(null);
                  setSelectedIds([id]);
                  setInspectorCollapsed(false);
                }}
              />
              <div className="canvas-zoom-controls" role="group" aria-label="Canvas zoom">
                <button type="button" onClick={() => setZoom((value) => Math.max(.35, value - .1))} aria-label="Zoom out">−</button>
                <button type="button" onClick={() => setZoom(1)} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
                <button type="button" onClick={() => setZoom((value) => Math.min(2, value + .1))} aria-label="Zoom in">＋</button>
                <button type="button" onClick={() => setZoom(.78)} aria-label="Fit flowchart to canvas">Fit</button>
              </div></div>
            )}
          </div>

          <EditorBottomPanel
            activeTab={bottomTab}
            collapsed={bottomCollapsed}
            output={output}
            diagnostics={diagnostics}
            variables={variables}
            input={input}
            pendingSession={pendingSession}
            inputError={inputError}
            notes={generatedNotes}
            onTabChange={setBottomTab}
            onToggle={() => setBottomCollapsed((value) => !value)}
            onInputChange={(value) => { setInput(value); setInputError(""); }}
            onSubmitInput={submitInput}
            onClear={() => {
              setOutput([]);
              setVariables({});
              setRuntimeNodeId(null);
              setPendingSession(null);
            }}
            onProblemSelect={(diagnostic) => {
              const node = activePage.nodes.find((item) => item.sourceLine === diagnostic.line);
              if (node) { setSelectedEdgeId(null); setSelectedIds([node.id]); setRuntimeNodeId(node.id); setWorkspaceView("canvas"); }
            }}
          />
        </section>

        {(selectedNode || selectedEdge) && !inspectorCollapsed && <EditorInspector
          node={selectedNode}
          edge={selectedEdge}
          nodes={activePage.nodes}
          collapsed={inspectorCollapsed}
          onToggle={() => setInspectorCollapsed(true)}
          onUpdate={updateNode}
          onUpdateEdge={updateEdge}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
          onDeleteEdge={deleteSelectedEdge}
        />}
      </div>

      {commandOpen && (
        <div className="command-backdrop" role="presentation" onMouseDown={() => setCommandOpen(false)}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
            <label><span aria-hidden="true">⌕</span><input autoFocus value={commandSearch} onChange={(event) => setCommandSearch(event.target.value)} placeholder="Search commands…" /></label>
            <div>
              {commandActions.map((command) => (
                <button type="button" onClick={() => {
                  command.action();
                  setCommandOpen(false);
                  setCommandSearch("");
                }} key={command.label}>
                  <span>{command.label}</span><kbd>{command.hint}</kbd>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {presentationMode && <div className="presentation-runtime"><button type="button" onClick={step}>Step</button><button className="run-command" type="button" onClick={running ? stop : run}>{running ? "Stop" : "Run"}</button><button type="button" onClick={() => setPresentationMode(false)}>Exit</button></div>}
    </main>
  );
}
