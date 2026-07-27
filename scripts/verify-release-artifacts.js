const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const { version } = require(path.join(root, 'package.json'));
const platform = String(process.argv[2] || process.platform).toLowerCase();

function read(name) {
  const filePath = path.join(dist, name);
  assert.ok(fs.existsSync(filePath), `Missing release artifact: ${name}`);
  return { filePath, data: fs.readFileSync(filePath) };
}

function assertLarge(name, minimumBytes) {
  const artifact = read(name);
  assert.ok(
    artifact.data.length >= minimumBytes,
    `${name} is unexpectedly small (${artifact.data.length} bytes)`
  );
  return artifact;
}

function assertZip(name) {
  const artifact = assertLarge(name, 50 * 1024 * 1024);
  assert.equal(artifact.data.subarray(0, 2).toString('ascii'), 'PK', `${name} is not a ZIP archive`);
}

function assertManifest(name, requiredNames) {
  const manifest = read(name).data.toString('utf8');
  assert.match(manifest, new RegExp(`version:\\s*${version.replace(/\./g, '\\.')}`));
  requiredNames.forEach(fileName =>
    assert.ok(manifest.includes(fileName), `${name} does not reference ${fileName}`)
  );
}

if (platform === 'windows' || platform === 'win32' || platform === 'win') {
  const installerName = `Augorithm-${version}-win-x64.exe`;
  const zipName = `Augorithm-${version}-win-x64.zip`;
  const installer = assertLarge(installerName, 50 * 1024 * 1024);
  assert.equal(installer.data.subarray(0, 2).toString('ascii'), 'MZ', `${installerName} is not a Windows executable`);
  assertZip(zipName);
  assertManifest('latest.yml', [installerName]);
} else if (platform === 'macos' || platform === 'darwin' || platform === 'mac') {
  const dmgName = `Augorithm-${version}-mac-arm64.dmg`;
  const zipName = `Augorithm-${version}-mac-arm64.zip`;
  assertLarge(dmgName, 50 * 1024 * 1024);
  assertZip(zipName);
  assertManifest('latest-mac.yml', [zipName, dmgName]);
} else {
  throw new Error(`Unsupported release verification platform: ${platform}`);
}

console.log(`Verified Augorithm ${version} ${platform} release artifacts.`);
