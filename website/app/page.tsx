"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import "./landing.css";

type DemoView = "write" | "chart" | "run" | "code";

const nav = [
  ["How it works", "#how-it-works"],
  ["Features", "#features"],
  ["For students", "#students"],
  ["Download", "#download"],
] as const;

const features = [
  { icon: "✦", title: "Write naturally", text: "Start with the pseudocode your class already uses. Helpful validation catches mistakes without interrupting your thinking." },
  { icon: "◇", title: "See the structure", text: "Every decision, loop, and variable becomes a clean flowchart you can understand at a glance." },
  { icon: "▶", title: "Learn by running", text: "Step through your algorithm, watch variables change, and see exactly where the logic goes next." },
  { icon: "</>", title: "Turn logic into code", text: "Generate readable Python, JavaScript, Java, or Swift when you are ready to move from ideas to syntax." },
];

const demoCopy: Record<DemoView, { label: string; title: string; text: string }> = {
  write: { label: "01 · Write", title: "Think in plain language.", text: "Use classroom-friendly pseudocode with line numbers, smart indentation, and clear feedback." },
  chart: { label: "02 · Visualize", title: "See your logic connect.", text: "Augorithm turns the same steps into a standards-based flowchart with clean automatic routing." },
  run: { label: "03 · Run", title: "Watch every decision.", text: "Trace the active step, inspect variables, and understand why your algorithm produces its answer." },
  code: { label: "04 · Export", title: "Bridge into real code.", text: "Move from algorithmic thinking to production languages without losing the intent of your work." },
};

function Arrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return <span aria-hidden="true">{direction === "right" ? "↗" : "↓"}</span>;
}

function ProductPreview({ view }: { view: DemoView }) {
  return (
    <div className="product-window" aria-label={`Augorithm ${view} preview`}>
      <div className="window-bar">
        <div className="window-dots"><i /><i /><i /></div>
        <span>Maximum finder.augo</span>
        <span className="saved"><i /> Saved</span>
      </div>
      <div className="window-toolbar">
        <strong>AUGORITHM</strong>
        <div><button type="button">＋ Add</button><button type="button" className="run-button">▶ Run</button></div>
      </div>
      <div className={`preview-stage view-${view}`}>
        <div className="code-pane">
          <span className="pane-label">PSEUDOCODE</span>
          {[
            ["01", "START"], ["02", "INPUT firstNumber"], ["03", "SET maximum = firstNumber"],
            ["04", "FOR count = 2 TO 5"], ["05", "  INPUT number"], ["06", "  IF number > maximum THEN"],
            ["07", "    SET maximum = number"], ["08", "  END IF"], ["09", "NEXT count"], ["10", "OUTPUT maximum"],
          ].map(([number, line]) => <div className={number === "06" ? "active-line" : ""} key={number}><span>{number}</span><code>{line}</code></div>)}
        </div>
        <div className="flow-pane">
          <span className="pane-label">FLOWCHART</span>
          <div className="flow-node terminal">START</div><i className="flow-line" />
          <div className="flow-node input">INPUT firstNumber</div><i className="flow-line" />
          <div className="flow-node process">maximum = firstNumber</div><i className="flow-line" />
          <div className="flow-node decision">number &gt; maximum?</div>
          <span className="branch yes">YES</span><span className="branch no">NO</span>
        </div>
        <div className="runtime-card"><span>LIVE VARIABLES</span><div><small>number</small><strong>92</strong></div><div><small>maximum</small><strong>92</strong></div><div><small>count</small><strong>4</strong></div></div>
        <div className="code-output"><span>PYTHON</span><code>for count in range(2, 6):</code><code>  number = int(input())</code><code>  if number &gt; maximum:</code><code>    maximum = number</code></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<DemoView>("chart");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <main className="landing-shell" id="top">
      <header className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
        <a className="brand" href="#top" aria-label="Augorithm home">
          <Image src="/augorithm-icon.png" width={40} height={40} alt="" priority unoptimized />
          <span><strong>Augorithm</strong><small>Visual algorithms</small></span>
        </a>
        <button className="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /></button>
        <nav className={menuOpen ? "open" : ""} aria-label="Main navigation">
          {nav.map(([label, href]) => <a href={href} key={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <Link className="nav-cta" href="/editor">Open editor <Arrow /></Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <span className="eyebrow"><i /> Built for students who think visually</span>
          <h1>Don&apos;t just write<br />your algorithm.<br /><em>See it think.</em></h1>
          <p>Turn classroom pseudocode into a clear, runnable flowchart—then trace every step until the logic finally clicks.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/editor">Start creating free <Arrow /></Link>
            <a className="button secondary" href="#how-it-works">See how it works <span aria-hidden="true">▶</span></a>
          </div>
          <div className="trust-row"><span>✓ No account needed</span><span>✓ Works offline</span><span>✓ Open source</span></div>
        </div>
        <div className="hero-product"><ProductPreview view="chart" /><div className="floating-note note-one"><i>✓</i><span><strong>Logic validated</strong><small>No errors found</small></span></div><div className="floating-note note-two"><span>Step 06</span><strong>TRUE</strong></div></div>
      </section>

      <section className="proof-strip" aria-label="Product benefits"><p>From first idea to working algorithm</p><div><span><strong>4</strong> languages</span><span><strong>0</strong> setup required</span><span><strong>∞</strong> room to learn</span></div></section>

      <section className="story" id="how-it-works">
        <div className="section-heading"><span>HOW IT WORKS</span><h2>One idea.<br /><em>Four ways to understand it.</em></h2><p>Move between pseudocode, flowchart, runtime, and source code without rebuilding your work.</p></div>
        <div className="demo-layout">
          <div className="demo-nav" role="tablist" aria-label="Product walkthrough">
            {(Object.keys(demoCopy) as DemoView[]).map((key) => <button type="button" role="tab" aria-selected={view === key} className={view === key ? "active" : ""} onClick={() => setView(key)} key={key}><span>{demoCopy[key].label}</span><strong>{demoCopy[key].title}</strong><small>{demoCopy[key].text}</small></button>)}
          </div>
          <ProductPreview view={view} />
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading left"><span>BUILT FOR CLARITY</span><h2>Everything you need.<br /><em>Nothing in your way.</em></h2></div>
        <div className="feature-grid">{features.map((item, index) => <article key={item.title}><span className="feature-number">0{index + 1}</span><i>{item.icon}</i><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="student-section" id="students">
        <div className="student-card"><span className="eyebrow light">FOR EVERY “I DON&apos;T GET IT” MOMENT</span><h2>See the answer<br />before you submit it.</h2><p>Augorithm makes invisible logic visible. Find the broken branch, understand the loop, and hand in work you can actually explain.</p><div className="student-points"><span>Visual debugging</span><span>Step-by-step execution</span><span>Clean SVG export</span><span>English + Burmese</span></div><Link className="button paper" href="/editor">Try it in your browser <Arrow /></Link></div>
        <div className="quote-card"><div className="quote-mark">“</div><blockquote>The fastest way to understand an algorithm is to watch it make a decision.</blockquote><div className="mini-chart"><span>INPUT</span><i /><span>DECIDE</span><i /><span>LEARN</span></div></div>
      </section>

      <section className="download" id="download">
        <div><span className="eyebrow">LEARN ANYWHERE</span><h2>Your logic.<br />On every screen.</h2><p>Use the web editor instantly or take Augorithm offline for focused, distraction-free learning.</p></div>
        <div className="platforms"><article><i>⌘</i><span><strong>macOS</strong><small>Apple Silicon</small></span><a href="https://github.com/kaungkhantko26/Augorithm/releases" aria-label="Download Augorithm for macOS">↓</a></article><article><i>⊞</i><span><strong>Windows</strong><small>Windows 10 &amp; 11</small></span><a href="https://github.com/kaungkhantko26/Augorithm/releases" aria-label="Download Augorithm for Windows">↓</a></article><article className="web-platform"><i>◎</i><span><strong>Web editor</strong><small>Nothing to install</small></span><Link href="/editor" aria-label="Open the web editor">↗</Link></article></div>
      </section>

      <section className="final-cta"><Image src="/augorithm-icon.png" width={68} height={68} alt="" unoptimized /><span>YOUR NEXT ALGORITHM STARTS HERE</span><h2>Think it. Chart it.<br /><em>Run it.</em></h2><p>Free to use. No account. No learning curve.</p><Link className="button primary" href="/editor">Open Augorithm <Arrow /></Link></section>

      <footer><a className="brand footer-brand" href="#top"><Image src="/augorithm-icon.png" width={36} height={36} alt="" unoptimized /><span><strong>Augorithm</strong><small>Think it. Chart it. Run it.</small></span></a><p>Made for students, teachers, and visual thinkers.</p><nav aria-label="Footer navigation"><Link href="/docs">Docs</Link><a href="https://github.com/kaungkhantko26/Augorithm">GitHub</a><a href="https://github.com/kaungkhantko26/Augorithm/blob/main/LICENSE">License</a></nav><small>© {new Date().getFullYear()} Augorithm</small></footer>
    </main>
  );
}
