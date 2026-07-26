import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn Augorithm pseudocode, shortcuts, project compatibility, and installation.",
};

const syntax = [
  ["Variables", "DECLARE scores[5]\\nSET total = 0\\nADD 1 TO total"],
  ["Input and output", "INPUT name\\nOUTPUT \"Hello\", name"],
  ["Decision", "IF score >= 50 THEN\\n    OUTPUT \"Pass\"\\nELSE\\n    OUTPUT \"Try again\"\\nEND IF"],
  ["Loops", "FOR index = 1 TO 5 STEP 1\\n    OUTPUT index\\nNEXT index"],
];

export default function DocsPage() {
  return (
    <main className="docs-page">
      <header className="docs-header">
        <Link href="/" className="docs-brand">AU <span>Augorithm Docs</span></Link>
        <nav aria-label="Documentation navigation">
          <a href="#syntax">Syntax</a>
          <a href="#shortcuts">Shortcuts</a>
          <a href="#files">Files</a>
          <Link href="/editor" className="docs-launch">Launch editor</Link>
        </nav>
      </header>

      <section className="docs-hero">
        <span>DOCUMENTATION · WEB EDITOR 1.5 BETA</span>
        <h1>Build algorithms you can see, run, and explain.</h1>
        <p>Use natural pseudocode, refine the generated diagram, inspect execution, and export your work without creating an account.</p>
        <Link href="/editor">Open the web editor →</Link>
      </section>

      <div className="docs-layout">
        <aside>
          <strong>On this page</strong>
          <a href="#quick-start">Quick start</a>
          <a href="#syntax">Pseudocode syntax</a>
          <a href="#shortcuts">Keyboard shortcuts</a>
          <a href="#files">Projects and exports</a>
          <a href="#install">Install on iPad</a>
        </aside>
        <article>
          <section id="quick-start">
            <span className="docs-kicker">QUICK START</span>
            <h2>From pseudocode to a working flowchart</h2>
            <ol>
              <li>Open the editor and write or paste pseudocode.</li>
              <li>Choose <strong>Build</strong> to validate and apply automatic layout.</li>
              <li>Drag, resize, style, or lock symbols without breaking executable control flow.</li>
              <li>Enter comma-separated inputs and choose <strong>Run</strong> or <strong>Step</strong>.</li>
              <li>Export SVG or PNG, or copy the diagram into slides.</li>
            </ol>
          </section>

          <section id="syntax">
            <span className="docs-kicker">PSEUDOCODE</span>
            <h2>Classroom-friendly syntax</h2>
            <p>Keywords are case-insensitive. Indentation improves readability; Build determines the executable structure from block keywords.</p>
            <div className="syntax-grid">
              {syntax.map(([title, code]) => (
                <div key={title}><h3>{title}</h3><pre><code>{code}</code></pre></div>
              ))}
            </div>
          </section>

          <section id="shortcuts">
            <span className="docs-kicker">KEYBOARD</span>
            <h2>Essential shortcuts</h2>
            <dl className="shortcut-list">
              <div><dt><kbd>⌘/Ctrl K</kbd></dt><dd>Open the command palette</dd></div>
              <div><dt><kbd>⌘/Ctrl S</kbd></dt><dd>Save a local .augo project</dd></div>
              <div><dt><kbd>⌘/Ctrl O</kbd></dt><dd>Open an existing project</dd></div>
              <div><dt><kbd>⌘/Ctrl Z</kbd></dt><dd>Undo the last editor transaction</dd></div>
              <div><dt><kbd>Shift + click</kbd></dt><dd>Add or remove a shape from selection</dd></div>
              <div><dt><kbd>Delete</kbd></dt><dd>Delete selected shapes</dd></div>
            </dl>
          </section>

          <section id="files">
            <span className="docs-kicker">LOCAL-FIRST</span>
            <h2>Projects stay on your device</h2>
            <p>Augorithm schema v2 stores pseudocode, stable symbol IDs, pages, manual positions, styles, diagram data, and editor preferences. Legacy desktop projects migrate automatically.</p>
            <p>Export full diagrams as selectable-text SVG or high-resolution PNG. Copy creates a clipboard image that can be pasted into PowerPoint, Canva, and documents.</p>
          </section>

          <section id="install">
            <span className="docs-kicker">IPAD</span>
            <h2>Install as an iPad app</h2>
            <p>Open Augorithm in Safari, tap Share, then choose <strong>Add to Home Screen</strong>. After the first successful load, the editor shell and recovery project remain available offline.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
