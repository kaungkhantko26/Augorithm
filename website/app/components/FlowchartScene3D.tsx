'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import { Suspense } from 'react';
import FlowchartShape from './FlowchartShape';

interface FlowchartScene3DProps {
  className?: string;
  interactive?: boolean;
}

export default function FlowchartScene3D({ className = '', interactive = false }: FlowchartScene3DProps) {
  return (
    <div className={`absolute inset-0 ${className}`} style={{ pointerEvents: interactive ? 'auto' : 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#4a7ba7" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5b9bd5" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.8}
            castShadow
            color="#ffffff"
          />

          {/* Flowchart Shapes - Hero Section */}
          {/* Start/End - Purple Oval */}
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <FlowchartShape
              type="oval"
              position={[-3, 2, 0]}
              color="#63547f"
              label="START"
              scale={0.8}
            />
          </Float>

          {/* Input - Teal Parallelogram */}
          <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
            <FlowchartShape
              type="parallelogram"
              position={[-1, 1, -1]}
              color="#1e7145"
              label="INPUT"
              scale={0.7}
            />
          </Float>

          {/* Process - Blue Rectangle */}
          <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
            <FlowchartShape
              type="rectangle"
              position={[1, 0.5, -0.5]}
              color="#2e5c8a"
              label="PROCESS"
              scale={0.75}
            />
          </Float>

          {/* Decision - Gold Diamond */}
          <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.7}>
            <FlowchartShape
              type="diamond"
              position={[2.5, -0.5, -1.5]}
              color="#8b6914"
              label="IF?"
              scale={0.65}
            />
          </Float>

          {/* Loop - Orange Hexagon */}
          <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.5}>
            <FlowchartShape
              type="hexagon"
              position={[-2, -1, -2]}
              color="#b17c2c"
              label="LOOP"
              scale={0.7}
            />
          </Float>

          {/* Output - Green Parallelogram */}
          <Float speed={1.3} rotationIntensity={0.4} floatIntensity={0.6}>
            <FlowchartShape
              type="parallelogram"
              position={[0.5, -2, -1]}
              color="#5e9b69"
              label="OUTPUT"
              scale={0.7}
            />
          </Float>

          {/* End - Purple Oval */}
          <Float speed={1.7} rotationIntensity={0.2} floatIntensity={0.5}>
            <FlowchartShape
              type="oval"
              position={[3, -2.5, -0.5]}
              color="#63547f"
              label="END"
              scale={0.7}
            />
          </Float>

          {/* Camera Controls - Only enabled if interactive */}
          {interactive && (
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={0.5}
              maxDistance={15}
              minDistance={5}
            />
          )}

          {/* Fixed Camera for non-interactive */}
          {!interactive && <PerspectiveCamera makeDefault position={[0, 0, 10]} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
