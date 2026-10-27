import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { useReducedMotion } from '../hooks';
import { ToggleControl, StatusIndicator, ResetButton } from '../components/UIComponents';
import { seededRandom } from '../utils/geometry';

const MAX_POINTS = 5000;

function GravityContent() {
  const { deviceTier, reducedMotion } = useScene();
  const prefersReduced = useReducedMotion();
  const _isReduced = reducedMotion || prefersReduced;

  const [forceRadius] = useState(2);
  const [forceStrength] = useState(0.5);
  const [paused] = useState(false);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);

  const count = deviceTier === 'high' ? MAX_POINTS : deviceTier === 'medium' ? 2000 : 500;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const rand = seededRandom(100);

    for (let i = 0; i < count; i++) {
      const r = rand() * 5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      const hue = rand() * 60 + 80;
      const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      size: 1,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return mat;
  }, []);

  useFrame((_state) => {
    if (paused || _isReduced) return;

    const pos = geometry.attributes.position;
    const vel = geometry.attributes.velocity;
    const mouse = new THREE.Vector2(
      (mousePos[0] / window.innerWidth) * 2 - 1,
      -(mousePos[1] / window.innerHeight) * 2 + 1
    );

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      let vx = vel.getX(i);
      let vy = vel.getY(i);
      let vz = vel.getZ(i);

      const mx = mouse.x * 5;
      const my = mouse.y * 5;

      const dx = mx - x;
      const dy = my - y;
      const dz = -z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < forceRadius * 3 && dist > 0.1) {
        const force = forceStrength * 0.05 / (dist * dist);
        vx += dx * force;
        vy += dy * force;
        vz += -z * force;
      }

      vx *= 0.99;
      vy *= 0.99;
      vz *= 0.99;

      const newX = x + vx;
      const newY = y + vy;
      const newZ = z + vz;

      if (Math.abs(newX) > 10 || Math.abs(newY) > 10 || Math.abs(newZ) > 10) {
        pos.setX(i, (Math.random() - 0.5) * 10);
        pos.setY(i, (Math.random() - 0.5) * 10);
        pos.setZ(i, (Math.random() - 0.5) * 10);
        vel.setX(i, 0);
        vel.setY(i, 0);
        vel.setZ(i, 0);
      } else {
        pos.setX(i, newX);
        pos.setY(i, newY);
        pos.setZ(i, newZ);
        vel.setX(i, vx);
        vel.setY(i, vy);
        vel.setZ(i, vz);
      }
    }

    pos.needsUpdate = true;
    vel.needsUpdate = true;
  });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos([e.clientX, e.clientY]);
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
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

  return (
    <group>
      <EnvironmentMap envMap={envMap} />
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={2} color="#ffffff" />
      <points geometry={geometry} material={material} />
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function GravityScene() {
  const { deviceTier } = useScene();

  const [paused, setPaused] = useState(false);

  const handleReset = () => {
    setPaused(false);
  };

  return (
    <div className="relative min-h-[400px] rounded-2xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid var(--border)',
    }}>
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <span className="overline mb-1 block">FIELD / INTERACTION</span>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>GRAVITY FIELD</h3>
          </div>
          <div className="flex items-center gap-2">
            <ToggleControl
              label="PAUSE"
              checked={paused}
              onChange={setPaused}
            />
            <ResetButton onClick={handleReset} label="RESET" />
          </div>
        </div>

        <div className="relative h-full">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 50 }}
            style={{ width: '100%', height: '100%', display: 'block' }}
            shadows
          >
            <color attach="background" args={['#08090B']} />
            <GravityContent />
          </Canvas>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4">
            <StatusIndicator label="POINTS" value={deviceTier === 'high' ? '5000' : deviceTier === 'medium' ? '2000' : '500'} status="normal" />
            <StatusIndicator label="STATE" value={paused ? 'PAUSED' : 'ACTIVE'} status={paused ? 'warning' : 'active'} />
          </div>
        </div>
      </div>
    </div>
  );
}