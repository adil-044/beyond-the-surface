import { createContext, useContext, useRef, useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { PerformanceMonitor, ResourceTracker, getDeviceTier, getOptimalPixelRatio } from '../utils/performance';

interface SceneContextValue {
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null;
  performance: PerformanceMonitor | null;
  resources: ResourceTracker;
  deviceTier: 'high' | 'medium' | 'low';
  pixelRatio: number;
  reducedMotion: boolean;
  isMobile: boolean;
  registerScene: (id: string, scene: THREE.Scene) => void;
  unregisterScene: (id: string) => void;
  getScene: (id: string) => THREE.Scene | undefined;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}

interface SceneProviderProps {
  children: ReactNode;
  reducedMotion?: boolean;
}

export function SceneProvider({ children, reducedMotion = false }: SceneProviderProps) {
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [scene] = useState(() => new THREE.Scene());
  const [performance, setPerformance] = useState<PerformanceMonitor | null>(null);
  const [resources] = useState(() => new ResourceTracker());
  const [deviceTier] = useState(() => getDeviceTier());
  const [pixelRatio] = useState(() => getOptimalPixelRatio());
  const scenesRef = useRef<Map<string, THREE.Scene>>(new Map());
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const registerScene = (id: string, sceneInstance: THREE.Scene) => {
    scenesRef.current.set(id, sceneInstance);
  };

  const unregisterScene = (id: string) => {
    scenesRef.current.delete(id);
  };

  const getScene = (id: string) => scenesRef.current.get(id);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gl = canvasRef.current.getContext('webgl2', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    }) as WebGL2RenderingContext;

    if (!gl) return;

    const threeRenderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      context: gl,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      logarithmicDepthBuffer: true,
    });

    threeRenderer.setPixelRatio(Math.min(pixelRatio, 2));
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.outputColorSpace = THREE.SRGBColorSpace;
    threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    threeRenderer.toneMappingExposure = 1;
    threeRenderer.shadowMap.enabled = true;
    threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const threeCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    threeCamera.position.set(0, 0, 5);

    const perfMonitor = new PerformanceMonitor(threeRenderer);

    setRenderer(threeRenderer);
    setCamera(threeCamera);
    setPerformance(perfMonitor);

    perfMonitor.start();

    const handleResize = () => {
      threeRenderer.setSize(window.innerWidth, window.innerHeight);
      threeCamera.aspect = window.innerWidth / window.innerHeight;
      threeCamera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      perfMonitor.stop();
      threeRenderer.dispose();
      resources.disposeAll();
    };
  }, [pixelRatio]);

  return (
    <SceneContext.Provider
      value={{
        renderer,
        camera,
        scene,
        performance,
        resources,
        deviceTier,
        pixelRatio,
        reducedMotion: reducedMotionRef.current,
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        registerScene,
        unregisterScene,
        getScene,
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {children}
    </SceneContext.Provider>
  );
}