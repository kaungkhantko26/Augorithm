"use client";

import { useId } from "react";
import type { DiagramEdge, DiagramNode, NodeKind, Point } from "@/lib/augorithm-core";
import { CONNECTOR_STROKE_WIDTH, edgeLabelPoint, edgePoints, pathFromPoints } from "@/lib/diagram-routing";

const MIN_CANVAS_WIDTH = 1800;
const MIN_CANVAS_HEIGHT = 1400;

const NODE_ICONS: Record<NodeKind, string> = {
  start: "▶",
  end: "■",
  process: "=",
  decision: "◇",
  input: "↙",
  output: "↗",
  loop: "↻",
  comment: "≡",
  note: "≡",
  entity: "▤",
  class: "▦",
  usecase: "○",
};

interface EditorCanvasProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedIds: string[];
  selectedEdgeId: string | null;
  runtimeNodeId: string | null;
  activeEdgeId: string | null;
  connectionMode: boolean;
  connectionSourceId: string | null;
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  onSelect: (id: string, additive: boolean) => void;
  onSelectEdge: (id: string) => void;
  onClearSelection: () => void;
  onMoveNode: (id: string, point: Point, commit: boolean) => void;
  onMoveEdgeWaypoint: (id: string, index: number, point: Point, commit: boolean, seed: Point[]) => void;
  onAddNode: (kind: NodeKind, point: Point) => void;
  onEditNode: (id: string) => void;
  onConnectNode: (id: string) => void;
  onNewFlowchart: () => void;
  onOpenExample: () => void;
  onImportPython: () => void;
}

export function EditorCanvas({
  nodes,
  edges,
  selectedIds,
  selectedEdgeId,
  runtimeNodeId,
  activeEdgeId,
  connectionMode,
  connectionSourceId,
  zoom,
  snapToGrid,
  gridSize,
  onSelect,
  onSelectEdge,
  onClearSelection,
  onMoveNode,
  onMoveEdgeWaypoint,
  onAddNode,
  onEditNode,
  onConnectNode,
  onNewFlowchart,
  onOpenExample,
  onImportPython,
}: EditorCanvasProps) {
  const markerId = `editor-arrow-${useId().replace(/:/g, "")}`;
  const displayNodes = nodes.map((node) => {
    const longestLine = node.label.split("\n").reduce((longest, line) => Math.max(longest, line.length), 0);
    const contentWidth = Math.min(420, Math.max(184, longestLine * 8.1 + 64));
    const lineCount = node.label.split("\n").reduce((count, line) => count + Math.max(1, Math.ceil(line.length / 38)), 0);
    return {
      ...node,
      width: Math.max(node.width, node.kind === "start" || node.kind === "end" ? 184 : contentWidth),
      height: Math.max(node.height, 72 + Math.max(0, lineCount - 1) * 20),
    };
  });
  const nodeMap = new Map(displayNodes.map((node) => [node.id, node]));
  const routedEdges = edges.map((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    return { edge, source, target, points: source && target ? edgePoints(edge, source, target, displayNodes) : [] };
  });
  const allPoints = routedEdges.flatMap(({ points }) => points);
  const canvasWidth = Math.max(
    MIN_CANVAS_WIDTH,
    Math.ceil(Math.max(0, ...displayNodes.map((node) => node.position.x + node.width), ...allPoints.map((point) => point.x)) + 320),
  );
  const canvasHeight = Math.max(
    MIN_CANVAS_HEIGHT,
    Math.ceil(Math.max(0, ...displayNodes.map((node) => node.position.y + node.height), ...allPoints.map((point) => point.y)) + 240),
  );

  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>, node: DiagramNode) => {
    if (connectionMode) {
      event.stopPropagation();
      onConnectNode(node.id);
      return;
    }
    if (node.locked || event.button !== 0) return;
    event.stopPropagation();
    onSelect(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
    const start = { x: event.clientX, y: event.clientY };
    const origin = { ...node.position };
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const move = (pointerEvent: PointerEvent) => {
      const next = {
        x: origin.x + (pointerEvent.clientX - start.x) / zoom,
        y: origin.y + (pointerEvent.clientY - start.y) / zoom,
      };
      if (snapToGrid) {
        next.x = Math.round(next.x / gridSize) * gridSize;
        next.y = Math.round(next.y / gridSize) * gridSize;
      }
      onMoveNode(node.id, next, false);
    };
    const finish = (pointerEvent: PointerEvent) => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      const next = {
        x: origin.x + (pointerEvent.clientX - start.x) / zoom,
        y: origin.y + (pointerEvent.clientY - start.y) / zoom,
      };
      if (snapToGrid) {
        next.x = Math.round(next.x / gridSize) * gridSize;
        next.y = Math.round(next.y / gridSize) * gridSize;
      }
      onMoveNode(node.id, next, true);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
  };

  const beginWaypointDrag = (
    event: React.PointerEvent<SVGCircleElement>,
    edge: DiagramEdge,
    index: number,
    point: Point,
    seed: Point[],
  ) => {
    event.stopPropagation();
    const start = { x: event.clientX, y: event.clientY };
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (pointerEvent: PointerEvent) => {
      const next = {
        x: point.x + (pointerEvent.clientX - start.x) / zoom,
        y: point.y + (pointerEvent.clientY - start.y) / zoom,
      };
      onMoveEdgeWaypoint(edge.id, index, next, false, seed);
    };
    const finish = (pointerEvent: PointerEvent) => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", finish);
      target.removeEventListener("pointercancel", finish);
      const next = {
        x: point.x + (pointerEvent.clientX - start.x) / zoom,
        y: point.y + (pointerEvent.clientY - start.y) / zoom,
      };
      onMoveEdgeWaypoint(edge.id, index, next, true, seed);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", finish);
    target.addEventListener("pointercancel", finish);
  };

  return (
    <div
      className={`smart-canvas-viewport ${connectionMode ? "connection-mode" : ""}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClearSelection();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const kind = event.dataTransfer.getData("application/x-augorithm-node") as NodeKind;
        if (!kind) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        onAddNode(kind, {
          x: (event.clientX - bounds.left + event.currentTarget.scrollLeft) / zoom,
          y: (event.clientY - bounds.top + event.currentTarget.scrollTop) / zoom,
        });
      }}
    >
      {nodes.length === 0 && (
        <div className="canvas-empty-state" role="region" aria-label="Empty flowchart">
          <h2>Start your algorithm</h2>
          <p>Drag a shape here<br />or press <kbd>/</kbd></p>
          <div className="empty-actions"><button type="button" onClick={onNewFlowchart}>New Flowchart</button><button type="button" onClick={onOpenExample}>Open Example</button><button type="button" onClick={onImportPython}>Import Python</button></div>
        </div>
      )}
      <div
        className="smart-canvas"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `scale(${zoom})`,
          "--editor-grid-size": `${gridSize}px`,
        } as React.CSSProperties}
        role="application"
        aria-label="Augorithm diagram canvas"
      >
        <svg className="editor-edge-layer" width={canvasWidth} height={canvasHeight} role="group" aria-label="Diagram connections">
          <defs>
            <marker id={markerId} markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 7 7">
              <path d="M 0 0 L 7 3.5 L 0 7 Z" />
            </marker>
          </defs>
          {routedEdges.map(({ edge, source, target, points }) => {
            if (!source || !target) return null;
            const path = pathFromPoints(points);
            const middlePoint = edgeLabelPoint(points);
            const selected = edge.id === selectedEdgeId;
            const editableWaypoints = edge.waypoints?.length ? edge.waypoints : [middlePoint];
            return (
              <g
                key={edge.id}
                className={[
                  "editor-edge",
                  edge.annotationOnly ? "annotation-edge" : "",
                  selected ? "selected" : "",
                  edge.id === activeEdgeId ? "runtime-edge-active" : "",
                ].filter(Boolean).join(" ")}
              >
                <title>{edge.label ? `${edge.label} connection` : "Connection"}</title>
                <path className="edge-hit-area" d={path} onPointerDown={(event) => {
                  event.stopPropagation();
                  onSelectEdge(edge.id);
                }} />
                <path
                  className="edge-visible"
                  d={path}
                  style={{ strokeWidth: CONNECTOR_STROKE_WIDTH }}
                  markerEnd={edge.arrow === "none" ? undefined : `url(#${markerId})`}
                />
                {edge.label && (
                  <g className="edge-label" transform={`translate(${middlePoint.x} ${middlePoint.y})`}>
                    <rect x={-(Math.max(48, edge.label.length * 7.5 + 22) / 2)} y="-15" width={Math.max(48, edge.label.length * 7.5 + 22)} height="28" rx="14" />
                    <text x="0" y="4" textAnchor="middle">{edge.label}</text>
                  </g>
                )}
                {selected && editableWaypoints.map((point, index) => (
                  <circle
                    className="edge-waypoint"
                    key={`${edge.id}-waypoint-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="7"
                    onPointerDown={(event) => beginWaypointDrag(event, edge, index, point, editableWaypoints)}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {displayNodes.map((node) => (
          <button
            type="button"
            key={node.id}
            className={[
              "canvas-node",
              `kind-${node.kind}`,
              selectedIds.includes(node.id) ? "selected" : "",
              runtimeNodeId === node.id ? "runtime-active" : "",
              node.locked ? "locked" : "",
              connectionSourceId === node.id ? "connection-source" : "",
            ].filter(Boolean).join(" ")}
            style={{
              left: node.position.x,
              top: node.position.y,
              width: node.width,
              minHeight: node.height,
              "--node-fill": node.style.fill,
              "--node-stroke": node.style.stroke,
              background: node.style.fill,
              borderColor: node.style.stroke,
              color: node.style.text,
              fontSize: node.style.fontSize,
            } as React.CSSProperties}
            aria-label={`${node.kind}: ${node.label}${node.locked ? ", locked" : ""}`}
            aria-pressed={selectedIds.includes(node.id)}
            onPointerDown={(event) => beginDrag(event, node)}
            onDoubleClick={() => onEditNode(node.id)}
          >
            {node.breakpoint && <span className="breakpoint-dot" title="Breakpoint" />}
            <span className="node-semantic-icon" aria-hidden="true">{NODE_ICONS[node.kind]}</span>
            <span className="node-card-content">
              <span className="node-kind-label">{node.kind}</span>
              <span className="node-main-label">{node.label}</span>
            </span>
            {node.sourceLine && <small>L{node.sourceLine}</small>}
            {node.locked && <span className="node-lock" aria-hidden="true">⌑</span>}
            {connectionMode && <span className="node-port-hint" aria-hidden="true">＋</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
