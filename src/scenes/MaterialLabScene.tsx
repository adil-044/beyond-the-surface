import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SectionHeading, ParameterSlider, ToggleControl, SelectControl, StatusIndicator } from '../components/UIComponents';

const MATERIALS = [
  { id: 'chrome', name: 'CHROME', color: 0x2a2a2f, metalness: 1, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, transmission: 0, envMapIntensity: 2 },
  { id: 'liquid', name: 'LIQUID', color: 0x00d4aa, metalness: 0.3, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transmission: 0.95, thickness: 1, ior: 1.33, envMapIntensity: 1.5 },
  { id: 'energy', name: 'ENERGY', color: 0xc8ff45, metalness: 0, roughness: 0, emissive: 0xc8ff45, emissiveIntensity: 1.5, clearcoat: 0, transmission: 0, envMapIntensity: 0.5 },
];

function MaterialLabContent() {
  const [currentMaterial] = useState('chrome');

  const currentMatConfig = MATERIALS.find(m => m.id === currentMaterial) || MATERIALS[0];

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.5, 12);
    const pos = geo.attributes.position;
    const displacement = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      displacement[i] = Math.random() * 0.4;
    }
    geo.setAttribute('displacement', new THREE.BufferAttribute(displacement, 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    const config = currentMatConfig;
    const mat = new THREE.MeshPhysicalMaterial({
      color: config.color,
      metalness: config.metalness,
      roughness: config.roughness,
      clearcoat: config.clearcoat,
      clearcoatRoughness: config.clearcoatRoughness,
      transmission: config.transmission,
      thickness: config.thickness,
      ior: config.ior,
      emissive: config.emissive ? new THREE.Color(config.emissive) : undefined,
      emissiveIntensity: config.emissiveIntensity,
      envMapIntensity: config.envMapIntensity,
    });
    return mat;
  }, [currentMaterial]);

  const envMap = useMemo(() => {
    const pmremGenerator = new THREE.PMREMGenerator(undefined as any);
    const scene = new THREE.Scene();
    const colors = ['#c8ff45', '#00d4aa', '#ffffff'];
    colors.forEach((color, i) => {
      const light = new THREE.PointLight(color, 2, 20);
      light.position.set(
        Math.cos(i * 2.09) * 8,
        Math.sin(i * 1.5) * 5,
        Math.sin(i * 2.09) * 8
      );
      scene.add(light);
    });
    const hdr = pmremGenerator.fromScene(scene);
    pmremGenerator.dispose();
    return hdr.texture;
  }, []);

  return (
    <group>
      <EnvironmentMap envMap={envMap} />

      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={3} color="#ffffff" castShadow />
      <pointLight position={[0, 5, 5]} intensity={2} color="#c8ff45" decay={2} distance={15} />

      <mesh geometry={geometry} material={material} castShadow receiveShadow rotation={[0, 0, 0]} />

      <primitive
        object={new THREE.Mesh(
          new THREE.PlaneGeometry(50, 50),
          new THREE.ShadowMaterial({ opacity: 0.15 })
        )}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.5, 0]}
        receiveShadow
      />

      <mesh position={[-3, 1, 0]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="#c8ff45" emissive="#c8ff45" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function MaterialLabScene() {
  const [currentMaterial, setCurrentMaterial] = useState('chrome');
  const [rotationSpeed] = useState(0.5);
  const [surfaceIntensity] = useState(1);
  const [roughness] = useState(0.05);
  const [metalness] = useState(1);
  const [paused, setPaused] = useState(false);

  return (
    <section id="materials" className="relative min-h-screen bg-[var(--surface)]">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          shadows
        >
          <color attach="background" args={['#08090B']} />
          <MaterialLabContent />
        </Canvas>
      </div>

      <div className="section-content">
        <SectionHeading
          label="SECTION 02"
          title="MATTER\nIN MOTION."
          subtitle="Three distinct material states. Each responds to light, physics, and your control in fundamentally different ways."
        />

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1440px] mx-auto px-6">
          <div className="lg:col-span-2">
            <div className="relative aspect-square min-h-[500px] rounded-2xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border)',
            }}>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                style={{ width: '100%', height: '100%', display: 'block' }}
                shadows
              >
                <color attach="background" args={['#08090B']} />
                <MaterialLabContent />
              </Canvas>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
            }}>
              <SectionHeading
                label="CONTROLS"
                title="MATERIAL\nPARAMETERS"
              />

              <div className="space-y-6 mt-6">
                <SelectControl
                  label="MATERIAL MODE"
                  value={currentMaterial}
                  options={MATERIALS.map(m => ({ value: m.id, label: m.name }))}
                  onChange={setCurrentMaterial}
                />

                <ParameterSlider
                  label="ROTATION SPEED"
                  value={rotationSpeed}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={() => {}}
                />

                <ParameterSlider
                  label="SURFACE INTENSITY"
                  value={surfaceIntensity}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={() => {}}
                />

                <ParameterSlider
                  label="ROUGHNESS"
                  value={roughness}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={() => {}}
                />

                <ParameterSlider
                  label="METALNESS"
                  value={metalness}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={() => {}}
                />

                <ToggleControl
                  label="PAUSE ANIMATION"
                  checked={paused}
                  onChange={setPaused}
                  description="Freeze all object motion"
                />

                <div className="flex gap-3 pt-4">
                  <button
                    className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 flex-1"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 12a9 9 0 1 0 9-9.975L3 12z" />
                      <path d="M3 12h6v6" />
                    </svg>
                    <span className="overline">RESET CAMERA</span>
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 flex-1"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
                      border: 'none',
                      color: 'var(--bg)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <span className="overline">FULLSCREEN</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl mt-6" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
            }}>
              <SectionHeading
                label="LIVE STATUS"
                title="REALTIME\nFEEDBACK"
              />
              <div className="grid gap-3 mt-6">
                <StatusIndicator label="CURRENT MODE" value={MATERIALS.find(m => m.id === currentMaterial)?.name || 'CHROME'} status="active" />
                <StatusIndicator label="ROTATION" value={rotationSpeed.toFixed(2)} status="normal" />
                <StatusIndicator label="INTENSITY" value={(surfaceIntensity * 100).toFixed(0) + '%'} status="normal" />
                <StatusIndicator label="ROUGHNESS" value={roughness.toFixed(2)} status="normal" />
                <StatusIndicator label="METALNESS" value={metalness.toFixed(2)} status="normal" />
                <StatusIndicator label="ANIMATION" value={paused ? 'PAUSED' : 'RUNNING'} status={paused ? 'warning' : 'active'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}