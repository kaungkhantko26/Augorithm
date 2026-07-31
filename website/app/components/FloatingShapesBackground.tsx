// Pure CSS ambient background shapes — no Three.js, works with SSR/Vite/Vercel
// Predefined positions avoid Math.random() hydration mismatches

const BG_SHAPES = [
  { top: "6%",  left: "2%",   shape: "fc-bg-oval",   delay: "0s",    dur: "14s" },
  { top: "9%",  left: "90%",  shape: "fc-bg-rect",   delay: "3s",    dur: "11s" },
  { top: "22%", left: "96%",  shape: "fc-bg-diamond", delay: "6s",   dur: "16s" },
  { top: "38%", left: "1%",   shape: "fc-bg-hex",    delay: "1.5s",  dur: "10s" },
  { top: "52%", left: "94%",  shape: "fc-bg-oval",   delay: "4s",    dur: "13s" },
  { top: "65%", left: "3%",   shape: "fc-bg-para",   delay: "7s",    dur: "9s"  },
  { top: "70%", left: "88%",  shape: "fc-bg-rect",   delay: "2s",    dur: "12s" },
  { top: "80%", left: "48%",  shape: "fc-bg-diamond", delay: "5s",   dur: "15s" },
  { top: "18%", left: "50%",  shape: "fc-bg-hex",    delay: "8s",    dur: "11s" },
  { top: "44%", left: "50%",  shape: "fc-bg-para",   delay: "0.5s",  dur: "17s" },
  { top: "88%", left: "18%",  shape: "fc-bg-oval",   delay: "3.5s",  dur: "10s" },
  { top: "85%", left: "72%",  shape: "fc-bg-rect",   delay: "6.5s",  dur: "14s" },
];

interface FloatingShapesBackgroundProps {
  density?: "sparse" | "medium" | "dense";
  className?: string;
}

export default function FloatingShapesBackground({
  density = "medium",
  className = "",
}: FloatingShapesBackgroundProps) {
  const count = density === "sparse" ? 6 : density === "dense" ? 12 : 9;
  const shapes = BG_SHAPES.slice(0, count);

  return (
    <div className={`fc-bg ${className}`} aria-hidden="true">
      {shapes.map((s, i) => (
        <div
          key={i}
          className={`fc-bg-shape ${s.shape}`}
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}
    </div>
  );
}
