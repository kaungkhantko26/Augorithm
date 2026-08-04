import type { DiagramEdge, DiagramNode, Point } from "./augorithm-core";

export type DiagramPort = NonNullable<DiagramEdge["sourcePort"]>;

export const CONNECTOR_STUB = 24;
export const CONNECTOR_CLEARANCE = 18;
export const SELF_LOOP_OFFSET = 56;
export const CONNECTOR_STROKE_WIDTH = 1.25;
export const ARROW_TARGET_GAP = 2;
export const ARROWHEAD_LENGTH = 7;

const PORTS: DiagramPort[] = ["top", "right", "bottom", "left"];

export function isDiagramPort(value: unknown): value is DiagramPort {
  return typeof value === "string" && PORTS.includes(value as DiagramPort);
}

/** Stable anchors derived from the same bounds used to render each node. */
export function portPoint(node: DiagramNode, port: DiagramPort): Point {
  const inset = node.kind === "input" || node.kind === "output" ? node.width * .045 : 0;
  if (port === "top") return { x: node.position.x + node.width / 2, y: node.position.y };
  if (port === "right") return { x: node.position.x + node.width - inset, y: node.position.y + node.height / 2 };
  if (port === "left") return { x: node.position.x + inset, y: node.position.y + node.height / 2 };
  return { x: node.position.x + node.width / 2, y: node.position.y + node.height };
}

function offsetFromPort(point: Point, port: DiagramPort, distance: number): Point {
  if (port === "top") return { x: point.x, y: point.y - distance };
  if (port === "bottom") return { x: point.x, y: point.y + distance };
  if (port === "left") return { x: point.x - distance, y: point.y };
  return { x: point.x + distance, y: point.y };
}

function compact(points: Point[]): Point[] {
  const unique = points.filter((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
  return unique.filter((point, index) => {
    if (index === 0 || index === unique.length - 1) return true;
    const previous = unique[index - 1];
    const next = unique[index + 1];
    return !((previous.x === point.x && point.x === next.x) || (previous.y === point.y && point.y === next.y));
  });
}

function orthogonalize(points: Point[]): Point[] {
  const result: Point[] = [];
  points.forEach((point) => {
    const previous = result.at(-1);
    if (previous && previous.x !== point.x && previous.y !== point.y) result.push({ x: point.x, y: previous.y });
    if (!result.length || result.at(-1)?.x !== point.x || result.at(-1)?.y !== point.y) result.push(point);
  });
  return compact(result);
}

export function automaticPorts(source: DiagramNode, target: DiagramNode): { source: DiagramPort; target: DiagramPort } {
  const dx = target.position.x + target.width / 2 - (source.position.x + source.width / 2);
  const dy = target.position.y + target.height / 2 - (source.position.y + source.height / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? { source: "right", target: "left" } : { source: "left", target: "right" };
  return dy >= 0 ? { source: "bottom", target: "top" } : { source: "top", target: "bottom" };
}

function intersectsNode(a: Point, b: Point, node: DiagramNode): boolean {
  const left = node.position.x - CONNECTOR_CLEARANCE;
  const right = node.position.x + node.width + CONNECTOR_CLEARANCE;
  const top = node.position.y - CONNECTOR_CLEARANCE;
  const bottom = node.position.y + node.height + CONNECTOR_CLEARANCE;
  if (a.x === b.x) return a.x > left && a.x < right && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom;
  if (a.y === b.y) return a.y > top && a.y < bottom && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right;
  return false;
}

function routeHitsNodes(points: Point[], obstacles: DiagramNode[], sourceId: string, targetId: string): boolean {
  return points.some((point, index) => index > 0 && obstacles.some((node) =>
    node.id !== sourceId && node.id !== targetId && intersectsNode(points[index - 1], point, node)));
}

function selfLoop(node: DiagramNode, sourcePort: DiagramPort, targetPort: DiagramPort): Point[] {
  const start = portPoint(node, sourcePort);
  const target = offsetFromPort(portPoint(node, targetPort), targetPort, ARROW_TARGET_GAP);
  const right = node.position.x + node.width + SELF_LOOP_OFFSET;
  const top = node.position.y - SELF_LOOP_OFFSET;
  return compact([start, offsetFromPort(start, sourcePort, CONNECTOR_STUB), { x: right, y: start.y }, { x: right, y: top }, { x: target.x, y: top }, target]);
}

function isLoopBody(edge: DiagramEdge, source: DiagramNode): boolean {
  return source.kind === "loop" && /^(?:true|next|body)$/i.test(edge.label ?? "");
}

function isLoopDone(edge: DiagramEdge, source: DiagramNode): boolean {
  return source.kind === "loop" && /^(?:false|done)$/i.test(edge.label ?? "");
}

function isLoopFeedback(source: DiagramNode, target: DiagramNode): boolean {
  return target.kind === "loop" && source.id !== target.id && source.position.y >= target.position.y + target.height;
}

/** Deterministic, obstacle-aware orthogonal route. Manual waypoints remain authoritative. */
export function edgePoints(edge: DiagramEdge, source: DiagramNode, target: DiagramNode, nodes: DiagramNode[] = []): Point[] {
  const automatic = automaticPorts(source, target);
  const sourcePort = isDiagramPort(edge.sourcePort) ? edge.sourcePort
    : isLoopBody(edge, source) ? "right"
      : isLoopDone(edge, source) ? "bottom"
        : automatic.source;
  const targetPort = isDiagramPort(edge.targetPort) ? edge.targetPort
    : isLoopFeedback(source, target) ? "bottom"
      : isLoopBody(edge, source) ? "top"
      : automatic.target;
  if (source.id === target.id) return selfLoop(source, sourcePort, targetPort);

  const start = isLoopDone(edge, source)
    ? { x: source.position.x + source.width * .24, y: source.position.y + source.height }
    : portPoint(source, sourcePort);
  const targetAnchor = isLoopFeedback(source, target)
    ? { x: target.position.x + target.width * .68, y: target.position.y + target.height }
    : portPoint(target, targetPort);
  const end = offsetFromPort(targetAnchor, targetPort, ARROW_TARGET_GAP);
  const startStub = offsetFromPort(start, sourcePort, CONNECTOR_STUB);
  const endStub = offsetFromPort(end, targetPort, CONNECTOR_STUB + ARROWHEAD_LENGTH);

  if (edge.waypoints?.length) return orthogonalize([start, startStub, ...edge.waypoints, endStub, end]);

  if (isLoopFeedback(source, target)) {
    const laneX = Math.max(source.position.x + source.width, target.position.x + target.width) + SELF_LOOP_OFFSET;
    return compact([start, startStub, { x: laneX, y: startStub.y }, { x: laneX, y: endStub.y }, endStub, end]);
  }

  if (isLoopBody(edge, source)) {
    const laneX = Math.max(startStub.x, endStub.x) + CONNECTOR_CLEARANCE;
    return compact([start, startStub, { x: laneX, y: startStub.y }, { x: laneX, y: endStub.y }, endStub, end]);
  }

  if (isLoopDone(edge, source)) {
    const laneY = startStub.y + Math.max(42, (endStub.y - startStub.y) / 2);
    return compact([start, startStub, { x: startStub.x, y: laneY }, { x: endStub.x, y: laneY }, endStub, end]);
  }

  const horizontalFirst = compact([start, startStub, { x: endStub.x, y: startStub.y }, endStub, end]);
  const verticalFirst = compact([start, startStub, { x: startStub.x, y: endStub.y }, endStub, end]);
  const candidates = sourcePort === "left" || sourcePort === "right"
    ? [horizontalFirst, verticalFirst]
    : [verticalFirst, horizontalFirst];
  const clear = candidates.find((points) => !routeHitsNodes(points, nodes, source.id, target.id));
  if (clear) return clear;

  const bounds = nodes.length ? nodes : [source, target];
  const rightLane = Math.max(...bounds.map((node) => node.position.x + node.width)) + SELF_LOOP_OFFSET;
  const leftLane = Math.min(...bounds.map((node) => node.position.x)) - SELF_LOOP_OFFSET;
  const laneX = Math.abs(start.x - rightLane) + Math.abs(end.x - rightLane) <= Math.abs(start.x - leftLane) + Math.abs(end.x - leftLane)
    ? rightLane : leftLane;
  return compact([start, startStub, { x: laneX, y: startStub.y }, { x: laneX, y: endStub.y }, endStub, end]);
}

/** Rounded orthogonal SVG path with stable geometry. */
export function pathFromPoints(points: Point[], radius = 9): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    if (!next) { path += ` L ${point.x} ${point.y}`; continue; }
    const previous = points[index - 1];
    const incoming = Math.hypot(point.x - previous.x, point.y - previous.y);
    const outgoing = Math.hypot(next.x - point.x, next.y - point.y);
    const r = Math.min(radius, incoming / 2, outgoing / 2);
    const before = { x: point.x + Math.sign(previous.x - point.x) * r, y: point.y + Math.sign(previous.y - point.y) * r };
    const after = { x: point.x + Math.sign(next.x - point.x) * r, y: point.y + Math.sign(next.y - point.y) * r };
    path += ` L ${before.x} ${before.y} Q ${point.x} ${point.y} ${after.x} ${after.y}`;
  }
  return path;
}

export function edgeLabelPoint(points: Point[]): Point {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const segments = points.slice(1).map((end, index) => ({ start: points[index], end, length: Math.hypot(end.x - points[index].x, end.y - points[index].y) }));
  const segment = segments.sort((a, b) => b.length - a.length)[0];
  const horizontal = Math.abs(segment.end.x - segment.start.x) >= Math.abs(segment.end.y - segment.start.y);
  return { x: (segment.start.x + segment.end.x) / 2 + (horizontal ? 0 : 18), y: (segment.start.y + segment.end.y) / 2 + (horizontal ? -15 : 0) };
}
