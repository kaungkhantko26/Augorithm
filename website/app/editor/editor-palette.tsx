"use client";

import type { EditorMode, NodeKind } from "@/lib/augorithm-core";

interface PaletteItem {
  kind: NodeKind;
  label: string;
  icon: string;
  modes: EditorMode[];
  description: string;
  keywords: string;
  group: "Basic" | "Logic" | "Annotation" | "Models";
}

const paletteItems: PaletteItem[] = [
  { kind: "input", label: "Input", icon: "↳", modes: ["algorithm"], description: "Read a value from the user", keywords: "read keyboard ask", group: "Basic" },
  { kind: "output", label: "Output", icon: "↗", modes: ["algorithm"], description: "Display a result", keywords: "print display show", group: "Basic" },
  { kind: "process", label: "Process", icon: "ƒ", modes: ["algorithm"], description: "Calculate or assign a value", keywords: "set calculate assignment", group: "Basic" },
  { kind: "decision", label: "Decision", icon: "◇", modes: ["algorithm"], description: "Choose between two paths", keywords: "if condition branch", group: "Logic" },
  { kind: "loop", label: "Loop", icon: "↻", modes: ["algorithm"], description: "Repeat a group of steps", keywords: "for while repeat", group: "Logic" },
  { kind: "comment", label: "Comment", icon: "≡", modes: ["algorithm", "erd", "uml"], description: "Explain part of your work", keywords: "annotation explanation", group: "Annotation" },
  { kind: "entity", label: "ERD Entity", icon: "▦", modes: ["erd"], description: "Describe stored data", keywords: "database table", group: "Models" },
  { kind: "class", label: "UML Class", icon: "▤", modes: ["uml"], description: "Model an object type", keywords: "object model", group: "Models" },
  { kind: "usecase", label: "Use Case", icon: "○", modes: ["uml"], description: "Describe a user goal", keywords: "actor scenario", group: "Models" },
  { kind: "note", label: "Note", icon: "▱", modes: ["algorithm", "erd", "uml"], description: "Add a visual reminder", keywords: "memo annotation", group: "Annotation" },
];

interface EditorPaletteProps {
  mode: EditorMode;
  search: string;
  collapsed: boolean;
  onModeChange: (mode: EditorMode) => void;
  onSearchChange: (value: string) => void;
  onAddNode: (kind: NodeKind) => void;
  onToggle: () => void;
}

export function EditorPalette({
  mode,
  search,
  collapsed,
  onModeChange,
  onSearchChange,
  onAddNode,
  onToggle,
}: EditorPaletteProps) {
  const visibleItems = paletteItems.filter(
    (item) => item.modes.includes(mode) && `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(search.toLowerCase()),
  );
  const groups = [...new Set(visibleItems.map((item) => item.group))];

  return (
    <aside className={`editor-palette ${collapsed ? "collapsed" : ""}`} aria-label="Shape library">
      <div className="panel-title">
        {!collapsed && <span>LIBRARY</span>}
        <button type="button" onClick={onToggle} aria-label={collapsed ? "Expand library" : "Collapse library"}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="mode-switcher" role="tablist" aria-label="Diagram mode">
            {(["algorithm", "erd", "uml"] as EditorMode[]).map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={mode === item}
                className={mode === item ? "active" : ""}
                onClick={() => onModeChange(item)}
                key={item}
              >
                {item === "algorithm" ? "Algorithms" : item.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="palette-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search shapes..."
              aria-label="Search shapes or commands"
            />
          </label>
          <div className="palette-list">
            {groups.map((group) => <section className="palette-group" key={group}>
              <h3>{group}</h3>
              {visibleItems.filter((item) => item.group === group).map((item) => (
              <button
                type="button"
                className="palette-item"
                onClick={() => onAddNode(item.kind)}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("application/x-augorithm-node", item.kind)}
                key={item.kind}
              >
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </button>
              ))}
            </section>)}
          </div>
          <div className="palette-help">
            <strong>Tip</strong>
            <span>Drag a card to the canvas, click to add, or press / for Quick Insert.</span>
          </div>
        </>
      )}
    </aside>
  );
}
