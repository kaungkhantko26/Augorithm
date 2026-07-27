import Image from "next/image";
import Link from "next/link";
import "./landing.css";

const painPoints = [
  {
    mark: "01",
    title: "Stop redrawing every arrow.",
    copy: "Nested loops and decisions should connect cleanly the first time—not become a maze you repair before submission.",
  },
  {
    mark: "02",
    title: "Use the device you already have.",
    copy: "Open Augorithm on Mac, Windows, iPad, or the web. Your classroom tool should not decide which laptop you need.",
  },
  {
    mark: "03",
    title: "Learn logic before syntax.",
    copy: "Write natural pseudocode, see errors beside the line, and watch the matching flowchart update as you think.",
  },
];

const workflow = [
  ["Write", "Use classroom-friendly pseudocode with formatting and useful errors."],
  ["See", "Build a standards-based flowchart with clear branches and loop paths."],
  ["Run", "Enter values, step through symbols, and inspect variables in real time."],
  ["Submit", "Export a spacious PNG or SVG that is ready for reports and slides."],
];

function ProductPreview() {
  return (
    <div className="product-window" aria-label="Preview of the Augorithm editor">
      <div className="product-titlebar">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="preview-brand">
          <Image src="/augorithm-icon.png" alt="" width={30} height={30} unoptimized />
          <strong>AUGORITHM</strong>
        </div>
        <div className="preview-title"><strong>Student Average</strong><span>Saved locally</span></div>
        <div className="preview-actions"><span>Build</span><b>▶ Run</b></div>
      </div>
      <div className="product-body">
        <aside className="preview-library">
          <strong>SYMBOLS</strong>
          <span><i className="input-symbol">⌨</i> Input</span>
          <span><i className="process-symbol">=</i> Assign</span>
          <span><i className="loop-symbol">↻</i> While</span>
          <span><i className="output-symbol">▰</i> Output</span>
        </aside>
        <section className="preview-workspace">
          <div className="preview-tabs"><b>⌘ Flowchart</b><span>≡ Pseudocode</span><span>&lt;/&gt; Source</span></div>
          <div className="preview-canvas">
            <div className="flow-node terminal">START</div>
            <div className="flow-arrow" />
            <div className="flow-node process">total = 0</div>
            <div className="flow-arrow" />
            <div className="flow-node loop">count = 1 to 5</div>
            <div className="branch-path" aria-hidden="true"><span>Next</span><i /></div>
            <div className="flow-node input">INPUT score</div>
            <div className="flow-arrow short" />
            <div className="flow-node output">OUTPUT total / 5</div>
          </div>
          <div className="preview-console"><strong>⌁ CONSOLE</strong><span>Ready to run · 7 symbols · 0 problems</span></div>
        </section>
        <aside className="preview-inspector"><strong>INSPECTOR</strong><div><b>Ready to run</b><span>All connections are valid.</span></div></aside>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link className="landing-brand" href="/" aria-label="Augorithm home">
          <Image src="/augorithm-icon.png" alt="" width={44} height={44} priority unoptimized />
          <span><strong>AUGORITHM</strong><small>Think it. Chart it. Run it.</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#problem">Why Augorithm</a>
          <a href="#how">How it works</a>
          <Link href="/docs">Docs</Link>
          <a href="https://github.com/kaungkhantko26/Augorithm/releases/latest" target="_blank" rel="noreferrer">Download</a>
        </nav>
        <Link className="nav-launch" href="/editor">Launch Web Editor <span>→</span></Link>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="student-label"><span>●</span> Made for programming students</div>
          <h1>Your algorithm makes sense.<br /><em>Your flowchart should too.</em></h1>
          <p>
            Stop losing study time to disconnected arrows, strict syntax, and
            Windows-only tools. From idea to pseudocode, flowchart, execution,
            and real code—Augorithm keeps everything in sync.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/editor">Start in the browser <span>→</span></Link>
            <a className="secondary-action" href="#how">See how it works <span>↓</span></a>
          </div>
          <div className="hero-trust">
            <span>✓ No account</span><span>✓ Local autosave</span><span>✓ English + မြန်မာဘာသာ</span>
          </div>
        </div>

        <div className="hero-proof" aria-label="Before and after using Augorithm">
          <div className="pain-card">
            <span>Before</span>
            <strong>Why is this arrow<br />not connected again?</strong>
            <div className="broken-flow" aria-hidden="true"><i /><i /><i /></div>
            <small>Deadline in 18 minutes</small>
          </div>
          <div className="solution-card">
            <span>With Augorithm</span>
            <strong>Write once.<br />See it clearly.</strong>
            <div className="clean-flow" aria-hidden="true"><i /><i /><i /><i /></div>
            <small>Ready to export · 0 problems</small>
          </div>
        </div>
      </section>

      <section className="pain-section" id="problem">
        <div className="section-heading">
          <span>THE STUDENT PROBLEM</span>
          <h2>Flowcharts should explain your logic,<br />not become another assignment.</h2>
        </div>
        <div className="pain-grid">
          {painPoints.map((item) => (
            <article key={item.mark}>
              <small>{item.mark}</small>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editor-showcase" id="how">
        <div className="section-heading centered">
          <span>THE SAME WORKSPACE, EVERYWHERE</span>
          <h2>The web editor feels like the Mac app.</h2>
          <p>Learn one interface, then continue on the browser, desktop, or iPad without starting over.</p>
        </div>
        <ProductPreview />
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <span>FROM IDEA TO SUBMISSION</span>
          <h2>Four steps. No tool switching.</h2>
        </div>
        <div className="workflow-grid">
          {workflow.map(([title, copy], index) => (
            <article key={title}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-section">
        <div>
          <span>WEB · MAC · WINDOWS · IPAD</span>
          <h2>Choose your workspace.</h2>
          <p>Your `.augo` project stays local and portable. Start instantly online or install the desktop app for native file dialogs and updates.</p>
        </div>
        <div className="workspace-actions">
          <Link href="/editor"><b>Web Editor</b><span>Open instantly →</span></Link>
          <a href="https://github.com/kaungkhantko26/Augorithm/releases/latest" target="_blank" rel="noreferrer"><b>Desktop App</b><span>macOS and Windows ↓</span></a>
          <Link href="/docs#ipad"><b>iPad</b><span>Add to Home Screen →</span></Link>
        </div>
      </section>

      <section className="final-cta">
        <Image src="/augorithm-icon.png" alt="" width={64} height={64} unoptimized />
        <div><span>YOUR NEXT ALGORITHM</span><h2>Spend your time learning the logic.</h2></div>
        <Link href="/editor">Launch Web Editor <span>→</span></Link>
      </section>

      <footer className="landing-footer">
        <span>© 2026 Augorithm · Built by Kaung Khant Ko</span>
        <div><Link href="/docs">Documentation</Link><a href="https://github.com/kaungkhantko26/Augorithm" target="_blank" rel="noreferrer">GitHub</a></div>
      </footer>
    </main>
  );
}
