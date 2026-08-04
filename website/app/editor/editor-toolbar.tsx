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
  theme,
  onProjectNameChange,
  onNew,
  onOpen,
  onSave,
  onUndo,
  onRedo,
  onBuild,
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
        <div className="toolbar-group compact">
          <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/⌘ Z)" aria-label="Undo">↶</button>
          <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/⌘ Shift Z)" aria-label="Redo">↷</button>
        </div>
        {!studentMode && <div className="toolbar-group build-group"><button type="button" onClick={onBuild} disabled={running}>Build</button><button type="button" onClick={onAutoLayout} disabled={running}>Auto Layout</button></div>}
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
        <span className="save-indicator">Saved</span>
      </div>

      <div className="editor-top-actions">
        <button type="button" onClick={onOpenCommands} title="Command palette (Ctrl/⌘ K)" aria-label="Open command palette">⌘K</button>
        {!studentMode && <details className="export-menu">
          <summary>Export</summary>
          <div>
            <button type="button" onClick={onExportSvg}>SVG diagram</button>
            <button type="button" onClick={onExportPng}>PNG image</button>
            <button type="button" onClick={onCopyDiagram}>Copy for slides</button>
            <button type="button" onClick={onExportJava}>Java file</button>
            <button type="button" onClick={onExportNotes}>Notes Markdown</button>
          </div>
        </details>}
        <details className="export-menu tools-menu">
          <summary>Tools</summary>
          <div>
            <button type="button" onClick={onToggleStudentMode}>{studentMode ? "Switch to Teacher Mode" : "Switch to Student Mode"}</button>
            <button type="button" onClick={onPresentation}>Presentation Mode</button>
            <button type="button" onClick={onToggleTheme}>{theme === "light" ? "Dark appearance" : "Light appearance"}</button>
            {!studentMode && <><button type="button" onClick={() => onConvert("all")}>Rebuild all views</button><button type="button" onClick={onImportPython}>Import Python</button></>}
          </div>
        </details>
      </div>
    </header>
  );
}
