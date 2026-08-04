"use client";

import type { DiagramEdge, DiagramNode } from "@/lib/augorithm-core";

interface EditorInspectorProps {
  node: DiagramNode | null;
  edge: DiagramEdge | null;
  nodes: DiagramNode[];
  collapsed: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<DiagramNode>) => void;
  onUpdateEdge: (updates: Partial<DiagramEdge>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeleteEdge: () => void;
}

export function EditorInspector({
  node,
  edge,
  nodes,
  collapsed,
  onToggle,
  onUpdate,
  onUpdateEdge,
  onDuplicate,
  onDelete,
  onDeleteEdge,
}: EditorInspectorProps) {
  const ports = ["top", "right", "bottom", "left"] as const;
  return (
    <aside className={`editor-inspector ${collapsed ? "collapsed" : ""} ${node || edge ? "has-selection" : ""}`} aria-label="Properties inspector">
      <div className="panel-title">
        <button type="button" onClick={onToggle} aria-label={collapsed ? "Expand inspector" : "Collapse inspector"}>
          {collapsed ? "‹" : "›"}
        </button>
      </div>
      {!collapsed && (
        edge ? (
          <div className="inspector-content">
            <div className="selected-node-summary">
              <span className="palette-icon connection">↗</span>
              <div><strong>Connection</strong><small>{edge.id.slice(0, 16)}</small></div>
            </div>
            <label className="field-label">
              <span>Label</span>
              <input value={edge.label ?? ""} onChange={(event) => onUpdateEdge({ label: event.target.value })} placeholder="e.g. True, False, Next" />
            </label>
            <label className="field-label">
              <span>From shape</span>
              <select value={edge.source} onChange={(event) => onUpdateEdge({ source: event.target.value })}>
                {nodes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="field-label">
              <span>To shape</span>
              <select value={edge.target} onChange={(event) => onUpdateEdge({ target: event.target.value })}>
                {nodes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
            </label>
            <div className="field-grid">
              <label className="field-label">
                <span>Start port</span>
                <select value={edge.sourcePort ?? "bottom"} onChange={(event) => onUpdateEdge({ sourcePort: event.target.value as DiagramEdge["sourcePort"] })}>
                  {ports.map((port) => <option value={port} key={port}>{port}</option>)}
                </select>
              </label>
              <label className="field-label">
                <span>End port</span>
                <select value={edge.targetPort ?? "top"} onChange={(event) => onUpdateEdge({ targetPort: event.target.value as DiagramEdge["targetPort"] })}>
                  {ports.map((port) => <option value={port} key={port}>{port}</option>)}
                </select>
              </label>
              <label className="field-label">
                <span>Line weight</span>
                <input type="number" min="1" max="6" step=".25" value={edge.strokeWidth ?? 2.25} onChange={(event) => onUpdateEdge({ strokeWidth: Number(event.target.value) })} />
              </label>
              <label className="field-label">
                <span>Arrow</span>
                <select value={edge.arrow ?? "end"} onChange={(event) => onUpdateEdge({ arrow: event.target.value as DiagramEdge["arrow"] })}>
                  <option value="end">End</option>
                  <option value="none">None</option>
                </select>
              </label>
            </div>
            <div className="toggle-list">
              <label><input type="checkbox" checked={Boolean(edge.annotationOnly)} onChange={(event) => onUpdateEdge({ annotationOnly: event.target.checked })} /><span>Annotation-only connection</span></label>
            </div>
            <p className="inspector-help">Drag the blue routing handle on the canvas to bend this line. Reset restores automatic orthogonal routing.</p>
            <div className="inspector-actions">
              <button type="button" onClick={() => onUpdateEdge({ waypoints: undefined })}>Reset route</button>
              <button className="danger" type="button" onClick={onDeleteEdge}>Delete line</button>
            </div>
          </div>
        ) : node ? (
          <div className="inspector-content">
            <div className="selected-node-summary">
              <span className={`palette-icon ${node.kind}`}>{node.kind === "decision" ? "◇" : "□"}</span>
              <div><strong>{node.kind}</strong><small>{node.id.slice(0, 16)}</small></div>
            </div>
            <label className="field-label">
              <span>Text</span>
              <textarea value={node.label} onChange={(event) => onUpdate({ label: event.target.value })} rows={4} />
            </label>
            <div className="field-grid">
              <label className="field-label"><span>X</span><input type="number" value={Math.round(node.position.x)} onChange={(event) => onUpdate({ position: { ...node.position, x: Number(event.target.value) } })} /></label>
              <label className="field-label"><span>Y</span><input type="number" value={Math.round(node.position.y)} onChange={(event) => onUpdate({ position: { ...node.position, y: Number(event.target.value) } })} /></label>
              <label className="field-label"><span>Width</span><input type="number" min="120" value={node.width} onChange={(event) => onUpdate({ width: Number(event.target.value) })} /></label>
              <label className="field-label"><span>Height</span><input type="number" min="50" value={node.height} onChange={(event) => onUpdate({ height: Number(event.target.value) })} /></label>
            </div>
            <div className="inspector-section">
              <strong>Appearance</strong>
              <div className="color-fields">
                <label><span>Fill</span><input type="color" value={node.style.fill} onChange={(event) => onUpdate({ style: { ...node.style, fill: event.target.value } })} /></label>
                <label><span>Border</span><input type="color" value={node.style.stroke} onChange={(event) => onUpdate({ style: { ...node.style, stroke: event.target.value } })} /></label>
                <label><span>Text</span><input type="color" value={node.style.text} onChange={(event) => onUpdate({ style: { ...node.style, text: event.target.value } })} /></label>
              </div>
              <label className="field-label"><span>Font size</span><input type="range" min="11" max="24" value={node.style.fontSize} onChange={(event) => onUpdate({ style: { ...node.style, fontSize: Number(event.target.value) } })} /></label>
            </div>
            <div className="toggle-list">
              <label><input type="checkbox" checked={Boolean(node.locked)} onChange={(event) => onUpdate({ locked: event.target.checked })} /><span>Lock position</span></label>
              <label><input type="checkbox" checked={Boolean(node.breakpoint)} onChange={(event) => onUpdate({ breakpoint: event.target.checked })} /><span>Breakpoint</span></label>
            </div>
            <div className="inspector-actions">
              <button type="button" onClick={onDuplicate}>Duplicate</button>
              <button className="danger" type="button" onClick={onDelete}>Delete</button>
            </div>
          </div>
        ) : null
      )}
    </aside>
  );
}
