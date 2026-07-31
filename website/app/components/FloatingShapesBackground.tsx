"use client";

import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface FloatingShapesBackgroundProps {
  density?: 'sparse' | 'medium' | 'dense';
  className?: string;
}

/**
 * Renders ambient floating shapes in the background throughout the page
 * Uses small, semi-transparent shapes with gentle animations
 */
export default function FloatingShapesBackground({
  density = 'medium',
  className = '',
}: FloatingShapesBackgroundProps) {
  // Generate shape configurations based on density
  const shapeCounts = {
    sparse: 8,
    medium: 12,
    dense: 18,
  };

  const shapeCount = shapeCounts[density];

  // Shape types with colors matching flowchart theme
  const shapeTypes = [
    { geometry: 'box', color: '#3b82f6', size: 0.3 }, // Blue rectangle
    { geometry: 'sphere', color: '#8b5cf6', size: 0.2 }, // Purple circle
    { geometry: 'octahedron', color: '#f59e0b', size: 0.25 }, // Gold diamond
    { geometry: 'cylinder', color: '#ef4444', size: 0.2 }, // Red hexagon
    { geometry: 'cone', color: '#10b981', size: 0.25 }, // Green cone
  ];

  // Generate random shapes with varied positions
  const shapes = Array.from({ length: shapeCount }, (_, i) => {
    const shapeType = shapeTypes[i % shapeTypes.length];
    
    // Spread shapes across a large area
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 15;
    const z = (Math.random() - 0.5) * 10 - 5;

    return {
      id: i,
      ...shapeType,
      position: [x, y, z] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ] as [number, number, number],
      floatSpeed: 0.5 + Math.random() * 1.5,
      floatIntensity: 0.5 + Math.random(),
    };
  });

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          {/* Subtle ambient lighting */}
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.2} />

          {/* Render all floating shapes */}
          {shapes.map((shape) => (
            <Float
              key={shape.id}
              speed={shape.floatSpeed}
              rotationIntensity={0.3}
              floatIntensity={shape.floatIntensity}
            >
              <mesh
                position={shape.position}
                rotation={shape.rotation}
                scale={shape.size}
              >
                {renderGeometry(shape.geometry)}
                <meshStandardMaterial
                  color={shape.color}
                  transparent
                  opacity={0.15}
                  roughness={0.7}
                  metalness={0.3}
                />
              </mesh>
            </Float>
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Helper function to render different geometries
 */
function renderGeometry(type: string) {
  switch (type) {
    case 'box':
      return <boxGeometry args={[1, 1, 1]} />;
    case 'sphere':
      return <sphereGeometry args={[0.5, 16, 16]} />;
    case 'octahedron':
      return <octahedronGeometry args={[0.5, 0]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 0.3, 6]} />;
    case 'cone':
      return <coneGeometry args={[0.5, 1, 4]} />;
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}
