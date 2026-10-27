import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { SectionHeading, ParameterSlider, ToggleControl, SelectControl, StatusIndicator, RandomizeButton, ResetButton } from '../components/UIComponents';
import { seededRandom } from '../utils/geometry';

function ParticlePlaygroundContent() {
  const { deviceTier } = useScene();

  const maxParticles = useMemo(() => {
    if (deviceTier === 'high') return 10000;
    if (deviceTier === 'medium') return 5000;
    return 2000;
  }, [deviceTier]);

  const [particleCount] = useState(Math.min(5000, maxParticles));
  const [force] = useState(0.5);
  const [turbulence] = useState(0.3);
  const [spread] = useState(1);
  const [pointerForce] = useState(true);
  const [paused] = useState(false);

  const [mousePos] = useState<[number, number]>([0, 0]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const alphas = new Float32Array(maxParticles);
    const basePositions = new Float32Array(maxParticles * 3);
    const rand = seededRandom(12345);

    for (let i = 0; i < maxParticles; i++) {
      const r = rand() * spread * 5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      basePositions[i * 3] = positions[i * 3];
      basePositions[i * 3 + 1] = positions[i * 3 + 1];
      basePositions[i * 3 + 2] = positions[i * 3 + 2];

      velocities[i * 3] = (rand() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (rand() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (rand() - 0.5) * 0.01;

      sizes[i] = 0.5 + rand() * 1.5;
      alphas[i] = 0.2 + rand() * 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('basePosition', new THREE.BufferAttribute(basePositions, 3));
    return geo;
  }, [maxParticles, spread]);

  const material = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 1,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      color: 0xc8ff45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
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

  useFrame((_state) => {
    if (paused) return;

    const pos = geometry.attributes.position;
    const vel = geometry.attributes.velocity;
    const base = geometry.attributes.basePosition;
    const count = Math.min(particleCount, maxParticles);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      let vx = vel.getX(i);
      let vy = vel.getY(i);
      let vz = vel.getZ(i);

      const dist = Math.sqrt(x * x + y * y + z * z);
      const forceMag = force * 0.05 / (dist + 0.5);

      vx += -x * forceMag;
      vy += -y * forceMag;
      vz += -z * forceMag;

      vx += (Math.random() - 0.5) * turbulence * 0.02;
      vy += (Math.random() - 0.5) * turbulence * 0.02;
      vz += (Math.random() - 0.5) * turbulence * 0.02;

      if (pointerForce) {
        const mx = mousePos[0] / window.innerWidth * 2 - 1;
        const my = -(mousePos[1] / window.innerHeight) * 2 + 1;
        const distToMouse = Math.sqrt((x - mx * 5) ** 2 + (y - my * 5) ** 2 + z ** 2);
        if (distToMouse < 3) {
          const pullForce = 0.02 / (distToMouse + 0.5);
          vx += (mx * 5 - x) * pullForce;
          vy += (my * 5 - y) * pullForce;
        }
      }

      vx *= 0.98;
      vy *= 0.98;
      vz *= 0.98;

      pos.setX(i, x + vx);
      pos.setY(i, y + vy);
      pos.setZ(i, z + vz);
      vel.setX(i, vx);
      vel.setY(i, vy);
      vel.setZ(i, vz);

      if (pos.getX(i) > 20 || pos.getX(i) < -20 ||
          pos.getY(i) > 20 || pos.getY(i) < -20 ||
          pos.getZ(i) > 20 || pos.getZ(i) < -20) {
        pos.setX(i, base.getX(i));
        pos.setY(i, base.getY(i));
        pos.setZ(i, base.getZ(i));
        vel.setX(i, 0);
        vel.setY(i, 0);
        vel.setZ(i, 0);
      }
    }

    pos.needsUpdate = true;
    vel.needsUpdate = true;
    material.needsUpdate = true;
  });

  return (
    <group>
      <EnvironmentMap envMap={envMap} />
      <points geometry={geometry} material={material} />
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function ParticlePlaygroundScene() {
  const { deviceTier } = useScene();

  const maxParticles = useMemo(() => {
    if (deviceTier === 'high') return 10000;
    if (deviceTier === 'medium') return 5000;
    return 2000;
  }, [deviceTier]);

  const [particleCount, setParticleCount] = useState(Math.min(5000, maxParticles));
  const [force, setForce] = useState(0.5);
  const [turbulence, setTurbulence] = useState(0.3);
  const [spread, setSpread] = useState(1);
  const [colorMode, setColorMode] = useState<'monochrome' | 'spectral' | 'electric'>('electric');
  const [pointerForce, setPointerForce] = useState(true);
  const [paused, setPaused] = useState(false);

  const handleRandomize = () => {
    setForce(Math.random());
    setTurbulence(Math.random());
    setSpread(0.5 + Math.random() * 1.5);
    setColorMode(['monochrome', 'spectral', 'electric'][Math.floor(Math.random() * 3)] as any);
  };

  const handleReset = () => {
    setParticleCount(Math.min(5000, maxParticles));
    setForce(0.5);
    setTurbulence(0.3);
    setSpread(1);
    setColorMode('electric');
    setPointerForce(true);
    setPaused(false);
  };

  return (
    <section id="playground" className="relative min-h-screen bg-[var(--surface)]">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <color attach="background" args={['#08090B']} />
          <ParticlePlaygroundContent />
        </Canvas>
      </div>

      <div className="section-content">
        <SectionHeading
          label="SECTION 04"
          title="CONTROL\nTHE CHAOS."
          subtitle="A generative particle system with real-time parameter control. Every slider affects the live simulation."
        />

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1440px] mx-auto px-6">
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] min-h-[500px] rounded-2xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border)',
            }}>
              <Canvas
                camera={{ position: [0, 0, 8], fov: 50 }}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <color attach="background" args={['#08090B']} />
                <ParticlePlaygroundContent />
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
                title="PARTICLE\nPARAMETERS"
              />

              <div className="space-y-6 mt-6">
                <ParameterSlider
                  label="PARTICLE COUNT"
                  value={particleCount}
                  min={100}
                  max={maxParticles}
                  step={100}
                  onChange={setParticleCount}
                />

                <ParameterSlider
                  label="FORCE"
                  value={force}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={setForce}
                />

                <ParameterSlider
                  label="TURBULENCE"
                  value={turbulence}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setTurbulence}
                />

                <ParameterSlider
                  label="SPREAD"
                  value={spread}
                  min={0.2}
                  max={3}
                  step={0.05}
                  onChange={setSpread}
                />

                <SelectControl
                  label="COLOR MODE"
                  value={colorMode}
                  options={[
                    { value: 'monochrome', label: 'MONOCHROME' },
                    { value: 'spectral', label: 'SPECTRAL' },
                    { value: 'electric', label: 'ELECTRIC LIME' },
                  ]}
                  onChange={(v: string) => setColorMode(v as any)}
                />

                <ToggleControl
                  label="POINTER FORCE"
                  checked={pointerForce}
                  onChange={setPointerForce}
                  description="Particles respond to cursor position"
                />

                <ToggleControl
                  label="PAUSE SIMULATION"
                  checked={paused}
                  onChange={setPaused}
                />

                <div className="flex gap-3 pt-4">
                  <RandomizeButton onClick={handleRandomize} />
                  <ResetButton onClick={handleReset} />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl mt-6" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
            }}>
              <SectionHeading
                label="LIVE STATUS"
                title="SYSTEM\nMETRICS"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <StatusIndicator label="PARTICLES" value={particleCount.toLocaleString()} status="normal" />
                <StatusIndicator label="FORCE" value={force.toFixed(2)} status="normal" />
                <StatusIndicator label="TURBULENCE" value={turbulence.toFixed(2)} status="normal" />
                <StatusIndicator label="SPREAD" value={spread.toFixed(2)} status="normal" />
                <StatusIndicator label="COLOR MODE" value={colorMode.toUpperCase()} status="active" />
                <StatusIndicator label="POINTER FORCE" value={pointerForce ? 'ON' : 'OFF'} status={pointerForce ? 'active' : 'normal'} />
                <StatusIndicator label="STATE" value={paused ? 'PAUSED' : 'RUNNING'} status={paused ? 'warning' : 'active'} />
                <StatusIndicator label="DEVICE TIER" value={deviceTier.toUpperCase()} status={deviceTier === 'high' ? 'active' : deviceTier === 'medium' ? 'normal' : 'warning'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}