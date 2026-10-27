import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { TechnicalLabel } from '../components/UIComponents';
import { seededRandom } from '../utils/geometry';

function HeroContent() {
  const { deviceTier, resources } = useScene();

  const maxParticles = deviceTier === 'high' ? 800 : deviceTier === 'medium' ? 400 : 200;

  const objectRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.5, 8);
    const pos = geo.attributes.position;
    const displacement = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      displacement[i] = Math.random() * 0.3;
    }
    geo.setAttribute('displacement', new THREE.BufferAttribute(displacement, 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1f,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      ior: 2.5,
      transmission: 0.1,
      thickness: 0.5,
      envMapIntensity: 1.5,
    });
    resources.trackMaterial(mat);
    return mat;
  }, [resources]);

  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = maxParticles;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    const rand = seededRandom(12345);

    for (let i = 0; i < count; i++) {
      const r = 3 + rand() * 4;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.5 + rand() * 1.5;
      alphas[i] = 0.1 + rand() * 0.4;
      velocities[i * 3] = (rand() - 0.5) * 0.002;
      velocities[i * 3 + 1] = (rand() - 0.5) * 0.002;
      velocities[i * 3 + 2] = (rand() - 0.5) * 0.002;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    resources.trackGeometry(geo);
    return geo;
  }, [maxParticles, resources]);

  const particleMat = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 1,
      transparent: true,
      opacity: 0.6,
      vertexColors: false,
      sizeAttenuation: true,
      color: 0xc8ff45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    resources.trackMaterial(mat);
    return mat;
  }, [resources]);

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
      <directionalLight position={[5, 10, 7]} intensity={2.5} color="#ffffff" castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={1.2} color="#c8ff45" />
      <pointLight position={[0, 3, 5]} intensity={1.5} color="#c8ff45" decay={2} distance={15} />

      <mesh ref={objectRef} geometry={geometry} material={material} castShadow receiveShadow>
        <primitive object={material} />
      </mesh>

      <points ref={particleRef} geometry={particleGeo} material={particleMat} />

      <primitive
        object={new THREE.Mesh(
          new THREE.PlaneGeometry(50, 50),
          new THREE.ShadowMaterial({ opacity: 0.15 })
        )}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.5, 0]}
        receiveShadow
      />
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function HeroScene() {
  const [showContent] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });

    tl.to('.hero-content', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.15,
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          shadows
        >
          <color attach="background" args={['#08090B']} />
          <fog attach="fog" args={['#08090B', 5, 25]} />
          <HeroContent />
        </Canvas>
      </div>

      <div className="section-content hero-content" style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.8s ease' }}>
        <div className="max-w-[1440px] mx-auto px-6 h-full flex flex-col items-center justify-center text-center">
          <div className="mb-12 flex flex-col items-center gap-4">
            <span className="overline" style={{ color: 'var(--accent)' }}>INTERACTIVE EXPERIMENT No. 001</span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.02] max-w-4xl" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              lineHeight: 1.02,
            }}>
              BEYOND
              <br />
              <span style={{ color: 'var(--accent)' }}>THE SURFACE.</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              An exploration of light, matter, motion, and the space between.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
            <TechnicalLabel label="REALTIME" value="WEBGL" />
            <TechnicalLabel label="ENGINE" value="THREE.JS" />
            <TechnicalLabel label="ANIMATION" value="GSAP" />
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <motion.div
              className="w-px h-16"
              animate={{ scaleY: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'linear-gradient(180deg, transparent, var(--accent), transparent)' }}
            />
            <span className="overline">SCROLL TO BEGIN</span>
          </div>
        </div>
      </div>
    </section>
  );
}