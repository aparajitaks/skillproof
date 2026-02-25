/**
 * Particle Field Background
 * Subtle floating particles using Three.js
 */
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = ({ count = 500 }) => {
  const mesh = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const color1 = new THREE.Color('#6366f1');
    const color2 = new THREE.Color('#a855f7');
    const color3 = new THREE.Color('#06b6d4');
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spread particles in a sphere
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random color blend
      const colorChoice = Math.random();
      const selectedColor = colorChoice < 0.33 ? color1 : colorChoice < 0.66 ? color2 : color3;
      colors[i3] = selectedColor.r;
      colors[i3 + 1] = selectedColor.g;
      colors[i3 + 2] = selectedColor.b;
      
      // Random sizes
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    return { positions, colors, sizes };
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const GlowingSphere = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.1;
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
      mesh.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[2, 1]} />
      <meshBasicMaterial
        color="#6366f1"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <Particles count={400} />
      <GlowingSphere />
    </>
  );
};

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-base via-[#0a0a1a] to-base" />
      
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ 
          position: 'absolute', 
          inset: 0,
          pointerEvents: 'none',
        }}
        gl={{ 
          antialias: true,
          alpha: true,
        }}
      >
        <Scene />
      </Canvas>
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-base/50 via-transparent to-transparent" />
    </div>
  );
};

export default ParticleBackground;
