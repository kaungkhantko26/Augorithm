const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('augorithm', {
  platform: process.platform,
  saveProject: (project, path) => ipcRenderer.invoke('project:save', project, path),
  openProject: () => ipcRenderer.invoke('project:open'),
  exportSource: data => ipcRenderer.invoke('source:export', data),
  exportFlowchart: data => ipcRenderer.invoke('flowchart:export', data),
  onMenuAction: callback => ipcRenderer.on('menu-action', (_event, action) => callback(action)),
  onOpenProjectFile: callback => ipcRenderer.on('project-open-file', (_event, result) => callback(result))
});
