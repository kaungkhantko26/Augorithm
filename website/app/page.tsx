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
          <strong>IF data {'>'} max</strong>
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
            <span> macOS</span><span>⊞ Windows</span><span>▣ iPad</span><span>◉ Offline</span>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <span className="section-label">Capabilities</span>
        <h2>Everything you need to<br />teach, learn, or design logic.</h2>
        <div className="feature-grid">
          {features.map(({ icon, title, copy }) => (
            <article key={title}>
              <div className="feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-demo" id="demo">
        <span className="section-label">Interactive preview</span>
        <h2>See how it works</h2>
        <div className="demo-tabs">
          {demoLayers.map((label) => (
            <button
              key={label}
              type="button"
              className={demoLayer === label ? "active" : ""}
              onClick={() => setDemoLayer(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="demo-workspace">
          <WorkspacePreview layer={demoLayer} />
          {demoLayer === "Source" && (
            <div className="source-controls">
              <div className="source-tabs">
                {(["Java", "Python", "JavaScript", "Swift"] as SourceLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={sourceLanguage === lang ? "active" : ""}
                    onClick={() => setSourceLanguage(lang)}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button
                className="copy-button"
                type="button"
                onClick={copySource}
                aria-label="Copy source code"
              >
                {copied ? "✓ Copied" : "⎘ Copy"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="landing-download" id="download">
        <div className="download-shell">
          <span className="section-label">Get started</span>
          <h2>Download Augorithm</h2>
          <p>
            Free, offline-capable app for macOS, Windows, and iPad.
            No account, no tracking, no forced updates.
          </p>
          <div className="download-cards">
            <article>
              <div className="platform-icon"> </div>
              <h3>macOS</h3>
              <p>Universal binary (Intel + Apple Silicon)</p>
              <a className="dl-button" href="#macos-download">
                Download for Mac <span>↓</span>
              </a>
            </article>
            <article>
              <div className="platform-icon">⊞</div>
              <h3>Windows</h3>
              <p>Windows 10/11 · x64 installer</p>
              <a className="dl-button" href="#windows-download">
                Download for Windows <span>↓</span>
              </a>
            </article>
            <article>
              <div className="platform-icon">▣</div>
              <h3>iPad</h3>
              <p>Optimized for touch and Pencil input</p>
              <a className="dl-button" href="#ipad-download">
                Get on App Store <span>↗</span>
              </a>
            </article>
          </div>
          <div className="download-meta">
            <span>v1.0.0</span>
            <span>·</span>
            <span>12 MB</span>
            <span>·</span>
            <a href="/changelog">Release notes</a>
            <span>·</span>
            <a href="/verify">Verify checksums</a>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/augorithm-icon.png" alt="" width={32} height={32} />
            <strong>AUGORITHM</strong>
            <p>Open-source algorithm design and education tool.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <a href="#download">Download</a>
            <Link href="/editor">Web Editor</Link>
          </div>
          <div>
            <h4>Resources</h4>
            <Link href="/docs">Documentation</Link>
            <a href="/examples">Examples</a>
            <a href="/changelog">Changelog</a>
            <a href="/faq">FAQ</a>
          </div>
          <div>
            <h4>Community</h4>
            <a href="https://github.com/yourusername/augorithm">GitHub</a>
            <a href="/discord">Discord</a>
            <a href="/contribute">Contribute</a>
            <a href="/license">MIT License</a>
          </div>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} Augorithm Project</span>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </footer>
    </main>
  );
}
