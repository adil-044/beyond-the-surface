import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { useReducedMotion } from '../hooks';
import { SectionHeading } from '../components/UIComponents';
import { seededRandom } from '../utils/geometry';
import { motion } from 'framer-motion';

const STAGES = [
  { id: 0, label: '01 / FORM', description: 'The object rotates slowly, revealing its silhouette, material, and lighting.' },
  { id: 1, label: '02 / DISASSEMBLY', description: 'The object separates into multiple pieces. Each piece follows a controlled path away from the central form.' },
  { id: 2, label: '03 / ORBITAL SYSTEM', description: 'The fragments form a structured orbital arrangement around a central point. Introduce depth, varied angular velocity, and subtle motion trails.' },
  { id: 3, label: '04 / RETURN TO ONE', description: 'The fragments return to their original positions, reconstructing the main object.' },
];

const SUPPORTING_TEXT = 'Every structure contains the possibility of another.';

function TransformationContent() {
  const { deviceTier } = useScene();

  const fragmentCount = deviceTier === 'high' ? 200 : deviceTier === 'medium' ? 100 : 40;

  const mainGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.5, 8);
    const pos = geo.attributes.position;
    const displacement = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      displacement[i] = Math.random() * 0.3;
    }
    geo.setAttribute('displacement', new THREE.BufferAttribute(displacement, 1));
    return geo;
  }, []);

  const fragmentGeometries = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const rand = seededRandom(42);
    for (let i = 0; i < fragmentCount; i++) {
      const size = 0.1 + rand() * 0.3;
      const geo = new THREE.TetrahedronGeometry(size, 1);
      geos.push(geo);
    }
    return geos;
  }, [fragmentCount]);

  const fragmentMaterials = useMemo(() => {
    const mats: THREE.MeshPhysicalMaterial[] = [];
    const rand = seededRandom(43);
    for (let i = 0; i < fragmentCount; i++) {
      const hue = rand() * 60 + 80;
      mats.push(new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(hue / 360, 0.8, 0.4),
        metalness: 0.7 + rand() * 0.3,
        roughness: 0.2 + rand() * 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
      }));
    }
    return mats;
  }, [fragmentCount]);

  const fragmentPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];
    const targetPositions: THREE.Vector3[] = [];
    const rand = seededRandom(44);

    for (let i = 0; i < fragmentCount; i++) {
      positions.push(new THREE.Vector3(0, 0, 0));
      velocities.push(new THREE.Vector3(
        (rand() - 0.5) * 0.02,
        (rand() - 0.5) * 0.02,
        (rand() - 0.5) * 0.02
      ));
      const r = 3 + rand() * 4;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      targetPositions.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }
    return { positions, velocities, targetPositions };
  }, [fragmentCount]);

  const envMap = useMemo(() => {
    const pmremGenerator = new THREE.PMREMGenerator(undefined as any);
    const scene = new THREE.Scene();
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    const hdr = pmremGenerator.fromScene(scene);
    pmremGenerator.dispose();
    return hdr.texture;
  }, []);

  return (
    <group>
      <EnvironmentMap envMap={envMap} />

      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={3} color="#ffffff" castShadow />
      <pointLight position={[0, 5, 5]} intensity={2} color="#c8ff45" decay={2} distance={20} />

      <mesh
        geometry={mainGeometry}
        material={new THREE.MeshPhysicalMaterial({
          color: 0x1a1a1f,
          metalness: 0.9,
          roughness: 0.1,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 1.5,
        })}
        castShadow
        receiveShadow
      />

      {fragmentGeometries.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={fragmentMaterials[i]}
          castShadow
          receiveShadow
          userData={{ targetPosition: fragmentPositions.targetPositions[i] }}
        />
      ))}

      <primitive
        object={new THREE.Mesh(
          new THREE.PlaneGeometry(100, 100),
          new THREE.ShadowMaterial({ opacity: 0.1 })
        )}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5, 0]}
        receiveShadow
      />
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function TransformationScene() {
  const { reducedMotion } = useScene();
  const prefersReduced = useReducedMotion();
  const _isReduced = reducedMotion || prefersReduced;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (_isReduced) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = document.getElementById('transformation')?.getBoundingClientRect();
          if (rect) {
            const viewportHeight = window.innerHeight;
            const start = rect.top;
            const total = rect.height + window.innerHeight;
            const prog = Math.max(0, Math.min(1, (viewportHeight - start) / total * 2));
            setProgress(prog);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [_isReduced]);

  return (
    <section id="transformation" className="relative min-h-screen bg-[var(--surface)]">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          shadows
        >
          <color attach="background" args={['#08090B']} />
          <fog attach="fog" args={['#08090B', 5, 30]} />
          <TransformationContent />
        </Canvas>
      </div>

      <div className="section-content">
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-20 w-72">
          <SectionHeading
            label="SCROLL SEQUENCE"
            title="TRANSFORMATION\nSEQUENCE"
          />
          <p className="text-[var(--text-muted)] mb-8" style={{ fontSize: '14px', lineHeight: 1.7 }}>
            {SUPPORTING_TEXT}
          </p>

          <div className="space-y-8">
            {STAGES.map((stage, i) => (
              <div
                key={i}
                className="group relative pl-8 pb-12 transition-all duration-500"
                style={{
                  opacity: progress >= i * 0.25 ? 1 : 0.3,
                  transform: progress >= i * 0.25 ? 'translateX(0)' : 'translateX(-20px)',
                  borderLeft: `2px solid ${progress >= i * 0.25 ? 'var(--accent)' : 'var(--border)'}`,
                  paddingLeft: '16px',
                }}
              >
                <motion.div
                  className="absolute left-0 top-0 w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    background: progress >= i * 0.25 ? 'var(--accent)' : 'var(--border)',
                    transform: progress >= i * 0.25 ? 'scale(1.5)' : 'scale(1)',
                    border: `2px solid ${progress >= i * 0.25 ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                />
                <span className="overline mb-1 block">{stage.label}</span>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{stage.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="overline mb-2">STAGE PROGRESS</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ scaleX: progress }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: 'linear-gradient(90deg, var(--accent), var(--cyan))',
                  transformOrigin: 'left',
                }}
              />
            </div>
          </div>
        </div>

        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 hidden md:block w-64">
          <div className="text-right">
            <p className="overline mb-2">PROGRESS</p>
            <div className="font-mono text-4xl md:text-6xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
              {Math.round(progress * 100)}%
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mt-4" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ scaleX: progress }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: 'linear-gradient(90deg, var(--accent), var(--cyan))',
                  transformOrigin: 'right',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}