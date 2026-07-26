import type { DiagramEdge, DiagramNode, Point } from "./augorithm-core";

type Port = NonNullable<DiagramEdge["sourcePort"]>;

function portPoint(node: DiagramNode, port: Port): Point {
  if (port === "top") return { x: node.position.x + node.width / 2, y: node.position.y };
  // Input/output nodes are parallelograms. Their visible side at mid-height is
  // inset from the rectangular DOM box, so routing to the box edge leaves a
  // noticeable gap between the arrowhead and the shape.
  const sideInset = node.kind === "input" || node.kind === "output"
    ? node.width * 0.045
    : 0;
  if (port === "right") {
    return {
      x: node.position.x + node.width - sideInset,
      y: node.position.y + node.height / 2,
    };
  }
  if (port === "left") {
    return {
      x: node.position.x + sideInset,
      y: node.position.y + node.height / 2,
    };
  }
  return { x: node.position.x + node.width / 2, y: node.position.y + node.height };
}

function offsetFromPort(point: Point, port: Port, distance: number): Point {
  if (port === "top") return { x: point.x, y: point.y - distance };
  if (port === "bottom") return { x: point.x, y: point.y + distance };
  if (port === "left") return { x: point.x - distance, y: point.y };
  return { x: point.x + distance, y: point.y };
}

function orthogonalize(points: Point[]): Point[] {
  const result: Point[] = [];
  points.forEach((point) => {
    const previous = result.at(-1);
    if (!previous) {
      result.push(point);
      return;
    }
    if (previous.x !== point.x && previous.y !== point.y) {
      result.push({ x: point.x, y: previous.y });
    }
    if (result.at(-1)?.x !== point.x || result.at(-1)?.y !== point.y) {
      result.push(point);
    }
  });
  return result;
}

function automaticPorts(source: DiagramNode, target: DiagramNode): { source: Port; target: Port } {
  const sourceCenter = {
    x: source.position.x + source.width / 2,
    y: source.position.y + source.height / 2,
  };
  const targetCenter = {
    x: target.position.x + target.width / 2,
    y: target.position.y + target.height / 2,
  };
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX >= 0 ? { source: "right", target: "left" } : { source: "left", target: "right" };
  }
  return deltaY >= 0 ? { source: "bottom", target: "top" } : { source: "top", target: "bottom" };
}

function isLoopContinue(edge: DiagramEdge, source: DiagramNode): boolean {
  return source.kind === "loop" && /^(?:true|next)$/i.test(edge.label ?? "");
}

function isLoopExit(edge: DiagramEdge, source: DiagramNode): boolean {
  return source.kind === "loop" && /^(?:false|done)$/i.test(edge.label ?? "");
}

function isLoopFeedback(source: DiagramNode, target: DiagramNode): boolean {
  // A loop has two kinds of incoming edges: the normal entry from the symbol
  // above it and the feedback edge from the last symbol in its body. Treating
  // every incoming edge as feedback sent normal entry lines around the outside
  // lane and produced the apparently disconnected arrows seen in exports.
  return target.kind === "loop"
    && source.id !== target.id
    && source.position.y >= target.position.y + target.height;
}

function loopBottomPoint(node: DiagramNode, lane: "exit" | "feedback"): Point {
  return {
    x: node.position.x + node.width * (lane === "exit" ? 0.24 : 0.68),
    y: node.position.y + node.height,
  };
}

export function edgePoints(edge: DiagramEdge, source: DiagramNode, target: DiagramNode): Point[] {
  if (edge.waypoints?.length) {
    const automatic = automaticPorts(source, target);
    const sourcePort = edge.sourcePort ?? automatic.source;
    const targetPort = edge.targetPort ?? automatic.target;
    const start = portPoint(source, sourcePort);
    const end = portPoint(target, targetPort);
    return orthogonalize([
      start,
      offsetFromPort(start, sourcePort, 20),
      ...edge.waypoints,
      offsetFromPort(end, targetPort, 20),
      end,
    ]);
  }

  // Loop feedback always returns through an outside lane and enters through the
  // bottom port. It can therefore never share a lane with the forward branch.
  if (isLoopFeedback(source, target)) {
    const start = portPoint(source, edge.sourcePort ?? "bottom");
    const end = edge.targetPort
      ? portPoint(target, edge.targetPort)
      : loopBottomPoint(target, "feedback");
    const laneX = Math.max(
      source.position.x + source.width,
      target.position.x + target.width,
    ) + 72;
    const departureY = Math.max(start.y + 44, source.position.y + source.height + 44);
    const approachY = end.y + 46;
    return [
      start,
      { x: start.x, y: departureY },
      { x: laneX, y: departureY },
      { x: laneX, y: approachY },
      { x: end.x, y: approachY },
      end,
    ];
  }

  // The body branch leaves a loop from the right. The end arrow points into
  // the body node from its left side, while the feedback arrow uses the lane
  // above. This removes the opposing arrows visible in the previous layout.
  if (isLoopContinue(edge, source)) {
    const start = portPoint(source, edge.sourcePort ?? "right");
    const targetPort: Port = edge.targetPort ?? "top";
    const end = portPoint(target, targetPort);
    if (Math.abs(start.y - end.y) < 1) return [start, end];
    const laneX = Math.max(start.x + 52, end.x);
    return [start, { x: laneX, y: start.y }, { x: laneX, y: end.y }, end];
  }

  // Done/False leaves through the bottom, clearly separated from the body.
  if (isLoopExit(edge, source)) {
    const start = edge.sourcePort
      ? portPoint(source, edge.sourcePort)
      : loopBottomPoint(source, "exit");
    const end = portPoint(target, edge.targetPort ?? "top");
    if (Math.abs(start.x - end.x) < 1) return [start, end];
    const middleY = start.y + Math.max(48, (end.y - start.y) / 2);
    return [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end];
  }

  const automatic = automaticPorts(source, target);
  const sourcePort = edge.sourcePort ?? automatic.source;
  const targetPort = edge.targetPort ?? automatic.target;
  const start = portPoint(source, sourcePort);
  const end = portPoint(target, targetPort);
  if (Math.abs(start.x - end.x) < 1 || Math.abs(start.y - end.y) < 1) return [start, end];
  if (sourcePort === "left" || sourcePort === "right") {
    const middleX = start.x + (end.x - start.x) / 2;
    return [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end];
  }
  const middleY = start.y + (end.y - start.y) / 2;
  return [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end];
}

export function pathFromPoints(points: Point[]): string {
  return points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
}

export function edgeLabelPoint(points: Point[]): Point {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  let longest = { start: points[0], end: points[1], length: 0 };
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (length > longest.length) longest = { start, end, length };
  }
  const horizontal = Math.abs(longest.end.x - longest.start.x) >= Math.abs(longest.end.y - longest.start.y);
  return {
    x: (longest.start.x + longest.end.x) / 2 + (horizontal ? 0 : 22),
    y: (longest.start.y + longest.end.y) / 2 + (horizontal ? -18 : 0),
  };
}
