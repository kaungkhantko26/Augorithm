import assert from "node:assert/strict";
import test from "node:test";
import {
  createProject,
  executePseudocode,
  formatPseudocode,
  generateSource,
  migrateProject,
  parsePseudocode,
} from "../lib/augorithm-core.ts";
import { edgePoints } from "../lib/diagram-routing.ts";
import { validateConnections } from "../lib/connector-validation.ts";
import { generateJava, generatePseudocode, generatePython, javaClassName, parsePseudocodeToIR, parsePythonToIR } from "../lib/algorithm-ir.ts";

test("formats nested pseudocode with program boundaries aligned", () => {
  const formatted = formatPseudocode("START\nSET row TO 1\nWHILE row < 3\nOUTPUT row\nENDWHILE\nEND");
  assert.equal(formatted, "START\nSET row TO 1\nWHILE row < 3\n    OUTPUT row\nENDWHILE\nEND");
});

test("migrates a legacy desktop project into schema v2", () => {
  const migrated = migrateProject({
    version: 3,
    name: "Legacy maximum",
    code: "START\nINPUT value\nOUTPUT value\nEND",
    database: { name: "Scores" },
  });

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.name, "Legacy maximum");
  assert.equal(migrated.pages[0].nodes.length, 4);
  assert.equal(migrated.database.name, "Scores");
});

test("preserves stable node positions while rebuilding edited pseudocode", () => {
  const original = createProject("Position test", "START\nSET score = 1\nOUTPUT score\nEND");
  const process = original.pages[0].nodes.find((node) => node.kind === "process");
  assert.ok(process);
  process.position = { x: 420, y: 360 };

  const rebuilt = migrateProject({
    ...original,
    code: "START\nSET score = 1\nOUTPUT score\nOUTPUT \"done\"\nEND",
  });
  const rebuiltProcess = rebuilt.pages[0].nodes.find((node) => node.sourceKey === process.sourceKey);
  assert.deepEqual(rebuiltProcess?.position, { x: 420, y: 360 });
  assert.equal(rebuilt.pages[0].nodes.length, 5);
});

test("runs nested pseudocode and generates source targets", () => {
  const code = `START
SET row TO 1
WHILE row < 3
    OUTPUT row
    ADD 1 TO row
ENDWHILE
END`;
  const parsed = parsePseudocode(code);
  const result = executePseudocode(code);

  assert.equal(parsed.diagnostics.length, 0);
  assert.deepEqual(result.output, ["1", "2"]);
  assert.equal(result.variables.row, 3);
  assert.match(generateSource(code, "python"), /while row < 3:/);
  assert.match(generateSource(code, "java"), /public class Main/);
});

test("routes decisions and loops through semantic branch edges", () => {
  const parsed = parsePseudocode(`START
SET total = 0
FOR index = 1 TO 3
    IF index = 2 THEN
        OUTPUT "middle"
    ELSE
        OUTPUT index
    END IF
NEXT index
OUTPUT total
END`);
  const labels = parsed.edges.map((edge) => edge.label).filter(Boolean);

  assert.deepEqual(labels.sort(), ["Done", "False", "Next", "True"].sort());
  assert.equal(parsed.nodes.some((node) => /^next\b/i.test(node.label)), false);
  assert.equal(parsed.nodes.some((node) => /^end if$/i.test(node.label)), false);
});

test("keeps loop entry, exit, and feedback arrows in separate lanes", () => {
  const parsed = parsePseudocode(`START
SET row = 1
WHILE row < 3
    OUTPUT row
    ADD 1 TO row
ENDWHILE
OUTPUT "done"
END`);
  const nodeMap = new Map(parsed.nodes.map((node) => [node.id, node]));
  const loop = parsed.nodes.find((node) => node.kind === "loop");
  assert.ok(loop);
  const forward = parsed.edges.find((edge) => edge.source === loop.id && edge.label === "True");
  const exit = parsed.edges.find((edge) => edge.source === loop.id && edge.label === "False");
  const incoming = parsed.edges.filter((edge) => edge.target === loop.id);
  const entry = incoming.find((edge) => {
    const source = nodeMap.get(edge.source);
    return source && source.position.y < loop.position.y;
  });
  const feedback = incoming.find((edge) => {
    const source = nodeMap.get(edge.source);
    return source && source.position.y > loop.position.y;
  });
  assert.ok(forward);
  assert.ok(exit);
  assert.ok(entry);
  assert.ok(feedback);

  const forwardTarget = nodeMap.get(forward.target);
  const exitTarget = nodeMap.get(exit.target);
  const entrySource = nodeMap.get(entry.source);
  const feedbackSource = nodeMap.get(feedback.source);
  assert.ok(forwardTarget);
  assert.ok(exitTarget);
  assert.ok(entrySource);
  assert.ok(feedbackSource);

  const forwardRoute = edgePoints(forward, loop, forwardTarget);
  const exitRoute = edgePoints(exit, loop, exitTarget);
  const entryRoute = edgePoints(entry, entrySource, loop);
  const feedbackRoute = edgePoints(feedback, feedbackSource, loop);

  assert.deepEqual(forwardRoute[0], {
    x: loop.position.x + loop.width,
    y: loop.position.y + loop.height / 2,
  });
  assert.deepEqual(forwardRoute.at(-1), {
    x: forwardTarget.position.x + forwardTarget.width / 2,
    y: forwardTarget.position.y - 3,
  });
  assert.deepEqual(exitRoute[0], {
    x: loop.position.x + loop.width * 0.24,
    y: loop.position.y + loop.height,
  });
  assert.deepEqual(entryRoute.at(-1), {
    x: loop.position.x + loop.width / 2,
    y: loop.position.y - 3,
  });
  assert.deepEqual(feedbackRoute.at(-1), {
    x: loop.position.x + loop.width * 0.68,
    y: loop.position.y + loop.height + 3,
  });
  assert.notEqual(exitRoute[0].x, feedbackRoute.at(-1)?.x);
  assert.ok(Math.max(...feedbackRoute.map((point) => point.x)) > Math.max(
    loop.position.x + loop.width,
    feedbackSource.position.x + feedbackSource.width,
  ));
});

test("lands arrowheads on visible parallelogram borders and preserves port approach", () => {
  const source = {
    id: "source",
    kind: "decision" as const,
    label: "IF ready",
    position: { x: 100, y: 100 },
    width: 300,
    height: 100,
    style: { fill: "#fff", stroke: "#000", text: "#000", fontSize: 14 },
  };
  const target = {
    id: "target",
    kind: "output" as const,
    label: "OUTPUT result",
    position: { x: 600, y: 240 },
    width: 320,
    height: 100,
    style: { fill: "#fff", stroke: "#000", text: "#000", fontSize: 14 },
  };
  const route = edgePoints(
    { id: "edge", source: source.id, target: target.id, label: "True" },
    source,
    target,
  );

  assert.deepEqual(route.at(-1), {
    x: target.position.x + target.width * 0.045 - 3,
    y: target.position.y + target.height / 2,
  });
  assert.equal(route.at(-2)?.y, route.at(-1)?.y);
  assert.ok((route.at(-2)?.x ?? Infinity) < (route.at(-1)?.x ?? -Infinity));
});

test("keeps edited waypoint routes orthogonal at shape ports", () => {
  const source = {
    id: "source",
    kind: "process" as const,
    label: "SET value = 1",
    position: { x: 100, y: 100 },
    width: 260,
    height: 80,
    style: { fill: "#fff", stroke: "#000", text: "#000", fontSize: 14 },
  };
  const target = {
    id: "target",
    kind: "input" as const,
    label: "INPUT value",
    position: { x: 620, y: 280 },
    width: 300,
    height: 90,
    style: { fill: "#fff", stroke: "#000", text: "#000", fontSize: 14 },
  };
  const route = edgePoints(
    {
      id: "edge",
      source: source.id,
      target: target.id,
      sourcePort: "right",
      targetPort: "left",
      waypoints: [{ x: 480, y: 210 }],
    },
    source,
    target,
  );

  for (let index = 1; index < route.length; index += 1) {
    assert.ok(
      route[index - 1].x === route[index].x || route[index - 1].y === route[index].y,
      "every edited connector segment should remain orthogonal",
    );
  }
  assert.deepEqual(route.at(-1), {
    x: target.position.x + target.width * 0.045 - 3,
    y: target.position.y + target.height / 2,
  });
});

test("routes self-connections outside the node with a visible arrow approach", () => {
  const node = {
    id: "loop", kind: "loop" as const, label: "FOR i = 0 TO 4",
    position: { x: 200, y: 180 }, width: 260, height: 82,
    style: { fill: "#fff", stroke: "#000", text: "#000", fontSize: 14 },
  };
  const route = edgePoints({ id: "self", source: node.id, target: node.id, sourcePort: "right", targetPort: "top" }, node, node, [node]);
  assert.ok(Math.max(...route.map((point) => point.x)) >= node.position.x + node.width + 56);
  assert.deepEqual(route.at(-1), { x: node.position.x + node.width / 2, y: node.position.y - 3 });
});

test("validates missing loop exits and illegal end connections", () => {
  const parsed = parsePseudocode("START\nFOR i = 0 TO 4\nOUTPUT i\nNEXT i\nEND");
  const loop = parsed.nodes.find((node) => node.kind === "loop");
  const end = parsed.nodes.find((node) => node.kind === "end");
  assert.ok(loop && end);
  const withoutDone = parsed.edges.filter((edge) => !(edge.source === loop.id && edge.label === "Done"));
  const invalid = [...withoutDone, { id: "bad", source: end.id, target: loop.id }];
  const messages = validateConnections(parsed.nodes, invalid).map((item) => item.message);
  assert.ok(messages.some((message) => message.includes("valid Done connection")));
  assert.ok(messages.some((message) => message.includes("End nodes cannot")));
});

test("uses a shared IR to generate typed Python and a complete Java file", () => {
  const ir = parsePseudocodeToIR(`START
DECLARE marks[5] AS INTEGER
DECLARE i AS INTEGER
FOR i = 0 TO 4
INPUT marks[i]
END FOR
FOR i = 0 TO 4
DISPLAY marks[i]
END FOR
END`, "student marks 2026");
  const java = generateJava(ir);
  assert.equal(java.filename, "StudentMarks2026.java");
  assert.match(java.code, /public class StudentMarks2026/);
  assert.match(java.code, /int\[\] marks = new int\[5\]/);
  assert.match(java.code, /Scanner scanner = new Scanner/);
  assert.equal((java.code.match(/for \(/g) ?? []).length, 2);
  assert.match(generatePython(ir), /range\(0, \(4\) \+ 1, 1\)/);
});

test("converts Python range semantics through IR without an off-by-one error", () => {
  const ir = parsePythonToIR(`for i in range(0, 5):\n    print(i)`, "Range Demo");
  const pseudo = generatePseudocode(ir);
  assert.match(pseudo, /FOR i = 0 TO 4/);
  assert.match(pseudo, /DISPLAY i/);
  assert.equal(ir.diagnostics.filter((item) => item.severity === "error").length, 0);
});

test("rejects unsupported asynchronous Python without changing semantics", () => {
  const ir = parsePythonToIR("async def main():\n    await work()", "Async Demo");
  assert.equal(ir.statements.length, 0);
  assert.match(ir.diagnostics[0].message, /cannot be converted/);
  assert.equal(javaClassName("2026 class"), "Program2026Class");
});

test("executes false and else-if branches", () => {
  const result = executePseudocode(`START
SET score TO 45
IF score >= 80 THEN
    OUTPUT "Distinction"
ELSE IF score >= 50 THEN
    OUTPUT "Pass"
ELSE
    OUTPUT "Try again"
END IF
END`);
  assert.deepEqual(result.output, ["Try again"]);
});

test("supports arrays and standard math functions", () => {
  const result = executePseudocode(`START
DECLARE values[3]
SET values[0] = 9
SET values[1] = SQRT(values[0])
OUTPUT values[1]
END`);
  assert.deepEqual(result.output, ["3"]);
  assert.deepEqual(result.variables.values, [9, 3, 0]);
});
