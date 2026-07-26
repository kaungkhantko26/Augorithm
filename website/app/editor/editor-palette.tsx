"use client";

import type { EditorMode, NodeKind } from "@/lib/augorithm-core";

interface PaletteItem {
  kind: NodeKind;
  label: string;
  icon: string;
  modes: EditorMode[];
}

const paletteItems: PaletteItem[] = [
  { kind: "input", label: "Input", icon: "⌨", modes: ["algorithm"] },
  { kind: "output", label: "Output", icon: "▰", modes: ["algorithm"] },
  { kind: "process", label: "Process", icon: "=", modes: ["algorithm"] },
  { kind: "decision", label: "Decision", icon: "◇", modes: ["algorithm"] },
  { kind: "loop", label: "Loop", icon: "↻", modes: ["algorithm"] },
  { kind: "comment", label: "Comment", icon: "≡", modes: ["algorithm", "erd", "uml"] },
  { kind: "entity", label: "ERD Entity", icon: "▦", modes: ["erd"] },
  { kind: "class", label: "UML Class", icon: "▤", modes: ["uml"] },
  { kind: "usecase", label: "Use Case", icon: "◯", modes: ["uml"] },
  { kind: "note", label: "Note", icon: "▱", modes: ["algorithm", "erd", "uml"] },
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
    (item) => item.modes.includes(mode) && item.label.toLowerCase().includes(search.toLowerCase()),
  );

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
                {item === "algorithm" ? "Flow" : item.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="palette-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search shapes"
              aria-label="Search shapes"
            />
          </label>
          <div className="palette-list">
            {visibleItems.map((item) => (
              <button
                type="button"
                className="palette-item"
                onClick={() => onAddNode(item.kind)}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("application/x-augorithm-node", item.kind)}
                key={item.kind}
              >
                <span className={`palette-icon ${item.kind}`}>{item.icon}</span>
                <span>{item.label}</span>
                <kbd>＋</kbd>
              </button>
            ))}
          </div>
          <div className="palette-help">
            <strong>Tip</strong>
            <span>Drag shapes to the canvas or click ＋. Algorithm connectors stay executable.</span>
          </div>
        </>
      )}
    </aside>
  );
}
