import Image from "next/image";
import Link from "next/link";
import "./landing.css";
import FlowchartScene3D from "./components/FlowchartScene3D";
import FloatingShapesBackground from "./components/FloatingShapesBackground";

const editorUrl = "/editor";
const releaseUrl = "https://github.com/kaungkhantko26/Augorithm/releases/latest";

const proofPoints = [
  {
    label: "01 · KEEP THE IDEA",
    title: "Meet your algorithm’s new memory.",
    copy: "Write once, then keep pseudocode, flowchart, execution, and source code in sync.",
  },
  {
    label: "02 · CATCH THE GAP",
    title: "It finds problems before submission.",
    copy: "Disconnected arrows and invalid paths are flagged while you think—not after you export.",
  },
  {
    label: "03 · LEARN THE LOGIC",
    title: "Understand the idea before the syntax.",
    copy: "Natural classroom pseudocode keeps the lesson focused on reasoning before language rules.",
  },
];

const features = [
  {
    symbol: "{ }",
    title: "Pseudocode that draws itself",
    copy: "Write familiar classroom steps and watch a standards-based flowchart update beside them in real time.",
    accent: "blue",
  },
  {
    symbol: "▶",
    title: "Run and inspect",
    copy: "Enter values, step through symbols, and see variables change as your algorithm executes.",
    accent: "yellow",
  },
  {
    symbol: "∞",
    title: "Every device",
    copy: "Continue on web, Mac, Windows, or iPad without changing the way you think.",
    accent: "green",
  },
  {
    symbol: "↗",
    title: "Submit something clear",
    copy: "Export spacious PNG or SVG diagrams that are ready for reports, slides, and classroom review.",
    accent: "coral",
  },
];

const steps = [
  ["Write your logic", "Start with classroom-friendly pseudocode and useful inline feedback."],
  ["See the flow", "Watch the matching diagram form with clean branches and loop paths."],
  ["Run and inspect", "Enter values, step through symbols, and understand every result."],
  ["Export and submit", "Share a spacious diagram that reads clearly in reports and slides."],
];

function Brand() {
  return (
    <Link className="landing-brand" href="/" aria-label="Augorithm home">
      <span className="brand-mark">
        <Image src="/augorithm-icon.png" alt="" width={34} height={34} priority unoptimized />
      </span>
      <strong>AUGORITHM</strong>
    </Link>
  );
}

function LogicRibbon() {
  return (
    <div className="logic-ribbon" aria-label="An algorithm moving through connected flowchart symbols">
      <div className="logic-token token-start">
        <small>START</small>
        <strong>Begin</strong>
      </div>
      <span className="logic-connector" aria-hidden="true"><i /></span>
      <div className="logic-token token-process">
        <small>ASSIGN</small>
        <strong>total = score ÷ count</strong>
      </div>
      <span className="logic-connector" aria-hidden="true"><i /></span>
      <div className="logic-token token-decision">
        <small>IF?</small>
        <strong>passed</strong>
      </div>
      <span className="logic-connector" aria-hidden="true"><i /></span>
      <div className="logic-token token-output">
        <small>OUTPUT</small>
        <strong>Result ✓</strong>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing-shell">
      {/* Ambient floating shapes throughout the page */}
      <FloatingShapesBackground density="medium" />
      
      <header className="landing-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <Link className="nav-launch" href={editorUrl}>
          Open the editor <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="landing-hero">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        
        {/* CSS 3D flowchart shapes — no WebGL dependency */}
        <FlowchartScene3D />
        
        <p className="hero-kicker">Visual algorithm learning for students</p>
        <h1>Your algorithm makes sense.<br /><em>Your flowchart should too.</em></h1>
        <p className="hero-summary">
          From idea to pseudocode, flowchart, execution, and real code—Augorithm
          keeps everything connected and in sync.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href={editorUrl}>
            Try Augorithm <span aria-hidden="true">→</span>
          </Link>
          <a className="secondary-action" href="#how">See how it works</a>
        </div>

        <LogicRibbon />

        <div className="hero-scroll-hint" aria-hidden="true">
          <span className="hint-track"><span className="hint-dot" /></span>
          <span className="hint-label">Scroll</span>
        </div>
      </section>

      <section className="proof-grid" aria-label="Why students use Augorithm">
        {proofPoints.map((point) => (
          <article key={point.label}>
            <small>{point.label}</small>
            <h2>{point.title}</h2>
            <p>{point.copy}</p>
          </article>
        ))}
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <p>One workspace. The whole idea.</p>
          <h2>Everything a flowchart tool<br />wishes it could do.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className={`feature-card accent-${feature.accent}`} key={feature.title}>
              <span className="feature-symbol" aria-hidden="true">{feature.symbol}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
              <span className="feature-index" aria-hidden="true">0{index + 1}</span>
            </article>
          ))}
        </div>
        <p className="feature-note">
          Most flowchart tools make you manage the diagram. Augorithm keeps your
          logic, arrows, execution, and code together. That’s the whole point.
        </p>
      </section>

      <section className="workflow-section" id="how">
        <div className="section-heading">
          <p>From thought to submission</p>
          <h2>Four steps.<br />That’s the workflow.</h2>
        </div>
        <ol className="workflow-grid">
          {steps.map(([title, copy], index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div><h3>{title}</h3><p>{copy}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <div className="platform-marquee" aria-label="Augorithm platform and product highlights">
        <div>
          <span>No account</span><i>•</i><span>Local autosave</span><i>•</i>
          <span>Web</span><i>•</i><span>Mac</span><i>•</i><span>Windows</span><i>•</i>
          <span>iPad</span><i>•</i><span>English + မြန်မာ</span><i>•</i>
          <span>PNG + SVG</span>
        </div>
      </div>

      <section className="final-cta">
        <div className="final-mark" aria-hidden="true">AU</div>
        <p>Your next algorithm already<br />knows where to go.</p>
        <span>Start instantly in the browser. No account, no setup, no tool switching.</span>
        <div className="final-actions">
          <Link href={editorUrl}>Launch Web Editor <b aria-hidden="true">→</b></Link>
          <a href={releaseUrl} target="_blank" rel="noreferrer">Download desktop app</a>
        </div>
      </section>

      <footer className="landing-footer">
        <Brand />
        <p>Think it. Chart it. Run it.</p>
        <span>© 2026 Augorithm · Built by Kaung Khant Ko</span>
      </footer>
    </main>
  );
}
