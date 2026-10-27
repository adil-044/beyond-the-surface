import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Error boundary with one retry: three's renderer init has a cold-start race
 * (blank page) — transient mount crash must not stick. Retry once after a beat.
 */
class SceneBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean; retries: number }> {
  state = { failed: false, retries: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[SceneBoundary] scene crashed, keeping page alive:', error);
  }

  componentDidUpdate() {
    if (this.state.failed && this.state.retries < 1) {
      const retries = this.state.retries + 1;
      window.setTimeout(() => this.setState({ failed: false, retries }), 600);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

/**
 * Lazy-mount: canvas (WebGL context + shader compile) only starts when the
 * section approaches the viewport. Mounting 10+ R3F canvases in one frame
 * races three's renderer init (blank page) and murders mobile perf.
 * `immediate` renders without waiting for the intersection (hero).
 */
export function SceneMount({
  children,
  immediate = false,
  fallback,
  rootMargin = '400px',
}: {
  children: ReactNode;
  immediate?: boolean;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [immediate, rootMargin]);

  return (
    <div ref={ref} className="scene-mount" style={{ minHeight: 'inherit' }}>
      <SceneBoundary fallback={fallback}>{active ? children : null}</SceneBoundary>
    </div>
  );
}