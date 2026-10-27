import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScene } from '../context/SceneContext';
import { useReducedMotion } from '../hooks';
import { ToggleControl, StatusIndicator, ResetButton } from '../components/UIComponents';

const REFRACTION_SHADER = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vViewDirection = normalize(cameraPosition - vWorldPosition);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float distortion;
    uniform float ior;
    uniform vec3 color;
    uniform float fresnelPower;
    uniform float chromaticAberration;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;

    float fresnel(vec3 viewDir, vec3 normal, float power) {
      return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
    }

    vec3 refractColor(vec3 viewDir, vec3 normal, float ior) {
      float ratio = 1.0 / ior;
      float cosTheta = -dot(viewDir, normal);
      float sinTheta2 = ratio * ratio * (1.0 - cosTheta * cosTheta);
      if (sinTheta2 > 1.0) return vec3(0.0);
      float cosThetaT = sqrt(1.0 - sinTheta2);
      vec3 refractDir = ratio * viewDir + (ratio * cosTheta - cosThetaT) * normal;
      return normalize(refractDir);
    }

    void main() {
      float f = fresnel(vViewDirection, vNormal, fresnelPower);
      vec3 refractDir = refractColor(vViewDirection, vNormal, ior);
      vec3 envColor = vec3(0.0);
      envColor += color * (1.0 - f) * 0.5;
      envColor += vec3(1.0) * f * 0.8;

      float distortionFactor = distortion * (1.0 + sin(time * 0.5) * 0.5);
      envColor += vec3(sin(vWorldPosition.x * 10.0 + time) * 0.1 * distortionFactor);

      if (chromaticAberration > 0.0) {
        vec3 offset = refractDir * chromaticAberration * 0.01;
        vec3 rColor = vec3(1.0, 0.3, 0.3) * f;
        vec3 bColor = vec3(0.3, 0.5, 1.0) * f;
        envColor += (rColor + bColor) * 0.3;
      }

      gl_FragColor = vec4(envColor, 0.85);
    }
  `,
};

function RefractionContent() {
  const { reducedMotion } = useScene();
  const prefersReduced = useReducedMotion();
  const _isReduced = reducedMotion || prefersReduced;

  const [distortion] = useState(0.5);
  const [ior] = useState(1.5);
  const [fresnelPower] = useState(3);
  const [chromaticAberration] = useState(0);
  const [paused] = useState(false);
  const [autoRotate] = useState(true);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.5, 8), []);
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

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        distortion: { value: distortion },
        ior: { value: ior },
        color: { value: new THREE.Color(0x0a0a0f) },
        fresnelPower: { value: fresnelPower },
        chromaticAberration: { value: chromaticAberration },
      },
      vertexShader: REFRACTION_SHADER.vertexShader,
      fragmentShader: REFRACTION_SHADER.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
    return mat;
  }, [distortion, ior, fresnelPower, chromaticAberration]);

  useFrame((state) => {
    if (paused || _isReduced) return;
    material.uniforms.time.value = state.clock.getElapsedTime();
    if (autoRotate) {
      state.scene.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <EnvironmentMap envMap={envMap} />
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, 5]} intensity={2} color="#c8ff45" decay={2} distance={15} />
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

function EnvironmentMap({ envMap }: { envMap: THREE.Texture }) {
  return <primitive object={envMap} />;
}

export function RefractionScene() {
  const [paused, setPaused] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const handleReset = () => {
    setPaused(false);
    setAutoRotate(true);
  };

  return (
    <div className="relative min-h-[400px] rounded-2xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid var(--border)',
    }}>
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <span className="overline mb-1 block">LIGHT / REFRACTION</span>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>REFRACTIVE OBJECT</h3>
          </div>
          <div className="flex items-center gap-2">
            <ToggleControl
              label="PAUSE"
              checked={paused}
              onChange={setPaused}
            />
            <ToggleControl
              label="AUTO ROTATE"
              checked={autoRotate}
              onChange={setAutoRotate}
            />
            <ResetButton onClick={handleReset} label="RESET" />
          </div>
        </div>

        <div className="relative h-full">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <color attach="background" args={['#08090B']} />
            <RefractionContent />
          </Canvas>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4">
            <StatusIndicator label="STATE" value={paused ? 'PAUSED' : 'RENDERING'} status={paused ? 'warning' : 'active'} />
            <StatusIndicator label="AUTO ROTATE" value={autoRotate ? 'ON' : 'OFF'} status={autoRotate ? 'active' : 'normal'} />
          </div>
        </div>
      </div>
    </div>
  );
}