import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, ContactShadows, Float, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { ParticleTree, ParticleOrnaments, InteractiveLights, TopStar } from './SceneComponents';
import * as THREE from 'three';

interface SceneProps {
  isTreeAssembled: boolean;
}

const MorphingLuxuryTree: React.FC<{isFormed: boolean}> = ({ isFormed }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Rotation speed depends on state: chaotic/slow when scattered, majestic when formed
      const targetSpeed = isFormed ? 0.1 : 0.02;
      groupRef.current.rotation.y += targetSpeed * 0.05; // simplified delta logic
    }
  });

  return (
    <group ref={groupRef}>
      {/* The main pine needle cloud */}
      <ParticleTree isFormed={isFormed} />
      
      {/* Ornaments cloud */}
      <ParticleOrnaments isFormed={isFormed} />

      {/* Lights cloud */}
      <InteractiveLights isFormed={isFormed} />
      
      {/* Topper */}
      <TopStar isFormed={isFormed} />
    </group>
  );
};

export const Scene: React.FC<SceneProps> = ({ isTreeAssembled }) => {
  return (
    <div className="w-full h-screen bg-[#011a10]">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={45} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.1} />
        <spotLight 
            position={[10, 15, 10]} 
            angle={0.2} 
            penumbra={1} 
            intensity={2} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
            color="#ffeeb1"
        />
        <pointLight position={[-10, -5, -10]} intensity={1.5} color="#00ffaa" distance={20} />
        <rectAreaLight width={10} height={10} position={[0, 10, 0]} color="#FFD700" intensity={2} rotation={[-Math.PI/2, 0, 0]} />

        {/* The Star of the show */}
        <Float speed={isTreeAssembled ? 2 : 0.5} rotationIntensity={isTreeAssembled ? 0.1 : 0.5} floatIntensity={0.2}>
          <MorphingLuxuryTree isFormed={isTreeAssembled} />
        </Float>

        {/* Environment Reflections */}
        <Environment preset="city" />
        
        {/* Floor Reflections */}
        <ContactShadows resolution={1024} scale={30} blur={2.5} opacity={0.4} far={15} color="#000000" />
        
        {/* Atmosphere */}
        <Sparkles count={200} scale={12} size={4} speed={0.4} opacity={0.4} color="#FFD700" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Post Processing for the "Arix Signature" Look */}
        <EffectComposer enableNormalPass={false}>
            <Bloom 
                luminanceThreshold={1.2} 
                mipmapBlur 
                intensity={1.5} 
                radius={0.5}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.0} />
            <Noise opacity={0.03} /> 
        </EffectComposer>

        <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.8} 
            minDistance={5}
            maxDistance={18}
            autoRotate={isTreeAssembled} // Only rotate automatically when formed
            autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};