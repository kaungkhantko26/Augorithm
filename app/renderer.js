const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const APP_VERSION = '1.4.8';

// Browser/iPad fallback; Electron replaces this with the secure preload bridge.
if (!window.augorithm) {
  const updateListeners = [];
  const emitUpdateState = state => updateListeners.forEach(listener => listener(state));
  const versionParts = value => String(value || '0').trim().replace(/^v/i, '')
    .split(/[+-]/, 1)[0].split('.').map(part => parseInt(part, 10) || 0);
  const isNewerVersion = (candidate, current) => {
    const next = versionParts(candidate);
    const installed = versionParts(current);
    for (let index = 0; index < Math.max(next.length, installed.length); index += 1) {
      if ((next[index] || 0) !== (installed[index] || 0)) return (next[index] || 0) > (installed[index] || 0);
    }
    return false;
  };
  const downloadBlob = (blob, name) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  };
  const safeDownloadName = (name, extension) => {
    const base = String(name || 'Augorithm').trim()
      .replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'Augorithm';
    return `${base}.${extension}`;
  };
  const rasterizeFlowchart = async ({ data, width, height }) => {
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      const scale = Math.max(1, Math.min(3, window.devicePixelRatio || 2));
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const context = canvas.getContext('2d');
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  const openBrowserProject = () => new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.augo,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const project = JSON.parse(await file.text());
        resolve(typeof project?.code === 'string' ? { filePath: file.name, project } : null);
      } catch {
        resolve(null);
      }
    }, { once: true });
    input.click();
  });
  const exportBrowserFlowchart = async ({ name, format, data, width, height }) => {
    const extension = String(format || 'svg').toLowerCase();
    const targetName = safeDownloadName(`${name || 'Augorithm'}-flowchart`, extension);
    if (extension === 'svg') {
      return downloadBlob(new Blob([data], { type: 'image/svg+xml;charset=utf-8' }), targetName);
    }
    const blob = await rasterizeFlowchart({ data, width, height });
    return blob ? downloadBlob(blob, targetName) : null;
  };
  const isIPad = /iPad/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  window.augorithm = {
    platform: isIPad ? 'ipad' : 'browser',
    getAppInfo: async () => ({
      name: 'Augorithm',
      version: APP_VERSION,
      platform: isIPad ? 'ipad' : 'browser',
      packaged: false,
      updateSupported: true
    }),
    checkForUpdates: async () => {
      emitUpdateState({ status: 'checking' });
      try {
        const response = await fetch('https://api.github.com/repos/kaungkhantko26/Augorithm/releases/latest', {
          cache: 'no-store',
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!response.ok) throw new Error(`Update server returned ${response.status}.`);
        const release = await response.json();
        const latest = String(release.tag_name || release.name || '').replace(/^v/i, '');
        const state = isNewerVersion(latest, APP_VERSION)
          ? { status: 'available', version: latest, web: true }
          : { status: 'current', version: APP_VERSION, web: true };
        emitUpdateState(state);
        return state;
      } catch (error) {
        const state = { status: 'error', message: error.message, web: true };
        emitUpdateState(state);
        return state;
      }
    },
    installUpdate: async () => {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.update();
      location.reload();
      return true;
    },
    onUpdateState: callback => updateListeners.push(callback),
    revealFile: async () => false,
    runPython: async () => ({
      success: false,
      stdout: '',
      stderr: 'Python execution is available in the installed macOS and Windows apps.',
      exitCode: null,
      command: null
    }),
    stopPython: async () => false,
    saveProject: async project => {
      const filePath = safeDownloadName(project?.name, 'augo');
      downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), filePath);
      return { filePath, project };
    },
    openProject: openBrowserProject,
    exportSource: async ({ name, content, extension }) =>
      downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), safeDownloadName(name, extension)),
    exportFlowchart: exportBrowserFlowchart,
    copyFlowchart: async chart => {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Image clipboard access is not supported by this browser.');
      }
      const blob = await rasterizeFlowchart(chart);
      if (!blob) throw new Error('The flowchart image could not be created.');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    },
    onMenuAction: () => {},
    onOpenProjectFile: () => {}
  };
}

const translations = {
  en: {
    build: 'Build', run: 'Run', symbols: 'SYMBOLS', inputOutput: 'INPUT / OUTPUT',
    input: 'Input', output: 'Output', variables: 'VARIABLES', declare: 'Declare',
    assign: 'Assign', control: 'CONTROL', if: 'If', call: 'Call', looping: 'LOOPING', while: 'While',
    for: 'For', do: 'Do', miscellaneous: 'MISCELLANEOUS', comment: 'Comment', breakpoint: 'Breakpoint',
    browseExamples: 'Browse examples', flowchart: 'Flowchart', pseudocode: 'Pseudocode',
    source: 'Source', split: 'Split', connect: 'Connect', regenerate: 'Regenerate',
    database: 'Database', pythonEditor: 'Python', fit: 'Fit',
    addNode: '＋ Add node', copyFlowchart: 'Copy',
    flowchartCopied: 'Flowchart copied — paste it into Canva or PowerPoint.',
    flowchartCopyFailed: 'Could not copy the flowchart: {message}',
    editNodeHint: 'Double-click to edit this statement',
    generatedSource: 'GENERATED SOURCE', export: 'Export', copyCode: 'Copy',
    liveGenerated: 'LIVE', targetLanguage: 'Target',
    liveSourceHint: 'Generated live from pseudocode',
    sourceCopied: '{language} source copied to the clipboard.',
    sourceCopyFailed: 'Could not copy source: {message}',
    clear: 'Clear', inspector: 'INSPECTOR', validation: 'VALIDATION', console: 'CONSOLE',
    pressRun: 'Press Run to execute your algorithm.', consoleInput: 'CONSOLE INPUT',
    inputHint: 'Augorithm prompts for every INPUT statement.', runAgain: 'Run again',
    selectSymbol: 'Select a symbol', selectSymbolHint: 'Click a flowchart symbol to inspect it.',
    startTemplate: 'Start with a template', templateHint: 'Learn programming logic one flowchart at a time.',
    quickGuide: 'Augorithm Quick Guide',
    quickGuideHint: 'Write beginner-friendly pseudocode and turn it into an executable flowchart.',
    useTemplate: 'Use template →', true: 'True', false: 'False', next: 'Next', done: 'Done', noAction: 'No action',
    readyRun: 'Ready to run', ready: 'Ready', symbolsCount: 'symbols', issue: 'issue',
    issues: 'issues', start: 'Start', end: 'End', main: 'Main', elseIf: 'Else If',
    else: 'Else', programEntry: 'Program entry', programExit: 'Program exit'
    , inputRequired: 'Input required: {name}', programStopped: 'Program stopped.',
    enterValue: 'Enter a value for “{name}” to continue.', finishedNoOutput: 'Program finished with no output.',
    valueFor: 'VALUE FOR {name}', submit: 'Submit {name}', fixSyntax: 'Fix syntax errors before running.',
    runToEnter: 'Run to enter each value automatically'
    , guideWrite: 'Write or add symbols', guideWriteHint: 'Use Declare, Set, Input, Output, If / Else, and While.',
    guideBuild: 'Build the flowchart', guideBuildHint: 'Changes synchronize automatically. Build checks the syntax.',
    guideRun: 'Run it', guideRunHint: 'Enter requested values in the Console, then inspect output and variables.',
    guideExport: 'Export your work',
    guideExportHint: 'Export flowcharts as SVG or PNG and source as Java, Python, Swift, JavaScript, or Pseudocode.',
    referenceTitle: 'Flowgorithm language reference',
    referenceHint: 'Compare symbols, expressions, data types, and control structures with the original learning environment.',
    openReference: 'Open reference ↗', statement: 'STATEMENT', update: 'Update',
    delete: 'Delete', type: 'TYPE', line: 'Line', endIf: 'End If', endWhile: 'End While',
    endFor: 'End For', pseudoFile: 'PSEUDOCODE', formatCode: 'Format',
    fixErrors: 'Fix errors', editorReady: 'IDE editing enabled',
    formatted: 'Pseudocode formatted', fixedCount: 'Fixed {count} syntax issue(s)',
    noSafeFix: 'No safe automatic fixes found', tabHint: 'Tab indents · Shift+Tab outdents',
    darkMode: 'Switch to dark mode', lightMode: 'Switch to light mode',
    noteMode: 'Note mode', exitNoteMode: 'Exit note mode',
    aboutAugorithm: 'About Augorithm', updateHint: 'Version information and automatic updates.',
    updateReady: 'Augorithm is up to date', checkUpdates: 'Check for updates',
    checkingUpdates: 'Checking for updates…', updateAvailable: 'Update {version} is available',
    downloadingUpdate: 'Downloading update {version}… {percent}%',
    restartUpdate: 'Restart to update', reloadUpdate: 'Reload to update',
    updateDownloaded: 'Update {version} is ready', updateError: 'Update check failed',
    updateCurrent: 'You are using the latest version.',
    updateDevelopment: 'Automatic updates are enabled in installed builds.',
    automaticUpdates: 'Updates are checked automatically. Downloaded updates install when Augorithm restarts.'
    , normalizationLab: 'DATABASE NORMALIZATION',
    normalizationHint: 'Design a relation and analyze it through 1NF, 2NF, and 3NF.',
    loadExample: 'Load example', analyzeNormalize: 'Analyze & normalize',
    relationName: 'Relation name', attributes: 'Attributes (comma-separated)',
    primaryKey: 'Primary key', functionalDependencies: 'Functional dependencies (one per line)',
    normalizationEmpty: 'Enter a table definition, then analyze it.',
    pythonWorkspace: 'PYTHON EDITOR',
    pythonHint: 'Generate Python from pseudocode, edit it, and run it in the desktop app.',
    generatePython: 'Generate from pseudocode', exportPython: 'Export .py',
    runPython: 'Run Python', stopPython: 'Stop', editablePython: 'EDITABLE',
    pythonEditorReady: 'Ready · ⌘/Ctrl + Enter to run',
    standardInput: 'STANDARD INPUT', pythonOutput: 'OUTPUT'
  },
  my: {
    build: 'တည်ဆောက်', run: 'လုပ်ဆောင်', symbols: 'သင်္ကေတများ', inputOutput: 'အဝင် / အထွက်',
    input: 'အဝင်', output: 'အထွက်', variables: 'ကိန်းရှင်များ', declare: 'ကြေညာ',
    assign: 'တန်ဖိုးသတ်မှတ်', control: 'ထိန်းချုပ်မှု', if: 'အကယ်၍',
    looping: 'ထပ်ခါလုပ်ဆောင်ခြင်း', while: 'မှန်နေစဉ်', for: 'အကြိမ်ရေဖြင့်',
    miscellaneous: 'အခြား', comment: 'မှတ်ချက်', browseExamples: 'နမူနာများကြည့်ရန်',
    flowchart: 'လုပ်ငန်းစဉ်ပုံကြမ်း', split: 'ခွဲမြင်ကွင်း', connect: 'ချိတ်ဆက်', regenerate: 'ပြန်ထုတ်မည်',
    pseudocode: 'ပရိုဂရမ်အကြမ်းကုဒ်', source: 'ရင်းမြစ်ကုဒ်',
    database: 'ဒေတာဘေ့စ်', pythonEditor: 'Python',
    fit: 'အံကိုက်', addNode: '＋ Node ထည့်မည်', copyFlowchart: 'ကူးယူ',
    flowchartCopied: 'ပုံကြမ်းကို ကူးယူပြီးပါပြီ — Canva သို့မဟုတ် PowerPoint တွင် ထည့်နိုင်ပါသည်။',
    flowchartCopyFailed: 'ပုံကြမ်းကို ကူးယူ၍မရပါ: {message}',
    editNodeHint: 'ဤဖော်ပြချက်ကို ပြင်ရန် နှစ်ချက်နှိပ်ပါ',
    generatedSource: 'ထုတ်ပေးထားသော ရင်းမြစ်ကုဒ်', export: 'ထုတ်ယူ', copyCode: 'ကူးယူ',
    liveGenerated: 'တိုက်ရိုက်', targetLanguage: 'ရည်ရွယ်ဘာသာ',
    liveSourceHint: 'Pseudocode မှ အလိုအလျောက် ထုတ်ပေးထားသည်',
    sourceCopied: '{language} ကုဒ်ကို ကူးယူပြီးပါပြီ။',
    sourceCopyFailed: 'ကုဒ်ကူးယူ၍မရပါ: {message}',
    clear: 'ရှင်းလင်း', inspector: 'စစ်ဆေးရန်', validation: 'အတည်ပြုစစ်ဆေးမှု',
    console: 'လုပ်ဆောင်မှုမှတ်တမ်း', pressRun: 'လုပ်ဆောင်ရန် “Run” ကိုနှိပ်ပါ။',
    consoleInput: 'ထည့်သွင်းတန်ဖိုး', inputHint: 'INPUT တစ်ခုချင်းစီအတွက် တန်ဖိုးတောင်းပါမည်။',
    runAgain: 'ထပ်လုပ်ဆောင်', selectSymbol: 'သင်္ကေတတစ်ခုရွေးပါ',
    selectSymbolHint: 'စစ်ဆေးရန် ပုံကြမ်းထဲမှ သင်္ကေတကိုနှိပ်ပါ။',
    startTemplate: 'နမူနာတစ်ခုဖြင့် စတင်ပါ',
    templateHint: 'လုပ်ငန်းစဉ်ပုံကြမ်းများဖြင့် ပရိုဂရမ်ရေးနည်းကို လေ့လာပါ။',
    quickGuide: 'Augorithm အသုံးပြုနည်း',
    quickGuideHint: 'အကြမ်းကုဒ်ရေးပြီး လုပ်ဆောင်နိုင်သော ပုံကြမ်းအဖြစ် ပြောင်းပါ။',
    useTemplate: 'နမူနာသုံးမည် →', true: 'မှန်', false: 'မှား',
    next: 'နောက်တစ်ကြိမ်', done: 'ပြီးပါပြီ', noAction: 'လုပ်ဆောင်ချက်မရှိ',
    readyRun: 'လုပ်ဆောင်ရန် အသင့်', ready: 'အသင့်', symbolsCount: 'သင်္ကေတ',
    issue: 'ပြဿနာ', issues: 'ပြဿနာများ', start: 'စတင်', end: 'ပြီးဆုံး',
    main: 'အဓိကပရိုဂရမ်', elseIf: 'မဟုတ်ပါက အကယ်၍', else: 'မဟုတ်ပါက',
    programEntry: 'ပရိုဂရမ်အစ', programExit: 'ပရိုဂရမ်အဆုံး'
    , inputRequired: '{name} တန်ဖိုးလိုအပ်သည်', programStopped: 'ပရိုဂရမ် ရပ်တန့်သွားသည်။',
    enterValue: 'ဆက်လုပ်ရန် “{name}” အတွက် တန်ဖိုးထည့်ပါ။',
    finishedNoOutput: 'အထွက်မရှိဘဲ ပရိုဂရမ်ပြီးဆုံးသည်။', valueFor: '{name} အတွက် တန်ဖိုး',
    submit: '{name} ကိုထည့်မည်', fixSyntax: 'မလုပ်ဆောင်မီ ကုဒ်အမှားများကို ပြင်ပါ။',
    runToEnter: 'လုပ်ဆောင်ပြီး တန်ဖိုးတစ်ခုချင်းစီ ထည့်ပါ'
    , guideWrite: 'ရေးပါ သို့မဟုတ် သင်္ကေတထည့်ပါ',
    guideWriteHint: 'Declare, Set, Input, Output, If / Else နှင့် While ကိုသုံးပါ။',
    guideBuild: 'လုပ်ငန်းစဉ်ပုံကြမ်း တည်ဆောက်ပါ',
    guideBuildHint: 'ပြောင်းလဲမှုများ အလိုအလျောက် ကိုက်ညီပြီး ကုဒ်အမှားများကို စစ်ဆေးပေးသည်။',
    guideRun: 'လုပ်ဆောင်ပါ',
    guideRunHint: 'တောင်းဆိုသောတန်ဖိုးများကို ထည့်ပြီး အထွက်နှင့် ကိန်းရှင်များကို စစ်ဆေးပါ။',
    guideExport: 'သင့်အလုပ်ကို ထုတ်ယူပါ',
    guideExportHint: 'ပုံကြမ်းကို SVG/PNG နှင့် ကုဒ်ကို Java, Python, Swift, JavaScript သို့မဟုတ် Pseudocode အဖြစ် ထုတ်ယူပါ။',
    referenceTitle: 'Flowgorithm ဘာသာစကား ကိုးကားချက်',
    referenceHint: 'သင်္ကေတ၊ ဖော်ပြချက်၊ ဒေတာအမျိုးအစားနှင့် ထိန်းချုပ်ပုံများကို မူရင်းစနစ်နှင့် နှိုင်းယှဉ်ပါ။',
    openReference: 'ကိုးကားချက်ဖွင့်ရန် ↗', statement: 'ဖော်ပြချက်', update: 'ပြင်ဆင်မည်',
    delete: 'ဖျက်မည်', type: 'အမျိုးအစား', line: 'စာကြောင်း',
    endIf: 'If အဆုံး', endWhile: 'While အဆုံး', endFor: 'For အဆုံး',
    pseudoFile: 'ပရိုဂရမ်အကြမ်းကုဒ်', formatCode: 'ပုံစံချမည်',
    fixErrors: 'အမှားပြင်မည်', editorReady: 'IDE စာတည်းဖြတ်စနစ် အသင့်ဖြစ်ပါပြီ',
    formatted: 'အကြမ်းကုဒ်ကို ပုံစံချပြီးပါပြီ', fixedCount: 'ကုဒ်အမှား {count} ခု ပြင်ပြီးပါပြီ',
    noSafeFix: 'ဘေးကင်းစွာ အလိုအလျောက်ပြင်နိုင်သော အမှားမတွေ့ပါ',
    tabHint: 'Tab ဖြင့်အတွင်းရွှေ့ · Shift+Tab ဖြင့်အပြင်ရွှေ့',
    darkMode: 'အမှောင်ပုံစံသို့ ပြောင်းမည်', lightMode: 'အလင်းပုံစံသို့ ပြောင်းမည်',
    noteMode: 'မှတ်စုစနစ်', exitNoteMode: 'မှတ်စုစနစ်မှ ထွက်မည်',
    aboutAugorithm: 'Augorithm အကြောင်း', updateHint: 'ဗားရှင်းအချက်အလက်နှင့် အလိုအလျောက်အပ်ဒိတ်များ။',
    updateReady: 'Augorithm သည် နောက်ဆုံးဗားရှင်းဖြစ်သည်', checkUpdates: 'အပ်ဒိတ်စစ်ဆေးမည်',
    checkingUpdates: 'အပ်ဒိတ်စစ်ဆေးနေသည်…', updateAvailable: 'ဗားရှင်း {version} ရရှိနိုင်သည်',
    downloadingUpdate: 'ဗားရှင်း {version} ကို ဒေါင်းလုဒ်လုပ်နေသည်… {percent}%',
    restartUpdate: 'ပြန်ဖွင့်ပြီး အပ်ဒိတ်လုပ်မည်', reloadUpdate: 'ပြန်တင်ပြီး အပ်ဒိတ်လုပ်မည်',
    updateDownloaded: 'ဗားရှင်း {version} အဆင်သင့်ဖြစ်ပါပြီ', updateError: 'အပ်ဒိတ်စစ်ဆေးမှု မအောင်မြင်ပါ',
    updateCurrent: 'နောက်ဆုံးဗားရှင်းကို အသုံးပြုနေပါသည်။',
    updateDevelopment: 'ထည့်သွင်းထားသော app တွင် အလိုအလျောက်အပ်ဒိတ် ရရှိနိုင်သည်။',
    automaticUpdates: 'အပ်ဒိတ်များကို အလိုအလျောက်စစ်ဆေးသည်။ ဒေါင်းလုဒ်ပြီးသောအပ်ဒိတ်ကို Augorithm ပြန်ဖွင့်ချိန်တွင် ထည့်သွင်းမည်။',
    normalizationLab: 'ဒေတာဘေ့စ် NORMALIZATION',
    normalizationHint: 'ဇယားတစ်ခုကို သတ်မှတ်ပြီး 1NF၊ 2NF နှင့် 3NF အထိ စစ်ဆေးပါ။',
    loadExample: 'နမူနာထည့်မည်', analyzeNormalize: 'စစ်ဆေးပြီး ခွဲမည်',
    relationName: 'Relation အမည်', attributes: 'Attribute များ (ကော်မာဖြင့်ခွဲရန်)',
    primaryKey: 'Primary key', functionalDependencies: 'Functional dependency များ (တစ်ကြောင်းလျှင်တစ်ခု)',
    normalizationEmpty: 'ဇယားအချက်အလက်ထည့်ပြီး စစ်ဆေးပါ။',
    pythonWorkspace: 'PYTHON စာတည်းဖြတ်စနစ်',
    pythonHint: 'Pseudocode မှ Python ထုတ်ပြီး desktop app တွင် ပြင်ဆင်ကာ လုပ်ဆောင်ပါ။',
    generatePython: 'Pseudocode မှထုတ်မည်', exportPython: '.py ထုတ်မည်',
    runPython: 'Python လုပ်ဆောင်မည်', stopPython: 'ရပ်မည်', editablePython: 'ပြင်နိုင်သည်',
    pythonEditorReady: 'အသင့်ဖြစ်ပြီ · ⌘/Ctrl + Enter ဖြင့်လုပ်ဆောင်ပါ',
    standardInput: 'ထည့်သွင်းတန်ဖိုး', pythonOutput: 'အထွက်'
  }
};

let uiLanguage = localStorage.getItem('augorithm.uiLanguage') === 'my' ? 'my' : 'en';
let uiTheme = localStorage.getItem('augorithm.theme') === 'dark' ? 'dark' : 'light';
const storedNoteMode = localStorage.getItem('augorithm.noteMode');
let noteMode = storedNoteMode === 'true';
const t = key => translations[uiLanguage][key] || translations.en[key] || key;
const tf = (key, values = {}) => Object.entries(values)
  .reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), t(key));
let appInfo = {
  name: 'Augorithm',
  version: APP_VERSION,
  platform: window.augorithm.platform || 'browser',
  packaged: false,
  updateSupported: true
};
let lastUpdateState = { status: 'idle', version: APP_VERSION };

function renderVersionInfo() {
  const version = appInfo.version || APP_VERSION;
  $('#versionBtn').textContent = `v${version}`;
  $('#currentVersion').textContent = `Version ${version}`;
}

function renderUpdateState(state = lastUpdateState) {
  lastUpdateState = { ...lastUpdateState, ...state };
  const status = lastUpdateState.status || 'idle';
  const version = lastUpdateState.version || appInfo.version || APP_VERSION;
  const percent = Math.round(lastUpdateState.percent || 0);
  const card = $('.update-card');
  const icon = $('#updateStatusIcon');
  const title = $('#updateStatusTitle');
  const message = $('#updateStatusMessage');
  const action = $('#updateActionBtn');
  const progress = $('#updateProgress');
  const progressBar = $('#updateProgressBar');
  if (!card || !action) return;
  card.dataset.status = status;
  progress.hidden = status !== 'downloading';
  progressBar.style.width = `${percent}%`;
  action.disabled = status === 'checking' || status === 'downloading' ||
    (status === 'available' && !lastUpdateState.web);
  action.dataset.action = status === 'downloaded' || (status === 'available' && lastUpdateState.web)
    ? 'install'
    : 'check';

  const views = {
    idle: ['✓', t('updateReady'), t('updateCurrent'), t('checkUpdates')],
    current: ['✓', t('updateReady'), t('updateCurrent'), t('checkUpdates')],
    checking: ['↻', t('checkingUpdates'), '', t('checkingUpdates')],
    available: ['↓', tf('updateAvailable', { version }), lastUpdateState.web ? '' : t('automaticUpdates'),
      lastUpdateState.web ? t('reloadUpdate') : t('checkingUpdates')],
    downloading: ['↓', tf('downloadingUpdate', { version, percent }), '', tf('downloadingUpdate', { version, percent })],
    downloaded: ['↻', tf('updateDownloaded', { version }), t('automaticUpdates'), t('restartUpdate')],
    development: ['i', `Augorithm ${version}`, t('updateDevelopment'), t('checkUpdates')],
    error: ['!', t('updateError'), lastUpdateState.message || '', t('checkUpdates')]
  };
  const view = views[status] || views.idle;
  [icon.textContent, title.textContent, message.textContent, action.textContent] = view;
}

async function initializeVersionInfo() {
  try {
    appInfo = { ...appInfo, ...(await window.augorithm.getAppInfo()) };
  } catch {
    // Keep the embedded version for the browser fallback.
  }
  renderVersionInfo();
  renderUpdateState(lastUpdateState);
}

function openVersionDialog(checkNow = false) {
  renderVersionInfo();
  renderUpdateState(lastUpdateState);
  if (!$('#versionDialog').open) $('#versionDialog').showModal();
  if (checkNow) checkForAppUpdate();
}

async function checkForAppUpdate() {
  renderUpdateState({ status: 'checking' });
  try {
    const state = await window.augorithm.checkForUpdates();
    if (state) renderUpdateState(state);
  } catch (error) {
    renderUpdateState({ status: 'error', message: error.message });
  }
}

async function handleUpdateAction() {
  if ($('#updateActionBtn').dataset.action === 'install') {
    await window.augorithm.installUpdate();
    return;
  }
  await checkForAppUpdate();
}

function localizedDiagnostic(message) {
  if (uiLanguage !== 'my') return message;
  const exact = {
    'End If has no matching If.': 'End If နှင့် ကိုက်ညီသော If မရှိပါ။',
    'End While has no matching loop.': 'End While နှင့် ကိုက်ညီသော While မရှိပါ။',
    'Next has no matching For.': 'Next နှင့် ကိုက်ညီသော For မရှိပါ။',
    'Else If has no matching If.': 'Else If နှင့် ကိုက်ညီသော If မရှိပါ။',
    'Else has no matching If.': 'Else နှင့် ကိုက်ညီသော If မရှိပါ။',
    'Add a type: Declare name As Integer.': 'ဒေတာအမျိုးအစားထည့်ပါ: Declare name As Integer.',
    'Assignment needs =, ←, <-, or :=.': 'တန်ဖိုးသတ်မှတ်ရန် =, ←, <- သို့မဟုတ် := လိုအပ်သည်။',
    'Use: For index = 1 To 10 Step 1.': 'ဤပုံစံကိုသုံးပါ: For index = 1 To 10 Step 1.',
    'Add “START” or “Program Main” at the beginning.': 'အစတွင် “START” သို့မဟုတ် “Program Main” ထည့်ပါ။',
    'Add “End Program” at the end.': 'အဆုံးတွင် “END” သို့မဟုတ် “End Program” ထည့်ပါ။'
  };
  if (exact[message]) return exact[message];
  if (message.startsWith('Unknown statement:')) return `မသိသော ဖော်ပြချက်:${message.slice('Unknown statement:'.length)}`;
  if (message.startsWith('Unclosed ')) return `မပိတ်ရသေးသော block: ${message.slice(9)}`;
  if (message.startsWith('Next ') && message.includes(' does not match For ')) {
    return `NEXT ကိန်းရှင်သည် FOR ကိန်းရှင်နှင့် မကိုက်ညီပါ: ${message}`;
  }
  return message;
}

function localizedNodeText(value) {
  const key = {
    Start: 'start', End: 'end', Main: 'main', If: 'if', 'Else If': 'elseIf', Else: 'else',
    'End If': 'endIf', 'End While': 'endWhile', 'End For': 'endFor', Next: 'next',
    Input: 'input', Output: 'output', Declare: 'declare', Assign: 'assign',
    While: 'while', For: 'for', Comment: 'comment',
    'Program entry': 'programEntry', 'Program exit': 'programExit'
  }[value];
  return key ? t(key) : value;
}

function renderTemplateGrid() {
  const host = $('#templateGrid');
  if (!host) return;
  host.innerHTML = templates.map((template, i) => `<button class="template-card" data-template="${i}">
    <i>${template.icon}</i><strong>${escapeHTML(template.name)}</strong><span>${escapeHTML(template.subtitle)}</span><b>${escapeHTML(t('useTemplate'))}</b>
  </button>`).join('');
  $$('[data-template]').forEach(button => button.addEventListener('click', () => loadTemplate(+button.dataset.template)));
}

function applyUILanguage(language) {
  uiLanguage = language === 'my' ? 'my' : 'en';
  localStorage.setItem('augorithm.uiLanguage', uiLanguage);
  document.documentElement.lang = uiLanguage === 'my' ? 'my' : 'en';
  document.body.dataset.language = uiLanguage;
  $('#uiLanguage').value = uiLanguage;
  $$('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  $('#consoleInput').placeholder = t('runToEnter');
  updateThemeButton();
  updateNoteModeButton();
  renderVersionInfo();
  renderUpdateState(lastUpdateState);
  renderTemplateGrid();
  if (state.items.length) build();
}

function updateThemeButton() {
  const button = $('#themeToggle');
  if (!button) return;
  const isDark = uiTheme === 'dark';
  button.textContent = isDark ? '☀' : '☾';
  button.title = t(isDark ? 'lightMode' : 'darkMode');
  button.setAttribute('aria-label', button.title);
}

function applyTheme(theme) {
  uiTheme = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem('augorithm.theme', uiTheme);
  document.body.dataset.theme = uiTheme;
  updateThemeButton();
  state.flowLayoutKey = null;
  if (state.items.length) renderFlowchart();
  requestAnimationFrame(drawDecisionConnectors);
}

function toggleTheme() {
  applyTheme(uiTheme === 'dark' ? 'light' : 'dark');
}

function updateNoteModeButton() {
  const button = $('#noteModeToggle');
  if (!button) return;
  button.textContent = noteMode ? '↙' : '✎';
  button.title = t(noteMode ? 'exitNoteMode' : 'noteMode');
  button.setAttribute('aria-label', button.title);
}

function applyNoteMode(enabled) {
  noteMode = Boolean(enabled);
  localStorage.setItem('augorithm.noteMode', String(noteMode));
  document.body.classList.toggle('note-mode', noteMode);
  updateNoteModeButton();
  if (noteMode) {
    activateTab('pseudo');
    $('#codeEditor').focus();
  }
  requestAnimationFrame(drawDecisionConnectors);
}

function toggleNoteMode() {
  applyNoteMode(!noteMode);
}

const templates = [
  {
    name: 'Hello, World!', subtitle: 'Output your first message', icon: '✦',
    code: `Program Main
    Output "Hello from Augorithm!"
End Program`
  },
  {
    name: 'Area Calculator', subtitle: 'Variables, input, and arithmetic', icon: '◯',
    code: `Program Main
    Declare radius As Real
    Declare area As Real
    Output "Enter the circle radius:"
    Input radius
    Set area = 3.14159 * radius * radius
    Output "Area = " + area
End Program`
  },
  {
    name: 'Grade Classifier', subtitle: 'Nested decisions and branches', icon: '◇',
    code: `Program Main
    Declare score As Integer
    Output "Enter your score:"
    Input score
    If score >= 80 Then
        Output "Distinction"
    Else
        If score >= 50 Then
            Output "Pass"
        Else
            Output "Try again"
        End If
    End If
End Program`
  },
  {
    name: 'Counting Loop', subtitle: 'Repeat with a While loop', icon: '↻',
    code: `Program Main
    Declare count As Integer
    Set count = 1
    While count <= 10
        Output count
        Set count = count + 1
    End While
End Program`
  },
  {
    name: 'Number Guess', subtitle: 'Interactive mini-program', icon: '#',
    code: `Program Main
    Declare secret As Integer
    Declare guess As Integer
    Set secret = 7
    Set guess = 0
    Output "Guess a number from 1 to 10:"
    While guess != secret
        Input guess
        If guess < secret Then
            Output "Higher"
        Else
            If guess > secret Then
                Output "Lower"
            Else
                Output "Correct!"
            End If
        End If
    End While
End Program`
  },
  {
    name: 'Temperature Check', subtitle: 'Input, comparison, and output', icon: '⌁',
    code: `Program Main
    Declare temperature As Real
    Output "Temperature in Celsius:"
    Input temperature
    If temperature > 30 Then
        Output "It is hot today."
    Else
        Output "The weather is comfortable."
    End If
End Program`
  }
];

const kindInfo = {
  start: { title: 'Start', icon: '▶', color: '#63547f' },
  end: { title: 'End', icon: '■', color: '#63547f' },
  declare: { title: 'Declare', icon: '▣', color: '#9b8e3f' },
  input: { title: 'Input', icon: '⌨', color: '#4d8fb6' },
  output: { title: 'Output', icon: '▰', color: '#5e9b69' },
  assign: { title: 'Assign', icon: '=', color: '#b08a2d' },
  if: { title: 'If', icon: '◇', color: '#e16c17' },
  call: { title: 'Call', icon: '▣', color: '#8239ac' },
  while: { title: 'While', icon: '⬡', color: '#b17c2c' },
  for: { title: 'For', icon: '⬡', color: '#b17c2c' },
  do: { title: 'Do', icon: '⬡', color: '#b17c2c' },
  comment: { title: 'Comment', icon: '≡', color: '#667085' },
  breakpoint: { title: 'Breakpoint', icon: '⬢', color: '#c00000' }
};

const snippets = {
  input: 'Input value',
  output: 'Output value',
  declare: 'Declare value As Integer',
  assign: 'Set value = 0',
  if: 'If value > 0 Then\n    Output "Positive"\nElse\n    Output "Not positive"\nEnd If',
  call: 'Call FunctionName',
  while: 'While value < 10\n    Set value = value + 1\nEnd While',
  for: 'For index = 1 To 10 Step 1\n    Output index\nNext index',
  do: 'Do\n    Set value = value + 1\nWhile value < 10',
  comment: '// Explain this step',
  breakpoint: 'Breakpoint'
};

const state = {
  filePath: null,
  createdAt: null,
  dirty: false,
  selectedLine: null,
  zoom: 1,
  items: [],
  diagnostics: [],
  variables: {},
  trace: [],
  flowLayoutKey: null,
  guidedInputs: [],
  awaitingInput: null,
  pythonRunning: false,
  toastTimer: null,
  recoveryTimer: null,
  flowObserver: null,
  projectNameEdited: false,
  projectDocument: null,
  sourceDrafts: {},
  customConnections: [],
  selectedConnectionId: null,
  connectionMode: false,
  connectionSourceLine: null
};

const recoveryKey = 'augorithm.recovery.v1';
const fileName = filePath => String(filePath || '').split(/[\\/]/).at(-1);
const modernizeForClosers = source => String(source || '').replace(
  /^(\s*)end\s*for(?:\s+([A-Za-z_]\w*))?\s*$/gim,
  (_match, indent, variable) => `${indent}Next${variable ? ` ${variable}` : ''}`
);

function updateEditorFileName() {
  const target = $('#editorFileName');
  if (!target) return;
  const name = ($('#projectName').value || 'Untitled')
    .trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'Untitled';
  target.textContent = `${name}.augo`;
}

function humanizeIdentifier(value) {
  return String(value || '')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\p{L}/gu, letter => letter.toUpperCase());
}

function suggestedProjectName() {
  const lines = logicalSourceLines($('#codeEditor').value)
    .map(entry => normalizeStatement(entry.raw).trim())
    .filter(Boolean);
  const inputs = lines
    .filter(line => /^(input|read)\s+/i.test(line))
    .map(line => humanizeIdentifier(line.replace(/^(input|read)\s+/i, '').split(/[,\s]/)[0]))
    .filter(Boolean);
  const output = lines.find(line => /^(output|display|print)\b/i.test(line));
  if (output) {
    const expression = output.replace(/^(output|display|print)\s*/i, '').trim();
    const quoted = expression.match(/["“](.+?)["”]/)?.[1];
    if (quoted) return humanizeIdentifier(quoted).split(' ').slice(0, 6).join(' ') || 'Output';
    const result = humanizeIdentifier(expression.split(',')[0]);
    const normalized = result.toLowerCase();
    const action = normalized === 'max' ? 'Find Maximum'
      : normalized === 'min' ? 'Find Minimum'
        : normalized === 'average' ? 'Calculate Average'
          : normalized === 'sum' ? 'Calculate Sum'
            : result;
    const usefulInput = [...inputs].reverse().find(name => !/^(First )?Data$/i.test(name)) || inputs.at(-1);
    const alreadyNamed = usefulInput && action.toLowerCase().includes(usefulInput.toLowerCase());
    return `${action || 'Output'}${usefulInput && !alreadyNamed ? ` of ${usefulInput}` : ''}`;
  }
  if (inputs.length) return `${inputs.slice(0, 2).join(' and ')} Input`;
  const firstAction = lines.find(line => !/^(start|end|program\b)/i.test(line));
  return humanizeIdentifier(firstAction || 'Untitled Algorithm').split(' ').slice(0, 6).join(' ');
}

function syncAutomaticProjectName(force = false) {
  if (state.projectNameEdited && !force) return;
  $('#projectName').value = suggestedProjectName() || 'Untitled Algorithm';
  updateEditorFileName();
}

function currentProject() {
  const preserved = state.projectDocument?.schemaVersion === 2 ? state.projectDocument : {};
  const now = new Date().toISOString();
  return {
    ...preserved,
    schemaVersion: 2,
    name: $('#projectName').value || 'Untitled Algorithm',
    code: modernizeForClosers($('#codeEditor').value),
    updatedAt: now,
    activePageId: preserved.activePageId || 'page-main',
    pages: Array.isArray(preserved.pages) ? preserved.pages : [],
    database: {
      name: $('#relationName')?.value || '',
      attributes: $('#dbAttributes')?.value || '',
      primaryKey: $('#dbPrimaryKey')?.value || '',
      dependencies: $('#dbDependencies')?.value || ''
    },
    python: {
      code: $('#pythonEditor')?.value || '',
      input: $('#pythonInput')?.value || ''
    },
    generatedSource: {
      drafts: { ...state.sourceDrafts }
    },
    diagramConnections: state.customConnections.map(connection => ({ ...connection })),
    preferences: {
      theme: document.documentElement.dataset.theme || preserved.preferences?.theme || 'system',
      snapToGrid: preserved.preferences?.snapToGrid ?? true,
      gridSize: preserved.preferences?.gridSize || 20,
      language: document.documentElement.lang === 'my' ? 'my' : 'en',
      ...preserved.preferences
    },
    version: 4,
    createdAt: state.createdAt || preserved.createdAt || now
  };
}

function saveRecoveryDraft() {
  clearTimeout(state.recoveryTimer);
  state.recoveryTimer = null;
  try {
    localStorage.setItem(recoveryKey, JSON.stringify({
      project: currentProject(),
      filePath: state.filePath,
      recoveredAt: new Date().toISOString()
    }));
  } catch {}
}

function scheduleRecoveryDraft() {
  clearTimeout(state.recoveryTimer);
  state.recoveryTimer = setTimeout(saveRecoveryDraft, 250);
}

function assignmentFrom(text) {
  const source = text.trim();
  const body = source.replace(/^(?:set|let)\s+/i, '');
  let match = body.match(/^([A-Za-z_]\w*)\s*(←|<-|:=|=(?!=))\s*(.+)$/);
  if (match) return { name: match[1], expression: match[3] };

  match = body.match(/^([A-Za-z_]\w*)\s+(?:to|be)\s+(.+)$/i);
  if (match) return { name: match[1], expression: match[2] };

  match = source.match(/^add\s+(.+?)\s+to\s+([A-Za-z_]\w*)$/i);
  if (match) return { name: match[2], expression: `${match[2]} + (${match[1]})` };
  match = source.match(/^subtract\s+(.+?)\s+from\s+([A-Za-z_]\w*)$/i);
  if (match) return { name: match[2], expression: `${match[2]} - (${match[1]})` };
  match = source.match(/^multiply\s+([A-Za-z_]\w*)\s+by\s+(.+)$/i);
  if (match) return { name: match[1], expression: `${match[1]} * (${match[2]})` };
  match = source.match(/^divide\s+([A-Za-z_]\w*)\s+by\s+(.+)$/i);
  if (match) return { name: match[1], expression: `${match[1]} / (${match[2]})` };
  match = source.match(/^increment\s+([A-Za-z_]\w*)$/i);
  if (match) return { name: match[1], expression: `${match[1]} + 1` };
  match = source.match(/^decrement\s+([A-Za-z_]\w*)$/i);
  if (match) return { name: match[1], expression: `${match[1]} - 1` };
  return null;
}

function normalizeExpression(expression) {
  return expression
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/<>/g, '!=')
    .replace(/\^/g, '**')
    .replace(/(?<!&)&(?!&)/g, '+')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function sourceExpression(expression, language, { condition = false } = {}) {
  const source = normalizeExpression(expression);
  const parts = source.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part;
    let result = part.replace(/\bMOD\b/gi, '%');
    if (condition) result = result.replace(/(?<![<>=!])=(?!=)/g, language === 'javascript' ? '===' : '==');
    if (language === 'python') {
      return result
        .replace(/\bAND\b/gi, 'and')
        .replace(/\bOR\b/gi, 'or')
        .replace(/\bNOT\b/gi, 'not')
        .replace(/\bTRUE\b/gi, 'True')
        .replace(/\bFALSE\b/gi, 'False');
    }
    return result
      .replace(/\bAND\b/gi, '&&')
      .replace(/\bOR\b/gi, '||')
      .replace(/\bNOT\b/gi, '!')
      .replace(/\bTRUE\b/gi, 'true')
      .replace(/\bFALSE\b/gi, 'false');
  }).join('');
}

function normalizeStatement(raw) {
  let text = raw.trim().replace(/;\s*$/, '');
  if (!text) return '';
  if (/^(begin|start)$/i.test(text)) return 'START';
  if (/^(stop|finish)$/i.test(text)) return 'END';
  if (/^(endif|end_if|fi)$/i.test(text)) return 'END IF';
  if (/^(endwhile|end_while|wend)$/i.test(text)) return 'END WHILE';
  if (/^(endfor|end_for)$/i.test(text)) return 'END FOR';
  const nextMatch = text.match(/^next(?:\s+([A-Za-z_]\w*))?$/i);
  if (nextMatch) return `END FOR${nextMatch[1] ? ` ${nextMatch[1]}` : ''}`;
  if (/^elif\b/i.test(text)) text = text.replace(/^elif\b/i, 'ELSE IF');
  if (/^else\s*:\s*$/i.test(text)) return 'ELSE';

  const naturalAssignment = assignmentFrom(text);
  if (naturalAssignment && /^(?:set|let|add|subtract|multiply|divide|increment|decrement)\b/i.test(text)) {
    return `SET ${naturalAssignment.name} = ${naturalAssignment.expression}`;
  }

  if (/^(?:print|display|write)\s+(?:(?:a|the)\s+)?(?:new\s*line|newline|blank\s+line)\s*$/i.test(text)) {
    return 'OUTPUT ""';
  }
  if (/^(?:print|display|write)\s*$/i.test(text)) return 'OUTPUT ""';
  let match = text.match(/^(?:print|display|write)\s*\((.*)\)\s*$/i);
  if (match) return `OUTPUT ${match[1]}`;
  match = text.match(/^(?:print|display|write)\s+(.+)$/i);
  if (match) return `OUTPUT ${match[1]}`;
  match = text.match(/^(?:read|scan|get)\s*\((.*)\)\s*$/i);
  if (match) return `INPUT ${match[1]}`;
  match = text.match(/^(?:read|scan|get)\s+(.+)$/i);
  if (match) return `INPUT ${match[1]}`;

  match = text.match(/^else\s+if\s*\((.*)\)\s*(?:then)?\s*:?\s*$/i);
  if (match) return `ELSE IF ${match[1]} THEN`;
  match = text.match(/^else\s+if\s+(.+?)\s*(?:then)?\s*:?\s*$/i);
  if (match) return `ELSE IF ${match[1].replace(/\s+then$/i, '')} THEN`;
  match = text.match(/^if\s*\((.*)\)\s*(?:then)?\s*:?\s*$/i);
  if (match) return `IF ${match[1]} THEN`;
  match = text.match(/^if\s+(.+?)\s*(?:then)?\s*:?\s*$/i);
  if (match) return `IF ${match[1].replace(/\s+then$/i, '')} THEN`;
  match = text.match(/^while\s*\((.*)\)\s*(?:do)?\s*:?\s*$/i);
  if (match) return `WHILE ${match[1]}`;
  match = text.match(/^while\s+(.+?)\s*(?:do)?\s*:?\s*$/i);
  if (match) return `WHILE ${match[1].replace(/\s+do$/i, '')}`;
  return text;
}

function quoteMask(text) {
  let quote = null;
  let escaped = false;
  return [...text].map(character => {
    if (escaped) {
      escaped = false;
      return quote ? ' ' : character;
    }
    if (character === '\\' && quote) {
      escaped = true;
      return ' ';
    }
    if (quote) {
      if (character === quote) quote = null;
      return ' ';
    }
    if (character === '"' || character === "'") {
      quote = character;
      return ' ';
    }
    return character;
  }).join('');
}

function splitInlineStatements(raw) {
  const text = String(raw || '').trim();
  if (!text) return [''];
  const mask = quoteMask(text);
  const opener = mask.match(/^(?:(?:else\s+)?if\b[\s\S]*?\bthen\b)/i);
  if (opener && /\S/.test(text.slice(opener[0].length))) {
    return [
      text.slice(0, opener[0].length).trim(),
      ...splitInlineStatements(text.slice(opener[0].length))
    ].filter(Boolean);
  }
  const elseOnly = mask.match(/^else\b/i);
  if (elseOnly && /\S/.test(text.slice(elseOnly[0].length))) {
    return ['Else', ...splitInlineStatements(text.slice(elseOnly[0].length))].filter(Boolean);
  }
  const boundaryPattern = /\b(?:else\s+if|else|end\s+if|endif|end_if|fi|end\s+while|endwhile|end_while|wend|end\s+for|endfor|end_for|next(?:\s+[A-Za-z_]\w*)?|end\s+program)\b/gi;
  const boundary = [...mask.matchAll(boundaryPattern)]
    .find(match => match.index > 0 && /\S/.test(mask.slice(0, match.index)));
  if (boundary) {
    return [
      text.slice(0, boundary.index).trim(),
      ...splitInlineStatements(text.slice(boundary.index))
    ].filter(Boolean);
  }
  return [text];
}

function logicalSourceLines(source) {
  return String(source || '').split(/\r?\n/).flatMap((raw, index) =>
    splitInlineStatements(raw).map(part => ({ raw: part, line: index + 1 })));
}

function parseForHeader(text) {
  const match = text.match(/^for\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/i);
  return match ? {
    variable: match[1],
    start: match[2],
    end: match[3],
    step: match[4] || '1'
  } : null;
}

function canonicalStatement(raw) {
  const original = raw.trim().replace(/;\s*$/, '');
  if (!original) return '';
  if (/^(\/\/|#)/.test(original)) return `// ${original.replace(/^(\/\/|#)\s*/, '')}`;
  let natural = original.match(/^(?:set|let)\s+([A-Za-z_]\w*)\s+(?:to|be)\s+(.+)$/i);
  if (natural) return `Set ${natural[1]} to ${natural[2].trim()}`;
  natural = original.match(/^add\s+(.+?)\s+to\s+([A-Za-z_]\w*)$/i);
  if (natural) return `Add ${natural[1].trim()} to ${natural[2]}`;
  natural = original.match(/^subtract\s+(.+?)\s+from\s+([A-Za-z_]\w*)$/i);
  if (natural) return `Subtract ${natural[1].trim()} from ${natural[2]}`;
  natural = original.match(/^multiply\s+([A-Za-z_]\w*)\s+by\s+(.+)$/i);
  if (natural) return `Multiply ${natural[1]} by ${natural[2].trim()}`;
  natural = original.match(/^divide\s+([A-Za-z_]\w*)\s+by\s+(.+)$/i);
  if (natural) return `Divide ${natural[1]} by ${natural[2].trim()}`;
  natural = original.match(/^(increment|decrement)\s+([A-Za-z_]\w*)$/i);
  if (natural) return `${natural[1][0].toUpperCase()}${natural[1].slice(1).toLowerCase()} ${natural[2]}`;
  natural = original.match(/^(?:print|display|write)\s+(?:(?:a|the)\s+)?(?:new\s*line|newline|blank\s+line)\s*$/i);
  if (natural) return 'Display newline';
  natural = original.match(/^display\s+(.+)$/i);
  if (natural) return `Display ${natural[1].trim()}`;
  const text = normalizeStatement(original);
  const lower = text.toLowerCase();
  const assignment = assignmentFrom(text);
  const loop = parseForHeader(text);

  if (lower === 'start') return 'START';
  if (lower === 'end') return 'END';
  if (lower.startsWith('program ')) return `Program ${text.slice(8).trim() || 'Main'}`;
  if (lower === 'end program') return 'End Program';
  if (lower.startsWith('end if')) return 'End If';
  if (lower.startsWith('end while')) return 'End While';
  if (lower.startsWith('end for')) {
    const variable = text.slice(7).trim();
    return `Next${variable ? ` ${variable}` : ''}`;
  }
  if (lower.startsWith('else if ')) {
    return `Else If ${text.replace(/^else\s+if\s+|\s+then$/gi, '')} Then`;
  }
  if (lower === 'else') return 'Else';
  if (lower.startsWith('if ')) return `If ${text.replace(/^if\s+|\s+then$/gi, '')} Then`;
  if (lower.startsWith('while ')) return `While ${text.slice(6).trim()}`;
  if (loop) return `For ${loop.variable} = ${loop.start} To ${loop.end}${loop.step === '1' ? '' : ` Step ${loop.step}`}`;
  if (lower.startsWith('for ')) return `For ${text.slice(4).trim()}`;
  if (lower.startsWith('declare ')) return `Declare ${text.slice(8).trim()}`;
  if (lower.startsWith('input ')) return `Input ${text.slice(6).trim()}`;
  if (lower.startsWith('output ')) return `Output ${text.slice(7).trim()}`;
  if (assignment) return `Set ${assignment.name} = ${assignment.expression.trim()}`;
  const missingAssignment = original.match(/^(?:set|let)\s+([A-Za-z_]\w*)\s+(.+)$/i);
  if (missingAssignment) return `Set ${missingAssignment[1]} = ${missingAssignment[2].trim()}`;
  return text;
}

function blockRole(statement) {
  const lower = statement.toLowerCase();
  if (lower === 'start' || lower.startsWith('program ')) return { action: 'open', type: 'program' };
  if (lower === 'end' || lower === 'end program') return { action: 'close', type: 'program' };
  if (lower.startsWith('end if')) return { action: 'close', type: 'if' };
  if (lower.startsWith('end while')) return { action: 'close', type: 'while' };
  if (lower.startsWith('end for') || lower === 'next' || lower.startsWith('next ')) return { action: 'close', type: 'for' };
  if (lower.startsWith('else if ') || lower === 'else') return { action: 'branch', type: 'if' };
  if (lower.startsWith('if ')) return { action: 'open', type: 'if' };
  if (lower.startsWith('while ')) return { action: 'open', type: 'while' };
  if (lower.startsWith('for ')) return { action: 'open', type: 'for' };
  return { action: 'statement', type: null };
}

function closingStatement(block) {
  if (block.type === 'program') return block.keyword === 'start' ? 'END' : 'End Program';
  if (block.type === 'if') return 'End If';
  if (block.type === 'while') return 'End While';
  return `Next${block.variable ? ` ${block.variable}` : ''}`;
}

function formatPseudocodeSource(source) {
  const output = [];
  let depth = 0;
  let previousBlank = false;
  logicalSourceLines(source).forEach(({ raw }) => {
    const statement = canonicalStatement(raw);
    if (!statement) {
      if (output.length && !previousBlank) output.push('');
      previousBlank = true;
      return;
    }
    previousBlank = false;
    const role = blockRole(statement);
    if (role.action === 'close' || role.action === 'branch') depth = Math.max(0, depth - 1);
    output.push(`${'    '.repeat(depth)}${statement}`);
    if (role.action === 'open' || role.action === 'branch') depth++;
  });
  while (output.at(-1) === '') output.pop();
  return output.join('\n');
}

function safelyRepairStructure(source) {
  let fixes = 0;
  const canonical = logicalSourceLines(source).map(({ raw }) => canonicalStatement(raw));
  const meaningful = canonical.filter(Boolean);
  if (!meaningful.some(line => line.toLowerCase() === 'start' || line.toLowerCase().startsWith('program '))) {
    canonical.unshift('Program Main', '');
    fixes++;
  }

  const output = [];
  const stack = [];
  canonical.forEach(statement => {
    if (!statement) {
      output.push('');
      return;
    }
    const role = blockRole(statement);
    if (role.action === 'open') {
      const loop = role.type === 'for' ? parseForHeader(statement) : null;
      stack.push({
        type: role.type,
        variable: loop?.variable || null,
        keyword: statement.toLowerCase() === 'start' ? 'start' : 'program'
      });
      output.push(statement);
      return;
    }
    if (role.action === 'close') {
      const matchingIndex = stack.map(block => block.type).lastIndexOf(role.type);
      if (matchingIndex < 0) {
        fixes++;
        return;
      }
      while (stack.length - 1 > matchingIndex) {
        output.push(closingStatement(stack.pop()));
        fixes++;
      }
      const block = stack.pop();
      if (role.type === 'for') {
        const corrected = closingStatement(block);
        if (statement.toLowerCase() !== corrected.toLowerCase()) fixes++;
        output.push(corrected);
      } else {
        output.push(closingStatement(block));
      }
      return;
    }
    output.push(statement);
  });
  while (stack.length) {
    output.push(closingStatement(stack.pop()));
    fixes++;
  }
  return { source: output.join('\n'), fixes };
}

function replaceEditorText(value, message, selectionStart = null, selectionEnd = null) {
  const editor = $('#codeEditor');
  const changed = editor.value !== value;
  editor.value = value;
  const start = Math.min(selectionStart ?? editor.value.length, editor.value.length);
  const end = Math.min(selectionEnd ?? start, editor.value.length);
  editor.setSelectionRange(start, end);
  if (changed) markDirty();
  build();
  updateEditorCursor();
  if (message) $('#editorMessage').textContent = message;
  return changed;
}

function formatPseudocode() {
  const editor = $('#codeEditor');
  const cursor = editor.selectionStart;
  const formatted = formatPseudocodeSource(editor.value);
  replaceEditorText(formatted, t('formatted'), cursor, cursor);
  editor.focus();
}

function autoFixPseudocode({ quiet = false } = {}) {
  const editor = $('#codeEditor');
  const beforeErrors = parse(editor.value).diagnostics.length;
  const repair = safelyRepairStructure(editor.value);
  const formatted = formatPseudocodeSource(repair.source);
  replaceEditorText(formatted, null, editor.selectionStart, editor.selectionEnd);
  const fixed = Math.max(repair.fixes, beforeErrors - state.diagnostics.length);
  $('#editorMessage').textContent = fixed
    ? tf('fixedCount', { count: fixed })
    : quiet ? t('tabHint') : t('noSafeFix');
  editor.focus();
  return fixed;
}

function indentEditorSelection(outdent = false) {
  const editor = $('#codeEditor');
  const value = editor.value;
  const selectionStart = editor.selectionStart;
  const selectionEnd = editor.selectionEnd;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let lineEnd = value.indexOf('\n', selectionEnd);
  if (lineEnd < 0) lineEnd = value.length;
  const selected = value.slice(lineStart, lineEnd);
  const singleCaret = selectionStart === selectionEnd && !selected.includes('\n');

  if (singleCaret && !outdent) {
    const column = selectionStart - lineStart;
    const spaces = 4 - (column % 4);
    editor.setRangeText(' '.repeat(spaces), selectionStart, selectionEnd, 'end');
  } else {
    const lines = selected.split('\n');
    let removedFromFirst = 0;
    const replacement = lines.map((line, index) => {
      if (!outdent) return `    ${line}`;
      const removed = Math.min(4, line.match(/^ */)?.[0].length || 0);
      if (index === 0) removedFromFirst = removed;
      return line.slice(removed);
    }).join('\n');
    editor.setRangeText(replacement, lineStart, lineEnd, 'select');
    if (outdent) editor.setSelectionRange(
      Math.max(lineStart, selectionStart - removedFromFirst),
      Math.max(lineStart, selectionEnd - (selected.length - replacement.length))
    );
  }
  markDirty();
  build();
  updateEditorCursor();
}

function expectedCloser(statement) {
  const role = blockRole(canonicalStatement(statement));
  if (role.action !== 'open' || role.type === 'program') return null;
  return role.type === 'if' ? 'End If' : role.type === 'while' ? 'End While' : 'Next';
}

function handleEditorKeyDown(event) {
  const editor = event.currentTarget;
  if (event.key === 'Tab') {
    event.preventDefault();
    indentEditorSelection(event.shiftKey);
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    formatPseudocode();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key === '.') {
    event.preventDefault();
    autoFixPseudocode();
    return;
  }
  if (event.key === 'Backspace' && editor.selectionStart === editor.selectionEnd) {
    const start = editor.selectionStart;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const before = editor.value.slice(lineStart, start);
    if (before && /^ +$/.test(before)) {
      event.preventDefault();
      const remove = before.length % 4 || 4;
      editor.setRangeText('', start - remove, start, 'end');
      markDirty(); build(); updateEditorCursor();
    }
    return;
  }
  if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey) return;
  event.preventDefault();
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = editor.value.indexOf('\n', start);
  if (lineEnd < 0) lineEnd = editor.value.length;
  const currentLine = editor.value.slice(lineStart, lineEnd);
  const baseIndent = currentLine.match(/^ */)?.[0] || '';
  const statement = currentLine.trim();
  const role = blockRole(canonicalStatement(statement));
  const bodyIndent = baseIndent + ((role.action === 'open' || role.action === 'branch') ? '    ' : '');
  const closer = expectedCloser(statement);
  const remaining = editor.value.slice(lineEnd);
  const hasCloser = closer && remaining.split(/\r?\n/).some(line =>
    canonicalStatement(line).toLowerCase().startsWith(closer.toLowerCase()));

  if (closer && start === lineEnd && !hasCloser) {
    const insertion = `\n${bodyIndent}\n${baseIndent}${closer}`;
    editor.setRangeText(insertion, start, end, 'end');
    const cursor = start + 1 + bodyIndent.length;
    editor.setSelectionRange(cursor, cursor);
  } else {
    editor.setRangeText(`\n${bodyIndent}`, start, end, 'end');
  }
  markDirty(); build(); updateEditorCursor();
}

function currentEditorLine() {
  const editor = $('#codeEditor');
  return editor.value.slice(0, editor.selectionStart).split('\n').length;
}

function updateEditorCursor() {
  const editor = $('#codeEditor');
  if (!editor) return;
  const before = editor.value.slice(0, editor.selectionStart);
  const line = before.split('\n').length;
  const column = before.length - before.lastIndexOf('\n');
  $('#cursorPosition').textContent = `Ln ${line}, Col ${column}`;
  $$('#lineNumbers > div').forEach((number, index) =>
    number.classList.toggle('active-line', index + 1 === line && !number.classList.contains('error-line')));
}

function parse(source) {
  const lines = logicalSourceLines(source);
  const physicalLineCount = String(source || '').split(/\r?\n/).length;
  const items = [];
  const diagnostics = [];
  const stack = [];
  let depth = 0;
  let branch = null;

  lines.forEach((entry, index) => {
    const { raw, line } = entry;
    const text = normalizeStatement(raw);
    if (!text) return;
    const lower = text.toLowerCase();
    let kind = 'comment', title = 'Comment', detail = text, closing = false;

    if (lower.startsWith('end if')) {
      closing = true; depth = Math.max(0, depth - 1); kind = 'if'; title = 'End If'; detail = 'Merge branches';
      if (stack.at(-1)?.type === 'if') stack.pop();
      else diagnostics.push({ line, type: 'error', message: 'End If has no matching If.' });
      branch = null;
    } else if (lower.startsWith('end while')) {
      closing = true; depth = Math.max(0, depth - 1); kind = 'while'; title = 'End While'; detail = 'Repeat / exit';
      if (stack.at(-1)?.type === 'while') stack.pop();
      else diagnostics.push({ line, type: 'error', message: 'End While has no matching loop.' });
      branch = null;
    } else if (lower.startsWith('end for')) {
      closing = true; depth = Math.max(0, depth - 1); kind = 'for'; title = 'Next';
      const closingVariable = text.slice(7).trim();
      const openLoop = stack.at(-1);
      detail = closingVariable ? `Next ${closingVariable} / exit` : 'Next value / exit';
      if (openLoop?.type === 'for') {
        if (closingVariable && openLoop.variable && closingVariable.toLowerCase() !== openLoop.variable.toLowerCase()) {
          diagnostics.push({ line, type: 'error', message: `Next ${closingVariable} does not match For ${openLoop.variable}.` });
        }
        stack.pop();
      }
      else diagnostics.push({ line, type: 'error', message: 'Next has no matching For.' });
      branch = null;
    } else if (lower.startsWith('else if ')) {
      kind = 'if'; title = 'Else If';
      detail = text.replace(/^else\s+if\s+|\s+then$/gi, '');
      if (stack.at(-1)?.type !== 'if') diagnostics.push({ line, type: 'error', message: 'Else If has no matching If.' });
      items.push({ line, logicalIndex: index, kind, title, detail, depth, branch: 'False', closing: false });
      branch = 'True';
      return;
    } else if (lower === 'else') {
      kind = 'if'; title = 'Else'; detail = 'False branch';
      if (stack.at(-1)?.type !== 'if') diagnostics.push({ line, type: 'error', message: 'Else has no matching If.' });
      items.push({ line, logicalIndex: index, kind, title, detail, depth, branch: 'False', closing: false });
      branch = null;
      return;
    } else if (lower === 'start' || lower.startsWith('program ')) {
      kind = 'start'; title = lower === 'start' ? 'Start' : (text.slice(8).trim() || 'Main'); detail = 'Program entry';
    } else if (lower === 'end program' || lower === 'end') {
      kind = 'end'; title = 'End'; detail = 'Program exit';
    } else if (lower === 'breakpoint') {
      kind = 'breakpoint'; title = 'Breakpoint'; detail = 'Debugging breakpoint';
    } else if (lower.startsWith('call ')) {
      kind = 'call'; title = 'Call'; detail = text.slice(5);
    } else if (lower.startsWith('declare ')) {
      kind = 'declare'; title = 'Declare'; detail = text.slice(8);
      if (!/\sas\s/i.test(text)) diagnostics.push({ line, type: 'warning', message: 'Add a type: Declare name As Integer.' });
    } else if (lower.startsWith('input ')) {
      kind = 'input'; title = 'Input'; detail = text.slice(6);
    } else if (lower.startsWith('output ')) {
      kind = 'output'; title = 'Output'; detail = text.slice(7);
    } else if (lower.startsWith('set ') || assignmentFrom(text)) {
      const assignment = assignmentFrom(text);
      kind = 'assign'; title = 'Assign';
      detail = assignment ? `${assignment.name} = ${normalizeExpression(assignment.expression)}` : text.slice(4);
      if (!assignment) diagnostics.push({ line, type: 'error', message: 'Assignment needs =, ←, <-, or :=.' });
    } else if (lower.startsWith('if ')) {
      kind = 'if'; detail = text.replace(/^if\s+|\s+then$/gi, ''); branch = 'True';
      items.push({ line, logicalIndex: index, kind, title: 'If', detail, depth, branch: null, closing: false });
      stack.push({ type: 'if', line }); depth++; return;
    } else if (lower.startsWith('while ')) {
      kind = 'while'; detail = text.slice(6);
      items.push({ line, logicalIndex: index, kind, title: 'While', detail, depth, branch: null, closing: false });
      stack.push({ type: 'while', line }); depth++; return;
    } else if (lower.startsWith('for ')) {
      const header = parseForHeader(text);
      kind = 'for'; detail = header ? `${header.variable} = ${header.start} to ${header.end}, step ${header.step}` : text.slice(4);
      items.push({ line, logicalIndex: index, kind, title: 'For', detail, depth, branch: null, closing: false });
      stack.push({ type: 'for', line, variable: header?.variable || null }); depth++;
      if (!header) diagnostics.push({ line, type: 'error', message: 'Use: For index = 1 To 10 Step 1.' });
      return;
    } else if (lower === 'do') {
      kind = 'do'; detail = 'Do loop start';
      items.push({ line, logicalIndex: index, kind, title: 'Do', detail, depth, branch: null, closing: false });
      stack.push({ type: 'do', line }); depth++; return;
    } else if (lower.startsWith('while ') && stack.at(-1)?.type === 'do') {
      closing = true; depth = Math.max(0, depth - 1); kind = 'do'; title = 'While';
      detail = `Loop while ${text.slice(6)}`;
      stack.pop();
    } else if (lower.startsWith('//') || lower.startsWith('#')) {
      kind = 'comment'; title = 'Comment'; detail = text.replace(/^(\/\/|#)\s*/, '');
    } else {
      diagnostics.push({ line, type: 'error', message: `Unknown statement: ${text}` });
    }
    items.push({ line, logicalIndex: index, kind, title: title || kindInfo[kind].title, detail, depth, branch, closing });
  });
  stack.forEach(entry => diagnostics.push({
    line: entry.line,
    type: 'error',
    message: `Unclosed ${entry.type === 'if' ? 'If' : entry.type === 'for' ? 'For' : entry.type === 'do' ? 'Do' : 'While'} block.`
  }));
  if (!items.some(item => item.kind === 'start')) diagnostics.push({ line: 1, type: 'warning', message: 'Add “START” or “Program Main” at the beginning.' });
  if (items.some(item => item.kind === 'start') && !items.some(item => item.kind === 'end')) {
    items.push({
      line: physicalLineCount + 1, logicalIndex: lines.length, kind: 'end', title: 'End', detail: 'Program exit',
      depth: 0, branch: null, closing: false, virtual: true
    });
  }
  return { items, diagnostics };
}

function build() {
  const result = parse($('#codeEditor').value);
  state.items = result.items;
  state.diagnostics = result.diagnostics;
  updateEditorFileName();
  renderFlowchart();
  renderDiagnostics();
  renderLineNumbers();
  renderSource();
  $('#symbolCount').textContent = `${state.items.length} ${t('symbolsCount')}`;
  const errors = state.diagnostics.length;
  $('#issueCount').textContent = errors ? `▲ ${errors} ${t(errors === 1 ? 'issue' : 'issues')}` : `● ${t('ready')}`;
  $('#issueCount').className = errors ? 'issues' : 'ready';
  if (state.selectedLine && !state.items.some(item => item.line === state.selectedLine)) selectLine(null);
}

function renderFlowchart() {
  const host = $('#flowchart');
  const layoutKey = `${$('#codeEditor').value}\n@zoom:${state.zoom}`;
  const shouldCenter = state.flowLayoutKey !== layoutKey;
  state.flowLayoutKey = layoutKey;
  host.innerHTML = '';
  host.style.transform = 'none';
  host.style.zoom = state.zoom;
  appendVisualSequence(host, buildVisualProgram(), false);
  requestAnimationFrame(() => {
    if ($('#flowPane').classList.contains('active')) {
      drawDecisionConnectors();
      if (shouldCenter) centerFlowchart();
    }
  });
}

function centerFlowchart() {
  const pane = $('#flowPane');
  pane.scrollLeft = Math.max(0, (pane.scrollWidth - pane.clientWidth) / 2);
}

function drawDecisionConnectors() {
  const host = $('#flowchart');
  host.querySelector('.connector-layer')?.remove();
  const hostRect = host.getBoundingClientRect();
  const scale = state.zoom || 1;
  const width = Math.max(host.scrollWidth, Math.ceil(hostRect.width / scale));
  const height = Math.max(host.scrollHeight, Math.ceil(hostRect.height / scale));
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.classList.add('connector-layer');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = `<defs>
    <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0,0 L8,4 L0,8 Z" fill="#30455f" stroke="none"></path>
    </marker>
  </defs>`;

  const point = (element, edge) => {
    const rect = element.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2 - hostRect.left) / scale,
      y: ((edge === 'top' ? rect.top : rect.bottom) - hostRect.top) / scale
    };
  };
  const sidePoint = (element, edge) => {
    const rect = element.getBoundingClientRect();
    const parallelogramInset = element.classList.contains('input') || element.classList.contains('output')
      ? rect.width * 0.035
      : 0;
    return {
      x: ((edge === 'left'
        ? rect.left + parallelogramInset
        : rect.right - parallelogramInset) - hostRect.left) / scale,
      y: (rect.top + rect.height / 2 - hostRect.top) / scale
    };
  };
  const bottomPort = (element, offset = 0) => {
    const rect = element.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2 - hostRect.left) / scale + offset,
      y: (rect.bottom - hostRect.top) / scale
    };
  };
  const visualBounds = element => {
    const elements = [element, ...element.querySelectorAll('.node, .decision-merge, .loop-exit, .empty-path')];
    const rectangles = elements.map(item => item.getBoundingClientRect());
    return {
      left: Math.min(...rectangles.map(rect => rect.left - hostRect.left)) / scale,
      right: Math.max(...rectangles.map(rect => rect.right - hostRect.left)) / scale,
      top: Math.min(...rectangles.map(rect => rect.top - hostRect.top)) / scale,
      bottom: Math.max(...rectangles.map(rect => rect.bottom - hostRect.top)) / scale
    };
  };
  const path = (data, arrow = false, className = '') => {
    const element = document.createElementNS(namespace, 'path');
    element.setAttribute('d', data);
    if (arrow) element.setAttribute('marker-end', 'url(#flow-arrow)');
    if (className) element.setAttribute('class', className);
    svg.appendChild(element);
  };
  const directContent = branch => [...branch.children].find(element =>
    element.classList.contains('flow-item') ||
    element.classList.contains('decision-group') ||
    element.classList.contains('loop-group') ||
    element.classList.contains('empty-path')
  );
  const entryNode = branch => {
    const content = directContent(branch);
    if (!content) return branch;
    if (content.classList.contains('flow-item')) return content.querySelector('.node') || content;
    if (content.classList.contains('decision-group')) return content.querySelector(':scope > .node') || content;
    if (content.classList.contains('loop-group')) return content.querySelector(':scope > .node') || content;
    return content;
  };
  const exitNode = branch => {
    const content = [...branch.children].reverse().find(element =>
      element.classList.contains('flow-item') ||
      element.classList.contains('decision-group') ||
      element.classList.contains('loop-group') ||
      element.classList.contains('empty-path')
    );
    if (!content) return branch;
    if (content.classList.contains('flow-item')) return content.querySelector('.node') || content;
    if (content.classList.contains('decision-group')) {
      return content.querySelector(':scope > .decision-merge') || content;
    }
    if (content.classList.contains('loop-group')) {
      return content.querySelector(':scope > .loop-exit') || content;
    }
    return content;
  };

  [...host.querySelectorAll('.decision-group')].forEach(group => {
    const condition = group.querySelector(':scope > .node');
    const split = group.querySelector(':scope > .decision-split');
    const merge = group.querySelector(':scope > .decision-merge');
    const branches = split ? [...split.children].filter(child => child.classList.contains('decision-branch')) : [];
    if (!condition || !merge || branches.length !== 2) return;

    const start = point(condition, 'bottom');
    const entries = branches.map(branch => point(entryNode(branch), 'top'));
    const splitY = start.y + 22;
    path(`M ${start.x} ${start.y} V ${splitY} H ${entries[0].x} V ${entries[0].y}`, true, 'decision-path true-path');
    path(`M ${start.x} ${splitY} H ${entries[1].x} V ${entries[1].y}`, true, 'decision-path false-path');

    const exits = branches.map(branch => point(exitNode(branch), 'bottom'));
    const mergeTop = point(merge, 'top');
    path(`M ${exits[0].x} ${exits[0].y} V ${mergeTop.y} H ${start.x}`, false, 'decision-merge-path');
    path(`M ${exits[1].x} ${exits[1].y} V ${mergeTop.y} H ${start.x}`, false, 'decision-merge-path');
    path(`M ${start.x} ${mergeTop.y} V ${point(merge, 'bottom').y}`, false, 'decision-merge-path');
  });

  [...host.querySelectorAll('.loop-group')].forEach(group => {
    const control = group.querySelector(':scope > .node');
    const body = group.querySelector(':scope > .loop-layout > .loop-body');
    const exit = group.querySelector(':scope > .loop-exit');
    if (!control || !body || !exit) return;

    const nextPort = sidePoint(control, 'right');
    const donePort = bottomPort(control, -72);
    const returnPort = bottomPort(control, 72);
    const entry = point(entryNode(body), 'top');
    const bodyExit = point(exitNode(body), 'bottom');
    const exitTop = point(exit, 'top');
    const exitBottom = point(exit, 'bottom');
    const returnY = bodyExit.y + 30;
    const bodyBounds = visualBounds(body);
    const returnX = Math.min(width - 42, Math.max(bodyBounds.right + 52, nextPort.x + 58));
    const returnApproachY = returnPort.y + 30;

    path(`M ${nextPort.x} ${nextPort.y} H ${entry.x} V ${entry.y}`, true, 'loop-next-path');
    path(`M ${donePort.x} ${donePort.y} V ${exitTop.y} H ${exitTop.x} V ${exitBottom.y}`, false, 'loop-done-path');
    path(
      `M ${bodyExit.x} ${bodyExit.y} V ${returnY} H ${returnX} V ${returnApproachY} H ${returnPort.x} V ${returnPort.y}`,
      true,
      'loop-return-path'
    );

    const layout = group.querySelector(':scope > .loop-layout');
    const doneLabel = layout?.querySelector(':scope > .loop-path-label.done');
    if (layout && doneLabel) {
      const layoutRect = layout.getBoundingClientRect();
      const labelLeft = donePort.x - (layoutRect.left - hostRect.left) / scale - doneLabel.offsetWidth - 13;
      doneLabel.style.left = `${Math.max(4, labelLeft)}px`;
    }
  });

  state.customConnections.forEach(connection => {
    const sourceNode = host.querySelector(`.node[data-line="${connection.sourceLine}"]`);
    const targetNode = host.querySelector(`.node[data-line="${connection.targetLine}"]`);
    if (!sourceNode || !targetNode) return;
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    const sourceCenter = {
      x: (sourceRect.left + sourceRect.width / 2 - hostRect.left) / scale,
      y: (sourceRect.top + sourceRect.height / 2 - hostRect.top) / scale
    };
    const targetCenter = {
      x: (targetRect.left + targetRect.width / 2 - hostRect.left) / scale,
      y: (targetRect.top + targetRect.height / 2 - hostRect.top) / scale
    };
    const horizontal = Math.abs(targetCenter.x - sourceCenter.x) > Math.abs(targetCenter.y - sourceCenter.y);
    const start = horizontal
      ? sidePoint(sourceNode, targetCenter.x >= sourceCenter.x ? 'right' : 'left')
      : point(sourceNode, targetCenter.y >= sourceCenter.y ? 'bottom' : 'top');
    const end = horizontal
      ? sidePoint(targetNode, targetCenter.x >= sourceCenter.x ? 'left' : 'right')
      : point(targetNode, targetCenter.y >= sourceCenter.y ? 'top' : 'bottom');
    const waypoint = connection.waypoint || (horizontal
      ? { x: (start.x + end.x) / 2, y: start.y }
      : { x: start.x, y: (start.y + end.y) / 2 });
    const data = horizontal
      ? `M ${start.x} ${start.y} H ${waypoint.x} V ${waypoint.y} H ${(waypoint.x + end.x) / 2} V ${end.y} H ${end.x}`
      : `M ${start.x} ${start.y} V ${waypoint.y} H ${waypoint.x} V ${(waypoint.y + end.y) / 2} H ${end.x} V ${end.y}`;
    const hit = document.createElementNS(namespace, 'path');
    hit.setAttribute('d', data);
    hit.setAttribute('class', 'custom-connection-hit');
    hit.dataset.connectionId = connection.id;
    hit.addEventListener('pointerdown', event => {
      event.stopPropagation();
      selectConnection(connection.id);
    });
    svg.appendChild(hit);
    const visible = document.createElementNS(namespace, 'path');
    visible.setAttribute('d', data);
    visible.setAttribute('class', `custom-connection${state.selectedConnectionId === connection.id ? ' selected' : ''}`);
    visible.style.strokeWidth = String(connection.strokeWidth || 2.25);
    if (connection.arrow !== false) visible.setAttribute('marker-end', 'url(#flow-arrow)');
    svg.appendChild(visible);
    if (connection.label) {
      const label = document.createElementNS(namespace, 'text');
      label.setAttribute('x', String(waypoint.x + 9));
      label.setAttribute('y', String(waypoint.y - 10));
      label.setAttribute('class', 'custom-connection-label');
      label.textContent = connection.label;
      svg.appendChild(label);
    }
    if (state.selectedConnectionId === connection.id) {
      const handle = document.createElementNS(namespace, 'circle');
      handle.setAttribute('cx', String(waypoint.x));
      handle.setAttribute('cy', String(waypoint.y));
      handle.setAttribute('r', '7');
      handle.setAttribute('class', 'connection-waypoint');
      handle.addEventListener('pointerdown', event => beginConnectionWaypointDrag(event, connection.id));
      svg.appendChild(handle);
    }
  });
  host.prepend(svg);
}

function setConnectionMode(enabled) {
  state.connectionMode = enabled;
  if (!enabled) state.connectionSourceLine = null;
  $('#flowPane').classList.toggle('connecting', enabled);
  $('#connectShapes').classList.toggle('active', enabled);
  $('#connectShapes').setAttribute('aria-pressed', String(enabled));
  renderFlowchart();
  if (enabled) showToast('Select the first shape, then select the destination shape.');
}

function chooseConnectionNode(line) {
  if (!state.connectionSourceLine) {
    state.connectionSourceLine = line;
    renderFlowchart();
    showToast('Now select the destination shape.');
    return;
  }
  if (state.connectionSourceLine === line) {
    state.connectionSourceLine = null;
    renderFlowchart();
    return;
  }
  const connection = {
    id: `connection-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceLine: state.connectionSourceLine,
    targetLine: line,
    label: '',
    strokeWidth: 2.25,
    arrow: true,
    waypoint: null
  };
  state.customConnections.push(connection);
  state.selectedConnectionId = connection.id;
  state.connectionSourceLine = null;
  markDirty();
  setConnectionMode(false);
  selectConnection(connection.id);
}

function selectedConnection() {
  return state.customConnections.find(connection => connection.id === state.selectedConnectionId) || null;
}

function selectConnection(id) {
  state.selectedConnectionId = id;
  state.selectedLine = null;
  const connection = selectedConnection();
  if (!connection) return selectLine(null, false);
  $$('#flowchart .node.selected').forEach(node => node.classList.remove('selected'));
  const host = $('#inspectorContent');
  host.innerHTML = `<div class="selected-summary" style="--node-color:#1597f5">
      <i>↗</i><div><strong>Connection</strong><span>Line ${connection.sourceLine} → ${connection.targetLine}</span></div>
    </div>
    <div class="inspector-card">
      <label>Label</label><input id="connectionLabel" value="${escapeHTML(connection.label || '')}" placeholder="Optional label">
      <label>Line weight</label><input id="connectionWeight" type="number" min="1" max="6" step=".25" value="${connection.strokeWidth || 2.25}">
      <label class="connection-check"><input id="connectionArrow" type="checkbox"${connection.arrow !== false ? ' checked' : ''}> Arrow at end</label>
      <div class="line-actions"><button id="resetConnection">Reset route</button><button id="deleteConnection" class="danger">Delete line</button></div>
    </div>`;
  const apply = () => {
    connection.label = $('#connectionLabel').value;
    connection.strokeWidth = Math.max(1, Math.min(6, Number($('#connectionWeight').value) || 2.25));
    connection.arrow = $('#connectionArrow').checked;
    markDirty();
    drawDecisionConnectors();
  };
  $('#connectionLabel').addEventListener('input', apply);
  $('#connectionWeight').addEventListener('input', apply);
  $('#connectionArrow').addEventListener('change', apply);
  $('#resetConnection').addEventListener('click', () => {
    connection.waypoint = null;
    markDirty();
    drawDecisionConnectors();
  });
  $('#deleteConnection').addEventListener('click', () => {
    state.customConnections = state.customConnections.filter(item => item.id !== connection.id);
    state.selectedConnectionId = null;
    markDirty();
    drawDecisionConnectors();
    selectLine(null, false);
  });
  drawDecisionConnectors();
}

function beginConnectionWaypointDrag(event, id) {
  event.preventDefault();
  event.stopPropagation();
  const connection = state.customConnections.find(item => item.id === id);
  if (!connection) return;
  const host = $('#flowchart');
  const move = pointerEvent => {
    const rect = host.getBoundingClientRect();
    const scale = state.zoom || 1;
    connection.waypoint = {
      x: (pointerEvent.clientX - rect.left) / scale,
      y: (pointerEvent.clientY - rect.top) / scale
    };
    drawDecisionConnectors();
  };
  const finish = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    markDirty();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', finish, { once: true });
}

function buildVisualProgram() {
  const lines = logicalSourceLines($('#codeEditor').value).map(entry => normalizeStatement(entry.raw));
  const byLine = new Map(state.items.map(item => [item.logicalIndex, item]));
  let cursor = 0;

  function nextMeaningful() {
    while (cursor < lines.length && !lines[cursor].trim()) cursor++;
  }

  function sequence(shouldStop = () => false) {
    const nodes = [];
    while (cursor < lines.length) {
      nextMeaningful();
      if (cursor >= lines.length) break;
      const lower = lines[cursor].trim().toLowerCase();
      if (shouldStop(lower)) break;
      if (lower.startsWith('if ')) {
        nodes.push(decision());
      } else if (lower.startsWith('while ')) {
        nodes.push(loop('while'));
      } else if (lower.startsWith('for ')) {
        nodes.push(loop('for'));
      } else {
        const item = byLine.get(cursor);
        if (item) nodes.push({ type: 'node', item });
        cursor++;
      }
    }
    return nodes;
  }

  function decision() {
    const branches = [];
    let conditionItem = byLine.get(cursor);
    cursor++;
    let body = sequence(lower => lower.startsWith('else if ') || lower === 'else' || lower.startsWith('end if'));
    branches.push({ item: conditionItem, body });

    nextMeaningful();
    while (cursor < lines.length && lines[cursor].trim().toLowerCase().startsWith('else if ')) {
      conditionItem = byLine.get(cursor);
      cursor++;
      body = sequence(lower => lower.startsWith('else if ') || lower === 'else' || lower.startsWith('end if'));
      branches.push({ item: conditionItem, body });
      nextMeaningful();
    }

    let elseBody = [];
    if (cursor < lines.length && lines[cursor].trim().toLowerCase() === 'else') {
      cursor++;
      elseBody = sequence(lower => lower.startsWith('end if'));
      nextMeaningful();
    }
    const endItem = cursor < lines.length && lines[cursor].trim().toLowerCase().startsWith('end if')
      ? byLine.get(cursor) : null;
    if (endItem) cursor++;
    return { type: 'decision', branches, elseBody, endItem };
  }

  function loop(type) {
    const item = byLine.get(cursor);
    cursor++;
    const isCloser = lower => type === 'while'
      ? lower.startsWith('end while')
      : lower.startsWith('end for') || /^next(?:\s|$)/.test(lower);
    const body = sequence(isCloser);
    nextMeaningful();
    const endItem = cursor < lines.length && isCloser(lines[cursor].trim().toLowerCase())
      ? byLine.get(cursor) : null;
    if (endItem) cursor++;
    return { type: 'loop', item, body, endItem };
  }

  const program = sequence();
  const virtualEnd = state.items.find(item => item.virtual && item.kind === 'end');
  if (virtualEnd) program.push({ type: 'node', item: virtualEnd });
  return program;
}

function createFlowNode(item) {
  const info = kindInfo[item.kind];
  const node = document.createElement('div');
  node.className = `node ${item.kind}${state.selectedLine === item.line ? ' selected' : ''}${state.connectionSourceLine === item.line ? ' connection-source' : ''}`;
  node.style.setProperty('--node-color', info.color);
  node.setAttribute('role', 'button');
  node.dataset.line = String(item.line);
  node.setAttribute('aria-label', `${localizedNodeText(item.title)}: ${localizedNodeText(item.detail)}`);
  node.title = item.virtual ? '' : t('editNodeHint');
  node.innerHTML = `<span class="node-icon">${info.icon}</span>
    <span class="node-copy"><strong>${escapeHTML(localizedNodeText(item.title))}</strong><p>${escapeHTML(localizedNodeText(item.detail))}</p></span>
    <small>L${item.line}</small>
    ${item.virtual ? '' : `<span class="node-edit-button" role="button" tabindex="-1" title="${escapeHTML(t('editNodeHint'))}" aria-label="${escapeHTML(t('editNodeHint'))}">✎</span>`}`;
  if (!item.virtual) {
    node.tabIndex = 0;
    node.addEventListener('click', () => {
      if (state.connectionMode) chooseConnectionNode(item.line);
      else selectLine(item.line, false);
    });
    node.addEventListener('dblclick', event => beginInlineNodeEdit(event, node, item));
    node.querySelector('.node-edit-button')?.addEventListener('click', event => beginInlineNodeEdit(event, node, item));
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter') beginInlineNodeEdit(event, node, item);
      if (event.key === ' ') {
        event.preventDefault();
        selectLine(item.line, false);
      }
    });
  } else {
    node.tabIndex = -1;
    node.setAttribute('aria-disabled', 'true');
  }
  return node;
}

function beginInlineNodeEdit(event, node, item) {
  event.preventDefault();
  event.stopPropagation();
  if (node.classList.contains('editing')) return;
  selectLine(item.line, false);
  const sourceLine = $('#codeEditor').value.split(/\r?\n/)[item.line - 1]?.trim() || '';
  const editor = document.createElement('input');
  editor.className = 'inline-node-editor';
  editor.value = sourceLine;
  editor.setAttribute('aria-label', t('statement'));
  node.classList.add('editing');
  node.appendChild(editor);
  editor.focus();
  editor.select();
  let finished = false;
  const finish = commit => {
    if (finished) return;
    finished = true;
    const value = editor.value.trim();
    if (commit && value && value !== sourceLine) {
      updateSelectedLine(value);
    } else {
      editor.remove();
      node.classList.remove('editing');
    }
  };
  editor.addEventListener('click', nestedEvent => nestedEvent.stopPropagation());
  editor.addEventListener('dblclick', nestedEvent => nestedEvent.stopPropagation());
  editor.addEventListener('keydown', keyEvent => {
    keyEvent.stopPropagation();
    if (keyEvent.key === 'Enter') {
      keyEvent.preventDefault();
      finish(true);
    } else if (keyEvent.key === 'Escape') {
      keyEvent.preventDefault();
      finish(false);
    }
  });
  editor.addEventListener('blur', () => finish(true), { once: true });
}

function appendVisualSequence(container, nodes, connectorBeforeFirst = false) {
  nodes.forEach((entry, index) => {
    if (connectorBeforeFirst || index > 0) {
      const connector = document.createElement('div');
      connector.className = 'connector';
      container.appendChild(connector);
    }
    if (entry.type === 'decision') {
      container.appendChild(renderDecisionLevel(entry, 0));
    } else if (entry.type === 'loop') {
      container.appendChild(renderLoop(entry));
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'flow-item';
      wrap.appendChild(createFlowNode(entry.item));
      container.appendChild(wrap);
    }
  });
}

function renderLoop(loop) {
  const group = document.createElement('div');
  group.className = 'loop-group';

  const control = createFlowNode(loop.item);
  control.classList.add('loop-control');
  group.appendChild(control);

  const layout = document.createElement('div');
  layout.className = 'loop-layout';
  layout.innerHTML = `<span class="loop-path-label done">${escapeHTML(t('done'))}</span>`;

  const body = document.createElement('div');
  body.className = 'loop-body';
  body.innerHTML = `<span class="loop-path-label next">${escapeHTML(t('next'))}</span>`;
  if (loop.body.length) appendVisualSequence(body, loop.body, false);
  else body.insertAdjacentHTML('beforeend', `<div class="empty-path">${escapeHTML(t('noAction'))}</div>`);
  layout.appendChild(body);
  group.appendChild(layout);

  const exit = document.createElement('div');
  exit.className = 'loop-exit';
  if (loop.endItem) exit.innerHTML = `<small>L${loop.endItem.line}</small>`;
  group.appendChild(exit);
  return group;
}

function renderDecisionLevel(decision, branchIndex) {
  const branch = decision.branches[branchIndex];
  const group = document.createElement('div');
  group.className = 'decision-group';
  group.appendChild(createFlowNode(branch.item));

  const split = document.createElement('div');
  split.className = 'decision-split';

  const trueColumn = document.createElement('div');
  trueColumn.className = 'decision-branch true-path';
  trueColumn.innerHTML = `<span class="path-label true">${escapeHTML(t('true'))}</span><div class="branch-stem"></div>`;
  if (branch.body.length) appendVisualSequence(trueColumn, branch.body, false);
  else trueColumn.insertAdjacentHTML('beforeend', `<div class="empty-path">${escapeHTML(t('noAction'))}</div>`);

  const falseColumn = document.createElement('div');
  falseColumn.className = 'decision-branch false-path';
  falseColumn.innerHTML = `<span class="path-label false">${escapeHTML(t('false'))}</span><div class="branch-stem"></div>`;
  if (branchIndex + 1 < decision.branches.length) {
    falseColumn.appendChild(renderDecisionLevel(decision, branchIndex + 1));
  } else if (decision.elseBody.length) {
    appendVisualSequence(falseColumn, decision.elseBody, false);
  } else {
    falseColumn.insertAdjacentHTML('beforeend', `<div class="empty-path">${escapeHTML(t('noAction'))}</div>`);
  }

  split.append(trueColumn, falseColumn);
  group.appendChild(split);

  const merge = document.createElement('div');
  merge.className = 'decision-merge';
  merge.innerHTML = `<span class="merge-dot" title="Branches merge"></span>${branchIndex === 0 && decision.endItem ? `<small>L${decision.endItem.line}</small>` : ''}`;
  group.appendChild(merge);
  return group;
}

function renderDiagnostics() {
  const host = $('#diagnostics');
  $('#fixErrorsBtn').disabled = !state.diagnostics.length;
  if (!state.diagnostics.length) {
    host.innerHTML = `<div class="valid">● ${escapeHTML(t('readyRun'))}</div>`;
    return;
  }
  host.innerHTML = state.diagnostics.map((d, i) => `<div class="diagnostic ${d.type}">
    <i>${d.type === 'error' ? '●' : '▲'}</i><button data-diag="${i}">${escapeHTML(localizedDiagnostic(d.message))}<br><small>${escapeHTML(t('line'))} ${d.line}</small></button>
  </div>`).join('');
  $$('[data-diag]').forEach(button => button.addEventListener('click', () => selectLine(state.diagnostics[+button.dataset.diag].line)));
}

function renderLineNumbers() {
  const count = Math.max(1, $('#codeEditor').value.split(/\r?\n/).length);
  const errors = new Set(state.diagnostics.filter(d => d.type === 'error').map(d => d.line));
  const warnings = new Set(state.diagnostics.filter(d => d.type !== 'error').map(d => d.line));
  const messages = new Map();
  state.diagnostics.forEach(d => {
    const previous = messages.get(d.line);
    messages.set(d.line, previous ? `${previous}\n${localizedDiagnostic(d.message)}` : localizedDiagnostic(d.message));
  });
  const active = currentEditorLine();
  $('#lineNumbers').innerHTML = Array.from({ length: count }, (_, i) =>
    `<div class="${errors.has(i + 1) ? 'error-line' : warnings.has(i + 1) ? 'warning-line' : active === i + 1 ? 'active-line' : ''}" title="${escapeHTML(messages.get(i + 1) || '')}">${i + 1}</div>`).join('');
}

function selectLine(line, rerenderFlowchart = true) {
  if (line !== null) state.selectedConnectionId = null;
  state.selectedLine = line;
  if (rerenderFlowchart) {
    renderFlowchart();
  } else {
    $$('#flowchart .node.selected').forEach(node => node.classList.remove('selected'));
    $(`#flowchart .node[data-line="${line}"]`)?.classList.add('selected');
  }
  const item = state.items.find(x => x.line === line);
  const host = $('#inspectorContent');
  if (!item) {
    host.innerHTML = `<div class="empty-inspector"><div>⌖</div><strong>${escapeHTML(t('selectSymbol'))}</strong><span>${escapeHTML(t('selectSymbolHint'))}</span></div>`;
    return;
  }
  const info = kindInfo[item.kind];
  const sourceLine = $('#codeEditor').value.split(/\r?\n/)[item.line - 1].trim();
  host.innerHTML = `<div class="selected-summary" style="--node-color:${info.color}">
      <i>${info.icon}</i><div><strong>${escapeHTML(localizedNodeText(item.title))}</strong><span>${escapeHTML(t('line'))} ${item.line}</span></div>
    </div>
    <div class="inspector-card"><label>${escapeHTML(t('statement'))}</label>
      <textarea id="lineEditor" spellcheck="false">${escapeHTML(sourceLine)}</textarea>
      <div class="line-actions"><button id="updateLine">${escapeHTML(t('update'))}</button><button id="deleteLine" class="danger">${escapeHTML(t('delete'))}</button></div>
    </div>
    <div class="inspector-card"><label>${escapeHTML(t('type'))}</label><strong>${escapeHTML(localizedNodeText(info.title))}</strong></div>`;
  $('#updateLine').addEventListener('click', () => updateSelectedLine($('#lineEditor').value));
  $('#deleteLine').addEventListener('click', () => deleteSelectedLine());
}

function updateSelectedLine(value) {
  if (!state.selectedLine) return;
  const lines = $('#codeEditor').value.split(/\r?\n/);
  const old = lines[state.selectedLine - 1];
  const indent = old.match(/^\s*/)?.[0] || '';
  lines[state.selectedLine - 1] = indent + value.trim();
  $('#codeEditor').value = lines.join('\n');
  syncAutomaticProjectName();
  markDirty(); build(); selectLine(state.selectedLine);
  showToast('Flowchart symbol updated.');
}

function deleteSelectedLine() {
  if (!state.selectedLine) return;
  const lines = $('#codeEditor').value.split(/\r?\n/);
  lines.splice(state.selectedLine - 1, 1);
  $('#codeEditor').value = lines.join('\n');
  syncAutomaticProjectName();
  state.selectedLine = null; markDirty(); build(); selectLine(null);
  showToast('Flowchart symbol deleted.');
}

function insertSnippet(kind, stayOnFlowchart = false) {
  const editor = $('#codeEditor');
  const lines = editor.value.split(/\r?\n/);
  const selected = state.items.find(item => item.line === state.selectedLine && !item.virtual);
  let index;
  let baseIndent;
  if (selected) {
    const selectedSource = lines[selected.line - 1] || '';
    const selectedIndent = selectedSource.match(/^\s*/)?.[0] || '';
    index = selected.closing ? selected.line - 1 : selected.line;
    baseIndent = selectedIndent + (!selected.closing && ['start', 'if', 'while', 'for'].includes(selected.kind) ? '    ' : '');
  } else {
    index = lines.findIndex(line => /^(?:end program|end)$/i.test(line.trim()));
    if (index < 0) index = lines.length;
    baseIndent = index < lines.length ? `${lines[index].match(/^\s*/)?.[0] || ''}    ` : '    ';
  }
  const snippetLines = snippets[kind].split('\n').map(line => `${baseIndent}${line}`);
  lines.splice(index, 0, ...snippetLines);
  editor.value = lines.join('\n');
  syncAutomaticProjectName();
  markDirty(); build();
  const insertedLine = index + 1;
  showToast(`${kindInfo[kind].title} symbol added.`);
  if (stayOnFlowchart) {
    activateTab('flow');
    selectLine(insertedLine, false);
  } else {
    activateTab('pseudo');
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }
}

function evaluate(expression, variables) {
  let js = normalizeExpression(expression)
    .replace(/\bAnd\b/gi, '&&').replace(/\bOr\b/gi, '||').replace(/\bNot\b/gi, '!')
    .replace(/\bTrue\b/gi, 'true').replace(/\bFalse\b/gi, 'false')
    .replace(/(?<![<>=!])=(?!=)/g, '==')
    .replace(/\bAbs\s*\(/gi, 'abs(').replace(/\bSqrt\s*\(/gi, 'sqrt(')
    .replace(/\bRandom\s*\(/gi, 'random(').replace(/\bLen\s*\(/gi, 'len(')
    .replace(/\bToInteger\s*\(/gi, 'toInteger(').replace(/\bToReal\s*\(/gi, 'toReal(')
    .replace(/\bToString\s*\(/gi, 'toStringValue(').replace(/\bSin\s*\(/gi, 'sin(')
    .replace(/\bCos\s*\(/gi, 'cos(').replace(/\bTan\s*\(/gi, 'tan(')
    .replace(/\bLog\s*\(/gi, 'log(').replace(/\bMin\s*\(/gi, 'min(')
    .replace(/\bMax\s*\(/gi, 'max(').replace(/\bRound\s*\(/gi, 'round(')
    .replace(/\bFloor\s*\(/gi, 'floor(').replace(/\bCeiling\s*\(/gi, 'ceiling(')
    .replace(/\bPow\s*\(/gi, 'pow(').replace(/\bUpper\s*\(/gi, 'upper(')
    .replace(/\bLower\s*\(/gi, 'lower(').replace(/\bTrim\s*\(/gi, 'trim(')
    .replace(/\bSubstring\s*\(/gi, 'substring(').replace(/\bPi\b/gi, 'pi');
  const scope = {
    abs: Math.abs, sqrt: Math.sqrt,
    random: maximum => Math.floor(Math.random() * Math.max(1, Number(maximum))),
    len: value => String(value).length,
    toInteger: value => Math.trunc(Number(value) || 0),
    toReal: value => Number(value) || 0,
    toStringValue: value => String(value),
    sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log,
    min: Math.min, max: Math.max, round: Math.round, floor: Math.floor,
    ceiling: Math.ceil, pow: Math.pow, upper: value => String(value).toUpperCase(),
    lower: value => String(value).toLowerCase(), trim: value => String(value).trim(),
    substring: (value, start, length) =>
      String(value).substring(Number(start), Number(start) + Number(length)),
    pi: Math.PI,
    ...variables
  };
  const withoutStrings = js.replace(/(["']).*?\1/g, '');
  (withoutStrings.match(/\b[A-Za-z_]\w*\b/g) || []).forEach(identifier => {
    if (!['true', 'false'].includes(identifier) && !Object.prototype.hasOwnProperty.call(scope, identifier)) {
      scope[identifier] = 0;
    }
  });
  const keys = Object.keys(scope);
  try {
    return Function(...keys, `"use strict"; return (${js});`)(...keys.map(key => scope[key]));
  } catch (error) {
    throw new Error(`Cannot evaluate “${expression}”: ${error.message}`);
  }
}

function splitOutputArguments(expression) {
  const parts = [];
  let current = '', quote = null, depth = 0;
  for (const character of expression) {
    if ((character === '"' || character === "'") && (!quote || quote === character)) {
      quote = quote ? null : character;
      current += character;
    } else if (!quote && character === '(') {
      depth++; current += character;
    } else if (!quote && character === ')') {
      depth = Math.max(0, depth - 1); current += character;
    } else if (!quote && depth === 0 && character === ',') {
      parts.push(current.trim()); current = '';
    } else {
      current += character;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evaluateOutput(expression, variables) {
  return splitOutputArguments(expression).map(part => String(evaluate(part, variables))).join('');
}

function buildControlFlow(lines) {
  const open = [];
  const conditions = {};
  const branches = {};
  const loops = {};
  const fors = {};

  lines.forEach((text, index) => {
    const lower = text.toLowerCase();
    if (lower.startsWith('if ')) {
      open.push({ type: 'if', conditionLines: [index], elseLine: null });
    } else if (lower.startsWith('else if ')) {
      const block = open.at(-1);
      if (block?.type === 'if') block.conditionLines.push(index);
    } else if (lower === 'else') {
      const block = open.at(-1);
      if (block?.type === 'if') block.elseLine = index;
    } else if (lower.startsWith('while ')) {
      open.push({ type: 'while', start: index });
    } else if (lower.startsWith('for ')) {
      open.push({ type: 'for', start: index });
    } else if (lower.startsWith('end if')) {
      const block = open.pop();
      if (block?.type === 'if') {
        block.conditionLines.forEach((line, position) => {
          conditions[line] = {
            next: block.conditionLines[position + 1] ?? block.elseLine ?? index,
            end: index
          };
        });
        block.conditionLines.slice(1).forEach(line => { branches[line] = index; });
        if (block.elseLine != null) branches[block.elseLine] = index;
      }
    } else if (lower.startsWith('end while')) {
      const block = open.pop();
      if (block?.type === 'while') {
        loops[block.start] = index;
        loops[index] = block.start;
      }
    } else if (lower.startsWith('end for')) {
      const block = open.pop();
      if (block?.type === 'for') {
        fors[block.start] = index;
        fors[index] = block.start;
      }
    }
  });
  return { conditions, branches, loops, fors };
}

function startProgram() {
  state.guidedInputs = [];
  state.awaitingInput = null;
  $('#consoleInput').value = ''; // Clear any pre-filled input to ensure interactive input
  runProgram(false);
}

function buildAndFix() {
  if (parse($('#codeEditor').value).diagnostics.some(d => d.type === 'error')) {
    autoFixPseudocode({ quiet: true });
  }
  build();
}

function submitInputOrRun() {
  if (!state.awaitingInput) {
    startProgram();
    return;
  }
  const values = $('#consoleInput').value.split(/[,\n]/).map(value => value.trim()).filter(Boolean);
  if (!values.length) {
    $('#consoleInput').focus();
    return;
  }
  state.guidedInputs.push(...values);
  $('#consoleInput').value = '';
  runProgram(true);
}

function runProgram(resuming = false) {
  if (!resuming && parse($('#codeEditor').value).diagnostics.some(d => d.type === 'error')) {
    autoFixPseudocode({ quiet: true });
  } else {
    build();
  }
  if (state.diagnostics.some(d => d.type === 'error')) {
    showRuntime([], t('fixSyntax'));
    return;
  }
  const logicalLines = logicalSourceLines($('#codeEditor').value);
  const lines = logicalLines.map(entry => normalizeStatement(entry.raw));
  const variables = {};
  lines.forEach(text => {
    const assignment = assignmentFrom(text);
    if (assignment && !Object.prototype.hasOwnProperty.call(variables, assignment.name)) variables[assignment.name] = 0;
  });
  const output = [];
  const trace = [];
  const requestedInputs = lines.filter(line => line.toLowerCase().startsWith('input '))
    .map(line => line.slice(6).trim());
  if (!resuming) {
    const typed = $('#consoleInput').value.split(/[,\n]/).map(value => value.trim()).filter(Boolean);
    const containsVariableNames = typed.length > 0 && typed.every((value, index) =>
      value.toLowerCase() === requestedInputs[index]?.toLowerCase());
    state.guidedInputs = containsVariableNames ? [] : typed;
  }
  const input = [...state.guidedInputs];
  const control = buildControlFlow(lines);
  const forStates = {};

  let pc = 0, operations = 0, errorMessage = null, pendingBranch = null, waitingFor = null;
  try {
    while (pc < lines.length && operations++ < 10000) {
      const text = lines[pc], lower = text.toLowerCase();
      if (!text || lower.startsWith('//') || lower.startsWith('#') || lower.startsWith('program ') ||
          lower === 'start' || lower === 'end program' || lower === 'end') { pc++; continue; }
      trace.push(logicalLines[pc]?.line || pc + 1);
      if (lower.startsWith('declare ')) {
        const body = text.slice(8), name = body.split(/\s+/)[0];
        variables[name] = /\bas\s+string/i.test(body) ? '' : /\bas\s+boolean/i.test(body) ? false : 0;
      } else if (lower.startsWith('set ') || assignmentFrom(text)) {
        const assignment = assignmentFrom(text);
        if (!assignment) throw new Error(`Line ${logicalLines[pc]?.line || pc + 1}: assignment needs =, ←, <-, or :=`);
        variables[assignment.name] = evaluate(assignment.expression, variables);
      } else if (lower.startsWith('output ')) {
        output.push(evaluateOutput(text.slice(7), variables));
      } else if (lower.startsWith('input ')) {
        const name = text.slice(6).trim();
        if (!input.length) {
          waitingFor = name;
          break;
        }
        const raw = input.shift();
        const exists = Object.prototype.hasOwnProperty.call(variables, name);
        if (exists && typeof variables[name] === 'string') variables[name] = raw;
        else if (/^(true|false)$/i.test(raw)) variables[name] = raw.toLowerCase() === 'true';
        else if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(raw)) variables[name] = Number(raw);
        else variables[name] = raw;
      } else if (lower.startsWith('if ') || lower.startsWith('else if ')) {
        const isElseIf = lower.startsWith('else if ');
        const info = control.conditions[pc];
        if (isElseIf && pendingBranch !== pc) {
          pc = info?.end ?? pc;
        } else {
          pendingBranch = null;
          const condition = text.replace(/^(?:else\s+)?if\s+|\s+then$/gi, '');
          if (!evaluate(condition, variables)) {
            const next = info?.next ?? info?.end ?? pc;
            if (next !== info?.end) {
              pendingBranch = next;
              pc = next - 1;
            } else {
              pc = next;
            }
          }
        }
      } else if (lower === 'else') {
        if (pendingBranch === pc) pendingBranch = null;
        else pc = control.branches[pc] ?? pc;
      } else if (lower.startsWith('while ')) {
        if (!evaluate(text.slice(6), variables)) pc = control.loops[pc] ?? pc;
      } else if (lower.startsWith('end while')) {
        pc = (control.loops[pc] ?? pc) - 1;
      } else if (lower.startsWith('for ')) {
        const header = parseForHeader(text);
        if (!header) throw new Error(`Line ${logicalLines[pc]?.line || pc + 1}: invalid For loop.`);
        if (!forStates[pc]) {
          const step = Number(evaluate(header.step, variables)) || 1;
          forStates[pc] = { variable: header.variable, end: Number(evaluate(header.end, variables)), step };
          variables[header.variable] = Number(evaluate(header.start, variables));
        }
        const loop = forStates[pc];
        const continues = loop.step >= 0 ? variables[loop.variable] <= loop.end : variables[loop.variable] >= loop.end;
        if (!continues) {
          delete forStates[pc];
          pc = control.fors[pc] ?? pc;
        }
      } else if (lower.startsWith('end for')) {
        const start = control.fors[pc];
        const loop = forStates[start];
        if (loop) variables[loop.variable] += loop.step;
        pc = (start ?? pc) - 1;
      }
      pc++;
    }
    if (!waitingFor && operations >= 10000) throw new Error('Execution stopped after 10,000 steps. Check for an infinite loop.');
  } catch (error) {
    errorMessage = error.message;
  }
  state.variables = variables;
  state.trace = trace;
  state.selectedLine = trace.at(-1) || null;
  state.awaitingInput = waitingFor;
  renderVariables();
  renderFlowchart();
  showRuntime(output, errorMessage, waitingFor);
}

function showRuntime(output, error, waitingFor = null) {
  $('#consolePanel').hidden = false;
  $('#showConsole').hidden = true;
  $('#runtimeStatus').textContent = error || (waitingFor ? tf('inputRequired', { name: waitingFor }) : '');
  $('#consoleOutput').innerHTML = output.length
    ? output.map(line => `<div class="console-line">${escapeHTML(line)}</div>`).join('')
    : `<em>${error ? t('programStopped') : waitingFor ? escapeHTML(tf('enterValue', { name: waitingFor })) : t('finishedNoOutput')}</em>`;
  $('#consoleInputLabel').textContent = waitingFor ? tf('valueFor', { name: waitingFor.toUpperCase() }) : t('consoleInput');
  $('#consoleInput').placeholder = waitingFor ? `Enter ${waitingFor}…` : 'Optional: comma-separated values';
  $('#runAgainBtn').textContent = waitingFor ? `↵ ${tf('submit', { name: waitingFor })}` : `▶ ${t('runAgain')}`;
  if (waitingFor) setTimeout(() => $('#consoleInput').focus(), 0);
}

function renderVariables() {
  const entries = Object.entries(state.variables);
  $('#variablesCard').hidden = !entries.length;
  $('#variables').innerHTML = entries.map(([key, value]) => `<div class="variable"><span>${escapeHTML(key)}</span><b>${escapeHTML(String(value))}</b></div>`).join('');
}

function sourceFor(language) {
  const source = $('#codeEditor').value;
  if (language === 'pseudocode') return source;
  if (language === 'java') {
    const statements = logicalSourceLines(source).map(({ raw }) => normalizeStatement(raw)).filter(Boolean);
    return window.AugorithmSourceGenerators.generateJavaSource(statements, {
      projectName: $('#projectName').value
    });
  }
  const out = [];
  let indent = 0;
  const unit = '    ';
  if (language === 'python') out.push(
    '# Generated by Augorithm',
    'def _augo_input():',
    '    value = input()',
    '    try:',
    '        return int(value)',
    '    except ValueError:',
    '        try:',
    '            return float(value)',
    '        except ValueError:',
    '            return value',
    ''
  );
  if (language === 'javascript') out.push('// Generated by Augorithm');
  if (language === 'swift') out.push('import Foundation', '');
  logicalSourceLines(source).forEach(({ raw }) => {
    const text = normalizeStatement(raw), lower = text.toLowerCase();
    if (!text) return;
    if (lower === 'start' || lower.startsWith('program ')) {
      if (language === 'swift') { out.push('@main struct Main {', '    static func main() {'); indent = 2; }
      else if (language === 'javascript') { out.push('function main() {'); indent = 1; }
      return;
    }
    if (lower === 'end program' || lower === 'end') {
      if (language === 'swift') out.push('    }', '}');
      else if (language === 'javascript') out.push('}', '', 'main();');
      return;
    }
    if (lower.startsWith('end if') || lower.startsWith('end while') || lower.startsWith('end for')) {
      indent = Math.max(0, indent - 1);
      if (language !== 'python') out.push(unit.repeat(indent) + '}');
      return;
    }
    if (lower.startsWith('else if ')) {
      indent = Math.max(0, indent - 1);
      const condition = sourceExpression(text.replace(/^else\s+if\s+|\s+then$/gi, ''), language, { condition: true });
      out.push(unit.repeat(indent) + (language === 'python' ? `elif ${condition}:` : `} else if (${condition}) {`));
      indent++; return;
    }
    if (lower === 'else') {
      indent = Math.max(0, indent - 1);
      out.push(unit.repeat(indent) + (language === 'python' ? 'else:' : '} else {')); indent++; return;
    }
    let line = '';
    if (lower.startsWith('declare ')) {
      const body = text.slice(8), name = body.split(/\s+/)[0], isString = /\bas\s+string/i.test(body);
      line = language === 'python' ? `${name} = ${isString ? '""' : '0'}`
        : language === 'swift' ? `var ${name}: ${isString ? 'String' : 'Double'} = ${isString ? '""' : '0'}`
        : `let ${name} = ${isString ? '""' : '0'};`;
    } else if (lower.startsWith('set ') || assignmentFrom(text)) {
      const assignment = assignmentFrom(text);
      if (assignment) line = `${assignment.name} = ${sourceExpression(assignment.expression, language)}${language === 'javascript' ? ';' : ''}`;
    } else if (lower.startsWith('output ')) {
      const args = splitOutputArguments(text.slice(7)).map(argument => sourceExpression(argument, language)).join(', ');
      line = language === 'javascript' ? `console.log(${args});` : `print(${args})`;
    } else if (lower.startsWith('input ')) {
      const name = text.slice(6);
      line = language === 'python' ? `${name} = _augo_input()` : language === 'swift' ? `${name} = Double(readLine() ?? "0") ?? 0` : `${name} = prompt("");`;
    } else if (lower.startsWith('if ')) {
      const condition = sourceExpression(text.replace(/^if\s+|\s+then$/gi, ''), language, { condition: true });
      out.push(unit.repeat(indent) + (language === 'python' ? `if ${condition}:` : `if (${condition}) {`)); indent++; return;
    } else if (lower.startsWith('while ')) {
      const condition = sourceExpression(text.slice(6), language, { condition: true });
      out.push(unit.repeat(indent) + (language === 'python' ? `while ${condition}:` : `while (${condition}) {`)); indent++; return;
    } else if (lower.startsWith('for ')) {
      const loop = parseForHeader(text);
      if (loop) {
        const start = sourceExpression(loop.start, language), end = sourceExpression(loop.end, language), step = sourceExpression(loop.step, language);
        const generated = language === 'python'
          ? `for ${loop.variable} in range(${start}, (${end}) + (1 if (${step}) > 0 else -1), ${step}):`
          : language === 'swift'
            ? `for ${loop.variable} in stride(from: ${start}, through: ${end}, by: ${step}) {`
            : `for (let ${loop.variable} = ${start}; ${loop.variable} <= ${end}; ${loop.variable} += ${step}) {`;
        out.push(unit.repeat(indent) + generated); indent++; return;
      }
    } else if (lower.startsWith('//') || lower.startsWith('#')) {
      line = (language === 'python' ? '# ' : '// ') + text.replace(/^(\/\/|#)\s*/, '');
    }
    if (line) out.push(unit.repeat(indent) + line);
  });
  return out.join('\n');
}

const sourceLanguageMeta = {
  java: { label: 'Java', extension: 'java' },
  python: { label: 'Python', extension: 'py' },
  javascript: { label: 'JavaScript', extension: 'js' },
  swift: { label: 'Swift', extension: 'swift' },
  pseudocode: { label: 'Pseudocode', extension: 'txt' }
};

const sourceKeywords = {
  java: [
    'public', 'private', 'protected', 'final', 'class', 'static', 'void', 'int',
    'double', 'boolean', 'char', 'String', 'new', 'import', 'if', 'else', 'while',
    'for', 'return', 'true', 'false', 'null', 'throws', 'try', 'catch'
  ],
  python: ['def', 'if', 'elif', 'else', 'while', 'for', 'in', 'range', 'return', 'try', 'except', 'True', 'False', 'None', 'import'],
  javascript: ['function', 'let', 'const', 'var', 'if', 'else', 'while', 'for', 'return', 'true', 'false', 'null', 'new'],
  swift: ['import', 'struct', 'class', 'static', 'func', 'var', 'let', 'if', 'else', 'while', 'for', 'in', 'true', 'false', 'nil'],
  pseudocode: ['START', 'END', 'PROGRAM', 'DECLARE', 'AS', 'SET', 'INPUT', 'OUTPUT', 'IF', 'THEN', 'ELSE', 'WHILE', 'FOR', 'TO', 'STEP', 'NEXT']
};

function highlightSource(code, language) {
  const keywords = sourceKeywords[language] || [];
  const escapedKeywords = keywords.map(keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const commentPattern = language === 'python' || language === 'pseudocode' ? '#[^\\n]*|//[^\\n]*' : '//[^\\n]*';
  const pattern = new RegExp(
    `("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|(${commentPattern})|\\b(\\d+(?:\\.\\d+)?)\\b${escapedKeywords ? `|\\b(${escapedKeywords})\\b` : ''}`,
    'g'
  );
  let html = '';
  let position = 0;
  for (const match of code.matchAll(pattern)) {
    html += escapeHTML(code.slice(position, match.index));
    const className = match[1] ? 'token-string' : match[2] ? 'token-comment' : match[3] ? 'token-number' : 'token-keyword';
    html += `<span class="${className}">${escapeHTML(match[0])}</span>`;
    position = match.index + match[0].length;
  }
  return html + escapeHTML(code.slice(position));
}

function generatedSourceFileName(language) {
  const meta = sourceLanguageMeta[language];
  if (language === 'java') {
    return `${window.AugorithmSourceGenerators.sanitizeJavaClassName($('#projectName').value)}.java`;
  }
  const base = String($('#projectName').value || 'algorithm').trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'algorithm';
  return `${base}.${meta.extension}`;
}

function sourceEditorValue(language = $('#languageSelect').value) {
  return Object.prototype.hasOwnProperty.call(state.sourceDrafts, language)
    ? state.sourceDrafts[language]
    : sourceFor(language);
}

function updateSourceMetrics(language, code, edited = false) {
  const meta = sourceLanguageMeta[language] || sourceLanguageMeta.java;
  const lines = String(code).split(/\r?\n/);
  $('#sourceLineNumbers').textContent = lines.map((_line, index) => index + 1).join('\n');
  $('#sourceFileName').textContent = generatedSourceFileName(language);
  $('#sourceStats').textContent = `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} · ${code.length} chars`;
  $('#sourceMode').textContent = meta.label;
  $('#sourceStatus').textContent = edited ? 'Edited source draft · Regenerate to reset' : t('liveSourceHint');
  $('#sourceEditor').dataset.language = language;
}

function renderSource() {
  const language = $('#languageSelect').value;
  const code = sourceEditorValue(language);
  $('#sourceCode').value = code;
  updateSourceMetrics(language, code, Object.prototype.hasOwnProperty.call(state.sourceDrafts, language));
}

function regenerateSource() {
  const language = $('#languageSelect').value;
  delete state.sourceDrafts[language];
  renderSource();
  markDirty();
  showToast(`${sourceLanguageMeta[language]?.label || 'Source'} regenerated from pseudocode.`);
}

async function copyGeneratedSource() {
  const language = $('#languageSelect').value;
  const meta = sourceLanguageMeta[language] || sourceLanguageMeta.java;
  const source = sourceEditorValue(language);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(source);
    } else {
      const temporary = document.createElement('textarea');
      temporary.value = source;
      temporary.style.position = 'fixed';
      temporary.style.opacity = '0';
      document.body.appendChild(temporary);
      temporary.select();
      if (!document.execCommand('copy')) throw new Error('Clipboard access is unavailable.');
      temporary.remove();
    }
    $('#sourceStatus').textContent = tf('sourceCopied', { language: meta.label });
  } catch (error) {
    $('#sourceStatus').textContent = tf('sourceCopyFailed', { message: error.message });
  }
}

const splitNames = value => [...new Set(String(value || '').split(',').map(item => item.trim()).filter(Boolean))];

function parseDependencies(value, attributes) {
  const known = new Set(attributes.map(attribute => attribute.toLowerCase()));
  const dependencies = [];
  const errors = [];
  String(value || '').split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line.split(/(?:->|→)/);
    if (parts.length !== 2) {
      errors.push(`Dependency ${index + 1} must use “->”.`);
      return;
    }
    const left = splitNames(parts[0]);
    const right = splitNames(parts[1]);
    const unknown = [...left, ...right].filter(name => !known.has(name.toLowerCase()));
    if (!left.length || !right.length) errors.push(`Dependency ${index + 1} is incomplete.`);
    else if (unknown.length) errors.push(`Unknown attribute: ${unknown.join(', ')}.`);
    else dependencies.push({ left, right });
  });
  return { dependencies, errors };
}

function uniqueRelations(relations) {
  const normalized = relations
    .map(relation => [...new Set(relation)])
    .filter(relation => relation.length);
  return normalized.filter((relation, index) => !normalized.some((other, otherIndex) =>
    otherIndex !== index && relation.length < other.length &&
    relation.every(attribute => other.some(item => item.toLowerCase() === attribute.toLowerCase()))
  )).filter((relation, index, all) =>
    all.findIndex(other => other.map(item => item.toLowerCase()).sort().join('|') ===
      relation.map(item => item.toLowerCase()).sort().join('|')) === index
  );
}

function analyzeNormalization() {
  const relationName = ($('#relationName').value || 'Relation').trim();
  const attributes = splitNames($('#dbAttributes').value);
  const primaryKey = splitNames($('#dbPrimaryKey').value);
  const parsed = parseDependencies($('#dbDependencies').value, attributes);
  const errors = [...parsed.errors];
  const attributeNames = new Set(attributes.map(attribute => attribute.toLowerCase()));
  primaryKey.filter(key => !attributeNames.has(key.toLowerCase()))
    .forEach(key => errors.push(`Primary-key attribute “${key}” is not in the relation.`));
  if (!attributes.length) errors.push('Add at least one attribute.');
  if (!primaryKey.length) errors.push('Add a primary key.');
  if (errors.length) {
    $('#normalizationResults').innerHTML = `<div class="normalization-error"><strong>Cannot analyze this relation</strong>${errors.map(error => `<span>• ${escapeHTML(error)}</span>`).join('')}</div>`;
    return;
  }

  const prime = new Set(primaryKey.map(key => key.toLowerCase()));
  const partials = parsed.dependencies.filter(fd =>
    primaryKey.length > 1 &&
    fd.left.length < primaryKey.length &&
    fd.left.every(item => prime.has(item.toLowerCase())) &&
    fd.right.some(item => !prime.has(item.toLowerCase()))
  );
  const transitive = parsed.dependencies.filter(fd =>
    fd.left.some(item => !prime.has(item.toLowerCase())) &&
    fd.right.some(item => !prime.has(item.toLowerCase()))
  );

  let secondRelations = partials.map(fd => [...fd.left, ...fd.right]);
  const movedByPartial = new Set(partials.flatMap(fd => fd.right).map(item => item.toLowerCase()));
  secondRelations.push(attributes.filter(attribute => !movedByPartial.has(attribute.toLowerCase()) || prime.has(attribute.toLowerCase())));
  secondRelations = uniqueRelations(secondRelations);

  let thirdRelations = parsed.dependencies.map(fd => [...fd.left, ...fd.right]);
  if (!thirdRelations.some(relation => primaryKey.every(key =>
    relation.some(attribute => attribute.toLowerCase() === key.toLowerCase())
  ))) thirdRelations.push(primaryKey);
  const covered = new Set(thirdRelations.flat().map(item => item.toLowerCase()));
  const uncovered = attributes.filter(attribute => !covered.has(attribute.toLowerCase()));
  if (uncovered.length) thirdRelations.push([...primaryKey, ...uncovered]);
  thirdRelations = uniqueRelations(thirdRelations);

  const relationCard = (title, status, relations, note) => `<article class="normal-form-card">
    <header><b>${escapeHTML(title)}</b><span class="${status ? 'pass' : 'attention'}">${status ? '✓ Satisfied' : 'Needs decomposition'}</span></header>
    <p>${escapeHTML(note)}</p>
    ${relations.map((relation, index) => `<code>${escapeHTML(`${relationName}${relations.length > 1 ? `_${index + 1}` : ''}(${relation.join(', ')})`)}</code>`).join('')}
  </article>`;
  const safeSQLName = value => value.replace(/[^\p{L}\p{N}_]+/gu, '_').replace(/^(\d)/, '_$1') || 'Relation';
  const sql = thirdRelations.map((relation, index) => {
    const name = safeSQLName(`${relationName}${thirdRelations.length > 1 ? `_${index + 1}` : ''}`);
    const keys = primaryKey.filter(key => relation.some(attribute => attribute.toLowerCase() === key.toLowerCase()));
    const columns = relation.map(attribute => `  ${safeSQLName(attribute)} TEXT`).join(',\n');
    const keySQL = keys.length ? `,\n  PRIMARY KEY (${keys.map(safeSQLName).join(', ')})` : '';
    return `CREATE TABLE ${name} (\n${columns}${keySQL}\n);`;
  }).join('\n\n');

  $('#normalizationResults').innerHTML =
    relationCard('First Normal Form (1NF)', true, [attributes], 'Values are treated as atomic and each attribute has one value per row.') +
    relationCard('Second Normal Form (2NF)', !partials.length, secondRelations,
      partials.length ? `${partials.length} partial dependency/dependencies were separated.` : 'No non-key attribute depends on only part of the primary key.') +
    relationCard('Third Normal Form (3NF)', !transitive.length, thirdRelations,
      transitive.length ? `${transitive.length} transitive dependency/dependencies were separated using synthesis.` : 'No non-key attribute determines another non-key attribute.') +
    `<article class="normal-form-card sql-card"><header><b>SQL starting point</b><button id="copyNormalizationSQL">Copy</button></header><pre>${escapeHTML(sql)}</pre></article>`;
  $('#copyNormalizationSQL').addEventListener('click', async event => {
    await navigator.clipboard?.writeText(sql);
    event.currentTarget.textContent = 'Copied';
  });
}

function loadNormalizationExample(markChanged = true) {
  $('#relationName').value = 'Enrollment';
  $('#dbAttributes').value = 'StudentID, CourseID, StudentName, CourseName, Instructor, Grade';
  $('#dbPrimaryKey').value = 'StudentID, CourseID';
  $('#dbDependencies').value = 'StudentID -> StudentName\nCourseID -> CourseName, Instructor\nStudentID, CourseID -> Grade';
  analyzeNormalization();
  if (markChanged) markDirty();
}

function generatePython(markChanged = true) {
  $('#pythonEditor').value = sourceFor('python');
  $('#pythonOutput').textContent = 'Python regenerated from the current pseudocode.';
  $('#pythonOutput').closest('.python-output').className = 'python-output success';
  $('#pythonEditorStatus').textContent = 'Generated from the current pseudocode · editable';
  updatePythonCursor();
  showToast('Python regenerated from pseudocode.');
  if (markChanged) markDirty();
}

function updatePythonCursor() {
  const editor = $('#pythonEditor');
  if (!editor) return;
  const before = editor.value.slice(0, editor.selectionStart);
  const lines = before.split('\n');
  $('#pythonCursorPosition').textContent = `Ln ${lines.length}, Col ${lines.at(-1).length + 1}`;
}

function handlePythonEditorKeyDown(event) {
  const editor = event.currentTarget;
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    runPythonEditor();
    return;
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) {
      editor.setRangeText('    ', start, end, 'end');
    } else {
      const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = editor.value.indexOf('\n', end);
      if (lineEnd < 0) lineEnd = editor.value.length;
      const selected = editor.value.slice(lineStart, lineEnd);
      const replacement = selected.split('\n').map(line => event.shiftKey ? line.replace(/^ {1,4}/, '') : `    ${line}`).join('\n');
      editor.setRangeText(replacement, lineStart, lineEnd, 'select');
    }
    markDirty();
    updatePythonCursor();
    return;
  }
  if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    const start = editor.selectionStart;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const beforeCursor = editor.value.slice(lineStart, start);
    const indent = beforeCursor.match(/^\s*/)?.[0] || '';
    const extra = beforeCursor.trimEnd().endsWith(':') ? '    ' : '';
    editor.setRangeText(`\n${indent}${extra}`, start, editor.selectionEnd, 'end');
    markDirty();
    updatePythonCursor();
  }
}

function setPythonRunning(running) {
  state.pythonRunning = running;
  $('#runPythonBtn').disabled = running;
  $('#generatePythonBtn').disabled = running;
  $('#exportPythonBtn').disabled = running;
  $('#stopPythonBtn').hidden = !running;
  $('#pythonEditorStatus').textContent = running ? 'Running Python…' : t('pythonEditorReady');
  $('#pythonEditor').readOnly = running;
}

async function runPythonEditor() {
  if (state.pythonRunning) return;
  const code = $('#pythonEditor').value;
  if (!code.trim()) {
    $('#pythonOutput').textContent = 'Nothing to run. Generate Python or enter code first.';
    $('#pythonOutput').closest('.python-output').className = 'python-output error';
    showToast('Enter Python code before running.', true);
    return;
  }
  setPythonRunning(true);
  $('#pythonOutput').closest('.python-output').className = 'python-output running';
  $('#pythonOutput').textContent = 'Running…';
  try {
    const result = await window.augorithm.runPython({
      code,
      input: $('#pythonInput').value
    });
    const details = [];
    if (result.command) details.push(`Python: ${result.command}`);
    if (result.stdout) details.push(result.stdout.replace(/\s+$/, ''));
    if (result.stderr) details.push(result.stderr.replace(/\s+$/, ''));
    if (result.exitCode !== null && result.exitCode !== undefined) details.push(`Process exited with code ${result.exitCode}.`);
    $('#pythonOutput').textContent = details.filter(Boolean).join('\n\n') || 'Program completed with no output.';
    const succeeded = result.success === true;
    $('#pythonOutput').closest('.python-output').className = `python-output ${succeeded ? 'success' : 'error'}`;
    showToast(succeeded ? 'Python completed successfully.' : 'Python finished with an error.', !succeeded);
  } catch (error) {
    $('#pythonOutput').textContent = error.message;
    $('#pythonOutput').closest('.python-output').className = 'python-output error';
    showToast(`Python could not run: ${error.message}`, true);
  } finally {
    setPythonRunning(false);
    updatePythonCursor();
  }
}

async function stopPythonEditor() {
  if (!state.pythonRunning) return;
  $('#pythonEditorStatus').textContent = 'Stopping Python…';
  const stopped = await window.augorithm.stopPython?.();
  if (stopped) {
    $('#pythonOutput').textContent = 'Execution stopped.';
    $('#pythonOutput').closest('.python-output').className = 'python-output error';
    showToast('Python execution stopped.');
  }
}

function savedLocationMessage(action, path) {
  const desktop = !['browser', 'ipad'].includes(window.augorithm.platform);
  return desktop
    ? `${action} ${fileName(path)} · Opened its folder`
    : `${action} ${fileName(path)} · Check Downloads`;
}

function activateTab(tab) {
  $$('.segmented button').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  $$('.tab-pane').forEach(pane => pane.classList.remove('active'));
  $('.tab-content').classList.toggle('split-active', tab === 'split');
  if (tab === 'split') {
    $('#pseudoPane').classList.add('active');
    $('#flowPane').classList.add('active');
  } else {
    $(`#${tab}Pane`).classList.add('active');
  }
  document.body.dataset.activeTab = tab;
  $('#zoomControls').style.visibility = tab === 'flow' || tab === 'split' ? 'visible' : 'hidden';
  if (tab === 'flow' || tab === 'split') requestAnimationFrame(() => {
    drawDecisionConnectors();
    centerFlowchart();
  });
  if (tab === 'source') renderSource();
  if (tab === 'database') {
    if (!$('#dbAttributes').value.trim()) loadNormalizationExample(false);
    else analyzeNormalization();
  }
  if (tab === 'python' && !$('#pythonEditor').value.trim()) generatePython(false);
}

function markDirty() {
  state.dirty = true;
  $('#saveState').textContent = 'Edited';
  $('#fileStatus').textContent = `◇ ${state.filePath ? fileName(state.filePath) : 'Not saved'}`;
  scheduleRecoveryDraft();
}

async function saveProject(saveAs = false) {
  saveRecoveryDraft();
  const project = currentProject();
  $('#saveState').textContent = 'Saving…';
  try {
    const result = await window.augorithm.saveProject(project, saveAs ? null : state.filePath);
    if (!result) {
      $('#saveState').textContent = 'Edited';
      return;
    }
    const path = typeof result === 'string' ? result : result.filePath;
    const savedCode = typeof result === 'string' ? project.code : result.project?.code;
    if (savedCode !== project.code) throw new Error('Saved file verification failed.');
    state.filePath = path;
    state.createdAt = result.project?.createdAt || project.createdAt;
    state.dirty = false;
    localStorage.removeItem(recoveryKey);
    $('#saveState').textContent = 'Saved';
    $('#fileStatus').textContent = `✓ ${fileName(path)}`;
    $('#runtimeStatus').textContent = savedLocationMessage('Saved', path);
  } catch (error) {
    $('#saveState').textContent = 'Save failed';
    $('#runtimeStatus').textContent = error.message;
    $('#fileStatus').textContent = '⚠ Work kept in recovery draft';
  }
}

async function openProject() {
  const result = await window.augorithm.openProject();
  if (!result) return;
  loadProject(result);
}

function loadProject(result) {
  state.filePath = result.filePath;
  state.projectDocument = result.project;
  state.createdAt = result.project.createdAt || null;
  state.dirty = false;
  state.projectNameEdited = true;
  $('#projectName').value = result.project.name || 'Untitled Algorithm';
  $('#codeEditor').value = modernizeForClosers(result.project.code || '');
  $('#relationName').value = result.project.database?.name || 'Enrollment';
  $('#dbAttributes').value = result.project.database?.attributes || '';
  $('#dbPrimaryKey').value = result.project.database?.primaryKey || '';
  $('#dbDependencies').value = result.project.database?.dependencies || '';
  $('#pythonEditor').value = result.project.python?.code || '';
  $('#pythonInput').value = result.project.python?.input || '';
  state.sourceDrafts = { ...(result.project.generatedSource?.drafts || {}) };
  state.customConnections = Array.isArray(result.project.diagramConnections)
    ? result.project.diagramConnections.map(connection => ({ ...connection }))
    : [];
  state.selectedConnectionId = null;
  state.connectionSourceLine = null;
  $('#saveState').textContent = 'Saved';
  $('#fileStatus').textContent = `✓ ${fileName(state.filePath)}`;
  localStorage.removeItem(recoveryKey);
  state.variables = {}; state.selectedLine = null; build(); renderVariables(); selectLine(null);
}

function newProject() {
  state.filePath = null; state.createdAt = null; state.dirty = false; state.selectedLine = null; state.variables = {};
  state.projectDocument = null;
  state.sourceDrafts = {};
  state.customConnections = [];
  state.selectedConnectionId = null;
  state.connectionSourceLine = null;
  state.projectNameEdited = false;
  $('#projectName').value = 'Untitled Algorithm';
  $('#codeEditor').value = templates[0].code;
  $('#relationName').value = 'Enrollment';
  $('#dbAttributes').value = '';
  $('#dbPrimaryKey').value = '';
  $('#dbDependencies').value = '';
  $('#pythonEditor').value = '';
  $('#pythonInput').value = '';
  $('#pythonOutput').textContent = 'Python is ready.';
  $('#saveState').textContent = 'Not saved'; $('#fileStatus').textContent = '◇ Not saved';
  localStorage.removeItem(recoveryKey);
  build(); renderVariables(); selectLine(null);
}

function loadTemplate(index) {
  const template = templates[index];
  state.filePath = null; state.createdAt = null; state.selectedLine = null; state.variables = {};
  state.projectDocument = null;
  state.sourceDrafts = {};
  state.customConnections = [];
  state.selectedConnectionId = null;
  state.connectionSourceLine = null;
  state.projectNameEdited = false;
  $('#projectName').value = template.name; $('#codeEditor').value = template.code;
  $('#pythonEditor').value = '';
  $('#templateDialog').close(); markDirty(); build(); renderVariables(); selectLine(null); activateTab('flow');
}

function clearRuntime() {
  state.variables = {}; state.trace = []; state.selectedLine = null;
  state.guidedInputs = []; state.awaitingInput = null;
  $('#runtimeStatus').textContent = '';
  $('#consoleOutput').innerHTML = `<em>${escapeHTML(t('pressRun'))}</em>`;
  $('#consoleInput').value = '';
  $('#consoleInput').placeholder = t('runToEnter');
  $('#consoleInputLabel').textContent = t('consoleInput');
  $('#runAgainBtn').textContent = `▶ ${t('runAgain')}`;
  renderVariables(); renderFlowchart();
}

function makeFlowchartSVG() {
  const host = $('#flowchart');
  // Keep a presentation-safe margin around every exported chart so arrows,
  // labels, and shadows never sit against the PNG/SVG edge.
  const exportPadding = 180;
  const previousZoom = host.style.zoom;
  host.style.zoom = 1;
  const contentWidth = Math.ceil(host.scrollWidth);
  const contentHeight = Math.ceil(host.scrollHeight);
  const width = contentWidth + exportPadding * 2;
  const height = contentHeight + exportPadding * 2;
  const clone = host.cloneNode(true);
  host.style.zoom = previousZoom;
  clone.style.zoom = 1;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.width = `${contentWidth}px`;
  clone.style.minWidth = `${contentWidth}px`;
  clone.style.height = `${contentHeight}px`;
  clone.style.minHeight = `${contentHeight}px`;
  clone.querySelectorAll('.selected').forEach(node => node.classList.remove('selected'));
  clone.querySelector('.connector-layer')?.remove();
  const connector = host.querySelector('.connector-layer');
  const connectorPaths = connector ? [...connector.querySelectorAll(':scope > path:not(.custom-connection-hit)')].map(path => {
    const marker = path.hasAttribute('marker-end') ? ' marker-end="url(#export-flow-arrow)"' : '';
    const weight = path.style.strokeWidth ? ` stroke-width="${escapeHTML(path.style.strokeWidth)}"` : '';
    return `<path d="${escapeHTML(path.getAttribute('d') || '')}"${weight}${marker}></path>`;
  }).join('') : '';
  const connectorLabels = connector ? [...connector.querySelectorAll(':scope > .custom-connection-label')].map(label =>
    `<text x="${escapeHTML(label.getAttribute('x') || '0')}" y="${escapeHTML(label.getAttribute('y') || '0')}" fill="#30455f" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700">${escapeHTML(label.textContent || '')}</text>`
  ).join('') : '';
  const styles = [...document.styleSheets].map(sheet => {
    try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n'); }
    catch { return ''; }
  }).join('\n');
  const markup = clone.outerHTML;
  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#fbfaf5"></rect>
      <defs>
        <marker id="export-flow-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L8,4 L0,8 Z" fill="#30455f"></path>
        </marker>
      </defs>
      <g transform="translate(${exportPadding} ${exportPadding})" fill="none" stroke="#30455f" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${connectorPaths}</g>
      <g transform="translate(${exportPadding} ${exportPadding})">${connectorLabels}</g>
      <foreignObject x="${exportPadding}" y="${exportPadding}" width="${contentWidth}" height="${contentHeight}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${contentWidth}px;height:${contentHeight}px;background:transparent;color:#101828;font-family:Arial,Helvetica,sans-serif">
          <style>${styles}</style>${markup}
        </div>
      </foreignObject>
    </svg>`
  };
}

async function exportFlowchart(format) {
  const chart = makeFlowchartSVG();
  const path = await window.augorithm.exportFlowchart({
    name: $('#projectName').value,
    format,
    data: chart.svg,
    width: chart.width,
    height: chart.height
  });
  if (path) $('#runtimeStatus').textContent = savedLocationMessage(`Exported ${format.toUpperCase()}`, path);
}

async function copyFlowchart() {
  const button = $('#copyFlowchart');
  button.disabled = true;
  try {
    if (!$('#flowPane').classList.contains('active')) {
      activateTab('flow');
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    const chart = makeFlowchartSVG();
    await window.augorithm.copyFlowchart({
      data: chart.svg,
      width: chart.width,
      height: chart.height
    });
    $('#runtimeStatus').textContent = t('flowchartCopied');
  } catch (error) {
    $('#runtimeStatus').textContent = tf('flowchartCopyFailed', { message: error.message });
  } finally {
    button.disabled = false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

function showToast(message, error = false) {
  const toast = $('#appToast');
  if (!toast) return;
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  state.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 190);
  }, 2600);
}

function init() {
  document.body.dataset.platform = window.augorithm.platform || 'browser';
  document.body.dataset.activeTab = 'flow';
  applyTheme(uiTheme);
  const savedSourceLanguage = localStorage.getItem('augorithm.sourceLanguage');
  if (sourceLanguageMeta[savedSourceLanguage]) $('#languageSelect').value = savedSourceLanguage;
  $('#codeEditor').value = templates[0].code;
  renderTemplateGrid();
  $$('.symbol').forEach(button => button.addEventListener('click', () => insertSnippet(button.dataset.kind)));
  $$('.segmented button').forEach(button => button.addEventListener('click', () => activateTab(button.dataset.tab)));
  $('#codeEditor').addEventListener('input', () => {
    syncAutomaticProjectName();
    markDirty();
    build();
    updateEditorCursor();
  });
  $('#codeEditor').addEventListener('keydown', handleEditorKeyDown);
  ['click', 'keyup', 'select'].forEach(eventName =>
    $('#codeEditor').addEventListener(eventName, updateEditorCursor));
  $('#codeEditor').addEventListener('scroll', event => { $('#lineNumbers').scrollTop = event.target.scrollTop; });
  $('#formatCodeBtn').addEventListener('click', formatPseudocode);
  $('#fixErrorsBtn').addEventListener('click', () => autoFixPseudocode());
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#noteModeToggle').addEventListener('click', toggleNoteMode);
  $('#projectName').addEventListener('input', () => {
    state.projectNameEdited = true;
    markDirty();
    updateEditorFileName();
    renderSource();
  });
  $('#buildBtn').addEventListener('click', buildAndFix);
  $('#runBtn').addEventListener('click', startProgram);
  $('#runAgainBtn').addEventListener('click', submitInputOrRun);
  $('#consoleInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitInputOrRun();
    }
  });
  $('#clearBtn').addEventListener('click', clearRuntime);
  $('#openBtn').addEventListener('click', openProject);
  $('#saveBtn').addEventListener('click', () => saveProject(false));
  $('#templatesBtn').addEventListener('click', () => $('#templateDialog').showModal());
  $('#examplesBtn').addEventListener('click', () => $('#templateDialog').showModal());
  $('#helpBtn').addEventListener('click', () => $('#helpDialog').showModal());
  $('#versionBtn').addEventListener('click', () => openVersionDialog(false));
  $('#updateActionBtn').addEventListener('click', handleUpdateAction);
  $$('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#languageSelect').addEventListener('change', event => {
    localStorage.setItem('augorithm.sourceLanguage', event.target.value);
    renderSource();
  });
  $('#regenerateSourceBtn').addEventListener('click', regenerateSource);
  $('#copySourceBtn').addEventListener('click', copyGeneratedSource);
  $('#sourceCode').addEventListener('input', event => {
    const language = $('#languageSelect').value;
    state.sourceDrafts[language] = event.target.value;
    updateSourceMetrics(language, event.target.value, true);
    markDirty();
  });
  $('#sourceCode').addEventListener('scroll', event => {
    $('#sourceLineNumbers').scrollTop = event.target.scrollTop;
  });
  $('#sourceCode').addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const editor = event.currentTarget;
    editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  });
  $('#wrapSourceBtn').addEventListener('click', event => {
    const enabled = !$('#sourceEditor').classList.contains('wrap-lines');
    $('#sourceEditor').classList.toggle('wrap-lines', enabled);
    event.currentTarget.setAttribute('aria-pressed', String(enabled));
    event.currentTarget.classList.toggle('active', enabled);
  });
  $('#databaseExampleBtn').addEventListener('click', () => loadNormalizationExample(true));
  $('#normalizeBtn').addEventListener('click', event => { event.preventDefault(); analyzeNormalization(); });
  ['relationName', 'dbAttributes', 'dbPrimaryKey', 'dbDependencies'].forEach(id =>
    $(`#${id}`).addEventListener('input', markDirty));
  $('#generatePythonBtn').addEventListener('click', () => generatePython(true));
  $('#runPythonBtn').addEventListener('click', runPythonEditor);
  $('#stopPythonBtn').addEventListener('click', stopPythonEditor);
  $('#pythonEditor').addEventListener('input', () => {
    markDirty();
    $('#pythonEditorStatus').textContent = 'Edited · ⌘/Ctrl + Enter to run';
    updatePythonCursor();
  });
  $('#pythonEditor').addEventListener('keydown', handlePythonEditorKeyDown);
  ['click', 'keyup', 'select'].forEach(eventName =>
    $('#pythonEditor').addEventListener(eventName, updatePythonCursor));
  $('#pythonInput').addEventListener('input', markDirty);
  $('#exportPythonBtn').addEventListener('click', async () => {
    const path = await window.augorithm.exportSource({
      name: $('#projectName').value,
      content: $('#pythonEditor').value,
      extension: 'py'
    });
    if (path) $('#pythonOutput').textContent = savedLocationMessage('Exported', path);
  });
  $('#uiLanguage').addEventListener('change', event => applyUILanguage(event.target.value));
  $('#flowAddSymbol').addEventListener('change', event => {
    const kind = event.target.value;
    event.target.value = '';
    if (kind) insertSnippet(kind, true);
  });
  $('#connectShapes').addEventListener('click', () => setConnectionMode(!state.connectionMode));
  $('#copyFlowchart').addEventListener('click', copyFlowchart);
  $('#exportSVG').addEventListener('click', () => exportFlowchart('svg'));
  $('#exportPNG').addEventListener('click', () => exportFlowchart('png'));
  $('#exportBtn').addEventListener('click', async () => {
    const language = $('#languageSelect').value;
    const meta = sourceLanguageMeta[language] || sourceLanguageMeta.java;
    const fileName = generatedSourceFileName(language);
    const exportName = fileName.slice(0, -(meta.extension.length + 1));
    const path = await window.augorithm.exportSource({
      name: exportName,
      content: sourceEditorValue(language),
      extension: meta.extension
    });
    if (path) {
      $('#sourceStatus').textContent = savedLocationMessage('Exported', path);
      $('#runtimeStatus').textContent = savedLocationMessage('Exported', path);
    }
  });
  $('#zoomOut').addEventListener('click', () => setZoom(state.zoom - .1));
  $('#zoomIn').addEventListener('click', () => setZoom(state.zoom + .1));
  $('#zoomReset').addEventListener('click', fitFlowchart);
  $('#flowPane').addEventListener('wheel', event => {
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      setZoom(state.zoom * (event.deltaY > 0 ? .9 : 1.1));
    }
  }, { passive: false });
  let pan = null;
  $('#flowPane').addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('.node, button, input, textarea, select, [role="button"], .path-label, .loop-path-label')) return;
    const pane = $('#flowPane');
    pan = { x: event.clientX, y: event.clientY, left: pane.scrollLeft, top: pane.scrollTop };
    pane.classList.add('panning');
    pane.setPointerCapture(event.pointerId);
  });
  $('#flowPane').addEventListener('pointermove', event => {
    if (!pan) return;
    const pane = $('#flowPane');
    pane.scrollLeft = pan.left - (event.clientX - pan.x);
    pane.scrollTop = pan.top - (event.clientY - pan.y);
  });
  $('#flowPane').addEventListener('pointerup', event => {
    pan = null;
    $('#flowPane').classList.remove('panning');
    if ($('#flowPane').hasPointerCapture(event.pointerId)) $('#flowPane').releasePointerCapture(event.pointerId);
  });
  $('#flowPane').addEventListener('pointercancel', () => {
    pan = null;
    $('#flowPane').classList.remove('panning');
  });
  window.addEventListener('keydown', event => {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.shiftKey && event.key.toLowerCase() === 'd') { event.preventDefault(); toggleTheme(); }
    if (event.shiftKey && event.key.toLowerCase() === 'n') { event.preventDefault(); toggleNoteMode(); }
    if (event.key === '=' || event.key === '+') { event.preventDefault(); setZoom(state.zoom + .1); }
    if (event.key === '-') { event.preventDefault(); setZoom(state.zoom - .1); }
    if (event.key === '0') { event.preventDefault(); fitFlowchart(); }
  });
  window.addEventListener('resize', () => {
    if ($('#flowPane').classList.contains('active')) requestAnimationFrame(drawDecisionConnectors);
  });
  if ('ResizeObserver' in window) {
    state.flowObserver = new ResizeObserver(() => {
      if ($('#flowPane').classList.contains('active')) requestAnimationFrame(drawDecisionConnectors);
    });
    state.flowObserver.observe($('#flowchart'));
    state.flowObserver.observe($('#flowPane'));
  }
  document.fonts?.ready.then(() => requestAnimationFrame(drawDecisionConnectors));
  $('#closeConsole').addEventListener('click', () => { $('#consolePanel').hidden = true; $('#showConsole').hidden = false; });
  $('#showConsole').addEventListener('click', () => { $('#consolePanel').hidden = false; $('#showConsole').hidden = true; });
  window.augorithm.onMenuAction(action => ({
    new: newProject, open: openProject, save: () => saveProject(false), saveAs: () => saveProject(true), build: buildAndFix,
    copyFlowchart, run: startProgram,
    clear: clearRuntime, help: () => $('#helpDialog').showModal(), version: () => openVersionDialog(true)
  })[action]?.());
  window.augorithm.onUpdateState(renderUpdateState);
  window.augorithm.onOpenProjectFile(loadProject);
  try {
    const recovery = JSON.parse(localStorage.getItem(recoveryKey));
    if (recovery?.project && typeof recovery.project.code === 'string') {
      state.filePath = recovery.filePath || null;
      state.createdAt = recovery.project.createdAt || null;
      state.dirty = true;
      state.projectNameEdited = true;
      $('#projectName').value = recovery.project.name || 'Recovered Algorithm';
      $('#codeEditor').value = modernizeForClosers(recovery.project.code);
      $('#relationName').value = recovery.project.database?.name || 'Enrollment';
      $('#dbAttributes').value = recovery.project.database?.attributes || '';
      $('#dbPrimaryKey').value = recovery.project.database?.primaryKey || '';
      $('#dbDependencies').value = recovery.project.database?.dependencies || '';
      $('#pythonEditor').value = recovery.project.python?.code || '';
      $('#pythonInput').value = recovery.project.python?.input || '';
      state.sourceDrafts = { ...(recovery.project.generatedSource?.drafts || {}) };
      state.customConnections = Array.isArray(recovery.project.diagramConnections)
        ? recovery.project.diagramConnections.map(connection => ({ ...connection }))
        : [];
      $('#saveState').textContent = 'Recovered';
      $('#fileStatus').textContent = '◇ Recovered unsaved work';
    }
  } catch {
    localStorage.removeItem(recoveryKey);
  }
  window.addEventListener('beforeunload', () => { if (state.dirty) saveRecoveryDraft(); });
  applyUILanguage(uiLanguage);
  initializeVersionInfo();
  applyNoteMode(storedNoteMode === null && window.augorithm.platform === 'ipad' ? true : noteMode);
  build();
  updateEditorCursor();
  if (window.augorithm.platform === 'browser' || window.augorithm.platform === 'ipad') {
    navigator.serviceWorker?.register('./service-worker.js').catch(() => {});
    setTimeout(() => checkForAppUpdate(), 6000);
  }
}

function setZoom(value) {
  state.zoom = Math.max(.25, Math.min(2.5, value));
  $('#zoomLabel').textContent = `${Math.round(state.zoom * 100)}%`;
  renderFlowchart();
}

function fitFlowchart() {
  const host = $('#flowchart');
  const pane = $('#flowPane');
  host.style.zoom = 1;
  const widthScale = (pane.clientWidth - 44) / Math.max(1, host.offsetWidth);
  const heightScale = (pane.clientHeight - 44) / Math.max(1, host.offsetHeight);
  setZoom(Math.min(1, widthScale, heightScale));
}

init();
