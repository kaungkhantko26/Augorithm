"use client";

import Link from "next/link";
import Image from "next/image";

interface EditorToolbarProps {
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  running: boolean;
  runtimeStatus: "idle" | "building" | "ready" | "running" | "paused" | "waiting-for-input" | "completed" | "error" | "stopped";
  runtimeMessage: string;
  runtimeSpeed: string;
  theme: "light" | "dark";
  onProjectNameChange: (name: string) => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onBuild: () => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: ".25" | ".5" | "1" | "2" | "instant") => void;
  onStep: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopyDiagram: () => void;
  onAutoLayout: () => void;
  onToggleTheme: () => void;
  onOpenCommands: () => void;
  onConvert: (target: "flowchart" | "python" | "java" | "all") => void;
  onImportPython: () => void;
  onExportJava: () => void;
  onExportNotes: () => void;
  studentMode: boolean;
  onToggleStudentMode: () => void;
  onPresentation: () => void;
}

export function EditorToolbar({
  projectName,
  canUndo,
  canRedo,
  running,
  runtimeStatus,
  runtimeMessage,
  runtimeSpeed,
  theme,
  onProjectNameChange,
  onNew,
  onOpen,
  onSave,
  onUndo,
  onRedo,
  onBuild,
  onRun,
  onStop,
  onReset,
  onSpeedChange,
  onStep,
  onExportSvg,
  onExportPng,
  onCopyDiagram,
  onAutoLayout,
  onToggleTheme,
  onOpenCommands,
  onConvert,
  onImportPython,
  onExportJava,
  onExportNotes,
  studentMode,
  onToggleStudentMode,
  onPresentation,
}: EditorToolbarProps) {
  return (
    <header className="editor-topbar">
      <Link className="editor-brand" href="/" aria-label="Back to Augorithm home">
        <Image src="/augorithm-icon.png" alt="" width={42} height={42} priority unoptimized />
        <span><strong>AUGORITHM</strong><small>Think it. Chart it. Run it.</small></span>
      </Link>

      <nav className="editor-commandbar" aria-label="Editor commands">
        <div className="toolbar-group">
          <button type="button" onClick={onNew} title="New project (Ctrl/⌘ N)">New</button>
          <button type="button" onClick={onOpen} title="Open .augo project (Ctrl/⌘ O)">Open</button>
          <button type="button" onClick={onSave} title="Save .augo project (Ctrl/⌘ S)">Save</button>
        </div>
        <details className="export-menu convert-menu">
          <summary>Convert</summary>
          <div>
            <button type="button" onClick={() => onConvert("flowchart")}>Pseudocode → Flowchart</button>
            <button type="button" onClick={() => onConvert("python")}>Pseudocode → Python</button>
            <button type="button" onClick={() => onConvert("java")}>Pseudocode → Java</button>
            <button type="button" onClick={() => onConvert("all")}>Rebuild all views</button>
          </div>
        </details>
        <details className="export-menu convert-menu">
          <summary>Import</summary>
          <div><button type="button" onClick={onOpen}>Augorithm project</button><button type="button" onClick={onImportPython}>Python file</button></div>
        </details>
        <div className="toolbar-group compact">
          <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/⌘ Z)" aria-label="Undo">↶</button>
          <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/⌘ Shift Z)" aria-label="Redo">↷</button>
        </div>
        <div className="toolbar-group">
          <button type="button" onClick={onBuild} disabled={running} title="Build latest pseudocode and validate connections">Build</button>
          <button type="button" onClick={onAutoLayout} disabled={running} title="Restore automatic layout">Auto layout</button>
          <button type="button" onClick={onStep} disabled={running || runtimeStatus === "waiting-for-input"} title="Execute one logical operation (F10)">Step</button>
          {running ? (
            <button className="run-command stop-command" type="button" onClick={onStop} title="Stop execution">
              ■ Stop
            </button>
          ) : (
            <button className="run-command" type="button" onClick={onRun} title="Run or resume algorithm (Ctrl/⌘ Enter)">
              {runtimeStatus === "completed" ? "↻ Run Again" : runtimeStatus === "error" ? "↻ Restart" : runtimeStatus === "paused" ? "▶ Resume" : "▶ Run"}
            </button>
          )}
          <button type="button" onClick={onReset} disabled={runtimeStatus === "idle" || runtimeStatus === "ready"} title="Reset runtime (Ctrl/⌘ Shift R)">↻ Reset</button>
          <label className="runtime-speed" title="Execution speed">
            <span className="sr-only">Execution speed</span>
            <select value={runtimeSpeed} onChange={(event) => onSpeedChange(event.target.value as ".25" | ".5" | "1" | "2" | "instant")} aria-label="Execution speed">
              <option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="instant">Instant</option>
            </select>
          </label>
          <span className={`runtime-status status-${runtimeStatus}`} role="status" aria-live="polite">● {runtimeMessage}</span>
        </div>
      </nav>

      <div className="editor-project-identity">
        <label>
          <span className="sr-only">Project name</span>
          <input
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            aria-label="Project name"
          />
        </label>
        <span className="save-indicator">● Saved locally</span>
      </div>

      <div className="editor-top-actions">
        <button type="button" className="mode-pill" onClick={onToggleStudentMode} title="Switch between simplified Student Mode and advanced Teacher Mode">{studentMode ? "Student" : "Teacher"}</button>
        <button type="button" onClick={onPresentation} title="Hide panels for classroom presentation (F11)">Present</button>
        <button type="button" onClick={onOpenCommands} title="Command palette (Ctrl/⌘ K)" aria-label="Open command palette">⌘K</button>
        <details className="export-menu">
          <summary>Export</summary>
          <div>
            <button type="button" onClick={onExportSvg}>SVG diagram</button>
            <button type="button" onClick={onExportPng}>PNG image</button>
            <button type="button" onClick={onCopyDiagram}>Copy for slides</button>
            <button type="button" onClick={onExportJava}>Java file</button>
            <button type="button" onClick={onExportNotes}>Notes Markdown</button>
          </div>
        </details>
        <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
          {theme === "light" ? "◐" : "☀"}
        </button>
      </div>
    </header>
  );
}
