function versionParts(value) {
  const core = String(value || '0')
    .trim()
    .replace(/^v/i, '')
    .split(/[+-]/, 1)[0];
  return core.split('.').map(part => {
    const parsed = Number.parseInt(part, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  });
}

function compareVersions(left, right) {
  const candidate = versionParts(left);
  const installed = versionParts(right);
  const length = Math.max(candidate.length, installed.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (candidate[index] || 0) - (installed[index] || 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

function isNewerVersion(candidate, installed) {
  return compareVersions(candidate, installed) > 0;
}

module.exports = {
  compareVersions,
  isNewerVersion,
  versionParts
};
