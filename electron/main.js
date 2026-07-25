const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

let mainWindow;
let pendingProjectPath = null;
let updateDownloaded = false;
let updateCheckPromise = null;
let availableUpdateVersion = null;
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) app.quit();

function projectArgument(argv) {
  return argv.find(
    argument => !argument.startsWith('-') && argument.toLowerCase().endsWith('.augo')
  ) || null;
}

function readProject(filePath) {
  const project = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!project || typeof project !== 'object' || typeof project.code !== 'string') {
    throw new Error('This file does not contain a valid Augorithm project.');
  }
  return {
    filePath,
    project
  };
}

function deliverProject(filePath) {
  if (!filePath) return;
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isLoading()) {
    pendingProjectPath = filePath;
    return;
  }
  try {
    mainWindow.webContents.send('project-open-file', readProject(filePath));
    mainWindow.show();
    mainWindow.focus();
  } catch (error) {
    dialog.showErrorBox('Cannot Open Augorithm Project', error.message);
  }
}

function sendUpdateState(state) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('app:update-state', state);
}

function configureUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on('checking-for-update', () => sendUpdateState({ status: 'checking' }));
  autoUpdater.on('update-available', info => {
    availableUpdateVersion = info.version;
    sendUpdateState({ status: 'available', version: info.version });
  });
  autoUpdater.on('update-not-available', info =>
    sendUpdateState({ status: 'current', version: info?.version || app.getVersion() }));
  autoUpdater.on('download-progress', progress => sendUpdateState({
    status: 'downloading',
    version: availableUpdateVersion,
    percent: Math.max(0, Math.min(100, progress.percent || 0)),
    transferred: progress.transferred,
    total: progress.total
  }));
  autoUpdater.on('update-downloaded', info => {
    updateDownloaded = true;
    availableUpdateVersion = info.version;
    sendUpdateState({ status: 'downloaded', version: info.version });
  });
  autoUpdater.on('error', error => sendUpdateState({
    status: 'error',
    message: error?.message || 'The update could not be completed.'
  }));
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    const state = { status: 'development', version: app.getVersion() };
    sendUpdateState(state);
    return state;
  }
  if (updateDownloaded) {
    const state = { status: 'downloaded' };
    sendUpdateState(state);
    return state;
  }
  if (updateCheckPromise) return updateCheckPromise;
  updateCheckPromise = autoUpdater.checkForUpdates()
    .then(result => ({
      status: result?.updateInfo?.version && result.updateInfo.version !== app.getVersion()
        ? 'available'
        : 'current',
      version: result?.updateInfo?.version || app.getVersion()
    }))
    .finally(() => { updateCheckPromise = null; });
  return updateCheckPromise;
}

// macOS sends this event when an .augo document is double-clicked in Finder.
// It can arrive before Electron has finished creating the first window.
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  deliverProject(filePath);
});

app.on('second-instance', (_event, argv) => {
  const filePath = projectArgument(argv);
  if (filePath) {
    deliverProject(filePath);
  } else if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 14, y: 16 }
        }
      : { titleBarStyle: 'default' }),
    backgroundColor: '#071f40',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingProjectPath) {
      const filePath = pendingProjectPath;
      pendingProjectPath = null;
      deliverProject(filePath);
    }
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  if (process.platform !== 'darwin') {
    pendingProjectPath = projectArgument(process.argv);
  }
  createWindow();
  configureUpdater();
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Algorithm', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-action', 'new') },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu-action', 'open') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-action', 'save') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-action', 'saveAs') },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'Program',
      submenu: [
        { label: 'Build Flowchart', accelerator: 'CmdOrCtrl+B', click: () => mainWindow.webContents.send('menu-action', 'build') },
        { label: 'Run', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.send('menu-action', 'run') },
        { label: 'Stop / Clear', accelerator: 'CmdOrCtrl+.', click: () => mainWindow.webContents.send('menu-action', 'clear') }
      ]
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'Augorithm Quick Guide', click: () => mainWindow.webContents.send('menu-action', 'help') },
        { label: `About Augorithm ${app.getVersion()}`, click: () => mainWindow.webContents.send('menu-action', 'version') },
        { label: 'Check for Updates…', click: () => mainWindow.webContents.send('menu-action', 'version') }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  setTimeout(() => checkForUpdates().catch(() => {}), 5000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('app:get-info', () => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
  packaged: app.isPackaged,
  updateSupported: app.isPackaged
}));

ipcMain.handle('app:check-for-updates', () => checkForUpdates());

ipcMain.handle('app:install-update', () => {
  if (!updateDownloaded) return false;
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return true;
});

ipcMain.handle('project:save', async (_event, project, existingPath) => {
  let filePath = existingPath;
  if (!filePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Augorithm Project',
      defaultPath: `${(project.name || 'algorithm').replace(/\s+/g, '-')}.augo`,
      filters: [{ name: 'Augorithm Project', extensions: ['augo'] }]
    });
    if (result.canceled) return null;
    filePath = result.filePath;
  }
  const savedProject = { ...project, updatedAt: new Date().toISOString() };
  const temporaryPath = `${filePath}.saving-${process.pid}-${Date.now()}`;
  try {
    await fs.promises.writeFile(temporaryPath, JSON.stringify(savedProject, null, 2), 'utf8');
    const verification = readProject(temporaryPath);
    if (verification.project.code !== project.code) {
      throw new Error('The saved pseudocode did not match the editor.');
    }
    await fs.promises.rename(temporaryPath, filePath);
    return readProject(filePath);
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
});

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Augorithm Project',
    properties: ['openFile'],
    filters: [{ name: 'Augorithm Project', extensions: ['augo', 'json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return readProject(result.filePaths[0]);
});

ipcMain.handle('source:export', async (_event, { name, content, extension }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Source',
    defaultPath: `${(name || 'algorithm').replace(/\s+/g, '-')}.${extension}`
  });
  if (result.canceled) return null;
  fs.writeFileSync(result.filePath, content);
  return result.filePath;
});

ipcMain.handle('flowchart:export', async (_event, { name, format, data, width, height }) => {
  const extension = format === 'png' ? 'png' : 'svg';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: `Export Flowchart as ${extension.toUpperCase()}`,
    defaultPath: `${(name || 'flowchart').replace(/\s+/g, '-')}-flowchart.${extension}`,
    filters: [{ name: `${extension.toUpperCase()} Image`, extensions: [extension] }]
  });
  if (result.canceled) return null;
  if (format === 'png') {
    const exportWindow = new BrowserWindow({
      show: false,
      width: Math.max(320, Math.min(8192, Math.ceil(width))),
      height: Math.max(240, Math.min(8192, Math.ceil(height))),
      backgroundColor: '#fbfaf5',
      webPreferences: { offscreen: true, backgroundThrottling: false }
    });
    try {
      const encoded = Buffer.from(data, 'utf8').toString('base64');
      await exportWindow.loadURL(`data:image/svg+xml;base64,${encoded}`);
      await exportWindow.webContents.executeJavaScript(
        'document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))'
      );
      const image = await exportWindow.webContents.capturePage();
      fs.writeFileSync(result.filePath, image.toPNG());
    } finally {
      exportWindow.destroy();
    }
  } else {
    fs.writeFileSync(result.filePath, data, 'utf8');
  }
  return result.filePath;
});
