export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private frameCount = 0;
  private fps = 60;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private animationId: number | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  constructor(renderer?: THREE.WebGLRenderer) {
    this.renderer = renderer || null;
  }

  setRenderer(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }

  beginFrame() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    if (delta > 0) {
      const currentFps = 1000 / delta;
      this.frames.push(currentFps);
      if (this.frames.length > 60) this.frames.shift();
      this.fps = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    }
    this.frameCount++;
  }

  getFPS(): number {
    return this.fps;
  }

  getFrameTime(): number {
    return this.fps > 0 ? 1000 / this.fps : 0;
  }

  getMetrics(): PerformanceMetrics {
    let drawCalls = 0;
    let triangles = 0;
    let geometries = 0;
    let textures = 0;

    if (this.renderer) {
      const info = this.renderer.info;
      drawCalls = info.render.calls;
      triangles = info.render.triangles;
      geometries = info.memory.geometries;
      textures = info.memory.textures;
    }

    const memory = (performance as any).memory
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
      : 0;

    return {
      fps: this.fps,
      frameTime: this.getFrameTime(),
      memory,
      drawCalls,
      triangles,
      geometries,
      textures,
    };
  }

  onUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
  }

  start() {
    if (this.animationId) return;
    const tick = () => {
      this.beginFrame();
      const metrics = this.getMetrics();
      this.callbacks.forEach(cb => cb(metrics));
      this.animationId = requestAnimationFrame(tick);
    };
    this.animationId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

export function getDeviceTier(): 'high' | 'medium' | 'low' {
  if (typeof navigator === 'undefined') return 'high';

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (isMobile || hardwareConcurrency <= 4 || deviceMemory <= 4) {
    return 'low';
  }
  if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
    return 'high';
  }
  return 'medium';
}

export function getOptimalPixelRatio(max: number = 2): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(dpr, max);
}

export function estimateParticleBudget(tier: 'high' | 'medium' | 'low'): number {
  switch (tier) {
    case 'high': return 50000;
    case 'medium': return 15000;
    case 'low': return 3000;
  }
}

export function shouldReduceEffects(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export class ResourceTracker {
  private geometries = new Set<THREE.BufferGeometry>();
  private materials = new Set<THREE.Material>();
  private textures = new Set<THREE.Texture>();

  trackGeometry(geometry: THREE.BufferGeometry) {
    this.geometries.add(geometry);
  }

  trackMaterial(material: THREE.Material) {
    this.materials.add(material);
  }

  trackTexture(texture: THREE.Texture) {
    this.textures.add(texture);
  }

  untrackGeometry(geometry: THREE.BufferGeometry) {
    this.geometries.delete(geometry);
  }

  untrackMaterial(material: THREE.Material) {
    this.materials.delete(material);
  }

  untrackTexture(texture: THREE.Texture) {
    this.textures.delete(texture);
  }

  disposeAll() {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    this.textures.forEach(t => t.dispose());
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }

  getCounts() {
    return {
      geometries: this.geometries.size,
      materials: this.materials.size,
      textures: this.textures.size,
    };
  }
}

import * as THREE from 'three';