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
  const feedback = parsed.edges.find((edge) => edge.target === loop.id);
  assert.ok(forward);
  assert.ok(exit);
  assert.ok(feedback);

  const forwardTarget = nodeMap.get(forward.target);
  const exitTarget = nodeMap.get(exit.target);
  const feedbackSource = nodeMap.get(feedback.source);
  assert.ok(forwardTarget);
  assert.ok(exitTarget);
  assert.ok(feedbackSource);

  const forwardRoute = edgePoints(forward, loop, forwardTarget);
  const exitRoute = edgePoints(exit, loop, exitTarget);
  const feedbackRoute = edgePoints(feedback, feedbackSource, loop);

  assert.deepEqual(forwardRoute[0], {
    x: loop.position.x + loop.width,
    y: loop.position.y + loop.height / 2,
  });
  assert.deepEqual(exitRoute[0], {
    x: loop.position.x + loop.width / 2,
    y: loop.position.y + loop.height,
  });
  assert.deepEqual(feedbackRoute.at(-1), {
    x: loop.position.x + loop.width / 2,
    y: loop.position.y + loop.height,
  });
  assert.ok(Math.max(...feedbackRoute.map((point) => point.x)) > Math.max(
    loop.position.x + loop.width,
    feedbackSource.position.x + feedbackSource.width,
  ));
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
