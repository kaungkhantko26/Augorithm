const { execFileSync } = require('child_process');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  // Downloaded Electron bundles can carry Finder metadata that prevents
  // macOS code signing. Clear it before electron-builder signs the app.
  execFileSync('/usr/bin/xattr', ['-cr', context.appOutDir], { stdio: 'inherit' });
};
