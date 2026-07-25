const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

// Browser-preview fallback; Electron replaces this with the secure preload bridge.
if (!window.augorithm) {
  window.augorithm = {
    platform: 'browser',
    saveProject: async () => null,
    openProject: async () => null,
    exportSource: async () => null,
    exportFlowchart: async () => null,
    onMenuAction: () => {},
    onOpenProjectFile: () => {}
  };
}

const translations = {
  en: {
    build: 'Build', run: 'Run', symbols: 'SYMBOLS', inputOutput: 'INPUT / OUTPUT',
    input: 'Input', output: 'Output', variables: 'VARIABLES', declare: 'Declare',
    assign: 'Assign', control: 'CONTROL', if: 'If', looping: 'LOOPING', while: 'While',
    for: 'For', miscellaneous: 'MISCELLANEOUS', comment: 'Comment',
    browseExamples: 'Browse examples', flowchart: 'Flowchart', pseudocode: 'Pseudocode',
    source: 'Source', fit: 'Fit', generatedSource: 'GENERATED SOURCE', export: 'Export',
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
    guideExportHint: 'Export flowcharts as SVG or PNG and source as Pseudocode, Python, Swift, or JavaScript.',
    referenceTitle: 'Flowgorithm language reference',
    referenceHint: 'Compare symbols, expressions, data types, and control structures with the original learning environment.',
    openReference: 'Open reference ↗', statement: 'STATEMENT', update: 'Update',
    delete: 'Delete', type: 'TYPE', line: 'Line', endIf: 'End If', endWhile: 'End While',
    endFor: 'End For', pseudoFile: 'PSEUDOCODE', formatCode: 'Format',
    fixErrors: 'Fix errors', editorReady: 'IDE editing enabled',
    formatted: 'Pseudocode formatted', fixedCount: 'Fixed {count} syntax issue(s)',
    noSafeFix: 'No safe automatic fixes found', tabHint: 'Tab indents · Shift+Tab outdents',
    darkMode: 'Switch to dark mode', lightMode: 'Switch to light mode'
  },
  my: {
    build: 'တည်ဆောက်', run: 'လုပ်ဆောင်', symbols: 'သင်္ကေတများ', inputOutput: 'အဝင် / အထွက်',
    input: 'အဝင်', output: 'အထွက်', variables: 'ကိန်းရှင်များ', declare: 'ကြေညာ',
    assign: 'တန်ဖိုးသတ်မှတ်', control: 'ထိန်းချုပ်မှု', if: 'အကယ်၍',
    looping: 'ထပ်ခါလုပ်ဆောင်ခြင်း', while: 'မှန်နေစဉ်', for: 'အကြိမ်ရေဖြင့်',
    miscellaneous: 'အခြား', comment: 'မှတ်ချက်', browseExamples: 'နမူနာများကြည့်ရန်',
    flowchart: 'လုပ်ငန်းစဉ်ပုံကြမ်း', pseudocode: 'ပရိုဂရမ်အကြမ်းကုဒ်', source: 'ရင်းမြစ်ကုဒ်',
    fit: 'အံကိုက်', generatedSource: 'ထုတ်ပေးထားသော ရင်းမြစ်ကုဒ်', export: 'ထုတ်ယူ',
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
    guideExportHint: 'ပုံကြမ်းကို SVG/PNG နှင့် ကုဒ်ကို Pseudocode, Python, Swift သို့မဟုတ် JavaScript အဖြစ် ထုတ်ယူပါ။',
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
    darkMode: 'အမှောင်ပုံစံသို့ ပြောင်းမည်', lightMode: 'အလင်းပုံစံသို့ ပြောင်းမည်'
  }
};

let uiLanguage = localStorage.getItem('augorithm.uiLanguage') === 'my' ? 'my' : 'en';
let uiTheme = localStorage.getItem('augorithm.theme') === 'dark' ? 'dark' : 'light';
const t = key => translations[uiLanguage][key] || translations.en[key] || key;
const tf = (key, values = {}) => Object.entries(values)
  .reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), t(key));

function localizedDiagnostic(message) {
  if (uiLanguage !== 'my') return message;
  const exact = {
    'End If has no matching If.': 'End If နှင့် ကိုက်ညီသော If မရှိပါ။',
    'End While has no matching loop.': 'End While နှင့် ကိုက်ညီသော While မရှိပါ။',
    'End For has no matching For.': 'End For နှင့် ကိုက်ညီသော For မရှိပါ။',
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
    'End If': 'endIf', 'End While': 'endWhile', 'End For': 'endFor',
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
  $('#uiLanguage').value = uiLanguage;
  $$('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  $('#consoleInput').placeholder = t('runToEnter');
  updateThemeButton();
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
  while: { title: 'While', icon: '↻', color: '#8239ac' },
  for: { title: 'For', icon: '⟳', color: '#b17c2c' },
  comment: { title: 'Comment', icon: '≡', color: '#667085' }
};

const snippets = {
  input: 'Input value',
  output: 'Output value',
  declare: 'Declare value As Integer',
  assign: 'Set value = 0',
  if: 'If value > 0 Then\n    Output "Positive"\nElse\n    Output "Not positive"\nEnd If',
  while: 'While value < 10\n    Set value = value + 1\nEnd While',
  for: 'For index = 1 To 10 Step 1\n    Output index\nEnd For',
  comment: '// Explain this step'
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
  recoveryTimer: null,
  flowObserver: null
};

const recoveryKey = 'augorithm.recovery.v1';
const fileName = filePath => String(filePath || '').split(/[\\/]/).at(-1);

function updateEditorFileName() {
  const target = $('#editorFileName');
  if (!target) return;
  const name = ($('#projectName').value || 'Untitled')
    .trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'Untitled';
  target.textContent = `${name}.augo`;
}

function currentProject() {
  return {
    name: $('#projectName').value || 'Untitled Algorithm',
    code: $('#codeEditor').value,
    version: 2,
    createdAt: state.createdAt || new Date().toISOString()
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
  let body = text.trim().replace(/^(?:set|let)\s+/i, '');
  const match = body.match(/^([A-Za-z_]\w*)\s*(←|<-|:=|=(?!=))\s*(.+)$/);
  return match ? { name: match[1], expression: match[3] } : null;
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
    return `End For${variable ? ` ${variable}` : ''}`;
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
  if (lower.startsWith('end for')) return { action: 'close', type: 'for' };
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
  return `End For${block.variable ? ` ${block.variable}` : ''}`;
}

function formatPseudocodeSource(source) {
  const output = [];
  let depth = 0;
  let previousBlank = false;
  source.split(/\r?\n/).forEach(raw => {
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
  const canonical = source.split(/\r?\n/).map(canonicalStatement);
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
  return role.type === 'if' ? 'End If' : role.type === 'while' ? 'End While' : 'End For';
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
  const lines = source.split(/\r?\n/);
  const items = [];
  const diagnostics = [];
  const stack = [];
  let depth = 0;
  let branch = null;

  lines.forEach((raw, index) => {
    const line = index + 1;
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
      closing = true; depth = Math.max(0, depth - 1); kind = 'for'; title = 'End For';
      const closingVariable = text.slice(7).trim();
      const openLoop = stack.at(-1);
      detail = closingVariable ? `Next ${closingVariable} / exit` : 'Next value / exit';
      if (openLoop?.type === 'for') {
        if (closingVariable && openLoop.variable && closingVariable.toLowerCase() !== openLoop.variable.toLowerCase()) {
          diagnostics.push({ line, type: 'error', message: `Next ${closingVariable} does not match For ${openLoop.variable}.` });
        }
        stack.pop();
      }
      else diagnostics.push({ line, type: 'error', message: 'End For has no matching For.' });
      branch = null;
    } else if (lower.startsWith('else if ')) {
      kind = 'if'; title = 'Else If';
      detail = text.replace(/^else\s+if\s+|\s+then$/gi, '');
      if (stack.at(-1)?.type !== 'if') diagnostics.push({ line, type: 'error', message: 'Else If has no matching If.' });
      items.push({ line, kind, title, detail, depth, branch: 'False', closing: false });
      branch = 'True';
      return;
    } else if (lower === 'else') {
      kind = 'if'; title = 'Else'; detail = 'False branch';
      if (stack.at(-1)?.type !== 'if') diagnostics.push({ line, type: 'error', message: 'Else has no matching If.' });
      items.push({ line, kind, title, detail, depth, branch: 'False', closing: false });
      branch = null;
      return;
    } else if (lower === 'start' || lower.startsWith('program ')) {
      kind = 'start'; title = lower === 'start' ? 'Start' : (text.slice(8).trim() || 'Main'); detail = 'Program entry';
    } else if (lower === 'end program' || lower === 'end') {
      kind = 'end'; title = 'End'; detail = 'Program exit';
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
      items.push({ line, kind, title: 'If', detail, depth, branch: null, closing: false });
      stack.push({ type: 'if', line }); depth++; return;
    } else if (lower.startsWith('while ')) {
      kind = 'while'; detail = text.slice(6);
      items.push({ line, kind, title: 'While', detail, depth, branch: null, closing: false });
      stack.push({ type: 'while', line }); depth++; return;
    } else if (lower.startsWith('for ')) {
      const header = parseForHeader(text);
      kind = 'for'; detail = header ? `${header.variable} = ${header.start} to ${header.end}, step ${header.step}` : text.slice(4);
      items.push({ line, kind, title: 'For', detail, depth, branch: null, closing: false });
      stack.push({ type: 'for', line, variable: header?.variable || null }); depth++;
      if (!header) diagnostics.push({ line, type: 'error', message: 'Use: For index = 1 To 10 Step 1.' });
      return;
    } else if (lower.startsWith('//') || lower.startsWith('#')) {
      kind = 'comment'; title = 'Comment'; detail = text.replace(/^(\/\/|#)\s*/, '');
    } else {
      diagnostics.push({ line, type: 'error', message: `Unknown statement: ${text}` });
    }
    items.push({ line, kind, title: title || kindInfo[kind].title, detail, depth, branch, closing });
  });
  stack.forEach(entry => diagnostics.push({
    line: entry.line,
    type: 'error',
    message: `Unclosed ${entry.type === 'if' ? 'If' : entry.type === 'for' ? 'For' : 'While'} block.`
  }));
  if (!items.some(item => item.kind === 'start')) diagnostics.push({ line: 1, type: 'warning', message: 'Add “START” or “Program Main” at the beginning.' });
  if (items.some(item => item.kind === 'start') && !items.some(item => item.kind === 'end')) {
    items.push({
      line: lines.length + 1, kind: 'end', title: 'End', detail: 'Program exit',
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
    <marker id="flow-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="#30455f" stroke="none"></path>
    </marker>
  </defs>`;

  const point = (element, edge) => {
    const rect = element.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2 - hostRect.left) / scale,
      y: ((edge === 'top' ? rect.top : rect.bottom) - hostRect.top) / scale
    };
  };
  const path = (data, arrow = false) => {
    const element = document.createElementNS(namespace, 'path');
    element.setAttribute('d', data);
    if (arrow) element.setAttribute('marker-end', 'url(#flow-arrow)');
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
    const splitY = start.y + 18;
    path(`M ${start.x} ${start.y} V ${splitY} H ${entries[0].x} V ${entries[0].y}`, true);
    path(`M ${start.x} ${splitY} H ${entries[1].x} V ${entries[1].y}`, true);

    const exits = branches.map(branch => point(exitNode(branch), 'bottom'));
    const mergeTop = point(merge, 'top');
    path(`M ${exits[0].x} ${exits[0].y} V ${mergeTop.y} H ${start.x}`);
    path(`M ${exits[1].x} ${exits[1].y} V ${mergeTop.y} H ${start.x}`);
    path(`M ${start.x} ${mergeTop.y} V ${point(merge, 'bottom').y}`);
  });

  [...host.querySelectorAll('.loop-group')].forEach(group => {
    const control = group.querySelector(':scope > .node');
    const body = group.querySelector(':scope > .loop-layout > .loop-body');
    const exit = group.querySelector(':scope > .loop-exit');
    if (!control || !body || !exit) return;

    const start = point(control, 'bottom');
    const entry = point(entryNode(body), 'top');
    const bodyExit = point(exitNode(body), 'bottom');
    const exitBottom = point(exit, 'bottom');
    const splitY = start.y + 20;
    const returnY = bodyExit.y + 22;
    const returnX = start.x + 25;

    path(`M ${start.x} ${start.y} V ${splitY} H ${entry.x} V ${entry.y}`, true);
    path(`M ${start.x} ${splitY} V ${exitBottom.y}`);
    path(`M ${bodyExit.x} ${bodyExit.y} V ${returnY} H ${returnX} V ${start.y}`, true);
  });
  host.prepend(svg);
}

function buildVisualProgram() {
  const lines = $('#codeEditor').value.split(/\r?\n/).map(normalizeStatement);
  const byLine = new Map(state.items.map(item => [item.line, item]));
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
      } else if (lower.startsWith('for ')) {
        nodes.push(loop());
      } else {
        const item = byLine.get(cursor + 1);
        if (item) nodes.push({ type: 'node', item });
        cursor++;
      }
    }
    return nodes;
  }

  function decision() {
    const branches = [];
    let conditionItem = byLine.get(cursor + 1);
    cursor++;
    let body = sequence(lower => lower.startsWith('else if ') || lower === 'else' || lower.startsWith('end if'));
    branches.push({ item: conditionItem, body });

    nextMeaningful();
    while (cursor < lines.length && lines[cursor].trim().toLowerCase().startsWith('else if ')) {
      conditionItem = byLine.get(cursor + 1);
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
      ? byLine.get(cursor + 1) : null;
    if (endItem) cursor++;
    return { type: 'decision', branches, elseBody, endItem };
  }

  function loop() {
    const item = byLine.get(cursor + 1);
    cursor++;
    const body = sequence(lower => lower.startsWith('end for'));
    nextMeaningful();
    const endItem = cursor < lines.length && lines[cursor].trim().toLowerCase().startsWith('end for')
      ? byLine.get(cursor + 1) : null;
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
  const node = document.createElement('button');
  node.className = `node ${item.kind}${state.selectedLine === item.line ? ' selected' : ''}`;
  node.style.setProperty('--node-color', info.color);
  node.innerHTML = `<span class="node-icon">${info.icon}</span>
    <span class="node-copy"><strong>${escapeHTML(localizedNodeText(item.title))}</strong><p>${escapeHTML(localizedNodeText(item.detail))}</p></span>
    <small>L${item.line}</small>`;
  if (!item.virtual) node.addEventListener('click', () => selectLine(item.line));
  else node.disabled = true;
  return node;
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

function selectLine(line) {
  state.selectedLine = line;
  renderFlowchart();
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
  markDirty(); build(); selectLine(state.selectedLine);
}

function deleteSelectedLine() {
  if (!state.selectedLine) return;
  const lines = $('#codeEditor').value.split(/\r?\n/);
  lines.splice(state.selectedLine - 1, 1);
  $('#codeEditor').value = lines.join('\n');
  state.selectedLine = null; markDirty(); build(); selectLine(null);
}

function insertSnippet(kind) {
  const editor = $('#codeEditor');
  const lines = editor.value.split(/\r?\n/);
  let index = lines.findIndex(line => line.trim().toLowerCase() === 'end program');
  if (index < 0) index = lines.length;
  const snippetLines = snippets[kind].split('\n').map(line => `    ${line}`);
  lines.splice(index, 0, ...snippetLines);
  editor.value = lines.join('\n');
  markDirty(); build();
  activateTab('pseudo');
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
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
    .replace(/\bMax\s*\(/gi, 'max(').replace(/\bPi\b/gi, 'pi');
  const scope = {
    abs: Math.abs, sqrt: Math.sqrt,
    random: maximum => Math.floor(Math.random() * Math.max(1, Number(maximum))),
    len: value => String(value).length,
    toInteger: value => Math.trunc(Number(value) || 0),
    toReal: value => Number(value) || 0,
    toStringValue: value => String(value),
    sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log,
    min: Math.min, max: Math.max, pi: Math.PI,
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
  const lines = $('#codeEditor').value.split(/\r?\n/).map(normalizeStatement);
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
      trace.push(pc + 1);
      if (lower.startsWith('declare ')) {
        const body = text.slice(8), name = body.split(/\s+/)[0];
        variables[name] = /\bas\s+string/i.test(body) ? '' : /\bas\s+boolean/i.test(body) ? false : 0;
      } else if (lower.startsWith('set ') || assignmentFrom(text)) {
        const assignment = assignmentFrom(text);
        if (!assignment) throw new Error(`Line ${pc + 1}: assignment needs =, ←, <-, or :=`);
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
        if (!header) throw new Error(`Line ${pc + 1}: invalid For loop.`);
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
  const out = [];
  let indent = 0;
  const unit = '    ';
  if (language === 'python') out.push('# Generated by Augorithm');
  if (language === 'javascript') out.push('// Generated by Augorithm');
  if (language === 'swift') out.push('import Foundation', '');
  source.split(/\r?\n/).forEach(raw => {
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
      const condition = normalizeExpression(text.replace(/^else\s+if\s+|\s+then$/gi, ''));
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
      if (assignment) line = `${assignment.name} = ${normalizeExpression(assignment.expression)}${language === 'javascript' ? ';' : ''}`;
    } else if (lower.startsWith('output ')) {
      const args = splitOutputArguments(text.slice(7)).map(normalizeExpression).join(', ');
      line = language === 'javascript' ? `console.log(${args});` : `print(${args})`;
    } else if (lower.startsWith('input ')) {
      const name = text.slice(6);
      line = language === 'python' ? `${name} = input()` : language === 'swift' ? `${name} = Double(readLine() ?? "0") ?? 0` : `${name} = prompt("");`;
    } else if (lower.startsWith('if ')) {
      const condition = normalizeExpression(text.replace(/^if\s+|\s+then$/gi, ''));
      out.push(unit.repeat(indent) + (language === 'python' ? `if ${condition}:` : `if (${condition}) {`)); indent++; return;
    } else if (lower.startsWith('while ')) {
      const condition = normalizeExpression(text.slice(6));
      out.push(unit.repeat(indent) + (language === 'python' ? `while ${condition}:` : `while (${condition}) {`)); indent++; return;
    } else if (lower.startsWith('for ')) {
      const loop = parseForHeader(text);
      if (loop) {
        const start = normalizeExpression(loop.start), end = normalizeExpression(loop.end), step = normalizeExpression(loop.step);
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

function renderSource() {
  $('#sourceCode').textContent = sourceFor($('#languageSelect').value);
}

function activateTab(tab) {
  $$('.segmented button').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  $$('.tab-pane').forEach(pane => pane.classList.remove('active'));
  $(`#${tab}Pane`).classList.add('active');
  $('#zoomControls').style.visibility = tab === 'flow' ? 'visible' : 'hidden';
  if (tab === 'flow') requestAnimationFrame(() => {
    drawDecisionConnectors();
    centerFlowchart();
  });
  if (tab === 'source') renderSource();
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
    $('#runtimeStatus').textContent = `Saved ${fileName(path)}`;
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
  state.createdAt = result.project.createdAt || null;
  state.dirty = false;
  $('#projectName').value = result.project.name || 'Untitled Algorithm';
  $('#codeEditor').value = result.project.code || '';
  $('#saveState').textContent = 'Saved';
  $('#fileStatus').textContent = `✓ ${fileName(state.filePath)}`;
  localStorage.removeItem(recoveryKey);
  state.variables = {}; state.selectedLine = null; build(); renderVariables();
}

function newProject() {
  state.filePath = null; state.createdAt = null; state.dirty = false; state.selectedLine = null; state.variables = {};
  $('#projectName').value = 'Untitled Algorithm';
  $('#codeEditor').value = templates[0].code;
  $('#saveState').textContent = 'Not saved'; $('#fileStatus').textContent = '◇ Not saved';
  localStorage.removeItem(recoveryKey);
  build(); renderVariables();
}

function loadTemplate(index) {
  const template = templates[index];
  state.filePath = null; state.createdAt = null; state.selectedLine = null; state.variables = {};
  $('#projectName').value = template.name; $('#codeEditor').value = template.code;
  $('#templateDialog').close(); markDirty(); build(); renderVariables(); activateTab('flow');
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
  const previousZoom = host.style.zoom;
  host.style.zoom = 1;
  const width = Math.ceil(host.scrollWidth);
  const height = Math.ceil(host.scrollHeight);
  const clone = host.cloneNode(true);
  host.style.zoom = previousZoom;
  clone.style.zoom = 1;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.querySelectorAll('.selected').forEach(node => node.classList.remove('selected'));
  clone.querySelector('.connector-layer')?.remove();
  const connector = host.querySelector('.connector-layer');
  const connectorPaths = connector ? [...connector.querySelectorAll(':scope > path')].map(path => {
    const marker = path.hasAttribute('marker-end') ? ' marker-end="url(#export-flow-arrow)"' : '';
    return `<path d="${escapeHTML(path.getAttribute('d') || '')}"${marker}></path>`;
  }).join('') : '';
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
        <marker id="export-flow-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="#30455f"></path>
        </marker>
      </defs>
      <g fill="none" stroke="#30455f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${connectorPaths}</g>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:transparent">
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
  if (path) $('#runtimeStatus').textContent = `Exported ${format.toUpperCase()}: ${fileName(path)}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

function init() {
  document.body.dataset.platform = window.augorithm.platform || 'browser';
  applyTheme(uiTheme);
  $('#codeEditor').value = templates[0].code;
  renderTemplateGrid();
  $$('.symbol').forEach(button => button.addEventListener('click', () => insertSnippet(button.dataset.kind)));
  $$('.segmented button').forEach(button => button.addEventListener('click', () => activateTab(button.dataset.tab)));
  $('#codeEditor').addEventListener('input', () => { markDirty(); build(); updateEditorCursor(); });
  $('#codeEditor').addEventListener('keydown', handleEditorKeyDown);
  ['click', 'keyup', 'select'].forEach(eventName =>
    $('#codeEditor').addEventListener(eventName, updateEditorCursor));
  $('#codeEditor').addEventListener('scroll', event => { $('#lineNumbers').scrollTop = event.target.scrollTop; });
  $('#formatCodeBtn').addEventListener('click', formatPseudocode);
  $('#fixErrorsBtn').addEventListener('click', () => autoFixPseudocode());
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#projectName').addEventListener('input', () => { markDirty(); updateEditorFileName(); });
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
  $$('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#languageSelect').addEventListener('change', renderSource);
  $('#uiLanguage').addEventListener('change', event => applyUILanguage(event.target.value));
  $('#exportSVG').addEventListener('click', () => exportFlowchart('svg'));
  $('#exportPNG').addEventListener('click', () => exportFlowchart('png'));
  $('#exportBtn').addEventListener('click', async () => {
    const language = $('#languageSelect').value;
    const extensions = { pseudocode: 'txt', python: 'py', swift: 'swift', javascript: 'js' };
    await window.augorithm.exportSource({ name: $('#projectName').value, content: sourceFor(language), extension: extensions[language] });
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
    if (event.button !== 0 || event.target.closest('button')) return;
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
    $('#flowPane').releasePointerCapture(event.pointerId);
  });
  window.addEventListener('keydown', event => {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.shiftKey && event.key.toLowerCase() === 'd') { event.preventDefault(); toggleTheme(); }
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
    new: newProject, open: openProject, save: () => saveProject(false), saveAs: () => saveProject(true), build: buildAndFix, run: startProgram,
    clear: clearRuntime, help: () => $('#helpDialog').showModal()
  })[action]?.());
  window.augorithm.onOpenProjectFile(loadProject);
  try {
    const recovery = JSON.parse(localStorage.getItem(recoveryKey));
    if (recovery?.project && typeof recovery.project.code === 'string') {
      state.filePath = recovery.filePath || null;
      state.createdAt = recovery.project.createdAt || null;
      state.dirty = true;
      $('#projectName').value = recovery.project.name || 'Recovered Algorithm';
      $('#codeEditor').value = recovery.project.code;
      $('#saveState').textContent = 'Recovered';
      $('#fileStatus').textContent = '◇ Recovered unsaved work';
    }
  } catch {
    localStorage.removeItem(recoveryKey);
  }
  window.addEventListener('beforeunload', () => { if (state.dirty) saveRecoveryDraft(); });
  applyUILanguage(uiLanguage);
  build();
  updateEditorCursor();
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
