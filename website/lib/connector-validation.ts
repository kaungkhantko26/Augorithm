import type { Diagnostic, DiagramEdge, DiagramNode } from "./augorithm-core";
import { isDiagramPort } from "./diagram-routing.ts";

export interface ConnectionDiagnostic extends Diagnostic { edgeId?: string; nodeId?: string; category: "Connection" | "Structure"; }

export function validateConnections(nodes: DiagramNode[], edges: DiagramEdge[]): ConnectionDiagnostic[] {
  const result: ConnectionDiagnostic[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  const add = (message: string, node?: DiagramNode, edge?: DiagramEdge, category: ConnectionDiagnostic["category"] = "Connection") =>
    result.push({ line: node?.sourceLine ?? 1, severity: "error", message, nodeId: node?.id, edgeId: edge?.id, category });

  const starts = nodes.filter((node) => node.kind === "start");
  const ends = nodes.filter((node) => node.kind === "end");
  if (starts.length !== 1) add(`Algorithm requires exactly one Start node; found ${starts.length}.`, starts[0], undefined, "Structure");
  if (!ends.length) add("Algorithm requires an End node.", undefined, undefined, "Structure");

  edges.filter((edge) => !edge.annotationOnly).forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source) { add(`Connection "${edge.id}" has a missing source node.`, undefined, edge); return; }
    if (!target) { add(`Connection from "${source.label}" has a missing target node.`, source, edge); return; }
    if (edge.sourcePort && !isDiagramPort(edge.sourcePort)) add("Connection has an invalid source port.", source, edge);
    if (edge.targetPort && !isDiagramPort(edge.targetPort)) add("Connection has an invalid target port.", target, edge);
    if (source.kind === "end") add("End nodes cannot have outgoing execution connections.", source, edge);
    if (target.kind === "start") add("Start nodes cannot have incoming execution connections.", target, edge);
    if (source.id === target.id && source.kind !== "loop") add(`Self-connection on "${source.label}" has no runtime purpose.`, source, edge);
    const key = `${edge.source}:${edge.target}:${(edge.label ?? "").toLowerCase()}`;
    if (seen.has(key)) add(`Duplicate connection from "${source.label}" to "${target.label}".`, source, edge);
    seen.add(key);
  });

  nodes.forEach((node) => {
    const outgoing = edges.filter((edge) => !edge.annotationOnly && edge.source === node.id);
    if (node.kind === "decision") {
      const labels = outgoing.map((edge) => (edge.label ?? "").toLowerCase());
      if (!labels.some((label) => /^(true|yes)$/.test(label)) || !labels.some((label) => /^(false|no)$/.test(label)))
        add(`Decision "${node.label}" must define True and False branches.`, node, undefined, "Structure");
    }
    if (node.kind === "loop") {
      const labels = outgoing.map((edge) => (edge.label ?? "").toLowerCase());
      if (!labels.some((label) => /^(next|body|true)$/.test(label))) add(`Loop "${node.label}" requires a valid Next connection.`, node, undefined, "Structure");
      if (!labels.some((label) => /^(done|false)$/.test(label))) add(`Loop "${node.label}" requires a valid Done connection.`, node, undefined, "Structure");
    }
    if (!outgoing.length && node.kind !== "end" && node.kind !== "comment") add(`Node "${node.label}" has no outgoing connection.`, node);
  });
  return result;
}
