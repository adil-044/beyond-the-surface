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
    if (this.state.failed) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="scene-fallback"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            margin: '0 auto',
            maxWidth: 720,
          }}
        >
          <div>
            <div className="overline" style={{ color: 'var(--accent)' }}>SIGNAL LOST</div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)', maxWidth: 480 }}>
              This scene needs GPU rendering and it’s unavailable here. The rest of the experience remains — scroll on.
            </p>
          </div>
        </div>
      );
    }
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