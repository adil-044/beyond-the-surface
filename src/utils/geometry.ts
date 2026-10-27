import * as THREE from 'three';

export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(48271, s) >>> 0;
    return (s - 1) / 2147483646;
  };
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function smoothstep2(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (6 * t - 15) + 10);
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

export function randomInRange(min: number, max: number, rand: () => number): number {
  return min + rand() * (max - min);
}

export function randomOnSphere(radius: number, rand: () => number): THREE.Vector3 {
  const u = rand();
  const v = rand();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function randomInSphere(radius: number, rand: () => number): THREE.Vector3 {
  const u = rand();
  const v = rand();
  const w = rand();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(w);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function generateSimplexNoise2D(width: number, height: number, scale: number, rand: () => number): Float32Array {
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width * scale;
      const ny = y / height * scale;
      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;
      for (let i = 0; i < 4; i++) {
        const sampleX = nx * frequency;
        const sampleY = ny * frequency;
        const perlin = noise2D(sampleX, sampleY, rand);
        value += perlin * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      data[y * width + x] = value / maxValue;
    }
  }
  return data;
}

function noise2D(x: number, y: number, _rand: () => number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const n00 = hashNoise(xi, yi);
  const n10 = hashNoise(xi + 1, yi);
  const n01 = hashNoise(xi, yi + 1);
  const n11 = hashNoise(xi + 1, yi + 1);

  const u = fade(xf);
  const v = fade(yf);

  const nx0 = lerp(n00, n10, u);
  const nx1 = lerp(n01, n11, u);
  return lerp(nx0, nx1, v);
}

function hashNoise(x: number, y: number): number {
  const seed = (x * 374761393 + y * 668265263) >>> 0;
  const r = seededRandom(seed);
  return r() * 2 - 1;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}