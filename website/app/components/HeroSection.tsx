"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import FlowchartScene3D from "./FlowchartScene3D";

interface HeroSectionProps {
  editorUrl: string;
}

/** Mini flowchart ribbon shown below the CTAs */
function LogicRibbon() {
  return (
    <div
      className="logic-ribbon"
      aria-label="An algorithm moving through connected flowchart symbols"
    >
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

export function HeroSection({ editorUrl }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);

  // Tie animation to hero section — stops when section leaves viewport
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Only animate Y, rotate, scale — never animate X or margin
  const y = useTransform(scrollYProgress, [0, 0.8, 1], [0, 90, 110]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 1.5]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  return (
    <section className="landing-hero" ref={heroRef}>
      <div className="hero-orbit orbit-one" aria-hidden="true" />
      <div className="hero-orbit orbit-two" aria-hidden="true" />

      <div className="hero__inner">
        {/* ── Left column: text + CTAs ── */}
        <div className="hero__content">
          <p className="hero-kicker">Visual algorithm learning for students</p>
          <h1>
            Your algorithm<br />makes sense.<br />
            <em>Your flowchart<br />should too.</em>
          </h1>
          <p className="hero-summary">
            From idea to pseudocode, flowchart, execution, and real
            code—Augorithm keeps everything connected and in sync.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href={editorUrl}>
              Try Augorithm <span aria-hidden="true">→</span>
            </Link>
            <a className="secondary-action" href="#how">See how it works</a>
          </div>

          <LogicRibbon />
        </div>

        {/* ── Right column: visual with scroll animation ── */}
        <div className="hero__visual">
          {/* Sticky wrapper — stays in view while hero scrolls */}
          <div className="hero__visual-sticky">
            {/* Layout center wrapper — uses grid, no transform centering */}
            <div className="hero__visual-center">
              {/* Motion wrapper — only Y, rotate, scale; never X */}
              <motion.div
                className="hero__visual-motion"
                style={{ y, rotate, scale }}
              >
                <FlowchartScene3D />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hint-track"><span className="hint-dot" /></span>
        <span className="hint-label">Scroll</span>
      </div>
    </section>
  );
}
