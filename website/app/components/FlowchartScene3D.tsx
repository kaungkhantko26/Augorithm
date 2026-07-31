// Pure CSS 3D animated flowchart shapes.
// Renders as a contained block element inside the hero visual column.
// No absolute inset-0; width/height set by parent + aspect-ratio here.
export default function FlowchartScene3D({ className = "" }: { className?: string }) {
  return (
    <div className={`fc3d-scene ${className}`} aria-hidden="true">
      {/* START oval – top-left */}
      <div className="fc3d-shape fc3d-oval fc3d-purple fc3d-pos-1">
        <span>START</span>
      </div>

      {/* Process rectangle – top-right */}
      <div className="fc3d-shape fc3d-rect fc3d-navy fc3d-pos-2">
        <span>total = 0</span>
      </div>

      {/* Decision diamond – right center */}
      <div className="fc3d-shape fc3d-diamond fc3d-gold fc3d-pos-3">
        <span>passed?</span>
      </div>

      {/* Input parallelogram – left center */}
      <div className="fc3d-shape fc3d-para fc3d-green fc3d-pos-4">
        <span>INPUT mark</span>
      </div>

      {/* Loop hexagon – lower-left */}
      <div className="fc3d-shape fc3d-hex fc3d-orange fc3d-pos-5">
        <span>For i to n</span>
      </div>

      {/* Output parallelogram – lower-right */}
      <div className="fc3d-shape fc3d-para fc3d-teal fc3d-pos-6">
        <span>OUTPUT result</span>
      </div>

      {/* END oval – lower-right */}
      <div className="fc3d-shape fc3d-oval fc3d-purple fc3d-pos-7">
        <span>END</span>
      </div>
    </div>
  );
}
