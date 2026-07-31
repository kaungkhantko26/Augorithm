"use client";

import Link from "next/link";
import Image from "next/image";

interface EditorToolbarProps {
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  running: boolean;
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
  onStep: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopyDiagram: () => void;
  onAutoLayout: () => void;
  onToggleTheme: () => void;
  onOpenCommands: () => void;
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
  onRun,
  onStop,
  onStep,
  onExportSvg,
  onExportPng,
  onCopyDiagram,
  onAutoLayout,
  onToggleTheme,
  onOpenCommands,
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
        <div className="toolbar-group">
          <button type="button" onClick={onBuild} disabled={running} title="Build from pseudocode">Build</button>
          <button type="button" onClick={onAutoLayout} disabled={running} title="Restore automatic layout">Auto layout</button>
          <button type="button" onClick={onStep} disabled={running} title="Step through the current algorithm">Step</button>
          {running ? (
            <button className="run-command stop-command" type="button" onClick={onStop} title="Stop execution">
              ■ Stop
            </button>
          ) : (
            <button className="run-command" type="button" onClick={onRun} title="Run algorithm (⌘R)">
              ▶ Run
            </button>
          )}
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
        <button type="button" onClick={onOpenCommands} title="Command palette (Ctrl/⌘ K)" aria-label="Open command palette">⌘K</button>
        <details className="export-menu">
          <summary>Export</summary>
          <div>
            <button type="button" onClick={onExportSvg}>SVG diagram</button>
            <button type="button" onClick={onExportPng}>PNG image</button>
            <button type="button" onClick={onCopyDiagram}>Copy for slides</button>
          </div>
        </details>
        <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
          {theme === "light" ? "◐" : "☀"}
        </button>
      </div>
    </header>
  );
}
