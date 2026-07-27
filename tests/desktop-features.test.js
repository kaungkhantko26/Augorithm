const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const packageJSON = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'app', 'index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'app', 'renderer.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'app', 'styles.css'), 'utf8');

assert.equal(packageJSON.version, '1.4.8');
assert.equal(packageJSON.build.nsis.perMachine, false);
assert.equal(packageJSON.build.win.requestedExecutionLevel, 'asInvoker');
assert.deepEqual(
  packageJSON.build.win.target.map(target => target.target),
  ['nsis', 'zip']
);
assert.match(packageJSON.build.artifactName, /\$\{os\}/);
assert.match(packageJSON.scripts.windows, /--publish never/);
assert.match(packageJSON.scripts.dmg, /--publish never/);
assert.match(html, /data-tab="split"/);
assert.match(html, /id="connectShapes"/);
assert.match(html, /<textarea id="sourceCode"/);
assert.match(renderer, /diagramConnections: state\.customConnections/);
assert.match(renderer, /generatedSource:\s*\{\s*drafts:/);
assert.match(renderer, /function chooseConnectionNode/);
assert.match(renderer, /function beginConnectionWaypointDrag/);
assert.match(renderer, /const exportPadding = 180/);
assert.match(renderer, /markerUnits="userSpaceOnUse"/);
assert.match(renderer, /translate\(\$\{exportPadding\} \$\{exportPadding\}\)/);
assert.match(styles, /\.custom-connection-hit/);
assert.match(styles, /\.tab-content\.split-active/);
assert.doesNotMatch(renderer, /markerWidth="9"/);

console.log('Desktop feature tests passed.');
