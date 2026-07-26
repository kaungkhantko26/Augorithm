"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import "./landing.css";

type DemoLayer = "Pseudocode" | "Flowchart" | "Runtime" | "Source";
type SourceLanguage = "Java" | "Python" | "JavaScript" | "Swift";

const features = [
  {
    icon: "⌨",
    title: "Natural pseudocode",
    copy: "Write classroom-friendly logic with smart formatting, inline validation, and safe automatic fixes.",
  },
  {
    icon: "◇",
    title: "Living flowcharts",
    copy: "Watch branches, loops, and merges assemble into standards-based diagrams with clean routing.",
  },
  {
    icon: "▶",
    title: "Trace every step",
    copy: "Run, pause, inspect variables, enter input, and see the active symbol glow as your algorithm executes.",
  },
  {
    icon: "</>",
    title: "Real source code",
    copy: "Generate readable Java, Python, JavaScript, and Swift without losing the intent of your pseudocode.",
  },
  {
    icon: "↗",
    title: "Presentation-ready",
    copy: "Export PNG or selectable SVG, copy directly into slides, and keep every connector crisp.",
  },
  {
    icon: "က",
    title: "English + Burmese",
    copy: "Learn in either language with accessible type, centered labels, and layouts that never clip translations.",
  },
];

const sourceExamples: Record<SourceLanguage, string> = {
  Java: `import java.util.Scanner;

class MaximumFinder {
  public static void main(String[] args) {
    Scanner input = new Scanner(System.in);
    int max = input.nextInt();

    for (int count = 2; count <= 5; count++) {
      int data = input.nextInt();
      if (data > max) max = data;
    }

    System.out.println(max);
  }
}`,
  Python: `max_value = int(input())

for count in range(2, 6):
    data = int(input())
    if data > max_value:
        max_value = data

print(max_value)`,
  JavaScript: `let max = Number(prompt("First value"));

for (let count = 2; count <= 5; count++) {
  const data = Number(prompt("Next value"));
  if (data > max) max = data;
}

console.log(max);`,
  Swift: `import Foundation

var maximum = Int(readLine()!)!

for _ in 2...5 {
  let data = Int(readLine()!)!
  if data > maximum {
    maximum = data
  }
}

print(maximum)`,
};

const demoLayers: DemoLayer[] = ["Pseudocode", "Flowchart", "Runtime", "Source"];

function AlgorithmScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);

  const tiltScene = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--scene-rx", `${-y * 10}deg`);
    event.currentTarget.style.setProperty("--scene-ry", `${x * 13}deg`);
    event.currentTarget.style.setProperty("--scene-x", `${x * 8}px`);
    event.currentTarget.style.setProperty("--scene-y", `${y * 8}px`);
  };

  const resetScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty("--scene-rx", "3deg");
    scene.style.setProperty("--scene-ry", "-6deg");
    scene.style.setProperty("--scene-x", "0px");
    scene.style.setProperty("--scene-y", "0px");
  };

  return (
    <div
      ref={sceneRef}
      className={`algorithm-scene ${running ? "running" : "paused"}`}
      aria-label="Interactive 3D maximum finder flowchart"
      onPointerMove={tiltScene}
      onPointerLeave={resetScene}
    >
      <div className="scene-grid" aria-hidden="true" />
      <div className="scene-depth-ring" aria-hidden="true" />
      <div className="code-particle particle-one">IF data &gt; max</div>
      <div className="code-particle particle-two">NEXT count</div>
      <div className="code-particle particle-three">OUTPUT max</div>
      <div className="scene-flow" aria-hidden="true">
        <div className="scene-node scene-start">START</div>
        <div className="scene-connector"><i /></div>
        <div className="scene-node scene-input">INPUT firstData</div>
        <div className="scene-connector"><i /></div>
        <div className="scene-node scene-process">max = firstData</div>
        <div className="scene-connector"><i /></div>
        <div className="scene-node scene-decision">data &gt; max?</div>
        <div className="scene-branch scene-branch-left"><span>TRUE</span></div>
        <div className="scene-branch scene-branch-right"><span>FALSE</span></div>
        <div className="program-counter" />
      </div>
      <div className="scene-hud hud-top">
        <i /> Maximum Finder <span>{running ? "Running" : "Paused"}</span>
      </div>
      <div className="scene-hud hud-bottom">
        <span>count</span><strong>4</strong><span>max</span><strong>92</strong>
      </div>
      <div className="scene-controls" aria-label="3D preview controls">
        <button type="button" onClick={() => setRunning((value) => !value)}>
          {running ? "Ⅱ Pause" : "▶ Run"}
        </button>
        <button type="button" onClick={resetScene}>↺ Reset view</button>
        <span>Move pointer to explore depth</span>
      </div>
    </div>
  );
}

function WorkspacePreview({ layer }: { layer: DemoLayer }) {
  if (layer === "Pseudocode") {
    return (
      <div className="demo-code">
        {[
          "START",
          "INPUT firstData",
          "SET max = firstData",
          "FOR count = 2 TO 5",
          "    INPUT data",
          "    IF data > max THEN",
          "        SET max = data",
          "    END IF",
          "NEXT count",
          "OUTPUT max",
          "END",
        ].map((line, index) => (
          <div className={index === 5 ? "active" : ""} key={`${line}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <code>{line}</code>
          </div>
        ))}
      </div>
    );
  }

  if (layer === "Flowchart") {
    return (
      <div className="demo-flow" aria-label="Flowchart preview">
        <div className="df-node df-terminal">START</div>
        <div className="df-line" />
        <div className="df-node df-input">INPUT firstData</div>
        <div className="df-line" />
        <div className="df-node df-process">max = firstData</div>
        <div className="df-line" />
        <div className="df-node df-loop">count = 2 to 5</div>
        <div className="df-loop-route"><span>Next</span><i /></div>
      </div>
    );
  }

  if (layer === "Runtime") {
    return (
      <div className="runtime-view">
        <div className="runtime-track">
          <span>Executing</span>
          <strong>IF data &gt; max</strong>
          <i />
        </div>
        <div className="variable-cubes">
          <article><span>firstData</span><strong>41</strong></article>
          <article className="updated"><span>data</span><strong>92</strong></article>
          <article><span>max</span><strong>92</strong></article>
          <article><span>count</span><strong>4</strong></article>
        </div>
        <div className="runtime-console"><span>›</span> Waiting for the next input…</div>
      </div>
    );
  }

  return (
    <div className="demo-source">
      <div className="demo-source-file">MaximumFinder.java</div>
      <pre><code>{sourceExamples.Java}</code></pre>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoLayer, setDemoLayer] = useState<DemoLayer>("Flowchart");
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("Java");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? (window.scrollY / available) * 100 : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const copySource = async () => {
    await navigator.clipboard.writeText(sourceExamples[sourceLanguage]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="landing-shell">
      <div className="scroll-progress" style={{ width: `${progress}%` }} />

      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Augorithm home">
          <span className="logo-glass">
            <Image src="/augorithm-icon.png" alt="" width={42} height={42} priority />
          </span>
          <span><strong>AUGORITHM</strong><small>Think it. Chart it. Run it.</small></span>
        </a>
        <button
          className="landing-menu"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <i /><i /><i />
        </button>
        <nav className={menuOpen ? "open" : ""} aria-label="Main navigation">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a>
          <a href="#download" onClick={() => setMenuOpen(false)}>Download</a>
          <Link href="/docs" onClick={() => setMenuOpen(false)}>Docs</Link>
          <a className="nav-search" href="#faq" aria-label="Search documentation">⌕</a>
          <Link className="nav-launch" href="/editor">Launch Web Editor <span>↗</span></Link>
        </nav>
      </header>

      <section className="landing-hero" id="top">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="landing-hero-copy">
          <div className="launch-badge"><i /> Interactive 3D workspace · Web editor live</div>
          <h1>Build logic you can<br /><em>see, touch, and run.</em></h1>
          <p>
            Turn pseudocode into a precise, editable flowchart. Explore every
            connection in 3D, execute it step by step, and generate real code.
          </p>
          <div className="landing-actions">
            <Link className="cta cta-primary" href="/editor">Try Web Editor <span>→</span></Link>
            <a className="cta cta-secondary" href="#download">Download Augorithm <span>↓</span></a>
          </div>
          <div className="hero-platforms" aria-label="Supported platforms">
            <span> macOS</span><span>⊞ Windows</span><span>▣ iPad</span><span>◉ Offline</span>
          </div>
        </div>
        <div className="hero-visual">
          <AlgorithmScene />
        </div>
        <a className="scroll-cue" href="#features"><span>Scroll to explore</span><i /></a>
      </section>

      <section className="proof-strip">
        <p>One algorithm. Every view you need.</p>
        <div><span>PSEUDOCODE</span><i /><span>FLOWCHART</span><i /><span>RUNTIME</span><i /><span>SOURCE</span></div>
      </section>

      <section className="dark-section feature-section" id="features">
        <div className="section-label"><span>01</span> WHY AUGORITHM</div>
        <div className="landing-section-heading">
          <h2>Programming logic should feel <em>visible.</em></h2>
          <p>Augorithm keeps the structure of an idea in view from the first statement to the final program.</p>
        </div>
        <div className="immersive-feature-grid">
          {features.map((feature, index) => (
            <article className="immersive-card" key={feature.title}>
              <div className="feature-visual" aria-hidden="true">
                <span>{feature.icon}</span>
                <i />
              </div>
              <small>0{index + 1}</small>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-label"><span>02</span> INTERACTIVE DEMO</div>
        <div className="landing-section-heading centered">
          <h2>One idea. <em>Four depths.</em></h2>
          <p>Switch between the same algorithm as text, structure, live execution, and production-ready code.</p>
        </div>
        <div className="demo-workspace">
          <div className="demo-chrome">
            <div><i /><i /><i /></div>
            <strong>Maximum Finder.augo</strong>
            <span><b /> Ready</span>
          </div>
          <div className="demo-tabs" role="tablist" aria-label="Algorithm views">
            {demoLayers.map((layer, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={demoLayer === layer}
                className={demoLayer === layer ? "active" : ""}
                onClick={() => setDemoLayer(layer)}
                key={layer}
              >
                <span>0{index + 1}</span>{layer}
              </button>
            ))}
          </div>
          <div className="demo-stage" role="tabpanel">
            <div className="demo-stage-label"><span>{demoLayer}</span><small>Synced in real time</small></div>
            <WorkspacePreview layer={demoLayer} />
          </div>
          <div className="demo-status">
            <span>Built by Kaung Khant Ko</span>
            <span>11 symbols · 4 variables · 0 problems</span>
          </div>
        </div>
      </section>

      <section className="source-section">
        <div className="source-copy">
          <div className="section-label"><span>03</span> GENERATE SOURCE</div>
          <h2>Your algorithm,<br /><em>ready for the real world.</em></h2>
          <p>
            Generate clean code you can understand, edit, and run. The structure
            you learned stays visible in every language.
          </p>
          <ul>
            <li><i /> Readable, idiomatic output</li>
            <li><i /> Consistent names and control flow</li>
            <li><i /> Export as a native source file</li>
          </ul>
        </div>
        <div className="code-wall">
          <div className="code-wall-toolbar">
            <div>
              {(Object.keys(sourceExamples) as SourceLanguage[]).map((language) => (
                <button
                  type="button"
                  className={sourceLanguage === language ? "active" : ""}
                  aria-pressed={sourceLanguage === language}
                  onClick={() => setSourceLanguage(language)}
                  key={language}
                >
                  {language}
                </button>
              ))}
            </div>
            <button className="copy-code" type="button" onClick={copySource}>{copied ? "Copied ✓" : "Copy code"}</button>
          </div>
          <div className="code-file"><span>●</span>{sourceLanguage === "Java" ? "MaximumFinder.java" : sourceLanguage === "Python" ? "maximum_finder.py" : sourceLanguage === "Swift" ? "MaximumFinder.swift" : "maximum-finder.js"}</div>
          <pre aria-live="polite"><code>{sourceExamples[sourceLanguage]}</code></pre>
        </div>
      </section>

      <section className="bilingual-section">
        <div className="bilingual-visual">
          <div className="language-card english-card">
            <span>ENGLISH</span>
            <strong>Build logic<br />you can see.</strong>
            <button type="button">▶ Run algorithm</button>
          </div>
          <div className="language-card burmese-card" lang="my">
            <span>မြန်မာဘာသာ</span>
            <strong>မြင်သာသော<br />အယ်လ်ဂိုရီသမ်</strong>
            <button type="button">▶ လုပ်ဆောင်မည်</button>
          </div>
        </div>
        <div className="bilingual-copy">
          <div className="section-label"><span>04</span> BILINGUAL BY DESIGN</div>
          <h2>Logic has no<br /><em>language barrier.</em></h2>
          <p>
            English and Burmese are first-class experiences—not afterthoughts.
            Labels stay centered, readable, and complete at every zoom level.
          </p>
          <div className="language-switch"><span className="active">✓ English</span><span>မြန်မာဘာသာ</span></div>
        </div>
      </section>

      <section className="platform-section" id="download">
        <div className="section-label"><span>05</span> EVERYWHERE YOU LEARN</div>
        <div className="landing-section-heading centered">
          <h2>Choose your workspace.</h2>
          <p>Start in the browser, continue offline, and keep the same `.augo` project on every device.</p>
        </div>
        <div className="platform-cards">
          <Link className="platform-card featured" href="/editor">
            <div className="device-icon browser-device"><span /></div>
            <small>INSTANT ACCESS</small><h3>Web Editor</h3>
            <p>Launch immediately. Install as a PWA on iPad and work offline after your first visit.</p>
            <b>Launch editor <span>↗</span></b>
          </Link>
          <a className="platform-card" href="https://github.com/kaungkhantko26/Augorithm/releases/latest" target="_blank" rel="noreferrer">
            <div className="device-icon laptop-device"><span /></div>
            <small>APPLE SILICON</small><h3>macOS</h3>
            <p>Native desktop workflow with file associations, export dialogs, and in-app updates.</p>
            <b>Download for Mac <span>↓</span></b>
          </a>
          <a className="platform-card" href="https://github.com/kaungkhantko26/Augorithm/releases/latest" target="_blank" rel="noreferrer">
            <div className="device-icon windows-device"><span>⊞</span></div>
            <small>WINDOWS 10 / 11</small><h3>Windows</h3>
            <p>The complete editor, runner, code generators, and presentation-ready exports.</p>
            <b>Download for Windows <span>↓</span></b>
          </a>
        </div>
        <p className="release-note">Free and open source · Local-first projects · Augorithm 1.5 beta</p>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-heading">
          <div className="section-label"><span>06</span> QUESTIONS</div>
          <h2>Everything you need<br />to <em>start building.</em></h2>
          <Link href="/docs">Read the documentation <span>→</span></Link>
        </div>
        <div className="immersive-faq">
          <details open>
            <summary>Is Augorithm free?<i /></summary>
            <p>Yes. Augorithm is free and open source for students, teachers, and anyone learning programming logic.</p>
          </details>
          <details>
            <summary>Can I use Augorithm on an iPad?<i /></summary>
            <p>Yes. Open the web editor in Safari and choose Add to Home Screen for an installable, touch-friendly experience.</p>
          </details>
          <details>
            <summary>Does it run Python and JavaScript?<i /></summary>
            <p>Yes. The web editor uses isolated workers, while the desktop app can run Python with its local runtime.</p>
          </details>
          <details>
            <summary>Where are my projects stored?<i /></summary>
            <p>Your work stays local. The web app autosaves in your browser and both versions can import or export `.augo` files.</p>
          </details>
          <details>
            <summary>Can I export flowcharts for slides?<i /></summary>
            <p>Yes. Export PNG or selectable SVG, or copy a crisp diagram directly for PowerPoint, Canva, and documents.</p>
          </details>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-glow" />
        <Image src="/augorithm-icon.png" alt="" width={76} height={76} />
        <div>
          <span>YOUR NEXT ALGORITHM STARTS HERE</span>
          <h2>Think it. <em>Chart it.</em> Run it.</h2>
        </div>
        <Link className="cta cta-primary" href="/editor">Launch Web Editor <span>→</span></Link>
      </section>

      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Image src="/augorithm-icon.png" alt="" width={48} height={48} />
            <div><strong>AUGORITHM</strong><span>Visual programming for every learner.</span></div>
          </div>
          <div className="footer-column"><strong>PRODUCT</strong><a href="#features">Features</a><a href="#demo">Demo</a><a href="#download">Download</a><Link href="/editor">Web editor</Link></div>
          <div className="footer-column"><strong>LEARN</strong><Link href="/docs">Documentation</Link><a href="#faq">FAQ</a><a href="https://github.com/kaungkhantko26/Augorithm" target="_blank" rel="noreferrer">GitHub ↗</a></div>
          <div className="footer-newsletter"><strong>FOLLOW THE BUILD</strong><p>Releases, teaching tips, and new editor features.</p><a href="https://github.com/kaungkhantko26/Augorithm" target="_blank" rel="noreferrer">Watch on GitHub <span>↗</span></a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Augorithm. Built by Kaung Khant Ko.</span><span>Made for students · Built in Myanmar</span></div>
      </footer>
    </main>
  );
}
