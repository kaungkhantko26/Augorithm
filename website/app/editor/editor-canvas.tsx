"use client";

import type { DiagramEdge, DiagramNode, NodeKind, Point } from "@/lib/augorithm-core";
import { edgeLabelPoint, edgePoints, pathFromPoints } from "@/lib/diagram-routing";

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 1400;

interface EditorCanvasProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedIds: string[];
  selectedEdgeId: string | null;
  runtimeNodeId: string | null;
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
}

export function EditorCanvas({
  nodes,
  edges,
  selectedIds,
  selectedEdgeId,
  runtimeNodeId,
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
}: EditorCanvasProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

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
      <div
        className="smart-canvas"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${zoom})`,
          "--editor-grid-size": `${gridSize}px`,
        } as React.CSSProperties}
        role="application"
        aria-label="Augorithm diagram canvas"
      >
        <svg className="editor-edge-layer" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} role="group" aria-label="Diagram connections">
          <defs>
            <marker id="editor-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;
            const points = edgePoints(edge, source, target);
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
                  style={{ strokeWidth: edge.strokeWidth ?? 2.25 }}
                  markerEnd={edge.arrow === "none" ? undefined : "url(#editor-arrow)"}
                />
                {edge.label && (
                  <g className="edge-label" transform={`translate(${middlePoint.x} ${middlePoint.y})`}>
                    <rect x="-5" y="-13" width={Math.max(38, edge.label.length * 7 + 10)} height="21" rx="10" />
                    <text x="2" y="2">{edge.label}</text>
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

        {nodes.map((node) => (
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
            <span className="node-kind-label">{node.kind}</span>
            <span className="node-main-label">{node.label}</span>
            {node.sourceLine && <small>L{node.sourceLine}</small>}
            {node.locked && <span className="node-lock" aria-hidden="true">⌑</span>}
            {connectionMode && <span className="node-port-hint" aria-hidden="true">＋</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
