import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { useReducedMotion } from '../hooks';
import { ResetButton } from '../components/UIComponents';
import { motion } from 'framer-motion';

function FinalContent() {
  const { reducedMotion } = useScene();
  const prefersReduced = useReducedMotion();
  const _isReduced = reducedMotion || prefersReduced;

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.8, 8);
    const pos = geo.attributes.position;
    const displacement = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      displacement[i] = Math.random() * 0.2;
    }
    geo.setAttribute('displacement', new THREE.BufferAttribute(displacement, 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0f,
      metalness: 0.9,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      ior: 2.5,
      transmission: 0.05,
      thickness: 0.3,
      envMapIntensity: 2,
    });
    return mat;
  }, []);

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

  useFrame((state) => {
    if (_isReduced) return;
    state.scene.rotation.y += 0.02;
    state.scene.rotation.x += 0.01;
  });

  return (
    <group>
      <EnvironmentMap envMap={envMap} />
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={3} color="#ffffff" castShadow />
      <pointLight position={[0, 5, 5]} intensity={2} color="#c8ff45" decay={2} distance={20} />
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <primitive
        object={new THREE.Mesh(
          new THREE.PlaneGeometry(100, 100),
          new THREE.ShadowMaterial({ opacity: 0.08 })
        )}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4, 0]}
        receiveShadow
      />
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function FinalScene() {
  const [_replaying, setReplaying] = useState(false);

  const handleReplay = () => {
    setReplaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setReplaying(false), 1000);
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleExplore = () => {
    const materialsSection = document.getElementById('materials');
    if (materialsSection) {
      materialsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="final" className="relative min-h-screen flex items-center justify-center">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          shadows
        >
          <color attach="background" args={['#08090B']} />
          <fog attach="fog" args={['#08090B', 5, 30]} />
          <FinalContent />
        </Canvas>
      </div>

      <div className="section-content flex flex-col items-center justify-center min-h-screen text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-3xl"
        >
          <span className="overline mb-6 block" style={{ color: 'var(--accent)' }}>
            SECTION 06
          </span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.02] mb-6" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            lineHeight: 1.02,
          }}>
            YOU HAVE
            <br />
            <span style={{ color: 'var(--accent)' }}>SEEN THE SURFACE.</span>
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Now change what happens beneath it.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={handleReplay}
              className="btn-primary group px-8 py-4 text-base"
            >
              <span className="relative z-10">REPLAY EXPERIENCE</span>
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M3 12a9 9 0 1 0 9-9.975L3 12z" />
                <path d="M3 12h6v6" />
              </svg>
              <span className="absolute inset-0 bg-[var(--accent-hover)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 -z-10" />
            </button>

            <ResetButton onClick={handleReset} label="RESET ALL" />

            <button
              onClick={handleExplore}
              className="btn-outline-cyan group px-8 py-4 text-base"
            >
              <span className="relative z-10">EXPLORE AGAIN</span>
              <svg className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M9 5l7 7-7 7" />
              </svg>
              <span className="absolute inset-0 bg-[var(--cyan)]/20 scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-300 -z-10" />
            </button>
          </div>

          <div className="pt-16 border-t max-w-2xl mx-auto" style={{ borderColor: 'var(--border)' }}>
            <p className="overline mb-2">TECHNOLOGIES</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>React</span>
              <span>•</span>
              <span>TypeScript</span>
              <span>•</span>
              <span>Three.js</span>
              <span>•</span>
              <span>React Three Fiber</span>
              <span>•</span>
              <span>Drei</span>
              <span>•</span>
              <span>GSAP</span>
              <span>•</span>
              <span>ScrollTrigger</span>
              <span>•</span>
              <span>Lenis</span>
              <span>•</span>
              <span>Vite</span>
              <span>•</span>
              <span>GLSL</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}