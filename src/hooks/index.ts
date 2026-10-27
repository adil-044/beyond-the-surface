import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.max(0, Math.min(1, progress)));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return progress;
}

export function useSectionProgress(sectionId: string): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionTop = rect.top;
      const sectionHeight = rect.height;

      if (sectionTop >= windowHeight || sectionTop + sectionHeight <= 0) {
        setProgress(sectionTop >= windowHeight ? 0 : 1);
        return;
      }

      const visibleHeight = Math.min(windowHeight, sectionTop + sectionHeight) - Math.max(0, sectionTop);
      const progress = visibleHeight / (sectionHeight + windowHeight);
      setProgress(Math.max(0, Math.min(1, progress * 2)));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [sectionId]);

  return progress;
}

export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    if (!elementRef.current || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        ...options,
      }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return entry;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

export function useDeviceCapabilities(): {
  tier: 'high' | 'medium' | 'low';
  isMobile: boolean;
  pixelRatio: number;
  maxParticles: number;
} {
  const [caps, setCaps] = useState({
    tier: 'high' as 'high' | 'medium' | 'low',
    isMobile: false,
    pixelRatio: 1,
    maxParticles: 50000,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCaps = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as any).deviceMemory || 4;
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      let tier: 'high' | 'medium' | 'low';
      if (isMobile || hardwareConcurrency <= 4 || deviceMemory <= 4) {
        tier = 'low';
      } else if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
        tier = 'high';
      } else {
        tier = 'medium';
      }

      let maxParticles = 50000;
      if (tier === 'low') maxParticles = 3000;
      else if (tier === 'medium') maxParticles = 15000;

      setCaps({ tier, isMobile, pixelRatio, maxParticles });
    };

    updateCaps();
    window.addEventListener('resize', updateCaps, { passive: true });
    return () => window.removeEventListener('resize', updateCaps);
  }, []);

  return caps;
}