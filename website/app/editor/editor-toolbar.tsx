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
  onPresentation: () => void;
}

export function EditorToolbar({
  projectName,
  canUndo,
  canRedo,
  running,
  runtimeMessage,
  theme,
  onRun,
  onStop,
  onReset,
  onStep,
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
  onPresentation,
}: EditorToolbarProps) {
  return (
    <header className="editor-topbar">
      <Link className="editor-brand" href="/" aria-label="Back to Augorithm home">
        <Image src="/augorithm-icon.png" alt="" width={34} height={34} priority unoptimized />
        <span><strong>AUGORITHM</strong></span>
      </Link>

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
        <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/⌘ Z)" aria-label="Undo">↶</button>
        <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/⌘ Shift Z)" aria-label="Redo">↷</button>
        <span className="header-runtime-state" role="status" aria-live="polite">{runtimeMessage}</span>
        <button className={running ? "stop-command" : "run-command"} type="button" onClick={running ? onStop : onRun}>{running ? "Pause" : "Run"}</button>
        <details className="export-menu tools-menu">
          <summary aria-label="More project actions">•••</summary>
          <div>
            <button type="button" onClick={onNew}>New project</button>
            <button type="button" onClick={onOpen}>Open project</button>
            <button type="button" onClick={onSave}>Save as…</button>
            <button type="button" onClick={onOpenCommands}>Command palette <kbd>⌘K</kbd></button>
            <button type="button" onClick={onBuild} disabled={running}>Build flowchart</button>
            <button type="button" onClick={onStep} disabled={running}>Step execution</button>
            <button type="button" onClick={onReset}>Reset runtime</button>
            <button type="button" onClick={onAutoLayout} disabled={running}>Auto layout</button>
            <button type="button" onClick={onImportPython}>Import Python</button>
            <button type="button" onClick={onExportSvg}>Export SVG</button>
            <button type="button" onClick={onExportPng}>Export PNG</button>
            <button type="button" onClick={onCopyDiagram}>Copy for slides</button>
            <button type="button" onClick={onExportJava}>Export Java</button>
            <button type="button" onClick={onExportNotes}>Export notes</button>
            <button type="button" onClick={onPresentation}>Presentation Mode</button>
            <button type="button" onClick={onToggleTheme}>{theme === "light" ? "Dark appearance" : "Light appearance"}</button>
            <button type="button" onClick={() => onConvert("all")}>Rebuild all views</button>
          </div>
        </details>
      </div>
    </header>
  );
}
