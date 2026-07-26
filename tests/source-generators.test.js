const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  generateJavaSource,
  javaExpression,
  sanitizeJavaClassName
} = require('../app/source-generators.js');

assert.equal(sanitizeJavaClassName('student average'), 'StudentAverage');
assert.equal(sanitizeJavaClassName('123 scores'), 'Algorithm_123Scores');
assert.equal(javaExpression('score = 50 AND passed = True', true), 'score == 50 && passed == true');
assert.equal(javaExpression('size = "S"', true), 'Objects.equals(size, "S")');
assert.equal(javaExpression('2 ^ 3'), 'Math.pow(2, 3)');

const java = generateJavaSource([
  'START',
  'Declare total As Integer',
  'Declare number As Integer',
  'Set total = 0',
  'For count = 1 To 5 Step 1',
  'Input number',
  'Set total = total + number',
  'END FOR count',
  'If total >= 10 Then',
  'Output "Total: ", total',
  'Else',
  'Output "Small"',
  'END IF',
  'END'
], { projectName: 'five number total' });

assert.match(java, /public final class FiveNumberTotal/);
assert.match(java, /int total = 0;/);
assert.match(java, /number = Integer\.parseInt/);
assert.match(java, /for \(int count = 1; count <= 5; count \+= 1\)/);
assert.match(java, /System\.out\.println\("Total: " \+ total\);/);
assert.match(java, /} else \{/);

const stringInput = generateJavaSource([
  'START',
  'INPUT size',
  'IF size = "S" THEN',
  'OUTPUT "Small"',
  'END IF',
  'END'
], { projectName: 'shoe size' });

assert.match(stringInput, /String size = input\.nextLine\(\);/);
assert.match(stringInput, /if \(Objects\.equals\(size, "S"\)\)/);

const javac = childProcess.spawnSync('javac', ['-version'], { encoding: 'utf8' });
if (javac.status === 0) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'augorithm-java-'));
  try {
    const javaPath = path.join(directory, 'FiveNumberTotal.java');
    fs.writeFileSync(javaPath, java, 'utf8');
    childProcess.execFileSync('javac', [javaPath], { stdio: 'pipe' });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

console.log('Source generator tests passed.');
