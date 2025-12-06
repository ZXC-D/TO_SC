import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

// --- Materials ---

const GoldMaterial = new THREE.MeshStandardMaterial({
  color: "#FFD700",
  roughness: 0.15,
  metalness: 1.0,
  emissive: "#b8860b",
  emissiveIntensity: 0.2,
});

const EmeraldMaterial = new THREE.MeshStandardMaterial({
  color: "#013b25", // Richer green
  roughness: 0.4,
  metalness: 0.3,
});

const LightMaterial = new THREE.MeshStandardMaterial({
  color: "#fffae0",
  emissive: "#fffae0",
  emissiveIntensity: 5,
  toneMapped: false,
});

// --- Math Helpers ---

const randomInSphere = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// --- Particle Tree ---

interface ParticleTreeProps {
  isFormed: boolean;
}

export const ParticleTree: React.FC<ParticleTreeProps> = ({ isFormed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 1800; // Number of needles
  const radius = 12; // Scatter radius

  // Precompute dual positions
  const { treeTransforms, scatterTransforms } = useMemo(() => {
    const tTransforms = [];
    const sTransforms = [];
    const layers = 6;
    const height = 6.5;
    const baseRadius = 2.8;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
        // --- Tree Shape Calculation ---
        // Distribute particles somewhat evenly across conical layers
        const layerIndex = Math.floor(Math.random() * layers);
        const t = layerIndex / layers; // 0 to 1 (bottom to top)
        
        // Adjust geometry for conical layers
        const layerY = (t - 0.5) * height; 
        const layerR = baseRadius * (1 - t * 0.9);
        
        // Random placement within the "volume" of the branch layer
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * layerR; 
        
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = layerY - (Math.random() * 0.5); // Thickness variation

        // Orientation: Needles point slightly out and down
        dummy.position.set(x, y, z);
        dummy.lookAt(x * 2, y - 1, z * 2); // Point outward-down
        dummy.scale.setScalar(0.5 + Math.random() * 0.5);
        dummy.updateMatrix();
        tTransforms.push(dummy.matrix.clone());

        // --- Scatter Shape Calculation ---
        const pos = randomInSphere(radius);
        dummy.position.copy(pos);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.scale.setScalar(0.2 + Math.random() * 0.8);
        dummy.updateMatrix();
        sTransforms.push(dummy.matrix.clone());
    }
    return { treeTransforms: tTransforms, scatterTransforms: sTransforms };
  }, []);

  // Since useFrame is running 60fps, we need a persistent state for the animation progress
  const progress = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = isFormed ? 1 : 0;
    // Standard lerp for the animation frame
    const speed = 2.5 * delta;
    if (Math.abs(progress.current - target) > 0.001) {
        progress.current = THREE.MathUtils.lerp(progress.current, target, speed);
        
        const dummy = new THREE.Object3D();
        const tempPos = new THREE.Vector3();
        const tempQuat = new THREE.Quaternion();
        const tempScale = new THREE.Vector3();

        const treePos = new THREE.Vector3();
        const treeQuat = new THREE.Quaternion();
        const treeScale = new THREE.Vector3();

        const scatterPos = new THREE.Vector3();
        const scatterQuat = new THREE.Quaternion();
        const scatterScale = new THREE.Vector3();

        for (let i = 0; i < count; i++) {
            // Decompose precomputed matrices
            treeTransforms[i].decompose(treePos, treeQuat, treeScale);
            scatterTransforms[i].decompose(scatterPos, scatterQuat, scatterScale);

            // Interpolate
            tempPos.lerpVectors(scatterPos, treePos, progress.current);
            tempQuat.slerpQuaternions(scatterQuat, treeQuat, progress.current);
            tempScale.lerpVectors(scatterScale, treeScale, progress.current);

            // Apply swirl effect during transition
            if (progress.current > 0.01 && progress.current < 0.99) {
                const angle = (1 - progress.current) * Math.PI * 2; // Spin as they come in
                const axis = new THREE.Vector3(0, 1, 0);
                tempPos.applyAxisAngle(axis, angle);
            }

            dummy.position.copy(tempPos);
            dummy.quaternion.copy(tempQuat);
            dummy.scale.copy(tempScale);
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {/* Tetrahedron for stylized, sharp needle look */}
      <tetrahedronGeometry args={[0.15, 0]} />
      <primitive object={EmeraldMaterial} />
    </instancedMesh>
  );
};


// --- Interactive Ornaments ---

interface ParticleOrnamentsProps {
    isFormed: boolean;
}

export const ParticleOrnaments: React.FC<ParticleOrnamentsProps> = ({ isFormed }) => {
    // We'll use two instanced meshes: one for spheres, one for diamonds
    // This simplifies the geometry binding.
    return (
        <group>
            <InstancedOrnamentShape isFormed={isFormed} type="sphere" count={40} />
            <InstancedOrnamentShape isFormed={isFormed} type="diamond" count={30} />
        </group>
    );
};

const InstancedOrnamentShape: React.FC<{isFormed: boolean, type: 'sphere'|'diamond', count: number}> = ({ isFormed, type, count }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const progress = useRef(0);
    const scatterRadius = 10;

    const { treeTransforms, scatterTransforms, colors } = useMemo(() => {
        const tTrans = [];
        const sTrans = [];
        const cols = [];
        const dummy = new THREE.Object3D();
        const baseRadius = 2.6;
        const height = 6;

        for(let i=0; i<count; i++) {
            // Tree Pos
            // Spiral distribution
            const t = i / count;
            const h = (t - 0.5) * height; // Bottom to top
            const angle = t * Math.PI * 10; // 5 turns
            const r = (baseRadius * (1 - t)) + 0.2; // On surface
            
            const tx = Math.cos(angle) * r;
            const tz = Math.sin(angle) * r;
            const ty = h;

            dummy.position.set(tx, ty, tz);
            dummy.rotation.set(0, angle, 0);
            dummy.scale.setScalar(type === 'diamond' ? 0.15 : 0.2);
            dummy.updateMatrix();
            tTrans.push(dummy.matrix.clone());

            // Scatter Pos
            const sPos = randomInSphere(scatterRadius);
            dummy.position.copy(sPos);
            dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            dummy.scale.setScalar(0); // Start scale 0 when scattered? Or just full scale. Let's do full.
            dummy.updateMatrix();
            sTrans.push(dummy.matrix.clone());

            // Color
            const isGold = Math.random() > 0.4;
            const color = new THREE.Color(isGold ? "#FFD700" : "#C0C0C0");
            cols.push(color.r, color.g, color.b);
        }
        return { treeTransforms: tTrans, scatterTransforms: sTrans, colors: new Float32Array(cols) };
    }, [count, type]);

    useLayoutEffect(() => {
        if(meshRef.current) {
            for(let i=0; i<count; i++) {
                meshRef.current.setColorAt(i, new THREE.Color(colors[i*3], colors[i*3+1], colors[i*3+2]));
            }
            meshRef.current.instanceColor!.needsUpdate = true;
        }
    }, [colors, count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const target = isFormed ? 1 : 0;
        const speed = 2 * delta;
        
        if (Math.abs(progress.current - target) > 0.001) {
            progress.current = THREE.MathUtils.lerp(progress.current, target, speed);
            
            const dummy = new THREE.Object3D();
            const pos = new THREE.Vector3();
            const rot = new THREE.Quaternion();
            const sca = new THREE.Vector3();

            const tPos = new THREE.Vector3();
            const tRot = new THREE.Quaternion();
            const tSca = new THREE.Vector3();

            const sPos = new THREE.Vector3();
            const sRot = new THREE.Quaternion();
            const sSca = new THREE.Vector3();

            for(let i=0; i<count; i++) {
                 treeTransforms[i].decompose(tPos, tRot, tSca);
                 scatterTransforms[i].decompose(sPos, sRot, sSca);

                 // Add a slight delay based on index for "zipper" effect
                 const effectiveProgress = Math.max(0, Math.min(1, (progress.current * 1.5) - (i/count)*0.5));
                 
                 pos.lerpVectors(sPos, tPos, effectiveProgress);
                 rot.slerpQuaternions(sRot, tRot, effectiveProgress);
                 sca.lerpVectors(sSca, tSca, effectiveProgress);

                 dummy.position.copy(pos);
                 dummy.quaternion.copy(rot);
                 dummy.scale.copy(sca);
                 dummy.updateMatrix();
                 meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
        
        // Continuous rotation for diamonds
        if (type === 'diamond' && isFormed && Math.abs(progress.current - 1) < 0.01) {
             const dummy = new THREE.Object3D();
             const m = new THREE.Matrix4();
             for(let i=0; i<count; i++) {
                meshRef.current.getMatrixAt(i, m);
                m.decompose(dummy.position, dummy.quaternion, dummy.scale);
                dummy.rotation.y += 0.02; 
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
             }
             meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
             {type === 'sphere' ? <sphereGeometry args={[1, 16, 16]} /> : <octahedronGeometry args={[1]} />}
             <meshStandardMaterial metalness={1} roughness={0.1} />
        </instancedMesh>
    );
}

// --- Interactive Lights ---

export const InteractiveLights: React.FC<{isFormed: boolean}> = ({ isFormed }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 100;
    const progress = useRef(0);

    const { treeTransforms, scatterTransforms } = useMemo(() => {
        const tT = [];
        const sT = [];
        const dummy = new THREE.Object3D();
        const height = 6.5;
        const radius = 2.8;

        for(let i=0; i<count; i++) {
             // Tree: Spiral
             const t = i/count;
             const angle = t * Math.PI * 16; // Many turns
             const y = (t - 0.5) * height;
             const r = (radius * (1-t)) + 0.3; // Offset from tree surface
             const x = Math.cos(angle) * r;
             const z = Math.sin(angle) * r;

             dummy.position.set(x,y,z);
             dummy.scale.setScalar(0.05);
             dummy.updateMatrix();
             tT.push(dummy.matrix.clone());

             // Scatter
             const sPos = randomInSphere(12);
             dummy.position.copy(sPos);
             dummy.scale.setScalar(0.01); // Shrink when scattered
             dummy.updateMatrix();
             sT.push(dummy.matrix.clone());
        }
        return { treeTransforms: tT, scatterTransforms: sT };
    }, []);

    useFrame((state, delta) => {
        if(!meshRef.current) return;
        const target = isFormed ? 1 : 0;
        const speed = 1.5 * delta;
        
        if (Math.abs(progress.current - target) > 0.001) {
            progress.current = THREE.MathUtils.lerp(progress.current, target, speed);
            
            const dummy = new THREE.Object3D();
            const pos = new THREE.Vector3();
            const sca = new THREE.Vector3();
            const q = new THREE.Quaternion(); // Identity

            const tPos = new THREE.Vector3();
            const tSca = new THREE.Vector3();
            
            const sPos = new THREE.Vector3();
            const sSca = new THREE.Vector3();

            for(let i=0; i<count; i++) {
                treeTransforms[i].decompose(tPos, q, tSca);
                scatterTransforms[i].decompose(sPos, q, sSca);

                pos.lerpVectors(sPos, tPos, progress.current);
                sca.lerpVectors(sSca, tSca, progress.current);

                // Blink effect
                const blink = Math.sin(state.clock.elapsedTime * 5 + i) * 0.5 + 0.5;
                sca.multiplyScalar(0.8 + blink * 0.4);

                dummy.position.copy(pos);
                dummy.scale.copy(sca);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        } else if (isFormed) {
             // Just blink when stable
             const dummy = new THREE.Object3D();
             const m = new THREE.Matrix4();
             const p = new THREE.Vector3();
             const q = new THREE.Quaternion();
             const s = new THREE.Vector3();
             
             for(let i=0; i<count; i++) {
                 meshRef.current.getMatrixAt(i, m);
                 m.decompose(p,q,s);
                 
                 // Restore base scale
                 const tSca = new THREE.Vector3();
                 treeTransforms[i].decompose(new THREE.Vector3(), new THREE.Quaternion(), tSca);
                 
                 const blink = Math.sin(state.clock.elapsedTime * 3 + i * 0.5) * 0.5 + 0.5;
                 p.y += Math.sin(state.clock.elapsedTime + i)*0.002; // Float slightly
                 
                 dummy.position.copy(p);
                 dummy.scale.copy(tSca).multiplyScalar(0.8 + blink * 0.5);
                 dummy.updateMatrix();
                 meshRef.current.setMatrixAt(i, dummy.matrix);
             }
             meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <primitive object={LightMaterial} />
        </instancedMesh>
    );
};

export const TopStar: React.FC<{isFormed: boolean}> = ({ isFormed }) => {
    const ref = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if(ref.current) {
            // Move to top when formed, float high when scattered
            const targetY = isFormed ? 3.4 : 6;
            ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.05);
            
            ref.current.rotation.y = state.clock.elapsedTime * 0.5;
            ref.current.scale.setScalar(
                (1 + Math.sin(state.clock.elapsedTime * 2) * 0.1) * (isFormed ? 1 : 0.5)
            );
        }
    });

    return (
        <group ref={ref}>
            <Octahedron args={[0.4, 0]} castShadow>
                <meshStandardMaterial 
                    color="#FFD700" 
                    emissive="#FFD700"
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </Octahedron>
            <pointLight distance={5} intensity={5} color="#FFD700" />
        </group>
    );
};