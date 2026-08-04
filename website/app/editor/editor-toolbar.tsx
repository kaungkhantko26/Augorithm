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
  runtimeStatus,
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
        <span className={`header-runtime-state status-${runtimeStatus}`} role="status" aria-live="polite"><i aria-hidden="true" />{runtimeMessage}</span>
        <button className={running ? "stop-command" : "run-command"} type="button" onClick={running ? onStop : onRun}>{running ? "Pause" : "Run"}</button>
        <details className="export-menu quick-export">
          <summary>Export</summary>
          <div>
            <button type="button" onClick={onExportPng}>PNG image</button>
            <button type="button" onClick={onExportSvg}>SVG vector</button>
            <button type="button" onClick={onExportJava}>Java source</button>
            <button type="button" onClick={onExportNotes}>Learning notes</button>
          </div>
        </details>
        <details className="export-menu tools-menu">
          <summary aria-label="More project actions">•••</summary>
          <div className="overflow-sections">
            <section><h3>Project</h3>
            <button type="button" onClick={onNew}>New project</button>
            <button type="button" onClick={onOpen}>Open project</button>
            <button type="button" onClick={onSave}>Save as…</button>
            </section>
            <section><h3>Build</h3>
            <button type="button" onClick={onBuild} disabled={running}>Build flowchart</button>
            <button type="button" onClick={onAutoLayout} disabled={running}>Auto layout</button>
            <button type="button" onClick={() => onConvert("all")}>Rebuild all views</button>
            </section>
            <section><h3>Runtime</h3>
            <button type="button" onClick={onStep} disabled={running}>Step execution</button>
            <button type="button" onClick={onReset}>Reset runtime</button>
            </section>
            <section><h3>Import</h3><button type="button" onClick={onImportPython}>Python file</button></section>
            <section><h3>Export</h3>
            <button type="button" onClick={onExportSvg}>Export SVG</button>
            <button type="button" onClick={onExportPng}>Export PNG</button>
            <button type="button" onClick={onExportJava}>Export Java</button>
            <button type="button" onClick={onExportNotes}>Export notes</button>
            </section>
            <section><h3>View</h3>
            <button type="button" onClick={onPresentation}>Presentation Mode</button>
            <button type="button" onClick={onToggleTheme}>{theme === "light" ? "Dark appearance" : "Light appearance"}</button>
            <button type="button" onClick={onCopyDiagram}>Copy for slides</button>
            </section>
            <section><h3>Settings</h3><button type="button" onClick={onOpenCommands}>Keyboard shortcuts <kbd>⌘K</kbd></button></section>
          </div>
        </details>
      </div>
    </header>
  );
}
