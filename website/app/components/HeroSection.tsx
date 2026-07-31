"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FlowchartScene3D from "./FlowchartScene3D";

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fade out hero content as user scrolls
  const opacity = Math.max(0, 1 - scrollY / 400);
  const translateY = scrollY * 0.3;

  return (
    <section className="landing-hero" id="top">
      <div 
        className="landing-hero-grid"
        style={{ 
          opacity,
          transform: `translateY(${translateY}px)`
        }}
      >
        <div className="hero-text">
          <div className="launch-badge">
            <i /> Interactive 3D workspace · Web editor live
          </div>
          <h1>
            Build logic you can<br />
            <em>see, touch, and run.</em>
          </h1>
          <p>
            Turn pseudocode into a precise, editable flowchart. Explore every
            connection in 3D, execute it step by step, and generate real code.
          </p>
          <div className="landing-actions">
            <Link className="cta cta-primary" href="/editor">
              Try Web Editor <span>→</span>
            </Link>
            <a className="cta cta-secondary" href="#download">
              Download Augorithm <span>↓</span>
            </a>
          </div>
          <div className="hero-platforms" aria-label="Supported platforms">
            <span> macOS</span>
            <span>⊞ Windows</span>
            <span>▣ iPad</span>
            <span>◉ Offline</span>
          </div>
        </div>

        <div className="hero-visual">
          <FlowchartScene3D />
        </div>
      </div>

      <div 
        className="scroll-cue"
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
      >
        <span>Scroll to explore</span>
        <div className="scroll-indicator">
          <i />
        </div>
      </div>
    </section>
  );
}
