import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { useReducedMotion } from '../hooks';
import { ParameterSlider, ToggleControl, StatusIndicator, ResetButton, SelectControl } from '../components/UIComponents';

function KineticContent() {
  const { reducedMotion } = useScene();
  const prefersReduced = useReducedMotion();
  const _isReduced = reducedMotion || prefersReduced;

  const [speed] = useState(1);
  const [paused] = useState(false);

  const geometries = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) {
      geos.push(new THREE.TorusKnotGeometry(1.5 + i * 0.5, 0.3 + i * 0.1, 100, 16));
    }
    return geos;
  }, []);

  const materials = useMemo(() => {
    const mats: THREE.MeshPhysicalMaterial[] = [];
    for (let i = 0; i < 3; i++) {
      mats.push(new THREE.MeshPhysicalMaterial({
        color: i === 0 ? 0xc8ff45 : i === 1 ? 0x00d4aa : 0xff4444,
        metalness: 0.8,
        roughness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5,
        emissive: i === 2 ? new THREE.Color(0xff4444) : undefined,
        emissiveIntensity: i === 2 ? 0.5 : 0,
      }));
    }
    return mats;
  }, []);

  const phases = useMemo(() => {
    const phases: Array<{
      rotation: THREE.Euler;
      position: THREE.Vector3;
      scale: number;
    }> = [];
    for (let i = 0; i < 3; i++) {
      phases.push({
        rotation: new THREE.Euler(0, 0, 0),
        position: new THREE.Vector3(
          (i - 1) * 3.5,
          Math.sin(i * 2) * 1.5,
          (i - 1) * 1.5
        ),
        scale: 1,
      });
    }
    return phases;
  }, []);

  useFrame((state) => {
    if (paused || _isReduced) return;

    phases.forEach((phase, i) => {
      const t = state.clock.getElapsedTime() * speed;
      phase.rotation.x = t * (0.5 + i * 0.3);
      phase.rotation.y = t * (0.7 + i * 0.2);
      phase.rotation.z = t * (0.3 + i * 0.4);
      phase.position.y = Math.sin(t * (0.8 + i * 0.3)) * 1.5;
      phase.scale = 1 + Math.sin(t * 0.5 + i) * 0.1;
    });
  });

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

  const meshes = geometries.map((geo, i) => (
    <mesh
      key={i}
      geometry={geo}
      material={materials[i]}
      position={phases[i].position}
      rotation={phases[i].rotation}
      scale={phases[i].scale}
      castShadow
      receiveShadow
    />
  ));

  return (
    <group>
      <EnvironmentMap envMap={envMap} />
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={2.5} color="#ffffff" castShadow />
      <pointLight position={[0, 5, 5]} intensity={2} color="#c8ff45" decay={2} distance={20} />
      {meshes}
      <primitive
        object={new THREE.Mesh(
          new THREE.PlaneGeometry(50, 50),
          new THREE.ShadowMaterial({ opacity: 0.1 })
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

export function KineticScene() {
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [_complexity] = useState(3);
  const [colorScheme, setColorScheme] = useState<'mono' | 'duo' | 'full'>('duo');

  const handleReset = () => {
    setSpeed(1);
    setPaused(false);
    setColorScheme('duo');
  };

  return (
    <div className="relative min-h-[400px] rounded-2xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid var(--border)',
    }}>
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <span className="overline mb-1 block">TIME / SEQUENCING</span>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>KINETIC GEOMETRY</h3>
          </div>
          <div className="flex items-center gap-2">
            <ToggleControl
              label="PAUSE"
              checked={paused}
              onChange={setPaused}
            />
            <ToggleControl
              label="AUTO ANIMATE"
              checked={true}
              onChange={() => {}}
            />
            <ResetButton onClick={handleReset} label="RESET" />
          </div>
        </div>

        <div className="relative h-full">
          <Canvas
            camera={{ position: [0, 2, 8], fov: 50 }}
            style={{ width: '100%', height: '100%', display: 'block' }}
            shadows
          >
            <color attach="background" args={['#08090B']} />
            <KineticContent />
          </Canvas>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4">
            <ParameterSlider
              label="ANIMATION SPEED"
              value={speed}
              min={0}
              max={3}
              step={0.1}
              onChange={setSpeed}
            />
            <SelectControl
              label="COLOR SCHEME"
              value={colorScheme}
              options={[
                { value: 'mono', label: 'MONOCHROME' },
                { value: 'duo', label: 'DUOTONE' },
                { value: 'full', label: 'FULL SPECTRUM' },
              ]}
              onChange={(v: string) => setColorScheme(v as any)}
            />
            <StatusIndicator label="STATE" value={paused ? 'PAUSED' : 'RUNNING'} status={paused ? 'warning' : 'active'} />
            <StatusIndicator label="SPEED" value={speed.toFixed(1)} status="normal" />
          </div>
        </div>
      </div>
    </div>
  );
}