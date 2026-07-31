'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import * as THREE from 'three';

interface FlowchartShapeProps {
  type: 'oval' | 'rectangle' | 'diamond' | 'hexagon' | 'parallelogram';
  position: [number, number, number];
  color: string;
  label?: string;
  scale?: number;
}

export default function FlowchartShape({
  type,
  position,
  color,
  label = '',
  scale = 1,
}: FlowchartShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;
      
      // Subtle scale pulse on hover
      const targetScale = hovered ? scale * 1.1 : scale;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  // Create geometry based on type
  const createGeometry = () => {
    switch (type) {
      case 'oval':
        // Ellipsoid for Start/End
        return <sphereGeometry args={[1, 32, 16]} />;
      
      case 'rectangle':
        // Rectangle for Process
        return <boxGeometry args={[2, 1, 0.3]} />;
      
      case 'diamond':
        // Diamond for Decision
        return (
          <octahedronGeometry args={[0.8, 0]} />
        );
      
      case 'hexagon':
        // Hexagon for Loop
        return <cylinderGeometry args={[1, 1, 0.3, 6]} />;
      
      case 'parallelogram':
        // Parallelogram for Input/Output - created with custom shape
        const shape = new THREE.Shape();
        shape.moveTo(-1, -0.5);
        shape.lineTo(0.7, -0.5);
        shape.lineTo(1, 0.5);
        shape.lineTo(-0.7, 0.5);
        shape.closePath();
        
        const extrudeSettings = {
          depth: 0.3,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.05,
          bevelSegments: 3,
        };
        
        return <extrudeGeometry args={[shape, extrudeSettings]} />;
      
      default:
        return <boxGeometry args={[1, 1, 0.3]} />;
    }
  };

  // Parse color to get lighter version for glow
  const getGlowColor = (baseColor: string) => {
    const color = new THREE.Color(baseColor);
    color.offsetHSL(0, 0, 0.3); // Lighten by 30%
    return color;
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
        rotation={type === 'diamond' ? [0, 0, Math.PI / 4] : [0, 0, 0]}
      >
        {createGeometry()}
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.2}
        />
        <Edges
          scale={1}
          threshold={15}
          color={hovered ? '#ffffff' : getGlowColor(color)}
          lineWidth={hovered ? 2 : 1}
        />
      </mesh>

      {/* Label Text */}
      {label && (
        <Text
          position={[0, 0, 0.3]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}

      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight
          position={[0, 0, 1]}
          intensity={1}
          distance={5}
          color={color}
        />
      )}
    </group>
  );
}
