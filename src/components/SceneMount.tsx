import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { WEBGL_OK } from '../utils/support';

/** Designed static stand-in when WebGL is unavailable — never a hollow collapse. */
export function StaticScene({ index, title, note }: { index: string; title: string; note: string }) {
  return (
    <div
      className="static-scene relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-elevated)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 40%, rgba(200,255,69,0.07) 0%, transparent 70%), radial-gradient(50% 40% at 80% 90%, rgba(0,229,208,0.05) 0%, transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="relative z-10 text-center px-6">
        <div className="overline mb-4" style={{ color: 'var(--accent)' }}>NO. {index} — STATIC RENDER</div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>{note}</p>
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ border: '1px solid var(--border)' }}>
          <span className="overline">WEBGL OFF — 2D MODE</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary with one retry: three's renderer init has a cold-start race
 * (blank page) — a transient mount crash must not stick. Retries once after a beat.
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
              This scene needs GPU rendering and it’s unavailable right now. The rest of the experience remains — scroll on.
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
 * No WebGL on this device / staticTitle set → renders StaticScene instead.
 */
export function SceneMount({
  children,
  immediate = false,
  fallback,
  rootMargin = '400px',
  staticLabel,
  staticTitle,
  staticNote,
}: {
  children: ReactNode;
  immediate?: boolean;
  fallback?: ReactNode;
  rootMargin?: string;
  staticLabel?: string;
  staticTitle?: string;
  staticNote?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(immediate);
  const needsWebGL = useMemo(() => WEBGL_OK, []);

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

  // No WebGL at all → designed static scene immediately, never try canvases.
  if (!needsWebGL && staticTitle) {
    return (
      <div ref={ref} className="scene-mount" style={{ minHeight: 'inherit' }}>
        <StaticScene index={staticLabel ?? '00'} title={staticTitle} note={staticNote ?? ''} />
      </div>
    );
  }

  return (
    <div ref={ref} className="scene-mount" style={{ minHeight: 'inherit' }}>
      <SceneBoundary fallback={fallback}>{active ? children : null}</SceneBoundary>
    </div>
  );
}